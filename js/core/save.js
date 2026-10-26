// Kayıt modülü (docs/mimari §7.3). Saf: DOM ve Three.js'e dokunmaz, Node'da test edilir (depolama parametre olarak verilir).
// Anahtar: buyucu_save (ses tercihi buyucu_ses ayrıdır). Şema v2:
//   { v, configHash, updatedAt, completed[], currentLevel, run, best: { score, levels: { id: { score, time, stars? } } } }
// v1 -> v2: bölüm kimlikleri 27 bölümlük plana göç etti (forest -> w1-01 ...; js/core/legacyids.js) ve best.levels.<id>.stars (0-3, isteğe bağlı) eklendi.
// Göç sessizdir ve kayıpsızdır: eski ham metin BACKUP_KEY altına bir kez yedeklenir, göç eden kayıt hemen yeniden yazılır.
// Bölümler dizin yerine kimlikle adreslenir; S.level dizini yüklemede currentLevel kimliğinden hesaplanır.
// Kayıt güvenilmez girdi sayılır (kullanıcı localStorage'ı değiştirebilir): her alan tür/aralık/kimlik açısından süzülür, oyun çökmez.

import { mapIdKeys, mapIdList, newLevelId } from "./legacyids.js";

export const SAVE_KEY = "buyucu_save";
export const SAVE_SCHEMA_VERSION = 2;
export const BACKUP_KEY = "buyucu_save_backup_v1";

const ID_RE = /^[a-z][a-z0-9_-]{1,23}$/;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const num = (v, lo, hi, def) => (typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : def);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export const emptyBest = () => ({ score: 0, levels: {} });

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch (e) { return null; } // özel mod / erişim engeli
}

// Sürüm zinciri: MIGRATIONS[n] kaydı n -> n+1 yükseltir. Girdiyi değiştirmez; bozuk alanlara dokunmadan geçirir (süzme sanitizeSave'dedir).
const mergeBest = (a, b) => (isObj(a) && isObj(b) ? { ...a, ...b, score: Math.max(+a.score || 0, +b.score || 0), time: Math.max(+a.time || 0, +b.time || 0) } : a);
export const MIGRATIONS = {
  1: (raw) => {
    const out = { ...raw, v: 2 };
    if (Array.isArray(raw.completed)) out.completed = mapIdList(raw.completed);
    if (typeof raw.currentLevel === "string") out.currentLevel = newLevelId(raw.currentLevel);
    if (isObj(raw.best) && isObj(raw.best.levels)) out.best = { ...raw.best, levels: mapIdKeys(raw.best.levels, mergeBest) };
    return out;
  },
};
export function migrateSave(raw) {
  if (!isObj(raw)) return { ok: false, reason: "corrupt" };
  let v = raw.v;
  if (!Number.isInteger(v) || v < 1) return { ok: false, reason: "corrupt" };
  if (v > SAVE_SCHEMA_VERSION) return { ok: false, reason: "newer" };
  let cur = raw;
  while (v < SAVE_SCHEMA_VERSION) { cur = MIGRATIONS[v](cur); v++; }
  return { ok: true, save: cur };
}

// ctx: { levelIds[], weaponIds[], abilityIds[], defaults (defaultRun()) }
// -> { save, notices[] } | null (kullanılamaz kayıt)
export function sanitizeSave(raw, ctx) {
  if (!isObj(raw) || !isObj(raw.run) || !Array.isArray(ctx.levelIds) || !ctx.levelIds.length) return null;
  const notices = [];
  const ids = ctx.levelIds, last = ids[ids.length - 1];

  const completed = [];
  for (const id of Array.isArray(raw.completed) ? raw.completed : []) {
    if (typeof id === "string" && ids.includes(id) && !completed.includes(id)) completed.push(id);
    else notices.push(`bilinmeyen/yinelenen bölüm kaydı atıldı: ${String(id).slice(0, 24)}`);
  }
  let currentLevel = typeof raw.currentLevel === "string" && ids.includes(raw.currentLevel) ? raw.currentLevel : null;
  if (!currentLevel || (completed.includes(currentLevel) && completed.length < ids.length)) {
    if (raw.currentLevel !== undefined && !currentLevel) notices.push("geçersiz currentLevel; ilk tamamlanmamış bölüme alındı");
    currentLevel = ids.find((id) => !completed.includes(id)) || last;
  }

  const D = ctx.defaults, r = raw.run, run = {};
  for (const k of Object.keys(D)) {
    const def = D[k], v = r[k];
    if (typeof def === "number") run[k] = num(v, 0, 1e9, def);
    else if (typeof def === "boolean") run[k] = typeof v === "boolean" ? v : def;
    else if (typeof def === "string") run[k] = typeof v === "string" && (v === "" || ID_RE.test(v)) ? v : def;
    else if (Array.isArray(def)) run[k] = null; // aşağıda ayrı ele alınır
    else run[k] = null;
  }
  run.maxHp = num(r.maxHp, 1, 12, D.maxHp);
  run.hp = num(r.hp, 0, run.maxHp, run.maxHp);
  if (run.hp <= 0) run.hp = run.maxHp;
  for (const k of ["speedMul", "dmgMul", "cdMul"]) run[k] = num(r[k], 0.05, 20, D[k]);
  run.score = Math.floor(num(r.score, 0, 1e9, 0));
  run.kills = Math.floor(num(r.kills, 0, 1e9, 0));
  run.stoneLevels = Math.floor(num(r.stoneLevels, 0, 99, 0));
  const first = ctx.weaponIds[0];
  const un = (Array.isArray(r.unlocked) ? r.unlocked : []).filter((id, i, a) => typeof id === "string" && ctx.weaponIds.includes(id) && a.indexOf(id) === i);
  if (!un.includes(first)) un.unshift(first);
  run.unlocked = un;
  run.weapon = typeof r.weapon === "string" && un.includes(r.weapon) ? r.weapon : un[0];
  run.abilities = (Array.isArray(r.abilities) ? r.abilities : []).filter((id, i, a) => typeof id === "string" && ctx.abilityIds.includes(id) && a.indexOf(id) === i);
  const pc = {};
  if (isObj(r.perkCount)) for (const k of Object.keys(r.perkCount)) if (own(r.perkCount, k) && ID_RE.test(k) && !FORBIDDEN.has(k)) pc[k] = Math.floor(num(r.perkCount[k], 0, 99, 0));
  run.perkCount = pc;
  run.level = ids.indexOf(currentLevel);

  const best = emptyBest();
  if (isObj(raw.best)) {
    best.score = Math.floor(num(raw.best.score, 0, 1e9, 0));
    if (isObj(raw.best.levels)) {
      for (const id of Object.keys(raw.best.levels)) {
        const b = raw.best.levels[id];
        if (own(raw.best.levels, id) && ids.includes(id) && isObj(b)) {
          const e = { score: Math.floor(num(b.score, 0, 1e9, 0)), time: Math.floor(num(b.time, 0, 9999, 0)) };
          const st = Math.floor(num(b.stars, 0, 3, 0));
          if (st > 0) e.stars = st;
          best.levels[id] = e;
        }
      }
    }
  }
  return {
    save: { v: SAVE_SCHEMA_VERSION, configHash: typeof raw.configHash === "string" ? raw.configHash.slice(0, 32) : "", updatedAt: num(raw.updatedAt, 0, 1e15, 0), completed, currentLevel, run, best },
    notices,
  };
}

export function buildSave({ levelIds, completed, level, run, best, configHash, now = Date.now() }) {
  const done = levelIds.filter((id) => completed.has ? completed.has(id) : completed.includes(id));
  return {
    v: SAVE_SCHEMA_VERSION, configHash: configHash || "", updatedAt: now, completed: done,
    currentLevel: levelIds[Math.min(Math.max(level, 0), levelIds.length - 1)],
    run: JSON.parse(JSON.stringify(run)), best: best || emptyBest(),
  };
}

// -> { status: "none" | "ok" | "corrupt" | "newer", save?, notices }
export function loadSave(ctx, storage = defaultStorage()) {
  if (!storage) return { status: "none", notices: [] };
  let text = null;
  try { text = storage.getItem(SAVE_KEY); } catch (e) { return { status: "none", notices: [] }; }
  if (text === null || text === undefined) return { status: "none", notices: [] };
  if (text.length > 200000) return { status: "corrupt", notices: ["kayıt çok büyük"] };
  let raw;
  try { raw = JSON.parse(text); } catch (e) { backupOnce(text, storage); return { status: "corrupt", notices: ["kayıt JSON değil"] }; }
  const m = migrateSave(raw);
  if (!m.ok) return { status: m.reason, notices: [] };
  const s = sanitizeSave(m.save, ctx);
  if (!s) { backupOnce(text, storage); return { status: "corrupt", notices: ["kayıt alanları geçersiz"] }; }
  if (raw.v < SAVE_SCHEMA_VERSION) { // eski sürüm: ham metni yedekle, göç etmiş kaydı hemen yaz (kayıpsız ve sessiz)
    backupOnce(text, storage);
    writeSave(s.save, storage);
    s.notices.push(`kayıt v${raw.v} -> v${SAVE_SCHEMA_VERSION} göç etti`);
  }
  return { status: "ok", save: s.save, notices: s.notices };
}

// yedek anahtarı yalnızca yoksa yazılır (ilk eski kayıt korunur); depolama hatasında sessiz
function backupOnce(text, storage) {
  try { if (storage.getItem(BACKUP_KEY) === null) storage.setItem(BACKUP_KEY, text); } catch (e) { /* kota / özel mod */ }
}

export function writeSave(save, storage = defaultStorage()) {
  if (!storage) return false;
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch (e) { return false; } // kota / özel mod
}

export function clearSave(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(SAVE_KEY); } catch (e) { /* yoksay */ }
}
