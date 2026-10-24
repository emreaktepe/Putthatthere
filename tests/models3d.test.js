// 3B düşman/eşlikçi modelleri (js/render/models, Core6 Pro paketi) sözleşme testleri + oyun tarafı yapıştırıcı (enemyvis.js).
// Tarayıcıda importmap'ten gelen "three", Node'da vendor/ dosyasına yönlendirilir; modeller canvas ışıma dokusu için document ister: taklit edilir.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const vendor = pathToFileURL(new URL("../vendor/three.module.min.js", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")).href;
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s, c, n) { if (s === "three") return { url: ${JSON.stringify(vendor)}, shortCircuit: true }; return n(s, c); }`));
const noop = () => {};
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ createRadialGradient: () => ({ addColorStop: noop }), fillRect: noop, fillStyle: "" }) }) };

const THREE = await import("three");
const { createGhost } = await import("../js/render/models/ghost.js");
const { createBat } = await import("../js/render/models/bat.js");
const { createGolem } = await import("../js/render/models/golem.js");
const { createBoss } = await import("../js/render/models/boss.js");
const { createPiril } = await import("../js/render/models/piril.js");
const { ENEMY_VIS, DEATH_TIME, deathScale, drawCalls, enemyMode, prepareVisual } = await import("../js/render/enemyvis.js");
const { MODEL_KINDS } = await import("../js/config/registry.js");
const cfg = JSON.parse(readFileSync(new URL("../data/game.config.json", import.meta.url)));

const MODES = ["idle", "walk", "windup", "attack", "hurt", "dead"];
const MODELS = {
  ghost: { make: createGhost, tris: 3000 },
  bat: { make: createBat, tris: 3000 },
  golem: { make: createGolem, tris: 6000 },
  boss: { make: createBoss, tris: 25000 },
  piril: { make: createPiril, tris: 2000 },
};
const tris = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; }); return n; };
const allFinite = (g) => { let ok = true; g.traverse((o) => { for (const v of [o.position, o.scale, o.rotation]) if (!Number.isFinite(v.x + v.y + v.z)) ok = false; if (o.material && "opacity" in o.material && !Number.isFinite(o.material.opacity)) ok = false; }); return ok; };

for (const [id, { make, tris: budget }] of Object.entries(MODELS)) {
  test(`${id}: sözleşme (group/update/setTint/dispose/parts/stats) ve üçgen bütçesi`, () => {
    const v = make({ scale: 1, color: 0x88aacc });
    assert.ok(v.group.isGroup);
    for (const f of ["update", "setTint", "dispose"]) assert.equal(typeof v[f], "function", f);
    assert.ok(v.parts && v.stats);
    assert.ok(tris(v.group) <= budget, `${id} üçgen ${tris(v.group)} > ${budget}`);
    assert.equal(v.stats.triangles, tris(v.group));
    v.dispose();
  });

  test(`${id}: tüm modlarda update NaN üretmez, setTint güvenli`, () => {
    const v = make({ scale: 1 });
    for (const m of MODES) for (let t = 0; t < 3; t += 0.37) { v.update(t, 0.016, m); assert.ok(allFinite(v.group), `${id}/${m}`); }
    v.update(5, 0, "bilinmeyen"); assert.ok(allFinite(v.group));
    v.setTint(0xffffff, 0.75); v.setTint(0x9fdcff, 0.5); v.setTint(0xffffff, 0);
    v.dispose();
  });

  test(`${id}: sahnede ışık yok`, () => {
    const v = make({ scale: 1 });
    let lights = 0; v.group.traverse((o) => { if (o.isLight) lights++; });
    assert.equal(lights, 0);
    v.dispose();
  });

  test(`${id}: dispose iki kez güvenli, paylaşımlı geometriye dokunmaz`, () => {
    const a = make({ scale: 1 }), b = make({ scale: 1 });
    const geoA = new Set(), geoB = new Set();
    a.group.traverse((o) => o.geometry && geoA.add(o.geometry));
    b.group.traverse((o) => o.geometry && geoB.add(o.geometry));
    const disposed = new Set();
    for (const g of [...geoA, ...geoB]) g.addEventListener("dispose", () => disposed.add(g));
    const scene = new THREE.Scene(); scene.add(a.group);
    a.dispose(); a.dispose();
    assert.equal(a.group.parent, null);
    for (const g of geoA) if (geoB.has(g)) assert.ok(!disposed.has(g), "paylaşımlı geometri dispose edildi (diğer örnek bozulur)");
    assert.ok(disposed.size > 0, "kişiye özel geometri bırakılmadı");
    b.dispose(); b.dispose();
  });
}

test("boss: setPhase kalkanı yalnız faz 3'te gösterir", () => {
  const v = createBoss({ scale: 1 });
  for (const [p, vis] of [[1, false], [2, false], [3, true], [2, false]]) { v.setPhase(p); assert.equal(v.parts.shield.visible, vis, `faz ${p}`); }
  v.setPhase(99); assert.equal(v.getPhase(), 3);
  v.dispose();
});

test("ENEMY_VIS: dört model, config r/y ile uyumlu ve kayıtlı model türü", () => {
  assert.deepEqual(Object.keys(ENEMY_VIS).sort(), ["bat", "boss", "ghost", "golem"]);
  for (const [id, s] of Object.entries(ENEMY_VIS)) {
    assert.ok(MODEL_KINDS.includes(id));
    assert.ok(cfg.enemies[id].r > 0 && cfg.enemies[id].y > 0);
    const v = s.create({ scale: 1, color: 0x808080 });
    v.group.updateMatrixWorld(true);
    const box = new THREE.Box3(); v.group.traverse((o) => { if (o.isMesh) box.expandByObject(o); }); // yalnız mesh (sprite hale hariç)
    const h = (box.max.y - box.min.y) * s.scale, r = cfg.enemies[id].r;
    // görsel boy / yarıçap oranı makul (çarpışma d.r ile sabit; görsel hit alanından çok küçük/büyük olmasın)
    assert.ok(h / r > 1.4 && h / r < 3.5, `${id}: boy ${h.toFixed(2)}, r ${r}`);
    assert.ok(box.min.y < s.cy && box.max.y > s.cy, `${id}: cy modelin içinde olmalı`);
    v.dispose();
  }
});

test("prepareVisual: receiveShadow kapalı, castShadow yalnız boss'ta", () => {
  for (const id of ["ghost", "golem", "boss"]) {
    const v = ENEMY_VIS[id].create({ scale: 1 });
    prepareVisual(v, ENEMY_VIS[id]);
    let cast = 0; v.group.traverse((o) => { if (o.isMesh) { assert.equal(o.receiveShadow, false); if (o.castShadow) cast++; } });
    assert.equal(cast > 0, ENEMY_VIS[id].shadow, id);
    v.dispose();
  }
});

test("enemyMode: öncelik ölüm > vuruş > saldırı > uyarı > hareket", () => {
  assert.equal(enemyMode({ moving: true }), "walk");
  assert.equal(enemyMode({ moving: false }), "idle");
  assert.equal(enemyMode({ windT: 1, moving: true }), "windup");
  assert.equal(enemyMode({ windT: 1, atkT: 0.2 }), "attack");
  assert.equal(enemyMode({ windT: 1, atkT: 0.2, hurtT: 0.1 }), "hurt");
  assert.equal(enemyMode({ windT: 1, atkT: 0.2, hurtT: 0.1, dying: true }), "dead");
});

test("deathScale: 1'den 0'a, sınırlı", () => {
  assert.equal(deathScale(0), 1);
  assert.equal(deathScale(DEATH_TIME), 0);
  assert.equal(deathScale(DEATH_TIME * 2), 0);
  assert.ok(deathScale(DEATH_TIME / 2) > 0 && deathScale(DEATH_TIME / 2) < 1);
  assert.equal(deathScale(-1), 1);
});

test("çizim yükü: model başına çizim çağrısı sınırı ve en kalabalık bölüm tahmini", () => {
  const per = {};
  for (const id of ["ghost", "bat", "golem", "boss"]) {
    const v = ENEMY_VIS[id].create({ scale: 1 });
    prepareVisual(v, ENEMY_VIS[id]);
    per[id] = { draw: drawCalls(v.group), meshes: v.stats.meshes, tris: v.stats.triangles, shadowPass: ENEMY_VIS[id].shadow ? 1 : 0 };
    v.dispose();
  }
  assert.ok(per.ghost.draw <= 20 && per.bat.draw <= 20 && per.golem.draw <= 30 && per.boss.draw <= 45, JSON.stringify(per));
  // en kalabalık bölüm: en büyük cap'li bölümün başlangıç karışımı + spawn en kötü durumu
  const cap = Math.max(...Object.values(cfg.levels).map((l) => l.cap || 0));
  const worst = Math.max(per.ghost.draw, per.bat.draw, per.golem.draw);
  const total = cap * worst + per.boss.draw * 2; // üst sınır: cap kadar en ağır küçük/orta düşman + 2 boss-sınıfı
  console.log("[cizim-yuku]", JSON.stringify(per), "cap", cap, "ust-sinir-cagri", total);
  assert.ok(total < 600);
});
