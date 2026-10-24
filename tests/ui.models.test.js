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

test("portraitOf: portrait yolu yalnızca karakterde varsa döner", () => {
  const ch = { a: { name: "Aldemir", icon: "🧙", portrait: "assets/art/portre-aldemir.webp" } };
  assert.equal(portraitOf(ch, "Aldemir").portrait, "assets/art/portre-aldemir.webp");
  assert.equal("portrait" in portraitOf(ch, "Yok"), false);
});

import { heartPair, pickArt } from "../js/ui/art.js";
import { adapt } from "../js/config/adapt.js";
import { validate } from "../js/config/validate.js";
import fs from "node:fs";

test("pickArt: küçük sürüm varsa küçük slotta o, yoksa büyük görsel; geçersiz/boş yol null", () => {
  const w = { image: "assets/art/ikon-buyu-fire.webp" };
  const a = { image: "assets/art/ikon-yetenek-blink.webp", imageSmall: "assets/art/ikon-yetenek-blink-128.webp" };
  assert.equal(pickArt(w, true), w.image);
  assert.equal(pickArt(a, true), a.imageSmall);
  assert.equal(pickArt(a, false), a.image);
  assert.equal(pickArt({ imageSmall: a.imageSmall }, false), null);
  assert.equal(pickArt({ image: "https://evil.example/a.webp" }, true), null);
  assert.equal(pickArt({ icon: "🔥" }, true), null);
  assert.equal(pickArt(null), null);
});

test("heartPair: yalnızca iki görsel de geçerliyse kullanılır (yoksa SVG kalpler)", () => {
  assert.deepEqual(heartPair({ heartFull: "assets/art/a.webp", heartEmpty: "assets/art/b.webp" }), { full: "assets/art/a.webp", empty: "assets/art/b.webp" });
  assert.equal(heartPair({ heartFull: "assets/art/a.webp" }), null);
  assert.equal(heartPair({ heartFull: "assets/art/a.webp", heartEmpty: "http://x/b.webp" }), null);
  assert.equal(heartPair({}), null);
  assert.equal(heartPair(undefined), null);
});

test("adapt: görsel alanları çalışma zamanı verisine geçer; yoksa alan eklenmez", () => {
  const base = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
  base.perks.hp.image = "assets/art/ikon-perk-hp.webp"; base.enemies.ghost.image = "assets/art/dusman-ghost.webp";
  base.levels.forest.image = "assets/art/bolum-forest.webp"; base.levels.forest.nodeImage = "assets/art/dugum-forest.webp";
  base.ui = { icons: { camera: "assets/art/ui-kamera.webp" } };
  const A = adapt(validate(base).sanitized);
  assert.equal(A.WEAPONS.fire.image, "assets/art/ikon-buyu-fire.webp");
  assert.equal(A.ABILITIES.blink.imageSmall, "assets/art/ikon-yetenek-blink-128.webp");
  assert.equal(A.PERKS[0].image, "assets/art/ikon-perk-hp.webp");
  assert.equal(A.ENEMIES.ghost.image, "assets/art/dusman-ghost.webp");
  assert.equal(A.LEVELS[0].image, "assets/art/bolum-forest.webp");
  assert.equal(A.LEVELS[0].nodeImage, "assets/art/dugum-forest.webp");
  assert.deepEqual(A.UI_ICONS, { camera: "assets/art/ui-kamera.webp" });
  const B = adapt(validate(JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"))).sanitized);
  assert.equal("image" in B.PERKS[0], false); assert.equal("image" in B.ENEMIES.ghost, false); assert.equal("image" in B.LEVELS[0], false);
  assert.deepEqual(B.UI_ICONS, {});
});
