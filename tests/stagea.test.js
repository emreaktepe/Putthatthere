// Savaş sistemi Aşama A (docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md): Yıldırım zinciri, yakın doğma, kristal akışı (minKills, lure),
// ölüm repliği süzgeci, etiket sınırlayıcı, HUD kill satırı, bot ölçütleri. Sayılar VARSAYIMDIR.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validate } from "../js/config/validate.js";
import { adapt } from "../js/config/adapt.js";
import { CHAIN_FALLOFF, chainFalloff, chainTargets } from "../js/game/chain.js";
import { MULT, matchupLevel } from "../js/game/matchup.js";
import { NEAR_SPAWN, crystalGoalMet, pickCrystalPoint, pickSpawnPointNear } from "../js/game/spawnmath.js";
import { eligibleDeathLines } from "../js/game/deathlines.js";
import { TAG_MAX, makeTagGate, tagKind } from "../js/ui/tagmodel.js";
import { questRows } from "../js/ui/models.js";
import { PROFILES, loadConfig, runMany } from "../tools/balance/sim.mjs";
import { planned20 } from "../js/config/balance.js";
import { BRAND } from "../js/ui/brandmodel.js";

const cfg = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const A = adapt(validate(cfg).sanitized);
const rng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

test("Yıldırım (§3.5): hasar 1.5, bekleme 1.0, menzil 9, zincir sıçraması 5, düşüş 1/0.7/0.5, element lightning", () => {
  const w = A.WEAPONS.lightning;
  assert.deepEqual([w.dmg, w.cd, w.chain, w.range, w.hop, w.element], [1.5, 1, 3, 9, 5, "lightning"]);
  assert.deepEqual(w.falloff, [1, 0.7, 0.5]);
  assert.deepEqual(CHAIN_FALLOFF, [1, 0.7, 0.5]);
  assert.equal(chainFalloff(null, 5), 0.5);
});

test("zincir mesafe kuralı: ilk hedef menzil içinde en yakın; sonrakiler öncekine <= 5 birim ve tekrarsız; kopuk hedefe atlamaz", () => {
  const o = { x: 0, z: 0 };
  const c = (x, z) => ({ x, z });
  const a = c(4, 0), b = c(8, 0), far = c(13.5, 0), side = c(4, 4.5), out = c(0, 12);
  assert.deepEqual(chainTargets(o, [far, b, a], 3, 9, 5), [a, b], "far b'den 5.5 birim: atlanmaz");
  const ch = chainTargets(o, [side, a, b], 3, 9, 5);
  assert.equal(ch[0], a);
  assert.deepEqual(ch, [a, b], "side b'den 6 birim: zincir burada biter");
  assert.deepEqual(chainTargets(o, [side, a], 3, 9, 5), [a, side]);
  for (let i = 1; i < ch.length; i++) assert.ok(Math.hypot(ch[i].x - ch[i - 1].x, ch[i].z - ch[i - 1].z) <= 5 + 1e-9);
  assert.equal(new Set(ch).size, ch.length);
  assert.deepEqual(chainTargets(o, [out], 3, 9, 5), [], "menzil dışı");
});

test("Yıldırım tek vuruşta (zincirin 1. halkası) yalnız Yarasa ve Kurt'u öldürür (eski: Ruh, Yarasa, Okçu, Kurt, Kor); Ruh 2 vuruş", () => {
  const w = A.WEAPONS.lightning, killed = [];
  for (const [id, e] of Object.entries(A.ENEMIES)) {
    if (e.static || ["knight", "boss"].includes(e.ai)) continue;
    if (w.dmg * MULT[matchupLevel(w.element, e.tags, e.res)] >= e.hp - 0.05) killed.push(id);
  }
  assert.deepEqual(killed.sort(), ["bat", "wolf"]);
  assert.ok(1.5 * MULT[matchupLevel("lightning", ["ghost"])] < 1);
});

test("yakın doğma: oyuncudan >= 6.5, yarıçap 9-14; kristal yeri: lure düşmana yakın aday; lure kapalıyken rastgele", () => {
  const r = rng();
  for (const p of [{ x: 0, z: 0 }, { x: 13, z: 0 }, { x: -12, z: 12 }]) {
    for (let i = 0; i < 400; i++) {
      const q = pickSpawnPointNear(p, r, 14), d = Math.hypot(q.x, q.z);
      assert.ok(Math.hypot(q.x - p.x, q.z - p.z) >= NEAR_SPAWN.minDist - 1e-9);
      assert.ok(d >= NEAR_SPAWN.rMin - 1e-9 && d <= 14 + 1e-9);
    }
  }
  const foes = [{ x: 10, z: 10 }];
  let sum = 0, sumR = 0;
  const n = 400;
  for (let i = 0; i < n; i++) {
    const q = pickCrystalPoint({ x: 0, z: 0 }, foes, r, 12.5, true), q2 = pickCrystalPoint({ x: 0, z: 0 }, foes, r, 12.5, false);
    sum += Math.hypot(q.x - 10, q.z - 10);
    sumR += Math.hypot(q2.x - 10, q2.z - 10);
  }
  assert.ok(sum / n < (sumR / n) * 0.8, "lure kristali düşmana yaklaştırır");
});

test("K4 minKills: hedef kristal VE öldürme sayısı gerekir; minKills yoksa eski davranış", () => {
  const L = { goal: 25, minKills: 12 };
  assert.equal(crystalGoalMet(L, 25, 11), false);
  assert.equal(crystalGoalMet(L, 24, 40), false);
  assert.equal(crystalGoalMet(L, 25, 12), true);
  assert.equal(crystalGoalMet({ goal: 25 }, 25, 0), true);
});

test("config: Perde I kristal bölümlerinde minKills <= %60 x goal; kristal 3, gecikme, lure; ilk 20 sn planlanan düşman >= 4", () => {
  for (const id of ["w1-01", "w1-02", "w1-03", "w1-05", "w1-07"]) {
    const L = A.LEVELS[A.LEVEL_IDS.indexOf(id)];
    assert.ok(L.minKills > 0 && L.minKills <= L.goal * 0.6, id);
    assert.equal(L.crystals, 3);
    assert.ok(L.crystalDelay >= 1.2);
    assert.equal(L.crystalLure, true);
    assert.ok(planned20(L) >= 4, id);
  }
});

test("HUD kill satırı: minKills varsa 'n/N' ve done; yoksa yalnız sayı (eski)", () => {
  const L = { objective: "crystal", goal: 25, minKills: 12 };
  assert.equal(questRows(L, { collected: 3 }, 5)[1].value, "5/12");
  assert.equal(questRows(L, { collected: 3 }, 20)[1].value, "12/12");
  assert.equal(questRows(L, {}, 20)[1].done, true);
  assert.equal(questRows({ objective: "crystal", goal: 25 }, {}, 7)[1].value, "7");
  assert.equal(questRows({ objective: "totem", goal: 3, minKills: 9 }, {}, 7)[1].value, "7");
});

test("ölüm repliği süzgeci: Taşkın satırları w1-03 tamamlanmadan çıkmaz; hepsi elenirse süzülmemiş liste; bilinmeyen bölüm reddedilir", () => {
  const lines = A.STRINGS.deathLines, taskin = lines.filter((l) => l.after);
  assert.ok(taskin.length >= 2 && taskin.every((l) => l.speaker === "Taşkın" && l.after === "w1-03"));
  assert.ok(eligibleDeathLines(lines, new Set(["w1-01", "w1-02"])).every((l) => l.speaker !== "Taşkın"));
  assert.ok(eligibleDeathLines(lines, new Set(["w1-03"])).some((l) => l.speaker === "Taşkın"));
  assert.deepEqual(eligibleDeathLines([{ text: "x", after: "w9" }], []), [{ text: "x", after: "w9" }]);
  const bad = JSON.parse(JSON.stringify(cfg));
  bad.strings.deathLines[1].after = "yok-bolum";
  assert.ok(validate(bad).errors.some((e) => e.code === "E_REF"));
});

test("etiket sınırlayıcı: aynı anda <= 6, aynı düşman 0.4 sn'de bir; yalnız Etkili ve Dirençli/Bağışık gösterilir", () => {
  const g = makeTagGate();
  const foes = Array.from({ length: 10 }, () => ({}));
  assert.equal(foes.map((f) => g.allow(f, 1000)).filter(Boolean).length, TAG_MAX);
  assert.equal(g.active, 6);
  assert.equal(g.allow(foes[9], 1100), false, "dolu");
  const g2 = makeTagGate();
  const f = {};
  assert.equal(g2.allow(f, 0), true);
  assert.equal(g2.allow(f, 399), false);
  assert.equal(g2.allow(f, 401), true);
  assert.equal(g.allow(foes[9], 1800), true, "ömür bitince yer açılır");
  assert.deepEqual(["E", "N", "D", "I"].map(tagKind), ["e", null, "d", "d"]);
  assert.ok(A.STRINGS.matchup.effective && A.STRINGS.matchup.resist);
});

test("slogan bölüm sayısından bağımsız", () => {
  assert.equal(BRAND.slogan, "Bir büyü. Bir gece. Tek kader.");
  assert.ok(!/bölüm/i.test(BRAND.slogan));
});

test("bot (sim): yürüyen bot kristal bölümlerini artık geçemez (minKills); orta bot ilk 20 sn ortalama aktif düşman hedefi (tasarım §2.2: 1.2/1.0/1.5/1.5) sağlanır", () => {
  const S = loadConfig();
  const ids = S.LEVELS.map((l) => l.id);
  for (const id of ["w1-01", "w1-02", "w1-03", "w1-05", "w1-07"]) assert.equal(runMany(S, ids.indexOf(id), PROFILES.yuruyen, 10, 1).winRate, 0, id);
  const want = { "w1-01": 1.2, "w1-02": 1.0, "w1-03": 1.5, "w1-05": 1.5 };
  for (const [id, min] of Object.entries(want)) assert.ok(runMany(S, ids.indexOf(id), PROFILES.orta, 20, 2).a20 >= min, id);
});

test("bot: orta bot w1-01 ve w1-02 hedef banda yakın (küçük N: +-20 puan); usta Perde I'de >= %90 (tasarım §8.3; kalibre değil)", () => {
  const S = loadConfig(), ids = S.LEVELS.map((l) => l.id);
  const t = { "w1-01": 0.92, "w1-02": 0.88 };
  for (const [id, v] of Object.entries(t)) assert.ok(Math.abs(runMany(S, ids.indexOf(id), PROFILES.orta, 40, 1).winRate - v) <= 0.2, id);
  for (let i = 0; i < 9; i++) assert.ok(runMany(S, i, PROFILES.usta, 10, 1).winRate >= 0.9, ids[i]);
});
