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

test("LEVELS eşdeğer (EK: id, map; intro/outro satır nesnesi)", () => {
  assert.equal(A.LEVELS.length, L.LEVELS.length);
  A.LEVELS.forEach((lv, i) => {
    const got = strip(lv, ["id", "map"]);
    got.intro = got.intro.map((l) => strip(l, ["color"]));
    got.outro = got.outro.map((l) => strip(l, ["color"]));
    const want = { ...L.LEVELS[i], intro: L.LEVELS[i].intro.map(parseLine), outro: L.LEVELS[i].outro.map(parseLine) };
    assert.deepEqual(got, want, `bölüm ${i + 1}`);
  });
});

test("WEAPONS / WEAPON_ORDER eşdeğer", () => {
  assert.deepEqual(A.WEAPONS, L.WEAPONS);
  assert.deepEqual(A.WEAPON_ORDER, L.WEAPON_ORDER);
  assert.deepEqual(Object.keys(A.WEAPONS), Object.keys(L.WEAPONS));
});

test("ABILITIES / ABILITY_ORDER eşdeğer (EK: params)", () => {
  assert.deepEqual(mapVals(A.ABILITIES, (a) => strip(a, ["params"])), L.ABILITIES);
  assert.deepEqual(A.ABILITY_ORDER, L.ABILITY_ORDER);
  // koda gömülü süreler artık params'ta: eski sabit değerler
  assert.deepEqual(A.ABILITIES.shield.params, { duration: 8 });
  assert.deepEqual(A.ABILITIES.blink.params, { dist: 5, iframes: 0.4 });
  assert.deepEqual(A.ABILITIES.timeslow.params, { duration: 3, factor: 0.4 });
});

test("ENEMIES / ENEMY_NAMES eşdeğer (EK: name, shortName, scale, model, summon*)", () => {
  const got = mapVals(A.ENEMIES, (e) => strip(e, ["name", "shortName", "scale", "model", "summon", "summons1", "summons2", "character"]));
  assert.deepEqual(got, L.ENEMIES);
  assert.deepEqual(Object.keys(A.ENEMIES), Object.keys(L.ENEMIES));
  assert.deepEqual(A.ENEMY_NAMES, L.ENEMY_NAMES);
  for (const [id, e] of Object.entries(A.ENEMIES)) { assert.equal(e.model, id); assert.equal(e.scale, 1); }
  // koda gömülü kimlikler artık veride
  assert.equal(A.ENEMIES.totem.summon, "ghost");
  assert.deepEqual(A.ENEMIES.boss.summons1, ["ghost", "ghost"]);
  assert.deepEqual(A.ENEMIES.boss.summons2, ["archer", "bat"]);
  assert.equal(A.ENEMIES.knight.shortName, "Şövalye");
  assert.equal(A.ENEMIES.boss.shortName, "Kral");
  assert.equal(A.TOTEM_ID, "totem");
});

test("THEMES / VIS / FLOOR_KIND eşdeğer (EK: floorKind, scenery, seed, id)", () => {
  assert.deepEqual(A.THEMES.map((t) => strip(t, ["floorKind", "scenery", "seed", "id"])), L.THEMES);
  assert.deepEqual(A.THEMES.map((t) => t.floorKind), L.FLOOR_KIND);
  assert.deepEqual(A.THEMES.map((t) => t.seed), L.THEMES.map((_, i) => i)); // drawFloor tohumu eskiden tema dizinine eşitti
  assert.deepEqual(A.VIS, L.VIS);
});

test("MUSIC eşdeğer (EK: fifth yalnız tema 2'de); boss faz 3 = eski P3", () => {
  assert.deepEqual(A.MUSIC.map((m, i) => (i === 2 ? strip(m, ["fifth"]) : m)), L.MUSIC);
  assert.deepEqual(A.MUSIC.map((m) => !!m.fifth), L.MUSIC.map((_, i) => i === 2));
  assert.deepEqual(Object.keys(A.MUSIC_P3), ["8"]);
  assert.deepEqual(A.MUSIC_P3[8], L.P3);
});

test("metinler eşdeğer (açılış, ölüm repliği, hedef şablonları, final)", () => {
  assert.equal(A.STRINGS.opening, L.OPENING);
  assert.deepEqual(A.STRINGS.deathLines.map((l) => strip(l, ["color"])), L.DEATH_LINES.map(parseLine));
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

test("PERKS: ok() ve apply() rastgele oyun dizilerinde eski kapanışlarla birebir", () => {
  const R = rng(12345);
  let steps = 0;
  for (let run = 0; run < 300; run++) {
    const S1 = freshS(), S2 = freshS();
    const legacy = L.makePerks(S1);
    for (let step = 0; step < 24; step++) {
      // eski ok(): kapanış S1'i okur; yeni ok(S2)
      legacy.forEach((p, i) => {
        const oldOk = p.ok ? !!p.ok() : true;
        assert.equal(A.PERKS[i].ok(S2), oldOk, `ok ${p.id} run ${run} adım ${step}`);
      });
      const pool = legacy.map((p, i) => i).filter((i) => (legacy[i].ok ? legacy[i].ok() : true));
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
