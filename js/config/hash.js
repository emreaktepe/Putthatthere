// Kanonik serileştirme + FNV-1a 32 bit özeti. Güvenlik değil, "repo varsayılanı değişti mi" algısı (docs/mimari §5.2).

export function canonicalize(v) {
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
  return JSON.stringify(v);
}

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

export const configHash = (cfg) => fnv1a(canonicalize(cfg));
