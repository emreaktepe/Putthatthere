import * as THREE from "three";
import { sfx } from "../audio/engine.js";
import { bolts, clouds, fxs, hazards } from "../core/state.js";
import { rand } from "../core/util.js";
import { glowSprite, glowTex, mat } from "./gfx.js";
import { scene } from "./scene.js";

export const crystalGeo = new THREE.OctahedronGeometry(0.5);
export const crystalMat = mat({ color: 0x5ee7ff, emissive: 0x1b9ec2, emissiveIntensity: 1.2, roughness: 0.2 });
export const heartGeo = new THREE.IcosahedronGeometry(0.45);
export const heartMat = mat({ color: 0xff3b5c, emissive: 0xa00828, emissiveIntensity: 1.3, roughness: 0.3 });
export const lightGeo = new THREE.OctahedronGeometry(0.55);
export const lightMat = mat({ color: 0xfff6c8, emissive: 0xffd86a, emissiveIntensity: 1.6, roughness: 0.2 });
export const PICKUP_LOOK = { crystal: [crystalGeo, crystalMat], heart: [heartGeo, heartMat], light: [lightGeo, lightMat] };

export const projGeo = new THREE.SphereGeometry(0.25, 12, 10);
export const shotMats = new Map();
export const shotMat = (c) => { if (!shotMats.has(c)) shotMats.set(c, new THREE.MeshBasicMaterial({ color: c })); return shotMats.get(c); };
export const eShotMat = new THREE.MeshBasicMaterial({ color: 0xe8f0ff });
export const ringUnit = new THREE.RingGeometry(0.9, 1, 48);
export const discUnit = new THREE.CircleGeometry(1, 40);
export const shieldGeo = new THREE.SphereGeometry(1.3, 14, 10);
export const meteorGeo = new THREE.SphereGeometry(0.7, 12, 10);
// mermi: çekirdek + additive hale (mermi başına ışık yok); donma okunda uzamış çekirdek
export function makeShot(color, kind) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(projGeo, shotMat(color));
  if (kind === "frost") core.scale.set(0.55, 0.55, 2.0);
  g.add(core, glowSprite(color, kind === "frost" ? 1.4 : 1.8, 0.85));
  return g;
}
// Kıvılcım havuzu: tek Points, sabit sayıda parçacık (yeni mesh üretilmez); parçacık başına ömür
export const MAX_SPARKS = 480;
export const sparkPos = new Float32Array(MAX_SPARKS * 3);
export const sparkCol = new Float32Array(MAX_SPARKS * 3);
export const sparkBase = new Float32Array(MAX_SPARKS * 3);
export const sparkVel = new Float32Array(MAX_SPARKS * 3);
export const sparkLife = new Float32Array(MAX_SPARKS);
export const sparkMax = new Float32Array(MAX_SPARKS).fill(0.6);
export let sparkHead = 0;
export const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3).setUsage(THREE.DynamicDrawUsage));
sparkGeo.setAttribute("color", new THREE.BufferAttribute(sparkCol, 3).setUsage(THREE.DynamicDrawUsage));
export const sparkPoints = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ size: 0.4, map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
sparkPoints.frustumCulled = false;
scene.add(sparkPoints);
export function resetSparks() { sparkLife.fill(0); sparkPos.fill(0); for (let i = 0; i < MAX_SPARKS; i++) sparkPos[i * 3 + 1] = -100; sparkCol.fill(0); sparkGeo.attributes.position.needsUpdate = sparkGeo.attributes.color.needsUpdate = true; }
resetSparks();
export const _c = new THREE.Color();
export function emit(pos, color, n = 10, speed = 4, life = 0.6) {
  _c.setHex(color);
  for (let i = 0; i < n; i++) {
    const k = sparkHead; sparkHead = (sparkHead + 1) % MAX_SPARKS;
    sparkPos[k * 3] = pos.x; sparkPos[k * 3 + 1] = pos.y; sparkPos[k * 3 + 2] = pos.z;
    sparkVel[k * 3] = rand(speed); sparkVel[k * 3 + 1] = Math.random() * speed; sparkVel[k * 3 + 2] = rand(speed);
    sparkBase[k * 3] = _c.r; sparkBase[k * 3 + 1] = _c.g; sparkBase[k * 3 + 2] = _c.b;
    sparkLife[k] = sparkMax[k] = life;
  }
}
export const burst = (pos, color, n = 10) => emit(pos, color, n, 4, 0.6);
export function updateSparks(dt) {
  for (let k = 0; k < MAX_SPARKS; k++) {
    if (sparkLife[k] <= 0) continue;
    sparkLife[k] -= dt;
    const i = k * 3;
    if (sparkLife[k] <= 0) { sparkPos[i + 1] = -100; sparkCol[i] = sparkCol[i + 1] = sparkCol[i + 2] = 0; continue; }
    sparkPos[i] += sparkVel[i] * dt; sparkPos[i + 1] += sparkVel[i + 1] * dt; sparkPos[i + 2] += sparkVel[i + 2] * dt;
    sparkVel[i + 1] -= 9 * dt;
    const f = sparkLife[k] / sparkMax[k];
    sparkCol[i] = sparkBase[i] * f; sparkCol[i + 1] = sparkBase[i + 1] * f; sparkCol[i + 2] = sparkBase[i + 2] * f;
  }
  sparkGeo.attributes.position.needsUpdate = sparkGeo.attributes.color.needsUpdate = true;
}
// Şimşek: titrek (zigzag) çizgi, iki katman (renkli + beyaz çekirdek) ve uçta kıvılcım
export function addBolt(a, b, color) {
  for (let k = 0; k < 2; k++) {
    const pts = [a.clone()], n = 7, jit = k ? 0.15 : 0.35;
    for (let i = 1; i < n; i++) pts.push(a.clone().lerp(b, i / n).add(new THREE.Vector3(rand(jit), rand(jit), rand(jit))));
    pts.push(b.clone());
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: k ? 0xffffff : color, transparent: true }));
    line.userData.life = 0.18;
    scene.add(line);
    bolts.push(line);
  }
  emit(b, color, 4, 3, 0.3);
}

// Yer işareti: delay sonunda r yarıçapında hasar (dmg 0 ise yalnızca işaret). real=true ise zaman yavaşlamasından etkilenmez.
export function addHazard(x, z, r, delay, dmg, color, real = false) {
  const g = new THREE.Group();
  const rm = new THREE.Mesh(ringUnit, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  const fill = new THREE.Mesh(discUnit, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
  rm.rotation.x = fill.rotation.x = -Math.PI / 2;
  rm.scale.setScalar(r);
  fill.scale.setScalar(0.01);
  g.position.set(x, 0.05, z);
  g.add(rm, fill);
  scene.add(g);
  hazards.push({ x, z, r, t: delay, dur: delay, dmg, g, fill, mats: [rm.material, fill.material], real });
  if (dmg > 0) sfx("telegraph");
}
export function dropHazard(h) { scene.remove(h.g); h.mats.forEach((m) => m.dispose()); }

// Genişleyen halka efekti
export function addFx(x, z, color, r0, r1, life, y = 0.1) {
  const m = new THREE.Mesh(ringUnit, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.scale.setScalar(r0);
  scene.add(m);
  fxs.push({ m, t: life, life, r0, r1 });
}

export const cloudGeo = new THREE.SphereGeometry(1, 14, 8);
export function addCloud(x, z, dmg, o) {
  const m = new THREE.Mesh(cloudGeo, new THREE.MeshBasicMaterial({ color: 0x6bff6b, transparent: true, opacity: 0.28, depthWrite: false }));
  m.scale.set(o.r, 0.9, o.r);
  m.position.set(x, 0.6, z);
  scene.add(m);
  clouds.push({ x, z, r: o.r, life: o.life, tick: 0.5, dmg, m });
}

export function removeObj(o) {
  scene.remove(o);
  if (o.isLine) { o.geometry.dispose(); o.material.dispose(); }
}
