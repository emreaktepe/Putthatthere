// Kamera matematiği: kamera-göreli hareket, açı yumuşatma, hazır açılar, tercih kaydı.
import test from "node:test";
import assert from "node:assert/strict";
import { CAM_KEY, CAM_PRESETS, ZOOM_MAX, ZOOM_MIN, angleDelta, camOffset, damp, dampAngle, loadCam, nextPresetId, normAngle, rotateMove, sanitizeCam, saveCam } from "../js/game/cameramath.js";

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };

test("rotateMove: yaw 0 özdeşlik, yaw 90 derecede ileri = -x", () => {
  const a = rotateMove(1, -1, 0);
  near(a.x, 1); near(a.z, -1);
  const b = rotateMove(0, -1, Math.PI / 2); // W tuşu: ekranda yukarı
  near(b.x, -1); near(b.z, 0);
});

test("rotateMove: kamera yönüne bakınca 'ileri' kameranın baktığı yerdir", () => {
  for (const yaw of [0.3, 1.2, -2.1, 3]) {
    const off = camOffset(40, 10, yaw); // kamera odaktan bu kadar uzakta; baktığı yön = -off (yatayda)
    const m = rotateMove(0, -1, yaw);
    const len = Math.hypot(off.x, off.z);
    near(m.x, -off.x / len); near(m.z, -off.z / len);
  }
});

test("rotateMove vektör uzunluğunu korur", () => {
  const m = rotateMove(0.6, 0.8, 2.2);
  near(Math.hypot(m.x, m.z), 1);
});

test("normAngle / angleDelta en kısa yolu seçer", () => {
  near(Math.abs(normAngle(3 * Math.PI)), Math.PI); near(normAngle(2.5 * Math.PI), Math.PI / 2);
  near(angleDelta(3.0, -3.0), 2 * Math.PI - 6.0);
  assert.ok(Math.abs(angleDelta(0, 7)) < Math.PI);
});

test("damp hedefe yaklaşır, aşmaz; dampAngle sarmalı geçer", () => {
  let v = 0;
  for (let i = 0; i < 200; i++) v = damp(v, 10, 6, 1 / 60);
  assert.ok(v > 9.9 && v <= 10);
  let a = 3.0;
  for (let i = 0; i < 100; i++) a = dampAngle(a, -3.0, 8, 1 / 60);
  assert.ok(Math.abs(angleDelta(a, -3.0)) < 0.01);
});

test("hazır açılar: en az 3, yükseklik sırası yukarıdan alçağa, id'ler tekil, döngü kapanır", () => {
  assert.ok(CAM_PRESETS.length >= 3);
  assert.equal(new Set(CAM_PRESETS.map((p) => p.id)).size, CAM_PRESETS.length);
  assert.ok(CAM_PRESETS[0].elev > CAM_PRESETS[1].elev && CAM_PRESETS[1].elev > CAM_PRESETS[2].elev);
  let id = CAM_PRESETS[0].id;
  for (let i = 0; i < CAM_PRESETS.length; i++) id = nextPresetId(id);
  assert.equal(id, CAM_PRESETS[0].id);
  assert.equal(nextPresetId(CAM_PRESETS[0].id, -1), CAM_PRESETS[CAM_PRESETS.length - 1].id);
});

test("alçak açı gökyüzünü gösterir: kamera bakış eğimi alan yarı açısından küçük", () => {
  const low = CAM_PRESETS.find((p) => p.id === "low"), fovHalf = 27.5;
  const o = camOffset(low.elev, low.dist, 0);
  const pitchDown = (Math.atan2(o.y - low.lookY, Math.hypot(o.x, o.z)) * 180) / Math.PI;
  assert.ok(pitchDown < fovHalf, `eğim ${pitchDown}`);
});

test("sanitizeCam: bozuk girdi varsayılana, aralık dışı kırpılır", () => {
  assert.deepEqual(sanitizeCam(null), { preset: "tilt", yaw: 0, zoom: 1 });
  assert.deepEqual(sanitizeCam("x"), { preset: "tilt", yaw: 0, zoom: 1 });
  const s = sanitizeCam({ preset: "evil", yaw: Infinity, zoom: 99 });
  assert.equal(s.preset, "tilt"); assert.equal(s.yaw, 0); assert.equal(s.zoom, ZOOM_MAX);
  assert.equal(sanitizeCam({ zoom: -1 }).zoom, ZOOM_MIN);
});

test("saveCam/loadCam: gidiş-dönüş, bozuk JSON ve depolama yokluğu", () => {
  const st = mem();
  assert.equal(saveCam({ preset: "low", yaw: 1, zoom: 1.2 }, st), true);
  assert.deepEqual(loadCam(st), { preset: "low", yaw: 1, zoom: 1.2 });
  st.setItem(CAM_KEY, "{bozuk");
  assert.deepEqual(loadCam(st), { preset: "tilt", yaw: 0, zoom: 1 });
  assert.deepEqual(loadCam(null), { preset: "tilt", yaw: 0, zoom: 1 });
  assert.equal(saveCam({}, null), false);
});
