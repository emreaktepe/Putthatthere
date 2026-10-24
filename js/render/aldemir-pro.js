// "Pro" oyuncu görseli: js/render/aldemir.js modelini oyuna uyarlar (ham dosya değiştirilmez).
//  - modelin kendi PointLight'ı sökülür (sahnedeki `wand` ışığı yeterli; ışık sayısı artmaz)
//  - yer gölgesi çıkartması çıkarılır (oyunda gerçek gölge var)
//  - aynı malzemeyi paylaşan statik parçalar her grup düğümünde tek geometride birleştirilir (~250 mesh -> onlarca draw call);
//    animasyonlu düğümler (Group'lar: kol, bacak, baş, şapka, asa, pelerin) ve kıvılcımlar ayrı kalır
//  - küçük/ince parçalar gölge geçişine girmez (castShadow=false), yalnız büyük gövde parçaları gölge atar
//  - kıvılcımların yarısı gizlenir
import * as THREE from "three";
import { createAldemir } from "./aldemir.js";

// ölçek: eski büyücü: baş merkezi y≈1.8, şapka ucu ≈3.3, gövde yarıçapı ≈0.8. Pro model 4.2 birim (şapka ucu ≈3.8, baş merkezi ≈2.4,
// etek yarıçapı ≈0.7). 0.8 ile baş merkezi 1.9, şapka ucu ≈3.0, etek ≈0.56: eski siluetle aynı boy hissi, çarpışma/kamera değişmez.
export const PRO_SCALE = 0.8;
export const TIP_Y = 3.69; // kristal merkezi (asa yerel koordinatı)
const SHADOW_MIN_VOLUME = 0.04; // model biriminde sınırlayıcı kutu hacmi; altı gölge atmaz

function bboxVolume(m) {
  const g = m.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const s = new THREE.Vector3(); g.boundingBox.getSize(s);
  return Math.abs(s.x * m.scale.x * s.y * m.scale.y * s.z * m.scale.z);
}

function mergeMeshes(list, material, cast, parent) {
  if (!list.length) return null;
  let anyUv = false;
  const parts = list.map((m) => {
    m.updateMatrix();
    const g = m.geometry.clone();
    g.applyMatrix4(m.matrix); // konum + normal dönüşümü
    if (g.attributes.uv) anyUv = true;
    return g;
  });
  let nv = 0, ni = 0;
  for (const g of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = anyUv ? new Float32Array(nv * 2) : null;
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const g of parts) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, vo * 3);
    if (uv && g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo;
    else for (let i = 0; i < c; i++) idx[io++] = vo + i;
    vo += c;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  if (uv) geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const merged = new THREE.Mesh(geo, material);
  merged.castShadow = cast; merged.receiveShadow = cast;
  parent.add(merged);
  for (const m of list) { parent.remove(m); m.geometry.dispose(); }
  return merged;
}

// bir Group'un doğrudan çocuk mesh'lerini (malzeme, gölge) çiftine göre birleştirir; alt gruplara iner
function mergeStatic(node) {
  for (const c of [...node.children]) if (c.isGroup) mergeStatic(c);
  const buckets = new Map();
  for (const c of [...node.children]) {
    if (!c.isMesh || c.children.length || c.userData.theta !== undefined) continue; // kıvılcımlar tek tek döner
    const cast = c.castShadow && bboxVolume(c) >= SHADOW_MIN_VOLUME;
    const key = c.material;
    if (!buckets.has(key)) buckets.set(key, { cast: [], flat: [] });
    buckets.get(key)[cast ? "cast" : "flat"].push(c);
  }
  for (const [material, b] of buckets) {
    mergeMeshes(b.cast, material, true, node);
    mergeMeshes(b.flat, material, false, node);
  }
}

export function disposeTree(root) {
  const mats = new Set(), geos = new Set(), texs = new Set();
  root.traverse((o) => {
    if (o.geometry) geos.add(o.geometry);
    if (o.material) for (const m of [].concat(o.material)) mats.add(m);
  });
  for (const m of mats) { if (m.map) texs.add(m.map); m.dispose(); }
  for (const g of geos) g.dispose();
  for (const t of texs) t.dispose();
}

export function createProWizard({ spellColor = 0xe0b3ff } = {}) {
  const model = createAldemir({ scale: PRO_SCALE, spellColor });
  const root = model.group;
  const trash = [];
  root.traverse((o) => {
    if (o.isLight) trash.push(o);
    else if (o.isMesh && o.geometry.type === "CircleGeometry") trash.push(o); // zemin gölgesi çıkartması
  });
  for (const o of trash) { o.removeFromParent(); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }
  let sparkN = 0;
  root.traverse((o) => { if (o.isMesh && o.userData.theta !== undefined && sparkN++ % 2) o.visible = false; });
  mergeStatic(root);
  root.traverse((o) => { if (o.isSprite || o.isLine) o.castShadow = false; });
  let meshes = 0, casters = 0;
  root.traverse((o) => { if (o.isMesh) { meshes++; if (o.castShadow) casters++; } });
  return {
    group: root,
    staff: model.parts.staff,
    update: model.update,
    setSpellColor: model.setSpellColor,
    stats: { meshes, casters },
    dispose() { root.removeFromParent(); disposeTree(root); },
  };
}
