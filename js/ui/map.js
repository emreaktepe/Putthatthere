// Harita ekranı: perde bazlı, en fazla beş duraklı yolculuk; seçim bölüm kartını açar.
// Kilitler kampanyadan, etaplar journey.js'ten gelir; burada çizim ve etkileşim vardır.
// Bölüm kartı varsayılan kompakttır (küçük kapak, süre/puan çipleri, tek düğme); "Detay" hedef, düşmanlar ve büyük kapağı açar.
import { ENEMY_NAMES, LEVELS, LEVEL_IDS, MAP, TOTEM_ID, WEAPONS } from "../core/data.js";
import { h, svg } from "../core/dom.js";
import { journeyPages, journeyPageFor } from "./journey.js";
import { displayStars, starText } from "../game/stars.js";
import { artBg, artOr, artPath, pickArt } from "./art.js";
import { icon } from "./icons.js";
import { ambient } from "./menu.js";
import { foeIdsOf, mapLayout, scrollForNode, sheetLayout, sheetModel } from "./models.js";
import { coverImg, foeBadge } from "./result.js";
import { button, mount, scope } from "./screens.js";
import { UI, objectiveText } from "./text.js";
import { BRAND } from "./brandmodel.js";

const fmtStars = (n) => UI.stars.count.replace("{n}", String(n));
const STATE_LABEL = { completed: UI.map.done, available: UI.map.open, locked: UI.map.locked };

// opts: { completed:Set, statuses, best, score, focusId, freshId, onPlay(id, practice), onBack }
export function showMap(opts) {
  const sc = scope();
  let selected = opts.focusId || null;
  const root = h("section", { class: "map-screen journey-screen", "aria-label": UI.map.title });
  const done = LEVEL_IDS.filter((id) => opts.statuses[id] === "completed").length;
  const header = h("header", { class: "map-head" },
    button(UI.map.back, opts.onBack, { kind: "ghost", ic: "back", aria: "Ana menüye dön" }),
    h("h2", null, h("img", { class: "map-emb", src: BRAND.emblem256, alt: "", width: 28, height: 28, draggable: "false", "aria-hidden": "true" }), UI.map.title),
    h("div", { class: "map-stats" }, h("span", { class: "chip", title: UI.map.completed }, icon("check"), `${done}/${LEVEL_IDS.length}`), opts.best.score > 0 ? h("span", { class: "chip", title: UI.map.best }, icon("star"), String(opts.best.score)) : null));
  const fill = artBg(MAP && MAP.background && MAP.background.image, "map-fill"); // her yerleşimde arkada koyu/bulanık zemin
  const scroller = h("div", { class: "map-scroll" });
  const sheet = h("aside", { class: "level-sheet panel gold-frame", hidden: true, "aria-live": "polite" });
  root.append(fill, ambient(26), header, scroller, sheet);
  if (fill) fill.addEventListener("error", () => root.classList.remove("has-art"));
  root.classList.toggle("has-art", !!fill);

  const isPortrait = () => innerHeight > innerWidth * 1.1;
  let expanded = false;
  let lay0 = mapLayout(innerWidth, innerHeight); // iki sütunda (tablet/geniş) panel sürekli açık ve kapatılamaz; seçim yoksa sıradaki açık bölüm seçilir
  const defaultId = () => opts.freshId || opts.focusId || LEVEL_IDS.find((id) => opts.statuses[id] === "available") || LEVEL_IDS[0];
  const currentId = LEVEL_IDS.find((id) => opts.statuses[id] === "available") || LEVEL_IDS.at(-1);
  const pages = journeyPages(LEVEL_IDS, LEVELS);
  let pageIndex = journeyPageFor(pages, defaultId());
  selected = defaultId();
  // ilk cümle: bölümün giriş metninden (yalnız gerçek veri)
  const teaser = (L) => { const t = L.intro && L.intro[0] && L.intro[0].text; if (!t) return ""; const m = String(t).match(/^.*?[.!?…](?=\s|$)/); return (m ? m[0] : String(t)).trim(); };

  // en iyi yıldız sayısı (tamamlanmış bölümde en az ★1); tamamlanmamışta gösterilmez
  const starsOf = (id, st) => displayStars(opts.best.levels[id], st === "completed");
  const starChip = (id, st) => { const n = starsOf(id, st); return n ? h("span", { class: "chip star-chip", title: UI.stars.title, "aria-label": fmtStars(n) }, starText(n)) : null; };

  function renderSheet(focus = false) {
    root.classList.toggle("sheet-open", !!selected);
    if (selected && lay0.twoCol) return renderRich(focus);
    if (!selected) { sheet.hidden = true; sheet.replaceChildren(); scroller.style.setProperty("--sheet-h", "0px"); return; }
    const i = LEVEL_IDS.indexOf(selected), L = LEVELS[i], st = opts.statuses[selected];
    const foes = foeIdsOf(L, ENEMY_NAMES, TOTEM_ID);
    const rw = L.reward ? WEAPONS[L.reward] : null;
    const m = sheetModel(L, st, opts.best.levels[selected], rw ? { id: L.reward, name: rw.name } : null);
    const lay = sheetLayout({ expanded, canExpand: m.canPlay });
    const rewardIcon = rw ? artOr(pickArt(rw, true), document.createTextNode(rw.icon), { cls: "chip-img", size: 22 }) : null;
    const play = !m.canPlay
      ? h("p", { class: "lock-note" }, icon("lock"), UI.map.lockedNote)
      : h("div", { class: "sheet-act" }, button(m.practice ? UI.map.practice : UI.map.play, () => opts.onPlay(selected, m.practice), { ic: "play", autofocus: true }), m.practice ? h("small", { class: "hint" }, UI.map.practiceNote) : null);
    const more = m.canPlay ? h("button", { class: "chip sheet-more", type: "button", "aria-expanded": String(lay.expanded), onclick: () => { expanded = !expanded; renderSheet(); layoutSheet(); const mb = sheet.querySelector(".sheet-more"); if (mb) mb.focus({ preventScroll: true }); } }, lay.expanded ? UI.map.less : UI.map.detail, h("span", { class: "caret", "aria-hidden": "true" }, lay.expanded ? "▴" : "▾")) : null;
    sheet.hidden = false;
    sheet.className = "level-sheet panel gold-frame st-" + st + (lay.expanded ? " expanded" : "");
    sheet.style.setProperty("--sheet-max", lay.maxPct + "%");
    sheet.setAttribute("aria-label", `${UI.map.title}: ${L.name}`);
    const thumb = coverImg(L);
    if (thumb) thumb.className = "sheet-thumb";
    sheet.replaceChildren(
      h("div", { class: "sheet-top" },
        thumb,
        h("div", { class: "sheet-title" }, h("small", { class: "eyebrow" }, `${i + 1}/${LEVELS.length} · ${STATE_LABEL[st]}`), h("h3", null, L.name)),
        h("button", { class: "x-btn", type: "button", "aria-label": UI.map.close, title: UI.map.close + " (Esc)", onclick: () => select(null) }, "×")),
      h("div", { class: "sheet-row" },
        h("div", { class: "sheet-meta" },
          h("span", { class: "chip", title: UI.map.time }, icon("hourglass"), `${m.time} ${UI.map.sec}`),
          m.best ? h("span", { class: "chip", title: UI.map.best }, icon("star"), String(m.best)) : null,
          starChip(selected, st),
          m.reward ? h("span", { class: "chip", title: UI.map.reward }, h("span", { class: "chip-ic", "aria-hidden": "true" }, rewardIcon), m.reward.name) : null),
        more),
      h("div", { class: "sheet-detail" },
        h("p", { class: "sheet-obj" }, icon("target"), objectiveText(L)),
        h("ul", { class: "chips foe-row", "aria-label": UI.map.foes }, ...foes.map((k) => h("li", { class: "chip", title: ENEMY_NAMES[k] }, foeBadge(k), ENEMY_NAMES[k]))),
        coverImg(L)),
      play);
    const f = sheet.querySelector("[data-autofocus]");
    if (f && focus) f.focus({ preventScroll: true });
  }

  // iki sütunlu (tablet/geniş) panel: büyük kapak, büyük başlık, hedef kutusu, çipler, düşmanlar, kısa anlatı; eylem altta sabit
  function renderRich(focus) {
    const i = LEVEL_IDS.indexOf(selected), L = LEVELS[i], st = opts.statuses[selected];
    const foes = foeIdsOf(L, ENEMY_NAMES, TOTEM_ID);
    const rw = L.reward ? WEAPONS[L.reward] : null;
    const m = sheetModel(L, st, opts.best.levels[selected], rw ? { id: L.reward, name: rw.name } : null);
    const rewardIcon = rw ? artOr(pickArt(rw, true), document.createTextNode(rw.icon), { cls: "chip-img", size: 28 }) : null;
    const play = !m.canPlay
      ? h("p", { class: "lock-note" }, icon("lock"), UI.map.lockedNote)
      : h("div", { class: "sheet-act" }, button(m.practice ? UI.map.practice : UI.map.play, () => opts.onPlay(selected, m.practice), { ic: "play", autofocus: true }), m.practice ? h("small", { class: "hint" }, UI.map.practiceNote) : null);
    const tz = teaser(L);
    sheet.hidden = false;
    sheet.className = "level-sheet rich panel gold-frame st-" + st;
    sheet.style.removeProperty("--sheet-max");
    sheet.setAttribute("aria-label", `${UI.map.title}: ${L.name}`);
    sheet.replaceChildren(
      h("div", { class: "sheet-body" },
        coverImg(L),
        h("div", { class: "sheet-title" }, h("small", { class: "eyebrow" }, `${L.world ? L.world + " · " : ""}${i + 1}/${LEVELS.length} · ${STATE_LABEL[st]}`), h("h3", null, L.name)),
        h("div", { class: "sheet-meta" },
          h("span", { class: "chip", title: UI.map.time }, icon("hourglass"), `${m.time} ${UI.map.sec}`),
          m.best ? h("span", { class: "chip", title: UI.map.best }, icon("star"), String(m.best)) : null,
          starChip(selected, st)),
        h("p", { class: "sheet-obj" }, icon("target"), h("span", null, h("small", null, UI.map.goal), objectiveText(L))),
        m.reward ? h("div", { class: "sheet-reward", title: UI.map.reward }, h("span", { class: "chip-ic", "aria-hidden": "true" }, rewardIcon), h("span", { class: "rw-txt" }, h("small", null, UI.map.reward), h("b", null, m.reward.name)), rw && rw.key ? h("kbd", { class: "rw-key" }, String(rw.key)) : null) : null,
        h("div", { class: "sheet-foes" }, h("small", null, UI.map.foes), h("ul", { class: "chips foe-row", "aria-label": UI.map.foes }, ...foes.map((k) => h("li", { class: "chip", title: ENEMY_NAMES[k] }, foeBadge(k), ENEMY_NAMES[k])))),
        tz ? h("p", { class: "sheet-tease" }, tz) : null),
      play);
    const f = sheet.querySelector("[data-autofocus]");
    if (f && focus) f.focus({ preventScroll: true });
  }

  // dikey: kart yüksekliği kadar alt boşluk bırakılır ve seçili düğüm kartın üstündeki görünür alanda tutulur
  function layoutSheet() {
    if (!isPortrait()) return;
    scroller.style.setProperty("--sheet-h", (selected ? sheet.offsetHeight : 0) + "px");
    const n = scroller.querySelector(".journey-stop.sel");
    if (!selected || !n) return;
    const nr = n.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
    const visibleBottom = Math.min(sr.bottom, sheet.getBoundingClientRect().top);
    if (nr.top >= sr.top + 8 && nr.bottom <= visibleBottom - 8) return;
    const nodeY = scroller.scrollTop + (nr.top - sr.top) + nr.height / 2;
    scroller.scrollTop = scrollForNode({ nodeY, viewH: scroller.clientHeight, sheetH: sheet.offsetHeight });
  }

  function select(id, focus = false) {
    if (!id && lay0.twoCol) return;
    if (id !== selected) expanded = false;
    selected = id;
    scroller.querySelectorAll(".journey-stop").forEach((n) => {
      n.classList.toggle("sel", n.dataset.id === id);
      n.setAttribute("aria-pressed", String(n.dataset.id === id));
    });
    renderSheet(focus);
    layoutSheet();
  }

  function goPage(index, focusId) {
    pageIndex = Math.max(0, Math.min(pages.length - 1, index));
    selected = focusId || pages[pageIndex].ids.find((id) => opts.statuses[id] === "available") || pages[pageIndex].ids[0];
    expanded = false;
    draw();
    scroller.querySelector(".journey-stop.sel")?.focus({ preventScroll: true });
  }

  function draw() {
    lay0 = mapLayout(innerWidth, innerHeight);
    const portrait = lay0.mode === "portrait";
    root.classList.toggle("two-col", lay0.twoCol);
    root.classList.toggle("lp", lay0.mode === "landscape-phone");
    root.classList.toggle("portrait", portrait);
    root.style.setProperty("--panel-w", lay0.panelW + "px");
    if (lay0.twoCol && !selected) selected = pages[pageIndex].ids[0];
    const page = pages[pageIndex];
    const pageDone = page.ids.filter((id) => opts.statuses[id] === "completed").length;
    const nav = h("nav", { class: "journey-nav", "aria-label": "Yolculuk etapları" },
      h("button", { type: "button", disabled: pageIndex === 0, onclick: () => goPage(pageIndex - 1) }, "← Önceki"),
      h("span", { class: "journey-page-count", "aria-live": "polite" }, `Etap ${pageIndex + 1} / ${pages.length}`),
      h("button", { type: "button", disabled: pageIndex === pages.length - 1, onclick: () => goPage(pageIndex + 1) }, "Sonraki →"));
    const hero = h("header", { class: "journey-heading" },
      h("small", { class: "eyebrow" }, page.world),
      h("h3", null, "Şafağa giden yol"),
      h("p", null, `Bölüm ${page.start + 1}-${page.start + page.ids.length} · ${pageDone}/${page.ids.length} tamamlandı`),
      h("button", { class: "journey-current", type: "button", onclick: () => goPage(journeyPageFor(pages, currentId), currentId) }, "Kaldığım yere git ↗"));
    const route = h("ol", { class: "journey-route", "aria-label": "Bölüm rotası" });
    page.ids.forEach((id, index) => {
      const i = LEVEL_IDS.indexOf(id), L = LEVELS[i], st = opts.statuses[id];
      const n = starsOf(id, st), src = artPath(L.nodeImage || L.image);
      const status = id === currentId && st === "available" ? "Sıradaki bölüm" : STATE_LABEL[st];
      const fallback = () => h("span", { class: "journey-thumb journey-fallback", "aria-hidden": "true" }, "✦");
      const thumb = src ? h("img", { src, alt: "", class: "journey-thumb", draggable: "false", onerror: (e) => { e.currentTarget.replaceWith(fallback()); } }) : fallback();
      const stop = h("button", {
        type: "button", class: `journey-stop ${st}${selected === id ? " sel" : ""}${id === opts.freshId ? " fresh" : ""}`,
        "data-id": id, "aria-pressed": String(selected === id),
        "aria-label": `Bölüm ${i + 1}: ${L.name}, ${status}${n ? ", " + fmtStars(n) : ""}`,
        onclick: () => select(id),
      }, h("span", { class: "journey-number", "aria-hidden": "true" }, String(i + 1).padStart(2, "0")),
        thumb,
        h("span", { class: "journey-copy" }, h("small", null, status), h("strong", null, L.name)),
        h("span", { class: "journey-mark", "aria-hidden": "true" }, st === "locked" ? icon("lock") : n ? starText(n) : "→"));
      route.append(h("li", { class: st, style: { "--step": index } }, stop));
    });
    const end = h("p", { class: "journey-end" }, pageIndex === pages.length - 1 ? "Yolun sonunda: şafak." : "Yolculuk bir sonraki etapta devam ediyor.");
    scroller.classList.toggle("tall", portrait);
    const scene = h("div", { class: "journey-scene" },
      artBg(MAP?.background?.image, "journey-art"),
      h("div", { class: "journey-shade", "aria-hidden": "true" }), route);
    scroller.replaceChildren(h("div", { class: "journey-wrap" }, hero, nav, scene, end));
    // Yol, ekranda kullanılan düğüm merkezlerinden hesaplanır; hiçbir etiketin içinden geçmez.
    const width = route.clientWidth;
    const pathLayer = svg("svg", { class: "journey-path", viewBox: `0 0 ${width} ${page.ids.length * 112}`, "aria-hidden": "true" });
    for (let j = 0; j < page.ids.length - 1; j++) {
      const x1 = width * (j % 2 ? .26 : .08) + 30;
      const x2 = width * (j % 2 ? .08 : .26) + 30;
      const y1 = j * 112 + 78, y2 = (j + 1) * 112 + 18;
      pathLayer.append(svg("path", { d: `M${x1} ${y1} C${x1} ${y1 + 28} ${x2} ${y2 - 28} ${x2} ${y2}`, class: opts.statuses[page.ids[j]] === "completed" ? "done" : "" }));
    }
    scene.insertBefore(pathLayer, route);
    renderSheet();
    scroller.scrollTop = 0;
    layoutSheet();
  }

  let rt = 0;
  sc.on(window, "resize", () => { clearTimeout(rt); rt = setTimeout(draw, 120); });
  sc.on(window, "keydown", (e) => { if (e.key === "Escape" && selected && !lay0.twoCol) select(null); });
  mount(root, sc, { cls: "map-stage" });
  renderSheet();
  draw();
}
