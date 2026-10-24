// Harita ekranı: satır içi SVG, noktalı yollarla bağlı düğümler (kilitli / açık / tamamlandı), düğüme dokununca bölüm kartı.
// Durum türetmesi ve çizim modeli js/game/progress.js'te (saf, testli); burada yalnızca çizim ve etkileşim vardır.
import { ENEMY_NAMES, LEVELS, LEVEL_IDS, MAP, TOTEM_ID, WEAPONS } from "../core/data.js";
import { h, svg } from "../core/dom.js";
import { edges } from "../game/campaign.js";
import { buildMapGraph, mapPoints } from "../game/progress.js";
import { artBg, artOr, artPath, pickArt } from "./art.js";
import { icon, ICON_PATHS } from "./icons.js";
import { ambient } from "./menu.js";
import { coverImg, foeBadge } from "./result.js";
import { button, mount, scope } from "./screens.js";
import { UI, objectiveText } from "./text.js";

const STATE_LABEL = { completed: UI.map.done, available: UI.map.open, locked: UI.map.locked };

function foeList(L) {
  const ids = new Set(Object.keys(L.start));
  L.spawn.forEach((w) => Object.keys(w).forEach((k) => ids.add(k)));
  if (L.objective === "totem" && TOTEM_ID) ids.add(TOTEM_ID);
  return [...ids].filter((k) => ENEMY_NAMES[k]);
}

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
  const header = h("header", { class: "map-head glass" },
    button(UI.map.back, opts.onBack, { kind: "ghost", ic: "back", aria: "Ana menüye dön" }),
    h("h2", null, UI.map.title),
    h("div", { class: "map-stats" }, h("span", { class: "chip" }, icon("check"), `${done}/${LEVEL_IDS.length}`), h("span", { class: "chip" }, icon("star"), String(opts.best.score || 0))));
  const artSrc = artPath(MAP && MAP.background && MAP.background.image);
  const fill = artBg(MAP && MAP.background && MAP.background.image, "map-fill"); // her yerleşimde arkada koyu/bulanık zemin
  const scroller = h("div", { class: "map-scroll" });
  const sheet = h("aside", { class: "level-sheet glass", hidden: true, "aria-live": "polite" });
  root.append(fill, ambient(26), header, scroller, sheet);
  if (fill) fill.addEventListener("error", () => root.classList.remove("has-art"));
  root.classList.toggle("has-art", !!fill);

  function renderSheet(focus = false) {
    root.classList.toggle("sheet-open", !!selected);
    if (!selected) { sheet.hidden = true; sheet.replaceChildren(); return; }
    const i = LEVEL_IDS.indexOf(selected), L = LEVELS[i], st = opts.statuses[selected], best = opts.best.levels[selected];
    const foes = foeList(L);
    const rw = L.reward ? WEAPONS[L.reward] : null;
    const rewardIcon = rw ? artOr(pickArt(rw, true), document.createTextNode(rw.icon), { cls: "chip-img", size: 22 }) : null;
    const play = st === "locked"
      ? h("p", { class: "lock-note" }, icon("lock"), UI.map.lockedNote)
      : h("div", { class: "btn-row" }, button(st === "completed" ? UI.map.practice : UI.map.play, () => opts.onPlay(selected, st === "completed"), { ic: "play", autofocus: true, small: st === "completed" ? UI.map.practiceNote : "" }));
    sheet.hidden = false;
    sheet.className = "level-sheet glass st-" + st;
    sheet.replaceChildren(
      h("div", { class: "sheet-top" },
        h("div", null, h("small", { class: "eyebrow" }, `${i + 1}/${LEVELS.length} · ${STATE_LABEL[st]}`), h("h3", null, L.name)),
        h("button", { class: "x-btn", type: "button", "aria-label": UI.map.close, onclick: () => select(null) }, "×")),
      coverImg(L),
      h("p", { class: "sheet-obj" }, icon("target"), objectiveText(L)),
      h("div", { class: "sheet-meta" },
        h("span", { class: "chip" }, icon("hourglass"), `${L.time} ${UI.map.sec}`),
        rewardIcon ? h("span", { class: "chip", title: UI.map.reward }, h("span", { class: "chip-ic", "aria-hidden": "true" }, rewardIcon), WEAPONS[L.reward].name) : null,
        best ? h("span", { class: "chip", title: UI.map.best }, icon("star"), String(best.score)) : null),
      h("ul", { class: "chips", "aria-label": UI.map.foes }, ...foes.map((k) => h("li", { class: "chip", title: ENEMY_NAMES[k] }, foeBadge(k), ENEMY_NAMES[k]))),
      play);
    const f = sheet.querySelector("[data-autofocus]");
    if (f && focus) f.focus({ preventScroll: true });
  }

  function select(id, focus = false) {
    selected = id;
    scroller.querySelectorAll(".node").forEach((n) => n.classList.toggle("sel", n.dataset.id === id));
    renderSheet(focus);
  }

  function draw() {
    const portrait = innerHeight > innerWidth * 1.1;
    const lay = mapPoints(LEVELS, { portrait, viewBox: MAP ? MAP.viewBox : [1000, 700] });
    const R = MAP && MAP.nodeRadius ? MAP.nodeRadius : 38, g = buildMapGraph(LEVEL_IDS, edges(), opts.statuses, lay.pts, lay.useVia);
    const r = portrait ? 30 : R;
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
    for (const n of g.nodes) {
      const L = LEVELS[n.index], st = n.status, big = r + 14;
      const side = portrait ? (n.x < lay.W / 2 ? "right" : "left") : (L.map && L.map.label) || "below";
      const lx = side === "right" ? r + 14 : side === "left" ? -r - 14 : 0, ly = side === "above" ? -r - 16 : side === "below" ? r + 34 : 8;
      const anchor = side === "right" ? "start" : side === "left" ? "end" : "middle";
      const gEl = svg("g", {
        class: "node " + st + (opts.freshId === n.id ? " fresh" : "") + (selected === n.id ? " sel" : ""), "data-id": n.id, transform: `translate(${n.x} ${n.y})`,
        role: "button", tabindex: "0", "aria-label": `Bölüm ${n.index + 1}: ${L.name}, ${STATE_LABEL[st].toLowerCase()}`,
      },
        svg("circle", { class: "halo", r: r + 8 }),
        svg("circle", { class: "disc", r }),
        nodeMedal(n.id, L, r),
        svg("text", { class: "node-ic", "text-anchor": "middle", "dominant-baseline": "central", "font-size": r * 0.95 }, st === "locked" ? "" : (L.map && L.map.icon) || "✦"),
        st === "locked" ? svg("path", { class: "node-lock", d: ICON_PATHS.lock[1], transform: `translate(${-r * 0.5} ${-r * 0.5}) scale(${(r * 1.0) / 24})` }) : null,
        svg("circle", { class: "num-bg", cx: -r * 0.72, cy: -r * 0.72, r: r * 0.38 }),
        svg("text", { class: "num", x: -r * 0.72, y: -r * 0.72, "text-anchor": "middle", "dominant-baseline": "central", "font-size": r * 0.42 }, String(n.index + 1)),
        st === "completed" ? svg("polygon", { class: "node-star", points: starPath(r * 0.72, r * 0.72, r * 0.42) }) : null,
        svg("text", { class: "node-label", x: lx, y: ly, "text-anchor": anchor, "font-size": portrait ? 17 : 24 }, L.name),
        svg("circle", { class: "hit", r: big }));
      gEl.addEventListener("click", () => select(n.id));
      gEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n.id, true); } });
      root3.append(gEl);
    }
    scroller.classList.toggle("tall", portrait);
    scroller.replaceChildren(root3);
    if (portrait) { // seçili/odak düğüm ekranın ortasına gelsin (bölüm 1 altta olduğundan başlangıçta kaydırma gerekir)
      const idx = LEVEL_IDS.indexOf(selected || opts.focusId || LEVEL_IDS.find((id) => opts.statuses[id] === "available") || LEVEL_IDS[0]);
      const y = ((lay.pts[Math.max(idx, 0)].y) / lay.H) * root3.getBoundingClientRect().height;
      scroller.scrollTop = Math.max(y - scroller.clientHeight * 0.35, 0);
    }
  }

  let rt = 0;
  sc.on(window, "resize", () => { clearTimeout(rt); rt = setTimeout(draw, 120); });
  sc.on(window, "keydown", (e) => { if (e.key === "Escape" && selected) select(null); });
  mount(root, sc, { cls: "map-stage" });
  draw();
  renderSheet();
}
