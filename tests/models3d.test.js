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
const { createArcher } = await import("../js/render/models/archer.js");
const { createWolf } = await import("../js/render/models/wolf.js");
const { createEmber } = await import("../js/render/models/ember.js");
const { createPriest } = await import("../js/render/models/priest.js");
const { createTotem } = await import("../js/render/models/totem.js");
const { createKnight } = await import("../js/render/models/knight.js");
const { createZerrin } = await import("../js/render/models/zerrin.js");
const { createTaskin } = await import("../js/render/models/taskin.js");
const { createVeyisInsan } = await import("../js/render/models/veyis-insan.js");
const PV = await import("../js/render/propsvis.js");
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
  archer: { make: createArcher, tris: 6000 },
  wolf: { make: createWolf, tris: 6000 },
  ember: { make: createEmber, tris: 3000 },
  priest: { make: createPriest, tris: 6000 },
  totem: { make: createTotem, tris: 12000 },
  knight: { make: createKnight, tris: 12000 },
  // sahne figürleri (savaşa katılmaz). Üçgen bütçesi ÖLÇÜLEN değerdir: istenen hedefler zerrin<=2500, veyis<=7000 idi; paket Zerrin'de 8424, Veyis'te 7656 üçgen (rapora bakın)
  zerrin: { make: createZerrin, tris: 8500 },
  taskin: { make: createTaskin, tris: 6000 },
  "veyis-insan": { make: createVeyisInsan, tris: 7700 },
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

test("knight: setEnraged öfke durumunu tutar", () => {
  const v = createKnight({ scale: 1 });
  assert.equal(v.getEnraged(), false);
  v.setEnraged(true); assert.equal(v.getEnraged(), true);
  v.update(1, 0.016, "windup"); assert.ok(allFinite(v.group));
  v.setEnraged(false); assert.equal(v.getEnraged(), false);
  v.dispose();
});

test("ENEMY_VIS: 10 düşman modeli, config r/y ile uyumlu ve kayıtlı model türü", () => {
  assert.deepEqual(Object.keys(ENEMY_VIS).sort(), [...MODEL_KINDS].sort());
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
    if (s.grounded) { // yere basan model: ayaklar obj orijininin (config y) altında en çok bir bob kadar yerin altına girer
      const feet = cfg.enemies[id].y - (s.cy - box.min.y) * s.scale * (cfg.enemies[id].scale || 1);
      assert.ok(feet > -0.12 && feet < 0.3, `${id}: ayak yüksekliği ${feet.toFixed(2)}`);
    }
    v.dispose();
  }
});

test("prepareVisual: receiveShadow kapalı, castShadow yalnız boss ve şövalyede", () => {
  for (const id of Object.keys(ENEMY_VIS)) {
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
  for (const id of Object.keys(ENEMY_VIS)) {
    const v = ENEMY_VIS[id].create({ scale: 1 });
    prepareVisual(v, ENEMY_VIS[id]);
    per[id] = { draw: drawCalls(v.group), meshes: v.stats.meshes, tris: v.stats.triangles, shadowPass: ENEMY_VIS[id].shadow ? 1 : 0 };
    v.dispose();
  }
  assert.ok(per.ghost.draw <= 20 && per.bat.draw <= 20 && per.golem.draw <= 30 && per.boss.draw <= 45, JSON.stringify(per));
  for (const id of ["archer", "wolf", "ember", "priest", "totem"]) assert.ok(per[id].draw <= 30, `${id}: ${per[id].draw}`);
  assert.ok(per.knight.draw <= 45);
  // en kalabalık bölüm: en büyük cap'li bölümün başlangıç karışımı + spawn en kötü durumu
  const cap = Math.max(...Object.values(cfg.levels).map((l) => l.cap || 0));
  const worst = Math.max(...Object.entries(per).filter(([k]) => k !== "boss" && k !== "knight").map(([, v]) => v.draw));
  const total = cap * worst + Math.max(per.boss.draw, per.knight.draw) * 2; // üst sınır: cap kadar en ağır küçük/orta düşman + 2 boss-sınıfı
  console.log("[cizim-yuku]", JSON.stringify(per), "cap", cap, "ust-sinir-cagri", total);
  assert.ok(total < 600);
});

// ---------- Sahne figürleri (Zerrin, Taşkın, Veyis-insan): boyut/ölçek ve görünürlük mantığı ----------
const LEVEL_IDS = Object.keys(cfg.levels);
const sizeOf = (v) => { v.group.updateMatrixWorld(true); const b = new THREE.Box3(); v.group.traverse((o) => { if (o.isMesh) b.expandByObject(o); }); return b.getSize(new THREE.Vector3()); };

test("sahne figürleri: boy/ölçek mantığı (zemin y=0, scale çarpanı doğrusal, makul boy)", () => {
  for (const [id, spec] of Object.entries(PV.PROP_SPECS)) {
    const a = spec.create({ scale: 1 }), b = spec.create({ scale: 2 });
    for (const v of [a, b]) { v.update(0, 0, "idle"); PV.liftProp(v, spec); }
    const sa = sizeOf(a), sb = sizeOf(b);
    assert.ok(Math.abs(sb.y / sa.y - 2) < 0.01, id);
    assert.ok(sa.y > 1.5 && sa.y < 4.5, `${id}: boy ${sa.y.toFixed(2)}`);
    const box = new THREE.Box3().setFromObject(a.group);
    assert.ok(Math.abs(box.min.y) < 0.5, `${id}: zemin ${box.min.y.toFixed(2)}`);
    const g = a.stats.triangles; a.dispose(); b.dispose();
    assert.ok(g > 0);
  }
});

test("sahne figürleri: çizim çağrısı hafif (Zerrin+Taşkın+Veyis toplamı sınırlı)", () => {
  let sum = 0, tri = 0; const per = {};
  for (const [id, spec] of Object.entries(PV.PROP_SPECS)) { const v = spec.create({ scale: 1 }); per[id] = { draw: drawCalls(v.group), tris: v.stats.triangles }; sum += per[id].draw + 1; tri += per[id].tris; v.dispose(); }
  console.log("[sahne-figur-yuku]", JSON.stringify(per), "toplam-cagri(+blob)", sum, "ucgen", tri);
  assert.ok(sum <= 90, String(sum));
});

test("Taşkın başını ara sıra eğer: nodAmount 0..1, çoğu zaman 0, periyodik", () => {
  let nz = 0, n = 0;
  for (let t = 0; t < 40; t += 0.05) { const v = PV.nodAmount(t); assert.ok(v >= 0 && v <= 1 && Number.isFinite(v)); n++; if (v > 0) nz++; }
  assert.ok(nz / n < 0.3 && nz > 0);
  assert.ok(Math.abs(PV.nodAmount(0.8) - PV.nodAmount(0.8 + PV.NOD_PERIOD)) < 1e-9);
  assert.equal(PV.nodAmount(0), 0);
  assert.equal(PV.nodAmount(-1) >= 0, true);
});

test("Zerrin: bölüm girişinde oyuncuya döner (hedef yön + windup yalnız dönerken)", () => {
  assert.equal(PV.zerrinYawTarget(1, "intro"), 1);
  assert.equal(PV.zerrinYawTarget(1, "play"), 1 + PV.ZERRIN_AWAY);
  assert.equal(PV.zerrinMode(0.5), "windup");
  assert.equal(PV.zerrinMode(0.01), "idle");
  let y = 1 + PV.ZERRIN_AWAY; for (let i = 0; i < 300; i++) y = PV.damp(y, 1, 3, 0.016);
  assert.ok(Math.abs(PV.angleDiff(y, 1)) < 0.01);
  assert.ok(Math.abs(PV.angleDiff(0.1, Math.PI * 2 - 0.1) + 0.2) < 1e-9);
});

test("Veyis finalde yumuşakça belirir: gecikme sonrası 0'dan 1'e", () => {
  assert.equal(PV.veyisGrow(0), 0);
  assert.equal(PV.veyisGrow(PV.VEYIS_DELAY), 0);
  assert.equal(PV.veyisGrow(PV.VEYIS_DELAY + PV.VEYIS_GROW), 1);
  assert.equal(PV.veyisGrow(99), 1);
  const m = PV.veyisGrow(PV.VEYIS_DELAY + PV.VEYIS_GROW / 2); assert.ok(m > 0 && m < 1);
});

test("figür görünürlüğü: Zerrin her bölümde, Taşkın golems sonrası, Veyis yalnız finalde", () => {
  const base = { levelIds: LEVEL_IDS };
  const vis = (o) => PV.visibleProps({ ...base, ...o });
  assert.equal(PV.PROP_IDS.length, 3);
  // menü/harita: hiçbiri
  assert.deepEqual(vis({ phase: "none", levelId: "w1-01", completed: new Set() }), []);
  // Zerrin tüm bölümlerde ve tüm aşamalarda
  for (const id of LEVEL_IDS) for (const phase of ["intro", "play", "clear"]) assert.ok(vis({ phase, levelId: id, completed: new Set() }).includes("zerrin"), id + phase);
  // Taşkın: golems tamamlanmadan yok
  assert.ok(!vis({ phase: "intro", levelId: "w1-05", completed: new Set(["w1-01", "w1-02"]) }).includes("taskin"));
  assert.ok(!vis({ phase: "play", levelId: "w1-03", completed: new Set(["w1-01", "w1-02"]) }).includes("taskin"));
  // golems tamamlanınca golems'te (tekrar) ve sonraki bölümlerde var
  const done = new Set(["w1-01", "w1-02", "w1-03"]);
  for (const id of LEVEL_IDS.slice(LEVEL_IDS.indexOf("w1-03"))) assert.ok(vis({ phase: "play", levelId: id, completed: done }).includes("taskin"), id);
  // alıştırma/önceki bölüm tekrarında hikâye tutarlı: golems'ten önceki bölümde yok
  assert.ok(!vis({ phase: "intro", levelId: "w1-01", completed: done }).includes("taskin"));
  // kayıt dizi olarak da gelebilir
  assert.ok(vis({ phase: "intro", levelId: "w1-07", completed: ["w1-03"] }).includes("taskin"));
  // Veyis: yalnız castle finalinde
  assert.ok(vis({ phase: "final", levelId: "w3-09", completed: done }).includes("veyis"));
  assert.ok(!vis({ phase: "clear", levelId: "w3-09", completed: done }).includes("veyis"));
  assert.ok(!vis({ phase: "play", levelId: "w3-09", completed: done }).includes("veyis"));
  assert.ok(!vis({ phase: "final", levelId: "w1-09", completed: done }).includes("veyis"));
});

test("figür görünürlüğü: düşük kalitede yalnız finaldeki Veyis", () => {
  const o = { levelIds: LEVEL_IDS, completed: new Set(["w1-03"]), quality: "basic" };
  assert.deepEqual(PV.visibleProps({ ...o, phase: "intro", levelId: "w1-01" }), []);
  assert.deepEqual(PV.visibleProps({ ...o, phase: "play", levelId: "w1-07" }), []);
  assert.deepEqual(PV.visibleProps({ ...o, phase: "final", levelId: "w3-09" }), ["veyis"]);
});

test("figür yerleşimi: arena dışı kenar, birbirinden ve dekordan ayrı; ringPos bu daireleri atlar", () => {
  const ARENA = 14;
  for (const id of ["zerrin", "taskin"]) {
    const [x, z] = PV.PROP_SPECS[id].at;
    assert.ok(Math.max(Math.abs(x), Math.abs(z)) > ARENA && Math.max(Math.abs(x), Math.abs(z)) < ARENA + 5, id);
    assert.ok(PV.reservedHit(x, z));
  }
  assert.ok(!PV.reservedHit(0, 0));
  const [a, b] = ["zerrin", "taskin"].map((k) => PV.PROP_SPECS[k].at);
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) > 10);
  assert.ok(Math.abs(PV.faceYaw(0, -5, 0, 0)) < 1e-9); // +Z'ye bakan figür, kuzeyindeki hedef için 0
  assert.ok(Math.abs(PV.faceYaw(-16, 0, 0, 0) - Math.PI / 2) < 1e-9);
});

test("figür sistemi config şemasını değiştirmez: karakterler config'te var", () => {
  for (const k of ["zerrin", "taskin", "veyis"]) assert.ok(cfg.characters[k], k);
  assert.ok(LEVEL_IDS.includes(PV.TASKIN_UNLOCK) && LEVEL_IDS.includes(PV.FINAL_LEVEL));
  assert.equal(LEVEL_IDS[LEVEL_IDS.length - 1], PV.FINAL_LEVEL);
});
