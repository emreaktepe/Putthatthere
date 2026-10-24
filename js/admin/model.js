// Yönetim sayfası: şemadan varsayılan değer üretimi, koleksiyon öğesi ekleme/silme/çoğaltma (bağlı sıra dizileriyle birlikte)
// ve yol -> sekme yönlendirmesi. Saf; DOM'a dokunmaz.

import { ID_RE, ABILITY_KINDS } from "../config/registry.js";
import { SCHEMA, enumList } from "../config/schema.js";
import { clone, esc, getAt, ptr } from "./diff.js";

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// Şema türüne göre "geçerli" bir başlangıç değeri. Yalnızca zorunlu alanlar doldurulur.
export function defaultFor(spec, cfg) {
  switch (spec.t) {
    case "int": case "num": { const v = spec.def !== undefined ? spec.def : spec.min !== undefined ? spec.min : 0; return spec.t === "int" ? Math.round(v) : v; }
    case "str": { let s = "Yeni " + (spec.label || "metin"); if (s.length < spec.min) s = s.padEnd(spec.min, "…"); return s.slice(0, spec.max); }
    case "hex": return "#8e44ff";
    case "bool": return false;
    case "enum": return enumList(spec)[0];
    case "ref": return Object.keys((cfg && cfg[spec.coll]) || {})[0] || "";
    case "arr": { const out = []; for (let i = 0; i < (spec.min || 0); i++) out.push(defaultFor(spec.item, cfg)); return out; }
    case "obj": { const o = {}; for (const [k, f] of Object.entries(spec.fields)) if (f.req) o[k] = defaultFor(f, cfg); return o; }
    default: return {}; // map, rec
  }
}

export const COLLECTIONS = {
  characters: { label: "Karakter", orders: [] },
  enemies: { label: "Düşman", orders: [] },
  weapons: { label: "Büyü", orders: ["weaponOrder"] },
  abilities: { label: "Yetenek", orders: ["abilityOrder"] },
  perks: { label: "Perk", orders: ["perkOrder"] },
  themes: { label: "Tema", orders: [] },
  levels: { label: "Bölüm", orders: [] },
};

export function checkNewId(cfg, coll, id) {
  if (typeof id !== "string" || !ID_RE.test(id)) return "Kimlik: küçük harfle başlayan, 2-24 karakter; yalnızca a-z, 0-9 ve _";
  if (has(cfg[coll] || {}, id)) return "Bu kimlik zaten var";
  return null;
}

// yeni öğe ekler (cfg yerinde değişir); sıra dizilerine ve kampanyaya da ekler
export function addItem(cfg, coll, id, value) {
  const err = checkNewId(cfg, coll, id);
  if (err) return { ok: false, error: err };
  const spec = SCHEMA.fields[coll].item;
  const v = value ? clone(value) : defaultFor(spec, cfg);
  if (!value && spec.fields.name) v.name = id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
  if (!cfg[coll]) cfg[coll] = {};
  cfg[coll][id] = v;
  for (const o of COLLECTIONS[coll].orders) { if (!Array.isArray(cfg[o])) cfg[o] = []; cfg[o].push(id); }
  if (coll === "levels") {
    if (!cfg.campaign) cfg.campaign = { order: [] };
    const order = cfg.campaign.order;
    const prev = order[order.length - 1];
    order.push(id);
    if (!cfg.campaign.start) cfg.campaign.start = id;
    if (prev) { if (!Array.isArray(cfg.campaign.edges)) cfg.campaign.edges = []; cfg.campaign.edges.push({ from: prev, to: id, style: "dotted" }); }
  }
  return { ok: true, value: v };
}

export function duplicateItem(cfg, coll, srcId, newId) {
  if (!has(cfg[coll] || {}, srcId)) return { ok: false, error: "Kaynak öğe yok" };
  const v = clone(cfg[coll][srcId]);
  if (typeof v.name === "string") v.name = (v.name + " (kopya)").slice(0, SCHEMA.fields[coll].item.fields.name.max);
  if (coll === "levels" && v.map) v.map = { ...v.map, x: Math.min((v.map.x || 0) + 40, 5000), y: Math.min((v.map.y || 0) + 40, 5000) };
  return addItem(cfg, coll, newId, v);
}

const without = (arr, id) => (Array.isArray(arr) ? arr.filter((x) => x !== id) : arr);

// öğeyi siler ve ona bağlı sıra/başvuruları temizler (kalan başvuruları doğrulayıcı gösterir)
export function removeItem(cfg, coll, id) {
  if (!cfg[coll] || !has(cfg[coll], id)) return false;
  delete cfg[coll][id];
  for (const o of COLLECTIONS[coll].orders) cfg[o] = without(cfg[o], id);
  const levels = Object.values(cfg.levels || {});
  if (coll === "weapons") for (const L of levels) if (L.reward === id) delete L.reward;
  if (coll === "abilities") for (const L of levels) if (L.ability === id) delete L.ability;
  if (coll === "enemies") {
    for (const L of levels) {
      if (L.start) delete L.start[id];
      if (Array.isArray(L.spawn)) for (const w of L.spawn) delete w[id];
    }
    for (const e of Object.values(cfg.enemies)) {
      if (e.summon === id) delete e.summon;
      for (const k of ["summons1", "summons2"]) if (Array.isArray(e[k])) e[k] = without(e[k], id);
    }
  }
  if (coll === "levels" && cfg.campaign) {
    const c = cfg.campaign;
    c.order = without(c.order, id);
    if (Array.isArray(c.edges)) c.edges = c.edges.filter((e) => e && e.from !== id && e.to !== id);
    if (c.start === id) { if (c.order && c.order.length) c.start = c.order[0]; else delete c.start; }
  }
  return true;
}

// kimliği değiştirilebilir mi: yetenek kimliği = davranış; yeni yetenek yalnızca henüz eklenmemiş türlerden seçilir
export const abilityChoices = (cfg) => Object.keys(ABILITY_KINDS).filter((k) => !has(cfg.abilities || {}, k));

// ---- sekmeler ve yol yönlendirme ----
export const TABS = [
  { id: "genel", label: "Genel" },
  { id: "karakterler", label: "Karakterler" },
  { id: "dusmanlar", label: "Düşmanlar" },
  { id: "buyuler", label: "Büyüler · Perk'ler" },
  { id: "bolumler", label: "Bölümler & Harita" },
  { id: "hikaye", label: "Hikâye" },
  { id: "ses", label: "Ses & Tema" },
  { id: "dogrulama", label: "Doğrulama" },
];

const ROOT_TAB = { meta: "genel", game: "genel", strings: "genel", characters: "karakterler", player: "karakterler", enemies: "dusmanlar", weapons: "buyuler", weaponOrder: "buyuler", abilities: "buyuler", abilityOrder: "buyuler", perks: "buyuler", perkOrder: "buyuler", levels: "bolumler", campaign: "bolumler", map: "bolumler", themes: "ses" };

// "/levels/cave/intro/0/text" -> { tab, coll, id, root }. Hikâye alanları (diyaloglar) hikâye sekmesinde de görünür; asıl yer "tab".
export function routeOf(pointer) {
  const segs = pointer === "" ? [] : pointer.split("/").slice(1).map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  const root = segs[0];
  let tab = ROOT_TAB[root] || "genel";
  if (root === "levels" && (segs[2] === "intro" || segs[2] === "outro")) tab = "hikaye";
  if (root === "strings" && ["deathLines", "opening", "finalTitle", "finalLine"].includes(segs[1])) tab = "hikaye";
  const coll = has(COLLECTIONS, root) ? root : null;
  return { tab, coll, id: coll && segs[1] !== undefined ? segs[1] : null, root };
}

// bir sekmedeki hata/uyarı sayıları
export function countByTab(issues) {
  const out = {};
  for (const it of issues) {
    const t = routeOf(it.path).tab;
    out[t] = out[t] || { error: 0, warning: 0 };
    out[t][it.severity === "error" ? "error" : "warning"]++;
  }
  return out;
}

export { esc, getAt, ptr };
