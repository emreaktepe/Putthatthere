// Marka bileşenleri: amblem, HEXORA yazı logosu, kıvılcım katmanı ve ilk açılış karşılaması. Yalnızca DOM API.
import { GAME } from "../core/data.js";
import { h, svg } from "../core/dom.js";
import { sfx } from "../audio/engine.js";
import { readQuality } from "../core/quality.js";
import { artBg } from "./art.js";
import { BRAND, ENTER_MAX_STEPS, SPLASH_KEY, enterDelay, sparkCount, splashModel, wordmarkSpec } from "./brandmodel.js";
import { reducedMotion } from "./screens.js";

export function emblemImg(cls = "", big = false) {
  const img = h("img", { class: "emblem-img " + cls, src: big ? BRAND.emblem512 : BRAND.emblem256, alt: "", decoding: "async", draggable: "false", "aria-hidden": "true" });
  img.addEventListener("error", () => img.remove());
  return img;
}

// HEXORA yazı logosu: kodda üretilen inline SVG (dosya yok; ışık süpürmesi SVG içinde) + "O" içindeki elmasta nabız ışığı
let wmSeq = 0;
const toNode = (n) => (typeof n === "string" ? n : svg(n.tag, n.attrs, ...n.children.map(toNode)));
export function wordmark(cls = "") {
  return h("span", { class: "wordmark " + cls },
    toNode(wordmarkSpec("wm" + ++wmSeq)),
    h("i", { class: "wm-gem", "aria-hidden": "true", style: { left: BRAND.gem.x.toFixed(2) + "%", top: BRAND.gem.y.toFixed(2) + "%" } }));
}

// dört köşeli minik yıldız (parıltı)
export const sparkle = (cls = "") => h("i", { class: "sparkle " + cls, "aria-hidden": "true" });

// yavaş dönen ince rün halkası
function runeRing() {
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r1 = i % 3 === 0 ? 43 : 46, r2 = 50;
    ticks.push(svg("path", { d: `M${(60 + Math.cos(a) * r1).toFixed(2)} ${(60 + Math.sin(a) * r1).toFixed(2)}L${(60 + Math.cos(a) * r2).toFixed(2)} ${(60 + Math.sin(a) * r2).toFixed(2)}`, "stroke-width": i % 3 === 0 ? 1.6 : 0.9 }));
  }
  return svg("svg", { viewBox: "0 0 120 120", class: "rune-ring", "aria-hidden": "true", fill: "none", stroke: BRAND.colors.gold, "stroke-linecap": "round" },
    svg("circle", { cx: 60, cy: 60, r: 57, "stroke-width": 0.8, opacity: 0.8, "stroke-dasharray": "1 5" }), svg("circle", { cx: 60, cy: 60, r: 41, "stroke-width": 0.7, opacity: 0.5 }), ...ticks);
}

// menü marka alanı için kıvılcım/kül katmanı (CSS animasyonu; sayı sınırlı)
export function sparks(base = 16) {
  const landscapeSmall = matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
  const low = readQuality(globalThis.localStorage) === "low";
  const n = sparkCount({ base, reduced: reducedMotion(), landscapeSmall, low });
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push(h("i", { style: { "--x": (4 + Math.random() * 92).toFixed(1) + "%", "--s": (2 + Math.random() * 3).toFixed(1) + "px", "--t": (6 + Math.random() * 7).toFixed(1) + "s", "--d": (-Math.random() * 12).toFixed(1) + "s", "--dx": (Math.random() * 40 - 20).toFixed(0) + "px" } }));
  }
  return h("div", { class: "brand-sparks", "aria-hidden": "true" }, ...items);
}

// menüye yumuşak geçiş: öğeler 50 ms aralıkla sırayla belirir
export function staggerEnter(menuNode) {
  const els = menuNode.querySelectorAll(".brand > *, .menu-stats, .notice, .menu-btns > *, .continue-card, .menu-foot");
  els.forEach((el, i) => el.style.setProperty("--enter", enterDelay(Math.min(i, ENTER_MAX_STEPS)) + "ms"));
  menuNode.classList.add("entering");
}

let splashEl = null;
// Oturumda ilk açılışta tam ekran karşılama. Otomatik geçmez: dokunma/tık/tuş ses motorunu açan kullanıcı hareketidir
// (ses motoru kendi pointerdown/keydown yakalayıcılarıyla zaten başlar; burada yalnızca menüye geçiş yapılır).
export function maybeSplash() {
  let seen = false;
  try { seen = !!sessionStorage.getItem(SPLASH_KEY); } catch (e) { /* özel mod */ }
  const m = splashModel({ seen, reduced: reducedMotion(), params: new URLSearchParams(location.search) });
  if (!m.show || splashEl) return false;
  try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch (e) { /* özel mod */ }
  const coarse = matchMedia("(pointer: coarse)").matches;
  const hint = coarse ? "Başlamak için dokun" : "Başlamak için tıkla";
  const bg = artBg(GAME.menuBackground, "splash-art");
  const stage = document.getElementById("stage");
  const el = h("div", { id: "splash", class: m.still ? "still" : "", role: "button", tabindex: "0", "aria-label": `${BRAND.full}. ${hint}` },
    bg, h("div", { class: "splash-shade", "aria-hidden": "true" }),
    sparks(14),
    h("div", { class: "splash-center" },
      h("div", { class: "splash-emblem", "aria-hidden": "true" },
        h("i", { class: "halo" }), runeRing(), emblemImg("splash-emb", true),
        sparkle("s1"), sparkle("s2"), sparkle("s3")),
      wordmark("splash-wm"),
      h("p", { class: "splash-kicker" }, BRAND.kicker),
      h("p", { class: "splash-sub" }, BRAND.sub)),
    h("p", { class: "splash-hint" }, hint));
  splashEl = el;
  document.body.appendChild(el);
  if (stage) stage.inert = true; // menü arkada hazır; karşılama açıkken odak/Enter menü düğmelerine ulaşmasın
  let done = false;
  const finish = (e) => {
    if (done) return;
    if (e && e.type === "keydown" && (e.metaKey || e.ctrlKey || e.altKey || ["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key))) return;
    done = true;
    if (e) { e.preventDefault(); e.stopPropagation(); }
    removeEventListener("keydown", finish, true);
    sfx("click");
    if (stage) {
      stage.inert = false;
      const menu = stage.querySelector(".menu");
      if (menu) staggerEnter(menu);
      const first = stage.querySelector("[data-autofocus]");
      if (first) first.focus({ preventScroll: true });
    }
    el.classList.add("leaving");
    setTimeout(() => { el.remove(); splashEl = null; }, m.still ? 30 : 700);
  };
  el.addEventListener("click", finish);
  addEventListener("keydown", finish, true);
  el.focus({ preventScroll: true });
  return true;
}
