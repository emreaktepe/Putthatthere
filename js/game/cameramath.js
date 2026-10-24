// Kamera matematiği ve tercih kaydı. Saf: DOM ve Three.js'e dokunmaz, Node'da test edilir.
// Açılar: elev = yerden yükseklik açısı (derece), yaw = dünya Y ekseni etrafında dönüş (radyan, 0 = kamera +z tarafında).

export const CAM_KEY = "buyucu_kamera";
export const CAM_PRESETS = [
  { id: "top", name: "Yukarıdan", elev: 70, dist: 23, lookY: 0 },
  { id: "tilt", name: "Eğik", elev: 52, dist: 21, lookY: 0 },
  { id: "low", name: "Omuz (alçak)", elev: 18, dist: 15, lookY: 2 },
];
export const DEFAULT_CAM = { preset: "tilt", yaw: 0, zoom: 1 };
export const ZOOM_MIN = 0.7, ZOOM_MAX = 1.4;
const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
export const presetById = (id) => CAM_PRESETS.find((p) => p.id === id) || CAM_PRESETS[1];
export function nextPresetId(id, step = 1) {
  const i = CAM_PRESETS.findIndex((p) => p.id === id);
  return CAM_PRESETS[(Math.max(i, 0) + step + CAM_PRESETS.length) % CAM_PRESETS.length].id;
}

// açıyı [-PI, PI) aralığına getirir
export function normAngle(a) {
  let r = (a + Math.PI) % TAU;
  if (r < 0) r += TAU;
  return r - Math.PI;
}
export const angleDelta = (from, to) => normAngle(to - from);
// kare hızından bağımsız üstel yumuşatma (lambda büyüdükçe hızlı)
export const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
export const dampAngle = (cur, target, lambda, dt) => cur + angleDelta(cur, target) * (1 - Math.exp(-lambda * dt));

// kamera-göreli hareket: ekran girdisi (dx sağ+, dz aşağı+) -> dünya (x, z). yaw = 0 iken özdeşlik.
export function rotateMove(dx, dz, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { x: dx * c + dz * s, z: -dx * s + dz * c };
}

// odak noktasına göre kamera konumu farkı
export function camOffset(elevDeg, dist, yaw) {
  const e = (elevDeg * Math.PI) / 180;
  return { x: Math.sin(yaw) * Math.cos(e) * dist, y: Math.sin(e) * dist, z: Math.cos(yaw) * Math.cos(e) * dist };
}

// kayıtlı tercih güvenilmez girdi sayılır
export function sanitizeCam(raw) {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const preset = CAM_PRESETS.some((p) => p.id === o.preset) ? o.preset : DEFAULT_CAM.preset;
  const yaw = typeof o.yaw === "number" && Number.isFinite(o.yaw) ? normAngle(o.yaw) : 0;
  const zoom = typeof o.zoom === "number" && Number.isFinite(o.zoom) ? clamp(o.zoom, ZOOM_MIN, ZOOM_MAX) : 1;
  return { preset, yaw, zoom };
}

function store(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage || null; } catch (e) { return null; }
}
export function loadCam(storage) {
  const st = store(storage);
  if (!st) return { ...DEFAULT_CAM };
  try { return sanitizeCam(JSON.parse(st.getItem(CAM_KEY))); } catch (e) { return { ...DEFAULT_CAM }; }
}
export function saveCam(settings, storage) {
  const st = store(storage);
  if (!st) return false;
  try { st.setItem(CAM_KEY, JSON.stringify(sanitizeCam(settings))); return true; } catch (e) { return false; }
}
