// localStorage katmanı (İSKELET): taslak yaması + "son iyi" önbelleği. DOM'a dokunmaz; `localStorage` dışarıdan verilir
// (Node testlerinde taklit edilir). Kota/özel mod hataları yakalanır, bellek içi yedek kullanılır.
//
// Anahtarlar (docs/mimari §5.1, §10.2): buyucu_cfg_draft, buyucu_cfg_lastgood. (buyucu_ses ve buyucu_save başka modüllerin.)
// Taslak biçimi: { v: 1, schemaVersion, baseHash, savedAt, active, rev?, ops: [{op:"set"|"remove", path, value?}], notes? }
//
// 1. aşamada yalnız OKUMA yolu oyun tarafından kullanılır (?cfg=draft). Yazma işlevleri yönetim sayfası (3. aşama) içindir.

import { applyOps } from "./patch.js";
import { configHash } from "./hash.js";
import { migrate } from "./migrate.js";
import { validate } from "./validate.js";

export const DRAFT_KEY = "buyucu_cfg_draft";
export const LASTGOOD_KEY = "buyucu_cfg_lastgood";
export const DRAFT_MAX_BYTES = 200 * 1024;
export const LASTGOOD_MAX_BYTES = 400 * 1024;

export function makeStore(ls) {
  const mem = new Map();
  let broken = false;
  if (ls === undefined) { try { ls = globalThis.localStorage; } catch (e) { ls = null; } }
  return {
    get persistent() { return !!ls && !broken; },
    get(key) {
      if (ls && !broken) { try { const v = ls.getItem(key); if (v !== null) return v; } catch (e) { broken = true; } }
      return mem.has(key) ? mem.get(key) : null;
    },
    // -> { ok, persisted, error? }: persisted=false ise yalnızca bellekte (kota / özel mod)
    set(key, value) {
      mem.set(key, value);
      if (!ls || broken) return { ok: true, persisted: false };
      try { ls.setItem(key, value); return { ok: true, persisted: true }; } catch (e) { return { ok: true, persisted: false, error: e && e.name }; }
    },
    remove(key) {
      mem.delete(key);
      if (ls && !broken) { try { ls.removeItem(key); } catch (e) { /* yoksay */ } }
    },
  };
}

export function readDraft(store) {
  const raw = store.get(DRAFT_KEY);
  if (raw === null) return { draft: null };
  if (raw.length > DRAFT_MAX_BYTES) return { draft: null, error: "Taslak boyut sınırını aşıyor" };
  let d;
  try { d = JSON.parse(raw); } catch (e) { return { draft: null, error: "Taslak okunamadı (bozuk JSON)" }; }
  if (!d || typeof d !== "object" || d.v !== 1 || !Array.isArray(d.ops) || typeof d.baseHash !== "string") return { draft: null, error: "Taslak biçimi tanınmadı" };
  return { draft: d };
}

export function writeDraft(store, draft) {
  const raw = JSON.stringify(draft);
  if (raw.length > DRAFT_MAX_BYTES) return { ok: false, error: "Taslak 200 KB sınırını aşıyor; dışa aktarın" };
  return store.set(DRAFT_KEY, raw);
}
export const clearDraft = (store) => store.remove(DRAFT_KEY);

// Repo tabanı (migrate edilmiş, doğrulanmış) + taslak -> kullanılacak konfigürasyon.
// status: none | inactive | stale (baseHash uyuşmaz) | invalid (taslak hatalı) | applied
export function resolveDraft(base, store) {
  const { draft, error } = readDraft(store);
  if (!draft) return { status: error ? "invalid" : "none", message: error, errors: [] };
  if (draft.active === false) return { status: "inactive", draft, errors: [] };
  if (draft.baseHash !== configHash(base)) return { status: "stale", draft, errors: [], message: "Repo varsayılanı taslak kaydedildikten sonra değişti; taslak uygulanmadı" };
  const { config, conflicts } = applyOps(base, draft.ops);
  const moved = migrate(config);
  const r = validate(moved.config, { mode: "strict" });
  if (!r.ok) return { status: "invalid", draft, errors: r.errors, conflicts, message: "Taslak hatalı, varsayılanla açıldı" };
  return { status: "applied", draft, config: r.sanitized, warnings: r.warnings, conflicts };
}
