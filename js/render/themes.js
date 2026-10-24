// Zemin dokusu ve tema uygulama. Tema verisi (renkler, hava, zemin türü, dekor) data/game.config.json -> themes.
import { THEMES, VIS } from "../core/data.js";
import { mulberry } from "../core/util.js";
import * as THREE from "three";
import { borderMat, cloudMats, fireCfg, fireLight, floorCanvas, floorCtx, floorMat, floorTex, hemi, mistMats, moon, moonHalo, moonSprite, outerMat, ridgeCanvas, ridgeMat, ridgeTex, ring, scene, setWeather, skyState, skyU, view } from "./scene.js";
import { SCENERY, clearScenery } from "./scenery.js";

export function drawFloor(ti) {
  const g = floorCtx, W = floorCanvas.width, R = mulberry(THEMES[ti].seed * 7919 + 13), k = W / 512, kind = THEMES[ti].floorKind;
  g.globalAlpha = 1;
  g.fillStyle = "#bdbdbd"; g.fillRect(0, 0, W, W);
  const blot = (n, a, r0, r1) => {
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = R() * W, r = (r0 + R() * (r1 - r0)) * k, v = R() < 0.5 ? 0 : 255;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  };
  const dots = (n, a, s) => { for (let i = 0; i < n; i++) { const v = (R() * 255) | 0; g.fillStyle = `rgba(${v},${v},${v},${a})`; g.fillRect(R() * W, R() * W, s * k, s * k); } };
  const lines = (n, len, a, w, light) => {
    g.lineWidth = w * k; g.strokeStyle = light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    for (let i = 0; i < n; i++) { const x = R() * W, y = R() * W, an = R() * 6.28, l = len * k * (0.3 + R()); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
  };
  const cracks = (n, steps, a) => {
    for (let i = 0; i < n; i++) {
      let x = R() * W, y = R() * W, an = R() * 6.28;
      g.strokeStyle = `rgba(0,0,0,${a})`; g.lineWidth = (1 + R()) * k; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < steps; s++) { an += (R() - 0.5) * 1.2; x += Math.cos(an) * (10 + R() * 18) * k; y += Math.sin(an) * (10 + R() * 18) * k; g.lineTo(x, y); }
      g.stroke();
    }
  };
  blot(60, 0.22, 30, 90); blot(40, 0.15, 20, 60);
  switch (kind) {
    case "grass": dots(2500, 0.25, 1.5); lines(900, 10, 0.35, 1, true); lines(500, 10, 0.3, 1, false); blot(10, 0.2, 15, 30); break;
    case "wet": blot(25, 0.3, 20, 50); cracks(10, 8, 0.35); dots(1500, 0.2, 1); break;
    case "flag": {
      const sz = 64 * k;
      for (let y = 0; y < W; y += sz) for (let x = 0; x < W; x += sz) { const v = (R() * 255) | 0; g.fillStyle = `rgba(${v},${v},${v},.16)`; g.fillRect(x, y, sz, sz); }
      g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 2 * k;
      for (let p = 0; p <= W; p += sz) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, W); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(W, p); g.stroke(); }
      cracks(14, 6, 0.4); dots(1500, 0.2, 1.5); break;
    }
    case "dirt": dots(3000, 0.3, 2); lines(600, 8, 0.3, 1, true); cracks(8, 6, 0.3); break;
    case "snow": blot(80, 0.2, 15, 50); dots(1800, 0.4, 1.5); lines(30, 60, 0.25, 1, true); cracks(6, 5, 0.2); break;
    case "ash": cracks(30, 10, 0.5); dots(2500, 0.3, 2); blot(30, 0.3, 10, 30); break;
    case "facet":
      for (let i = 0; i < 40; i++) { const v = (R() * 255) | 0; g.fillStyle = `rgba(${v},${v},${v},.12)`; g.beginPath(); g.moveTo(R() * W, R() * W); g.lineTo(R() * W, R() * W); g.lineTo(R() * W, R() * W); g.fill(); }
      lines(60, 70, 0.2, 1.5, true); cracks(8, 6, 0.25); break;
    case "bone": cracks(22, 9, 0.45); dots(2000, 0.3, 2); lines(40, 14, 0.4, 2, true); break;
    default: {
      const sz = 128 * k;
      for (let y = 0; y < W; y += sz) for (let x = 0; x < W; x += sz) { g.fillStyle = ((x + y) / sz) % 2 ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.08)"; g.fillRect(x, y, sz, sz); }
      g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 2 * k;
      for (let p = 0; p <= W; p += sz) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, W); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(W, p); g.stroke(); }
      cracks(10, 6, 0.4);
    }
  }
  floorTex.needsUpdate = true;
}

// Bölüm temasına göre gökyüzü: tema kimliği değil dekor adı (scenery) anahtardır; bilinmeyen tema "forest" gibi davranır.
// ridge: ufuk siluet türü, cloud: bulut yoğunluğu, stars: yıldız parlaklığı, moon: ay ölçeği, moonCol: ay rengi (yoksa tema ay rengi), aurora: aurora rengi
export const SKY = {
  forest: { ridge: "forest", cloud: 0.35, stars: 1, moon: 1 },
  cave: { ridge: "rock", cloud: 0, stars: 0.25, moon: 0.6 },
  ruins: { ridge: "ruins", cloud: 0.5, stars: 0.8, moon: 1.1 },
  graveyard: { ridge: "dead", cloud: 0.6, stars: 0.6, moon: 1.3, moonCol: 0xcfffe0 },
  ice: { ridge: "mountain", cloud: 0.25, stars: 1, moon: 1, aurora: 0x5affc8 },
  village: { ridge: "village", cloud: 0.45, stars: 0.5, moon: 1.1, moonCol: 0xffb080 },
  crystals: { ridge: "mountain", cloud: 0.2, stars: 1, moon: 0.9, aurora: 0xb06bff },
  tower: { ridge: "mountain", cloud: 0.8, stars: 0.6, moon: 0.9 },
  castle: { ridge: "castle", cloud: 0.5, stars: 0.7, moon: 1.5, moonCol: 0xff4a4a },
};
const tmpC = new THREE.Color();

// ufuk siluetini canvas'a çizer (beyaz dolgu, alfa kanalı; renk malzemeden). Profil dönemsel: dokunun uçları dikişsiz birleşir.
export function drawRidge(kind, seed) {
  const g = ridgeCanvas.getContext("2d"), W = ridgeCanvas.width, H = ridgeCanvas.height, R = mulberry(seed * 104729 + 5);
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#fff";
  const wrap = (fn) => { fn(0); fn(-W); fn(W); }; // kenarlardan taşan şekiller karşı uçta da çizilir
  const profile = (base, amps) => { // sinüs toplamı dağ profili; tam sayı frekanslar = dönemsel
    const ph = amps.map(() => R() * 6.28);
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      let y = base;
      amps.forEach(([k, a], i) => { y -= a * (1 - Math.abs(Math.sin((x / W) * Math.PI * k + ph[i]))); });
      g.lineTo(x, y * H);
    }
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  const trees = (n, hMin, hMax, base) => {
    g.fillRect(0, base * H, W, H);
    for (let i = 0; i < n; i++) {
      const x = R() * W, w = (0.012 + R() * 0.02) * W / 2, h = (hMin + R() * (hMax - hMin)) * H;
      wrap((o) => { g.beginPath(); g.moveTo(x + o - w, base * H + 2); g.lineTo(x + o, base * H - h); g.lineTo(x + o + w, base * H + 2); g.closePath(); g.fill(); });
    }
  };
  switch (kind) {
    case "mountain": profile(0.78, [[5, 0.34], [11, 0.14], [23, 0.06]]); break;
    case "rock": profile(0.7, [[4, 0.3], [9, 0.2], [19, 0.1], [37, 0.05]]); break;
    case "forest": profile(0.9, [[3, 0.14]]); trees(IS_TOUCH_N(W) , 0.14, 0.4, 0.75); break;
    case "dead": profile(0.92, [[4, 0.1]]); trees(IS_TOUCH_N(W) / 2, 0.25, 0.55, 0.85); break;
    case "village": {
      profile(0.9, [[3, 0.1]]);
      for (let i = 0; i < 18; i++) {
        const x = R() * W, w = (0.012 + R() * 0.012) * W, h = (0.18 + R() * 0.2) * H, y = 0.9 * H;
        wrap((o) => { g.fillRect(x + o, y - h, w, h + 4); g.beginPath(); g.moveTo(x + o - w * 0.15, y - h); g.lineTo(x + o + w / 2, y - h - w * 0.45); g.lineTo(x + o + w * 1.15, y - h); g.fill(); });
      }
      break;
    }
    case "ruins": {
      profile(0.9, [[3, 0.08]]);
      for (let i = 0; i < 16; i++) {
        const x = R() * W, w = (0.008 + R() * 0.01) * W, h = (0.15 + R() * 0.45) * H, y = 0.9 * H, broken = R() < 0.5 ? 0.6 : 1;
        wrap((o) => g.fillRect(x + o, y - h * broken, w, h * broken + 4));
      }
      break;
    }
    case "castle": {
      profile(0.86, [[3, 0.1], [7, 0.05]]);
      for (let i = 0; i < 7; i++) {
        const x = ((i + R() * 0.6) / 7) * W, w = (0.02 + R() * 0.012) * W, h = (0.35 + R() * 0.3) * H, y = 0.9 * H;
        wrap((o) => {
          g.fillRect(x + o, y - h, w, h + 4);
          if (i % 2) { g.beginPath(); g.moveTo(x + o - w * 0.2, y - h); g.lineTo(x + o + w / 2, y - h - w * 1.5); g.lineTo(x + o + w * 1.2, y - h); g.fill(); }
          else for (let k = 0; k < 4; k++) g.fillRect(x + o + (k * w) / 3.4, y - h - w * 0.28, w / 6.5, w * 0.3);
        });
      }
      break;
    }
    default: profile(0.85, [[4, 0.2]]);
  }
  ridgeTex.needsUpdate = true;
}
const IS_TOUCH_N = (W) => (W > 1500 ? 140 : 70);

export function applySky(t) {
  const k = SKY[t.scenery] || SKY.forest;
  skyU.bot.value.setHex(t.bg);
  skyU.top.value.setHex(t.hemi).multiplyScalar(0.55);
  skyU.glow.value.setHex(t.hemi).multiplyScalar(0.45);
  skyU.aur.value.setHex(k.aurora || 0x000000);
  skyU.aurK.value = k.aurora ? 0.8 : 0;
  const mc = k.moonCol !== undefined ? k.moonCol : t.moon;
  moonSprite.material.color.setHex(0xffffff).lerp(tmpC.setHex(mc), 0.55);
  moonHalo.material.color.setHex(mc);
  moonSprite.scale.setScalar(11 * k.moon);
  moonHalo.scale.setScalar(36 * k.moon);
  skyState.stars = k.stars;
  const cloudCol = tmpC.setHex(t.hemi).lerp(new THREE.Color(0xffffff), 0.35);
  for (const m of cloudMats) { m.color.copy(cloudCol); m.opacity = 0.42 * k.cloud; }
  ridgeMat.color.setHex(t.bg).multiplyScalar(0.4);
}
export function applyTheme(i) {
  const t = THEMES[i], v = VIS[i];
  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.bg);
  floorMat.color.setHex(t.floor).multiplyScalar(2);
  outerMat.color.setHex(t.floor).multiplyScalar(0.45);
  borderMat.color.setHex(t.ring);
  ring.material.color.setHex(t.ring);
  hemi.color.setHex(t.hemi);
  moon.color.setHex(t.moon);
  moonHalo.material.color.setHex(t.moon);
  applySky(t);
  view.baseFog = t.fog;
  scene.fog.density = view.baseFog / view.camK;
  mistMats[0].color.setHex(t.hemi); mistMats[1].color.setHex(t.hemi);
  mistMats[0].opacity = v.mist; mistMats[1].opacity = v.mist * 0.7;
  setWeather(v.w);
  document.documentElement.style.setProperty("--moon", "#" + t.moon.toString(16).padStart(6, "0"));
  if (i !== view.curTheme) { // dekor yalnız tema değişince yenilenir
    view.curTheme = i;
    drawFloor(i);
    drawRidge((SKY[t.scenery] || SKY.forest).ridge, t.seed + 3);
    clearScenery();
    fireCfg.base = 0; fireLight.intensity = 0;
    SCENERY[t.scenery]();
  }
}
