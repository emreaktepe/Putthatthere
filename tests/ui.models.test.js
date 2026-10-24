// Arayüz görünüm modelleri (HUD, bekleme, perk kartı, hikâye) ve harita çizim modeli.
import test from "node:test";
import assert from "node:assert/strict";
import { countValue, cooldownFrac, enemyIcon, goalFrac, heartStates, perkIcon, perkRarity, portraitOf, storyLines, timerModel } from "../js/ui/models.js";
import { buildMapGraph, effectiveEdges, levelStatuses, mapPoints } from "../js/game/progress.js";

test("heartStates: tam, yarım ve boş kalpler", () => {
  assert.deepEqual(heartStates(3, 3), ["full", "full", "full"]);
  assert.deepEqual(heartStates(2.5, 4), ["full", "full", "half", "empty"]);
  assert.deepEqual(heartStates(0.5, 2), ["half", "empty"]);
  assert.deepEqual(heartStates(0, 2), ["empty", "empty"]);
  assert.deepEqual(heartStates(-1, 1), ["empty"]);
});

test("timerModel: ton eşikleri ve oran", () => {
  assert.equal(timerModel(50, 50).tone, "ok");
  assert.equal(timerModel(14, 50).tone, "warn");
  assert.equal(timerModel(9.2, 50).tone, "crit");
  assert.equal(timerModel(9.2, 50).secs, 10);
  assert.equal(timerModel(-3, 50).frac, 0);
  assert.equal(timerModel(30, 0).frac, 0);
});

test("goalFrac: hedef türüne göre oran", () => {
  assert.equal(goalFrac("crystal", { collected: 3, goal: 6 }), 0.5);
  assert.equal(goalFrac("totem", { totemsDown: 9, goal: 3 }), 1);
  assert.equal(goalFrac("survive", { timeLeft: 15, time: 60 }), 0.75);
  assert.equal(goalFrac("boss", { bossFrac: 0.4 }), 0.4);
  assert.equal(goalFrac("boss", {}), 0);
});

test("cooldownFrac sınırlar", () => {
  assert.equal(cooldownFrac(0.35, 0.7), 0.5);
  assert.equal(cooldownFrac(-1, 2), 0);
  assert.equal(cooldownFrac(5, 2), 1);
  assert.equal(cooldownFrac(1, 0), 0);
});

test("perk nadirliği, simgesi; düşman simgesi geri dönüşü", () => {
  assert.equal(perkRarity(1), "epic");
  assert.equal(perkRarity(2), "rare");
  assert.equal(perkRarity(3), "common");
  assert.equal(perkRarity(undefined), "common");
  assert.equal(perkIcon({ stat: "maxHp" }), "❤️");
  assert.equal(perkIcon({ stat: "bilinmeyen" }), "🔮");
  assert.equal(enemyIcon("ghost"), "👻");
  assert.equal(enemyIcon("yok"), "👾");
});

test("storyLines cümlelere böler; countValue uçlarda kesin", () => {
  assert.deepEqual(storyLines("Bir. İki! Üç?  "), ["Bir.", "İki!", "Üç?"]);
  assert.deepEqual(storyLines(""), []);
  assert.equal(countValue(0, 200, 0), 0);
  assert.equal(countValue(0, 200, 1), 200);
  assert.ok(countValue(0, 200, 0.5) > 100);
});

test("portraitOf: karakter simgesi, yoksa baş harf", () => {
  const ch = { a: { name: "Zerrin", icon: "🦉", color: "#ffe9a8" } };
  assert.deepEqual(portraitOf(ch, "Zerrin"), { icon: "🦉", color: "#ffe9a8" });
  assert.deepEqual(portraitOf(ch, "ışık"), { icon: "I", color: null });
});

test("harita modeli: düğüm durumları, kenarlar, dikey ve yatay yerleşim", () => {
  const order = ["a", "b", "c"], edges = effectiveEdges(order, []);
  const st = levelStatuses(order, edges, "a", ["a"]);
  const levels = order.map((id, i) => ({ map: { x: 100 + i * 100, y: 200 } }));
  const lay = mapPoints(levels);
  assert.equal(lay.useVia, true);
  const g = buildMapGraph(order, edges, st, lay.pts, lay.useVia);
  assert.deepEqual(g.nodes.map((n) => n.status), ["completed", "available", "locked"]);
  assert.deepEqual(g.links.map((l) => l.state), ["open", "locked"]);
  assert.ok(g.links.every((l) => l.d.startsWith("M") && l.d.includes("C")));
  const p = mapPoints(levels, { portrait: true });
  assert.equal(p.useVia, false);
  assert.ok(p.pts[0].y > p.pts[2].y); // bölüm 1 altta
  const ser = mapPoints([{}, {}, {}, {}]);
  assert.equal(ser.pts.length, 4);
});
