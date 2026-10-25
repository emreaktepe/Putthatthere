// Yönetim sayfası ana modülü: taban yükleme, taslak (localStorage), sekmeler, doğrulama göstergeleri, dışa/içe aktarma.
// Güvenlik: tüm metin h()/textContent ile basılır; localStorage'a yalnızca doğrulanmış yama yazılır (hatalı durumda son geçerli yama korunur).
import { configHash } from "../config/hash.js";
import { FILE_PROTOCOL_MESSAGE, defaultConfigUrl, parseAndCheck } from "../config/load.js";
import { migrate } from "../config/migrate.js";
import { applyOps, parsePointer } from "../config/patch.js";
import { SCHEMA } from "../config/schema.js";
import { DRAFT_KEY, clearDraft, makeStore, readDraft, writeDraft } from "../config/storage.js";
import { formatIssue, validate } from "../config/validate.js";
import { h } from "../core/dom.js";
import { buildField, objFields } from "./form.js";
import { changeRows, clone, diffOps, getAt, ptr, same, setAt, shortValue } from "./diff.js";
import { buildClaudePackage, buildDraft, cleanNotes, exportPatch, formatConfig, readImport } from "./export.js";
import { mapEditor } from "./mapedit.js";
import { COLLECTIONS, TABS, abilityChoices, addItem, checkNewId, countByTab, duplicateItem, removeItem, routeOf } from "./model.js";
import { lookStrip, previewCard } from "./preview.js";

const $app = document.getElementById("app");
const F = SCHEMA.fields;
const S = { store: null, base: null, baseHash: "", working: null, notes: {}, active: true, rev: 0, savedOps: [], tab: "genel", sel: {}, spellKind: "weapons", issues: { errors: [], warnings: [] }, saveState: "clean", staleDraft: null, badDraft: null, otherTab: false, importResult: null, embed: false, conflicts: [], showStaleDiff: false };
const ctx = { fields: new Map(), hooks: new Set(), notes: S.notes };
let panel, tabsEl, statusEl, healthEl, bannerEl, toastEl, barEl, timer = 0, toastTimer = 0;

// ------------------------------------------------------------------ ctx
ctx.cfg = () => S.working;
ctx.base = () => S.base;
ctx.get = (p) => getAt(S.working, p);
ctx.set = (p, v) => {
  if (!setAt(S.working, p, v)) console.warn("[admin] yazılamadı", p);
  for (const f of [...ctx.hooks]) f();
  schedule();
};
ctx.structural = () => { const keep = focusKey(); const y = window.scrollY; renderPanel(); window.scrollTo(0, y); restoreFocus(keep); schedule(); };
ctx.setNote = (p, text) => { if (text) S.notes[p] = text; else delete S.notes[p]; schedule(); };

function focusKey() {
  const a = document.activeElement;
  if (!a || !panel || !panel.contains(a)) return null;
  const host = a.closest("[data-path]");
  return host ? { path: host.getAttribute("data-path"), tag: a.tagName, type: a.type } : null;
}
function restoreFocus(k) {
  if (!k) return;
  const host = [...panel.querySelectorAll("[data-path]")].find((e) => e.getAttribute("data-path") === k.path);
  const t = host && (host.querySelector(k.tag.toLowerCase()) || host.querySelector("input,select,textarea,button"));
  if (t) t.focus({ preventScroll: true });
}

// ------------------------------------------------------------------ doğrulama, kayıt, durum
function schedule() { clearTimeout(timer); timer = setTimeout(afterChange, 120); }

function afterChange() {
  const r = validate(S.working, { mode: "strict" });
  S.issues = { errors: r.errors, warnings: r.warnings };
  persist();
  paint();
}

function persist() {
  if (S.staleDraft || S.badDraft) { S.saveState = "blocked"; return; }
  const notes = cleanNotes(S.notes);
  let ops;
  if (S.issues.errors.length) ops = S.savedOps; // hatalı veri asla yazılmaz; son geçerli yama + güncel notlar
  else ops = diffOps(S.base, S.working);
  if (!ops.length && !Object.keys(notes).length && S.active) { clearDraft(S.store); S.savedOps = []; S.saveState = S.issues.errors.length ? "errors" : "clean"; return; }
  const draft = { v: 1, schemaVersion: 1, baseHash: S.baseHash, savedAt: new Date().toISOString(), active: S.active, rev: S.rev + 1, ops, notes };
  const res = writeDraft(S.store, draft);
  if (!res.ok) { S.saveState = "toobig"; S.saveMsg = res.error; return; }
  S.rev = draft.rev;
  if (!S.issues.errors.length) S.savedOps = ops;
  S.saveState = S.issues.errors.length ? "errors" : res.persisted ? "saved" : "memory";
}

const SAVE_TEXT = {
  clean: "Taslak yok (repo ile aynı)", saved: "Taslak bu tarayıcıya kaydedildi", errors: "Hatalar var: yeni değişiklikler kaydedilmedi (son geçerli taslak korunuyor)",
  memory: "Kaydedilemedi (tarayıcı depolaması kapalı/dolu): yalnızca bellekte. Dışa aktarın!", toobig: "Taslak 200 KB sınırını aşıyor: dışa aktarın", blocked: "Taslak çözülene kadar kaydedilmiyor",
};

function paint() {
  paintIssues();
  paintMarks();
  const n = diffOps(S.base, S.working).length;
  const e = S.issues.errors.length, w = S.issues.warnings.length;
  statusEl.replaceChildren(h("strong", null, `Taslak: ${n} değişiklik`), h("span", { class: "muted" }, " · " + (S.saveState === "toobig" ? S.saveMsg : SAVE_TEXT[S.saveState])));
  healthEl.className = "health " + (e ? "bad" : w ? "warn" : "ok");
  healthEl.textContent = e ? `✖ ${e} hata` : w ? `⚠ ${w} uyarı` : "✔ Sağlıklı";
  healthEl.title = "Doğrulama sekmesini aç";
  const counts = countByTab([...S.issues.errors, ...S.issues.warnings]);
  for (const b of tabsEl.querySelectorAll("[role=tab]")) {
    const c = counts[b.dataset.tab];
    const badge = b.querySelector(".badge");
    badge.textContent = c ? String(c.error + c.warning) : "";
    badge.className = "badge" + (c ? (c.error ? " bad" : " warn") : "");
    badge.hidden = !c;
  }
  const dv = tabsEl.querySelector("[data-tab=dogrulama] .badge");
  dv.hidden = !(e || w);
  dv.textContent = String(e + w);
  dv.className = "badge" + (e ? " bad" : " warn");
  renderBanner();
}

function paintMarks() {
  for (const [p, f] of ctx.fields) {
    const changed = !same(getAt(S.working, p), getAt(S.base, p));
    f.el.classList.toggle("changed", changed);
    f.revert.hidden = !changed;
    f.noteBtn.classList.toggle("has", !!S.notes[p]);
  }
}

function nearestField(path) {
  const segs = parsePointer(path);
  while (true) {
    const f = ctx.fields.get(ptr(segs));
    if (f || !segs.length) return { f, depth: segs.length, exact: ptr(segs) === path };
    segs.pop();
  }
}

function paintIssues() {
  for (const f of ctx.fields.values()) { f.msg.replaceChildren(); const c = f.el.querySelector("input,select,textarea"); if (c && !f.local.textContent) c.removeAttribute("aria-invalid"); }
  for (const it of [...S.issues.errors, ...S.issues.warnings]) {
    const { f, exact } = nearestField(it.path);
    if (!f) continue;
    f.msg.append(h("div", { class: "issue " + it.severity }, (it.severity === "error" ? "✖ " : "⚠ ") + it.message + (exact ? "" : ` (${it.path})`)));
    if (exact && it.severity === "error") { const c = f.el.querySelector("input,select,textarea"); if (c) c.setAttribute("aria-invalid", "true"); }
  }
}

// ------------------------------------------------------------------ yardımcılar
const btn = (label, fn, cls = "btn", attrs = {}) => h("button", { type: "button", class: cls, onclick: fn, ...attrs }, label);
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 4500);
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const today = () => new Date().toISOString().slice(0, 10);
const field = (spec, segs, opts = {}) => buildField(ctx, spec, segs, { depth: 0, ...opts });
const section = (title, ...kids) => h("section", { class: "card" }, h("h2", null, title), ...kids);

function playUrl(extra = "") {
  if (S.staleDraft || S.badDraft) { toast("Önce taslağı çözün (üstteki uyarı)."); return null; }
  if (S.issues.errors.length) { toast("Hatalar düzelene kadar oyun son kaydedilmiş taslakla açılır; önce hataları düzeltin."); return null; }
  afterChangeNow();
  return "./index.html?cfg=draft" + extra;
}
function afterChangeNow() { clearTimeout(timer); afterChange(); }
function openGame(extra) { const u = playUrl(extra); if (u) window.open(u, "_blank", "noopener"); }

// ------------------------------------------------------------------ iskelet
function build() {
  tabsEl = h("div", { class: "tabs", role: "tablist", "aria-label": "Bölümler" }, ...TABS.map((t) => h("button", { type: "button", role: "tab", id: "tab-" + t.id, "data-tab": t.id, "aria-controls": "panel", onclick: () => selectTab(t.id) }, t.label, h("span", { class: "badge", hidden: true }))));
  tabsEl.addEventListener("keydown", (e) => {
    const i = TABS.findIndex((t) => t.id === S.tab);
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    selectTab(TABS[(i + d + TABS.length) % TABS.length].id);
    tabsEl.querySelector(`[data-tab=${S.tab}]`).focus();
  });
  panel = h("main", { id: "panel", role: "tabpanel", tabindex: -1 });
  statusEl = h("div", { class: "status", "aria-live": "polite" });
  healthEl = h("button", { type: "button", class: "health ok", onclick: () => selectTab("dogrulama") }, "…");
  bannerEl = h("div", { class: "banners" });
  toastEl = h("div", { class: "toast", role: "status", "aria-live": "polite" });
  barEl = h("div", { class: "bar" }, statusEl, healthEl, btn("▶ Taslakla oyna", () => openGame(), "btn primary"), btn("⬇ Dışa aktar", () => { selectTab("genel"); document.getElementById("akis")?.scrollIntoView({ behavior: "smooth" }); }));
  $app.replaceChildren(
    h("header", { class: "top" }, h("div", null, h("h1", null, "HEXORA · Yönetim"), h("p", { class: "muted" }, "Değişiklikler yalnız bu tarayıcıda taslak olarak kalır; repoya yazılmaz.")), h("a", { class: "btn", href: "./index.html" }, "← Oyuna dön")),
    bannerEl, tabsEl, panel, barEl, toastEl);
}

function selectTab(id) { S.tab = id; renderAll(); }

function renderAll() {
  for (const b of tabsEl.querySelectorAll("[role=tab]")) { const on = b.dataset.tab === S.tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; }
  panel.setAttribute("aria-labelledby", "tab-" + S.tab);
  renderPanel();
  paint();
}

function renderPanel() {
  ctx.fields = new Map();
  ctx.hooks = new Set();
  ctx.notes = S.notes;
  const fn = { genel: tabGenel, karakterler: tabKarakterler, dusmanlar: tabDusmanlar, buyuler: tabBuyuler, bolumler: tabBolumler, hikaye: tabHikaye, ses: tabSes, dogrulama: tabDogrulama }[S.tab];
  panel.inert = !!(S.staleDraft || S.badDraft);
  panel.replaceChildren(...fn());
  paintIssues();
  paintMarks();
}

// ------------------------------------------------------------------ uyarı bantları
function renderBanner() {
  const kids = [];
  if (S.staleDraft) {
    const d = S.staleDraft;
    const conflictsFor = applyOps(S.base, d.ops).conflicts;
    kids.push(h("div", { class: "banner warn", role: "alert" },
      h("strong", null, "Repo varsayılanı, taslağını aldığından sonra değişti. "), `Taslakta ${d.ops.length} işlem var; oyun bu taslağı uygulamaz. Çözene kadar düzenleme kapalı.`,
      h("div", { class: "row-btns" },
        btn("Yeni tabana yeniden uygula", () => reapplyStale(), "btn primary"),
        btn("Taslağı at", () => { if (confirm("Taslak silinsin mi? Bu geri alınamaz.")) { clearDraft(S.store); S.staleDraft = null; S.working = clone(S.base); S.notes = {}; ctx.notes = S.notes; S.savedOps = []; renderAll(); afterChange(); } }),
        btn(S.showStaleDiff ? "Farkı gizle" : "Farkı göster", () => { S.showStaleDiff = !S.showStaleDiff; renderBanner(); })),
      S.showStaleDiff ? h("ul", { class: "ops" }, ...d.ops.map((o) => h("li", null, h("code", null, o.op + " " + o.path), o.op === "set" ? " → " + shortValue(o.value, 100) : ""))) : null,
      conflictsFor.length ? h("p", { class: "muted" }, `Yeniden uygulanınca ${conflictsFor.length} işlem çakışacak (yol artık yok).`) : null));
  }
  if (S.badDraft) {
    kids.push(h("div", { class: "banner bad", role: "alert" }, h("strong", null, "Kayıtlı taslak doğrulamadan geçmiyor "), `(${S.badDraft.errors.length} hata); oyun taslağı uygulamaz.`,
      h("div", { class: "row-btns" },
        btn("Hatalarıyla aç ve düzelt", () => { S.working = S.badDraft.raw; S.badDraft = null; renderAll(); afterChange(); }, "btn primary"),
        btn("Taslağı at", () => { if (confirm("Taslak silinsin mi?")) { clearDraft(S.store); S.badDraft = null; S.working = clone(S.base); S.notes = {}; S.savedOps = []; renderAll(); afterChange(); } })),
      h("ul", { class: "ops" }, ...S.badDraft.errors.slice(0, 8).map((e) => h("li", null, formatIssue(e, S.base))))));
  }
  if (S.otherTab) kids.push(h("div", { class: "banner warn", role: "alert" }, "Taslak başka bir sekmede değişti. ", btn("Yenile", () => location.reload(), "btn primary")));
  if (S.conflicts.length) kids.push(h("div", { class: "banner warn" }, `Yeniden uygulamada ${S.conflicts.length} işlem çakıştı ve atlandı: `, S.conflicts.slice(0, 5).map((c) => c.op.path).join(", "), btn("Kapat", () => { S.conflicts = []; renderBanner(); })));
  if (!S.store.persistent) kids.push(h("div", { class: "banner warn" }, "Tarayıcı depolaması kullanılamıyor (özel mod?). Taslak yalnızca bu sekmede, bellekte tutulur; çıkmadan önce dışa aktarın."));
  bannerEl.replaceChildren(...kids);
}

function reapplyStale() {
  const d = S.staleDraft;
  const { config, conflicts } = applyOps(S.base, d.ops);
  const m = migrate(config);
  S.working = m.config;
  S.notes = cleanNotes(d.notes);
  S.conflicts = conflicts;
  S.staleDraft = null;
  S.savedOps = [];
  renderAll();
  afterChange();
}

// ------------------------------------------------------------------ koleksiyon paneli (liste + ayrıntı)
function listSwatch(coll, it) {
  const c = it.color || (it.look && it.look.robeTop) || it.bg || (it.map && "#d9b3ff") || "#8e44ff";
  return h("i", { class: "sw", style: { background: /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#8e44ff" }, "aria-hidden": "true" });
}

function collectionPanel(coll, o = {}) {
  const spec = F[coll];
  const items = S.working[coll] || {};
  const ids = Object.keys(items);
  if (!ids.includes(S.sel[coll])) S.sel[coll] = ids[0];
  const id = S.sel[coll];
  const meta = COLLECTIONS[coll];
  const select = (x) => { S.sel[coll] = x; renderAll(); };
  const list = h("ul", { class: "ilist", "aria-label": meta.label + " listesi" }, ...ids.map((x) => h("li", null, h("button", { type: "button", class: "ibtn", "aria-current": x === id ? "true" : null, onclick: () => select(x) }, listSwatch(coll, items[x]), h("span", null, String(items[x].name || x), h("small", null, x))))));

  const form = h("form", { class: "newform", hidden: true });
  let mode = "new";
  const idIn = h("input", { type: "text", maxlength: 24, "aria-label": "Yeni kimlik", placeholder: "kimlik_ornek", autocapitalize: "off", spellcheck: "false" });
  const abSel = coll === "abilities" ? h("select", { "aria-label": "Yetenek türü" }, ...abilityChoices(S.working).map((k) => h("option", { value: k }, k))) : null;
  const err = h("div", { class: "fld-msg local", role: "alert" });
  form.append(abSel || idIn, h("button", { class: "btn", type: "submit" }, "Ekle"), btn("Vazgeç", () => { form.hidden = true; }, "btn ghost"), err);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nid = abSel ? abSel.value : idIn.value.trim();
    const r = mode === "dup" ? duplicateItem(S.working, coll, id, nid) : checkNewId(S.working, coll, nid) ? { ok: false, error: checkNewId(S.working, coll, nid) } : addItem(S.working, coll, nid);
    if (!r.ok) { err.textContent = r.error; return; }
    S.sel[coll] = nid;
    ctx.structural();
  });
  const openForm = (m) => { mode = m; form.hidden = false; err.textContent = ""; (abSel || idIn).focus(); };
  const newDisabled = ids.length >= spec.max || (coll === "abilities" && !abilityChoices(S.working).length);
  const actions = h("div", { class: "row-btns" },
    btn("＋ Yeni", () => openForm("new"), "btn", { disabled: newDisabled, title: newDisabled ? "Sınıra ulaşıldı" : "Yeni " + meta.label.toLowerCase() }),
    btn("⧉ Çoğalt", () => openForm("dup"), "btn", { disabled: !id || newDisabled || coll === "abilities" }),
    btn("🗑 Sil", () => { if (confirm(`"${items[id].name || id}" silinsin mi? Bağlı sıra ve başvurular da temizlenir.`)) { removeItem(S.working, coll, id); ctx.structural(); } }, "btn danger", { disabled: !id || ids.length <= spec.min }));

  const aside = h("aside", { class: "master" }, list, actions, form);
  const detail = h("div", { class: "detail" });
  if (id) {
    const slot = h("div", { class: "pslot" });
    const draw = () => { const cur = S.working[coll] && S.working[coll][id]; slot.replaceChildren(previewCard(coll, id, cur, S.working), ...(o.afterPreview ? [o.afterPreview(cur)] : [])); };
    draw();
    ctx.hooks.add(draw);
    const inBase = S.base[coll] && S.base[coll][id];
    const itemChanged = !same(items[id], inBase);
    detail.append(
      h("div", { class: "detail-head" }, h("h3", null, String(items[id].name || id), h("small", null, " · " + id)),
        btn("↶ Bu öğenin değişikliklerini geri al", () => {
          if (!confirm("Bu öğenin tüm değişiklikleri geri alınsın mı?")) return;
          if (inBase) S.working[coll][id] = clone(inBase); else removeItem(S.working, coll, id);
          ctx.structural();
        }, "btn ghost", { disabled: !itemChanged })),
      slot, ...(o.beforeForm ? o.beforeForm(id) : []),
      ...objFields(ctx, spec.item, [coll, id], { depth: 1, open: !!o.open, skip: o.skip, map: o.map }, 1),
      ...(o.afterForm ? o.afterForm(id) : []));
  } else detail.append(h("p", { class: "muted" }, "Henüz öğe yok."));
  return h("div", { class: "md" }, aside, detail);
}

// ------------------------------------------------------------------ sekmeler
function tabKarakterler() {
  const linked = (cid) => { const e = Object.entries(S.working.enemies || {}).filter(([, x]) => x.character === cid).map(([k, x]) => x.name || k); return h("p", { class: "fld-hint" }, e.length ? "Bağlı düşman/boss: " + e.join(", ") : "Bu karaktere bağlı düşman yok (bağ, Düşmanlar sekmesindeki 'Karakter bağı' alanındandır; boss da orada)."); };
  return [
    section("Karakterler", h("p", { class: "muted" }, "Oyuncu, yan karakterler ve boss konuşmacı olarak burada tanımlanır; diyaloglar bu kimlikleri kullanır."), collectionPanel("characters", { afterForm: (id) => [linked(id)] })),
    section("Oyuncu", lookSlot(), field(F.player, ["player"], { open: true })),
  ];
}

function lookSlot() {
  const slot = h("div", { class: "pslot" });
  const draw = () => slot.replaceChildren(lookStrip(S.working.player && S.working.player.look));
  draw();
  ctx.hooks.add(draw);
  return slot;
}

function tabDusmanlar() {
  const total = Object.values(S.working.enemies || {}).reduce((a, e) => a + (+e.hp || 0), 0);
  return [section("Düşmanlar", h("p", { class: "muted" }, `${Object.keys(S.working.enemies || {}).length} düşman · toplam can ${+total.toFixed(1)}. Boss ve şövalye de burada (yapay zekâ türü alanı).`), collectionPanel("enemies"))];
}

function tabBuyuler() {
  const kinds = [["weapons", "Büyüler", "weaponOrder"], ["abilities", "Yetenekler", "abilityOrder"], ["perks", "Perk'ler", "perkOrder"]];
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Tür" }, ...kinds.map(([k, l]) => h("button", { type: "button", class: "btn" + (S.spellKind === k ? " on" : ""), "aria-pressed": String(S.spellKind === k), onclick: () => { S.spellKind = k; renderAll(); } }, l)));
  const [k, l, ord] = kinds.find((x) => x[0] === S.spellKind);
  return [section("Büyüler · Yetenekler · Perk'ler", seg, field(F[ord], [ord]), collectionPanel(k, { open: true }))];
}

function tabBolumler() {
  const mapBox = mapEditor(ctx, { selected: S.sel.levels, onSelect: (id) => { S.sel.levels = id; renderAll(); } });
  const lv = (id) => {
    const q = id ? `&dev=1&level=${encodeURIComponent(id)}` : "";
    return [h("div", { class: "row-btns" }, btn("▶ Bu bölümden başlat", () => openGame(q), "btn primary"), h("span", { class: "fld-hint" }, "Yeni sekmede, kayda yazmadan açılır (taslak son kaydedilmiş hâliyle)."))];
  };
  return [
    section("Harita", mapBox),
    section("Kampanya: sıra ve yollar", field(F.campaign, ["campaign"], { open: true }), field(F.map, ["map"], { open: false })),
    section("Bölümler", collectionPanel("levels", { skip: (sp) => /\/(intro|outro)$/.test(sp), beforeForm: lv, afterForm: () => [h("p", { class: "fld-hint" }, "Giriş/çıkış anlatısı Hikâye sekmesinde düzenlenir.")] })),
  ];
}

function tabHikaye() {
  const S0 = F.strings.fields;
  const out = [section("Açılış ve final", field(S0.opening, ["strings", "opening"]), field(S0.finalTitle, ["strings", "finalTitle"]), field(S0.finalLine, ["strings", "finalLine"]), field(S0.deathLines, ["strings", "deathLines"]))];
  const L = F.levels.item.fields;
  for (const id of S.working.campaign.order || []) {
    const lv = S.working.levels[id];
    if (!lv) continue;
    out.push(section(`${lv.name || id}`, field(L.intro, ["levels", id, "intro"], { label: "Giriş anlatısı" }), field(L.outro, ["levels", id, "outro"], { label: "Çıkış anlatısı" })));
  }
  return out;
}

function tabSes() {
  return [section("Temalar, renkler ve müzik", h("p", { class: "muted" }, "Her tema görünüm (renk, hava, dekor) ve müzik parametrelerini taşır. Sesi dinlemek için 'Taslakla oyna' kullanın (bu sayfada ses motoru yüklenmez)."), collectionPanel("themes"))];
}

function tabGenel() {
  const skip = new Set(["/strings/deathLines", "/strings/opening", "/strings/finalTitle", "/strings/finalLine"]);
  return [
    ...flowPanel(),
    section("Üst bilgi", field(F.meta, ["meta"], { open: true })),
    section("Oyun ayarları", field(F.game, ["game"], { open: true })),
    section("Metinler", h("p", { class: "muted" }, "Açılış, final ve ölüm replikleri Hikâye sekmesinde. {ad} biçimindeki yer tutucular oyun tarafından doldurulur; **kalın** vurgu desteklenir."), field(F.strings, ["strings"], { skip, open: false })),
  ];
}

// ------------------------------------------------------------------ doğrulama sekmesi
function tabDogrulama() {
  const all = [...S.issues.errors, ...S.issues.warnings];
  const e = S.issues.errors.length, w = S.issues.warnings.length;
  let filter = S.filter || "all";
  const listEl = h("ul", { class: "issues" });
  const draw = () => {
    const rows = all.filter((x) => filter === "all" || (filter === "error") === (x.severity === "error"));
    listEl.replaceChildren(...(rows.length ? rows.map((it) => h("li", null, h("button", { type: "button", class: "issue-btn " + it.severity, onclick: () => goto(it.path) }, h("span", { class: "sev" }, it.severity === "error" ? "HATA" : "UYARI"), h("span", { class: "msg" }, it.message), h("small", null, formatIssue(it, S.working).replace(/^\[\w+\] /, "").split(" → ")[0] + "  ·  " + it.code + (it.hint ? " · " + it.hint : ""))))) : [h("li", { class: "muted" }, "Gösterilecek bir şey yok.")]));
  };
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Filtre" }, ...[["all", `Tümü (${all.length})`], ["error", `Hatalar (${e})`], ["warning", `Uyarılar (${w})`]].map(([k, l]) => btn(l, () => { S.filter = filter = k; renderAll(); }, "btn" + (filter === k ? " on" : ""), { "aria-pressed": String(filter === k) })));
  draw();
  const pill = h("div", { class: "health big " + (e ? "bad" : w ? "warn" : "ok"), role: "status" }, e ? `✖ ${e} hata: taslak kaydedilmez, oyun taslağı uygulamaz` : w ? `⚠ ${w} uyarı: oyun çalışır, ama gözden geçirin` : "✔ Konfigürasyon sağlıklı");
  return [section("Doğrulama / sağlık", pill, seg, listEl)];
}

function goto(pointer) {
  const r = routeOf(pointer);
  S.tab = r.tab;
  if (r.coll && r.id) S.sel[r.coll] = r.id;
  if (r.root === "weapons" || r.root === "weaponOrder") S.spellKind = "weapons";
  if (r.root === "abilities" || r.root === "abilityOrder") S.spellKind = "abilities";
  if (r.root === "perks" || r.root === "perkOrder") S.spellKind = "perks";
  renderAll();
  const { f } = nearestField(pointer);
  const el = f ? f.el : panel;
  for (let p = el.parentElement; p && p !== panel; p = p.parentElement) if (p.tagName === "DETAILS") p.open = true;
  if (el.tagName === "DETAILS") el.open = true;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 1800);
  const c = el.querySelector("input,select,textarea,button");
  if (c) c.focus({ preventScroll: true });
}

// ------------------------------------------------------------------ genel: akış, dışa/içe aktarma
function flowPanel() {
  const rows = changeRows(S.base, S.working);
  const e = S.issues.errors.length;
  const guard = (fn) => () => { if (e && !confirm(`${e} doğrulama hatası var; dosya hatalı olabilir. Yine de devam edilsin mi?`)) return; fn(); };
  const pkgOpts = () => ({ base: S.base, working: S.working, notes: S.notes, baseHash: S.baseHash, embedConfig: S.embed, report: validate(S.working, { mode: "strict" }) });
  const copyBox = h("textarea", { rows: 6, readonly: true, hidden: true, "aria-label": "Kopyalanacak metin" });
  const note = h("textarea", { rows: 3, maxlength: 1000, "aria-label": "Genel not", placeholder: "Genel not: bu değişikliklerle ne amaçlandı, Claude'dan ne bekleniyor…" }, S.notes[""] || "");
  note.addEventListener("input", () => ctx.setNote("", note.value));
  const embed = h("input", { type: "checkbox", checked: S.embed, onchange: (ev) => { S.embed = ev.target.checked; } });
  const activeBox = h("input", { type: "checkbox", checked: S.active, onchange: (ev) => { S.active = ev.target.checked; schedule(); } });
  const fileIn = h("input", { type: "file", accept: ".json,application/json", "aria-label": "İçe aktarılacak dosya" });
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files && fileIn.files[0];
    if (!f) return;
    if (f.size > 1024 * 1024) { S.importResult = { ok: false, message: "Dosya çok büyük (en çok 1 MB)", errors: [] }; renderPanel(); return; }
    S.importResult = readImport(await f.text(), S.base);
    S.importFile = f.name;
    renderPanel();
  });
  const imp = S.importResult;
  const impBox = imp ? h("div", { class: "import-result " + (imp.ok ? "ok" : "bad"), role: "status" },
    h("strong", null, imp.ok ? `✔ ${S.importFile || "Dosya"} geçerli (${imp.kind === "patch" ? "yama" : "tam konfigürasyon"})` : "✖ " + (imp.message || "İçe aktarılamadı")),
    ...(imp.errors || []).slice(0, 10).map((x) => h("div", { class: "issue error" }, formatIssue(x, S.base))),
    imp.ok && imp.staleBase ? h("div", { class: "issue warning" }, "Yama farklı bir repo sürümü için üretilmiş; olmayan yollar atlandı.") : null,
    ...(imp.conflicts || []).slice(0, 5).map((c) => h("div", { class: "issue warning" }, "Atlanan işlem: " + c.op.path + " — " + c.reason)),
    imp.ok ? h("div", null, h("p", { class: "muted" }, `Repo tabanına göre ${changeRows(S.base, imp.working).length} fark:`), changeTable(changeRows(S.base, imp.working), false),
      btn("Taslağa uygula", () => {
        if (rows.length && !confirm("Mevcut taslağınızın üzerine yazılacak. Devam edilsin mi?")) return;
        S.working = imp.working;
        if (imp.notes) { S.notes = imp.notes; }
        S.importResult = null;
        renderAll();
        afterChangeNow();
        toast("İçe aktarılan veri taslağa uygulandı.");
      }, "btn primary")) : null) : null;

  return [
    h("section", { class: "card", id: "akis" }, h("h2", null, "Taslak, dışa aktarma ve içe aktarma"),
      h("div", { class: "flow" }, h("ol", null,
        h("li", null, h("strong", null, "Düzenle: "), "sekmelerde değişiklik yapın; taslak otomatik bu tarayıcıya kaydedilir."),
        h("li", null, h("strong", null, "Dene: "), "‘Taslakla oyna’ oyunu yeni sekmede taslakla açar (bölüm formunda ‘Bu bölümden başlat’ da var)."),
        h("li", null, h("strong", null, "İndir: "), "tam ", h("code", null, "game.config.json"), " dosyasını, yamayı ya da Claude paketini indirin."),
        h("li", null, h("strong", null, "Uygula: "), "dosyayı repoda ", h("code", null, "data/game.config.json"), " yerine koyun (", h("code", null, "npm run validate"), ") ", h("em", null, "ya da"), " Claude paketini Claude'a verin; o doğrulayıp işler. Kod gerektiren istekler paketin ayrı bölümünde gider.")),
      h("p", { class: "muted" }, "Bu sayfa repoya yazmaz. Taslak yalnız bu tarayıcıya ve bu adrese aittir (localhost ile github.io taslakları ayrıdır). Repo dosyası değişince taslak ‘eski’ olur ve yeni tabana yeniden uygulanabilir.")),
      h("p", { class: "meta-line" }, `Şema sürümü 1 · repo özeti `, h("code", null, S.baseHash), ` · taslak özeti `, h("code", null, configHash(S.working))),
      h("label", { class: "chk" }, activeBox, " Taslak oyunda kullanılsın (kapalıysa ‘Taslakla oyna’ repo varsayılanını açar)"),
      h("h3", null, "Dışa aktar"),
      h("div", { class: "row-btns" },
        btn("⬇ Tam game.config.json", guard(() => download("game.config.json", formatConfig(S.working), "application/json"))),
        btn("⬇ Değişiklik yaması", () => download("degisiklikler.json", exportPatch(buildDraft({ base: S.base, working: S.working, notes: S.notes, baseHash: S.baseHash, active: S.active, rev: S.rev })), "application/json")),
        btn("⬇ Claude paketi (.md)", () => download(`claude-yonlendirme-${today()}.md`, buildClaudePackage(pkgOpts()), "text/markdown")),
        btn("⧉ Claude paketini kopyala", async () => {
          const t = buildClaudePackage(pkgOpts());
          try { await navigator.clipboard.writeText(t); toast("Claude paketi panoya kopyalandı."); } catch (e) { copyBox.value = t; copyBox.hidden = false; copyBox.select(); toast("Otomatik kopyalanamadı; metni elle kopyalayın."); }
        })),
      h("label", { class: "chk" }, embed, " Claude paketine tam konfigürasyonu da göm"), copyBox,
      h("label", { class: "fld-l", for: "gnote" }, "Genel not (Claude paketine girer)"), Object.assign(note, { id: "gnote" }),
      h("h3", null, "İçe aktar"),
      h("p", { class: "muted" }, "Tam konfigürasyon (.json) ya da değişiklik yaması seçin; doğrulanır, farkı gösterilir, onayınızla taslağa uygulanır. Repoya değil taslağa gider."), fileIn, impBox,
      h("h3", null, "Sıfırla"),
      h("div", { class: "row-btns" }, btn("🗑 Tüm taslağı sil", () => {
        if (!confirm("Tüm taslak (değişiklikler ve notlar) silinsin mi? Bu geri alınamaz. Kayıt dosyanıza dokunulmaz.")) return;
        clearDraft(S.store); S.working = clone(S.base); S.notes = {}; S.savedOps = []; S.rev = 0; renderAll(); afterChangeNow();
      }, "btn danger", { disabled: !rows.length && !Object.keys(S.notes).length })),
      h("h3", null, `Değişiklikler (${rows.length})`), rows.length ? changeTable(rows, true) : h("p", { class: "muted" }, "Repo varsayılanından fark yok.")),
  ];
}

function changeTable(rows, revertible) {
  return h("div", { class: "tablewrap" }, h("table", { class: "chg" }, h("thead", null, h("tr", null, ...["Alan", "Durum", "Eski", "Yeni", ""].map((t) => h("th", { scope: "col" }, t)))),
    h("tbody", null, ...rows.slice(0, 200).map((r) => h("tr", null,
      h("td", null, revertible ? btn(r.label, () => goto(r.path), "link") : r.label, h("small", null, r.path)),
      h("td", null, r.kind), h("td", null, h("code", null, shortValue(r.old, 60))), h("td", null, h("code", null, shortValue(r.new, 60))),
      h("td", null, revertible ? btn("↶", () => { if (!confirm("Bu değişiklik geri alınsın mı?")) return; setAt(S.working, r.path, clone(getAt(S.base, r.path))); ctx.structural(); }, "mini", { "aria-label": "Geri al: " + r.label, title: "Geri al" }) : null))))));
}

// ------------------------------------------------------------------ açılış
function fatal(title, lines) {
  $app.replaceChildren(h("div", { class: "card fatal", role: "alert" }, h("h2", null, title), ...lines.map((l) => h("p", null, l)), h("a", { class: "btn", href: "./index.html" }, "← Oyuna dön")));
}

function showError(msg) {
  const el = document.getElementById("errlog") || h("div", { id: "errlog", class: "banner bad", role: "alert" });
  el.textContent = "Beklenmeyen hata: " + msg;
  if (!el.isConnected) document.body.prepend(el);
}
window.addEventListener("error", (e) => showError(e.message || "bilinmiyor"));
window.addEventListener("unhandledrejection", (e) => showError(String((e.reason && e.reason.message) || e.reason)));

export async function boot() {
  if (location.protocol === "file:") { fatal("Sunucu gerekli", [FILE_PROTOCOL_MESSAGE]); return; }
  let text;
  try { const res = await fetch(defaultConfigUrl(), { cache: "no-cache" }); if (!res.ok) throw new Error("HTTP " + res.status); text = await res.text(); } catch (e) { fatal("Repo yapılandırması yüklenemedi", [String(e.message || e)]); return; }
  const c = parseAndCheck(text);
  if (!c.ok) { fatal("Repo yapılandırması geçersiz", [c.message, ...c.errors.slice(0, 10).map((x) => formatIssue(x, null))]); return; }
  S.store = makeStore();
  S.base = c.base;
  S.baseHash = configHash(c.base);
  S.working = clone(c.base);
  const rd = readDraft(S.store);
  const d = rd.draft;
  if (d) {
    S.active = d.active !== false;
    S.rev = Number.isInteger(d.rev) ? d.rev : 0;
    S.notes = cleanNotes(d.notes);
    ctx.notes = S.notes;
    S.savedOps = d.ops;
    if (d.baseHash !== S.baseHash) S.staleDraft = d;
    else {
      const m = migrate(applyOps(S.base, d.ops).config);
      const v = validate(m.config, { mode: "strict" });
      if (v.ok) S.working = m.config; else S.badDraft = { draft: d, errors: v.errors, raw: m.config };
    }
  }
  window.addEventListener("storage", (e) => { if (e.key === DRAFT_KEY) { const x = readDraft(S.store).draft; if (!x || x.rev !== S.rev) { S.otherTab = true; renderBanner(); } } });
  window.addEventListener("beforeunload", (e) => { if (S.issues.errors.length && !same(S.working, S.base)) { e.preventDefault(); e.returnValue = ""; } });
  build();
  const start = location.hash.startsWith("#/") ? location.hash.slice(1) : null;
  afterChangeNow();
  renderAll();
  if (start) goto(start);
}
