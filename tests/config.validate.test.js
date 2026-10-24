// Doğrulayıcı: geçerli girdi, her hata/uyarı kodu, sınır değerleri, lenient onarım, hata biçimi.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validate, validateLenient, formatIssue, describePath } from "../js/config/validate.js";
import { CONFIG_SCHEMA_VERSION } from "../js/config/schema.js";

const base = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));
const run = (fn, opts) => { const c = clone(base); fn(c); return validate(c, opts); };
const codes = (r) => r.errors.map((e) => e.code);
const has = (r, code, path) => r.errors.concat(r.warnings).some((e) => e.code === code && (path === undefined || e.path === path));

test("varsayılan konfigürasyon: hata yok, uyarı yok, sanitized döner", () => {
  const r = validate(base);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.sanitized.meta.schemaVersion, CONFIG_SCHEMA_VERSION);
});

test("hata nesnesi biçimi (docs §4.2): severity, code, path, message, value, expect", () => {
  const r = run((c) => { c.levels.cave.goal = 0; c.levels.cave.objective = "crystal"; });
  const e = r.errors.find((x) => x.path === "/levels/cave/goal");
  assert.ok(e, "goal hatası");
  assert.equal(e.severity, "error");
  assert.equal(e.code, "E_RANGE");
  assert.equal(e.value, 0);
  assert.match(e.expect, /int/);
  assert.match(e.message, /goal 0 geçersiz|Hedef sayısı 0 geçersiz/);
  assert.match(formatIssue(e, base), /^\[HATA\] Bölümler › Yarasa Mağarası › Hedef sayısı = 0 → .*\(E_RANGE, \/levels\/cave\/goal\)$/);
});

test("describePath: kimlikler adlarına çevrilir", () => {
  assert.equal(describePath("/levels/cave/intro/0/text", base), "Bölümler › Yarasa Mağarası › Giriş anlatısı › #1 › Metin");
  assert.equal(describePath("/enemies/ghost/hp", base), "Düşmanlar › Ruh › Can");
});

test("E_REQUIRED, E_TYPE, E_RANGE, E_ENUM, E_FORMAT, E_LENGTH, E_REF", () => {
  assert.ok(has(run((c) => { delete c.enemies.ghost.hp; }), "E_REQUIRED", "/enemies/ghost/hp"));
  assert.ok(has(run((c) => { c.enemies.ghost.hp = "çok"; }), "E_TYPE", "/enemies/ghost/hp"));
  assert.ok(has(run((c) => { c.enemies.ghost.hp = 501; }), "E_RANGE", "/enemies/ghost/hp"));
  assert.ok(has(run((c) => { c.enemies.ghost.ai = "uçan"; }), "E_ENUM", "/enemies/ghost/ai"));
  assert.ok(has(run((c) => { c.enemies.ghost.color = "red"; }), "E_FORMAT", "/enemies/ghost/color"));
  assert.ok(has(run((c) => { c.enemies.ghost.name = ""; }), "E_LENGTH", "/enemies/ghost/name"));
  assert.ok(has(run((c) => { c.levels.cave.theme = "yok"; }), "E_REF", "/levels/cave/theme"));
  assert.ok(has(run((c) => { c.levels.cave.start = { hayalet: 2 }; }), "E_REF", "/levels/cave/start/hayalet"));
  assert.ok(has(run((c) => { c.levels.cave.intro[0].speaker = "kimse"; }), "E_REF"));
});

test("sınır değerleri: kabul / ret", () => {
  assert.equal(run((c) => { c.enemies.ghost.hp = 0.5; }).ok, true);
  assert.equal(run((c) => { c.enemies.ghost.hp = 500; }).ok, true);
  assert.equal(run((c) => { c.enemies.ghost.hp = 0.49; }).ok, false);
  assert.equal(run((c) => { c.levels.forest.time = 15; }).ok, true);
  assert.equal(run((c) => { c.levels.forest.time = 14; }).ok, false);
  assert.equal(run((c) => { c.levels.forest.time = 300.5; }).ok, false, "int olmalı");
  assert.equal(run((c) => { c.game.startHp = 10; c.game.maxHpCap = 12; }).ok, true);
  assert.equal(run((c) => { c.game.startHp = 11; }).ok, false);
});

test("hedefe göre goal aralığı; totem / miniboss / boss ön koşulları", () => {
  assert.ok(has(run((c) => { c.levels.forest.goal = 61; }), "E_RANGE", "/levels/forest/goal"));
  assert.ok(has(run((c) => { c.levels.pass.goal = 4; }), "E_RANGE", "/levels/pass/goal"), "survive en az 5");
  assert.ok(has(run((c) => { c.levels.village.goal = 7; }), "E_RANGE", "/levels/village/goal"));
  assert.ok(has(run((c) => { c.levels.tower.goal = 2; }), "E_RANGE", "/levels/tower/goal"));
  assert.ok(has(run((c) => { c.levels.village.totems = [[0, 0]]; }), "E_REQUIRED", "/levels/village/totems"), "goal 3 iken 1 konum");
  assert.ok(has(run((c) => { delete c.enemies.totem.ai; c.enemies.totem.ai = "chase"; }), "E_REF", "/levels/village/objective"), "ai=static düşman yok");
  assert.ok(has(run((c) => { c.levels.tower.start = { archer: 2 }; }), "E_REF", "/levels/tower/start"), "knight yok");
  assert.ok(has(run((c) => { c.levels.castle.start = { ghost: 1 }; }), "E_REF", "/levels/castle/start"), "boss yok");
});

test("sıra dizileri tam kapsamalı: E_ORDER, E_DUP", () => {
  assert.ok(has(run((c) => { c.weaponOrder.pop(); }), "E_ORDER", "/weaponOrder"));
  assert.ok(has(run((c) => { c.weaponOrder.push("fire"); }), "E_DUP"));
  assert.ok(has(run((c) => { c.campaign.order.pop(); }), "E_ORDER", "/campaign/order"));
  assert.ok(has(run((c) => { c.perkOrder.pop(); }), "E_ORDER", "/perkOrder"));
  assert.ok(has(run((c) => { c.abilityOrder.pop(); }), "E_ORDER", "/abilityOrder"));
});

test("yetenek / silah / perk / düşman kuralları", () => {
  assert.ok(has(run((c) => { c.abilities.ucus = { name: "U", icon: "x", cd: 5, params: {} }; c.abilityOrder.push("ucus"); }), "E_ENUM", "/abilities/ucus"));
  assert.ok(has(run((c) => { c.abilities.blink.params.dist = 99; }), "E_RANGE"));
  assert.ok(has(run((c) => { c.weapons.fire.spread = { n: 3 }; c.weapons.fire.nova = { r: 2, push: 1 }; }), "E_CONFLICT", "/weapons/fire"));
  assert.ok(has(run((c) => { delete c.weapons.fire.speed; }), "E_REQUIRED", "/weapons/fire/speed"));
  assert.ok(has(run((c) => { c.perks.speed.effect = { kind: "mul", stat: "yok", value: 2 }; }), "E_ENUM", "/perks/speed/effect/stat"));
  assert.ok(has(run((c) => { c.perks.speed.effect.value = 5; }), "E_RANGE"));
  assert.ok(has(run((c) => { c.enemies.yeni = { ...c.enemies.ghost }; c.levels.forest.start = { yeni: 1 }; }), "E_ENUM", "/enemies/yeni/model"), "model belirtilmeli");
  assert.equal(run((c) => { c.enemies.yeni = { ...c.enemies.ghost, model: "ghost" }; c.levels.forest.start = { yeni: 1 }; }).ok, true);
  assert.ok(has(run((c) => { c.player.character = "veyis"; }), "E_REF", "/player/character"), "rol player olmalı");
  assert.ok(has(run((c) => { c.game.maxHpCap = 2; }), "E_RANGE", "/game/maxHpCap"));
});

test("kimlik biçimi ve yasak anahtarlar (prototip kirlenmesi)", () => {
  assert.ok(has(run((c) => { c.enemies.Kötü = { ...c.enemies.ghost }; }), "E_FORMAT"));
  assert.ok(has(run((c) => { c.enemies.a = { ...c.enemies.ghost }; }), "E_FORMAT"), "en az 2 karakter");
  const evil = JSON.parse(JSON.stringify(base).replace('"meta":{', '"meta":{"__proto__":{"polluted":true},'));
  const r = validate(evil);
  assert.ok(has(r, "E_FORBIDDEN_KEY"));
  assert.equal({}.polluted, undefined, "Object.prototype kirlenmedi");
  assert.equal(Object.prototype.hasOwnProperty.call(r.sanitized.meta, "__proto__"), false, "sanitized kopyada yok");
  const nested = clone(base); nested.themes.forest.constructor = { x: 1 };
  assert.ok(has(validate(nested), "E_FORBIDDEN_KEY", "/themes/forest/constructor"));
});

test("metin kuralları: yer tutucular yalnız izinli olanlar", () => {
  assert.ok(has(run((c) => { c.strings.objective.crystal = "{hedef} kristal"; }), "E_FORMAT", "/strings/objective/crystal"));
  assert.ok(has(run((c) => { c.levels.forest.intro[0].text = "Merhaba {goal}"; }), "E_FORMAT"), "anlatıda yer tutucu yok");
  assert.equal(run((c) => { c.strings.objective.crystal = "{goal} adet kristal."; }).ok, true);
  assert.ok(has(run((c) => { c.levels.forest.intro[0].text = "x".repeat(241); }), "E_LENGTH"));
});

test("bilinmeyen alan: uyarı, silinmez", () => {
  const r = run((c) => { c.enemies.ghost.yeniAlan = 5; c.gelecek = { a: 1 }; });
  assert.equal(r.ok, true);
  assert.ok(has(r, "W_UNKNOWN_FIELD", "/enemies/ghost/yeniAlan"));
  assert.ok(has(r, "W_UNKNOWN_FIELD", "/gelecek"));
  assert.equal(r.sanitized.enemies.ghost.yeniAlan, 5);
  assert.deepEqual(r.sanitized.gelecek, { a: 1 });
});

test("uyarılar: W_BALANCE, W_UNUSED", () => {
  assert.ok(has(run((c) => { c.levels.forest.cap = 15; }), "W_BALANCE", "/levels/forest/cap"));
  assert.ok(has(run((c) => { c.levels.forest.time = 20; c.levels.forest.goal = 12; }), "W_BALANCE", "/levels/forest/goal"));
  assert.ok(has(run((c) => { c.levels.forest.start = { ghost: 12, bat: 12 }; }), "W_BALANCE", "/levels/forest/start"));
  assert.ok(has(run((c) => { c.levels.cave.reward = "frost"; }), "W_BALANCE"), "aynı ödül iki kez");
  assert.ok(has(run((c) => { c.levels.cave.ability = "shield"; }), "W_BALANCE"));
  assert.ok(has(run((c) => { c.enemies.hayalet = { ...c.enemies.ghost, model: "ghost" }; }), "W_UNUSED", "/enemies/hayalet"));
  assert.ok(has(run((c) => { c.themes.bos = { ...c.themes.forest }; }), "W_UNUSED", "/themes/bos"));
  assert.ok(has(run((c) => { c.levels.castle.objective = "survive"; c.levels.castle.goal = 30; }), "W_BALANCE", "/levels"), "boss bölümü yok");
});

test("kampanya yolları: dallanma ve ulaşılamazlık uyarısı", () => {
  const ids = base.campaign.order;
  const chain = ids.slice(1).map((to, i) => ({ from: ids[i], to }));
  assert.equal(run((c) => { c.campaign.edges = chain; }).warnings.length, 0);
  assert.ok(has(run((c) => { c.campaign.edges = [...chain, { from: ids[0], to: ids[3] }]; }), "W_UNSUPPORTED_BRANCH"));
  assert.ok(has(run((c) => { c.campaign.edges = chain.slice(0, 3); }), "W_UNREACHABLE"));
});

test("E_VERSION: eski ve yeni sürüm", () => {
  const newer = run((c) => { c.meta.schemaVersion = CONFIG_SCHEMA_VERSION + 1; });
  assert.deepEqual(codes(newer), ["E_VERSION"]);
  assert.match(newer.errors[0].message, /daha yeni bir oyun sürümü/);
  assert.ok(has(run((c) => { c.meta.schemaVersion = 0; }), "E_RANGE"), "0 geçersiz sürüm");
  assert.equal(validate(null).errors[0].code, "E_TYPE");
  assert.equal(validate([]).errors[0].code, "E_TYPE");
});

test("sanitize/lenient: onarılabilir sapmalar düzeltilir, onarılamayanlar reddedilir", () => {
  const c = clone(base);
  c.levels.forest.goal = 0; c.enemies.ghost.hp = 9999; c.enemies.ghost.color = "kırmızı"; c.game.perkChoices = 99;
  const strict = validate(c, { mode: "strict" });
  assert.equal(strict.ok, false);
  const l = validateLenient(c);
  assert.equal(l.ok, false, "renk onarılamaz (varsayılanı yok)");
  delete c.enemies.ghost.color; c.enemies.ghost.color = "#c9ffd9";
  const l2 = validateLenient(c);
  assert.equal(l2.ok, true);
  assert.equal(l2.repaired, true);
  assert.equal(l2.config.levels.forest.goal, 1);
  assert.equal(l2.config.enemies.ghost.hp, 500);
  assert.equal(l2.config.game.perkChoices, 5);
  assert.ok(l2.warnings.some((w) => w.repaired && w.code === "E_RANGE"));
  // yapısal bozukluk onarılamaz
  const d = clone(base); d.levels.forest.theme = "yok";
  assert.equal(validateLenient(d).ok, false);
});

test("varsayılanlar uygulanır (game bölümü eksikse bile)", () => {
  const r = run((c) => { delete c.game; delete c.enemies.ghost.score; delete c.player.speedMul; });
  assert.equal(r.ok, true);
  assert.deepEqual(r.sanitized.game, { startHp: 3, maxHpCap: 6, baseSpeed: 8, perkChoices: 3, clearHeal: 1, scoreLevelBonus: 100, scoreTimeMul: 2 });
  assert.equal(r.sanitized.enemies.ghost.score, 0);
  assert.equal(r.sanitized.player.speedMul, 1);
});

test("renkler küçük harfe normalize edilir; girdi değiştirilmez", () => {
  const c = clone(base); c.themes.forest.bg = "#0A0714";
  const frozen = JSON.stringify(c);
  const r = validate(c);
  assert.equal(r.sanitized.themes.forest.bg, "#0a0714");
  assert.equal(JSON.stringify(c), frozen);
});

// ---- görsel yolları (assets/art/*.webp) ----
const ART_OK = "assets/art/portre-aldemir.webp";
test("görsel yolu: geçerli yol kabul edilir (portrait, menuBackground, map.background.image)", () => {
  const r = run((c) => { c.characters.aldemir.portrait = ART_OK; c.game.menuBackground = "assets/art/menu-arkaplan.webp"; c.map.background.image = "assets/art/harita-arkaplan.webp"; });
  assert.equal(r.ok, true);
  assert.equal(r.sanitized.characters.aldemir.portrait, ART_OK);
});
test("görsel yolu: alanlar isteğe bağlı (yoksa hata yok)", () => {
  const r = run((c) => { delete c.characters.aldemir.portrait; delete c.game.menuBackground; delete c.map.background.image; });
  assert.equal(r.ok, true);
});
test("görsel yolu: harici URL, .., data:, javascript:, .png ve alt klasör E_FORMAT ile reddedilir", () => {
  const bad = ["https://evil.example/a.webp", "//evil.example/a.webp", "assets/art/../x.webp", "../assets/art/a.webp", "data:image/webp;base64,AAAA", "javascript:alert(1)", "assets/art/a.png", "assets/art/sub/a.webp", "/assets/art/a.webp", "assets/art/A.webp", "assets/art/a.webp?x=1", "assets/art/a b.webp"];
  for (const v of bad) {
    for (const [name, fn, ptr] of [
      ["portrait", (c) => { c.characters.aldemir.portrait = v; }, "/characters/aldemir/portrait"],
      ["menuBackground", (c) => { c.game.menuBackground = v; }, "/game/menuBackground"],
      ["map.image", (c) => { c.map.background.image = v; }, "/map/background/image"],
    ]) {
      const r = run(fn);
      assert.equal(r.ok, false, `${name}: ${v} reddedilmeli`);
      assert.ok(has(r, "E_FORMAT", ptr), `${name}: ${v} E_FORMAT vermeli`);
    }
  }
});
test("görsel yolu: lenient modda geçersiz yol atılır, oyun açılır", () => {
  const c = clone(base); c.characters.aldemir.portrait = "https://evil.example/a.webp";
  const r = validateLenient(c);
  assert.equal(r.ok, true);
  assert.equal(r.config.characters.aldemir.portrait, undefined);
});
test("varsayılan konfigürasyon: beş karakter portresi, menü ve harita görseli bağlı ve dosyaları var", () => {
  for (const k of ["aldemir", "piril", "veyis", "zerrin", "taskin"]) assert.match(base.characters[k].portrait, /^assets\/art\/portre-[a-z]+\.webp$/);
  assert.ok(base.game.menuBackground && base.map.background.image);
  for (const p of [base.game.menuBackground, base.map.background.image, ...["aldemir", "piril", "veyis", "zerrin", "taskin"].map((k) => base.characters[k].portrait)]) {
    assert.ok(fs.existsSync(new URL("../" + p, import.meta.url)), p + " dosyası var");
  }
});

// ---- ikon / kapak görselleri (image, imageSmall, nodeImage, ui.icons) ----
const ART_FIELDS = [
  ["weapons.fire.image", (c, v) => { c.weapons.fire.image = v; }, "/weapons/fire/image"],
  ["weapons.fire.imageSmall", (c, v) => { c.weapons.fire.imageSmall = v; }, "/weapons/fire/imageSmall"],
  ["abilities.blink.image", (c, v) => { c.abilities.blink.image = v; }, "/abilities/blink/image"],
  ["abilities.blink.imageSmall", (c, v) => { c.abilities.blink.imageSmall = v; }, "/abilities/blink/imageSmall"],
  ["perks.hp.image", (c, v) => { c.perks.hp.image = v; }, "/perks/hp/image"],
  ["enemies.ghost.image", (c, v) => { c.enemies.ghost.image = v; }, "/enemies/ghost/image"],
  ["levels.forest.image", (c, v) => { c.levels.forest.image = v; }, "/levels/forest/image"],
  ["levels.forest.nodeImage", (c, v) => { c.levels.forest.nodeImage = v; }, "/levels/forest/nodeImage"],
  ["ui.icons.hourglass", (c, v) => { c.ui = { icons: { hourglass: v } }; }, "/ui/icons/hourglass"],
  ["ui.icons.heartFull", (c, v) => { c.ui = { icons: { heartFull: v, heartEmpty: "assets/art/ui-kalp-bos.webp" } }; }, "/ui/icons/heartFull"],
];
test("görsel alanları: geçerli yollar (-128 adı dahil) kabul edilir ve korunur", () => {
  for (const [name, set, ptr] of ART_FIELDS) {
    const r = run((c) => set(c, "assets/art/ikon-yetenek-blink-128.webp"));
    assert.equal(r.ok, true, name);
    assert.ok(!has(r, "E_FORMAT", ptr), name);
  }
  const r = run((c) => { c.weapons.fire.image = "assets/art/ikon-buyu-fire.webp"; c.ui = { icons: { camera: "assets/art/ui-kamera.webp" } }; });
  assert.equal(r.sanitized.weapons.fire.image, "assets/art/ikon-buyu-fire.webp");
  assert.equal(r.sanitized.ui.icons.camera, "assets/art/ui-kamera.webp");
});
test("görsel alanları: kötü yollar (harici URL, .., .png, data:) E_FORMAT", () => {
  for (const v of ["https://evil.example/a.webp", "assets/art/../x.webp", "data:image/webp;base64,AAAA", "javascript:alert(1)", "assets/art/a.png", "assets/art/a.webp?x=1"]) {
    for (const [name, set, ptr] of ART_FIELDS) {
      const r = run((c) => set(c, v));
      assert.equal(r.ok, false, `${name}: ${v}`);
      assert.ok(has(r, "E_FORMAT", ptr), `${name}: ${v}`);
    }
  }
});
test("ui.icons: bilinmeyen ikon adı uyarı verir, kalp görseli tek başına uyarılır", () => {
  assert.ok(has(run((c) => { c.ui = { icons: { nope: "assets/art/a.webp" } }; }), "W_UNKNOWN_FIELD", "/ui/icons/nope"));
  assert.ok(has(run((c) => { c.ui = { icons: { heartFull: "assets/art/ui-kalp-dolu.webp" } }; }), "W_ART_PAIR", "/ui/icons/heartEmpty"));
  assert.ok(!has(run((c) => { c.ui = { icons: { heartFull: "assets/art/a.webp", heartEmpty: "assets/art/b.webp" } }; }), "W_ART_PAIR"));
});
test("varsayılan konfigürasyon: 7 büyü ve 3 yetenek görseli bağlı, dosyaları var; perk/düşman/bölüm/ui görselleri boş", () => {
  for (const id of Object.keys(base.weapons)) { assert.equal(base.weapons[id].image, `assets/art/ikon-buyu-${id}.webp`); assert.equal(base.weapons[id].imageSmall, undefined); }
  for (const id of Object.keys(base.abilities)) { assert.equal(base.abilities[id].image, `assets/art/ikon-yetenek-${id}.webp`); assert.equal(base.abilities[id].imageSmall, `assets/art/ikon-yetenek-${id}-128.webp`); }
  const paths = [];
  const walk = (v) => { if (typeof v === "string" && /^assets\/art\//.test(v)) paths.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(base);
  assert.ok(paths.length === 20);
  for (const p of paths) assert.ok(fs.existsSync(new URL("../" + p, import.meta.url)), p + " dosyası var");
  assert.ok(Object.values(base.perks).every((x) => !x.image) && Object.values(base.enemies).every((x) => !x.image));
  assert.ok(Object.values(base.levels).every((x) => !x.image && !x.nodeImage) && !base.ui);
});
