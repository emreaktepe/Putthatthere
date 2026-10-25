// Harita ekranı: satır içi SVG, noktalı yollarla bağlı düğümler (kilitli / açık / tamamlandı), düğüme dokununca bölüm kartı.
// Durum türetmesi ve çizim modeli js/game/progress.js'te (saf, testli); burada yalnızca çizim ve etkileşim vardır.
// Bölüm kartı varsayılan kompakttır (küçük kapak, süre/puan çipleri, tek düğme); "Detay" hedef, düşmanlar ve büyük kapağı açar.
import { ENEMY_NAMES, LEVELS, LEVEL_IDS, MAP, TOTEM_ID, WEAPONS } from "../core/data.js";
import { h, svg } from "../core/dom.js";
import { edges } from "../game/campaign.js";
import { buildMapGraph, mapPoints } from "../game/progress.js";
import { artBg, artOr, artPath, pickArt } from "./art.js";
import { icon, ICON_PATHS } from "./icons.js";
import { ambient } from "./menu.js";
import { foeIdsOf, scrollForNode, sheetLayout, sheetModel } from "./models.js";
import { coverImg, foeBadge } from "./result.js";
import { button, mount, scope } from "./screens.js";
import { UI, objectiveText } from "./text.js";

const STATE_LABEL = { completed: UI.map.done, available: UI.map.open, locked: UI.map.locked };

// arka plan: parşömen yerine gece manzarası; uzak dağ silüetleri (yalnız yatay yerleşimde)
function backdrop(W, H) {
  const mountains = `M0 ${H} L0 ${H * 0.82} L${W * 0.08} ${H * 0.7} L${W * 0.16} ${H * 0.8} L${W * 0.27} ${H * 0.64} L${W * 0.38} ${H * 0.8} L${W * 0.5} ${H * 0.72} L${W * 0.62} ${H * 0.84} L${W * 0.74} ${H * 0.68} L${W * 0.86} ${H * 0.8} L${W * 0.94} ${H * 0.72} L${W} ${H * 0.8} L${W} ${H} Z`;
  return svg("g", { class: "map-bg", "aria-hidden": "true" }, svg("path", { d: mountains, class: "mtn" }));
}

function starPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); }
  return pts.join(" ");
}

// düğüm madalyonu: levels.<id>.nodeImage varsa daire içinde görsel (yüklenince düğüm "has-img" olur ve emoji gizlenir);
// yüklenemezse görsel kaldırılır, mevcut simge kalır
function nodeMedal(id, L, r) {
  const src = artPath(L.nodeImage);
  if (!src) return null;
  const cid = "nclip-" + id;
  const im = svg("image", { class: "node-img", href: src, x: -r, y: -r, width: r * 2, height: r * 2, preserveAspectRatio: "xMidYMid slice", "clip-path": `url(#${cid})`, "aria-hidden": "true" });
  im.addEventListener("load", () => { const g = im.closest(".node"); if (g) g.classList.add("has-img"); });
  im.addEventListener("error", () => im.remove());
  return svg("g", null, svg("clipPath", { id: cid }, svg("circle", { r })), im);
}

// opts: { completed:Set, statuses, best, score, focusId, freshId, onPlay(id, practice), onBack }
export function showMap(opts) {
  const sc = scope();
  let selected = opts.focusId || null;
  const root = h("section", { class: "map-screen", "aria-label": UI.map.title });
  const done = LEVEL_IDS.filter((id) => opts.statuses[id] === "completed").length;
  const header = h("header", { class: "map-head" },
    button(UI.map.back, opts.onBack, { kind: "ghost", ic: "back", aria: "Ana menüye dön" }),
    h("h2", null, UI.map.title),
    h("div", { class: "map-stats" }, h("span", { class: "chip", title: UI.map.completed }, icon("check"), `${done}/${LEVEL_IDS.length}`), opts.best.score > 0 ? h("span", { class: "chip", title: UI.map.best }, icon("star"), String(opts.best.score)) : null));
  const artSrc = artPath(MAP && MAP.background && MAP.background.image);
  const fill = artBg(MAP && MAP.background && MAP.background.image, "map-fill"); // her yerleşimde arkada koyu/bulanık zemin
  const scroller = h("div", { class: "map-scroll" });
  const sheet = h("aside", { class: "level-sheet panel gold-frame", hidden: true, "aria-live": "polite" });
  root.append(fill, ambient(26), header, scroller, sheet);
  if (fill) fill.addEventListener("error", () => root.classList.remove("has-art"));
  root.classList.toggle("has-art", !!fill);

  const isPortrait = () => innerHeight > innerWidth * 1.1;
  let expanded = false;

  function renderSheet(focus = false) {
    root.classList.toggle("sheet-open", !!selected);
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

  // dikey: kart yüksekliği kadar alt boşluk bırakılır ve seçili düğüm kartın üstündeki görünür alanda tutulur
  function layoutSheet() {
    if (!isPortrait()) return;
    scroller.style.setProperty("--sheet-h", (selected ? sheet.offsetHeight : 0) + "px");
    const n = scroller.querySelector(".node.sel .disc");
    if (!selected || !n) return;
    const nr = n.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
    const nodeY = scroller.scrollTop + (nr.top - sr.top) + nr.height / 2;
    scroller.scrollTop = scrollForNode({ nodeY, viewH: scroller.clientHeight, sheetH: sheet.offsetHeight });
  }

  function select(id, focus = false) {
    if (id !== selected) expanded = false;
    selected = id;
    scroller.querySelectorAll(".node").forEach((n) => n.classList.toggle("sel", n.dataset.id === id));
    renderSheet(focus);
    layoutSheet();
  }

  // etiket: cam hap (metin ölçülünce çizilir); düğümün yanında
  function pill(text, x, y, anchor, fs) {
    const t = svg("text", { class: "node-label", x, y, "text-anchor": anchor, "font-size": fs, "dominant-baseline": "central" }, text);
    const rect = svg("rect", { class: "label-pill", rx: fs * 0.8, ry: fs * 0.8 });
    return { g: svg("g", { class: "label" }, rect, t), t, rect, fs };
  }
  function fitPills(pills) {
    for (const p of pills) {
      let bb = null;
      try { bb = p.t.getBBox(); } catch (e) { bb = null; }
      if (!bb || !bb.width) bb = { x: +p.t.getAttribute("x") - p.t.textContent.length * p.fs * 0.28, y: +p.t.getAttribute("y") - p.fs * 0.6, width: p.t.textContent.length * p.fs * 0.56, height: p.fs * 1.2 };
      const px = p.fs * 0.65, py = p.fs * 0.28;
      p.rect.setAttribute("x", bb.x - px); p.rect.setAttribute("y", bb.y - py); p.rect.setAttribute("width", bb.width + px * 2); p.rect.setAttribute("height", bb.height + py * 2);
    }
  }

  function draw() {
    const portrait = innerHeight > innerWidth * 1.1;
    const lay = mapPoints(LEVELS, { portrait, viewBox: MAP ? MAP.viewBox : [1000, 700] });
    // ekrandaki ölçek (görünüm birimi -> piksel): yatayda detay paneli için ayrılan alan düşülür; düğüm ve etiketler küçük ekranda okunur/dokunulur kalsın diye büyütülür
    const panelW = portrait ? 0 : Math.min(Math.max(innerWidth * 0.3, 210), 320) + 16;
    const aw = Math.max(scroller.clientWidth - panelW, 200), ah = Math.max(scroller.clientHeight, 160);
    const scale = portrait ? Math.min(aw / lay.W, 1.2) : Math.min(aw / lay.W, ah / lay.H);
    let dmin = Infinity;
    lay.pts.forEach((p, a) => lay.pts.forEach((q, b) => { if (a < b) dmin = Math.min(dmin, Math.hypot(p.x - q.x, p.y - q.y)); }));
    const R = MAP && MAP.nodeRadius ? MAP.nodeRadius : 38, g = buildMapGraph(LEVEL_IDS, edges(), opts.statuses, lay.pts, lay.useVia);
    const r = portrait ? 30 : Math.min(Math.max(R, 21 / scale), R * 1.5, dmin * 0.42);
    const hitR = Math.min(Math.max(r + 14, 22 / scale), Math.max(dmin / 2, r + 4));
    const fsz = portrait ? 17 : Math.max(22, 12 / scale);
    const root3 = svg("svg", { class: "map-svg" + (portrait ? " tall" : ""), viewBox: `0 0 ${lay.W} ${lay.H}`, preserveAspectRatio: "xMidYMid meet", role: "group", "aria-label": UI.map.title });
    root.classList.toggle("portrait", portrait);
    if (!portrait) {
      if (artSrc) { // görsel viewBox içinde: düğümler her ekran oranında görsele göre aynı yerde kalır; yüklenemezse dağ siluetine dönülür
        const im = svg("image", { class: "map-art", href: artSrc, x: 0, y: 0, width: lay.W, height: lay.H, preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" });
        const bd = backdrop(lay.W, lay.H);
        im.addEventListener("error", () => { im.replaceWith(bd); });
        root3.append(im);
      } else root3.append(backdrop(lay.W, lay.H));
    }
    for (const l of g.links) root3.append(svg("path", { d: l.d, class: "link " + l.state }));
    const pills = [];
    for (const n of g.nodes) {
      const L = LEVELS[n.index], st = n.status;
      const side = portrait ? (n.x < lay.W / 2 ? "right" : "left") : (L.map && L.map.label) || "below";
      const gap = fsz * 0.5;
      const lx = side === "right" ? r + gap + 6 : side === "left" ? -r - gap - 6 : 0, ly = side === "above" ? -r - fsz * 0.9 : side === "below" ? r + fsz * 1.1 : 0;
      const anchor = side === "right" ? "start" : side === "left" ? "end" : "middle";
      const pl = pill(L.name, lx, ly, anchor, fsz);
      pills.push(pl);
      const gEl = svg("g", {
        class: "node " + st + (opts.freshId === n.id ? " fresh" : "") + (selected === n.id ? " sel" : ""), "data-id": n.id, transform: `translate(${n.x} ${n.y})`,
        role: "button", tabindex: "0", "aria-label": `Bölüm ${n.index + 1}: ${L.name}, ${STATE_LABEL[st].toLowerCase()}`,
      },
        svg("circle", { class: "halo", r: r + 8 }),
        svg("circle", { class: "ring", r: r + 4 }),
        svg("circle", { class: "disc", r }),
        nodeMedal(n.id, L, r),
        svg("text", { class: "node-ic", "text-anchor": "middle", "dominant-baseline": "central", "font-size": r * 0.95 }, st === "locked" ? "" : (L.map && L.map.icon) || "✦"),
        svg("circle", { class: "rim", r: r - 1 }),
        st === "locked" ? svg("path", { class: "node-lock", d: ICON_PATHS.lock[1], transform: `translate(${-r * 0.5} ${-r * 0.5}) scale(${(r * 1.0) / 24})` }) : null,
        svg("circle", { class: "num-bg", cx: -r * 0.72, cy: -r * 0.72, r: r * 0.38 }),
        svg("text", { class: "num", x: -r * 0.72, y: -r * 0.72, "text-anchor": "middle", "dominant-baseline": "central", "font-size": r * 0.42 }, String(n.index + 1)),
        st === "completed" ? svg("polygon", { class: "node-star", points: starPath(r * 0.72, r * 0.72, r * 0.44) }) : null,
        pl.g,
        svg("circle", { class: "hit", r: hitR }));
      gEl.addEventListener("click", () => select(n.id));
      gEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n.id, true); } });
      root3.append(gEl);
    }
    scroller.classList.toggle("tall", portrait);
    scroller.replaceChildren(root3);
    fitPills(pills);
    if (portrait) { // seçili/odak düğüm ekranın ortasına gelsin (bölüm 1 altta olduğundan başlangıçta kaydırma gerekir)
      const idx = LEVEL_IDS.indexOf(selected || opts.focusId || LEVEL_IDS.find((id) => opts.statuses[id] === "available") || LEVEL_IDS[0]);
      const y = ((lay.pts[Math.max(idx, 0)].y) / lay.H) * root3.getBoundingClientRect().height;
      const sheetH = selected ? sheet.offsetHeight : 0;
      scroller.style.setProperty("--sheet-h", sheetH + "px");
      scroller.scrollTop = scrollForNode({ nodeY: y, viewH: scroller.clientHeight, sheetH, at: selected ? 0.42 : 0.35 });
    }
  }

  let rt = 0;
  sc.on(window, "resize", () => { clearTimeout(rt); rt = setTimeout(draw, 120); });
  sc.on(window, "keydown", (e) => { if (e.key === "Escape" && selected) select(null); });
  mount(root, sc, { cls: "map-stage" });
  renderSheet();
  draw();
}
