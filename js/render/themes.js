// Zemin dokusu ve tema uygulama. Tema verisi (renkler, hava, zemin türü, dekor) data/game.config.json -> themes.
import { THEMES, VIS } from "../core/data.js";
import { mulberry } from "../core/util.js";
import { borderMat, fireCfg, fireLight, floorCanvas, floorCtx, floorMat, floorTex, hemi, mistMats, moon, moonHalo, outerMat, ring, scene, setWeather, skyU, view } from "./scene.js";
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
  skyU.top.value.setHex(t.hemi).multiplyScalar(0.3);
  skyU.bot.value.setHex(t.bg);
  view.baseFog = t.fog;
  scene.fog.density = view.baseFog / view.camK;
  mistMats[0].color.setHex(t.hemi); mistMats[1].color.setHex(t.hemi);
  mistMats[0].opacity = v.mist; mistMats[1].opacity = v.mist * 0.7;
  setWeather(v.w);
  document.documentElement.style.setProperty("--moon", "#" + t.moon.toString(16).padStart(6, "0"));
  if (i !== view.curTheme) { // dekor yalnız tema değişince yenilenir
    view.curTheme = i;
    drawFloor(i);
    clearScenery();
    fireCfg.base = 0; fireLight.intensity = 0;
    SCENERY[t.scenery]();
  }
}
