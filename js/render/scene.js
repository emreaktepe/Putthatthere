// ---------- Sahne ----------
import * as THREE from "three";
import { ARENA, mulberry, rand } from "../core/util.js";
import { IS_TOUCH, canvasTex, glowTex, mat } from "./gfx.js";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0714);
scene.fog = new THREE.FogExp2(0x0a0714, 0.035);

export const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 17, 12);
camera.lookAt(0, 0, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 2));
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

export const hemi = new THREE.HemisphereLight(0x6a5acd, 0x120a24, 0.9);
scene.add(hemi);
export const moon = new THREE.DirectionalLight(0xb9c7ff, 1.4);
moon.position.set(-8, 14, 6);
moon.castShadow = true;
Object.assign(moon.shadow.camera, { left: -ARENA, right: ARENA, top: ARENA, bottom: -ARENA, near: 1, far: 45 });
moon.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
moon.shadow.bias = -0.0005;
moon.shadow.normalBias = 0.03;
scene.add(moon);

export const wand = new THREE.PointLight(0xc58cff, 40, 12);
scene.add(wand);
// bölüme özel tek sabit ışık (fener, ateş, Gece Kalbi): ışık sayısı hiç değişmez, yalnız şiddet
export const fireLight = new THREE.PointLight(0xffaa55, 0, 20);
scene.add(fireLight);
export const fireCfg = { base: 0, mode: "flicker" };

// zemin: canvas ile üretilen doku (tema rengiyle çarpılır)
export const floorCanvas = document.createElement("canvas");
floorCanvas.width = floorCanvas.height = IS_TOUCH ? 512 : 1024;
export const floorCtx = floorCanvas.getContext("2d");
export const floorTex = new THREE.CanvasTexture(floorCanvas);
floorTex.colorSpace = THREE.SRGBColorSpace;
floorTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
export const floorMat = mat({ color: 0x1a1030, roughness: 1, map: floorTex });
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA * 2, ARENA * 2), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
// arena dışı zemin (sisle birleşir)
export const outerMat = mat({ color: 0x0a0714, roughness: 1 });
export const outer = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), outerMat);
outer.rotation.x = -Math.PI / 2;
outer.position.y = -0.04;
scene.add(outer);
export const ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.5, 48), new THREE.MeshBasicMaterial({ color: 0x8e44ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.02;
scene.add(ring);
// arena sınırı: ince parlak çerçeve (oynanabilir alanı belli eder)
export const borderMat = new THREE.MeshBasicMaterial({ color: 0x8e44ff, transparent: true, opacity: 0.35, depthWrite: false });
for (const [x, z, w, d] of [[0, -ARENA, ARENA * 2, 0.14], [0, ARENA, ARENA * 2, 0.14], [-ARENA, 0, 0.14, ARENA * 2], [ARENA, 0, 0.14, ARENA * 2]]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), borderMat);
  b.position.set(x, 0.02, z);
  scene.add(b);
}

// gökyüzü: gradyan kubbe, ay, yıldızlar (kamera yukarıdan baktığı için çoğu zaman görünmez; ufuk gösteren bir açıda görünür)
export const skyU = { top: { value: new THREE.Color(0x101030) }, bot: { value: new THREE.Color(0x0a0714) } };
export const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 16, 10), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform vec3 top; uniform vec3 bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(0.0, 0.7, h)), 1.0);\n#include <colorspace_fragment>\n}",
}));
sky.renderOrder = -10;
sky.frustumCulled = false;
scene.add(sky);
export const moonTex = canvasTex(128, 128, (g, w) => {
  g.fillStyle = "#f4f1e4"; g.beginPath(); g.arc(w / 2, w / 2, w * 0.42, 0, 6.3); g.fill();
  g.fillStyle = "rgba(150,150,170,.35)";
  for (const [x, y, r] of [[0.4, 0.4, 0.09], [0.6, 0.55, 0.12], [0.45, 0.68, 0.06], [0.62, 0.3, 0.05]]) { g.beginPath(); g.arc(w * x, w * y, w * r, 0, 6.3); g.fill(); }
});
export const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, depthWrite: false }));
moonSprite.scale.setScalar(12); moonSprite.position.set(-34, 40, -62);
export const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xb9c7ff, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.6 }));
moonHalo.scale.setScalar(40); moonHalo.position.copy(moonSprite.position);
scene.add(moonSprite, moonHalo);
export const starGroups = [0, 1].map(() => {
  const pts = [];
  for (let i = 0; i < 110; i++) { const a = Math.random() * 6.28, e = 0.1 + Math.random() * 1.2, r = 85; pts.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
  const p = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }));
  p.frustumCulled = false;
  scene.add(p);
  return p;
});

// alçak sis katmanları (canvas gürültü dokusu, yavaş kayar)
export const mistTex = canvasTex(256, 256, (g, w) => {
  g.clearRect(0, 0, w, w);
  const R = mulberry(99);
  for (let i = 0; i < 40; i++) {
    const x = R() * w, y = R() * w, r = 30 + R() * 50;
    for (const dx of [-w, 0, w]) for (const dy of [-w, 0, w]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
});
mistTex.wrapS = mistTex.wrapT = THREE.RepeatWrapping;
mistTex.repeat.set(3, 3);
export const mistMats = [0, 1].map(() => new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0.2, color: 0xaaaaff }));
export const mists = mistMats.map((m, i) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), m);
  p.rotation.x = -Math.PI / 2; p.position.y = 0.35 + i * 0.45; p.renderOrder = 1;
  scene.add(p);
  return p;
});

// hava durumu parçacıkları: tek Points (kar, kül, toz...)
export const WMAX = 240;
export const wPos = new Float32Array(WMAX * 3), wRnd = new Float32Array(WMAX);
for (let i = 0; i < WMAX; i++) { wPos[i * 3] = rand(20); wPos[i * 3 + 1] = Math.random() * 12; wPos[i * 3 + 2] = rand(20); wRnd[i] = Math.random(); }
export const weatherGeo = new THREE.BufferGeometry();
weatherGeo.setAttribute("position", new THREE.BufferAttribute(wPos, 3).setUsage(THREE.DynamicDrawUsage));
export const weatherMat = new THREE.PointsMaterial({ map: glowTex, size: 0.25, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
export const weather = new THREE.Points(weatherGeo, weatherMat);
weather.frustumCulled = false;
scene.add(weather);
export let wCfg = { n: 0, vy: 0, dx: 0 };
export function setWeather(w) {
  wCfg = w;
  weatherGeo.setDrawRange(0, w.n);
  weatherMat.color.setHex(w.col);
  weatherMat.size = w.size;
  weatherMat.opacity = w.op || 0.8;
  weatherMat.blending = w.add ? THREE.AdditiveBlending : THREE.NormalBlending;
  weatherMat.needsUpdate = true;
}
export function updateWeather(dt, t, wx, wz) {
  const cx = wx * 0.6, cz = wz * 0.6;
  for (let i = 0; i < wCfg.n; i++) {
    const j = i * 3;
    wPos[j] += (wCfg.dx + Math.sin(t * 0.7 + wRnd[i] * 20) * 0.35) * dt;
    wPos[j + 1] += wCfg.vy * (0.6 + wRnd[i] * 0.8) * dt;
    wPos[j + 2] += Math.cos(t * 0.5 + wRnd[i] * 20) * 0.25 * dt;
    if (wPos[j + 1] > 12) wPos[j + 1] = 0; else if (wPos[j + 1] < 0) wPos[j + 1] = 12;
    if (wPos[j] - cx > 20) wPos[j] -= 40; else if (wPos[j] - cx < -20) wPos[j] += 40;
    if (wPos[j + 2] - cz > 20) wPos[j + 2] -= 40; else if (wPos[j + 2] - cz < -20) wPos[j + 2] += 40;
  }
  weatherGeo.attributes.position.needsUpdate = true;
}

// kamera/sis durumu (themes.js ve loop.js okur; resize yazar)
export const view = { baseFog: 0.035, camK: 1, curTheme: -1 };
export function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  view.camK = camera.aspect < 1 ? Math.min(1.6, 0.9 / camera.aspect) : 1;
  scene.fog.density = view.baseFog / view.camK;
}
addEventListener("resize", resize);
resize();

