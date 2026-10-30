import * as THREE from "three";
import { ENEMIES } from "../core/data.js";
import { RT, bolts, clouds, echoQ, enemies, enemyShots, fxs, hazards, pickups, shots, strikes } from "../core/state.js";
import { ARENA, rand } from "../core/util.js";
import { wizard } from "../render/wizard.js";
import { pickCrystalPoint, pickSpawnPointNear } from "./spawnmath.js";
import { initEnemySkills, resetSkills } from "./skillrun.js";
import { resetHazards } from "./hazardrun.js";
import { resetCombatFx } from "../render/combatfx.js";
import { WEAPONS } from "../core/data.js";
import { ELEMENTS } from "../config/registry.js";
import { weakElements } from "./matchup.js";
import { BLOB_GEO, BLOB_MAT, blobMatFor, buildEnemy, clearDying, disposeEnemy } from "../render/enemies.js";
import { PICKUP_LOOK, burst, dropHazard, removeObj, resetSparks } from "../render/fx.js";
import { glowSprite } from "../render/gfx.js";
import { scene } from "../render/scene.js";

export function placePickup(type, pos) {
  const [g, m] = PICKUP_LOOK[type];
  const mesh = new THREE.Mesh(g, m);
  mesh.position.copy(pos);
  mesh.castShadow = true;
  mesh.add(glowSprite(m.color.getHex(), type === "heart" ? 2 : 2.6, 0.9)); // sahte bloom
  scene.add(mesh);
  pickups.push({ mesh, type });
}
// lure (K3): yeni kristal, yaşayan bir düşmana en yakın aday noktada çıkar (kristale gitmek = düşmana yaklaşmak)
export function spawnCrystal(lure = false) {
  const foes = lure ? enemies.filter((e) => !e.d.static).map((e) => ({ x: e.mesh.position.x, z: e.mesh.position.z })) : [];
  const q = pickCrystalPoint(wizard.position, foes, Math.random, ARENA - 1.5, lure);
  placePickup("crystal", new THREE.Vector3(q.x, 0.9, q.z));
}
// düşmanın en zayıf olduğu elementin silah rengi (kontak gölgesi tonu); yoksa null. Tür başına bir kez hesaplanır.
const weakColor = {};
function weakColorOf(type, d) {
  if (weakColor[type] !== undefined) return weakColor[type];
  const els = weakElements(ELEMENTS, d.tags, d.res), w = Object.values(WEAPONS).find((x) => x.element === els[0]);
  return (weakColor[type] = els.length && w ? w.color : null);
}
export const spawnLights = () => { for (let i = 0; i < 3; i++) placePickup("light", new THREE.Vector3(rand(ARENA - 2.5), 0.9, rand(ARENA - 2.5))); };
export const liveCount = () => enemies.reduce((n, e) => n + (e.d.noCap ? 0 : 1), 0);

export function spawnEnemy(type, at) {
  const d = ENEMIES[type];
  const { obj, mat: m, base, anim, baked, vis, shieldK } = buildEnemy(type);
  if (at) obj.position.set(at.x, d.y, at.z);
  else {
    const sp = pickSpawnPointNear(wizard.position, Math.random, ARENA); // oyuncudan >= 6.5 birim, halka 9-14 arası (daha çabuk temas; plan B7 koruması sürer)
    obj.position.set(sp.x, d.y, sp.z);
  }
  obj.scale.setScalar(0.001); // belirme animasyonu applyLook içinde büyür
  scene.add(obj);
  const e = {
    mesh: obj, mat: m, base, type, d, hp: d.hp, maxHp: d.hp, slow: 0, phase: Math.random() * 10, spd: d.speed,
    shield: 0, dead: false, st: "approach", tm: 0, cd: 0, fuse: 0,
    anim, baked, vis, shieldK, tintKey: -1, ts: 1, moving: false, dying: false, hurtT: 0, atkT: 0, windT: 0, age: 0, flash: 0, kx: 0, kz: 0, blob: null, iceG: null,
  };
  if (d.ai !== "boss" && d.ai !== "knight") { // kontakt gölgesi: gerçek gölge yerine yumuşak daire
    e.blob = new THREE.Mesh(BLOB_GEO, BLOB_MAT);
    e.blob.scale.setScalar(d.r * 2.4);
    e.blob.position.set(obj.position.x, 0.04, obj.position.z);
    const wc = weakColorOf(type, d);
    if (wc !== null) e.blob.material = blobMatFor(wc); // zayıf element ipucu: gölge o elementin rengine hafif tonlanır
    scene.add(e.blob);
  }
  burst(obj.position, d.color, 6);
  if (d.ai === "ranged") e.cd = 1 + Math.random() * 1.5;
  if (d.ai === "support") e.cd = 2 + Math.random() * 2;
  if (d.ai === "static") e.cd = 12;
  if (d.ai === "knight") { e.cd = 4; e.wind = 0; e.enraged = false; }
  if (d.ai === "boss") { e.bp = 1; e.shielded = false; e.vuln = 0; e.waveT = 8; }
  initEnemySkills(e);
  enemies.push(e);
  if (d.ai === "boss" || d.ai === "knight") RT.bossRef = e;
  return e;
}
export function clearWorld() {
  [...pickups.map((p) => p.mesh), ...enemies.map((e) => e.mesh), ...shots.map((s) => s.mesh), ...enemyShots.map((s) => s.mesh), ...bolts, ...clouds.map((c) => c.m), ...strikes.map((s) => s.ball), ...fxs.map((f) => f.m)].forEach(removeObj);
  hazards.forEach(dropHazard);
  clouds.forEach((c) => c.m.material.dispose());
  fxs.forEach((f) => f.m.material.dispose());
  strikes.forEach((s) => s.ball.material.dispose());
  enemies.forEach((e) => { disposeEnemy(e); if (e.blob) scene.remove(e.blob); });
  pickups.length = enemies.length = shots.length = enemyShots.length = bolts.length = hazards.length = clouds.length = strikes.length = fxs.length = echoQ.length = 0;
  clearDying();
  resetSkills();
  resetSparks();
  resetHazards(); resetCombatFx();
  RT.bossRef = null;
  RT.shieldT = RT.timeslowT = 0;
}
