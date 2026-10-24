// Paylaşım görseli: assets/art/menu-arkaplan.png (orijinal, repoda yok) -> assets/og-image.png (1200x630).
// Kullanım: node tools/make-og-from-art.mjs [kaynak.png] [çıktı.png]
// Bağımlılıksız: zlib ile PNG çözer (8 bit RGB/RGBA, filtre 0-4, interlace yok), merkezden 1200x630 oranında kırpar,
// kutu ortalamasıyla küçültür, RGB PNG olarak kodlar. Çıktı 2 MB'ı aşarsa hedef dosyaya DOKUNMAZ.
import fs from "node:fs";
import zlib from "node:zlib";

const src = process.argv[2] || "assets/art/menu-arkaplan.png", out = process.argv[3] || "assets/og-image.png";
const OW = 1200, OH = 630, MAX = 2 * 1024 * 1024;

function decode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG değil");
  let p = 8, W = 0, H = 0, depth = 0, ctype = 0, inter = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { W = d.readUInt32BE(0); H = d.readUInt32BE(4); depth = d[8]; ctype = d[9]; inter = d[12]; }
    else if (type === "IDAT") idat.push(d);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (depth !== 8 || (ctype !== 2 && ctype !== 6) || inter) throw new Error(`Desteklenmeyen PNG (bit ${depth}, tür ${ctype}, interlace ${inter})`);
  const bpp = ctype === 6 ? 4 : 3, stride = W * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(H * stride);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], r = y * (stride + 1) + 1, o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[o + x - bpp] : 0, b = y ? px[o - stride + x] : 0, c = x >= bpp && y ? px[o - stride + x - bpp] : 0;
      let v = raw[r + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      else if (f !== 0) throw new Error("Bilinmeyen filtre " + f);
      px[o + x] = v & 255;
    }
  }
  return { W, H, bpp, px };
}

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const t = Buffer.from(type, "ascii"), len = Buffer.alloc(4), c = Buffer.alloc(4);
  len.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
}
function encode(W, H, rgb) {
  const raw = Buffer.alloc(H * (W * 3 + 1));
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; rgb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const { W, H, bpp, px } = decode(fs.readFileSync(src));
// merkezden hedef orana kırp
let cw = W, ch = Math.round((W * OH) / OW);
if (ch > H) { ch = H; cw = Math.round((H * OW) / OH); }
const cx = Math.floor((W - cw) / 2), cy = Math.floor((H - ch) / 2), sx = cw / OW, sy = ch / OH;
const rgb = Buffer.alloc(OW * OH * 3);
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) { // kutu ortalaması
  const x0 = cx + x * sx, x1 = x0 + sx, y0 = cy + y * sy, y1 = y0 + sy; let r = 0, g = 0, b = 0, n = 0;
  for (let yy = Math.floor(y0); yy < Math.min(Math.ceil(y1), H); yy++) for (let xx = Math.floor(x0); xx < Math.min(Math.ceil(x1), W); xx++) {
    const w = (Math.min(xx + 1, x1) - Math.max(xx, x0)) * (Math.min(yy + 1, y1) - Math.max(yy, y0)), i = (yy * W + xx) * bpp;
    r += px[i] * w; g += px[i + 1] * w; b += px[i + 2] * w; n += w;
  }
  const o = (y * OW + x) * 3; rgb[o] = Math.round(r / n); rgb[o + 1] = Math.round(g / n); rgb[o + 2] = Math.round(b / n);
}
const png = encode(OW, OH, rgb);
if (png.length > MAX) { console.error(`Vazgeçildi: ${(png.length / 1048576).toFixed(2)} MB > 2 MB; ${out} değiştirilmedi.`); process.exit(2); }
fs.writeFileSync(out, png);
console.log(`${out}: ${OW}x${OH}, ${(png.length / 1024).toFixed(0)} KB`);
