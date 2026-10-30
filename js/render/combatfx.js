// Savaş geri bildirimi görselleri (Aşama C): ölüm halkası ve doğma uyarı halkası. Hepsi HAVUZDUR: sahnede kalıcı küçük mesh'ler,
// yalnızca görünürlük/ölçek/renk değişir (her karede ve olayda yeni nesne üretilmez). Çizim çağrısı: yalnızca görünür olanlar (en çok 2 + 3).
import * as THREE from "three";
import { ringUnit } from "./fx.js";
import { scene } from "./scene.js";

const mk = (op) => {
  const m = new THREE.Mesh(ringUnit, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m);
  return m;
};
const DEATH_MAX = 2, SPAWN_MAX = 3;
const deaths = Array.from({ length: DEATH_MAX }, () => ({ m: mk(0.7), t: 0, life: 0.4, r1: 1.8 }));
const spawns = Array.from({ length: SPAWN_MAX }, () => ({ m: mk(0.9), t: 0, dur: 0.5, r: 1.2, on: false }));
let deathHead = 0;

// ölüm halkası: düşman rengi, hızla genişleyip solar
export function deathRing(x, z, color, r1 = 1.8) {
  const s = deaths[deathHead]; deathHead = (deathHead + 1) % DEATH_MAX;
  s.t = s.life = 0.4; s.r1 = r1;
  s.m.material.color.setHex(color); s.m.position.set(x, 0.12, z); s.m.scale.setScalar(0.3); s.m.visible = true;
}

// doğma uyarı halkası: dur sn içinde küçülerek belirir; max'tan fazla eşzamanlı olmaz (dolu ise false)
export function spawnRing(x, z, color, dur = 0.5, max = SPAWN_MAX) {
  let live = 0;
  for (const s of spawns) if (s.on) live++;
  if (live >= max) return false;
  const s = spawns.find((q) => !q.on);
  if (!s) return false;
  s.on = true; s.t = s.dur = dur; s.r = 1.3;
  s.m.material.color.setHex(color); s.m.position.set(x, 0.1, z); s.m.scale.setScalar(s.r * 1.8); s.m.visible = true;
  return true;
}
export const spawnRingsLive = () => spawns.reduce((n, s) => n + (s.on ? 1 : 0), 0);

export function tickCombatFx(dt) {
  for (const s of deaths) {
    if (!s.m.visible) continue;
    s.t -= dt;
    if (s.t <= 0) { s.m.visible = false; continue; }
    const k = 1 - s.t / s.life;
    s.m.scale.setScalar(0.3 + (s.r1 - 0.3) * k); s.m.material.opacity = 0.7 * (1 - k);
  }
  for (const s of spawns) {
    if (!s.on) continue;
    s.t -= dt;
    if (s.t <= 0) { s.on = false; s.m.visible = false; continue; }
    const k = 1 - s.t / s.dur; // 0 -> 1: halka küçülür, parlaklık artar
    s.m.scale.setScalar(s.r * (1.8 - 0.8 * k)); s.m.material.opacity = 0.35 + 0.55 * k;
  }
}
export function resetCombatFx() {
  for (const s of deaths) s.m.visible = false;
  for (const s of spawns) { s.on = false; s.m.visible = false; }
}
