// Yönetim sayfası saf mantığı: fark/yama, koleksiyon işlemleri, kanonik dışa aktarma, Claude paketi, içe aktarma, güvenlik taraması.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyOps } from "../js/config/patch.js";
import { configHash } from "../js/config/hash.js";
import { validate } from "../js/config/validate.js";
import { changeRows, diffOps, getAt, setAt } from "../js/admin/diff.js";
import { addItem, checkNewId, countByTab, duplicateItem, removeItem, routeOf } from "../js/admin/model.js";
import { buildClaudePackage, buildDraft, cleanNotes, exportPatch, formatConfig, readImport, withCode } from "../js/admin/export.js";
import { readDraft, resolveDraft, writeDraft, makeStore } from "../js/config/storage.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(fs.readFileSync(path.join(root, "data/game.config.json"), "utf8"));
const copy = (v) => JSON.parse(JSON.stringify(v));

test("diffOps: değişiklik yok -> boş; yama taban üzerine uygulanınca çalışma kopyasını verir", () => {
  assert.deepEqual(diffOps(base, copy(base)), []);
  const w = copy(base);
  w.game.startHp = 5;
  w.enemies.ghost.hp = 3.5;
  w.levels["w1-01"].intro[0].text = "Merhaba";
  delete w.enemies.ghost.zig;
  w.campaign.order = [...w.campaign.order].reverse();
  const ops = diffOps(base, w);
  assert.ok(ops.every((o) => o.path.startsWith("/")));
  assert.ok(ops.some((o) => o.op === "set" && o.path === "/game/startHp" && o.value === 5));
  const { config, conflicts } = applyOps(base, ops);
  assert.equal(conflicts.length, 0);
  assert.equal(configHash(config), configHash(w));
});

test("getAt/setAt: yol okur/yazar, undefined siler, yasak anahtarı reddeder", () => {
  const c = copy(base);
  assert.equal(getAt(c, "/game/startHp"), 3);
  assert.ok(setAt(c, "/game/startHp", 4));
  assert.equal(c.game.startHp, 4);
  assert.ok(setAt(c, "/game/startHp", undefined));
  assert.equal("startHp" in c.game, false);
  assert.equal(setAt(c, "/game/__proto__/x", 1), false);
  assert.equal(setAt(c, "/yok/yol", 1), false);
  assert.equal(({}).x, undefined);
});

test("changeRows: eklendi/silindi/değişti ve Türkçe etiket", () => {
  const w = copy(base);
  w.game.startHp = 4;
  delete w.enemies.ghost.zig;
  w.enemies.ghost.bob = 0.1;
  const rows = changeRows(base, w);
  const byPath = Object.fromEntries(rows.map((r) => [r.path, r]));
  assert.equal(byPath["/game/startHp"].kind, "değişti");
  assert.equal(byPath["/game/startHp"].old, 3);
  assert.match(byPath["/game/startHp"].label, /Başlangıç canı/);
  assert.equal(byPath["/enemies/ghost/bob"]?.kind ?? "eklendi", "eklendi");
});

test("addItem/removeItem: bölüm ekleme sırayı ve yolu günceller, silme başvuruları temizler", () => {
  const c = copy(base);
  assert.ok(checkNewId(c, "levels", "Büyük"));
  assert.ok(checkNewId(c, "levels", "w1-01"));
  const n = c.campaign.order.length;
  const r = addItem(c, "levels", "yeni_bolum");
  assert.ok(r.ok);
  assert.equal(c.campaign.order.length, n + 1);
  assert.equal(c.campaign.edges.at(-1).to, "yeni_bolum");
  // yeni öğe tek başına şema türü hatası üretmemeli (yalnızca anlamsal uyarı/hata olabilir)
  const v = validate(c, { mode: "strict" });
  assert.equal(v.errors.filter((e) => e.path.startsWith("/levels/yeni_bolum") && /^E_(TYPE|RANGE|LENGTH|ENUM|FORMAT)/.test(e.code)).length, 0, JSON.stringify(v.errors.filter((e) => e.path.startsWith("/levels/yeni_bolum"))));
  assert.ok(removeItem(c, "levels", "yeni_bolum"));
  assert.equal(c.campaign.order.length, n);
  assert.equal(c.campaign.edges.some((e) => e.to === "yeni_bolum"), false);

  const w = copy(base);
  const wid = w.weaponOrder[1];
  removeItem(w, "weapons", wid);
  assert.equal(w.weaponOrder.includes(wid), false);
  assert.equal(Object.values(w.levels).some((L) => L.reward === wid), false);
  const e = copy(base);
  removeItem(e, "enemies", "ghost");
  assert.equal(Object.values(e.levels).some((L) => "ghost" in L.start || L.spawn.some((x) => "ghost" in x)), false);
});

test("duplicateItem: kopya yeni kimlikle eklenir, özgün korunur", () => {
  const c = copy(base);
  const r = duplicateItem(c, "enemies", "ghost", "ghost_2");
  assert.ok(r.ok);
  assert.equal(c.enemies.ghost_2.hp, c.enemies.ghost.hp);
  assert.notEqual(c.enemies.ghost_2, c.enemies.ghost);
  assert.equal(duplicateItem(c, "enemies", "yok", "x_y").ok, false);
});

test("routeOf/countByTab: yol -> sekme", () => {
  assert.equal(routeOf("/enemies/ghost/hp").tab, "dusmanlar");
  assert.deepEqual([routeOf("/enemies/ghost/hp").coll, routeOf("/enemies/ghost/hp").id], ["enemies", "ghost"]);
  assert.equal(routeOf("/levels/w1-02/map/x").tab, "bolumler");
  assert.equal(routeOf("/themes/night/music/bpm").tab, "ses");
  assert.equal(routeOf("/strings/title").tab, "genel");
  const c = countByTab([{ path: "/enemies/a", severity: "error" }, { path: "/enemies/b", severity: "warning" }, { path: "/game/x", severity: "error" }]);
  assert.deepEqual(c.dusmanlar, { error: 1, warning: 1 });
  assert.equal(c.genel.error, 1);
});

test("formatConfig: kanonik, tekrar üretilebilir, anlamı değiştirmez", () => {
  const t = formatConfig(base);
  assert.ok(t.endsWith("\n"));
  assert.equal(configHash(JSON.parse(t)), configHash(base));
  assert.equal(formatConfig(JSON.parse(t)), t); // eş güçlü
  // alan sırası şemaya göre: meta ilk, sonra game
  assert.ok(t.indexOf('"meta"') < t.indexOf('"game"'));
  // anahtar sırası değişse de çıktı aynı
  const shuffled = { ...base, game: Object.fromEntries(Object.entries(base.game).reverse()) };
  assert.equal(formatConfig(shuffled), t);
  assert.ok(!t.includes("\r"));
});

test("buildDraft + storage: yama kaydedilir, resolveDraft aynı sonucu verir; baseHash değişirse eski", () => {
  const w = copy(base);
  w.game.startHp = 4;
  const store = makeStore(null);
  const d = buildDraft({ base, working: w, notes: { "": "genel", "/game/startHp": withCode("kodla", true), "yanlis": "x", "/a": "  " } });
  assert.equal(d.baseHash, configHash(base));
  assert.deepEqual(Object.keys(d.notes).sort(), ["", "/game/startHp"]);
  assert.ok(writeDraft(store, d).ok);
  assert.ok(readDraft(store).draft);
  const r = resolveDraft(base, store);
  assert.equal(r.status, "applied");
  assert.equal(r.config.game.startHp, 4);
  const other = copy(base); other.meta.name = "başka";
  assert.equal(resolveDraft(other, store).status, "stale");
});

test("exportPatch: yeniden içe aktarılabilir", () => {
  const w = copy(base); w.game.baseSpeed = 9;
  const d = buildDraft({ base, working: w, notes: { "": "n" } });
  const r = readImport(exportPatch(d), base);
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.kind, "patch");
  assert.equal(r.working.game.baseSpeed, 9);
  assert.equal(r.notes[""], "n");
});

test("readImport: tam config, bozuk JSON, yasak anahtar, hatalı değer, büyük dosya", () => {
  assert.ok(readImport(JSON.stringify(base), base).ok);
  assert.equal(readImport("{bozuk", base).ok, false);
  assert.equal(readImport("[]", base).ok, false);
  const bad = copy(base); bad.game.startHp = 999;
  const r = readImport(JSON.stringify(bad), base);
  assert.equal(r.ok, false);
  assert.ok(r.errors.length > 0);
  const forbidden = JSON.stringify(base).replace('"game":{', '"game":{"__proto__":{"x":1},');
  const rf = readImport(forbidden.includes("__proto__") ? forbidden : JSON.stringify({ ...base, constructor: 1 }), base);
  assert.equal(rf.ok, false);
  assert.equal(readImport("x".repeat(1024 * 1024 + 1), base).ok, false);
  // yama: olmayan yola yazan işlem çakışma olarak bildirilir, ama geçerli sonuç verir
  const p = readImport(JSON.stringify({ v: 1, baseHash: "00000000", ops: [{ op: "set", path: "/yok/alan", value: 1 }, { op: "set", path: "/game/startHp", value: 4 }] }), base);
  assert.ok(p.ok);
  assert.equal(p.conflicts.length, 1);
  assert.equal(p.staleBase, true);
});

test("buildClaudePackage: bölümler, tablo, kod istekleri, sürüm; değerler güvenle kaçışlanır", () => {
  const w = copy(base);
  w.game.startHp = 4;
  w.strings.title = "Başlık | boru ```kod``` \n satır";
  const md = buildClaudePackage({ base, working: w, baseHash: configHash(base), now: new Date("2026-01-02T00:00:00Z"), notes: { "": "Genel görüşüm", "/game/startHp": "Biraz kolay olsun", "/enemies/ghost": withCode("Hayalet duvardan geçsin", true) } });
  for (const s of ["## 1. Özet", "## 2. Değişiklik tablosu", "## 3. Doğrulama raporu", "## 4. Emre'nin notları", "## 5. Kod gerektiren istekler", "## 6. Sürüm bilgisi", "## 7. Claude için adımlar"]) assert.ok(md.includes(s), s);
  assert.ok(md.includes("2026-01-02"));
  assert.match(md, /Değişiklik: \*\*2\*\*/);
  assert.ok(md.includes("`/game/startHp`"));
  assert.ok(md.includes("Biraz kolay olsun"));
  assert.ok(md.includes("Hayalet duvardan geçsin"));
  assert.ok(md.includes("Genel görüşüm"));
  assert.ok(md.includes(`\`${configHash(base)}\``));
  assert.ok(md.includes(`\`${configHash(w)}\``));
  // tablo satırı bozulmamalı: başlık değerindeki boru kaçışlı, satır sonu yok
  const row = md.split("\n").find((l) => l.includes("/strings/title"));
  assert.ok(row && row.includes("\\|") && !row.includes("\n"));
  assert.ok(!md.includes("## Ek: tam"));
  const withCfg = buildClaudePackage({ base, working: base, baseHash: "x", embedConfig: true });
  assert.ok(withCfg.includes("## Ek: tam game.config.json"));
  assert.match(withCfg, /Değişiklik: \*\*0\*\*/);
  assert.ok(withCfg.includes("Değişiklik yok."));
});

test("buildClaudePackage: doğrulama hataları raporlanır", () => {
  const w = copy(base);
  w.game.startHp = 999;
  const md = buildClaudePackage({ base, working: w, baseHash: "x" });
  assert.match(md, /\*\*[1-9]\d*\*\* hata/);
  assert.ok(md.includes("E_"));
});

test("cleanNotes: yalnız geçerli anahtar ve metin, 1000 karakter sınırı", () => {
  const n = cleanNotes({ "": "a", "/x": "b".repeat(2000), "bozuk": "c", "/y": 5, "/z": "  " });
  assert.deepEqual(Object.keys(n), ["", "/x"]);
  assert.equal(n["/x"].length, 1000);
});

test("güvenlik: js/admin ve admin.html'de ham HTML/eval yok", () => {
  const files = [path.join(root, "admin.html")];
  const dir = path.join(root, "js/admin");
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".js")) files.push(path.join(dir, f));
  const banned = /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function|javascript:/;
  for (const f of files) assert.ok(!banned.test(fs.readFileSync(f, "utf8")), path.basename(f));
});

test("readImport: çalışma kopyası ham (varsayılanlarla doldurulmamış) gelir; böylece taslağa gürültü işlem yazılmaz", () => {
  const r = readImport(JSON.stringify(base), base);
  assert.ok(r.ok);
  assert.deepEqual(diffOps(base, r.working), []);
});
