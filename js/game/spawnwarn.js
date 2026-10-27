// Doğma uyarı halkası (Aşama C, §7.5): doğal doğuşlarda düşman, yerde 0.5 sn halka göründükten sonra çıkar. Bölüm başındaki ilk dizilim ve
// becerilerin/boss'un doğurduğu düşmanlar (doğrudan spawnEnemy) etkilenmez. Kuyruktaki düşman cap'e SAYILIR (pending).
import { ENEMIES } from "../core/data.js";
import { ARENA } from "../core/util.js";
import { wizard } from "../render/wizard.js";
import { resetCombatFx, spawnRing } from "../render/combatfx.js";
import { SPAWN_WARN, drainSpawnQueue, pickWarnedSpawnPoint } from "./spawnmath.js";
import { FX } from "./fxsettings.js";
import { spawnEnemy } from "./world.js";

const q = [], due = [];
export const pendingSpawns = () => q.length;
export function queueSpawn(type) {
  const p = pickWarnedSpawnPoint(wizard.position, Math.random, ARENA), d = ENEMIES[type];
  if (!d || !spawnRing(p.x, p.z, d.color, SPAWN_WARN, FX.spawnRings)) { spawnEnemy(type); return; } // halka havuzu dolu: anında
  q.push({ type, x: p.x, z: p.z, t: SPAWN_WARN });
}
export function tickSpawns(dt) {
  if (!q.length) return;
  for (let i = 0, n = drainSpawnQueue(q, dt, due); i < n; i++) spawnEnemy(due[i].type, { x: due[i].x, z: due[i].z });
}
export function resetSpawns() { q.length = 0; due.length = 0; resetCombatFx(); }
