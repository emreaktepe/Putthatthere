// Görsel envanteri: node tools/check-art.mjs [config.json]  (npm run art)
//  (a) config'te başvurulan görsel yolları var mı (yoksa çıkış kodu 1),
//  (b) beklenen dosya listesinden (adlandırma şeması, config kimliklerinden türetilir) hangileri var / eksik,
//  (c) mevcut dosyaların piksel boyutu (WebP başlığından), dosya boyutu ve bütçe (> 200 KB uyarı).
// Bağımlılık yok. Çıktı Türkçe; eksikler önce.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UI_ICON_FILES } from "../js/config/registry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfgPath = path.resolve(process.argv[2] || path.join(root, "data/game.config.json"));
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const ART_DIR = path.join(root, "assets/art");
const BUDGET = 200 * 1024;
const kb = (n) => (n / 1024).toFixed(0) + " KB";

// ---- WebP başlığından boyut / şeffaflık (VP8, VP8L, VP8X); okunamazsa null ----
export function webpInfo(buf) {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const t = buf.toString("ascii", 12, 16);
  if (t === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), alpha: !!(buf[20] & 0x10) };
  if (t === "VP8L") { const v = buf.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >>> 14) & 0x3fff) + 1, alpha: !!((v >>> 28) & 1) }; }
  if (t === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, alpha: false };
  return null;
}

// ---- config'te başvurulan yollar ----
const refs = new Map(); // yol -> ["weapons/fire/image", ...]
(function walk(v, p) {
  if (typeof v === "string") { if (/^assets\/art\//.test(v)) refs.set(v, [...(refs.get(v) || []), p]); }
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + "/" + i));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p + "/" + k);
})(cfg, "");

// ---- beklenen liste ----
const ids = (k) => Object.keys(cfg[k] || {});
const E = []; // { group, pr, file, hint, field? }
const add = (group, pr, name, hint, field) => E.push({ group, pr, file: `assets/art/${name}.webp`, hint, field });
for (const id of ids("characters")) add("Karakter portreleri", "hazır", `portre-${id}`, "kare 512-1024, şeffaf", `characters/${id}/portrait`);
for (const id of Object.keys(cfg.weapons || {})) add("Büyü ikonları", "hazır", `ikon-buyu-${id}`, "kare 512, şeffaf", `weapons/${id}/image`);
for (const id of Object.keys(cfg.weapons || {})) add("Büyü ikonları (128 px)", "P2", `ikon-buyu-${id}-128`, "kare 128, şeffaf", `weapons/${id}/imageSmall`);
for (const id of ids("abilities")) { add("Yetenek ikonları", "hazır", `ikon-yetenek-${id}`, "kare 512, şeffaf", `abilities/${id}/image`); add("Yetenek ikonları", "hazır", `ikon-yetenek-${id}-128`, "kare 128, şeffaf", `abilities/${id}/imageSmall`); }
for (const id of ids("perks")) add("Perk ikonları", "P1", `ikon-perk-${id}`, "kare 512, şeffaf", `perks/${id}/image`);
for (const id of ids("enemies")) add("Düşman ikonları", "P1", `dusman-${id}`, "kare 512, şeffaf", `enemies/${id}/image`);
for (const id of ids("levels")) add("Bölüm kapakları", "P1", `bolum-${id}`, "yatay 3:2 (1536x1024), opak", `levels/${id}/image`);
for (const id of ids("levels")) add("Harita düğüm madalyonları", "P2", `dugum-${id}`, "kare 256-512", `levels/${id}/nodeImage`);
for (const [key, ad] of Object.entries(UI_ICON_FILES)) add("Arayüz ikonları", "P2", `ui-${ad}`, "kare 128-256, şeffaf", `ui/icons/${key}`);
add("Arka planlar", "hazır", "menu-arkaplan", "yatay 3:2, opak", "game/menuBackground");
add("Arka planlar", "hazır", "harita-arkaplan", "yatay 3:2, opak", "map/background/image");

const exists = (f) => fs.existsSync(path.join(root, f));
const info = (f) => { const b = fs.readFileSync(path.join(root, f)); return { size: b.length, meta: webpInfo(b) }; };
const wiring = (e) => (refs.has(e.file) ? "bağlı" : "bağlı değil");
let problems = 0;

console.log("GÖRSEL ENVANTERİ  (" + path.relative(root, cfgPath) + ")\n");

// (a) config başvuruları
const broken = [...refs.keys()].filter((p) => !exists(p));
console.log("1) Config başvuruları: " + refs.size + " yol, " + broken.length + " eksik");
for (const p of broken) { console.log(`   YOK  ${p}  <- ${refs.get(p).join(", ")}`); problems++; }
if (!broken.length) console.log("   hepsi mevcut");

// (b) beklenen dosyalar: eksikler önce
const missing = E.filter((e) => !exists(e.file));
const present = E.filter((e) => exists(e.file));
const order = { P1: 1, P2: 2, P3: 3, "hazır": 4 };
console.log(`\n2) EKSİK dosyalar: ${missing.length} / ${E.length}`);
const byGroup = new Map();
for (const e of missing) byGroup.set(e.group + "|" + e.pr, [...(byGroup.get(e.group + "|" + e.pr) || []), e]);
for (const [k, list] of [...byGroup].sort((a, b) => order[a[0].split("|")[1]] - order[b[0].split("|")[1]])) {
  const [g, pr] = k.split("|");
  console.log(`   [${pr}] ${g}: ${list.length} eksik  (${list[0].hint})`);
  console.log("        " + list.map((e) => path.basename(e.file)).join(", "));
}
if (!missing.length) console.log("   eksik yok");

// (c) mevcutlar
console.log(`\n3) MEVCUT dosyalar: ${present.length} / ${E.length}`);
const warn = [];
const groups = new Map();
for (const e of present) groups.set(e.group, [...(groups.get(e.group) || []), e]);
for (const [g, list] of groups) {
  console.log(`   ${g}`);
  for (const e of list) {
    const { size, meta } = info(e.file);
    const dim = meta ? `${meta.w}x${meta.h}${meta.alpha ? " şeffaf" : " opak"}` : "boyut okunamadı";
    const over = size > BUDGET;
    if (over) warn.push(`${e.file} ${kb(size)}`);
    console.log(`     ${path.basename(e.file).padEnd(30)} ${dim.padEnd(18)} ${kb(size).padStart(7)}  ${wiring(e)}${over ? "  !! bütçe aşıldı (>200 KB)" : ""}`);
  }
}

// listede olmayan dosyalar
const known = new Set(E.map((e) => path.basename(e.file)));
const extra = fs.existsSync(ART_DIR) ? fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".webp") && !known.has(f)) : [];
const pngs = fs.existsSync(ART_DIR) ? fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".png")).length : 0;
if (extra.length) console.log(`\n4) Listede olmayan .webp: ${extra.join(", ")}`);
const unwired = present.filter((e) => !refs.has(e.file));
if (unwired.length) console.log(`\n   Dosyası var ama config'e bağlı değil: ${unwired.map((e) => path.basename(e.file)).join(", ")}`);
if (pngs) console.log(`\n   Not: ${pngs} .png kaynak dosyası var (yalnızca .webp yayınlanır; PNG'ler kaynak olarak kalır).`);

const total = [...E].length;
const wired = E.filter((e) => exists(e.file) && refs.has(e.file)).length;
console.log("\nÖZET");
console.log(`   beklenen ${total} | hazır (dosya var) ${present.length} | config'e bağlı ${wired} | eksik ${missing.length}`);
for (const pr of ["P1", "P2", "P3"]) { const n = missing.filter((e) => e.pr === pr).length; if (n) console.log(`   ${pr}: ${n} eksik`); }
console.log(`   bütçe uyarısı (>200 KB): ${warn.length}${warn.length ? " -> " + warn.join("; ") : ""}`);
console.log(`   config başvuru hatası: ${broken.length}`);
process.exitCode = problems ? 1 : 0;
