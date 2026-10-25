// Menü, harita, bölüm kartı ve bölüm sonu saf modelleri: menü kartı verisi, kariyer sayaçları, harita paneli çipleri, skor satırları, nadirlik.
import test from "node:test";
import assert from "node:assert/strict";
import { RARITY_LABEL, careerStats, continueCardModel, countValue, foeIdsOf, perkRarity, rewardStat, mapLayout, mapView, scoreRows, sheetModel, SHEET_MAX_PCT, scrollForNode, sheetLayout } from "../js/ui/models.js";

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

test("sheetLayout: varsayılan kompakt (en çok %32), Detay ile genişler (en çok %55); detayı olmayan kart kompakt kalır", () => {
  assert.deepEqual(sheetLayout(), { expanded: false, maxPct: 32 });
  assert.deepEqual(sheetLayout({ expanded: true }), { expanded: true, maxPct: 55 });
  assert.deepEqual(sheetLayout({ expanded: true, canExpand: false }), { expanded: false, maxPct: SHEET_MAX_PCT.compact });
  assert.ok(SHEET_MAX_PCT.compact <= 32 && SHEET_MAX_PCT.expanded <= 55);
});

test("scrollForNode: seçili düğüm kartın üstündeki görünür alanda; sınır 0", () => {
  // görünür alan 800, kart 200 -> 600; düğüm 1000'de, %42 hedef -> 1000 - 252
  assert.equal(scrollForNode({ nodeY: 1000, viewH: 800, sheetH: 200 }), 748);
  assert.equal(scrollForNode({ nodeY: 100, viewH: 800, sheetH: 200 }), 0);
  assert.equal(scrollForNode({ nodeY: 500, viewH: 600, sheetH: 0, at: 0.5 }), 200);
  assert.equal(scrollForNode({ nodeY: 500, viewH: 600, sheetH: 900 }), 500); // kart görünür alandan büyükse düğüm en üste
  assert.equal(scrollForNode(), 0);
});

test("mapLayout: portrait / landscape-phone / tablet / wide ve panel genişliği", () => {
  assert.equal(mapLayout(414, 896).mode, "portrait");
  assert.equal(mapLayout(844, 390).mode, "landscape-phone");
  assert.equal(mapLayout(667, 375).mode, "landscape-phone");
  assert.equal(mapLayout(1024, 600).mode, "tablet");
  const t = mapLayout(1024, 768);
  assert.equal(t.mode, "tablet"); assert.ok(t.twoCol && t.panelW >= 320 && t.panelW <= 360);
  for (const [w, h] of [[1912, 910], [1440, 900], [1280, 720], [1100, 600]]) {
    const l = mapLayout(w, h);
    assert.equal(l.mode, "wide"); assert.ok(l.twoCol && l.panelW >= 340 && l.panelW <= 440, `${w}x${h}: ${l.panelW}`);
  }
  assert.equal(mapLayout(1912, 910).panelW, 440);
  assert.equal(mapLayout(1100, 700).panelW, 340);
  assert.equal(mapLayout(844, 390).twoCol, false);
});

test("mapView: sütunu doldurur ama düğümleri kırpmaz; oran korunur", () => {
  const items = [{ x: 645, y: 109, l: 48, r: 48, t: 48, b: 48 }, { x: 577, y: 547, l: 48, r: 48, t: 48, b: 48 }, { x: 884, y: 167, l: 48, r: 48, t: 48, b: 48 }, { x: 201, y: 520, l: 48, r: 48, t: 48, b: 48 }];
  for (const [cw, ch] of [[1472, 860], [684, 718], [900, 500], [1000, 700]]) {
    const v = mapView(cw, ch, 1000, 700, items);
    assert.ok(Math.abs(v.w / v.h - cw / ch) < 1e-6, "oran");
    for (const p of items) {
      assert.ok(p.x - p.l >= v.x - 1e-6 && p.x + p.r <= v.x + v.w + 1e-6, `x ${cw}x${ch}`);
      assert.ok(p.y - p.t >= v.y - 1e-6 && p.y + p.b <= v.y + v.h + 1e-6, `y ${cw}x${ch}`);
    }
  }
  const wide = mapView(1472, 860, 1000, 700, items);
  assert.ok(wide.scale > 1000 / 1000 && wide.x >= 0 && wide.x + wide.w <= 1000 + 1e-6);
  assert.equal(mapView(1000, 700, 1000, 700, items).scale, 1);
});
