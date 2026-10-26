// Kayıt gidiş-dönüşü, bozuk kayıt dayanıklılığı ve ilerleme durumları (harita akışının dayandığı saf mantık).
import test from "node:test";
import assert from "node:assert/strict";
import { SAVE_KEY, buildSave, emptyBest, loadSave, writeSave } from "../js/core/save.js";
import { currentLevelId, effectiveEdges, levelStatuses, practiceKit, recordBest } from "../js/game/progress.js";

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const ids = ["forest", "cave", "golems"];
const defaults = { level: 0, hp: 3, maxHp: 3, speedMul: 1, dmgMul: 1, cdMul: 1, magnet: 0, unlocked: ["fire"], weapon: "fire", score: 0, abilities: [], kills: 0, echo: 0, rain: 0, pierce: false, vampire: false, piril: false, stoneLevels: 0, perkCount: {}, lastPerk: "" };
const ctx = { levelIds: ids, weaponIds: ["fire", "frost"], abilityIds: ["shield"], defaults };

test("kayıt: yaz -> oku gidiş-dönüşü, bölüm dizini kimlikten hesaplanır", () => {
  const st = mem();
  const run = { ...defaults, level: 1, score: 340, unlocked: ["fire", "frost"], weapon: "frost", abilities: ["shield"] };
  assert.equal(writeSave(buildSave({ levelIds: ids, completed: new Set(["forest"]), level: 1, run, best: emptyBest(), configHash: "abc" }), st), true);
  const r = loadSave(ctx, st);
  assert.equal(r.status, "ok");
  assert.deepEqual(r.save.completed, ["forest"]);
  assert.equal(r.save.currentLevel, "cave");
  assert.equal(r.save.run.level, 1);
  assert.equal(r.save.run.score, 340);
  assert.equal(r.save.run.weapon, "frost");
});

test("kayıt: bozuk JSON, yanlış tür ve bilinmeyen kimlikler oyunu çökertmez", () => {
  const st = mem();
  assert.equal(loadSave(ctx, st).status, "none");
  st.setItem(SAVE_KEY, "{bozuk");
  assert.equal(loadSave(ctx, st).status, "corrupt");
  st.setItem(SAVE_KEY, JSON.stringify({ v: 99 }));
  assert.equal(loadSave(ctx, st).status, "newer");
  st.setItem(SAVE_KEY, JSON.stringify({ v: 2, completed: ["forest", "yok", "forest"], currentLevel: "yok", run: { hp: "x", unlocked: ["silinmis"], weapon: "silinmis", abilities: ["gizli"], perkCount: { __proto__: 5 } }, best: { score: -4, levels: { yok: { score: 9 } } } }));
  const r = loadSave(ctx, st);
  assert.equal(r.status, "ok");
  assert.deepEqual(r.save.completed, ["forest"]);
  assert.equal(r.save.currentLevel, "cave");
  assert.deepEqual(r.save.run.unlocked, ["fire"]);
  assert.deepEqual(r.save.run.abilities, []);
  assert.deepEqual(r.save.best.levels, {});
  assert.equal(r.save.best.score, 0);
});

test("ilerleme: durumlar tamamlanana göre türetilir, alıştırma donanımı önceki ödüllerden gelir", () => {
  const edges = effectiveEdges(ids, []);
  assert.deepEqual(levelStatuses(ids, edges, "forest", []), { forest: "available", cave: "locked", golems: "locked" });
  const st = levelStatuses(ids, edges, "forest", ["forest"]);
  assert.deepEqual(st, { forest: "completed", cave: "available", golems: "locked" });
  assert.equal(currentLevelId(ids, st), "cave");
  const kit = practiceKit([{ reward: "frost" }, { ability: "shield" }, {}], 2, ["fire", "frost"]);
  assert.deepEqual(kit.unlocked, ["fire", "frost"]);
  assert.deepEqual(kit.abilities, ["shield"]);
});

test("en iyi sonuç yalnızca iyileşir", () => {
  let b = recordBest(emptyBest(), "forest", { score: 300, time: 20 });
  b = recordBest(b, "forest", { score: 100, time: 35 });
  assert.deepEqual(b.levels.forest, { score: 300, time: 35 });
});
