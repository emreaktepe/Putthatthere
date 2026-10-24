// Yönetim sayfası: JSON Pointer yardımcıları ve "taban ↔ çalışma kopyası" farkı. Saf; DOM'a dokunmaz (Node'da test edilir).
// Fark seyrek yama olarak (storage.js taslak biçimi: set/remove) üretilir; diziler bütün olarak karşılaştırılır.

import { canonicalize } from "../config/hash.js";
import { parsePointer } from "../config/patch.js";
import { FORBIDDEN_KEYS } from "../config/registry.js";
import { describePath } from "../config/validate.js";

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const esc = (s) => String(s).replace(/~/g, "~0").replace(/\//g, "~1");
export const ptr = (segs) => segs.map((s) => "/" + esc(s)).join("");
export const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
export const same = (a, b) => canonicalize(a) === canonicalize(b);

export function getAt(root, pointer) {
  let n = root;
  for (const s of parsePointer(pointer)) {
    if (n === null || typeof n !== "object") return undefined;
    if (Array.isArray(n)) { if (!/^\d+$/.test(s)) return undefined; n = n[+s]; } else if (has(n, s)) n = n[s]; else return undefined;
  }
  return n;
}

// Kökü yerinde değiştirir. value === undefined -> sil. Üst düğüm yoksa false döner. Yasak anahtarlar reddedilir.
export function setAt(root, pointer, value) {
  const segs = parsePointer(pointer);
  if (!segs.length || segs.some((s) => FORBIDDEN_KEYS.includes(s))) return false;
  let n = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (n === null || typeof n !== "object") return false;
    n = Array.isArray(n) ? n[+s] : has(n, s) ? n[s] : undefined;
  }
  const last = segs[segs.length - 1];
  if (n === null || typeof n !== "object") return false;
  if (Array.isArray(n)) {
    const i = last === "-" ? n.length : +last;
    if (!Number.isInteger(i) || i < 0 || i > n.length) return false;
    if (value === undefined) n.splice(i, 1); else n[i] = value;
  } else if (value === undefined) delete n[last];
  else n[last] = value;
  return true;
}

// base -> work farkı: [{op:"set"|"remove", path, value?}]. Nesneler özyinelemeli, diziler/tekil değerler bütün olarak.
export function diffOps(base, work, path = []) {
  const ops = [];
  if (isObj(base) && isObj(work)) {
    for (const k of Object.keys(base)) if (!has(work, k)) ops.push({ op: "remove", path: ptr([...path, k]) });
    for (const k of Object.keys(work)) {
      if (work[k] === undefined) continue;
      if (!has(base, k)) ops.push({ op: "set", path: ptr([...path, k]), value: clone(work[k]) });
      else ops.push(...diffOps(base[k], work[k], [...path, k]));
    }
    return ops;
  }
  if (!same(base, work)) ops.push({ op: "set", path: ptr(path), value: clone(work) });
  return ops;
}

// kısa gösterim (tablo/rapor): metin tırnaklı, nesne JSON, uzunsa kırpılır
export function shortValue(v, max = 90) {
  if (v === undefined) return "—";
  const s = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// değişiklik tablosu satırları: { path, label, kind: "eklendi"|"silindi"|"değişti", old, new }
export function changeRows(base, work) {
  return diffOps(base, work).map((op) => {
    const old = getAt(base, op.path);
    const now = op.op === "remove" ? undefined : op.value;
    const kind = old === undefined ? "eklendi" : now === undefined ? "silindi" : "değişti";
    return { path: op.path, label: describePath(op.path, kind === "silindi" ? base : work) || op.path, kind, old, new: now };
  });
}
