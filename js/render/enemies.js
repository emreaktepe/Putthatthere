// Düşman görseli (P3). Sözleşme: buildEnemy(type) -> { obj, mat, base, anim }.
// obj: sahneye eklenen grup (ölçeği d.r tabanlı); mat: renk/emissive animasyonunu taşıyan ana (kişi başına) materyal.
// Diğer tüm parçalar paylaşımlı sabit materyal/geometri kullanır, bu yüzden yalnız `mat` dispose edilir.
// İSTİSNA: ruh, yarasa, taş bekçi ve Gölge Kral (ENEMY_VIS) kalite ayarından bağımsız her zaman Core6 Pro 3B modelleriyle çizilir
// (js/render/models/*, oyun tarafı ayarları enemyvis.js): bu düşmanlarda `vis` dolu, `mat`/`baked` null; kaynaklar vis.dispose() ile bırakılır.
// Modeller birim uzayda kurulur (y: -1 zemin ... +1 tepe); `size` iç grubu ölçekler.
import * as THREE from "three";
import { ENEMIES } from "../core/data.js";
import { shieldGeo } from "./fx.js";
import { DEATH_TIME, ENEMY_VIS, deathScale, enemyMode, prepareVisual } from "./enemyvis.js";
import { scene } from "./scene.js";
import { BMAT, BOX, CONE, CYL, OCT, SMAT, SPH, TOR, bakeNode, blobTex, cg, glowSprite, mat, mk, rippleLathe } from "./gfx.js";

export const ICE_MAT = BMAT(0xbfeaff, { transparent: true, opacity: 0.85 });
export const batWingGeo = () => {
  const P = { A: [0, 0, 0.35], B: [0.6, 0.25, 0.6], C: [1.5, 0.35, 0.15], D: [1.05, 0.1, -0.55], E: [0.45, 0, -0.5], F: [0, 0, -0.35] };
  const tri = [["A", "B", "E"], ["B", "D", "E"], ["B", "C", "D"], ["A", "E", "F"]];
  const g = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(tri.flat().flatMap((k) => P[k]), 3));
  g.computeVertexNormals();
  return g;
};
export const BUILD = {
  ghost(m) {
    const g = new THREE.Group();
    const geo = cg("ghostBody", () => {
      const lg = new THREE.LatheGeometry([[0.001, 1.15], [0.38, 1.08], [0.66, 0.78], [0.8, 0.3], [0.82, -0.25], [0.74, -0.65], [0.62, -0.95]].map(([r, y]) => new THREE.Vector2(r, y)), 14);
      rippleLathe(lg, -0.1, -0.95, 0.18, 0.08);
      return lg;
    });
    const body = mk(geo, m);
    g.add(body);
    const dark = BMAT(0x05050a);
    for (const sx of [-1, 1]) {
      const so = mk(SPH(0.15), dark, sx * 0.28, 0.4, 0.62); so.scale.set(1, 1.5, 0.6);
      g.add(so, mk(SPH(0.06), BMAT(0xd8ffe8), sx * 0.28, 0.4, 0.72));
    }
    const mo = mk(SPH(0.15), dark, 0, -0.05, 0.74); mo.scale.set(1, 1.6, 0.5);
    const arms = [-1, 1].map((sx) => { const a = mk(CONE(0.16, 0.9, 6), m, sx * 0.85, 0.05, 0.2); a.userData.dyn = true; a.rotation.z = -sx * (Math.PI / 2 + 0.6); g.add(a); return a; });
    g.add(mo, glowSprite(0x7fffc0, 3.4, 0.3));
    return { g, size: 1.1, anim: (t, e) => { g.rotation.z = Math.sin(t * 2 + e.phase) * 0.07; arms[0].rotation.z = -(Math.PI / 2 + 0.6) + Math.sin(t * 3 + e.phase) * 0.2; arms[1].rotation.z = Math.PI / 2 + 0.6 - Math.sin(t * 3 + e.phase) * 0.2; } };
  },
  bat(m) {
    m.side = THREE.DoubleSide;
    const g = new THREE.Group();
    const body = mk(SPH(0.4), m); body.scale.set(0.9, 0.85, 1.25);
    g.add(body, mk(SPH(0.26), m, 0, 0.18, 0.5), mk(CONE(0.09, 0.28, 4), m, -0.14, 0.42, 0.5), mk(CONE(0.09, 0.28, 4), m, 0.14, 0.42, 0.5));
    for (const sx of [-1, 1]) g.add(mk(SPH(0.05), BMAT(0xff3030), sx * 0.1, 0.22, 0.72));
    const wing = cg("batWing", batWingGeo);
    const wr = new THREE.Group(), wl = new THREE.Group();
    wr.position.set(0.3, 0.1, 0); wl.position.set(-0.3, 0.1, 0); wl.scale.x = -1;
    wr.add(mk(wing, m)); wl.add(mk(wing, m));
    g.add(wr, wl);
    return { g, size: 1.25, anim: (t, e) => { const a = Math.sin(t * 18 + e.phase) * 0.7; wr.rotation.z = a; wl.rotation.z = -a; } };
  },
  golem(m) {
    const g = new THREE.Group(), rune = BMAT(0x7dffb0), moss = SMAT(0x2f5a2a);
    g.add(mk(BOX(1.1, 1.0, 0.75), m, 0, 0.1, 0), mk(BOX(0.5, 0.45, 0.5), m, 0, 0.85, 0.05), mk(BOX(0.56, 0.1, 0.2), m, 0, 0.97, 0.25),
      mk(BOX(0.12, 0.06, 0.05), rune, -0.13, 0.85, 0.31), mk(BOX(0.12, 0.06, 0.05), rune, 0.13, 0.85, 0.31),
      mk(BOX(0.5, 0.4, 0.55), m, -0.8, 0.5, 0), mk(BOX(0.5, 0.4, 0.55), m, 0.8, 0.5, 0),
      mk(BOX(0.42, 0.7, 0.45), m, -0.3, -0.65, 0), mk(BOX(0.42, 0.7, 0.45), m, 0.3, -0.65, 0),
      mk(BOX(0.7, 0.05, 0.05), rune, 0, 0.35, 0.39), mk(BOX(0.05, 0.5, 0.05), rune, 0, 0.15, 0.39), mk(BOX(0.4, 0.05, 0.05), rune, 0, -0.05, 0.39));
    const m1 = mk(SPH(0.2, 6, 4), moss, -0.8, 0.72, 0.05); m1.scale.set(1.3, 0.4, 1.1);
    const m2 = mk(SPH(0.25, 6, 4), moss, 0.1, 0.62, -0.38); m2.scale.set(1.4, 0.4, 1);
    g.add(m1, m2);
    const arms = [-1, 1].map((sx) => {
      const a = new THREE.Group(); a.position.set(sx * 0.85, 0.45, 0);
      a.add(mk(BOX(0.38, 1.0, 0.4), m, 0, -0.5, 0), mk(BOX(0.5, 0.45, 0.5), m, 0, -1.1, 0));
      g.add(a); return a;
    });
    return { g, size: 1.0, anim: (t, e) => { const s = Math.sin(t * 3 + e.phase); g.rotation.z = s * 0.06; arms[0].rotation.x = s * 0.35; arms[1].rotation.x = -s * 0.35; } };
  },
  archer(m) {
    const g = new THREE.Group(), blue = BMAT(0x66b8ff);
    g.add(mk(BOX(0.1, 0.9, 0.1), m, 0, 0.05, 0), mk(BOX(0.45, 0.15, 0.25), m, 0, -0.45, 0));
    for (let i = 0; i < 3; i++) { const r = mk(CYL(0.3, 0.3, 0.05, 8), m, 0, 0.35 - i * 0.18, 0); r.scale.z = 0.6; g.add(r); }
    for (const sx of [-1, 1]) {
      g.add(mk(BOX(0.12, 0.6, 0.12), m, sx * 0.12, -0.8, 0), mk(SPH(0.05), blue, sx * 0.09, 0.74, 0.2));
    }
    const sk = mk(SPH(0.25), m, 0, 0.72, 0); sk.scale.set(1, 1.05, 1.05);
    g.add(sk, mk(BOX(0.2, 0.08, 0.2), m, 0, 0.5, 0.08));
    const arm = new THREE.Group(); arm.position.set(-0.3, 0.45, 0); arm.rotation.x = -1.3; arm.add(mk(BOX(0.09, 0.6, 0.09), m, 0, -0.3, 0));
    const arm2 = new THREE.Group(); arm2.position.set(0.3, 0.45, 0); arm2.rotation.x = -0.9; arm2.add(mk(BOX(0.09, 0.6, 0.09), m, 0, -0.3, 0));
    const bowIn = mk(cg("bowArc", () => new THREE.TorusGeometry(0.7, 0.03, 6, 12, Math.PI)), SMAT(0x5a3a20)); bowIn.rotation.z = -Math.PI / 2;
    const bow = new THREE.Group(); bow.rotation.y = -Math.PI / 2; bow.position.set(-0.3, 0.2, 0.7);
    bow.add(bowIn, mk(CYL(0.01, 0.01, 1.4, 3), BMAT(0xddddcc)));
    g.add(arm, arm2, bow);
    return { g, size: 1.45, anim: (t, e) => { bow.rotation.x = Math.sin(t * 2 + e.phase) * 0.05; } };
  },
  wolf(m) {
    const g = new THREE.Group(), eye = BMAT(0x9fe8ff);
    const body = mk(cg("capsule", () => new THREE.CapsuleGeometry(0.38, 0.9, 4, 8)), m, 0, -0.25, 0); body.rotation.x = Math.PI / 2;
    const snout = mk(CONE(0.17, 0.5, 6), m, 0, -0.08, 1.35); snout.rotation.x = Math.PI / 2;
    g.add(body, mk(SPH(0.34), m, 0, 0, 0.95), snout, mk(CONE(0.1, 0.3, 4), m, -0.17, 0.3, 0.85), mk(CONE(0.1, 0.3, 4), m, 0.17, 0.3, 0.85),
      mk(SPH(0.06), eye, -0.14, 0.08, 1.2), mk(SPH(0.06), eye, 0.14, 0.08, 1.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mk(BOX(0.14, 0.55, 0.14), m, sx * 0.25, -0.75, sz * 0.5));
    const tail = new THREE.Group(); tail.position.set(0, -0.1, -1.0);
    for (let i = 0; i < 3; i++) { const c = mk(CONE(0.13 - i * 0.03, 0.5, 5), m, 0, 0, -0.25 - i * 0.35); c.rotation.x = -Math.PI / 2 - 0.2; tail.add(c); }
    g.add(tail);
    return { g, size: 1.1, anim: (t, e) => { tail.rotation.y = Math.sin(t * 6 + e.phase) * 0.4; } };
  },
  ember(m) {
    const g = new THREE.Group();
    const shards = new THREE.Group();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; shards.add(mk(cg("tetra", () => new THREE.TetrahedronGeometry(0.2)), BMAT(0xff9a3a), Math.cos(a) * 0.95, Math.sin(a * 2) * 0.2, Math.sin(a) * 0.95)); }
    const core = mk(cg("ico1", () => new THREE.IcosahedronGeometry(0.6, 1)), m); core.userData.dyn = true;
    g.add(core, shards, glowSprite(0xff7a2a, 3.2, 0.55));
    return { g, size: 1.1, anim: (t, e) => { shards.rotation.y = t * 3; shards.rotation.x = t * 1.3; core.scale.setScalar(1 + Math.sin(t * 8 + e.phase) * 0.08); } };
  },
  priest(m) {
    const g = new THREE.Group(), green = BMAT(0x6bff9a);
    const robe = mk(cg("priestRobe", () => {
      const lg = new THREE.LatheGeometry([[0.75, -1], [0.68, -0.7], [0.5, -0.2], [0.34, 0.3], [0.3, 0.55], [0.001, 0.7]].map(([r, y]) => new THREE.Vector2(r, y)), 12);
      rippleLathe(lg, -0.4, -1, 0.1, 0.05);
      return lg;
    }), m);
    const hood = mk(SPH(0.34, 12, 8), m, 0, 0.75, 0); hood.scale.set(1, 1.1, 1);
    g.add(robe, hood, mk(SPH(0.22), BMAT(0x050308), 0, 0.73, 0.17), mk(SPH(0.045), green, -0.09, 0.76, 0.34), mk(SPH(0.045), green, 0.09, 0.76, 0.34));
    for (const sx of [-1, 1]) { const s = mk(CYL(0.08, 0.16, 0.6, 6), m, sx * 0.38, 0.35, 0.15); s.rotation.x = -0.8; g.add(s); }
    g.add(mk(CYL(0.03, 0.03, 2.0, 5), SMAT(0x4a3320), 0.55, -0.1, 0.45), mk(OCT(0.13), green, 0.55, 0.95, 0.45));
    const cs = glowSprite(0x6bff9a, 1.1, 0.8); cs.position.set(0.55, 0.95, 0.45); g.add(cs);
    const halo = mk(TOR(0.9, 0.02, 6, 28), BMAT(0x6bff9a, { transparent: true, opacity: 0.5 }), 0, -0.1, 0); halo.rotation.x = Math.PI / 2; halo.userData.dyn = true;
    g.add(halo);
    return { g, size: 1.2, anim: (t) => { halo.rotation.z = t * 1.2; } };
  },
  totem(m) {
    const g = new THREE.Group(), rune = BMAT(0xff7a2a);
    g.add(mk(CYL(0.55, 0.7, 1.6, 8), m, 0, -0.2, 0), mk(BOX(1.5, 0.3, 1.5), m, 0, -0.85, 0));
    for (const y of [-0.5, 0, 0.45]) { const r = mk(TOR(0.6, 0.05, 6, 16), rune, 0, y, 0); r.rotation.x = Math.PI / 2; g.add(r); }
    g.add(mk(BOX(0.4, 0.15, 0.1), rune, 0, 0.15, 0.58), mk(BOX(0.12, 0.1, 0.1), rune, -0.15, -0.1, 0.58), mk(BOX(0.12, 0.1, 0.1), rune, 0.15, -0.1, 0.58));
    const crystal = mk(OCT(0.35), BMAT(0xffa040), 0, 0.95, 0); crystal.scale.set(1, 1.6, 1); crystal.userData.dyn = true;
    const gs = glowSprite(0xff9a3a, 3, 0.7); gs.position.y = 0.95;
    g.add(crystal, gs);
    return { g, size: 1.6, anim: (t) => { crystal.rotation.y = t * 2; crystal.position.y = gs.position.y = 0.95 + Math.sin(t * 3) * 0.05; } };
  },
  knight(m) {
    const g = new THREE.Group(), steel = SMAT(0x4a4f66, { metalness: 0.5, roughness: 0.45 }), blue = BMAT(0x66b8ff);
    g.add(mk(BOX(1.0, 1.0, 0.6), steel, 0, 0.25, 0), mk(BOX(0.8, 0.7, 0.1), m, 0, 0.3, 0.33), mk(BOX(0.7, 0.2, 0.4), steel, 0, -0.3, 0),
      mk(SPH(0.36), steel, 0, 1.05, 0), mk(BOX(0.4, 0.06, 0.1), blue, 0, 1.05, 0.34),
      mk(BOX(0.2, 0.8, 0.2), m, -0.25, -0.7, 0), mk(BOX(0.2, 0.8, 0.2), m, 0.25, -0.7, 0));
    for (const sx of [-1, 1]) {
      const p = mk(SPH(0.4, 8, 6), steel, sx * 0.7, 0.75, 0); p.scale.set(1, 0.7, 1);
      const h = mk(CONE(0.08, 0.4, 4), m, sx * 0.3, 1.35, 0); h.rotation.z = -sx * 0.5;
      const sp = mk(CONE(0.08, 0.3, 4), steel, sx * 0.85, 1.05, 0); sp.rotation.z = -sx * 0.6;
      g.add(p, h, sp);
    }
    const shield = new THREE.Group(); shield.position.set(-0.95, 0.2, 0.2);
    shield.add(mk(BOX(0.12, 1.1, 0.9), steel), mk(BOX(0.14, 0.9, 0.12), m, 0, 0, 0));
    const armR = new THREE.Group(); armR.position.set(0.85, 0.6, 0);
    armR.add(mk(BOX(0.2, 0.8, 0.2), m, 0, -0.4, 0), mk(BOX(0.1, 0.1, 1.7), SMAT(0xcfd8ff, { metalness: 0.7, roughness: 0.3 }), 0, -0.85, 0.9), mk(BOX(0.4, 0.08, 0.1), steel, 0, -0.85, 0.1));
    g.add(shield, armR);
    return { g, size: 0.8, anim: (t, e) => { armR.rotation.x = e.wind > 0 ? -2.6 : -0.3 + Math.sin(t * 2) * 0.05; } };
  },
  boss(m) {
    const g = new THREE.Group(), steel = SMAT(0x3a2430, { metalness: 0.5, roughness: 0.45 }), red = BMAT(0xff2a4a);
    const robe = mk(cg("bossRobe", () => {
      const lg = new THREE.LatheGeometry([[0.95, -1], [0.9, -0.7], [0.7, -0.2], [0.5, 0.2], [0.45, 0.5], [0.5, 0.62], [0.3, 0.75], [0.001, 0.8]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
      rippleLathe(lg, -0.3, -1, 0.1, 0.05);
      return lg;
    }), m);
    robe.material.side = THREE.DoubleSide;
    g.add(robe, mk(SPH(0.3), SMAT(0x14070d), 0, 0.98, 0), mk(SPH(0.06), red, -0.1, 1.0, 0.25), mk(SPH(0.06), red, 0.1, 1.0, 0.25));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, c = mk(CONE(0.07, 0.38, 4), steel, Math.cos(a) * 0.3, 1.3, Math.sin(a) * 0.3); c.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); g.add(c); }
    for (const sx of [-1, 1]) {
      g.add(mk(BOX(0.5, 0.18, 0.5), steel, sx * 0.62, 0.7, 0));
      const sp = mk(CONE(0.09, 0.45, 4), steel, sx * 0.8, 0.9, 0); sp.rotation.z = -sx * 0.5; g.add(sp);
      const arm = mk(CYL(0.1, 0.16, 0.8, 6), m, sx * 0.7, 0.3, 0.15); arm.rotation.x = -0.5; g.add(arm);
      g.add(mk(BOX(0.04, 0.5, 0.03), red, sx * 0.2, -0.2, 0.72));
    }
    const cape = mk(cg("capeP", () => new THREE.PlaneGeometry(1.6, 1.9)), SMAT(0x4a0f22, { side: THREE.DoubleSide }), 0, 0.0, -0.58); cape.rotation.x = 0.08;
    g.add(cape, mk(SPH(0.16), red, 0, 0.45, 0.48));
    const cs = glowSprite(0xff2a4a, 2, 0.8); cs.position.set(0, 0.45, 0.5);
    const cs3 = glowSprite(0xffe9a0, 3, 0.9); cs3.position.copy(cs.position); cs3.visible = false;
    g.add(cs, cs3);
    const shards = new THREE.Group();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; shards.add(mk(OCT(0.18), SMAT(0x6a2a8a, { transparent: true, opacity: 0.65, emissive: 0x3a1060 }), Math.cos(a) * 1.4, -0.2 + (i % 3) * 0.6, Math.sin(a) * 1.4)); }
    g.add(shards);
    return { g, size: 0.9, anim: (t, e) => { shards.rotation.y = t * 0.9; const p3 = e.bp === 3; cs.visible = !p3; cs3.visible = p3; (p3 ? cs3 : cs).scale.setScalar((p3 ? 3 : 2) + Math.sin(t * 4) * 0.3); } };
  },
};
export const BLOB_GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
export const BLOB_MAT = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.7 });
// 3B model düşmanı: obj = ölçek grubu (K = spec.scale * d.scale), içinde model grubu (cy kadar aşağı: gövde merkezi obj orijinine oturur).
function buildVisEnemy(d, spec) {
  const vis = spec.create({ scale: 1, color: d.color });
  prepareVisual(vis, spec);
  vis.group.position.y = -spec.cy;
  const obj = new THREE.Group();
  obj.add(vis.group);
  const K = spec.scale * d.scale;
  let last = null, vt = 0, phase = 0;
  const anim = (t, e) => {
    const dt = last === null ? 0 : Math.min(Math.max(t - last, 0), 0.1);
    last = t;
    const ts = e.ts === undefined ? 1 : e.ts; // yavaşlama / Zaman Çatlağı: model animasyonu da yavaşlar
    vt += dt * ts;
    if (vis.setPhase && e.bp !== undefined && e.bp !== phase) { phase = e.bp; vis.setPhase(phase); }
    if (spec.grounded) vis.group.position.y = -spec.cy - (e.mesh.position.y - d.y) / Math.max(e.mesh.scale.y, 1e-3); // bob'u görselden düş
    vis.update(vt + e.phase, dt * ts, enemyMode(e));
    if (vis.setPhase) vis.parts.shield.visible = !!e.shielded; // kalkan yalnız oyundaki kalkan durumunda (açılıp kapanır)
  };
  return { obj, mat: null, base: new THREE.Vector3(K, K, K), anim, baked: null, vis, shieldK: (d.r * d.scale) / K };
}
export function buildEnemy(type) {
  const d = ENEMIES[type], model = d.model; // görünüm/ses modeli: enemies.<id>.model (varsayılan: kimlik)
  if (ENEMY_VIS[model]) return buildVisEnemy(d, ENEMY_VIS[model]);
  const m = new THREE.MeshStandardMaterial({
    color: d.color, emissive: d.emissive, transparent: model === "ghost" || model === "wolf", opacity: model === "ghost" ? 0.75 : model === "wolf" ? 0.85 : 1,
    roughness: 0.6, flatShading: model !== "ghost" && model !== "ember",
  });
  const out = BUILD[model](m);
  out.g.scale.setScalar(out.size);
  const obj = new THREE.Group();
  obj.add(out.g);
  const baked = bakeNode(out.g, []);
  if (d.ai === "knight" || d.ai === "boss") out.g.traverse((n) => { if (n.isMesh) n.castShadow = true; });
  return { obj, mat: m, base: new THREE.Vector3(d.r * d.scale, d.r * d.scale, d.r * d.scale), anim: out.anim, baked, vis: null, shieldK: 1 };
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
// kişi başına kaynaklar: ana materyal, kalkan materyali, birleştirilmiş geometriler (diğer parçalar paylaşımlıdır)
export function disposeEnemy(e) {
  if (e.mat) e.mat.dispose();
  e.mat = null;
  if (e.sm) e.sm.material.dispose();
  e.sm = null;
  if (e.baked) e.baked.forEach((g) => g.dispose());
  e.baked = null;
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
