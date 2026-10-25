// Menü, harita, bölüm kartı ve bölüm sonu saf modelleri: menü kartı verisi, kariyer sayaçları, harita paneli çipleri, skor satırları, nadirlik.
import test from "node:test";
import assert from "node:assert/strict";
import { RARITY_LABEL, careerStats, continueCardModel, countValue, foeIdsOf, perkRarity, rewardStat, scoreRows, sheetModel } from "../js/ui/models.js";

const NAMES = { ghost: "Ruh", bat: "Yarasa", golem: "Taş Bekçi", totem: "Totem" };
const LEVEL = { name: "Taş Bekçiler", time: 60, image: "assets/art/x.webp", objective: "crystal", start: { ghost: 2, bat: 1 }, spawn: [{ ghost: 1, golem: 2 }, { unknownfoe: 1 }] };

test("foeIdsOf: başlangıç + dalga düşmanları tekrarsız, adı olmayanlar elenir, totem hedefi eklenir", () => {
  assert.deepEqual(foeIdsOf(LEVEL, NAMES, "totem"), ["ghost", "bat", "golem"]);
  assert.deepEqual(foeIdsOf({ ...LEVEL, objective: "totem" }, NAMES, "totem"), ["ghost", "bat", "golem", "totem"]);
  assert.deepEqual(foeIdsOf(null, NAMES), []);
});

test("continueCardModel: yalnızca bölümün gerçek verisi; bölüm yoksa null", () => {
  const m = continueCardModel(LEVEL, { index: 2, total: 9, names: NAMES, totemId: "totem" });
  assert.deepEqual(m, { n: 3, total: 9, name: "Taş Bekçiler", cover: "assets/art/x.webp", time: 60, foeCount: 3 });
  assert.equal(continueCardModel({ ...LEVEL, image: undefined }, { names: NAMES }).cover, null);
  assert.equal(continueCardModel(undefined), null);
});

test("careerStats: kayıt yoksa null; tamamlanan sayısı ve en iyi puan yalnızca kayıttan", () => {
  assert.equal(careerStats(null, 9), null);
  assert.deepEqual(careerStats({ completed: ["a", "b"], best: { score: 2210.7 } }, 9), { done: 2, total: 9, best: 2210 });
  assert.deepEqual(careerStats({}, 9), { done: 0, total: 9, best: 0 });
  assert.equal(careerStats({ completed: "x", best: { score: -5 } }, 9).best, 0);
});

test("sheetModel: kilitli oynanamaz, tamamlanan alıştırma; en iyi puan ve ödül yalnızca varsa", () => {
  const locked = sheetModel(LEVEL, "locked", undefined, null);
  assert.equal(locked.canPlay, false);
  assert.equal(locked.best, null);
  assert.equal(locked.reward, null);
  const open = sheetModel(LEVEL, "available", { score: 0 }, null);
  assert.deepEqual([open.canPlay, open.practice, open.best], [true, false, null]);
  const done = sheetModel(LEVEL, "completed", { score: 314 }, { id: "ice", name: "Buz Oku" });
  assert.deepEqual([done.canPlay, done.practice, done.best, done.time], [true, true, 314, 60]);
  assert.deepEqual(done.reward, { id: "ice", name: "Buz Oku" });
});

test("scoreRows: süre bonusu, bölüm bonusu, toplam (önceki toplamdan sayar)", () => {
  const rows = scoreRows({ bonus: 120, levelBonus: 300, total: 1870, prevTotal: 1450 });
  assert.deepEqual(rows.map((r) => r.id), ["time", "level", "total"]);
  assert.deepEqual(rows.map((r) => r.value), [120, 300, 1870]);
  assert.equal(rows[2].from, 1450);
  assert.equal(scoreRows().every((r) => r.value === 0), true);
  assert.equal(countValue(1450, 1870, 0), 1450);
  assert.equal(countValue(1450, 1870, 1), 1870);
});

test("perkRarity ve etiketler: 1 yığın destansı, 2 nadir, diğerleri yaygın", () => {
  assert.equal(perkRarity(1), "epic");
  assert.equal(perkRarity(2), "rare");
  assert.equal(perkRarity(5), "common");
  assert.equal(perkRarity(undefined), "common");
  assert.deepEqual(Object.values(RARITY_LABEL), ["Yaygın", "Nadir", "Destansı"]);
});

test("rewardStat: büyüde hasar + bekleme, yetenekte yalnız bekleme", () => {
  const lb = { damage: "Hasar", cooldown: "Bekleme", sec: "sn" };
  assert.equal(rewardStat("weapon", { dmg: 2, cd: 0.9 }, lb), "Hasar 2 · Bekleme 0.9 sn");
  assert.equal(rewardStat("ability", { cd: 8 }, lb), "Bekleme 8 sn");
});
