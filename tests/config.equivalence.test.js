// Eşdeğerlik testi: data/game.config.json -> adapt() çıktısı, eski gömülü sabitlerle (tests/legacy-constants.js)
// derin eşit olmalı. Oyun davranışının veri taşımasıyla DEĞİŞMEDİĞİNİN kanıtıdır.
// Belgelenmiş EK alanlar (eski sabitlerde yoktu) karşılaştırmadan önce ayıklanır; her biri aşağıda listelidir.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as L from "./legacy-constants.js";
import { validate } from "../js/config/validate.js";
import { adapt } from "../js/config/adapt.js";

const cfg = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const res = validate(cfg);
const A = adapt(res.sanitized);

const strip = (o, keys) => { const c = { ...o }; for (const k of keys) delete c[k]; return c; };
const mapVals = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v, k)]));

// eski "Konuşmacı: metin" dizgisi -> {speaker?, text}
const parseLine = (s) => { const m = /^(Zerrin|Pırıl|Veyis|Taşkın|Aldemir):\s*(.*)$/.exec(s); return m ? { speaker: m[1], text: m[2] } : { text: s }; };

test("repo JSON'u doğrulayıcıdan hatasız ve uyarısız geçer", () => {
  assert.deepEqual(res.errors, []);
  assert.deepEqual(res.warnings, []);
});

// AŞAMA 1 + PERDE I BİLİNÇLİ DEĞİŞİKLİKLER (docs/strateji/oyun-tasarimi-zorluk-ve-bolum-plani.md §12 ve "Perde I uygulama notları"):
// eski 9 bölüm yeni kimliklere taşındı (LEGACY_LEVEL_IDS), araya 2 yeni bölüm girdi (w1-04, w1-06); metinler (intro/outro/hook/hint), ödül takvimi ve
// aşağıdaki sayılar bilinçli değişti. Tema, hedef türü (pass hariç: hayatta kal -> zamanlı kristal), ad, totem konumları legacy ile aynı kalır.
// Sayılar VARSAYIMDIR (model: js/config/balance.js).
import { LEGACY_LEVEL_IDS } from "../js/core/legacyids.js";
// SAVAŞ SİSTEMİ AŞAMA A (docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §2.4 + "Aşama A uygulama notları"): ilk bölümlerin baskısı
// (start/spawn/every/cap), kristal akışı (crystals, crystalDelay, crystalLure, minKills) bilinçli yeniden dengelendi; sayılar VARSAYIMDIR.
const BALANCE = {
  0: { goal: 25, time: 105, start: { ghost: 5 }, spawn: [{ ghost: 2 }], every: 6, cap: 8, crystals: 3 },
  1: { goal: 29, time: 120, start: { ghost: 2, bat: 3 }, spawn: [{ bat: 1, ghost: 2 }], every: 9, cap: 8, crystals: 3 },
  // Aşama B: w1-03 Ruh3 Yar2 Taş1 / 9 sn -> Ruh2 Yar2 Taş1 / 9.5 sn (3 beceri açık: orta bot %59 -> ~%70)
  2: { goal: 33, time: 140, start: { ghost: 2, bat: 2, golem: 1 }, spawn: [{ golem: 1, bat: 2 }, { ghost: 3 }], every: 9.5, cap: 9, crystals: 3 },
  3: { goal: 38, time: 155, start: { ghost: 2, bat: 2, golem: 1, archer: 2 }, spawn: [{ ghost: 2, archer: 1 }], every: 9, cap: 10, crystals: 3 },
  4: { objective: "crystal", goal: 31, time: 105, start: { ghost: 2, bat: 3, wolf: 3 }, spawn: [{ wolf: 1, bat: 2 }], every: 9, cap: 11, crystals: 3 },
  // Aşama B (bot kalibre): w1-08 Ruh2 Kor3 Taş1 / Kor1 Ruh2 / 10 / 9 -> Ruh2 Kor4 Taş2 / Kor3 Ruh2 / 7 / 11 (orta bot %97 -> ~%69)
  5: { time: 200, start: { ghost: 2, ember: 4, golem: 2 }, spawn: [{ ember: 3, ghost: 2 }], every: 7, cap: 11 },
  // Aşama B: w2-02 geçici köprü: Ruh3 Yar3 Taş2 Okç2 Rahip2 / (Rahip1 Yar1 | Okç1 Yar1) / 6 / 11 -> Ruh2 Yar2 Taş1 Okç1 Rahip1 / (Rahip1 Yar1 | Okç1 Ruh1) / 8 / 10 (4 beceri açık; orta bot %38 -> ~%70)
  6: { goal: 42, time: 170, crystals: 4, start: { ghost: 2, bat: 2, golem: 1, archer: 1, priest: 1 }, spawn: [{ priest: 1, bat: 1 }, { archer: 1, ghost: 1 }], every: 8, cap: 10 },
  7: { time: 120, start: { knight: 1, archer: 2, wolf: 1 }, spawn: [{ archer: 1, ghost: 2 }], every: 7, cap: 7 },
  8: { time: 180 },
};
// Aşama C: levels.<id>.hazards (çevre tehlikesi) bilinçli EK alan; eski 9 bölümün diğer alanları değişmedi
const EXTRA = ["id", "map", "image", "nodeImage", "hint", "reward", "ability", "world", "hook", "objectiveText", "minKills", "crystalDelay", "crystalLure", "skills", "hazards"];
test("LEVELS: eski 9 bölüm yeni kimliklerle eşdeğer (sayılar BALANCE; EK: id, map, görsel, hint, reward/ability, world, hook, objectiveText)", () => {
  assert.equal(A.LEVELS.length, L.LEVELS.length + 2);
  assert.deepEqual(A.LEVEL_IDS, ["w1-01", "w1-02", "w1-03", "w1-04", "w1-05", "w1-06", "w1-07", "w1-08", "w1-09", "w2-02", "w3-09"]);
  const oldIds = ["forest", "cave", "golems", "graveyard", "pass", "village", "crystals", "tower", "castle"];
  oldIds.forEach((oid, i) => {
    const lv = A.LEVELS[A.LEVEL_IDS.indexOf(LEGACY_LEVEL_IDS[oid])];
    assert.ok(lv, oid);
    const got = strip(lv, EXTRA);
    got.intro = got.intro.map((l) => strip(l, ["color"]));
    got.outro = got.outro.map((l) => strip(l, ["color"]));
    // hikâye metinleri senaryo belgesiyle yenilendi (w1-*); köprü bölümlerinde (w2-02, w3-09) eskisiyle aynı kalır
    const bridge = i === 6 || i === 8;
    const want = strip({ ...L.LEVELS[i], ...BALANCE[i] }, EXTRA);
    for (const k of Object.keys(want)) if (want[k] === undefined) delete want[k];
    if (bridge) { want.intro = L.LEVELS[i].intro.map(parseLine); want.outro = L.LEVELS[i].outro.map(parseLine); } else { want.intro = got.intro; want.outro = got.outro; }
    assert.deepEqual(got, want, oid + " -> " + LEGACY_LEVEL_IDS[oid]);
  });
});

test("Perde I ödül takvimi (plan §4.4) ve yeni bölümler", () => {
  const rw = (id) => { const lv = A.LEVELS[A.LEVEL_IDS.indexOf(id)]; return [lv.reward || null, lv.ability || null]; };
  assert.deepEqual(rw("w1-01"), ["frost", null]); assert.deepEqual(rw("w1-02"), [null, null]); assert.deepEqual(rw("w1-03"), ["arcane", null]);
  assert.deepEqual(rw("w1-04"), [null, "shield"]); assert.deepEqual(rw("w1-05"), ["lightning", null]); assert.deepEqual(rw("w1-06"), [null, "blink"]);
  assert.deepEqual(rw("w1-07"), [null, null]); assert.deepEqual(rw("w1-08"), ["poison", null]);
  assert.deepEqual(rw("w1-09"), ["nova", "timeslow"], "geçici: Perde II'ye kadar nova/timeslow burada"); assert.deepEqual(rw("w2-02"), ["meteor", null]);
  const w4 = A.LEVELS[3], w6 = A.LEVELS[5];
  assert.deepEqual([w4.objective, w4.goal, w4.time], ["survive", 60, 60]); assert.equal(A.THEMES[w4.theme].id, "forest-dusk");
  assert.deepEqual([w6.objective, w6.goal, w6.totems.length], ["totem", 1, 1]); assert.equal(A.THEMES[w6.theme].id, "cave-ice");
  assert.equal(A.LEVELS[A.LEVEL_IDS.indexOf("w1-09")].objectiveText, "Baş Nöbetçi'yi yen!");
});

test("WEAPONS / WEAPON_ORDER eşdeğer (EK: image, imageSmall)", () => {
  // Aşama A bilinçli değişiklikler (§3.4/§3.5): Yıldırım, Zehir, Meteor, Ay Işığı sayıları + EK alanlar (element, life, slowScale, slowTime, hop, falloff)
  const A_CHANGED = {
    lightning: { cd: 1, dmg: 1.5, chain: 3, range: 9 },
    poison: { cd: 1.3, dmg: 1.2, cloud: { dist: 8, r: 2.5, life: 4 } },
    meteor: { cd: 2.6, dmg: 4, meteor: { r: 3.2, delay: 0.8 } },
    nova: { cd: 3.5, dmg: 1.5, nova: { r: 4.5, push: 2.5 } },
  };
  const want = mapVals(L.WEAPONS, (w, k) => ({ ...w, ...(A_CHANGED[k] || {}) }));
  assert.deepEqual(mapVals(A.WEAPONS, (w) => strip(w, ["image", "imageSmall", "element", "life", "slowScale", "slowTime", "hop", "falloff"])), want);
  assert.equal(A.WEAPONS.lightning.hop, 5); assert.deepEqual(A.WEAPONS.lightning.falloff, [1, 0.7, 0.5]);
  assert.deepEqual(A.WEAPON_ORDER, L.WEAPON_ORDER);
  assert.deepEqual(Object.keys(A.WEAPONS), Object.keys(L.WEAPONS));
});

test("ABILITIES / ABILITY_ORDER eşdeğer (EK: params)", () => {
  assert.deepEqual(mapVals(A.ABILITIES, (a) => strip(a, ["params", "image", "imageSmall"])), L.ABILITIES);
  assert.deepEqual(A.ABILITY_ORDER, L.ABILITY_ORDER);
  // koda gömülü süreler artık params'ta: eski sabit değerler
  assert.deepEqual(A.ABILITIES.shield.params, { duration: 8 });
  assert.deepEqual(A.ABILITIES.blink.params, { dist: 5, iframes: 0.4 });
  assert.deepEqual(A.ABILITIES.timeslow.params, { duration: 3, factor: 0.4 });
});

test("ENEMIES / ENEMY_NAMES eşdeğer (EK: name, shortName, scale, model, summon*)", () => {
  const got = mapVals(A.ENEMIES, (e) => strip(e, ["name", "shortName", "scale", "model", "summon", "summons1", "summons2", "character", "image", "tags", "res"]));
  assert.deepEqual(got, L.ENEMIES);
  assert.deepEqual(Object.keys(A.ENEMIES), Object.keys(L.ENEMIES));
  assert.deepEqual(A.ENEMY_NAMES, L.ENEMY_NAMES);
  for (const [id, e] of Object.entries(A.ENEMIES)) { assert.equal(e.model, id); assert.equal(e.scale, 1); }
  // koda gömülü kimlikler artık veride
  assert.equal(A.ENEMIES.totem.summon, "ghost");
  assert.deepEqual(A.ENEMIES.boss.summons1, ["ghost", "ghost"]);
  assert.deepEqual(A.ENEMIES.boss.summons2, ["archer"]); // Aşama 1 bilinçli: eski ["archer","bat"]; final boss modeli %28 -> ~%37 (plan §3.8-D)
  assert.equal(A.ENEMIES.knight.shortName, "Şövalye");
  assert.equal(A.ENEMIES.boss.shortName, "Kral");
  assert.equal(A.TOTEM_ID, "totem");
});

test("THEMES / VIS / FLOOR_KIND eşdeğer (EK: floorKind, scenery, seed, id)", () => {
  // ilk 9 tema legacy ile aynı; forest-dusk (9) ve cave-ice (10) Perde I ile eklendi (sıra değişmez: boss faz 3 müziği 8. dizinde kalır)
  assert.equal(A.THEMES.length, L.THEMES.length + 2);
  assert.deepEqual(A.THEMES.slice(0, 9).map((t) => strip(t, ["floorKind", "scenery", "seed", "id"])), L.THEMES);
  assert.deepEqual(A.THEMES.slice(0, 9).map((t) => t.floorKind), L.FLOOR_KIND);
  assert.deepEqual(A.THEMES.map((t) => t.seed), A.THEMES.map((_, i) => i)); // drawFloor tohumu tema dizinine eşit
  assert.deepEqual(A.THEMES.slice(9).map((t) => t.id), ["forest-dusk", "cave-ice"]);
  assert.deepEqual(A.VIS.slice(0, 9), L.VIS);
});

test("MUSIC eşdeğer (EK: fifth yalnız tema 2'de); boss faz 3 = eski P3", () => {
  assert.deepEqual(A.MUSIC.slice(0, 9).map((m, i) => (i === 2 ? strip(m, ["fifth"]) : m)), L.MUSIC);
  assert.deepEqual(A.MUSIC.slice(0, 9).map((m) => !!m.fifth), L.MUSIC.map((_, i) => i === 2));
  assert.deepEqual(Object.keys(A.MUSIC_P3), ["8"]);
  assert.deepEqual(A.MUSIC_P3[8], L.P3);
});

test("metinler eşdeğer (açılış, ölüm repliği, hedef şablonları, final)", () => {
  assert.equal(A.STRINGS.opening, L.OPENING);
  // Perde I: 12 satır (senaryo belgesi §2.6); ilk 3 satır legacy ile aynı
  assert.equal(A.STRINGS.deathLines.length, 12);
  assert.deepEqual(A.STRINGS.deathLines.slice(0, 3).map((l) => strip(l, ["color"])), L.DEATH_LINES.map(parseLine));
  assert.equal(A.GAME.startHp, L.START_HP);
  assert.equal(A.GAME.baseSpeed, L.BASE_SPEED);
  // eski objectiveHtml metinleri
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  assert.equal(fill(A.STRINGS.objective.crystal, { goal: 6 }), "6 mana kristali topla.");
  assert.equal(fill(A.STRINGS.objective.survive, { goal: 45 }), "45 saniye hayatta kal.");
  assert.equal(fill(A.STRINGS.objective.totem, { goal: 3 }), "3 Lanet Totemi'ni yık.");
  assert.equal(A.STRINGS.objective.miniboss, "Kemik Şövalye'yi yen!");
  assert.equal(A.STRINGS.objective.boss, "Gölge Kral'ı yen!");
  assert.equal(A.STRINGS.finalLine, "Gölge Kral yenildi. Lanet kalktı.");
});

test("konuşmacı adları eski regex ile aynı kümeden", () => {
  const names = new Set(Object.values(A.CHARACTERS).map((c) => c.name));
  for (const n of ["Zerrin", "Pırıl", "Veyis", "Taşkın", "Aldemir"]) assert.ok(names.has(n), n);
  const speakers = new Set();
  for (const lv of A.LEVELS) for (const l of [...lv.intro, ...lv.outro]) if (l.speaker) speakers.add(l.speaker);
  for (const s of speakers) assert.ok(names.has(s));
});

test("oyuncu görünümü: eski buildWizard renk sabitleri", () => {
  const hx = (s) => parseInt(s.slice(1), 16);
  const look = A.PLAYER.look;
  assert.equal(hx(look.robeTop), 0x6a40d0);
  assert.equal(hx(look.robeBottom), 0x30166a);
  assert.equal(hx(look.skin), 0xf2c9a0);
  assert.equal(hx(look.gold), 0xc8a24a);
  assert.equal(hx(look.hat), 0x2a1566);
  assert.equal(hx(look.beard), 0xe8e4f2);
  assert.equal(hx(look.eye), 0xffe9a8);
  assert.equal(hx(look.wandGlow), 0xe0b3ff);
});

// ---- PERKS: bildirimsel etki == eski ok/apply kapanışları (S üzerinde, rastgele oyun dizileri) ----
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
const freshS = () => ({
  level: 0, hp: L.START_HP, maxHp: L.START_HP, speedMul: 1, dmgMul: 1, cdMul: 1, magnet: 0, unlocked: ["fire"], weapon: "fire", score: 0,
  abilities: [], kills: 0, echo: 0, rain: 0, pierce: false, vampire: false, piril: false, stoneLevels: 0, perkCount: {}, lastPerk: "",
});

test("PERKS: kimlik/ad/açıklama/sıra eşdeğer", () => {
  const legacy = L.makePerks(freshS());
  assert.deepEqual(A.PERKS.map((p) => [p.id, p.name, p.desc]), legacy.map((p) => [p.id, p.name, p.desc]));
});

// AŞAMA 1 BİLİNÇLİ DEĞİŞİKLİK: bu 5 perk'e azami yığın eklendi (eski: sınırsız). Beklenen ok() = eski ok() VE yığın < sınır.
const NEW_LIMITS = { speed: 3, power: 5, haste: 4, magnet: 2, stone: 3 };
test("PERKS: ok() ve apply() rastgele oyun dizilerinde eski kapanışlarla birebir", () => {
  const R = rng(12345);
  let steps = 0;
  for (let run = 0; run < 300; run++) {
    const S1 = freshS(), S2 = freshS();
    const legacy = L.makePerks(S1);
    for (let step = 0; step < 24; step++) {
      // eski ok(): kapanış S1'i okur; yeni ok(S2)
      legacy.forEach((p, i) => {
        const oldOk = (p.ok ? !!p.ok() : true) && (NEW_LIMITS[p.id] === undefined || (S1.perkCount[p.id] || 0) < NEW_LIMITS[p.id]);
        assert.equal(A.PERKS[i].ok(S2), oldOk, `ok ${p.id} run ${run} adım ${step}`);
      });
      const pool = legacy.map((p, i) => i).filter((i) => (legacy[i].ok ? legacy[i].ok() : true) && (NEW_LIMITS[legacy[i].id] === undefined || (S1.perkCount[legacy[i].id] || 0) < NEW_LIMITS[legacy[i].id]));
      if (!pool.length) break;
      const i = pool[Math.floor(R() * pool.length)];
      legacy[i].apply(); A.PERKS[i].apply(S2);
      for (const S of [S1, S2]) S.perkCount[legacy[i].id] = (S.perkCount[legacy[i].id] || 0) + 1;
      if (R() < 0.6) { S1.level++; S2.level++; }
      if (R() < 0.2) { S1.hp = Math.max(S1.hp - 1, 1); S2.hp = S1.hp; }
      assert.deepEqual(S2, S1, `durum run ${run} adım ${step} (${legacy[i].id})`);
      steps++;
    }
  }
  assert.ok(steps > 1000);
});
