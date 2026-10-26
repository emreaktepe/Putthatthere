// Bağımsız konfigürasyon doğrulayıcı. DOM ve Three.js'e dokunmaz; tarayıcıda ve Node'da aynı çalışır.
//
//   validate(config, { mode }) -> { ok, errors[], warnings[], sanitized }
//
// 3 aşama: (1) yapı/tür (schema.js tablosu), (2) referans bütünlüğü, (3) anlamsal/sağlık.
// Hata biçimi (docs/mimari §4.2): { severity, code, path (JSON Pointer), message, value, expect, hint? }
// `sanitized`: yapısı onarılabilen (aralık dışı sayı sınıra çekilir, geçersiz alan varsayılana döner)
// kopya; bilinmeyen alanlar korunur, yasak anahtarlar atılır. `ok` yalnızca ham girdideki hata sayısına bakar.
// "strict" (CI/yönetim): her hata başarısızlık. "lenient" (oyun): `validateLenient` ile sanitize edilmiş sonuç kullanılır.

import { SCHEMA, CONFIG_SCHEMA_VERSION, enumList } from "./schema.js";
import { balanceIssues } from "./balance.js";
import { ID_RE, HEX_RE, FORBIDDEN_KEYS, ABILITY_KINDS, PERK_STATS, WEAPON_BLOCKS, ELEMENTS } from "./registry.js";

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const ptr = (path) => path.map((s) => "/" + String(s).replace(/~/g, "~0").replace(/\//g, "~1")).join("");
const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(4)));

export function validate(config, opts = {}) {
  const mode = opts.mode || "strict";
  const errors = [];
  const warnings = [];
  const add = (severity, code, path, message, extra = {}) => {
    const it = { severity, code, path: ptr(path), message, ...extra };
    (severity === "error" ? errors : warnings).push(it);
  };
  const err = (code, path, message, extra) => add("error", code, path, message, extra);
  const warn = (code, path, message, extra) => add("warning", code, path, message, extra);

  if (!isObj(config)) {
    err("E_TYPE", [], "Konfigürasyon bir nesne (JSON object) olmalı", { value: typeof config, expect: "object" });
    return { ok: false, errors, warnings, sanitized: null, mode };
  }

  scanForbidden(config, [], err);

  // sürüm
  const ver = isObj(config.meta) ? config.meta.schemaVersion : undefined;
  if (Number.isInteger(ver) && ver >= 1 && ver !== CONFIG_SCHEMA_VERSION) {
    err("E_VERSION", ["meta", "schemaVersion"], ver > CONFIG_SCHEMA_VERSION
      ? `Bu konfigürasyon daha yeni bir oyun sürümü için (şema ${ver}, kod ${CONFIG_SCHEMA_VERSION}); sayfayı yenile / oyunu güncelle`
      : `Konfigürasyon eski şema sürümünde (${ver}); önce migrate edilmeli (güncel: ${CONFIG_SCHEMA_VERSION})`,
    { value: ver, expect: `int ${CONFIG_SCHEMA_VERSION}` });
    return { ok: false, errors, warnings, sanitized: null, mode };
  }

  const ctx = { root: config, err, warn };
  const sanitized = walk(config, SCHEMA, [], ctx, "");
  if (isObj(sanitized)) semantic(sanitized, config, err, warn);

  return { ok: errors.length === 0, errors, warnings, sanitized, mode };
}

// Oyun çalışma zamanı: hatalar onarılabiliyorsa onarılmış kopya ile devam edilir.
export function validateLenient(config) {
  const first = validate(config, { mode: "lenient" });
  if (first.ok) return { ok: true, config: first.sanitized, errors: [], warnings: first.warnings, repaired: false };
  if (first.sanitized) {
    const second = validate(first.sanitized, { mode: "strict" });
    if (second.ok) {
      const warnings = [...first.errors.map((e) => ({ ...e, severity: "warning", repaired: true })), ...second.warnings];
      return { ok: true, config: first.sanitized, errors: [], warnings, repaired: true };
    }
  }
  return { ok: false, config: null, errors: first.errors, warnings: first.warnings, repaired: false };
}

// ---------------------------------------------------------------- aşama 1: yapı

function scanForbidden(v, path, err, depth = 0) {
  if (depth > 24) { err("E_LENGTH", path, "İç içe geçme derinliği çok fazla", { expect: "<= 24" }); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => scanForbidden(x, [...path, i], err, depth + 1)); return; }
  if (!isObj(v)) return;
  for (const k of Object.keys(v)) {
    if (FORBIDDEN_KEYS.includes(k)) err("E_FORBIDDEN_KEY", [...path, k], `Yasak anahtar adı: ${k}`, { expect: "başka bir ad" });
    else scanForbidden(v[k], [...path, k], err, depth + 1);
  }
}

function clone(v) {
  if (Array.isArray(v)) return v.map(clone);
  if (isObj(v)) { const o = {}; for (const k of Object.keys(v)) if (!FORBIDDEN_KEYS.includes(k)) o[k] = clone(v[k]); return o; }
  return v;
}

function label(spec, key) { return (spec && spec.label) || key; }

function walk(value, spec, path, ctx, key) {
  const { err, warn } = ctx;
  const name = label(spec, String(path[path.length - 1] ?? key));
  switch (spec.t) {
    case "int":
    case "num": {
      const isInt = spec.t === "int";
      if (typeof value !== "number" || !Number.isFinite(value) || (isInt && !Number.isInteger(value))) {
        err("E_TYPE", path, `${name} ${JSON.stringify(value)} geçersiz: ${isInt ? "tam sayı" : "sayı"} olmalı`, { value, expect: `${spec.t} ${spec.min}..${spec.max}` });
        return spec.def !== undefined ? spec.def : spec.req ? value : undefined;
      }
      if (value < spec.min || value > spec.max) {
        err("E_RANGE", path, `${name} ${fmtNum(value)} geçersiz: ${spec.min}–${spec.max} arası ${isInt ? "tam sayı" : "sayı"} olmalı`, { value, expect: `${spec.t} ${spec.min}..${spec.max}` });
        return Math.min(Math.max(value, spec.min), spec.max);
      }
      return value;
    }
    case "str": {
      if (typeof value !== "string") {
        err("E_TYPE", path, `${name} metin olmalı`, { value, expect: "string" });
        return spec.def !== undefined ? spec.def : spec.req ? value : undefined;
      }
      let out = value;
      if (out.length < spec.min || out.length > spec.max) {
        err("E_LENGTH", path, `${name} uzunluğu ${out.length}: ${spec.min}–${spec.max} karakter olmalı`, { value: out.length > 60 ? out.slice(0, 60) + "…" : out, expect: `str ${spec.min}..${spec.max}` });
        if (out.length > spec.max) out = out.slice(0, spec.max);
      }
      if (spec.pattern && !spec.pattern.test(out)) {
        err("E_FORMAT", path, `${name} geçersiz: ${spec.patHint || "izin verilen biçim"} biçiminde olmalı`, { value: out.length > 60 ? out.slice(0, 60) + "…" : out, expect: spec.patHint || String(spec.pattern) });
        return spec.req ? out : undefined;
      }
      for (const m of out.matchAll(/\{([^{}]*)\}/g)) {
        if (!spec.ph.includes(m[1])) {
          err("E_FORMAT", path, `${name} içinde izinsiz yer tutucu {${m[1]}}` + (spec.ph.length ? ` (izinli: ${spec.ph.map((p) => "{" + p + "}").join(", ")})` : " (bu alanda yer tutucu yok)"), { value: m[0], expect: spec.ph.length ? spec.ph.join("|") : "yer tutucu yok" });
        }
      }
      return out;
    }
    case "hex": {
      if (typeof value !== "string" || !HEX_RE.test(value)) {
        err("E_FORMAT", path, `${name} ${JSON.stringify(value)} geçersiz: #rrggbb biçiminde renk olmalı`, { value, expect: "#rrggbb" });
        return spec.def !== undefined ? spec.def : spec.req ? value : undefined;
      }
      return value.toLowerCase();
    }
    case "bool": {
      if (typeof value !== "boolean") {
        err("E_TYPE", path, `${name} true/false olmalı`, { value, expect: "boolean" });
        return spec.def !== undefined ? spec.def : spec.req ? value : undefined;
      }
      return value;
    }
    case "enum": {
      const list = enumList(spec);
      if (!list.includes(value)) {
        err("E_ENUM", path, `${name} ${JSON.stringify(value)} geçersiz: ${list.join(" | ")} olmalı`, { value, expect: list.join("|") });
        return spec.def !== undefined ? spec.def : spec.req ? value : undefined;
      }
      return value;
    }
    case "ref": {
      const coll = isObj(ctx.root[spec.coll]) ? ctx.root[spec.coll] : null;
      if (typeof value !== "string" || !coll || !has(coll, value)) {
        err("E_REF", path, `${name} ${JSON.stringify(value)} geçersiz: ${spec.coll} içinde böyle bir kimlik yok`, { value, expect: `ref:${spec.coll}` });
        return spec.req ? value : undefined;
      }
      return value;
    }
    case "arr": {
      if (!Array.isArray(value)) {
        err("E_TYPE", path, `${name} liste olmalı`, { value, expect: "array" });
        return spec.req ? value : undefined;
      }
      let list = value;
      if (list.length < spec.min || list.length > spec.max) {
        err("E_LENGTH", path, `${name} öğe sayısı ${list.length}: ${spec.min}–${spec.max} olmalı`, { value: list.length, expect: `array ${spec.min}..${spec.max}` });
        if (list.length > spec.max) list = list.slice(0, spec.max);
      }
      const out = list.map((v, i) => walk(v, spec.item, [...path, i], ctx, String(i)));
      if (spec.increasing) {
        for (let i = 1; i < out.length; i++) {
          if (typeof out[i] === "number" && typeof out[i - 1] === "number" && out[i] <= out[i - 1]) {
            err("E_ORDER", path, `${name} artan sırada olmalı (${out[i - 1]} sonrası ${out[i]})`, { value: out, expect: "kesin artan" });
            break;
          }
        }
      }
      return out;
    }
    case "obj": {
      if (value === undefined && spec.fill) value = {};
      if (!isObj(value)) {
        err("E_TYPE", path, `${name} nesne olmalı`, { value, expect: "object" });
        return spec.req ? value : undefined;
      }
      const out = {};
      for (const k of Object.keys(spec.fields)) {
        const fs = spec.fields[k];
        const has_ = has(value, k) && value[k] !== undefined;
        if (!has_) {
          if (fs.req) err("E_REQUIRED", [...path, k], `Zorunlu alan eksik: ${label(fs, k)}`, { expect: fs.t });
          else if (fs.def !== undefined) out[k] = fs.def;
          else if (fs.t === "obj" && fs.fill) out[k] = walk(undefined, fs, [...path, k], ctx, k);
          continue;
        }
        const r = walk(value[k], fs, [...path, k], ctx, k);
        if (r !== undefined) out[k] = r;
      }
      for (const k of Object.keys(value)) {
        if (FORBIDDEN_KEYS.includes(k) || has(spec.fields, k)) continue;
        warn("W_UNKNOWN_FIELD", [...path, k], `Bilinmeyen alan: ${k} (korunur)`);
        out[k] = clone(value[k]);
      }
      return out;
    }
    case "map": {
      if (!isObj(value)) {
        err("E_TYPE", path, `${name} nesne (kimlik -> öğe) olmalı`, { value, expect: "object" });
        return spec.req ? value : undefined;
      }
      const keys = Object.keys(value).filter((k) => !FORBIDDEN_KEYS.includes(k));
      if (keys.length < spec.min || keys.length > spec.max) err("E_LENGTH", path, `${name} öğe sayısı ${keys.length}: ${spec.min}–${spec.max} olmalı`, { value: keys.length, expect: `${spec.min}..${spec.max}` });
      const out = {};
      for (const k of keys) {
        if (!ID_RE.test(k)) err("E_FORMAT", [...path, k], `Kimlik ${JSON.stringify(k)} geçersiz: küçük harfle başlayan, a-z 0-9 _ - içeren 2–24 karakter olmalı`, { value: k, expect: String(ID_RE) });
        const r = walk(value[k], spec.item, [...path, k], ctx, k);
        if (r !== undefined) out[k] = r;
      }
      return out;
    }
    case "rec": {
      if (!isObj(value)) {
        err("E_TYPE", path, `${name} nesne (kimlik -> sayı) olmalı`, { value, expect: "object" });
        return spec.req ? value : undefined;
      }
      const coll = isObj(ctx.root[spec.coll]) ? ctx.root[spec.coll] : {};
      const out = {};
      for (const k of Object.keys(value)) {
        if (FORBIDDEN_KEYS.includes(k)) continue;
        if (!has(coll, k)) err("E_REF", [...path, k], `${name}: ${JSON.stringify(k)} ${spec.coll} içinde yok`, { value: k, expect: `ref:${spec.coll}` });
        const r = walk(value[k], spec.item, [...path, k], ctx, k);
        if (r !== undefined) out[k] = r;
      }
      return out;
    }
    default:
      return value;
  }
}

// ---------------------------------------------------------------- aşama 2-3: referans + anlam

function semantic(c, raw, err, warn) {
  const col = (k) => (isObj(c[k]) ? c[k] : {});
  const ids = (k) => Object.keys(col(k));
  const lv = col("levels"), en = col("enemies"), wp = col("weapons"), ab = col("abilities"), th = col("themes"), pk = col("perks");

  // tam kapsayan sıra dizileri
  const orderCheck = (orderKey, collKey) => {
    const order = Array.isArray(c[orderKey]) ? c[orderKey] : (orderKey === "campaignOrder" && isObj(c.campaign) ? c.campaign.order : null);
    const path = orderKey === "campaignOrder" ? ["campaign", "order"] : [orderKey];
    if (!Array.isArray(order)) return;
    const seen = new Set();
    order.forEach((id, i) => {
      if (seen.has(id)) err("E_DUP", [...path, i], `${JSON.stringify(id)} sırada birden fazla kez geçiyor`, { value: id });
      seen.add(id);
    });
    for (const id of ids(collKey)) if (!seen.has(id)) err("E_ORDER", path, `${JSON.stringify(id)} ${collKey} içinde var ama sırada yok (her öğe tam bir kez geçmeli)`, { value: id, expect: `tüm ${collKey} kimlikleri` });
  };
  orderCheck("weaponOrder", "weapons");
  orderCheck("abilityOrder", "abilities");
  orderCheck("perkOrder", "perks");
  orderCheck("campaignOrder", "levels");

  // oyun
  if (isObj(c.game) && c.game.startHp > c.game.maxHpCap) err("E_RANGE", ["game", "maxHpCap"], `maxHpCap (${c.game.maxHpCap}) startHp (${c.game.startHp}) değerinden küçük olamaz`, { value: c.game.maxHpCap, expect: `int ${c.game.startHp}..12` });

  // arayüz ikonları: kalp görseli çift olarak verilir (biri yoksa SVG kalpler kullanılır)
  if (isObj(c.ui) && isObj(c.ui.icons) && Boolean(c.ui.icons.heartFull) !== Boolean(c.ui.icons.heartEmpty)) {
    warn("W_ART_PAIR", ["ui", "icons", c.ui.icons.heartFull ? "heartEmpty" : "heartFull"], "Kalp görseli için heartFull ve heartEmpty birlikte verilmeli; biri eksik olduğundan SVG kalpler kullanılır");
  }

  // oyuncu
  if (isObj(c.player) && isObj(c.characters) && has(c.characters, c.player.character) && c.characters[c.player.character].role !== "player") {
    err("E_REF", ["player", "character"], `player.character rolü "player" olan bir karakter olmalı`, { value: c.player.character, expect: "role=player" });
  }

  // yetenekler: kimlik = davranış
  for (const id of Object.keys(ab)) {
    const kind = ABILITY_KINDS[id];
    const a = ab[id];
    if (!kind) { err("E_ENUM", ["abilities", id], `Bilinmeyen yetenek kimliği ${JSON.stringify(id)}: kodda ${Object.keys(ABILITY_KINDS).join(" | ")} tanımlı (yeni yetenek = kod işi)`, { value: id, expect: Object.keys(ABILITY_KINDS).join("|") }); continue; }
    if (!isObj(a)) continue;
    const params = isObj(a.params) ? a.params : (a.params = {});
    for (const [pn, [min, max, def]] of Object.entries(kind.params)) {
      if (params[pn] === undefined) { params[pn] = def; continue; }
      if (params[pn] < min || params[pn] > max) err("E_RANGE", ["abilities", id, "params", pn], `${id}.${pn} ${params[pn]} geçersiz: ${min}–${max} arası olmalı`, { value: params[pn], expect: `num ${min}..${max}` });
    }
    for (const pn of Object.keys(params)) if (!has(kind.params, pn)) warn("W_UNKNOWN_FIELD", ["abilities", id, "params", pn], `${id} yeteneği ${pn} parametresini kullanmıyor`);
  }

  // silahlar
  for (const id of Object.keys(wp)) {
    const w = wp[id];
    if (!isObj(w)) continue;
    const blocks = WEAPON_BLOCKS.filter((b) => w[b] !== undefined);
    if (blocks.length > 1) err("E_CONFLICT", ["weapons", id], `Silah tür bloğu en fazla bir tane olabilir (bulunan: ${blocks.join(", ")})`, { value: blocks, expect: "en fazla 1 blok" });
    const projectile = !w.chain && !w.meteor && !w.nova;
    if (projectile && w.speed === undefined) err("E_REQUIRED", ["weapons", id, "speed"], `Mermi atan büyüde speed zorunlu`, { expect: "num 4..40" });
  }

  // perkler
  for (const id of Object.keys(pk)) {
    const p = pk[id];
    if (!isObj(p) || !isObj(p.effect)) continue;
    const { kind, stat, value } = p.effect;
    const stats = PERK_STATS[kind];
    if (!stats) continue;
    if (!stats.includes(stat)) { err("E_ENUM", ["perks", id, "effect", "stat"], `${kind} etkisi için stat ${stats.join(" | ")} olmalı`, { value: stat, expect: stats.join("|") }); continue; }
    if (kind === "mul" && (value < 0.1 || value > 3)) err("E_RANGE", ["perks", id, "effect", "value"], `mul değeri 0.1–3 arası olmalı`, { value, expect: "num 0.1..3" });
    if (kind === "add" && (value <= 0 || value > 50)) err("E_RANGE", ["perks", id, "effect", "value"], `add değeri 0'dan büyük ve en çok 50 olmalı`, { value, expect: "num 0..50" });
    if ((kind !== "flag" || stat === "stoneLevels") && p.maxStacks === undefined) warn("W_BALANCE", ["perks", id, "maxStacks"], `${id} perk'inde azami yığın (maxStacks) yok: sınırsız yığılma güç eğrisini bozar (plan B5)`);
    if (kind === "flag" && stat === "stoneLevels" && !(Number.isInteger(value) && value >= 1 && value <= 9)) err("E_RANGE", ["perks", id, "effect", "value"], `stoneLevels 1–9 arası tam sayı olmalı`, { value, expect: "int 1..9" });
  }

  // düşmanlar
  for (const id of Object.keys(en)) {
    const e = en[id];
    if (!isObj(e)) continue;
    if (e.model === undefined && !ENUM_MODELS.includes(id)) err("E_ENUM", ["enemies", id, "model"], `model belirtilmeli: kimlik ${JSON.stringify(id)} bir model adı değil (${ENUM_MODELS.join(" | ")})`, { value: id, expect: ENUM_MODELS.join("|") });
    else if (e.model === undefined) e.model = id;
    // karşıtlık: ezme tablosunda bilinmeyen element reddedilir (tür/etiket denetimi şemada: enm TAGS / MATCH_LEVELS)
    if (isObj(e.res)) for (const k of Object.keys(e.res)) if (!ELEMENTS.includes(k)) err("E_ENUM", ["enemies", id, "res", k], `Bilinmeyen element ${JSON.stringify(k)} (res): ${ELEMENTS.join(" | ")} olmalı`, { value: k, expect: ELEMENTS.join("|") });
  }

  // bölümler
  const aiOf = (eid) => (isObj(en[eid]) ? en[eid].ai : undefined);
  const hasAi = (ai) => Object.values(en).some((e) => isObj(e) && e.ai === ai);
  const GOAL = { crystal: [1, 60], survive: [5, 300], totem: [1, 6], miniboss: [1, 1], boss: [1, 1] };
  const rewarded = { weapon: new Map(), ability: new Map() };
  const usedEnemies = new Set();
  const usedThemes = new Set();
  let bossLevels = 0;
  for (const id of Object.keys(lv)) {
    const L = lv[id];
    if (!isObj(L)) continue;
    const P = (...s) => ["levels", id, ...s];
    const g = GOAL[L.objective];
    if (g && Number.isInteger(L.goal) && (L.goal < g[0] || L.goal > g[1])) err("E_RANGE", P("goal"), `goal ${L.goal} geçersiz: ${L.objective} hedefinde ${g[0]}–${g[1]} arası tam sayı olmalı`, { value: L.goal, expect: `int ${g[0]}..${g[1]}` });
    if (L.objective === "totem") {
      if (!Array.isArray(L.totems) || L.totems.length < L.goal) err("E_REQUIRED", P("totems"), `Totem hedefinde totems listesi goal (${L.goal}) kadar konum içermeli`, { expect: `array >= ${L.goal}` });
      if (!hasAi("static")) err("E_REF", P("objective"), `Totem hedefi için ai="static" olan bir düşman tanımlı olmalı`, { expect: "enemies içinde ai=static" });
    }
    if (L.objective === "miniboss" || L.objective === "boss") {
      const want = L.objective === "boss" ? "boss" : "knight";
      const startIds = isObj(L.start) ? Object.keys(L.start).filter((k) => L.start[k] > 0) : [];
      if (!startIds.some((k) => aiOf(k) === want)) err("E_REF", P("start"), `${L.objective} hedefinde start içinde ai="${want}" olan bir düşman bulunmalı`, { expect: `ai=${want}` });
    }
    if (L.objective === "boss") bossLevels++;
    if (isObj(L.start)) {
      const total = Object.values(L.start).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
      if (total > 30) err("E_RANGE", P("start"), `Başlangıç düşmanı toplamı ${total}: en çok 30 olabilir`, { value: total, expect: "<= 30" });
      Object.keys(L.start).forEach((k) => usedEnemies.add(k));
    }
    if (Array.isArray(L.spawn)) L.spawn.forEach((w) => isObj(w) && Object.keys(w).forEach((k) => usedEnemies.add(k)));
    if (L.reward) rewarded.weapon.set(L.reward, (rewarded.weapon.get(L.reward) || 0) + 1);
    if (L.ability) rewarded.ability.set(L.ability, (rewarded.ability.get(L.ability) || 0) + 1);
    if (typeof L.theme === "string") usedThemes.add(L.theme);
  }
  // denge bütçesi (plan §7.2, yaklaşık model): süre payı, mobil cap, başlangıç yoğunluğu, zorluk sıçraması / çok düşük geçme tahmini
  for (const b of balanceIssues(c)) warn("W_BALANCE", b.path[2] === "time" ? [b.path[0], b.path[1], "goal"] : b.path, b.message);
  for (const [k, n] of rewarded.weapon) if (n > 1) warn("W_BALANCE", ["levels"], `${k} büyüsü ${n} bölümde ödül olarak veriliyor`);
  for (const [k, n] of rewarded.ability) if (n > 1) warn("W_BALANCE", ["levels"], `${k} yeteneği ${n} bölümde ödül olarak veriliyor`);
  if (Object.keys(lv).length && bossLevels !== 1) warn("W_BALANCE", ["levels"], `${bossLevels} boss bölümü var (1 önerilir)`);

  // kullanılmayanlar
  const refEnemies = new Set(usedEnemies);
  for (const e of Object.values(en)) if (isObj(e)) { if (e.summon) refEnemies.add(e.summon); (e.summons1 || []).forEach((k) => refEnemies.add(k)); (e.summons2 || []).forEach((k) => refEnemies.add(k)); }
  if (Object.values(lv).some((L) => isObj(L) && L.objective === "totem")) for (const id of Object.keys(en)) if (aiOf(id) === "static") refEnemies.add(id);
  for (const id of Object.keys(en)) if (!refEnemies.has(id)) warn("W_UNUSED", ["enemies", id], `${id} düşmanı hiçbir bölümde kullanılmıyor`);
  const first = Array.isArray(c.weaponOrder) ? c.weaponOrder[0] : null;
  for (const id of Object.keys(wp)) if (id !== first && !rewarded.weapon.has(id)) warn("W_UNUSED", ["weapons", id], `${id} büyüsü ne başlangıçta ne de ödül olarak açılıyor`);
  for (const id of Object.keys(ab)) if (!rewarded.ability.has(id)) warn("W_UNUSED", ["abilities", id], `${id} yeteneği hiçbir bölümde ödül değil`);
  for (const id of Object.keys(th)) if (!usedThemes.has(id)) warn("W_UNUSED", ["themes", id], `${id} teması hiçbir bölümde kullanılmıyor`);

  // kampanya haritası (2. aşama; kenarlar isteğe bağlı)
  const camp = c.campaign;
  if (isObj(camp) && Array.isArray(camp.edges) && camp.edges.length && Array.isArray(camp.order)) {
    const out = {}, inn = {};
    camp.edges.forEach((e, i) => {
      if (!isObj(e)) return;
      out[e.from] = (out[e.from] || 0) + 1; inn[e.to] = (inn[e.to] || 0) + 1;
      if (out[e.from] > 1 || inn[e.to] > 1) warn("W_UNSUPPORTED_BRANCH", ["campaign", "edges", i], `v1 harita tek zincir olmalı; ${e.from} -> ${e.to} dallanma oluşturuyor`);
    });
    const start = camp.start || camp.order[0];
    const reach = new Set([start]);
    for (let k = 0; k < camp.order.length; k++) for (const e of camp.edges) if (isObj(e) && reach.has(e.from)) reach.add(e.to);
    for (const id of camp.order) if (!reach.has(id)) warn("W_UNREACHABLE", ["campaign", "order"], `${id} bölümüne haritadan ulaşılamıyor`);
  }
}
const ENUM_MODELS = enumList({ list: "MODEL_KINDS" });

// ---------------------------------------------------------------- yardımcılar: metin gösterimi

// "/levels/cave/goal" -> "Bölümler › Yarasa Mağarası › goal"
export function describePath(pointer, config) {
  const segs = pointer === "" ? [] : pointer.split("/").slice(1).map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  let spec = SCHEMA, val = config;
  const parts = [];
  for (const s of segs) {
    let next;
    if (spec && spec.t === "obj" && has(spec.fields, s)) next = spec.fields[s];
    else if (spec && (spec.t === "map" || spec.t === "rec")) next = spec.item;
    else if (spec && spec.t === "arr") next = spec.item;
    val = val != null && typeof val === "object" ? val[s] : undefined;
    const isId = spec && (spec.t === "map" || spec.t === "rec");
    if (isId) parts.push(isObj(val) && typeof val.name === "string" ? val.name : s);
    else if (spec && spec.t === "arr") parts.push(`#${+s + 1}`);
    else parts.push(next && next.label ? next.label : s);
    spec = next;
  }
  return parts.join(" › ");
}

export function formatIssue(issue, config) {
  const tag = issue.severity === "error" ? "HATA" : "UYARI";
  const where = describePath(issue.path, config);
  const val = issue.value !== undefined && typeof issue.value !== "object" ? ` = ${issue.value}` : "";
  return `[${tag}] ${where}${val} → ${issue.message} (${issue.code}, ${issue.path || "/"})`;
}
