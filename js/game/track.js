// Oturum yapıştırıcısı: DDA sayacı (bölüm başına art arda ölüm), yardım ayarı ve yerel telemetri kaydı.
// Saf mantık dda.js / telemetry.js / settings.js'te; burada yalnızca oturum belleği ve depolama bağlanır. DOM'a dokunmaz.
// Alıştırma ve geliştirici başlatması (?dev=1&level=) ne DDA'yı ne telemetriyi etkiler.
import { readSettings, writeSettings } from "../core/settings.js";
import { loadTelemetry, recordAttempt, saveTelemetry } from "../core/telemetry.js";
import { ddaFor, recordDeath, resetLevel } from "./dda.js";

let counts = {};          // { bölümKimliği: art arda ölüm }
let settings = null;
let tel = null;
const tried = new Set();  // bu oturumda denenmiş bölümler (ilk-deneme ölçümü)

function store() { try { return globalThis.localStorage || null; } catch (e) { return null; } }
export function getSettings() { if (!settings) settings = readSettings(store()); return settings; }
export function ddaEnabled() { return getSettings().dda; }
export function setDdaEnabled(on) { settings = { ...getSettings(), dda: !!on }; writeSettings(store(), settings); return settings.dda; }

// bu bölümün şu anki yardım kademesi (alıştırmada her zaman yok)
export function currentDda(id, practice) { return ddaFor(counts[id] || 0, ddaEnabled() && !practice); }
// bir sonraki deneme için kademe (ölümden hemen sonra yenilgi ekranı için)
export const nextDda = (id) => ddaFor(counts[id] || 0, ddaEnabled());
export const deathsOf = (id) => counts[id] || 0;
export function noteDeath(id) { counts = recordDeath(counts, id); }
export function noteClear(id) { counts = resetLevel(counts, id); }
export function resetSession() { counts = {}; tried.clear(); }

// deneme sonu: r "w" | "d" | "q"; ctx { sec, hits, dda (kademe), timeout, practice, off (kayıt dışı) }
export function trackAttempt(id, r, ctx) {
  if (ctx.practice || ctx.off) return;
  if (!tel) tel = loadTelemetry();
  const first = !tried.has(id) && (counts[id] || 0) === 0 && !ctx.helped;
  tried.add(id);
  tel = recordAttempt(tel, id, { r, sec: ctx.sec, hits: ctx.hits, dda: ctx.dda || 0, timeout: !!ctx.timeout, first });
  saveTelemetry(tel);
}
