// Yerel telemetri (localStorage "buyucu_telemetri", v1). GİZLİLİK: kişisel veri, kimlik, IP, tarih/saat damgası YOK; ağ isteği YOK;
// yalnızca bu tarayıcıda bölüm başına toplamlar tutulur, oyuncuya gösterilmez (admin "Sağlık" sekmesinde okunur/dışa aktarılır/sıfırlanır).
// Saf: DOM'a dokunmaz, depolama parametre olarak verilir (Node'da test edilir). Depolama hatasında sessizce vazgeçer.
// Boyut: bölüm başına son MAX_ATTEMPTS deneme + toplam sayaçlar; toplam MAX_BYTES altında (aşarsa en eski denemeler atılır).

export const TELEMETRY_KEY = "buyucu_telemetri";
export const TELEMETRY_VERSION = 1;
export const MAX_ATTEMPTS = 20;
export const MAX_BYTES = 50 * 1024;
export const MAX_LEVELS = 40;

const ID_RE = /^[a-z][a-z0-9_-]{1,23}$/;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const num = (v, lo, hi, def = 0) => (typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : def);
const RESULTS = ["w", "d", "q"]; // w: kazandı, d: öldü / süre bitti, q: haritaya döndü

export const emptyTelemetry = () => ({ v: TELEMETRY_VERSION, levels: {} });
const emptyLevel = () => ({ att: 0, win: 0, die: 0, quit: 0, timeout: 0, ft: 0, ftWin: 0, sumWinSec: 0, sumDieSec: 0, hits: 0, recent: [] });

// güvenilmez girdiyi süzer (kullanıcı localStorage'ı değiştirebilir / başka tarayıcıdan içe aktarılabilir)
export function sanitizeTelemetry(raw) {
  const out = emptyTelemetry();
  if (!isObj(raw) || raw.v !== TELEMETRY_VERSION || !isObj(raw.levels)) return out;
  for (const id of Object.keys(raw.levels).slice(0, MAX_LEVELS)) {
    const b = raw.levels[id];
    if (!ID_RE.test(id) || FORBIDDEN.has(id) || !isObj(b)) continue;
    const L = emptyLevel();
    for (const k of ["att", "win", "die", "quit", "timeout", "ft", "ftWin"]) L[k] = Math.floor(num(b[k], 0, 1e6));
    L.sumWinSec = num(b.sumWinSec, 0, 1e8); L.sumDieSec = num(b.sumDieSec, 0, 1e8); L.hits = Math.floor(num(b.hits, 0, 1e7));
    for (const a of (Array.isArray(b.recent) ? b.recent : []).slice(-MAX_ATTEMPTS)) {
      if (isObj(a) && RESULTS.includes(a.r)) L.recent.push({ r: a.r, s: Math.round(num(a.s, 0, 3600)), h: Math.floor(num(a.h, 0, 99)), d: Math.floor(num(a.d, 0, 4)), t: a.t ? 1 : 0 });
    }
    out.levels[id] = L;
  }
  return out;
}

// bir deneme kaydı: a = { r: "w"|"d"|"q", sec, hits, dda (0..4), timeout?, first? } -> yeni telemetri (girdiyi değiştirmez)
export function recordAttempt(tel, id, a) {
  const t = sanitizeTelemetry(tel);
  if (!ID_RE.test(id) || FORBIDDEN.has(id) || !RESULTS.includes(a.r)) return t;
  if (!t.levels[id] && Object.keys(t.levels).length >= MAX_LEVELS) return t;
  const L = t.levels[id] || (t.levels[id] = emptyLevel());
  const sec = num(a.sec, 0, 3600), hits = Math.floor(num(a.hits, 0, 99));
  L.att++;
  L.hits += hits;
  if (a.r === "w") { L.win++; L.sumWinSec += sec; } else if (a.r === "d") { L.die++; L.sumDieSec += sec; if (a.timeout) L.timeout++; } else L.quit++;
  if (a.first && a.r !== "q") { L.ft++; if (a.r === "w") L.ftWin++; }
  L.recent.push({ r: a.r, s: Math.round(sec), h: hits, d: Math.floor(num(a.dda, 0, 4)), t: a.timeout ? 1 : 0 });
  if (L.recent.length > MAX_ATTEMPTS) L.recent.splice(0, L.recent.length - MAX_ATTEMPTS);
  return trimToBytes(t);
}

// toplam boyut sınırı: en eski denemeleri (en çok denemesi olan bölümden başlayarak) at
export function trimToBytes(tel, max = MAX_BYTES) {
  let size = JSON.stringify(tel).length;
  while (size > max) {
    const ids = Object.keys(tel.levels).filter((id) => tel.levels[id].recent.length > 0).sort((a, b) => tel.levels[b].recent.length - tel.levels[a].recent.length);
    if (!ids.length) break;
    tel.levels[ids[0]].recent.shift();
    size = JSON.stringify(tel).length;
  }
  return tel;
}

const div = (a, b) => (b > 0 ? a / b : null);
// bölüm başına özet satırları (admin tablosu): levelIds sırası, kaydı olmayan bölüm de görünür
export function summarize(tel, levelIds = null) {
  const t = sanitizeTelemetry(tel);
  const ids = levelIds || Object.keys(t.levels);
  return ids.map((id) => {
    const L = t.levels[id] || emptyLevel(), played = L.win + L.die;
    return {
      id, attempts: L.att, wins: L.win, deaths: L.die, quits: L.quit, timeouts: L.timeout,
      passRate: div(L.win, played), firstTryRate: div(L.ftWin, L.ft), avgWinSec: div(L.sumWinSec, L.win), avgDieSec: div(L.sumDieSec, L.die),
      avgHits: div(L.hits, L.att), helped: L.recent.filter((a) => a.d > 0).length,
    };
  });
}

export const exportTelemetry = (tel) => JSON.stringify(sanitizeTelemetry(tel), null, 1);

// ---- depolama (hepsi sessiz) ----
function defaultStorage() { try { return globalThis.localStorage || null; } catch (e) { return null; } }
export function loadTelemetry(storage = defaultStorage()) {
  try {
    const t = storage && storage.getItem(TELEMETRY_KEY);
    if (!t || t.length > MAX_BYTES * 2) return emptyTelemetry();
    return sanitizeTelemetry(JSON.parse(t));
  } catch (e) { return emptyTelemetry(); }
}
export function saveTelemetry(tel, storage = defaultStorage()) {
  try { if (!storage) return false; storage.setItem(TELEMETRY_KEY, JSON.stringify(tel)); return true; } catch (e) { return false; }
}
export function clearTelemetry(storage = defaultStorage()) {
  try { if (storage) storage.removeItem(TELEMETRY_KEY); return true; } catch (e) { return false; }
}
