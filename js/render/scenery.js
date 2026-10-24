// ---------- Bölüm dekoru (InstancedMesh; tema değişince dispose edilip yeniden kurulur) ----------
import * as THREE from "three";
import { ARENA, rand } from "../core/util.js";
import { BMAT, BOX, CONE, CYL, MM, SPH, TR, glowSprite, glowTex, mk } from "./gfx.js";
import { cloudGroup, fireCfg, fireLight, mistTex, mists, scene, skyState, skyU, starGroups } from "./scene.js";

export const sceneryGroup = new THREE.Group();
scene.add(sceneryGroup);
export let sc = { disp: [], anim: [] };
export function clearScenery() {
  for (const o of [...sceneryGroup.children]) sceneryGroup.remove(o);
  for (const d of sc.disp) d.dispose();
  sc = { disp: [], anim: [] };
}
export const smat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...o });
export const bmatOwn = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
export function addInst(geo, material, mats, colors) {
  if (!mats.length) return null;
  const im = new THREE.InstancedMesh(geo, material, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  if (colors) colors.forEach((c, i) => im.setColorAt(i, c));
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.frustumCulled = false;
  sceneryGroup.add(im);
  sc.disp.push(material, im, geo); // dekor geometrileri her kurulumda yeni üretilir; önbellekteki (GC) olanlar buraya verilmez
  return im;
}
export function addObj(o, ...own) { sceneryGroup.add(o); sc.disp.push(...own); return o; }
export function ringPos(rmin = ARENA + 1, rmax = ARENA + 9) {
  for (;;) {
    const x = rand(rmax), z = rand(rmax), d = Math.max(Math.abs(x), Math.abs(z));
    if (d >= rmin && d <= rmax) return [x, z];
  }
}
export const jc = (hex, v = 0.08) => new THREE.Color(hex).offsetHSL(rand(0.02), rand(v), rand(v));
export function setFireLight(x, y, z, color, intensity, mode) {
  fireLight.position.set(x, y, z); fireLight.color.setHex(color); fireCfg.base = intensity; fireCfg.mode = mode;
}
export function pines(n, crown, trunk = 0x2b1a12) {
  const t = [], a = [], b = [], cols = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = ringPos(), s = 0.8 + Math.random() * 0.9, ry = Math.random() * 6.28;
    t.push(TR(x, s, z, 0, ry, 0, s)); a.push(TR(x, s * 3.2, z, 0, ry, 0, s)); b.push(TR(x, s * 4.8, z, 0, ry, 0, s * 0.85));
    cols.push(jc(crown, 0.06));
  }
  const m = smat(0xffffff);
  addInst(new THREE.CylinderGeometry(0.2, 0.35, 2, 6), smat(trunk), t);
  addInst(new THREE.ConeGeometry(1.5, 3, 7), m, a, cols);
  addInst(new THREE.ConeGeometry(1.1, 2.6, 7), m, b, cols);
}
export function deadTrees(n, hex) {
  const tr = [], br = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = ringPos(ARENA + 1, ARENA + 9), h = 3 + Math.random() * 3, ry = Math.random() * 6.28, base = TR(x, 0, z, 0, ry, 0);
    tr.push(TR(x, h / 2, z, 0, ry, 0, 1, h, 1));
    for (let j = 0; j < 3; j++) {
      const len = 1 + Math.random() * 1.2, rz = (j % 2 ? 1 : -1) * (0.7 + Math.random() * 0.5);
      br.push(MM(MM(base, TR(0, h * (0.45 + j * 0.18), 0, 0, j * 2.1, rz)), TR(0, len / 2, 0, 0, 0, 0, 1, len, 1)));
    }
  }
  const m = smat(hex);
  addInst(new THREE.CylinderGeometry(0.1, 0.28, 1, 5), m, tr);
  addInst(new THREE.CylinderGeometry(0.03, 0.09, 1, 4), m, br);
}
export function columnsAt(list, mats, caps) { // list: [x,z,h]
  for (const [x, z, h] of list) { mats.push(TR(x, h / 2, z, 0, Math.random() * 3, 0, 1, h, 1)); if (h > 4) caps.push(TR(x, h + 0.17, z)); }
}

export const SCENERY = {
  // 0 · Fısıldayan Orman
  forest() {
    pines(46, 0x143a2a);
    const s = [], c = [];
    for (let i = 0; i < 18; i++) {
      const [x, z] = ringPos(10.5, ARENA + 3);
      for (let j = 0; j < 3; j++) { const px = x + rand(0.5), pz = z + rand(0.5), k = 0.6 + Math.random() * 0.8; s.push(TR(px, 0.12 * k, pz, 0, 0, 0, k)); c.push(TR(px, 0.25 * k, pz, 0, 0, 0, k)); }
    }
    addInst(new THREE.CylinderGeometry(0.04, 0.06, 0.25, 5), smat(0xd9d2b8), s);
    addInst(new THREE.SphereGeometry(0.2, 8, 5, 0, 6.283, 0, 1.57), smat(0x2fe08a, { emissive: 0x1aa05a, emissiveIntensity: 0.9 }), c);
    const l = [];
    for (let i = 0; i < 6; i++) { const [x, z] = ringPos(12, ARENA + 6); l.push(TR(x, 0.4, z, 0, Math.random() * 3, 1.5708, 1, 1.6 + Math.random() * 1.2, 1)); }
    addInst(new THREE.CylinderGeometry(0.42, 0.5, 1, 7), smat(0x3a2418), l);
    // baykuşlu dal
    const bark = smat(0x3a2418), owlM = smat(0x6b5035), g = new THREE.Group();
    g.add(mk(CYL(0.4, 0.45, 3, 7), bark, 0, 0.4, 0));
    g.children[0].rotation.z = 1.5708;
    const body = mk(SPH(0.3), owlM, 0, 1.15, 0); body.scale.set(1, 1.3, 1);
    g.add(body, mk(SPH(0.22), owlM, 0, 1.68, 0.02), mk(CONE(0.06, 0.18, 4), owlM, -0.12, 1.9, 0), mk(CONE(0.06, 0.18, 4), owlM, 0.12, 1.9, 0));
    for (const sx of [-1, 1]) { g.add(mk(SPH(0.06), BMAT(0xffd84a), sx * 0.1, 1.7, 0.2)); const gs = glowSprite(0xffd84a, 0.5, 0.8); gs.position.set(sx * 0.1, 1.7, 0.22); g.add(gs); }
    g.position.set(-16.5, 0, -6); g.rotation.y = 0.9;
    addObj(g, bark, owlM);
  },
  // 1 · Yarasa Mağarası
  cave() {
    const st = [], sl = [];
    for (let i = 0; i < 36; i++) { const [x, z] = ringPos(ARENA + 0.5, ARENA + 9), h = 1.2 + Math.random() * 2.4, w = 0.6 + Math.random() * 0.7; st.push(TR(x, h / 2, z, 0, 0, 0, w, h, w)); }
    for (let i = 0; i < 22; i++) { const [x, z] = ringPos(ARENA + 0.5, ARENA + 9), h = 1.5 + Math.random() * 3; sl.push(TR(x, 9 - h / 2, z, 3.1416, 0, 0, 0.7, h, 0.7)); }
    const rock = smat(0x2c3a4c);
    addInst(new THREE.ConeGeometry(0.5, 1, 6), rock, st);
    addInst(new THREE.ConeGeometry(0.5, 1, 6), rock, sl);
    const cr = [], cp = [];
    for (let i = 0; i < 16; i++) { const [x, z] = ringPos(ARENA + 0.5, ARENA + 8), k = 0.7 + Math.random() * 0.9; cr.push(TR(x, 1.1 * k, z, rand(0.2), Math.random() * 3, rand(0.2), k, k * 2.4, k)); if (i < 6) cp.push([x, z, k]); }
    addInst(new THREE.OctahedronGeometry(0.5), smat(0x66b8ff, { emissive: 0x2f7fe0, emissiveIntensity: 1.2, roughness: 0.2 }), cr);
    for (const [x, z, k] of cp) { const gs = glowSprite(0x66b8ff, 4 * k, 0.6); gs.position.set(x, 1.2 * k, z); sceneryGroup.add(gs); }
    const pd = [];
    for (let i = 0; i < 7; i++) { const [x, z] = ringPos(8.5, ARENA - 0.5), s = 0.9 + Math.random() * 1.4; pd.push(TR(x, 0.03, z, -1.5708, 0, 0, s, s, 1)); }
    addInst(new THREE.CircleGeometry(1, 16), smat(0x6fb8ff, { transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.3 }), pd);
    if (cp[0]) setFireLight(cp[0][0], 2, cp[0][1], 0x44a0ff, 20, "pulse");
  },
  // 2 · Taş Bekçiler (harabe)
  ruins() {
    const cm = [], cc = [], list = [];
    for (let i = 0; i < 16; i++) { const [x, z] = ringPos(); list.push([x, z, 1.5 + Math.random() * 4.5]); }
    columnsAt(list, cm, cc);
    const stone = smat(0x7a6a5a);
    // yıkık kemerler
    for (let i = 0; i < 3; i++) {
      const [x, z] = ringPos(ARENA + 3, ARENA + 8), base = TR(x, 0, z, 0, Math.random() * 3, 0);
      cm.push(MM(base, TR(-2.4, 2.5, 0, 0, 0, 0, 1, 5, 1)), MM(base, TR(2.4, 2.5, 0, 0, 0, 0, 1, 5, 1)));
      cc.push(MM(base, TR(0, 5.2, 0, 0, 0, 0, 3.8, 0.8 / 0.35, 0.8)));
    }
    addInst(new THREE.CylinderGeometry(0.5, 0.6, 1, 10), stone, cm);
    addInst(new THREE.BoxGeometry(1.5, 0.35, 1.5), stone, cc);
    const fl = [];
    for (let i = 0; i < 8; i++) { const [x, z] = ringPos(); fl.push(TR(x, 0.5, z, 0, Math.random() * 3, 1.5708, 1, 1.5 + Math.random() * 1.5, 1)); }
    addInst(new THREE.CylinderGeometry(0.5, 0.55, 1, 9), stone, fl);
    const bl = [];
    for (let i = 0; i < 10; i++) { const [x, z] = ringPos(); bl.push(TR(x, 0.35, z, rand(0.3), Math.random() * 3, rand(0.3), 0.7 + Math.random())); }
    addInst(new THREE.BoxGeometry(1.2, 0.8, 1), stone, bl);
    const rn = [];
    for (let i = 0; i < 14; i++) { const [x, z] = ringPos(8, ARENA - 0.3); rn.push(TR(x, 0.03, z, -1.5708, 0, Math.random() * 3)); }
    addInst(new THREE.PlaneGeometry(0.18, 2.4), bmatOwn(0xffa044, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }), rn);
    // Taşkın heykeli (yarı gömülü)
    const sm2 = smat(0x6a6a74), g = new THREE.Group();
    g.add(mk(BOX(1.4, 1.6, 1), sm2, 0, 0.4, 0), mk(BOX(0.6, 0.6, 0.6), sm2, 0.1, 1.5, 0.1), mk(BOX(0.4, 1.2, 0.4), sm2, 1.0, 0.5, 0.2));
    g.rotation.set(0.15, 0.6, -0.25); g.position.set(-13.5, -0.2, 9);
    addObj(g, sm2);
  },
  // 3 · Hortlak Mezarlığı
  graveyard() {
    const g1 = [], g2 = [], cols = [];
    for (let i = 0; i < 40; i++) {
      const [x, z] = ringPos(9.5, ARENA + 9), s = 0.8 + Math.random() * 0.5, base = TR(x, 0, z, rand(0.12), Math.random() * 6.28, rand(0.12), s);
      g1.push(MM(base, TR(0, 0.6, 0))); g2.push(MM(base, TR(0, 1.2, 0, 0, 0, 0, 0.4, 0.3, 0.13)));
      cols.push(jc(0x6a7068, 0.05));
    }
    const gm = smat(0xffffff);
    addInst(new THREE.BoxGeometry(0.8, 1.2, 0.25), gm, g1, cols);
    addInst(new THREE.SphereGeometry(1, 8, 6), gm, g2, cols);
    const posts = [], rails = [], spikes = [];
    for (let a = -ARENA; a <= ARENA; a += 2.2) {
      for (const [x, z, ry] of [[a, -ARENA - 0.9, 0], [a, ARENA + 0.9, 0], [-ARENA - 0.9, a, 1.5708], [ARENA + 0.9, a, 1.5708]]) {
        if (Math.random() < 0.35) continue;
        const base = TR(x, 0, z, 0, ry, 0);
        posts.push(TR(x, 0.55, z)); spikes.push(TR(x, 1.2, z));
        rails.push(MM(base, TR(1.1, 0.5, 0)), MM(base, TR(1.1, 0.9, 0)));
      }
    }
    const iron = smat(0x1c1c22, { metalness: 0.6, roughness: 0.5 });
    addInst(new THREE.BoxGeometry(0.1, 1.1, 0.1), iron, posts);
    addInst(new THREE.BoxGeometry(2.2, 0.06, 0.06), iron, rails);
    addInst(new THREE.ConeGeometry(0.07, 0.25, 4), iron, spikes);
    deadTrees(14, 0x1d1a18);
    // fener direği
    const pole = smat(0x14141a), g = new THREE.Group();
    g.add(mk(CYL(0.07, 0.1, 3.2, 6), pole, 0, 1.6, 0), mk(SPH(0.22), BMAT(0xffcc77), 0, 3.3, 0));
    const gs = glowSprite(0xffcc77, 3.5, 0.7); gs.position.set(0, 3.3, 0); g.add(gs);
    g.position.set(-15.8, 0, -12);
    addObj(g, pole);
    setFireLight(-15.8, 3.3, -12, 0xffcc77, 30, "flicker");
  },
  // 4 · Donmuş Geçit
  ice() {
    pines(14, 0xcfe3f2, 0x4a5a66);
    const ic = [];
    for (let i = 0; i < 34; i++) { const [x, z] = ringPos(i < 8 ? 11 : ARENA + 0.5, ARENA + 9), h = 1.5 + Math.random() * 4, w = 0.6 + Math.random() * 0.8; ic.push(TR(x, h / 2, z, rand(0.1), Math.random() * 3, rand(0.1), w, h, w)); }
    addInst(new THREE.ConeGeometry(0.5, 1, 5), smat(0x9ee8ff, { transparent: true, opacity: 0.7, emissive: 0x3a7fa8, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.1 }), ic);
    const mo = [];
    for (let i = 0; i < 18; i++) { const [x, z] = ringPos(11.5, ARENA + 9), s = 1 + Math.random() * 1.6; mo.push(TR(x, 0, z, 0, 0, 0, s, s * 0.45, s)); }
    addInst(new THREE.SphereGeometry(1, 10, 6), smat(0xdfeeff), mo);
  },
  // 5 · Yanık Köy
  village() {
    const posts = [], beams = [], walls = [];
    for (let i = 0; i < 5; i++) {
      const [x, z] = ringPos(ARENA + 1.5, ARENA + 8), base = TR(x, 0, z, 0, Math.random() * 3, 0);
      for (const [px, pz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { if (Math.random() < 0.2) continue; const hh = 1.5 + Math.random() * 2; posts.push(MM(base, TR(px, hh / 2, pz, 0, 0, 0, 1, hh, 1))); }
      beams.push(MM(base, TR(-1.05, 3.1, 0, 0, 0, 0.5)), MM(base, TR(1.05, 3.1, 0, 0, 0, -0.5)));
      walls.push(MM(base, TR(0, 0.7, -2)));
    }
    for (let i = 0; i < 16; i++) { const [x, z] = ringPos(10, ARENA + 8); beams.push(TR(x, 0.12, z, 0, Math.random() * 3, rand(0.1))); }
    const char = smat(0x201612);
    addInst(new THREE.BoxGeometry(0.25, 1, 0.25), char, posts);
    addInst(new THREE.BoxGeometry(0.2, 0.2, 4.6), char, beams.slice(0, 10));
    addInst(new THREE.BoxGeometry(3, 0.22, 0.22), char, beams.slice(10));
    addInst(new THREE.BoxGeometry(4, 1.4, 0.2), char, walls);
    // kuyu
    const stone = smat(0x4a4038), wg = new THREE.Group();
    const wallM = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.7, 10, 1, true), smat(0x4a4038, { side: THREE.DoubleSide }));
    wallM.position.y = 0.35;
    wg.add(wallM, mk(BOX(0.15, 2, 0.15), char, -0.9, 1, 0), mk(BOX(0.15, 2, 0.15), char, 0.9, 1, 0), mk(BOX(2, 0.15, 0.15), char, 0, 2, 0));
    wg.position.set(16.5, 0, 6);
    addObj(wg, wallM.material, wallM.geometry, stone);
    const em = [];
    for (let i = 0; i < 30; i++) { const [x, z] = ringPos(4, ARENA - 0.3); em.push(TR(x, 0.03, z, -1.5708, 0, 0, 1 + Math.random())); }
    addInst(new THREE.CircleGeometry(0.1, 6), bmatOwn(0xff7a2a), em);
    const st = [];
    for (let i = 0; i < 10; i++) { const [x, z] = ringPos(ARENA + 0.5, ARENA + 8), h = 0.5 + Math.random() * 0.9; st.push(TR(x, h / 2, z, 0, 0, 0, 1, h, 1)); }
    addInst(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), char, st);
    // ateşler (animasyonlu)
    const fm1 = bmatOwn(0xff7a2a, { transparent: true, opacity: 0.85 }), fm2 = bmatOwn(0xffd070, { transparent: true, opacity: 0.9 });
    const fires = [];
    for (let i = 0; i < 3; i++) {
      const [x, z] = ringPos(ARENA + 1, ARENA + 6), fg = new THREE.Group();
      fg.add(mk(CONE(0.55, 1.5, 6), fm1, 0, 0.75, 0), mk(CONE(0.3, 1, 6), fm2, 0, 0.5, 0));
      const gs = glowSprite(0xff7a2a, 4.5, 0.6); gs.position.y = 0.8; fg.add(gs);
      fg.position.set(x, 0, z);
      addObj(fg); fires.push(fg);
      if (i === 0) setFireLight(x, 1.6, z, 0xff7a2a, 35, "flicker");
    }
    sc.disp.push(fm1, fm2);
    sc.anim.push((t) => fires.forEach((f, i) => { const k = 1 + Math.sin(t * 11 + i * 2) * 0.12 + Math.sin(t * 23 + i) * 0.06; f.scale.set(1 / k, k, 1 / k); }));
  },
  // 6 · Kristal Yatağı
  crystals() {
    const pal = [0xc58cff, 0xff6ad5, 0x7a8cff, 0x5ee7ff];
    const P = [], cols = [], glows = [], gcols = [];
    for (let i = 0; i < 18; i++) {
      const [x, z] = ringPos(ARENA + 0.5, ARENA + 9), h = 1.5 + Math.random() * 2.5, w = 0.6 + Math.random() * 0.6, c = new THREE.Color(pal[i % 4]);
      P.push({ x, z, h, w, r: Math.random() * 6, sp: 0.1 + Math.random() * 0.25 });
      cols.push(c); glows.push(TR(x, 0.04, z, -1.5708, 0, 0, h * 1.6, h * 1.6, 1)); gcols.push(c);
    }
    const pm = addInst(new THREE.OctahedronGeometry(1), smat(0xffffff, { emissive: 0x6a3aa0, emissiveIntensity: 0.9, roughness: 0.2 }), P.map(() => new THREE.Matrix4()), cols);
    const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s3 = new THREE.Vector3();
    const spin = (t) => {
      P.forEach((p, i) => { pm.setMatrixAt(i, m4.compose(v3.set(p.x, p.h, p.z), q4.setFromEuler(e4.set(0, p.r + t * p.sp, 0)), s3.set(p.w, p.h, p.w))); });
      pm.instanceMatrix.needsUpdate = true;
    };
    sc.anim.push(spin);
    spin(0);
    addInst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }), glows, gcols);
    const sm = [], scol = [];
    for (let i = 0; i < 28; i++) { const [x, z] = ringPos(10.5, ARENA + 8), k = 0.3 + Math.random() * 0.4; sm.push(TR(x, k * 0.9, z, rand(0.3), Math.random() * 3, rand(0.3), k * 0.8, k * 1.8, k * 0.8)); scol.push(new THREE.Color(pal[i % 4])); }
    addInst(new THREE.OctahedronGeometry(1), smat(0xffffff, { emissive: 0x6a3aa0, emissiveIntensity: 0.9, roughness: 0.2 }), sm, scol);
    setFireLight(0, 3, -15, 0xc58cff, 22, "pulse");
  },
  // 7 · Kemik Kule
  tower() {
    const bones = [], skulls = [], jaws = [];
    for (let c = 0; c < 10; c++) {
      const [cx, cz] = ringPos(10, ARENA + 8);
      for (let j = 0; j < 8; j++) bones.push(TR(cx + rand(1.2), 0.06 + Math.random() * 0.1, cz + rand(1.2), 0, Math.random() * 3, 1.5708 + rand(0.3), 1, 0.6 + Math.random() * 0.7, 1));
    }
    for (let i = 0; i < 16; i++) { const [x, z] = ringPos(10, ARENA + 8), base = TR(x, 0, z, 0, Math.random() * 6, 0); skulls.push(MM(base, TR(0, 0.25, 0, 0, 0, 0, 1, 0.9, 1.05))); jaws.push(MM(base, TR(0, 0.07, 0.06))); }
    const ivory = smat(0xd9d4c0);
    addInst(new THREE.CylinderGeometry(0.05, 0.05, 1, 5), ivory, bones);
    addInst(new THREE.SphereGeometry(0.25, 8, 6), ivory, skulls);
    addInst(new THREE.BoxGeometry(0.26, 0.1, 0.25), ivory, jaws);
    const fp = [], fc = [];
    for (let a = -ARENA; a <= ARENA; a += 2.4) for (const [x, z] of [[a, -ARENA - 0.8], [a, ARENA + 0.8], [-ARENA - 0.8, a], [ARENA + 0.8, a]]) { if (Math.random() < 0.4) continue; fp.push(TR(x, 0.6, z, 0, 0, 0, 1, 0.8 + Math.random() * 0.6, 1)); fc.push(TR(x, 1.3, z)); }
    addInst(new THREE.CylinderGeometry(0.07, 0.1, 1.2, 5), ivory, fp);
    addInst(new THREE.SphereGeometry(0.13, 6, 5), ivory, fc);
    // kule (köşede)
    const tw = smat(0x3a3a46), tg = new THREE.Group(), rm = bmatOwn(0xff4a4a, { side: THREE.DoubleSide });
    tg.add(mk(CYL(2.8, 3.4, 15, 10), tw, 0, 7.5, 0));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; tg.add(mk(BOX(1, 1.2, 1), tw, Math.cos(a) * 2.7, 15.6, Math.sin(a) * 2.7)); }
    const a0 = Math.atan2(18, 19);
    for (const [da, y] of [[-0.3, 6], [0, 9], [0.3, 12]]) { const w = mk(new THREE.PlaneGeometry(0.6, 1.6), rm, Math.cos(a0 + da) * 3.2, y, Math.sin(a0 + da) * 3.2); w.rotation.y = Math.PI / 2 - (a0 + da); tg.add(w); }
    tg.position.set(-19, 0, -18);
    addObj(tg, tw, rm);
    const cr = [];
    for (let i = 0; i < 12; i++) { const [x, z] = ringPos(7, ARENA - 0.3); cr.push(TR(x, 0.03, z, -1.5708, 0, Math.random() * 3)); }
    addInst(new THREE.PlaneGeometry(0.12, 2.2), bmatOwn(0xff3b3b, { transparent: true, opacity: 0.8, side: THREE.DoubleSide }), cr);
    deadTrees(10, 0x2a2830);
  },
  // 8 · Gölge Kalesi
  castle() {
    const stone = smat(0x2b1c28), g = new THREE.Group();
    g.add(mk(BOX(8, 0.4, 4), stone, 0, 0.2, 0), mk(BOX(6, 0.4, 3), stone, 0, 0.6, -0.2), mk(BOX(2, 0.9, 1.6), stone, 0, 1.25, -0.5),
      mk(BOX(2.4, 5.5, 0.5), stone, 0, 3.8, -1.2), mk(BOX(0.3, 1.2, 1.6), stone, -1.15, 1.6, -0.5), mk(BOX(0.3, 1.2, 1.6), stone, 1.15, 1.6, -0.5));
    g.position.set(0, 0, -19.5);
    addObj(g, stone);
    const wall = smat(0x1a0d14);
    sceneryGroup.add(mk(BOX(52, 13, 1), wall, 0, 6.5, -23));
    sc.disp.push(wall);
    const wins = [0xff5566, 0xffaa44, 0x66aaff, 0xaa66ff, 0x55ffaa].map((c) => bmatOwn(c, { transparent: true, opacity: 0.85 }));
    wins.forEach((m, i) => { const x = (i - 2) * 6; if (x === 0) return; sceneryGroup.add(mk(new THREE.PlaneGeometry(1.8, 5.5), m, x, 6, -22.45)); sc.disp.push(m); });
    sceneryGroup.add(mk(new THREE.PlaneGeometry(1.8, 5.5), wins[2], 0, 6, -22.45));
    const heart = new THREE.Group();
    heart.add(mk(SPH(0.9), BMAT(0xff3a5a)));
    const hg = glowSprite(0xff3a5a, 9, 0.7); heart.add(hg);
    heart.position.set(0, 7.5, -21.2);
    addObj(heart);
    sc.anim.push((t) => { const k = 1 + Math.sin(t * 2.2) * 0.08; heart.scale.setScalar(k); });
    const pl = [], pb = [], cu = [];
    for (const sx of [-1, 1]) for (const z of [-16, -8, 0, 8, 16]) { pl.push(TR(sx * 19.5, 5, z)); pb.push(TR(sx * 19.5, 0.3, z)); cu.push(TR(sx * 18.6, 5.5, z + 4, 0, 1.5708, 0)); }
    const pm = smat(0x2f2230);
    addInst(new THREE.CylinderGeometry(0.8, 0.9, 10, 10), pm, pl);
    addInst(new THREE.BoxGeometry(2.2, 0.6, 2.2), pm, pb);
    addInst(new THREE.BoxGeometry(1.4, 8, 0.15), smat(0x6a1020), cu);
    setFireLight(0, 5, -18.5, 0xff3355, 45, "pulse");
  },
};

export function sceneryTick(dt, t) {
  for (const f of sc.anim) f(t, dt);
  fireLight.intensity = fireCfg.base
    ? fireCfg.base * (fireCfg.mode === "pulse" ? 0.8 + 0.2 * Math.sin(t * 2) : 0.82 + 0.12 * Math.sin(t * 17) + Math.random() * 0.08)
    : 0;
  mistTex.offset.x += dt * 0.004;
  mists[1].rotation.z += dt * 0.01;
  starGroups[0].material.opacity = (0.65 + 0.35 * Math.sin(t * 1.3)) * skyState.stars;
  starGroups[1].material.opacity = (0.65 + 0.35 * Math.sin(t * 1.3 + 2)) * skyState.stars;
  skyU.time.value = t;
  cloudGroup.rotation.y += dt * 0.004;
}
