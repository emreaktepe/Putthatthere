// Düşman görseli (P3). Sözleşme: buildEnemy(type) -> { obj, mat, base, anim, baked, vis, shieldK }.
// Tüm 10 düşman (ghost, bat, golem, archer, wolf, ember, priest, totem, knight, boss) kalite ayarından bağımsız her zaman
// Core6 + Full12 v2 Pro 3B modelleriyle çizilir (js/render/models/*; ölçek/merkez/mod eşlemesi enemyvis.js): `vis` dolu,
// `mat`/`baked` null (eski prosedürel modeller kaldırıldı); kaynaklar vis.dispose() ile bırakılır.
import * as THREE from "three";
import { ENEMIES } from "../core/data.js";
import { shieldGeo } from "./fx.js";
import { DEATH_TIME, ENEMY_VIS, deathScale, enemyMode, prepareVisual } from "./enemyvis.js";
import { scene } from "./scene.js";
import { BMAT, OCT, blobTex, mk } from "./gfx.js";

export const ICE_MAT = BMAT(0xbfeaff, { transparent: true, opacity: 0.85 });
export const BLOB_GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
export const BLOB_MAT = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.7 });
// zayıf element ipucu: renkli yumuşak halka (renk başına tek önbellekli malzeme, en çok ~7)
const blobMats = new Map();
export function blobMatFor(color) {
  let m = blobMats.get(color);
  if (!m) {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), r = (color >> 16) & 255, gg = (color >> 8) & 255, b = color & 255;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(0,0,0,.7)"); gr.addColorStop(0.45, "rgba(0,0,0,.35)"); gr.addColorStop(0.78, `rgba(${r},${gg},${b},.5)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    m = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.8 });
    blobMats.set(color, m);
  }
  return m;
}
// 3B model düşmanı: obj = ölçek grubu (K = spec.scale * d.scale), içinde model grubu (cy kadar aşağı: gövde merkezi obj orijinine oturur).
function buildVisEnemy(d, spec) {
  const vis = spec.create({ scale: 1, color: d.color });
  prepareVisual(vis, spec);
  vis.group.position.y = -spec.cy;
  const obj = new THREE.Group();
  obj.add(vis.group);
  const K = spec.scale * d.scale;
  let last = null, vt = 0, phase = 0, rage = false;
  const anim = (t, e) => {
    const dt = last === null ? 0 : Math.min(Math.max(t - last, 0), 0.1);
    last = t;
    const ts = e.ts === undefined ? 1 : e.ts; // yavaşlama / Zaman Çatlağı: model animasyonu da yavaşlar
    vt += dt * ts;
    if (vis.setPhase && e.bp !== undefined && e.bp !== phase) { phase = e.bp; vis.setPhase(phase); }
    if (spec.grounded) vis.group.position.y = -spec.cy - (e.mesh.position.y - d.y) / Math.max(e.mesh.scale.y, 1e-3); // bob'u görselden düş
    vis.update(vt + e.phase, dt * ts, enemyMode(e));
    if (vis.setEnraged && !!e.enraged !== rage) { rage = !!e.enraged; vis.setEnraged(rage); } // Kemik Şövalye %50 hp öfkesi (ai.js)
    if (vis.setPhase) vis.parts.shield.visible = !!e.shielded; // kalkan yalnız oyundaki kalkan durumunda (açılıp kapanır)
  };
  return { obj, mat: null, base: new THREE.Vector3(K, K, K), anim, baked: null, vis, shieldK: (d.r * d.scale) / K };
}
export function buildEnemy(type) {
  const d = ENEMIES[type], model = d.model; // görünüm/ses modeli: enemies.<id>.model (varsayılan: kimlik; kayıtlı MODEL_KINDS hepsi ENEMY_VIS'te)
  return buildVisEnemy(d, ENEMY_VIS[model] || ENEMY_VIS.ghost);
}
// yavaşlama göstergesi: küçük buz kristalleri (paylaşımlı geometri/materyal)
export function setIce(e, on) {
  if (on && !e.iceG) {
    e.iceG = new THREE.Group();
    for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283, c = mk(OCT(0.18), ICE_MAT, Math.cos(a) * 0.85, 0.4 + (i % 2) * 0.5, Math.sin(a) * 0.85); e.iceG.add(c); }
    e.iceG.scale.setScalar(e.shieldK || 1); // 3B model düşmanlarında obj ölçeği d.r tabanlı değil: halkayı eski boyuta getir
    e.mesh.add(e.iceG);
  }
  if (e.iceG) { e.iceG.visible = on; if (on) e.iceG.rotation.y += 0.05; }
}
// kişi başına kaynaklar: kalkan materyali ve modelin kendi geometri/materyalleri
export function disposeEnemy(e) {
  if (e.sm) e.sm.material.dispose();
  e.sm = null;
  if (e.vis) e.vis.dispose(); // modelin kendi geometri/malzemeleri (paylaşımlı ilkel geometriler modül ömrü boyunca kalır)
  e.vis = null;
}

// Ölen 3B model düşmanı oynanıştan anında çıkar (combat.killEnemy); yalnız görseli DEATH_TIME kadar sahnede kalıp "dead" modunu oynar.
const dying = [];
export function retireEnemy(e) {
  if (!e.vis) { scene.remove(e.mesh); disposeEnemy(e); return; }
  e.dying = true;
  dying.push({ e, t: 0 });
}
export function tickDying(dt, t) {
  for (let i = dying.length - 1; i >= 0; i--) {
    const k = dying[i], e = k.e;
    k.t += dt;
    if (k.t >= DEATH_TIME) { scene.remove(e.mesh); disposeEnemy(e); dying.splice(i, 1); continue; }
    const f = deathScale(k.t);
    e.mesh.scale.set(e.base.x * f, e.base.y * f, e.base.z * f);
    if (e.anim) e.anim(t, e);
  }
}
export function clearDying() { // bölüm değişimi / yeniden başlatma: bekleyen ölüm görsellerini hemen bırak
  for (const k of dying) { scene.remove(k.e.mesh); disposeEnemy(k.e); }
  dying.length = 0;
}
export const dyingCount = () => dying.length;

export function setShieldVis(e, on, color) {
  if (on && !e.sm) {
    e.sm = new THREE.Mesh(shieldGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false }));
    e.sm.scale.setScalar(e.shieldK || 1);
    e.mesh.add(e.sm);
  }
  if (e.sm) e.sm.visible = on;
}
