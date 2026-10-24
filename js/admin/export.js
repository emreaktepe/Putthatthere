// Yönetim sayfası: dışa aktarma (kanonik JSON, yama, Claude paketi) ve doğrulamalı içe aktarma. Saf; DOM'a dokunmaz.
// Repoya yazma YOK: ürünler dosya olarak indirilir (docs/mimari §5.3).

import { configHash } from "../config/hash.js";
import { migrate } from "../config/migrate.js";
import { applyOps } from "../config/patch.js";
import { MAX_CONFIG_BYTES } from "../config/registry.js";
import { CONFIG_SCHEMA_VERSION, SCHEMA } from "../config/schema.js";
import { formatIssue, validate } from "../config/validate.js";
import { changeRows, diffOps, shortValue } from "./diff.js";

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// ---- kanonik biçim: şema sırası, 2 boşluk girinti, kısa dizi/nesneler tek satır (tools/extract-defaults.mjs ile aynı kalıp) ----
function orderLike(v, spec) {
  if (Array.isArray(v)) return v.map((x) => orderLike(x, spec && spec.t === "arr" ? spec.item : null));
  if (!isObj(v)) return v;
  const out = {};
  const fields = spec && spec.t === "obj" ? spec.fields : null;
  const itemSpec = spec && (spec.t === "map" || spec.t === "rec") ? spec.item : null;
  const keys = Object.keys(v);
  const first = fields ? Object.keys(fields).filter((k) => keys.includes(k)) : [];
  const rest = keys.filter((k) => !first.includes(k));
  if (fields) rest.sort(); // bilinmeyen alanlar sona, adla sıralı
  for (const k of [...first, ...rest]) out[k] = orderLike(v[k], fields ? fields[k] : itemSpec);
  return out;
}

const inline = (v) => (Array.isArray(v) ? "[" + v.map(inline).join(", ") + "]" : isObj(v) ? (Object.keys(v).length ? "{ " + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + inline(x)).join(", ") + " }" : "{}") : JSON.stringify(v));
function fmt(v, ind = 0) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  const pad = "  ".repeat(ind);
  const one = inline(v);
  if (one.length <= 100 - ind * 2 && !(Array.isArray(v) && v.some((x) => x && typeof x === "object" && inline(x).length > 60))) return one;
  if (Array.isArray(v)) return "[\n" + v.map((x) => pad + "  " + fmt(x, ind + 1)).join(",\n") + "\n" + pad + "]";
  return "{\n" + Object.entries(v).map(([k, x]) => pad + "  " + JSON.stringify(k) + ": " + fmt(x, ind + 1)).join(",\n") + "\n" + pad + "}";
}

export const formatConfig = (config) => fmt(orderLike(config, SCHEMA)) + "\n";

// ---- taslak / yama ----
// notlar: { "": genel not, "/yol": alan notu }. "[kod] " ile başlayan not = kod gerektiren istek.
export const CODE_TAG = "[kod] ";
export const isCodeNote = (t) => typeof t === "string" && t.startsWith(CODE_TAG);
export const noteText = (t) => (isCodeNote(t) ? t.slice(CODE_TAG.length) : String(t || ""));
export const withCode = (text, code) => (code ? CODE_TAG + text : text);

export function cleanNotes(notes) {
  const out = {};
  for (const [k, v] of Object.entries(notes || {})) {
    if (typeof v !== "string" || !v.trim() || (k !== "" && !k.startsWith("/"))) continue;
    out[k] = v.slice(0, 1000);
  }
  return out;
}

export function buildDraft({ base, working, notes, baseHash, active = true, rev = 0, now = new Date() }) {
  return { v: 1, schemaVersion: CONFIG_SCHEMA_VERSION, baseHash: baseHash || configHash(base), savedAt: now.toISOString(), active, rev, ops: diffOps(base, working), notes: cleanNotes(notes) };
}

export const exportPatch = (draft) => JSON.stringify({ v: 1, schemaVersion: draft.schemaVersion, baseHash: draft.baseHash, savedAt: draft.savedAt, ops: draft.ops, notes: draft.notes || {} }, null, 2) + "\n";

// ---- Claude yönlendirme paketi (Türkçe .md) ----
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").replace(/`/g, "'");
function fence(text, lang = "") {
  let n = 3;
  for (const m of String(text).matchAll(/`+/g)) n = Math.max(n, m[0].length + 1);
  const f = "`".repeat(n);
  return `${f}${lang}\n${text}\n${f}`;
}
const quote = (t) => String(t).split(/\r?\n/).map((l) => "> " + l).join("\n");

export function buildClaudePackage({ base, working, notes = {}, baseHash, now = new Date(), embedConfig = false, report }) {
  const ns = cleanNotes(notes);
  const rows = changeRows(base, working);
  const rep = report || validate(working, { mode: "strict" });
  const errors = rep.errors || [], warnings = rep.warnings || [];
  const by = (k) => rows.filter((r) => r.kind === k).length;
  const date = now.toISOString().slice(0, 10);
  const out = [];
  out.push(`# Büyücünün Gecesi — Claude yönlendirme paketi (${date})`, "");
  out.push("Bu dosyayı Emre yönetim sayfasından (admin.html) üretti. Aşağıdaki değişiklikler repodaki `data/game.config.json` üzerine uygulanacak taslaktır.", "");

  out.push("## 1. Özet", "");
  out.push(`- Değişiklik: **${rows.length}** (${by("değişti")} değişti, ${by("eklendi")} eklendi, ${by("silindi")} silindi)`);
  out.push(`- Doğrulama: **${errors.length}** hata, **${warnings.length}** uyarı${errors.length ? " — hatalar düzeltilmeden repoya konmamalı" : ""}`);
  out.push(`- Emre'nin notları: ${Object.keys(ns).length}; kod gerektiren istek: ${Object.values(ns).filter(isCodeNote).length}`, "");

  out.push("## 2. Değişiklik tablosu", "");
  if (!rows.length) out.push("Değişiklik yok.", "");
  else {
    out.push("| # | Alan | Yol | Durum | Eski | Yeni | Not |", "|---|---|---|---|---|---|---|");
    rows.forEach((r, i) => out.push(`| ${i + 1} | ${cell(r.label)} | \`${cell(r.path)}\` | ${r.kind} | ${cell(shortValue(r.old, 70))} | ${cell(shortValue(r.new, 70))} | ${cell(noteText(ns[r.path] || ""))} |`));
    out.push("");
  }

  out.push("## 3. Doğrulama raporu", "");
  if (!errors.length && !warnings.length) out.push("Hata ve uyarı yok.", "");
  else out.push(fence([...errors, ...warnings].map((e) => formatIssue(e, working)).join("\n")), "");

  out.push("## 4. Emre'nin notları", "");
  const general = ns[""];
  if (general) out.push("**Genel not:**", "", quote(noteText(general)), "");
  const fieldNotes = Object.entries(ns).filter(([k]) => k !== "");
  if (fieldNotes.length) for (const [k, v] of fieldNotes) out.push(`- \`${cell(k)}\`${isCodeNote(v) ? " (kod gerektirir)" : ""}:`, quote(noteText(v)));
  if (!general && !fieldNotes.length) out.push("Not yok.");
  out.push("");

  out.push("## 5. Kod gerektiren istekler", "");
  const code = Object.entries(ns).filter(([, v]) => isCodeNote(v));
  if (!code.length) out.push("Yok. (Tüm istekler yapılandırmayla karşılanıyor.)", "");
  else {
    out.push("Bunlar yalnızca JSON değiştirerek yapılamaz; geliştirme işi olarak ele alınmalı:", "");
    for (const [k, v] of code) out.push(`- ${k === "" ? "Genel" : "`" + cell(k) + "`"}: ${cell(noteText(v))}`);
    out.push("");
  }

  out.push("## 6. Sürüm bilgisi", "");
  out.push(`- Şema sürümü: \`${CONFIG_SCHEMA_VERSION}\``);
  out.push(`- Taban (repo) özeti: \`${baseHash || configHash(base)}\``);
  out.push(`- Taslak sonrası özet: \`${configHash(working)}\``, "");

  out.push("## 7. Claude için adımlar", "");
  out.push("1. Ekteki tam `game.config.json` ile (ya da `degisiklikler.json` yamasıyla) `data/game.config.json` dosyasını güncelle.");
  out.push("2. `npm run validate` ve `npm test` çalıştır; hata varsa Emre'ye bildir.");
  out.push("3. Bölüm 5'teki kod gerektiren istekleri ayrı iş olarak planla.");
  out.push("4. Değişikliği commit et; Emre taslağını yönetim sayfasında temizleyebilir (repo özeti değişince taslak 'eski' görünür).", "");

  if (embedConfig) out.push("## Ek: tam game.config.json", "", fence(formatConfig(working), "json"), "");
  return out.join("\n");
}

// ---- içe aktarma: dosya metni -> doğrulanmış çalışma kopyası ----
// -> { ok, kind: "config"|"patch", working?, ops?, notes?, conflicts?, errors[], warnings[], message? }
export function readImport(text, base) {
  const fail = (message, errors = []) => ({ ok: false, message, errors, warnings: [] });
  if (typeof text !== "string" || text.length > MAX_CONFIG_BYTES) return fail("Dosya çok büyük (en çok 1 MB)");
  let raw;
  try { raw = JSON.parse(text); } catch (e) { return fail("JSON olarak okunamadı: " + e.message); }
  if (!isObj(raw)) return fail("Beklenen biçim bir JSON nesnesi");
  let kind = "config", cfg = raw, notes = null, conflicts = [], ops = null;
  if (Array.isArray(raw.ops)) {
    kind = "patch";
    if (typeof raw.baseHash !== "string") return fail("Yama dosyasında baseHash yok");
    const a = applyOps(base, raw.ops);
    cfg = a.config; conflicts = a.conflicts; ops = raw.ops; notes = cleanNotes(raw.notes);
  }
  const m = migrate(cfg);
  if (m.error) return fail(m.error);
  const r = validate(m.config, { mode: "strict" });
  if (!r.ok) return { ok: false, kind, message: "Doğrulamadan geçmedi; taslağa uygulanmadı", errors: r.errors, warnings: r.warnings, conflicts };
  return { ok: true, kind, working: m.config, ops, notes, conflicts, errors: [], warnings: r.warnings, staleBase: kind === "patch" && raw.baseHash !== configHash(base) };
}
