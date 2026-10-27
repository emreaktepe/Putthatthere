// Kamera donanımı: hazır açılar, yaw döndürme (Z/C, sağ tuş sürükleme), tekerlekle yaklaş-uzaklaş, pürüzsüz geçiş, tercihin kaydı.
// Hareket ve nişan yaw'a göre loop.js'te hesaplanır (rig.yaw okunur). Girdi dinleyicileri modül yüklenince bir kez eklenir.
import { CAM_PRESETS, ZOOM_MAX, ZOOM_MIN, camOffset, clamp, damp, dampAngle, loadCam, nextPresetId, normAngle, presetById, saveCam } from "../game/cameramath.js";
import { camera, skyGroup, view } from "./scene.js";

const settings = loadCam();
const p0 = presetById(settings.preset);
export const rig = { yaw: settings.yaw, yawTarget: settings.yaw, elev: p0.elev, dist: p0.dist, lookY: p0.lookY, zoom: settings.zoom, preset: settings.preset };
const held = new Set();
const sweep = { t: 0, dur: 1.2 }; // bölüm başı süpürme: geniş-yüksek açıdan oyun açısına
export function startSweep(dur = 1.2) { sweep.t = sweep.dur = dur; }
export const skipSweep = () => { if (sweep.t > 0.15) sweep.t = 0.15; };
let drag = null, snap = true, listener = null;

export const setCamListener = (fn) => { listener = fn; };
const persist = () => saveCam({ preset: rig.preset, yaw: rig.yawTarget, zoom: rig.zoom });
export const currentPreset = () => presetById(rig.preset);

export function setPreset(id, silent = false) {
  rig.preset = presetById(id).id;
  persist();
  if (!silent && listener) listener(currentPreset());
}
export const cyclePreset = (step = 1) => setPreset(nextPresetId(rig.preset, step));
export function rotateBy(rad) { rig.yawTarget = normAngle(rig.yawTarget + rad); }
export function zoomBy(f) { rig.zoom = clamp(rig.zoom * f, ZOOM_MIN, ZOOM_MAX); persist(); }

const playing = () => document.body.classList.contains("playing");
addEventListener("keydown", (e) => {
  if (!playing()) return;
  skipSweep();
  if (e.code === "KeyZ" || e.code === "KeyC") held.add(e.code);
  else if (e.code === "KeyV" && !e.repeat) cyclePreset();
});
addEventListener("keyup", (e) => held.delete(e.code));
addEventListener("blur", () => { held.clear(); drag = null; });
addEventListener("wheel", (e) => {
  if (!playing()) return;
  zoomBy(e.deltaY > 0 ? 1.08 : 1 / 1.08);
}, { passive: true });
addEventListener("pointerdown", (e) => {
  if (playing()) skipSweep();
  if (e.button === 2 && e.pointerType === "mouse" && playing()) drag = { id: e.pointerId, x: e.clientX };
});
addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  rotateBy(-(e.clientX - drag.x) * 0.008);
  drag.x = e.clientX;
});
const endDrag = (e) => { if (drag && e.pointerId === drag.id) { drag = null; persist(); } };
addEventListener("pointerup", endDrag);
addEventListener("pointercancel", endDrag);

// Her kare: hedef değerlere yumuşak yaklaş, kamerayı odağa yerleştir. shake: titreme genliği (x, y, z için rastgele ofset üreticisi).
export function updateCamera(dt, fx, fz, shake) {
  const p = currentPreset();
  if (held.has("KeyZ")) rig.yawTarget = normAngle(rig.yawTarget - 1.8 * dt);
  if (held.has("KeyC")) rig.yawTarget = normAngle(rig.yawTarget + 1.8 * dt);
  const dist = p.dist * rig.zoom * view.camK;
  if (snap) { rig.elev = p.elev; rig.dist = dist; rig.lookY = p.lookY; rig.yaw = rig.yawTarget; snap = false; }
  else {
    rig.elev = damp(rig.elev, p.elev, 6, dt);
    rig.dist = damp(rig.dist, dist, 6, dt);
    rig.lookY = damp(rig.lookY, p.lookY, 6, dt);
    rig.yaw = dampAngle(rig.yaw, rig.yawTarget, 9, dt);
  }
  let sk = 0;
  if (sweep.t > 0) { sweep.t = Math.max(0, sweep.t - dt); const u = sweep.t / sweep.dur; sk = u * u * (3 - 2 * u); }
  const o = camOffset(rig.elev + 12 * sk, rig.dist * (1 + 0.4 * sk), rig.yaw);
  camera.position.set(fx + o.x + shake(1), o.y + shake(0.5), fz + o.z + shake(1));
  camera.lookAt(fx, rig.lookY, fz);
  camera.updateMatrixWorld();
  skyGroup.position.set(camera.position.x, 0, camera.position.z);
}

export { CAM_PRESETS };
