// Yönetim sayfası: şemadan (schema.js) form üretici. Metin yalnızca textContent/h() ile basılır (ham HTML ataması yok).
// ctx: { cfg(), base(), get(ptr), set(ptr, value), structural(), notes, setNote(ptr, text), fields: Map, hooks: Set }
//  - set: değeri çalışma kopyasına yazar (undefined = alanı sil) ve doğrulamayı tetikler; formu YENİDEN KURMAZ
//  - structural: dizi/nesne yapısı değişince formu yeniden kurar

import { HEX_RE, PERK_STATS } from "../config/registry.js";
import { enumList } from "../config/schema.js";
import { dialog, h } from "../core/dom.js";
import { clone, getAt, ptr, same } from "./diff.js";
import { defaultFor } from "./model.js";
import { CODE_TAG, isCodeNote, noteText } from "./export.js";

let uid = 0;
const nid = () => "f" + ++uid;
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function hintText(spec) {
  const bits = [];
  if (spec.t === "int" || spec.t === "num") bits.push(`Aralık: ${spec.min}–${spec.max}`);
  if (spec.t === "str") bits.push(`${spec.min || 0}–${spec.max} karakter`);
  if (spec.t === "str" && spec.ph && spec.ph.length) bits.push("Yer tutucular: " + spec.ph.map((x) => `{${x}}`).join(" "));
  if (spec.t === "hex") bits.push("Biçim: #rrggbb");
  if (spec.t === "arr") bits.push(`${spec.min || 0}–${spec.max} öğe${spec.increasing ? " · artan sırada" : ""}`);
  if (spec.def !== undefined && spec.t !== "obj") bits.push(`Varsayılan: ${spec.def}`);
  return bits.join(" · ");
}

// ---- alan sarmalayıcı: etiket, ipucu, hata/uyarı, geri al, not ----
function wrap(ctx, spec, p, control, { label, inputId, group = false } = {}) {
  const msg = h("div", { class: "fld-msg", "aria-live": "polite" });
  const local = h("div", { class: "fld-msg local", role: "alert" });
  const lid = nid();
  const revert = h("button", { class: "mini revert", type: "button", hidden: true, title: "Bu alanı taslaktan geri al", "aria-label": "Bu alanı geri al" }, "↶ Geri al");
  const noteBtn = h("button", { class: "mini notebtn", type: "button", "aria-expanded": "false", title: "Claude'a not" }, "✎ Not");
  const noteArea = h("textarea", { rows: 2, maxlength: 1000, placeholder: "Bu alan için Claude'a not (isteğe bağlı)", "aria-label": "Alan notu" });
  const codeBox = h("input", { type: "checkbox" });
  const noteBox = h("div", { class: "note-box", hidden: true }, noteArea, h("label", { class: "chk" }, codeBox, " Kod gerektirir (JSON ile yapılamaz)"));
  const cur = ctx.notes[p];
  if (cur) { noteArea.value = noteText(cur); codeBox.checked = isCodeNote(cur); }
  const saveNote = () => ctx.setNote(p, noteArea.value.trim() ? (codeBox.checked ? CODE_TAG : "") + noteArea.value : "");
  noteArea.addEventListener("input", saveNote);
  codeBox.addEventListener("change", saveNote);
  noteBtn.addEventListener("click", () => { noteBox.hidden = !noteBox.hidden; noteBtn.setAttribute("aria-expanded", String(!noteBox.hidden)); if (!noteBox.hidden) noteArea.focus(); });
  revert.addEventListener("click", () => {
    if (!globalThis.confirm("Bu alan taslaktan geri alınsın mı?")) return;
    ctx.set(p, clone(getAt(ctx.base(), p)));
    ctx.structural();
  });
  const hint = hintText(spec);
  const lab = group ? h("div", { class: "fld-l", id: lid }, label) : h("label", { class: "fld-l", for: inputId }, label);
  const el = h("div", { class: "fld t-" + spec.t, "data-path": p, role: group ? "group" : null, "aria-labelledby": group ? lid : null },
    h("div", { class: "fld-head" }, lab, spec.req ? h("span", { class: "req", title: "Zorunlu", "aria-label": "zorunlu" }, "*") : null, h("span", { class: "tools" }, revert, noteBtn)),
    control, hint ? h("div", { class: "fld-hint" }, hint) : null, local, msg, noteBox);
  ctx.fields.set(p, { el, msg, local, revert, noteBtn, spec });
  return el;
}

const setLocal = (ctx, p, text) => { const f = ctx.fields.get(p); if (f) { f.local.textContent = text || ""; } };
const labelOf = (spec, segs) => spec.label || String(segs[segs.length - 1]);
const stepFor = (spec) => {
  if (spec.t === "int") return 1;
  const r = spec.max - spec.min;
  return r > 0 ? Math.pow(10, Math.floor(Math.log10(r / 100))) : 0.1;
};

// ---- tek alan ----
export function buildField(ctx, spec, segs, opts = {}) {
  const p = ptr(segs);
  const label = opts.label || labelOf(spec, segs);
  switch (spec.t) {
    case "int": case "num": return numField(ctx, spec, p, label);
    case "str": return strField(ctx, spec, p, label);
    case "hex": return hexField(ctx, spec, p, label);
    case "bool": return boolField(ctx, spec, p, label);
    case "enum": return enumField(ctx, spec, p, label);
    case "ref": return refField(ctx, spec, p, label);
    case "obj": return objGroup(ctx, spec, segs, opts);
    case "arr": return arrField(ctx, spec, segs, opts, label);
    case "rec": return recField(ctx, spec, p, label);
    default: return h("div", { class: "fld" }, label + ": bu tür formda desteklenmiyor");
  }
}

function numField(ctx, spec, p, label) {
  const id = nid(), v = ctx.get(p);
  const def = spec.def !== undefined ? String(spec.def) : "";
  const input = h("input", { id, type: "number", step: stepFor(spec) === 1 ? 1 : "any", min: spec.min, max: spec.max, inputmode: spec.t === "int" ? "numeric" : "decimal", value: v === undefined ? "" : v, placeholder: def });
  const useRange = Number.isFinite(spec.min) && Number.isFinite(spec.max) && spec.max - spec.min <= 1000;
  const range = useRange ? h("input", { type: "range", min: spec.min, max: spec.max, step: stepFor(spec), value: v === undefined ? (spec.def !== undefined ? spec.def : spec.min) : Math.min(Math.max(v, spec.min), spec.max), "aria-label": label + " (kaydırıcı)", tabindex: -1 }) : null;
  input.addEventListener("input", () => {
    if (input.value === "") { ctx.set(p, undefined); return; }
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    if (range) range.value = String(n);
    ctx.set(p, n);
  });
  if (range) range.addEventListener("input", () => { const n = Number(range.value); input.value = String(n); ctx.set(p, n); });
  return wrap(ctx, spec, p, h("div", { class: "num-row" }, input, range), { label, inputId: id });
}

function strField(ctx, spec, p, label) {
  const id = nid(), v = ctx.get(p);
  const long = spec.max > 100;
  const input = long
    ? h("textarea", { id, rows: spec.max > 300 ? 4 : 3, maxlength: spec.max }, v === undefined ? "" : v)
    : h("input", { id, type: "text", maxlength: spec.max, value: v === undefined ? "" : v, spellcheck: "true" });
  const count = long ? h("div", { class: "counter", "aria-hidden": "true" }, `${(v || "").length}/${spec.max}`) : null;
  input.addEventListener("input", () => {
    if (count) count.textContent = `${input.value.length}/${spec.max}`;
    ctx.set(p, input.value === "" && !spec.req ? undefined : input.value);
  });
  return wrap(ctx, spec, p, h("div", null, input, count), { label, inputId: id });
}

function hexField(ctx, spec, p, label) {
  const id = nid(), v = ctx.get(p);
  const ok = typeof v === "string" && HEX_RE.test(v);
  const color = h("input", { type: "color", value: ok ? v : "#000000", "aria-label": label + " (renk seçici)" });
  const text = h("input", { id, type: "text", maxlength: 7, value: v === undefined ? "" : v, placeholder: "#rrggbb", spellcheck: "false", autocapitalize: "off" });
  color.addEventListener("input", () => { text.value = color.value; setLocal(ctx, p, ""); text.removeAttribute("aria-invalid"); ctx.set(p, color.value); });
  text.addEventListener("input", () => {
    const t = text.value.trim();
    if (t === "" && !spec.req) { setLocal(ctx, p, ""); ctx.set(p, undefined); return; }
    if (HEX_RE.test(t)) { color.value = t; text.removeAttribute("aria-invalid"); setLocal(ctx, p, ""); ctx.set(p, t); } else { text.setAttribute("aria-invalid", "true"); setLocal(ctx, p, "Renk #rrggbb biçiminde olmalı (ör. #ffd98a); değer henüz uygulanmadı"); }
  });
  return wrap(ctx, spec, p, h("div", { class: "hex-row" }, color, text), { label, inputId: id });
}

function boolField(ctx, spec, p, label) {
  const id = nid(), v = ctx.get(p);
  const box = h("input", { id, type: "checkbox", checked: v === true });
  box.addEventListener("change", () => ctx.set(p, box.checked));
  return wrap(ctx, spec, p, h("label", { class: "chk", for: id }, box, h("span", null, v === undefined && spec.def !== undefined ? `Evet (varsayılan: ${spec.def ? "evet" : "hayır"})` : "Evet")), { label, inputId: id });
}

function selectEl(id, options, value, emptyLabel) {
  const sel = h("select", { id });
  if (emptyLabel) sel.append(h("option", { value: "" }, emptyLabel));
  let found = value === undefined || value === "" || false;
  for (const [val, text] of options) { if (val === value) found = true; sel.append(h("option", { value: val, selected: val === value }, text)); }
  if (!found) sel.append(h("option", { value, selected: true }, "⚠ " + value + " (geçersiz)"));
  if (value === undefined || value === "") sel.value = "";
  return sel;
}

function enumField(ctx, spec, p, label) {
  const id = nid(), v = ctx.get(p);
  const isStat = /^\/perks\/[^/]+\/effect\/stat$/.test(p);
  let list = enumList(spec);
  if (isStat) { const kind = ctx.get(p.replace(/stat$/, "kind")); list = PERK_STATS[kind] || []; }
  const sel = selectEl(id, list.map((x) => [x, x]), v, spec.req ? null : "(boş)");
  sel.addEventListener("change", () => {
    ctx.set(p, sel.value === "" ? undefined : sel.value);
    if (/^\/perks\/[^/]+\/effect\/kind$/.test(p)) { // tür değişince alan listesi değişir
      const sp = p.replace(/kind$/, "stat"), nk = PERK_STATS[sel.value] || [];
      if (!nk.includes(ctx.get(sp))) ctx.set(sp, nk[0]);
      ctx.structural();
    }
  });
  return wrap(ctx, spec, p, sel, { label, inputId: id });
}
// perk "alan" (stat) şemada serbest metin; formda tür listesinden seçtiriyoruz
export const asEnumLike = (spec, p) => (/^\/perks\/[^/]+\/effect\/stat$/.test(p) ? { ...spec, t: "enum", list: [] } : spec);

function refField(ctx, spec, p, label) {
  const id = nid(), v = ctx.get(p);
  const coll = ctx.cfg()[spec.coll] || {};
  const sel = selectEl(id, Object.entries(coll).map(([k, x]) => [k, (x && x.name ? x.name + " · " : "") + k]), v, spec.req ? null : spec.empty || "(boş)");
  sel.addEventListener("change", () => ctx.set(p, sel.value === "" ? undefined : sel.value));
  return wrap(ctx, spec, p, sel, { label, inputId: id });
}

// ---- nesne ----
export function objFields(ctx, spec, segs, opts = {}, depth = 1) {
  const out = [];
  for (const [k, f] of Object.entries(spec.fields)) {
    const sp = ptr([...segs, k]);
    if (opts.skip && (typeof opts.skip === "function" ? opts.skip(sp) : opts.skip.has(sp))) continue;
    const real = asEnumLike(f, sp);
    out.push(buildField(ctx, opts.map && opts.map[k] ? { ...real, ...opts.map[k] } : real, [...segs, k], { ...opts, depth: depth + 1 }));
  }
  return out;
}

function objGroup(ctx, spec, segs, opts) {
  const p = ptr(segs), v = ctx.get(p), depth = opts.depth || 0;
  const label = opts.label || labelOf(spec, segs);
  if (v === undefined) { // isteğe bağlı ve yok
    const add = h("button", { class: "mini", type: "button" }, "＋ Ekle");
    add.addEventListener("click", () => { ctx.set(p, defaultFor(spec, ctx.cfg())); ctx.structural(); });
    const amsg = h("div", { class: "fld-msg", "aria-live": "polite" });
    const el = h("div", { class: "fld t-obj absent", "data-path": p }, h("span", { class: "fld-l" }, label), " ", add, amsg);
    ctx.fields.set(p, { el, msg: amsg, local: h("div"), revert: h("span"), noteBtn: h("span"), spec });
    return el;
  }
  const rm = !spec.req ? h("button", { class: "mini", type: "button", title: "Bu bloğu kaldır" }, "Kaldır") : null;
  if (rm) rm.addEventListener("click", (e) => { e.preventDefault(); ctx.set(p, undefined); ctx.structural(); });
  const msg = h("div", { class: "fld-msg", "aria-live": "polite" });
  const body = h("div", { class: "grp-body" }, ...objFields(ctx, spec, segs, opts, depth), msg);
  const el = h("details", { class: "grp d" + Math.min(depth, 3), "data-path": p, open: depth === 0 || opts.open }, h("summary", null, h("span", null, label), rm), body);
  ctx.fields.set(p, { el, msg, local: h("div"), revert: h("span"), noteBtn: h("span"), spec });
  return el;
}

// ---- dizi ----
function mut(ctx, p, fn) {
  const a = clone(ctx.get(p)) || [];
  fn(a);
  ctx.set(p, a);
  ctx.structural();
}

function rowTools(ctx, spec, p, i, len) {
  const btn = (txt, label, dis, fn) => h("button", { class: "mini", type: "button", title: label, "aria-label": label, disabled: dis, onclick: fn }, txt);
  return h("span", { class: "row-tools" },
    btn("↑", "Yukarı taşı", i === 0, () => mut(ctx, p, (a) => { [a[i - 1], a[i]] = [a[i], a[i - 1]]; })),
    btn("↓", "Aşağı taşı", i === len - 1, () => mut(ctx, p, (a) => { [a[i + 1], a[i]] = [a[i], a[i + 1]]; })),
    btn("✕", "Sil", len <= (spec.min || 0), () => mut(ctx, p, (a) => { a.splice(i, 1); })));
}

const isPair = (it) => it.t === "arr" && it.min === 2 && it.max === 2 && (it.item.t === "num" || it.item.t === "int");

function arrField(ctx, spec, segs, opts, label) {
  const p = ptr(segs), v = ctx.get(p);
  const it = spec.item;
  if (v === undefined && !spec.req) {
    const add = h("button", { class: "mini", type: "button" }, "＋ Ekle");
    add.addEventListener("click", () => { ctx.set(p, defaultFor(spec, ctx.cfg())); ctx.structural(); });
    return wrap(ctx, spec, p, add, { label, group: true });
  }
  const arr = Array.isArray(v) ? v : [];
  if (it.t === "int" || it.t === "num") return csvField(ctx, spec, p, label, arr);
  const rows = h("div", { class: "rows" });
  const isDialog = it.t === "obj" && it.fields.text && it.fields.speaker;
  arr.forEach((x, i) => {
    const ip = ptr([...segs, i]);
    let body;
    if (it.t === "ref") body = refRow(ctx, it, ip, spec);
    else if (isPair(it)) body = pairRow(ctx, it, ip, x);
    else if (it.t === "obj") body = isDialog ? dialogRow(ctx, it, [...segs, i]) : h("details", { class: "sub", open: opts.depth < 3 && arr.length <= 3 }, h("summary", null, `#${i + 1}${x && x.name ? " · " + x.name : x && x.from ? " · " + x.from + " → " + x.to : ""}`), ...objFields(ctx, it, [...segs, i], { ...opts, skip: null }, (opts.depth || 1) + 1));
    else if (it.t === "rec") body = recField(ctx, it, ip, "#" + (i + 1), true);
    else body = h("span", null, "?");
    rows.append(h("div", { class: "row" + (isDialog ? " dlg" : ""), "data-path": ip }, h("span", { class: "row-n", "aria-hidden": "true" }, String(i + 1)), h("div", { class: "row-body" }, body), rowTools(ctx, spec, p, i, arr.length)));
  });
  const add = h("button", { class: "mini add", type: "button", disabled: arr.length >= spec.max }, "＋ Ekle");
  add.addEventListener("click", () => mut(ctx, p, (a) => { a.push(it.t === "arr" ? [0, 0] : defaultFor(it, ctx.cfg())); }));
  const preview = isDialog ? dialogPreview(ctx, p) : null;
  return wrap(ctx, spec, p, h("div", null, rows, add, preview), { label, group: true });
}

function csvField(ctx, spec, p, label, arr) {
  const id = nid();
  const input = h("input", { id, type: "text", value: arr.join(", "), inputmode: "decimal", spellcheck: "false" });
  input.addEventListener("input", () => {
    const parts = input.value.split(/[,\s]+/).filter(Boolean).map(Number);
    if (parts.some((n) => !Number.isFinite(n))) { setLocal(ctx, p, "Yalnızca sayılar, virgülle ayrılmış"); input.setAttribute("aria-invalid", "true"); return; }
    setLocal(ctx, p, ""); input.removeAttribute("aria-invalid");
    ctx.set(p, parts);
  });
  return wrap(ctx, spec, p, input, { label, inputId: id });
}

function refRow(ctx, it, ip, arrSpec) {
  const id = nid(), v = ctx.get(ip);
  const coll = ctx.cfg()[it.coll] || {};
  const sel = selectEl(id, Object.entries(coll).map(([k, x]) => [k, (x && x.name ? x.name + " · " : "") + k]), v, null);
  sel.setAttribute("aria-label", arrSpec.label || "Seçim");
  sel.addEventListener("change", () => ctx.set(ip, sel.value));
  return sel;
}

function pairRow(ctx, it, ip, x) {
  const mk = (j, name) => {
    const inp = h("input", { type: "number", step: "any", min: it.item.min, max: it.item.max, value: Array.isArray(x) ? x[j] : 0, "aria-label": name, inputmode: "decimal" });
    inp.addEventListener("input", () => { const n = Number(inp.value); if (inp.value === "" || !Number.isFinite(n)) return; const a = clone(ctx.get(ip)); a[j] = n; ctx.set(ip, a); });
    return inp;
  };
  return h("span", { class: "pair" }, h("label", null, "x ", mk(0, "x")), h("label", null, "y/z ", mk(1, "ikinci değer")));
}

function dialogRow(ctx, it, segs) {
  const fields = [];
  const sp = { ...it.fields.speaker, empty: "(anlatıcı)", label: "Konuşmacı" };
  fields.push(buildField(ctx, sp, [...segs, "speaker"]));
  fields.push(buildField(ctx, it.fields.text, [...segs, "text"]));
  return h("div", { class: "dlg-fields" }, ...fields);
}

function dialogPreview(ctx, p) {
  const box = h("div", { class: "dlg-preview", "aria-label": "Oyundaki görünüm önizlemesi" });
  const draw = () => {
    const chars = ctx.cfg().characters || {};
    const lines = (ctx.get(p) || []).map((l) => ({ speaker: l && l.speaker && chars[l.speaker] ? chars[l.speaker].name : null, color: l && l.speaker && chars[l.speaker] ? chars[l.speaker].color : null, text: String((l && l.text) || "") }));
    box.replaceChildren(h("small", null, "Önizleme"), h("p", null, ...dialog(lines)));
  };
  draw();
  ctx.hooks.add(draw);
  return box;
}

// ---- rec: {düşman_id: sayı} ----
function recField(ctx, spec, p, label, bare = false) {
  const v = ctx.get(p), obj = isObj(v) ? v : {};
  const coll = ctx.cfg()[spec.coll] || {};
  const rows = h("div", { class: "rows" });
  const entries = Object.entries(obj);
  const rewrite = (fn) => { const o = {}; for (const [k, x] of entries) fn(o, k, x); return o; };
  for (const [k, n] of entries) {
    const sel = selectEl(nid(), Object.entries(coll).map(([id, x]) => [id, (x && x.name ? x.name + " · " : "") + id]), k, null);
    sel.setAttribute("aria-label", "Düşman");
    sel.addEventListener("change", () => { ctx.set(p, rewrite((o, kk, x) => { o[kk === k ? sel.value : kk] = x; })); ctx.structural(); });
    const num = h("input", { type: "number", min: spec.item.min, max: spec.item.max, step: 1, value: n, inputmode: "numeric", "aria-label": "Adet" });
    num.addEventListener("input", () => { const x = Number(num.value); if (num.value === "" || !Number.isFinite(x)) return; ctx.set(p, { ...ctx.get(p), [k]: x }); });
    const del = h("button", { class: "mini", type: "button", title: "Sil", "aria-label": "Sil", onclick: () => { ctx.set(p, rewrite((o, kk, x) => { if (kk !== k) o[kk] = x; })); ctx.structural(); } }, "✕");
    rows.append(h("div", { class: "row rec" }, h("div", { class: "row-body" }, sel, num), del));
  }
  const free = Object.keys(coll).filter((k) => !(k in obj));
  const add = h("button", { class: "mini add", type: "button", disabled: !free.length }, "＋ Düşman ekle");
  add.addEventListener("click", () => { ctx.set(p, { ...obj, [free[0]]: spec.item.min || 1 }); ctx.structural(); });
  const control = h("div", null, rows, add);
  if (bare) return control;
  return wrap(ctx, spec, p, control, { label, group: true });
}
