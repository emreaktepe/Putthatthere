// Paylaşım önizleme görselini (1200x630) kodla üretir, bağımlılıksız: node tools/make-og-image.mjs
import fs from "node:fs";
import zlib from "node:zlib";

const W = 1200, H = 630;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = (t) => Math.min(1, Math.max(0, t));
const GOLD = hex("#ffd36e"), GOLD2 = hex("#ff9f1c"), HAT = hex("#2a1566"), HAT2 = hex("#4b2a9c");

function inTri(p, a, b, c) {
  const s = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function inStar(p, cx, cy, R, r) {
  const dx = p[0] - cx, dy = p[1] - cy, ang = Math.atan2(dy, dx) + Math.PI / 2, seg = Math.PI * 2 / 5;
  const k = ((ang % seg) + seg) % seg - seg / 2;
  return Math.hypot(dx, dy) < r + (R - r) * (1 - Math.abs(k) / (seg / 2));
}
// sabit tohumlu yıldızlar (piksel koordinatı)
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STARS = Array.from({ length: 70 }, () => [rnd() * W, rnd() * H * 0.7, 1 + rnd() * 2.2]);

function shade(px, py) {
  // gökyüzü: üstte koyu, ufukta mor
  let c = mix(hex("#07040f"), hex("#3a1f7a"), clamp(py / (H * 0.85)) ** 1.5);
  for (const [sx, sy, sr] of STARS) if (Math.hypot(px - sx, py - sy) < sr) c = [1, 1, 1];
  // sağda hilal ve hale
  const mx = 930, my = 190, mr = 110;
  const halo = clamp(1 - Math.hypot(px - mx, py - my) / 320);
  c = mix(c, GOLD2, halo * halo * 0.3);
  if (Math.hypot(px - mx, py - my) < mr && Math.hypot(px - mx - 45, py - my + 30) > mr * 0.86) c = mix(GOLD, GOLD2, clamp((py - 80) / 220));
  // ufukta koyu tepe silueti
  const hill = H - 110 + Math.sin(px / 90) * 22 + Math.sin(px / 33) * 7;
  if (py > hill) return mix(hex("#0a0714"), hex("#150c2c"), clamp((py - hill) / 120));
  // solda büyük büyücü şapkası, yıldız ve kıvrık uç
  const hx = 330, hy = 470, s = 360; // şapkanın taban ortası, ölçek
  const x = (px - hx) / s, y = (py - hy) / s; // taban y=0, yukarı eksi
  const cone = inTri([x, y], [-0.4, 0], [0.4, 0], [0.14, -1.0]) || inTri([x, y], [0.02, -0.78], [0.2, -0.97], [0.44, -0.8]);
  const tip = false;
  const brim = (x / 0.62) ** 2 + ((y - 0.02) / 0.09) ** 2 < 1;
  if (cone || tip || brim) {
    c = mix(HAT2, HAT, clamp((y + 1) / 1.1));
    if (brim && !cone) c = mix(HAT2, hex("#7a52d6"), 0.5);
    if (y > -0.12 && y < -0.03 && cone) c = GOLD2;
    if (inStar([x, y], 0.0, -0.3, 0.12, 0.075)) c = GOLD;
  }
  return c;
}

const N = 2, buf = Buffer.alloc(W * H * 4);
for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
  let r = 0, g = 0, b = 0;
  for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) {
    const c = shade(px + (sx + 0.5) / N, py + (sy + 0.5) / N);
    r += c[0]; g += c[1]; b += c[2];
  }
  const o = (py * W + px) * 4, n = N * N;
  buf[o] = Math.round(r / n * 255); buf[o + 1] = Math.round(g / n * 255); buf[o + 2] = Math.round(b / n * 255); buf[o + 3] = 255;
}

const chunk = (type, data) => {
  const t = Buffer.from(type), len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0);
  return Buffer.concat([len, t, data, crc]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
fs.writeFileSync(new URL("../assets/og-image.png", import.meta.url), png);
console.log("og-image üretildi: assets/og-image.png", W + "x" + H);
