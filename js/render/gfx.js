import * as THREE from "three";

export const mat = (o) => new THREE.MeshStandardMaterial(o);
// ---------- Görsel yardımcılar (P3) ----------
export const IS_TOUCH = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
export function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// sahte bloom: yumuşak radyal gradyan + additive sprite
export const glowTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)");
  gr.addColorStop(0.6, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export const blobTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, "rgba(0,0,0,.8)"); gr.addColorStop(0.6, "rgba(0,0,0,.35)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export const glowMats = new Map();
export function glowSprite(color, size, opacity = 0.8) {
  const key = color + "|" + opacity;
  let m = glowMats.get(key);
  if (!m) { m = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity }); glowMats.set(key, m); }
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}

// paylaşımlı geometri / materyal önbelleği (düşman ve dekor parçaları için; sahne boyunca yaşar)
export const GC = new Map();
export const cg = (k, f) => { let g = GC.get(k); if (!g) { g = f(); GC.set(k, g); } return g; };
export const BOX = (w, h, d) => cg(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const CYL = (a, b, h, s = 8) => cg(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
export const CONE = (r, h, s = 8) => cg(`n${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
export const SPH = (r, w = 12, h = 8) => cg(`s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
export const OCT = (r) => cg(`o${r}`, () => new THREE.OctahedronGeometry(r));
export const TOR = (r, t, rs = 6, ts = 16) => cg(`t${r},${t},${rs},${ts}`, () => new THREE.TorusGeometry(r, t, rs, ts));
export const SM = new Map();
export const SMAT = (color, o = {}) => { const k = color + JSON.stringify(o); let m = SM.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o }); SM.set(k, m); } return m; };
export const BMAT = (color, o = {}) => { const k = "b" + color + JSON.stringify(o); let m = SM.get(k); if (!m) { m = new THREE.MeshBasicMaterial({ color, ...o }); SM.set(k, m); } return m; };
export function mk(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
}
// lathe / koni tabanlı gövdelerin alt kısmını dalgalandır (cüppe kıvrımı, ruh etek kenarı)
export function rippleLathe(geo, yTop, yBottom, a1, a2) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y >= yTop) continue;
    const x = p.getX(i), z = p.getZ(i), th = Math.atan2(z, x), k = Math.min((yTop - y) / (yTop - yBottom), 1);
    const f = 1 + k * (a1 * Math.sin(7 * th) + a2 * Math.sin(13 * th));
    p.setX(i, x * f); p.setZ(i, z * f);
  }
  geo.computeVertexNormals();
}
// aynı materyali paylaşan statik parçaları tek geometride birleştir (draw call azaltır). userData.dyn: animasyonlu parça, birleşmez.
export function bakeNode(node, store) {
  for (const c of [...node.children]) if (c.isGroup) bakeNode(c, store);
  const byMat = new Map();
  for (const c of [...node.children]) {
    if (!c.isMesh || c.isInstancedMesh || c.userData.dyn || c.children.length) continue;
    if (!byMat.has(c.material)) byMat.set(c.material, []);
    byMat.get(c.material).push(c);
  }
  for (const [material, list] of byMat) {
    if (list.length < 2) continue;
    const pos = [], nor = [];
    for (const m of list) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      m.updateMatrix();
      g.applyMatrix4(m.matrix);
      pos.push(...g.attributes.position.array);
      nor.push(...g.attributes.normal.array);
      node.remove(m);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    const merged = new THREE.Mesh(geo, material);
    merged.castShadow = list.some((m) => m.castShadow);
    node.add(merged);
    store.push(geo);
  }
  return store;
}
export const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
export const TR = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
export const MM = (a, b) => a.clone().multiply(b);
