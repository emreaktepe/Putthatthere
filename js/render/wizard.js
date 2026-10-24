// ---------- Büyücü (Aldemir) ----------
// wizard grubu, orbTip ve wand ışığı dışarıdan kullanılır; gövde parçaları wiz.* altında animasyon için tutulur.
// İki görsel kalite: "basic" (aşağıdaki prosedürel büyücü, basicRoot altında) ve "pro" (aldemir-pro.js, tek kez kurulur).
// Dış sözleşme her ikisinde aynı: wizard (konum/dönüş/görünürlük), orbTip (asa ucu: dünya konumu ve renk), setWandColor, wiz.kick.
import * as THREE from "three";
import { PLAYER } from "../core/data.js";
import { BMAT, BOX, CONE, CYL, OCT, SMAT, SPH, TOR, bakeNode, glowSprite, glowTex, mat, mk, rippleLathe } from "./gfx.js";
import { scene, wand } from "./scene.js";
import { createProWizard, TIP_Y } from "./aldemir-pro.js";
import { createPiril } from "./models/piril.js";
import { detectEnv, readQuality, resolveQuality } from "../core/quality.js";

export const wizard = new THREE.Group();
export const orbTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xe0b3ff }));
export const orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xe0b3ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 }));
orbGlow.scale.setScalar(1.3);
orbTip.add(orbGlow);
const basicRoot = new THREE.Group();
wizard.add(basicRoot);
let pro = null, basicBuilt = false, look = null, lastColor = 0xe0b3ff;
export const wiz = { vx: 0, vz: 0, kick: 0, px: 0, pz: 0, lf: 0, lr: 0 };
export function setWandColor(hex) {
  orbTip.material.color.setHex(hex);
  orbGlow.material.color.setHex(hex);
  wand.color.setHex(hex);
  lastColor = hex;
  if (pro) pro.setSpellColor(hex);
}
export function buildWizard() {
  const look = lookColors();
  const skin = SMAT(look.skin, { flatShading: false }), purple = SMAT(0x4a2a9c, { flatShading: true }), gold = SMAT(look.gold, { metalness: 0.6, roughness: 0.4 });
  const body = new THREE.Group();
  wiz.body = body;
  basicRoot.add(body);
  // cüppe: lathe + etek kıvrımı + dikey renk gradyanı
  const prof = [[0.8, 0], [0.77, 0.12], [0.66, 0.45], [0.5, 0.8], [0.4, 1.0], [0.34, 1.2], [0.36, 1.42], [0.28, 1.58], [0.16, 1.68], [0.001, 1.7]];
  const robeGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24);
  rippleLathe(robeGeo, 0.8, 0, 0.07, 0.03);
  const pos = robeGeo.attributes.position, col = new Float32Array(pos.count * 3), top = new THREE.Color(look.robeTop), bot = new THREE.Color(look.robeBottom), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { c.lerpColors(bot, top, Math.min(Math.max(pos.getY(i) / 1.5, 0), 1)); col.set([c.r, c.g, c.b], i * 3); }
  robeGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const robe = new THREE.Mesh(robeGeo, mat({ vertexColors: true, flatShading: true, roughness: 0.85, side: THREE.DoubleSide, emissive: 0x2a1060, emissiveIntensity: 0.5 }));
  robe.castShadow = true;
  body.add(robe, mk(TOR(0.79, 0.035, 6, 24), SMAT(0x1a0a38), 0, 0.03, 0));
  body.children[1].rotation.x = Math.PI / 2;
  // pelerin: 6x8 bölmeli düzlem, her karede dalgalanır
  const capeGeo = new THREE.PlaneGeometry(0.95, 1.3, 6, 8);
  const cp = capeGeo.attributes.position;
  const rAt = (y) => { for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1); } return 0.3; };
  wiz.capeBase = new Float32Array(cp.count * 3); wiz.capeK = new Float32Array(cp.count);
  for (let i = 0; i < cp.count; i++) {
    const y = 0.9 + cp.getY(i), x = cp.getX(i);
    const rr = rAt(Math.min(Math.max(y, 0.05), 1.65)), bz = -(Math.sqrt(Math.max(rr * rr - x * x, 0.01)) + 0.06);
    wiz.capeBase.set([x, y, bz], i * 3);
    wiz.capeK[i] = Math.min(Math.max((1.55 - y) / 1.3, 0), 1);
    cp.setXYZ(i, x, y, bz);
  }
  wiz.capeGeo = capeGeo;
  const cape = new THREE.Mesh(capeGeo, SMAT(0x2f1670, { side: THREE.DoubleSide, flatShading: true }));
  cape.castShadow = true;
  body.add(cape);
  body.add(mk(TOR(0.2, 0.07, 6, 12), SMAT(0x3a1f80), 0, 1.62, 0));
  body.children[body.children.length - 1].rotation.x = Math.PI / 2;
  // kemer, tokası, kese
  const belt = mk(TOR(0.41, 0.045, 6, 20), gold, 0, 1.0, 0);
  belt.rotation.x = Math.PI / 2;
  const pouch = mk(SPH(0.09), SMAT(0x5a3a1a), 0.4, 0.85, 0.15);
  pouch.scale.set(1, 1.2, 0.8);
  body.add(belt, mk(BOX(0.1, 0.1, 0.04), gold, 0, 1.0, 0.43), pouch);
  // kollar
  const mkArm = (sx, rx, rz) => {
    const a = new THREE.Group();
    a.position.set(sx * 0.37, 1.5, 0.02); a.rotation.set(rx, 0, rz);
    const sleeve = mk(CYL(0.1, 0.17, 0.7, 8), purple, 0, -0.35, 0);
    sleeve.castShadow = true;
    a.add(sleeve, mk(SPH(0.09), skin, 0, -0.74, 0));
    body.add(a);
    return a;
  };
  wiz.armR = mkArm(1, -1.0, -0.15);
  wiz.armL = mkArm(-1, 0.15, 0.2);
  // baş
  const head = new THREE.Group();
  head.position.y = 1.8;
  const skull = mk(SPH(0.3, 16, 12), skin);
  skull.scale.set(1, 1.1, 0.95);
  skull.castShadow = true;
  const nose = mk(CONE(0.06, 0.2, 6), skin, 0, -0.02, 0.3);
  nose.rotation.x = Math.PI / 2;
  head.add(skull, nose);
  const browM = SMAT(look.beard);
  for (const sx of [-1, 1]) {
    head.add(mk(SPH(0.04), BMAT(look.eye), sx * 0.11, 0.06, 0.26));
    const b = mk(BOX(0.12, 0.025, 0.03), browM, sx * 0.11, 0.14, 0.27);
    b.rotation.z = -sx * 0.2;
    head.add(b);
  }
  body.add(head);
  // sakal: çene konisi + yan kıvrımlar + bıyık, bir pivotta sallanır
  const beard = new THREE.Group();
  beard.position.set(0, 1.66, 0.2);
  const beardM = SMAT(look.beard, { flatShading: true, emissive: 0x222230 });
  const bMain = mk(CONE(0.27, 0.8, 8), beardM, 0, -0.38, 0.05);
  bMain.rotation.x = Math.PI;
  bMain.castShadow = true;
  beard.add(bMain);
  for (const sx of [-1, 1]) {
    const cu = mk(CONE(0.1, 0.35, 6), beardM, sx * 0.2, -0.18, 0.05);
    cu.rotation.set(Math.PI, 0, sx * 0.4);
    const mu = mk(CYL(0.03, 0.03, 0.2, 5), beardM, sx * 0.1, 0.1, 0.1);
    mu.rotation.z = Math.PI / 2 - sx * 0.2;
    beard.add(cu, mu);
  }
  body.add(beard);
  wiz.beard = beard;
  // şapka: bükülmüş koni + dalgalı kenar + bant + uçta yıldız
  const hat = new THREE.Group();
  hat.position.y = 2.03;
  const brimGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.05, 24);
  const bp = brimGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i); if (Math.hypot(x, z) > 0.5) bp.setY(i, bp.getY(i) + Math.sin(Math.atan2(z, x) * 5) * 0.03); }
  brimGeo.computeVertexNormals();
  const hatM = SMAT(look.hat, { flatShading: true });
  const brim = new THREE.Mesh(brimGeo, hatM);
  brim.castShadow = true;
  const coneGeo = new THREE.ConeGeometry(0.4, 1.2, 14, 8);
  const hp = coneGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) { const t = (hp.getY(i) + 0.6) / 1.2; hp.setX(i, hp.getX(i) + 0.45 * t * t); hp.setY(i, hp.getY(i) - 0.12 * t * t * t); }
  coneGeo.computeVertexNormals();
  const hcone = new THREE.Mesh(coneGeo, hatM);
  hcone.position.y = 0.6;
  hcone.castShadow = true;
  const band = mk(TOR(0.37, 0.035, 6, 20), gold, 0, 0.1, 0);
  band.rotation.x = Math.PI / 2;
  const star = mk(OCT(0.08), BMAT(0xffe27a), 0.45, 1.08, 0);
  const sg = glowSprite(0xffe27a, 0.6, 0.8);
  star.add(sg);
  hat.add(brim, hcone, band, mk(BOX(0.1, 0.1, 0.03), gold, 0, 0.1, 0.37), star);
  body.add(hat);
  wiz.hat = hat;
  // asa: eğri tüp, üstte 3 pençe ve emissive kristal (orbTip)
  const staff = new THREE.Group();
  staff.position.set(0.26, 0, 0.63);
  const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.02, 0.5, 0.02], [-0.02, 1.0, 0], [0.03, 1.5, -0.02], [0, 2.0, 0], [0, 2.25, 0]].map((p) => new THREE.Vector3(...p)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.05, 6), SMAT(0x6b4423));
  tube.castShadow = true;
  staff.add(tube);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 6.283, claw = mk(CONE(0.03, 0.22, 4), SMAT(0x6b4423), Math.cos(a) * 0.09, 2.3, Math.sin(a) * 0.09);
    claw.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    staff.add(claw);
  }
  orbTip.position.set(0, 2.38, 0);
  staff.add(orbTip);
  body.add(staff);
  wiz.staff = staff;
}

// config yüklendikten sonra çağrılır (basic görünüm paleti player.look'tan gelir; pro modelde yalnız wandGlow kullanılır)
export function initWizard() {
  wizard.scale.setScalar(PLAYER.scale);
  const glow = lookColors().wandGlow;
  orbTip.material.color.setHex(glow);
  orbGlow.material.color.setHex(glow);
  lastColor = glow;
  scene.add(wizard);
  setWizardQuality(readQuality(globalThis.localStorage));
}

// kalite tercihi (auto|high|low) -> görünüm ("pro"|"basic"); değişmediyse bir şey yapmaz. Her görünüm gerektiğinde bir kez kurulur.
export function setWizardQuality(pref) {
  const want = resolveQuality(pref, detectEnv());
  if (want === look) return want;
  if (want === "pro") {
    if (!pro) { pro = createProWizard({ spellColor: lastColor }); wizard.add(pro.group); }
    pro.group.visible = true;
    basicRoot.visible = false;
    pro.staff.add(orbTip); // asa ucu efektleri kristal merkezini izler; orbTip'in kendi görseli gizli, pro modelin kristali görünür
    orbTip.position.set(0, TIP_Y, 0);
    orbTip.visible = false;
  } else {
    if (!basicBuilt) { buildWizard(); bakeNode(basicRoot, []); basicBuilt = true; }
    wiz.staff.add(orbTip);
    orbTip.position.set(0, 2.38, 0);
    orbTip.visible = true;
    basicRoot.visible = true;
    if (pro) { pro.dispose(); pro = null; } // orbTip artık pro ağacında değil; bellek serbest
  }
  look = want;
  return want;
}
export const wizardLook = () => look;
export const lookColors = () => Object.fromEntries(Object.entries(PLAYER.look).map(([k, v]) => [k, parseInt(v.slice(1), 16)]));

const CAST_HOLD = 0.4; // pro modelde "cast" pozu ateş anından sonra kısa süre korunur
let castT = 0, lastKick = 0;
export function animateWizard(dt, t) {
  if (dt > 0) {
    const vx = (wizard.position.x - wiz.px) / dt, vz = (wizard.position.z - wiz.pz) / dt;
    const sp = Math.hypot(vx, vz), k = sp > 14 ? 14 / sp : 1; // ışınlanma sıçramasını yut
    wiz.vx += (vx * k - wiz.vx) * Math.min(1, dt * 10);
    wiz.vz += (vz * k - wiz.vz) * Math.min(1, dt * 10);
  }
  wiz.px = wizard.position.x; wiz.pz = wizard.position.z;
  if (pro) { // pro: moda mevcut durumdan türetilir (durma -> idle, hareket -> walk, ateş -> cast)
    wiz.kick = Math.max(wiz.kick - dt, 0);
    if (wiz.kick > lastKick) castT = CAST_HOLD;
    lastKick = wiz.kick;
    castT = Math.max(castT - dt, 0);
    pro.update(t, dt, castT > 0 ? "cast" : Math.hypot(wiz.vx, wiz.vz) > 1.2 ? "walk" : "idle");
    return;
  }
  const b = wiz.body;
  const ry = wizard.rotation.y, sn = Math.sin(ry), cs = Math.cos(ry);
  const lf = THREE.MathUtils.clamp((wiz.vx * sn + wiz.vz * cs) / 8, -1, 1);
  const lr = THREE.MathUtils.clamp((wiz.vx * cs - wiz.vz * sn) / 8, -1, 1);
  const mv = Math.min(Math.hypot(wiz.vx, wiz.vz) / 8, 1);
  b.position.y = Math.abs(Math.sin(t * 10)) * 0.06 * mv;
  b.rotation.x = lf * 0.12;
  b.scale.y = 1 + Math.sin(t * 1.5) * 0.015 * (1 - mv);
  wiz.beard.rotation.x = Math.sin(t * 2) * 0.05 + lf * 0.25;
  wiz.beard.rotation.z = -lr * 0.15;
  wiz.hat.rotation.z = Math.sin(t * 1.3) * 0.03 - lr * 0.05;
  wiz.hat.rotation.x = -lf * 0.05;
  wiz.armL.rotation.x = 0.15 + Math.sin(t * 10) * 0.5 * mv;
  wiz.kick = Math.max(wiz.kick - dt, 0);
  const kk = wiz.kick / 0.18;
  wiz.armR.rotation.x = -1.0 - kk * 0.5;
  wiz.staff.position.set(0.26, 0, 0.63 + kk * 0.2);
  const pulse = 1 + 0.1 * Math.sin(t * 6);
  orbTip.scale.setScalar(pulse);
  orbTip.rotation.y = t * 1.5;
  // pelerin dalgası
  const p = wiz.capeGeo.attributes.position, base = wiz.capeBase, K = wiz.capeK;
  for (let i = 0; i < p.count; i++) {
    const k = K[i], x = base[i * 3], y = base[i * 3 + 1];
    const wave = Math.sin(t * 2 + x * 3 + y * 2) * 0.05 * k + Math.sin(t * 5 + x * 4) * 0.02 * k * mv;
    const dz = THREE.MathUtils.clamp(-lf * 0.3 * k * k, -0.4, 0.04);
    p.setXYZ(i, x - lr * 0.25 * k * k, y, base[i * 3 + 2] + dz + wave);
  }
  p.needsUpdate = true;
}

// Mana Kalkanı küresi
export const shieldBall = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 14), new THREE.MeshBasicMaterial({ color: 0x5ab4ff, transparent: true, opacity: 0.25, depthWrite: false }));
shieldBall.visible = false;
scene.add(shieldBall);

// Pırıl (dost ruh): Core6 Pro paketinin createPiril modeli (parlayan çekirdek, cam kabuk içinde küçük kız silueti, yörünge kıvılcımları; ışık yok)
// + iz bırakan kuyruk (aşağıdaki sprite'lar). Model yerelde zeminden 1.18 yukarıda merkezlenir; PIRIL_SCALE eski görselin (çekirdek ~0.12, hale 1.1-2.4)
// boyuna uyar: kabuk yarıçapı 0.46*0.6 = 0.28, parıltı sprite'ı 2.1*0.6 = 1.3.
export const PIRIL_SCALE = 0.6, PIRIL_CY = 1.18;
export const piril = new THREE.Group();
piril.visible = false;
export const pirilVis = createPiril({ scale: PIRIL_SCALE, color: 0xffd98c });
pirilVis.group.position.y = -PIRIL_CY * PIRIL_SCALE;
piril.add(pirilVis.group);
scene.add(piril);
export const pirilTrail = Array.from({ length: 6 }, (_, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xa8ffe8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 * (1 - i / 6) }));
  s.scale.setScalar(0.5 * (1 - i / 8));
  s.position.set(0, -100, 0);
  scene.add(s);
  return s;
});
let pvx = wizard.position.x, pvz = wizard.position.z;
export function animatePiril(dt, t) {
  const zz = t % 8 < 0.7 ? Math.sin((t % 8) * 18) * 0.7 : 0; // 8 saniyede bir kısa zikzak
  piril.position.set(wizard.position.x + Math.cos(t * 1.8) * 1.1 + zz, 2.4 + Math.sin(t * 3) * 0.2, wizard.position.z + Math.sin(t * 1.8) * 1.1 + zz * 0.5);
  const moving = dt > 0 && Math.hypot(wizard.position.x - pvx, wizard.position.z - pvz) / dt > 0.5; // büyücü yürüyorsa "walk"
  pvx = wizard.position.x; pvz = wizard.position.z;
  if (piril.visible) pirilVis.update(t, dt, moving ? "walk" : "idle");
  pirilTrail.forEach((s, i) => {
    s.visible = piril.visible;
    if (s.position.y < -50) s.position.copy(piril.position);
    s.position.lerp(i === 0 ? piril.position : pirilTrail[i - 1].position, Math.min(1, dt * (11 - i)));
  });
}
export const guideGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
export const guide = new THREE.Line(guideGeo, new THREE.LineBasicMaterial({ color: 0xa8ffe8, transparent: true, opacity: 0.55 }));
guide.frustumCulled = false;
guide.visible = false;
scene.add(guide);
