// Grafik kalitesi (oyuncu tercihi, localStorage "buyucu_kalite"): auto | high | low.
// Saf mantık: DOM/Three bilmez, Node'da test edilir. high -> "pro" (ayrıntılı Aldemir modeli), low -> "basic" (hafif prosedürel büyücü).
export const QUALITY_KEY = "buyucu_kalite";
export const QUALITY_VALUES = ["auto", "high", "low"];
export const QUALITY_LABELS = { auto: "Otomatik", high: "Yüksek", low: "Düşük" };

// geçersiz / bozuk değer -> "auto"
export const normalizeQuality = (v) => (QUALITY_VALUES.includes(v) ? v : "auto");

// tarayıcı ortamından kaba cihaz ipuçları (hepsi isteğe bağlı; bilinmeyen ipucu "zayıf" sayılmaz)
export function detectEnv(g = globalThis) {
  const nav = g.navigator || {};
  let coarse = false;
  try { coarse = !!(g.matchMedia && g.matchMedia("(pointer: coarse)").matches); } catch (e) { /* eski tarayıcı */ }
  return { coarse, cores: nav.hardwareConcurrency, memory: nav.deviceMemory };
}

const num = (x) => typeof x === "number" && Number.isFinite(x) && x > 0;
// tercih + ortam -> "pro" | "basic"
export function resolveQuality(pref, env = {}) {
  const p = normalizeQuality(pref);
  if (p === "high") return "pro";
  if (p === "low") return "basic";
  const weak = !!env.coarse || (num(env.cores) && env.cores <= 4) || (num(env.memory) && env.memory <= 4);
  return weak ? "basic" : "pro";
}

export function readQuality(storage) {
  try { return normalizeQuality(storage && storage.getItem(QUALITY_KEY)); } catch (e) { return "auto"; }
}
export function writeQuality(storage, v) {
  try { storage.setItem(QUALITY_KEY, normalizeQuality(v)); return true; } catch (e) { return false; } // özel mod
}
// menü düğmesi için sıradaki seçenek
export const nextQuality = (v) => QUALITY_VALUES[(QUALITY_VALUES.indexOf(normalizeQuality(v)) + 1) % QUALITY_VALUES.length];
