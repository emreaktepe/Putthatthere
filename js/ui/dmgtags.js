// "Etkili!" / "Dirençli" etiketleri: DOM havuzu (WebGL'e dokunmaz), en çok TAG_MAX öğe; CSS animasyonu (css/game.css .dmgtag).
// Metinler config strings.matchup içinde (yoksa varsayılan). prefers-reduced-motion: CSS'te yalnız solma.
import { STRINGS } from "../core/data.js";
import { camera } from "../render/scene.js";
import * as THREE from "three";
import { TAG_LIFE_MS, TAG_MAX, makeTagGate, tagKind } from "./tagmodel.js";

const gate = makeTagGate();
const pool = [];
let host = null;
const v = new THREE.Vector3();
const TEXT = { e: "Etkili!", d: "Dirençli" };

function ensureHost() {
  if (host) return;
  host = document.createElement("div");
  host.id = "dmgtags";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  for (let i = 0; i < TAG_MAX; i++) {
    const el = document.createElement("span");
    el.className = "dmgtag";
    el.hidden = true;
    host.appendChild(el);
    pool.push({ el, until: 0 });
  }
}

// e: düşman (mesh.position), level: "E"|"N"|"D"|"I", color: silah rengi (hex int)
export function popTag(e, level, color) {
  const kind = tagKind(level);
  if (!kind) return;
  const now = performance.now();
  if (!gate.allow(e, now)) return;
  ensureHost();
  const slot = pool.find((s) => s.until <= now);
  if (!slot) return;
  v.copy(e.mesh.position); v.y += (e.d.y || 1) + 0.9;
  v.project(camera);
  if (v.z > 1) return;
  const x = (v.x * 0.5 + 0.5) * window.innerWidth, y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  const m = (STRINGS.matchup || {});
  const el = slot.el;
  el.textContent = kind === "e" ? (m.effective || TEXT.e) : (m.resist || TEXT.d);
  el.className = "dmgtag " + kind;
  el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px";
  el.style.color = "#" + color.toString(16).padStart(6, "0");
  el.hidden = false;
  void el.offsetWidth; // animasyonu yeniden başlat
  el.classList.add("go");
  slot.until = now + TAG_LIFE_MS;
  setTimeout(() => { if (slot.until <= performance.now() + 20) el.hidden = true; }, TAG_LIFE_MS + 40);
}
