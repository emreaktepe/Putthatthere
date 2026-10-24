// Taslak yaması: seyrek "ops" listesi (set/remove, RFC 6901 yolları). Saf; girdiyi değiştirmez.
// Güvenlik (docs/mimari §10 kural 3): yasak anahtar adları reddedilir, yalnızca kendi özelliklere erişilir.

import { FORBIDDEN_KEYS } from "./registry.js";

const copy = (v) => JSON.parse(JSON.stringify(v));
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const parsePointer = (p) => (p === "" ? [] : p.split("/").slice(1).map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~")));

// -> { config, conflicts: [{ op, reason }] }. Uygulanamayan op'lar atlanır ve çakışma listesine yazılır.
export function applyOps(base, ops) {
  const config = copy(base);
  const conflicts = [];
  for (const op of Array.isArray(ops) ? ops : []) {
    const reason = applyOne(config, op);
    if (reason) conflicts.push({ op, reason });
  }
  return { config, conflicts };
}

function applyOne(root, op) {
  if (!op || (op.op !== "set" && op.op !== "remove") || typeof op.path !== "string" || !op.path.startsWith("/")) return "geçersiz işlem";
  const segs = parsePointer(op.path);
  if (segs.some((s) => FORBIDDEN_KEYS.includes(s))) return "yasak anahtar adı";
  let node = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    const okStep = node !== null && typeof node === "object" && (Array.isArray(node) ? /^\d+$/.test(s) && +s < node.length : own(node, s));
    if (!okStep) return `yol bulunamadı: ${op.path}`;
    node = node[s];
  }
  const last = segs[segs.length - 1];
  if (node === null || typeof node !== "object") return `yol bulunamadı: ${op.path}`;
  if (Array.isArray(node)) {
    const idx = last === "-" ? node.length : /^\d+$/.test(last) ? +last : -1;
    if (idx < 0 || idx > node.length) return `geçersiz dizin: ${op.path}`;
    if (op.op === "set") node[idx] = copy(op.value);
    else if (idx < node.length) node.splice(idx, 1);
    else return `silinecek öğe yok: ${op.path}`;
    return null;
  }
  if (op.op === "set") { node[last] = copy(op.value); return null; }
  if (!own(node, last)) return `silinecek alan yok: ${op.path}`;
  delete node[last];
  return null;
}
