// ---------- Bölüm dekoru (tema değişince dispose edilip yeniden kurulur) ----------
// Dekor modelleri: js/render/decor/ (Environment Complete v1 paketi). Yerleşim planı ve bütçeler: sceneryplan.js (saf veri, testli).
// Çok örnekli dekor createInstancedDecor ile (malzeme başına 1 çizim); tekil anıtlar createDecor ile. Dekor oynanışa etkisizdir:
// çarpışma, hedef, düşman/oyuncu/mermi etkileşimi ve ışık YOK (yalnız fireLight'ı setFireLight ile taşırız).
import * as THREE from "three";
import { readQuality, resolveQuality, detectEnv } from "../core/quality.js";
import { ARENA, rand } from "../core/util.js";
import { createDecor } from "./decor/index.js";
import { createInstancedDecor } from "./decor/instancing.js";
import { CONE, TR, glowSprite, glowTex, mk } from "./gfx.js";
import { reservedHit } from "./propsvis.js";
import { cloudGroup, fireCfg, fireLight, mistTex, mists, scene, skyState, skyU, starGroups } from "./scene.js";
import { planEntries, scaledCount, variantsOf } from "./sceneryplan.js";

export const sceneryGroup = new THREE.Group();
scene.add(sceneryGroup);
export let sc = { disp: [], anim: [], high: undefined };
export function clearScenery() {
  for (const o of [...sceneryGroup.children]) sceneryGroup.remove(o);
  for (const d of sc.disp) d.dispose(); // dekor dispose'ları paylaşılan geometriyi sayaçla bırakır (iki kez serbest bırakmaz); paylaşılan malzemeler decor/common.js'te kalıcıdır
  sc = { disp: [], anim: [], high: undefined };
  statue = null;
}
// Yüksek (pro) kalite mi? Süs dekor yalnız burada kurulur; düşükte örnek sayıları yarıya iner (sceneryplan.js).
export const sceneryHigh = () => resolveQuality(readQuality(globalThis.localStorage), detectEnv()) === "pro";
// menüde kalite değişmiş ve aynı tema yeniden başlıyorsa dekor yenilenmeli (themes.applyTheme)
export const scenerySettingsChanged = () => sc.high !== undefined && sc.high !== sceneryHigh();

const bmatOwn = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
function addInst(geo, material, mats, colors) { // basit yardımcı geometri (zemin lekeleri vb.); bu kurulumda üretilen geometri/malzeme sc.disp'e girer
  if (!mats.length) return null;
  const im = new THREE.InstancedMesh(geo, material, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  if (colors) colors.forEach((c, i) => im.setColorAt(i, c));
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.frustumCulled = false;
  sceneryGroup.add(im);
  sc.disp.push(material, im, geo);
  return im;
}
export function ringPos(rmin = ARENA + 1, rmax = ARENA + 9) {
  for (;;) {
    const x = rand(rmax), z = rand(rmax), d = Math.max(Math.abs(x), Math.abs(z));
    if (d >= rmin && d <= rmax && !reservedHit(x, z)) return [x, z]; // Zerrin/Taşkın figürlerinin yerine ağaç/kaya konmaz
  }
}
export function setFireLight(x, y, z, color, intensity, mode) {
  fireLight.position.set(x, y, z); fireLight.color.setHex(color); fireCfg.base = intensity; fireCfg.mode = mode;
}

// ---------- Taşkın heykeli: golems tamamlanınca canlı Taşkın figürü çıkar, heykel gizlenir (props3d.setPropsPhase bildirir) ----------
let statue = null, statueShown = true;
export function setTaskinStatue(show) { statueShown = show; if (statue) statue.visible = show; }

// ---------- yerleşim üretimi ----------
const lerp = (r) => r[0] + Math.random() * (r[1] - r[0]);
const faceYaw = (x, z) => Math.atan2(-x, -z); // modelin +Z'si arena merkezine bakar
function genPlacements(e, n) {
  const out = [];
  if (e.fixed) {
    for (const [x, z, r, s, y = 0] of e.fixed) if (!reservedHit(x, z)) out.push({ x, y, z, r: e.face ? faceYaw(x, z) : r, s });
    return out;
  }
  if (e.edge) { // arena kenarı boyunca dizi (çit); Zerrin/Taşkın alanı ve rastgele boşluklar atlanır
    const { step, off, skip } = e.edge, o = ARENA + off;
    for (let a = -ARENA + step / 2; a <= ARENA - step / 2 + 1e-6; a += step) {
      for (const [x, z, r] of [[a, -o, 0], [a, o, 0], [-o, a, Math.PI / 2], [o, a, Math.PI / 2]]) {
        if (Math.random() < skip || reservedHit(x, z)) continue;
        out.push({ x, y: 0, z, r: r + rand(0.06), s: lerp(e.s) });
      }
    }
    return out;
  }
  for (let i = 0; i < n; i++) { const [x, z] = ringPos(...e.ring); out.push({ x, y: 0, z, r: Math.random() * 6.283, s: lerp(e.s) }); }
  return out;
}
function tintOf(e, i) {
  const t = e.tint, base = t == null ? 0xffffff : Array.isArray(t) ? t[i % t.length] : t;
  return new THREE.Color(base).multiplyScalar((e.gain || 1) * (1 - Math.random() * (e.tj ?? 0.06)));
}
const needsTint = (e) => e.tint != null || !!e.gain || e.tj !== undefined;

// glow meta verisini mevcut glowSprite ile eşler (dekorda ışık yok, yalnız additive sprite; sayı e.glow.max ile sınırlı)
function addGlow(e, glow, p, out) {
  if (!glow || out.length >= (e.glow?.max || 0)) return null;
  const gs = glowSprite(glow.color, glow.size * p.s * (e.glow.k || 1), 0.6);
  gs.position.set(p.x, p.y + glow.y * p.s, p.z);
  sceneryGroup.add(gs);
  out.push(gs);
  return gs;
}

// tekil anıt: createDecor parçaları (paylaşılan geometri/malzeme) tek grupta
function addSingle(e, p, glows) {
  const d = createDecor(e.id), g = new THREE.Group();
  for (const part of d.parts) g.add(new THREE.Mesh(part.geometry, part.material));
  g.position.set(p.x, p.y, p.z); g.rotation.y = p.r; g.scale.setScalar(p.s);
  sceneryGroup.add(g);
  sc.disp.push(d);
  const gs = e.fire ? null : addGlow(e, d.glow, p, glows);
  return { g, d, gs };
}

// çok örnekli dekor: varyant başına bir createInstancedDecor; örnek başına renk çarpanı (setColorAt) yalnız gerektiğinde
function addMany(e, list, glows) {
  const nv = variantsOf(e.id), groups = Array.from({ length: nv }, () => []), tint = needsTint(e), done = [];
  list.forEach((p, i) => { p.i = i; groups[i % nv].push(p); });
  groups.forEach((items, v) => {
    if (!items.length) return;
    const inst = createInstancedDecor(e.id, items.map((p) => ({ x: p.x, y: p.y, z: p.z, rotation: p.r, scale: p.s })), { variant: v });
    for (const mesh of inst.group.children) {
      mesh.castShadow = mesh.receiveShadow = false; // ay gölge kamerası yalnız arenayı kapsar; dekor halkada, gölge maliyeti yok
      if (tint && !mesh.name.endsWith(":water")) { items.forEach((p, k) => mesh.setColorAt(k, tintOf(e, p.i))); mesh.instanceColor.needsUpdate = true; }
    }
    sceneryGroup.add(inst.group);
    sc.disp.push(inst);
    done.push({ inst, items });
  });
  if (e.glow && !e.fire) for (const p of list) addGlow(e, done[0]?.inst.glow, p, glows);
  if (e.spin) { // kristaller yerinde yavaşça döner (eski davranış)
    const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    list.forEach((p) => { p.sp = 0.1 + Math.random() * 0.25; });
    sc.anim.push((t) => {
      for (const { inst, items } of done) {
        for (const mesh of inst.group.children) {
          items.forEach((p, k) => mesh.setMatrixAt(k, m4.compose(v3.set(p.x, p.y, p.z), q4.setFromAxisAngle(up, p.r + t * p.sp), s3.setScalar(p.s))));
          mesh.instanceMatrix.needsUpdate = true;
        }
      }
    });
  }
  return done;
}

// planı kurar; her kayıt için { e, list, single, glows } döner
function build(kind) {
  const hi = sceneryHigh();
  sc.high = hi;
  const out = [];
  for (const e of planEntries(kind, hi)) {
    const list = genPlacements(e, scaledCount(e, hi)), glows = [], r = { e, list, glows, single: null };
    if (e.fixed && e.fixed.length === 1 && !needsTint(e) && list.length) {
      r.single = addSingle(e, list[0], glows);
      if (e.statue) { statue = r.single.g; statue.visible = statueShown; }
    } else addMany(e, list, glows);
    out.push(r);
  }
  return out;
}
const find = (rs, id) => rs.find((r) => r.e.id === id);

export const SCENERY = {
  // 0 · Fısıldayan Orman (Zerrin'in baykuşlu dalı 3B figürdür: props3d.js)
  forest() { build("forest"); },
  // 1 · Yarasa Mağarası
  cave() {
    const c = find(build("cave"), "cave-crystal"), g = c?.glows[0];
    if (g) setFireLight(g.position.x, 2, g.position.z, 0x44a0ff, 20, "pulse");
  },
  // 2 · Taş Bekçiler (harabe)
  ruins() { build("ruins"); },
  // 3 · Hortlak Mezarlığı
  graveyard() {
    const l = find(build("graveyard"), "lamp-post")?.single;
    if (l) setFireLight(l.g.position.x, l.d.glow.y * l.g.scale.x, l.g.position.z, 0xffcc77, 30, "flicker");
  },
  // 4 · Donmuş Geçit
  ice() { build("ice"); },
  // 5 · Yanık Köy
  village() {
    const b = find(build("village"), "bonfire");
    const em = [];
    for (let i = 0; i < 30; i++) { const [x, z] = ringPos(4, ARENA - 0.3); em.push(TR(x, 0.03, z, -1.5708, 0, 0, 1 + Math.random())); }
    addInst(new THREE.CircleGeometry(0.1, 6), bmatOwn(0xff7a2a), em); // zemindeki kor kıvılcımları
    // ateşler (animasyonlu): odun yığını dekor modelidir, alev kodla eklenir
    const fm1 = bmatOwn(0xff7a2a, { transparent: true, opacity: 0.85 }), fm2 = bmatOwn(0xffd070, { transparent: true, opacity: 0.9 });
    const fires = [];
    (b?.list || []).forEach((p, i) => {
      const fg = new THREE.Group();
      fg.add(mk(CONE(0.55, 1.5, 6), fm1, 0, 0.75, 0), mk(CONE(0.3, 1, 6), fm2, 0, 0.5, 0));
      const gs = glowSprite(0xff7a2a, 4.5, 0.6); gs.position.y = 0.8; fg.add(gs);
      fg.position.set(p.x, 0, p.z);
      sceneryGroup.add(fg); fires.push([fg, p.s * 0.8]);
      if (i === 0) setFireLight(p.x, 1.6, p.z, 0xff7a2a, 35, "flicker");
    });
    sc.disp.push(fm1, fm2); // CONE geometrileri GC önbelleğinde kalıcıdır
    sc.anim.push((t) => fires.forEach(([f, b0], i) => { const k = 1 + Math.sin(t * 11 + i * 2) * 0.12 + Math.sin(t * 23 + i) * 0.06; f.scale.set(b0 / k, b0 * k, b0 / k); }));
  },
  // 6 · Kristal Yatağı
  crystals() {
    const c = find(build("crystals"), "big-crystal");
    const P = c?.list || [], glows = [], gcols = [];
    for (const p of P) { glows.push(TR(p.x, 0.04, p.z, -1.5708, 0, 0, p.s * 4.5, p.s * 4.5, 1)); gcols.push(new THREE.Color([0xc58cff, 0xff6ad5, 0x7a8cff, 0x5ee7ff][p.i % 4])); }
    addInst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }), glows, gcols);
    setFireLight(0, 3, -15, 0xc58cff, 22, "pulse");
  },
  // 7 · Kemik Kule
  tower() {
    build("tower"); // kule modelinin kırmızı parıltısı: emissive pencere + glow sprite (bone-tower.glow)
    const cr = [];
    for (let i = 0; i < 12; i++) { const [x, z] = ringPos(7, ARENA - 0.3); cr.push(TR(x, 0.03, z, -1.5708, 0, Math.random() * 3)); }
    addInst(new THREE.PlaneGeometry(0.12, 2.2), bmatOwn(0xff3b3b, { transparent: true, opacity: 0.8, side: THREE.DoubleSide }), cr);
  },
  // 8 · Gölge Kalesi
  castle() {
    const rs = build("castle"), h = find(rs, "shadow-heart");
    const wall = new THREE.MeshStandardMaterial({ color: 0x1a0d14, roughness: 0.9, flatShading: true });
    const wallGeo = new THREE.BoxGeometry(52, 13, 1);
    sceneryGroup.add(mk(wallGeo, wall, 0, 6.5, -23.2));
    sc.disp.push(wall, wallGeo);
    if (h?.single) { // Gece Kalbi: yavaş döner + atar
      const { g, gs } = h.single, s0 = g.scale.x, gs0 = gs ? gs.scale.x : 0;
      sc.anim.push((t) => {
        const k = 1 + Math.sin(t * 2.2) * 0.08;
        g.scale.setScalar(s0 * k); g.rotation.y = t * 0.5;
        if (gs) gs.scale.setScalar(gs0 * k);
      });
    }
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
