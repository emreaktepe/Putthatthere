// Düşman becerilerinin oyun içi işleyişi (Aşama B). Saf kurallar/sayılar js/game/skills.js'tedir; burası yalnızca sahneye/duruma bağlar.
// Uyarılar HER ZAMAN okunur: uyarı süresince düşman "windup" modundadır (e.windT) ve yerde işaret halkası vardır (addHazard, en çok 3 eşzamanlı).
// Yeni model/animasyon YOK. Her karede yeni nesne üretilmez: işaret/halka yalnızca tetiklenince doğar; ateş lekeleri en çok 2'lik havuzdur.
import * as THREE from "three";
import { sfx } from "../audio/engine.js";
import { LEVELS, STRINGS } from "../core/data.js";
import { RT, S, enemies, hazards, moveDir } from "../core/state.js";
import { ARENA, flatDist } from "../core/util.js";
import { setVeil } from "../render/enemies.js";
import { addBolt, addFx, addHazard, burst, discUnit, dropHazard, ringUnit } from "../render/fx.js";
import { scene } from "../render/scene.js";
import { wizard } from "../render/wizard.js";
import { damagePlayer } from "./combat.js";
import { SKILLS, auraMul, canTrigger, emberChainVictims, initSkill, isOpen, isReviveCandidate, newSkills, onWindupEnd, pickReviveTarget, skillDamageMul, skillFor, tickCd, veilStep, volleyPoints } from "./skills.js";
import { liveCount, spawnEnemy } from "./world.js";

const COL = { danger: 0xff5544, bat: 0xb98bff, howl: 0xbfe9ff, revive: 0x6bff9a, ember: 0xff7a2a };
const PATCH_MAX = 2; // ateş lekesi havuzu (mobil: ek çizim çağrısı sınırı)
const marks = []; // canlı uyarı işaretleri (addHazard kayıtları); eşzamanlı sınır için sayılır
const dead = []; // diriltme adayları { type, x, z, t, used }
const rings = new Set(); // Lanet Alanı halkaları
const patches = []; // ateş lekesi havuzu { m, on, t, tick, x, z }
const seenHints = new Set(); // oturum başına ilk karşılaşma ipuçları

const lvSkills = () => (LEVELS[S.level] && LEVELS[S.level].skills) || [];
const levelOpen = (id) => isOpen(lvSkills(), id);

function activeMarks() {
  for (let i = marks.length - 1; i >= 0; i--) if (!hazards.includes(marks[i])) marks.splice(i, 1);
  return marks.length;
}
function addMark(sk, x, z, r, delay, dmg, color) {
  const h = addHazard(x, z, r, delay, dmg, color);
  marks.push(h); sk.marks.push(h);
  return h;
}
function dropMarks(sk) { // uyarı iptali: işaret sahneden kalkar, hasar vermez
  for (const h of sk.marks) { const i = hazards.indexOf(h); if (i >= 0) { hazards.splice(i, 1); dropHazard(h); } }
  sk.marks.length = 0;
}

// ---- doğuş / sıfırlama ----
export function initEnemySkills(e) {
  const id = skillFor(e.d, lvSkills());
  if (!id) return;
  e.sk = initSkill(id, Math.random);
  if (id === "veil") { e.veiled = true; e.solidT = 0; setVeil(e, true); }
  if (id === "aura") {
    const s = SKILLS.aura, m = new THREE.Mesh(ringUnit, new THREE.MeshBasicMaterial({ color: 0x9a5bff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.scale.setScalar(s.r); m.position.set(e.mesh.position.x, 0.06, e.mesh.position.z);
    scene.add(m); rings.add(m); e.auraRing = m;
  }
}
export function resetSkills() {
  marks.length = 0; dead.length = 0;
  for (const m of rings) { scene.remove(m); m.material.dispose(); }
  rings.clear();
  for (const p of patches) { scene.remove(p.m); p.m.material.dispose(); }
  patches.length = 0;
}
// bölüm girişinde yeni açılan becerilerin kısa ipucu metinleri (oturumda her beceri için bir kez)
export function skillHintTexts(idx) {
  const out = [], cur = LEVELS[idx] && LEVELS[idx].skills, prev = idx > 0 ? LEVELS[idx - 1].skills : [];
  for (const id of newSkills(cur, prev)) {
    if (seenHints.has(id)) continue;
    seenHints.add(id);
    const t = STRINGS.skills && STRINGS.skills[id];
    if (t) out.push(t);
  }
  return out;
}

// ---- tetikleme ----
function countAllies(e, id, s) {
  let n = 0;
  const from = id === "batDive" ? wizard.position : e.mesh.position;
  for (const o of enemies) if (!o.dead && o.sk && o.sk.id === id && flatDist(o.mesh.position, from) < s.near) n++;
  return n;
}
function tryStart(e, sk, s, dist) {
  const p = e.mesh.position;
  if (sk.id === "howl" && e.st !== "approach") return false;
  const ctx = { dist, hpRatio: e.hp / e.maxHp, slowed: e.slow > 0, active: activeMarks(), allies: s.minBats || s.minWolves ? countAllies(e, sk.id, s) : 0, dead, pos: p, now: RT.elapsed, live: liveCount(), cap: LEVELS[S.level].cap, wind: e.wind, slamCd: e.cd };
  if (!canTrigger(sk.id, sk, ctx)) return false;
  sk.cd = s.cd || 0; sk.state = "warn"; sk.t = s.warn; sk.hit = false; sk.marks.length = 0;
  sfx("telegraph");
  switch (sk.id) {
    case "batDive": sk.lock = { x: wizard.position.x, z: wizard.position.z }; addMark(sk, sk.lock.x, sk.lock.z, s.r, s.warn, 0, COL.bat); break;
    case "quake": addMark(sk, p.x, p.z, s.r, s.warn, s.dmg, COL.danger); break;
    case "volley": for (const q of volleyPoints(wizard.position.x, wizard.position.z, moveDir.x, moveDir.z, ARENA)) addMark(sk, q.x, q.z, s.r, s.warn, s.dmg, COL.danger); break;
    case "howl": addMark(sk, p.x, p.z, s.r, s.warn, 0, COL.howl); break;
    case "revive": sk.target = pickReviveTarget(dead, p, RT.elapsed, s); sk.target.used = true; addMark(sk, sk.target.x, sk.target.z, 1.2, s.warn, 0, COL.revive); break;
    case "leap": sk.lock = { x: wizard.position.x, z: wizard.position.z }; sk.from = { x: p.x, z: p.z }; addMark(sk, sk.lock.x, sk.lock.z, s.r, s.warn, s.dmg, COL.danger); break;
  }
  return true;
}

function fire(e, sk, s) {
  const p = e.mesh.position;
  sk.marks.length = 0; sk.hit = false;
  switch (sk.id) {
    case "batDive": {
      const dx = sk.lock.x - p.x, dz = sk.lock.z - p.z, l = Math.hypot(dx, dz) || 1;
      sk.dx = dx / l; sk.dz = dz / l; sk.state = "act"; sk.t = Math.min(s.maxTravel, l / s.speed); return;
    }
    case "quake": RT.shake = Math.max(RT.shake, 0.35); burst(p, 0xc9b27a, 20); sfx("slam"); e.atkT = 0.4; sk.state = "rest"; sk.t = s.rest; return;
    case "volley": e.atkT = 0.3; sfx("enemy_shot"); break;
    case "howl": {
      for (const o of enemies) if (!o.dead && o.sk && o.sk.id === "howl" && flatDist(o.mesh.position, p) <= s.near) o.hasteT = s.haste;
      addFx(p.x, p.z, COL.howl, 0.6, s.near * 0.5, 0.5); burst(p, COL.howl, 12); e.atkT = 0.4; break;
    }
    case "revive": {
      const t = sk.target;
      if (t && liveCount() < LEVELS[S.level].cap) {
        const ne = spawnEnemy(t.type, { x: t.x, z: t.z });
        ne.revived = true; ne.hp = Math.min(ne.hp, s.hp);
        burst(ne.mesh.position, COL.revive, 14); sk.count++;
      }
      e.atkT = 0.5; break;
    }
    case "leap":
      p.x = sk.lock.x; p.z = sk.lock.z; RT.shake = Math.max(RT.shake, 0.5); burst(p, 0xffffff, 24); sfx("slam"); e.atkT = 0.4;
      sk.state = "rest"; sk.t = s.tired; sk.vulnT = s.tired; sk.vulnMul = s.tiredMul; return;
  }
  sk.state = "idle";
}

// Her düşman karesinde ai.js'ten çağrılır. true = düşman bu karede kendi hareket mantığını çalıştırmaz (beceri onu tutuyor).
export function skillTick(e, dt, es, dist) {
  const sk = e.sk;
  if (!sk) return false;
  const s = SKILLS[sk.id], edt = dt * e.ts, wdt = dt * es, p = e.mesh.position;
  if (sk.vulnT > 0) sk.vulnT = Math.max(0, sk.vulnT - wdt);
  if (sk.id === "veil") {
    const r = veilStep(dist, e.solidT || 0, dt);
    e.solidT = r.solidT;
    if (r.veiled !== e.veiled) { e.veiled = r.veiled; setVeil(e, r.veiled); }
    return false;
  }
  if (sk.id === "aura" || sk.id === "emberChain") return false;
  if (sk.id === "howl") { // uluma etkisi: 5 sn x1.3 hız; yorgunluk %30 kısalır
    if (e.hasteT > 0) { e.hasteT = Math.max(0, e.hasteT - dt); e.spd = e.d.speed * s.speedMul; if (e.st === "tired") e.tm -= edt * (1 / (1 - s.cdCut) - 1); } else e.spd = e.d.speed;
  }
  switch (sk.state) {
    case "idle":
      tickCd(sk, edt);
      return sk.cd <= 0 && tryStart(e, sk, s, dist);
    case "warn": {
      e.windT = 0.1; sk.t -= wdt;
      if (s.cancelOnHit && sk.hit) { dropMarks(sk); sk.state = "idle"; return true; } // vurulunca uluma/diriltme iptal
      if (sk.id === "leap" && sk.t < s.flight) { // son 0.3 sn: işaretli noktaya zıplama
        const k = 1 - Math.max(sk.t, 0) / s.flight, f = k * k * (3 - 2 * k);
        p.x = sk.from.x + (sk.lock.x - sk.from.x) * f; p.z = sk.from.z + (sk.lock.z - sk.from.z) * f;
      }
      if (sk.t <= 0) {
        const r = onWindupEnd(sk.id, { ownerAlive: !e.dead, hit: sk.hit, slowed: e.slow > 0 });
        if (r.fire) fire(e, sk, s); else { dropMarks(sk); sk.state = "idle"; }
      }
      return true;
    }
    case "act": // Sürü Dalışı: kilitli noktaya hızlı atılma; vurulursa/itilirse bozulur
      if (sk.hit) { sk.state = "idle"; return true; }
      e.atkT = 0.1; sk.t -= edt;
      p.x = THREE.MathUtils.clamp(p.x + sk.dx * s.speed * edt, -ARENA - 1, ARENA + 1);
      p.z = THREE.MathUtils.clamp(p.z + sk.dz * s.speed * edt, -ARENA - 1, ARENA + 1);
      if (sk.t <= 0) sk.state = "idle";
      return true;
    case "rest": // sarsıntı sonrası / yorgunluk / açık an: düşman ayakta bekler
      sk.t -= wdt;
      if (sk.t <= 0) sk.state = "idle";
      return true;
  }
  return false;
}

// Kemik Şövalye yere vurma şoku bitince: "açık an" (1 sn x1.3 hasar, ayakta bekler). Yalnız leap açıkken.
export function onSlamEnd(e) {
  const sk = e.sk;
  if (!sk || sk.id !== "leap") return;
  const s = SKILLS.leap;
  sk.state = "rest"; sk.t = s.open; sk.vulnT = s.open; sk.vulnMul = s.openMul;
}

// ---- olaylar ----
export function onEnemyHurt(e) { if (e.sk) e.sk.hit = true; }
export function onEnemyKilled(e) {
  if (e.sk) { dropMarks(e.sk); e.sk.state = "idle"; } // uyarı sırasında ölen düşmanın becerisi iptal
  if (e.auraRing) { scene.remove(e.auraRing); e.auraRing.material.dispose(); rings.delete(e.auraRing); e.auraRing = null; }
  if (levelOpen("revive") && !e.suicide && e.d.ai !== "bomber" && isReviveCandidate(e.d, e.revived)) {
    const p = e.mesh.position;
    dead.push({ type: e.type, x: p.x, z: p.z, t: RT.elapsed, used: false });
    while (dead.length > 12 || (dead.length && RT.elapsed - dead[0].t > SKILLS.revive.window)) dead.shift();
  }
}
export function damageMul(e) { // Lanet Alanı x0.6 ve Şövalye yorgun/açık an çarpanları
  let aura = 1;
  if (levelOpen("aura")) {
    const ts = [];
    for (const o of enemies) if (!o.dead && o.sk && o.sk.id === "aura") ts.push({ ref: o, x: o.mesh.position.x, z: o.mesh.position.z });
    if (ts.length) aura = auraMul(ts, e.mesh.position.x, e.mesh.position.z, e);
  }
  return skillDamageMul(e.sk, aura);
}

// Kor Zinciri: patlayan Kor'un 3.5 biriminde fitili yanmamış Kor'lar 0.25 sn sonra patlar; patlama yerinde ateş lekesi kalır
export function onEmberBlast(e) {
  if (!levelOpen("emberChain")) return;
  const s = SKILLS.emberChain, p = e.mesh.position;
  addPatch(p.x, p.z, s);
  const list = [];
  for (const o of enemies) if (!o.dead && o.sk && o.sk.id === "emberChain") list.push({ o, x: o.mesh.position.x, z: o.mesh.position.z, fuse: o.fuse });
  for (const v of emberChainVictims(list, p.x, p.z, null)) { v.o.fuse = s.delay; addBolt(new THREE.Vector3(p.x, 1, p.z), v.o.mesh.position, COL.ember); }
}
function addPatch(x, z, s) {
  let q = patches.find((o) => !o.on);
  if (!q && patches.length < PATCH_MAX) {
    const m = new THREE.Mesh(discUnit, new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    q = { m, on: false, t: 0, tick: 0, x: 0, z: 0 };
    patches.push(q);
  }
  if (!q) q = patches.reduce((a, b) => (a.t < b.t ? a : b)); // dolu: en eskiyi yeniden kullan
  q.on = true; q.t = s.patchLife; q.tick = s.patchGrace; q.x = x; q.z = z;
  q.m.position.set(x, 0.07, z); q.m.scale.setScalar(s.patchR);
  if (!q.m.parent) scene.add(q.m);
}

// gerçek dt ile her karede (loop.js): ateş lekeleri ve Lanet Alanı halkası titreşimi
export function updateSkills(dt, t) {
  for (const q of patches) {
    if (!q.on) continue;
    q.t -= dt; q.tick -= dt;
    q.m.material.opacity = 0.3 + 0.12 * Math.sin(t * 8) - (q.t < 0.6 ? (0.6 - q.t) * 0.4 : 0);
    if (q.t <= 0) { q.on = false; scene.remove(q.m); continue; }
    if (q.tick <= 0) { q.tick = 1; if (RT.invuln <= 0 && flatDist(wizard.position, q) < SKILLS.emberChain.patchR) damagePlayer(SKILLS.emberChain.patchDmg); if (!RT.running) return; }
  }
  for (const m of rings) m.material.opacity = 0.3 + 0.08 * Math.sin(t * 2);
}
