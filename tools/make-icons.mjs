// Uygulama ikonlarını kodla üretir (bağımlılıksız): node tools/make-icons.mjs
import fs from "node:fs";
import zlib from "node:zlib";

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const GOLD = hex("#ffd36e"), GOLD2 = hex("#ff9f1c"), HAT = hex("#2a1566"), HAT2 = hex("#4b2a9c");

function inTri(p, a, b, c) {
  const s = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function inStar(p, cx, cy, R, r) {
  const dx = p[0] - cx, dy = p[1] - cy, ang = Math.atan2(dy, dx) + Math.PI / 2;
  const k = ((ang % (Math.PI * 2 / 5)) + Math.PI * 2 / 5) % (Math.PI * 2 / 5) - Math.PI / 5;
  const rad = r + (R - r) * (1 - Math.abs(k) / (Math.PI / 5));
  return Math.hypot(dx, dy) < rad;
}

// uv: 0..1 -> [r,g,b]; içerik güvenli alan için ortada %78'e ölçeklenir
function shade(u, v) {
  const S = 0.78, x = (u - 0.5) / S + 0.5, y = (v - 0.5) / S + 0.5;
  let c = mix(hex("#0a0714"), hex("#4b2a9c"), Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.38) / 0.75) ** 1.4);
  // yıldız tozu
  for (const [sx, sy, sr] of [[0.18, 0.2, 0.012], [0.82, 0.16, 0.016], [0.9, 0.5, 0.01], [0.1, 0.55, 0.012], [0.72, 0.88, 0.01], [0.28, 0.9, 0.012]])
    if (Math.hypot(u - sx, v - sy) < sr) c = [1, 1, 1];
  // hilal
  const glow = Math.max(0, 1 - Math.hypot(x - 0.5, y - 0.42) / 0.5);
  c = mix(c, GOLD2, glow * glow * 0.35);
  if (Math.hypot(x - 0.5, y - 0.42) < 0.3 && Math.hypot(x - 0.62, y - 0.36) > 0.25) c = mix(GOLD, GOLD2, (y - 0.12) / 0.6);
  // şapka: gövde, kıvrık uç, kenar
  const body = inTri([x, y], [0.5, 0.74], [0.5, 0.74], [0.5, 0.74]);
  void body;
  const cone = inTri([x, y], [0.3, 0.78], [0.7, 0.78], [0.56, 0.24]) || inTri([x, y], [0.5, 0.3], [0.6, 0.3], [0.7, 0.3]);
  const tip = Math.hypot(x - 0.62, y - 0.27) < 0.05 && y < 0.3;
  const brim = ((x - 0.5) / 0.36) ** 2 + ((y - 0.79) / 0.06) ** 2 < 1;
  if (cone || tip || brim) {
    c = mix(HAT2, HAT, Math.min(1, Math.max(0, (y - 0.25) / 0.55)));
    if (brim && !cone) c = mix(HAT2, hex("#7a52d6"), 0.5);
    if (y > 0.69 && y < 0.745 && cone) c = GOLD2;
    if (inStar([x, y], 0.5, 0.5, 0.07, 0.03)) c = GOLD;
  }
  return c;
}

function render(size) {
  const N = 3, buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) {
      const c = shade((px + (sx + 0.5) / N) / size, (py + (sy + 0.5) / N) / size);
      r += c[0]; g += c[1]; b += c[2];
    }
    const o = (py * size + px) * 4, n = N * N;
    buf[o] = Math.round((r / n) * 255); buf[o + 1] = Math.round((g / n) * 255); buf[o + 2] = Math.round((b / n) * 255); buf[o + 3] = 255;
  }
  return buf;
}

function png(size, rgba) {
  const chunk = (type, data) => {
    const t = Buffer.from(type), len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

for (const [name, size] of [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]])
  fs.writeFileSync(new URL(`../assets/${name}`, import.meta.url), png(size, render(size)));
console.log("ikonlar üretildi: assets/");
