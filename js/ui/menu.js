// Ana menü ve sinematik giriş. Arka plan CSS gradyan + süzülen parçacıklar (DOM sayısı sınırlı), animasyonlar CSS'te.
import { GAME, MAP, STRINGS } from "../core/data.js";
import { h, svg } from "../core/dom.js";
import { $ } from "../core/util.js";
import { QUALITY_LABELS, nextQuality, readQuality, writeQuality } from "../core/quality.js";
import { setWizardQuality } from "../render/wizard.js";
import { artBg, warmArt } from "./art.js";
import { icon, iconIfArt } from "./icons.js";
import { storyLines } from "./models.js";
import { button, confirmButton, mount, reducedMotion, scope } from "./screens.js";
import { UI } from "./text.js";

// yıldız/parçacık katmanı: konumlar ve süreler rastgele ama sayıları sınırlı (mobilde daha az)
export function ambient(n = 34) {
  const small = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
  const count = small ? Math.round(n * 0.6) : n;
  const items = [];
  for (let i = 0; i < count; i++) {
    const kind = i % 5 === 0 ? "orb" : "star";
    items.push(h("i", { class: kind, style: { "--x": (Math.random() * 100).toFixed(1) + "%", "--y": (Math.random() * 100).toFixed(1) + "%", "--s": (kind === "orb" ? 3 + Math.random() * 5 : 1 + Math.random() * 2).toFixed(1) + "px", "--t": (4 + Math.random() * 8).toFixed(1) + "s", "--d": (-Math.random() * 10).toFixed(1) + "s" } }));
  }
  return h("div", { class: "ambient", "aria-hidden": "true" }, ...items);
}

// amblem: hilal ay + yıldız (satır içi SVG)
function emblem() {
  return svg("svg", { viewBox: "0 0 120 120", class: "emblem", "aria-hidden": "true" },
    svg("defs", null, svg("linearGradient", { id: "emb-g", x1: "0", y1: "0", x2: "1", y2: "1" }, svg("stop", { offset: "0", "stop-color": "#ffe9a8" }), svg("stop", { offset: "1", "stop-color": "#b07bff" }))),
    svg("circle", { cx: 60, cy: 60, r: 54, fill: "none", stroke: "url(#emb-g)", "stroke-width": 2, "stroke-dasharray": "2 7", "stroke-linecap": "round" }),
    svg("path", { d: "M72 22a38 38 0 1 0 22 62A30 30 0 0 1 72 22z", fill: "url(#emb-g)" }),
    svg("path", { d: "M88 30l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z", fill: "#ffe9a8" }));
}

export function showMenu({ hasSave, saveInfo, notice, onContinue, onNew }) {
  const sc = scope();
  const soundOff = () => $("mute").getAttribute("aria-pressed") === "true";
  const sound = button(`${UI.menu.sound}: ${soundOff() ? "Kapalı" : "Açık"}`, () => { $("mute").click(); sound.querySelector(".gbtn-l").textContent = `${UI.menu.sound}: ${soundOff() ? "Kapalı" : "Açık"}`; }, { kind: "ghost", ic: "sound" });
  // Grafik: Otomatik / Yüksek / Düşük (oyuncu tercihi, localStorage); büyücü görseli hemen değişir
  let q = readQuality(globalThis.localStorage);
  const qLabel = () => `${UI.menu.graphics}: ${QUALITY_LABELS[q]}`;
  const gfx = button(qLabel(), () => { q = nextQuality(q); writeQuality(globalThis.localStorage, q); setWizardQuality(q); gfx.querySelector(".gbtn-l").textContent = qLabel(); }, { kind: "ghost", aria: "Grafik kalitesi, değiştirmek için seç" });
  const list = [];
  if (hasSave) list.push(button(UI.menu.continue, onContinue, { ic: "play", small: saveInfo || "", autofocus: true }));
  list.push(hasSave ? confirmButton(UI.menu.newGame, UI.menu.confirmNew, onNew, sc, { kind: "ghost" }) : button(UI.menu.newGame, onNew, { ic: "play", autofocus: true }));
  list.push(sound, gfx);
  const bg = artBg(GAME.menuBackground, "menu-art");
  const node = h("section", { class: "menu" + (bg ? " has-art" : ""), "aria-label": STRINGS.title },
    bg, bg ? h("div", { class: "art-shade", "aria-hidden": "true" }) : null,
    ambient(36),
    h("div", { class: "menu-inner" },
      emblem(),
      h("h1", { class: "logo" }, STRINGS.title),
      h("p", { class: "tagline" }, UI.menu.subtitle),
      notice ? h("p", { class: "notice", role: "status" }, notice) : null,
      h("div", { class: "menu-btns" }, ...list),
      h("details", { class: "how" }, h("summary", null, "Nasıl oynanır?"),
        h("p", null, STRINGS.controlsHelp), h("p", null, "Kamera: V açı değiştir · Z/C döndür · fare tekerleği yakınlaştır · sağ tuşla sürükle (📷)"), h("p", { class: "small" }, STRINGS.mobileHelp)),
      h("a", { class: "admin-link", href: "./admin.html" }, iconIfArt("admin"), "Yönetim")),
    h("footer", { class: "ver" }, `${STRINGS.title} · v${UI.version}`));
  if (bg) bg.addEventListener("error", () => { node.classList.remove("has-art"); const s = node.querySelector(".art-shade"); if (s) s.remove(); });
  mount(node, sc, { cls: "menu-stage" });
  warmArt(MAP && MAP.background && MAP.background.image);
}

// Sinematik giriş: satırlar sırayla belirip kaybolur; Atla / dokunma / Enter / Boşluk / Esc ile geçilir.
export function showIntro(onDone) {
  const sc = scope(), lines = storyLines(STRINGS.opening), STEP = 3.4;
  let done = false;
  const finish = () => { if (done) return; done = true; onDone(); };
  const still = reducedMotion();
  const node = h("section", { class: "intro" + (still ? " still" : ""), "aria-label": STRINGS.title },
    ambient(40),
    h("div", { class: "intro-lines", "aria-live": "polite" }, ...lines.map((t, i) => h("p", { class: "intro-line", style: { "--i": i, "--step": STEP + "s" } }, t))),
    h("button", { class: "skip", type: "button", "data-autofocus": "1" }, icon("skip"), h("span", null, still ? UI.intro.next : UI.intro.skip)));
  node.querySelector(".skip").addEventListener("click", (e) => { e.stopPropagation(); finish(); });
  if (!still) {
    sc.on(node, "click", finish);
    sc.timeout(finish, (lines.length * STEP + 0.8) * 1000);
  }
  sc.on(window, "keydown", (e) => { if (["Enter", "Space", "Escape"].includes(e.code)) { e.preventDefault(); finish(); } });
  mount(node, sc, { cls: "intro-stage" });
}
