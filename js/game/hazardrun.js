// Çevre tehlikelerinin oyun içi işleyişi (Aşama C). Saf kurallar js/game/hazards.js'tedir; burası sahneye/duruma bağlar.
// Havuz: en çok 3 yuva, yuva başına TEK mesh (halka+dolgu dokulu daire; ek çizim çağrısı <= 3). Her karede yeni nesne üretilmez.
import * as THREE from "three";
import { sfx } from "../audio/engine.js";
import { LEVELS } from "../core/data.js";
import { RT, S, enemies, hazards, moveDir } from "../core/state.js";
import { ARENA, rand } from "../core/util.js";
import { emit } from "../render/fx.js";
import { scene } from "../render/scene.js";
import { wizard } from "../render/wizard.js";
import { damagePlayer, hurt } from "./combat.js";
import { FX } from "./fxsettings.js";
import { EV_END, EV_START, EV_STRIKE, EV_TICK, GLOBAL_MAX, HAZARDS, ddaDef, entryTick, globalMax, hazardDefs, inZone, newActive, newEntry, pickHazardPoint, slideVel, stepActive } from "./hazards.js";

const SLOTS = GLOBAL_MAX;
const tex = (() => { // beyaz halka + yumuşak dolgu (renk malzemeden gelir)
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grad = g.createRadialGradient(64, 64, 0, 64, 64, 60);
  grad.addColorStop(0, "rgba(255,255,255,.12)"); grad.addColorStop(0.85, "rgba(255,255,255,.3)"); grad.addColorStop(1, "rgba(255,255,255,.3)");
  g.fillStyle = grad; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
  g.strokeStyle = "#fff"; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const geo = new THREE.PlaneGeometry(2, 2);
const slots = Array.from({ length: SLOTS }, () => {
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m);
  return { m, a: null, fx: 0 };
});
let entries = [], dda = 0, prev = { x: 0, z: 0 }, moving = false;
const others = [], vel = { x: 0, z: 0 }, ICE = HAZARDS.ice;
let onIce = false;
const _pt = { x: 0, y: 0, z: 0 }, pt = (x, y, z) => { _pt.x = x; _pt.y = y; _pt.z = z; return _pt; };

export function resetHazards() {
  for (const s of slots) { s.a = null; s.m.visible = false; }
  entries = []; vel.x = vel.z = 0; onIce = false;
}
export function initHazards() {
  resetHazards();
  const L = LEVELS[S.level];
  dda = (RT.dda && RT.dda.tier) || 0;
  entries = hazardDefs(L && L.hazards).map((d) => newEntry(ddaDef(d, dda)));
  prev.x = wizard.position.x; prev.z = wizard.position.z;
}
export const activeHazards = () => slots.filter((s) => s.a).map((s) => s.a);

function begin(def, p) {
  const s = slots.find((q) => !q.a);
  if (!s) return;
  s.a = newActive(def, p.x, p.z); s.fx = 0;
  s.m.position.set(p.x, 0.07, p.z); s.m.scale.setScalar(def.r); s.m.material.color.setHex(def.color); s.m.material.opacity = 0.4; s.m.visible = true;
  sfx("telegraph");
}
function enemyHit(a) {
  const d = a.def;
  for (const e of d.kind === "ice" ? enemies : enemies.slice()) { // buz öldürmez: kopya gerekmez
    if (e.dead || !inZone(a, e.mesh.position.x, e.mesh.position.z, e.d.r * 0.5)) continue;
    if (d.kind === "ice") { if (!(e.d.tags && e.d.tags.includes("ice"))) { e.slow = Math.max(e.slow, 0.3); e.slowK = d.slowE; } continue; }
    if (d.dmgE > 0) hurt(e, d.dmgE, false, true, null); // kaynak etiketi yok (etkililik göstergesi çıkmaz)
  }
}
function playerHit(a) {
  if (a.def.dmgP > 0 && RT.invuln <= 0 && inZone(a, wizard.position.x, wizard.position.z)) damagePlayer(a.def.dmgP);
}

// loop.update içinden (oyun saati). Hareketi uygulamak için playerStep kullanılır.
export function updateHazards(dt, t) {
  const dx = wizard.position.x - prev.x, dz = wizard.position.z - prev.z;
  moving = dx * dx + dz * dz > 1e-5; prev.x = wizard.position.x; prev.z = wizard.position.z;
  if (entries.length) {
    const live = slots.reduce((n, s) => n + (s.a ? 1 : 0), 0), gmax = Math.min(globalMax(FX.low), FX.hazardMax);
    for (const en of entries) {
      const kindLive = slots.reduce((n, s) => n + (s.a && s.a.kind === en.def.kind ? 1 : 0), 0);
      const can = live < gmax && kindLive < en.def.maxActive && hazards.length < 3 && RT.elapsed > 1; // beceri uyarıları doluysa bekler
      if (!entryTick(en, dt, can, Math.random)) continue;
      others.length = 0;
      for (const s of slots) if (s.a) others.push({ x: s.a.x, z: s.a.z, r: s.a.def.r });
      for (const h of hazards) others.push({ x: h.x, z: h.z, r: h.r });
      const p = pickHazardPoint(en.def, wizard.position, moveDir, moving, Math.random, ARENA, others);
      if (p) begin(en.def, p); else en.t = 1;
      break; // karede en çok bir başlangıç
    }
  }
  onIce = false;
  for (const s of slots) {
    const a = s.a;
    if (!a) continue;
    const ev = stepActive(a, dt), d = a.def, m = s.m;
    if (a.phase === "warn") {
      const k = 1 - a.t / a.dur;
      m.material.opacity = 0.35 + 0.55 * k * (0.75 + 0.25 * Math.sin(t * (8 + 14 * k)));
    } else if (d.kind === "fall") {
      m.material.opacity = Math.max(0, a.t / d.life) * 0.6; // kalıntı solar
    } else {
      m.material.opacity = (d.kind === "ice" ? 0.55 : 0.6) * (0.85 + 0.15 * Math.sin(t * 5)) * Math.min(1, a.t / 0.4);
      if (d.kind !== "ice" && Math.random() < 0.5) emit(pt(a.x + rand(d.r * 0.8), 0.2, a.z + rand(d.r * 0.8)), d.color, 1, 1.6, 0.7);
      if (d.kind === "ice") { if (a.phase === "live" && inZone(a, wizard.position.x, wizard.position.z)) onIce = true; enemyHit(a); }
    }
    if (ev & EV_STRIKE) {
      sfx("slam"); RT.shake = Math.max(RT.shake, 0.2); emit(pt(a.x, 0.4, a.z), d.color, Math.round(14 * (FX.sparkMul || 1)), 4, 0.6);
      playerHit(a); enemyHit(a);
    }
    if (ev & EV_TICK) { playerHit(a); enemyHit(a); }
    if ((ev & EV_START) && d.kind === "ice") emit(pt(a.x, 0.3, a.z), d.color, 8, 3, 0.5);
    if (ev & EV_END) { s.a = null; m.visible = false; }
    if (!RT.running) return;
  }
}

// oyuncu hareketi: buz yamasında yön değiştirme gecikmeli (kayma). dir birim/sıfır yön, speed birim/sn; { x, z } birim/sn döner (ortak nesne)
export function playerVel(dirx, dirz, speed, dt) {
  return slideVel(vel, dirx * speed, dirz * speed, dt, onIce, ICE.slide);
}
