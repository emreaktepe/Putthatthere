// Ana menü ve sinematik giriş. Arka plan CSS gradyan + süzülen parçacıklar (DOM sayısı sınırlı), animasyonlar CSS'te.
import { ENEMY_NAMES, GAME, LEVELS, LEVEL_IDS, MAP, STRINGS, TOTEM_ID } from "../core/data.js";
import { fmt, h } from "../core/dom.js";
import { $ } from "../core/util.js";
import { QUALITY_LABELS, nextQuality, readQuality, writeQuality } from "../core/quality.js";
import { setWizardQuality } from "../render/wizard.js";
import { artBg, artOr, warmArt } from "./art.js";
import { emblemImg, sparks, wordmark } from "./brand.js";
import { BRAND } from "./brandmodel.js";
import { icon, iconIfArt } from "./icons.js";
import { careerStats, continueCardModel, storyLines } from "./models.js";
import { button, confirmButton, mount, ornaments, reducedMotion, scope } from "./screens.js";
import { UI, objectiveText } from "./text.js";

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

// devam edilen bölüm kartı: yalnızca bölümün gerçek verisi (kapak, ad, hedef metni, süre, düşman türü sayısı)
function continueCard(m, L) {
  const cover = artOr(m.cover, null, { cls: "cover-img", lazy: false });
  const stat = (ic, label, value) => h("div", { class: "cc-stat" }, icon(ic), h("span", null, h("small", null, label), h("b", null, value)));
  return h("aside", { class: "continue-card panel gold-frame", "aria-label": UI.menu.resumeLevel },
    ornaments(),
    h("div", { class: "cc-top" },
      cover ? h("div", { class: "cc-cover" }, cover) : null,
      h("div", { class: "cc-txt" }, h("small", { class: "badge" }, UI.menu.resumeLevel), h("h2", null, m.name), h("p", null, objectiveText(L)))),
    h("div", { class: "cc-stats" },
      stat("hourglass", UI.map.time, `${m.time} ${UI.map.sec}`),
      stat("skull", UI.map.foes, fmt(UI.menu.kinds, { n: m.foeCount })),
      stat("map", UI.menu.levelShort, `${m.n}/${m.total}`)));
}

// opts: { hasSave, saveInfo, saveName, save, notice, onContinue, onNew, onMap }
export function showMenu({ hasSave, saveInfo, saveName, save, notice, onContinue, onNew, onMap }) {
  const sc = scope();
  const soundOff = () => $("mute").getAttribute("aria-pressed") === "true";
  const soundLabel = () => `${UI.menu.sound}: ${soundOff() ? "Kapalı" : "Açık"}`;
  const sound = button(soundLabel(), () => { $("mute").click(); sound.querySelector(".gbtn-l").textContent = soundLabel(); }, { kind: "mbtn", ic: "sound" });
  // Grafik: Otomatik / Yüksek / Düşük (oyuncu tercihi, localStorage); büyücü görseli hemen değişir
  let q = readQuality(globalThis.localStorage);
  const qLabel = () => `${UI.menu.graphics}: ${QUALITY_LABELS[q]}`;
  const gfx = button(qLabel(), () => { q = nextQuality(q); writeQuality(globalThis.localStorage, q); setWizardQuality(q); gfx.querySelector(".gbtn-l").textContent = qLabel(); }, { kind: "mbtn", ic: "gear", aria: "Grafik kalitesi, değiştirmek için seç" });
  const list = [];
  if (hasSave) list.push(button(UI.menu.continue, onContinue, { kind: "mbtn primary wide", ic: "play", small: saveName ? `${saveName}${saveInfo ? " · " + saveInfo : ""}` : saveInfo || "", autofocus: true }));
  list.push(hasSave ? confirmButton(UI.menu.newGame, UI.menu.confirmNew, onNew, sc, { kind: "mbtn", ic: "spark" }) : button(UI.menu.startGame, onNew, { kind: "mbtn primary wide", ic: "play", autofocus: true }));
  if (hasSave && onMap) list.push(button(UI.menu.map, onMap, { kind: "mbtn", ic: "map" }));
  list.push(sound, gfx);
  const bg = artBg(GAME.menuBackground, "menu-art");
  const stats = careerStats(save, LEVELS.length);
  const idx = save ? LEVEL_IDS.indexOf(save.currentLevel) : -1;
  const card = idx >= 0 ? continueCardModel(LEVELS[idx], { index: idx, total: LEVELS.length, names: ENEMY_NAMES, totemId: TOTEM_ID }) : null;
  const node = h("section", { class: "menu" + (bg ? " has-art" : ""), "aria-label": STRINGS.title },
    bg, bg ? h("div", { class: "art-shade", "aria-hidden": "true" }) : null,
    ambient(36),
    stats ? h("div", { class: "menu-stats", "aria-label": UI.menu.progress },
      h("span", { class: "chip", title: UI.map.completed }, icon("check"), `${stats.done}/${stats.total}`),
      stats.best > 0 ? h("span", { class: "chip", title: UI.map.best }, icon("star"), String(stats.best)) : null) : null,
    h("div", { class: "menu-main" },
      h("div", { class: "brand" },
        h("div", { class: "brand-emblem", "aria-hidden": "true" }, h("i", { class: "halo" }), emblemImg("brand-emb")),
        h("div", { class: "brand-text" }, h("h1", { class: "logo" }, wordmark("menu-wm")), h("p", { class: "brand-sub" }, BRAND.sub), h("p", { class: "tagline" }, UI.menu.subtitle)),
        sparks(16)),
      notice ? h("p", { class: "notice", role: "status" }, notice) : null,
      h("nav", { class: "menu-btns", "aria-label": STRINGS.title }, ...list)),
    card ? continueCard(card, LEVELS[idx]) : null,
    h("footer", { class: "menu-foot" },
      h("span", { class: "ver" }, `${STRINGS.title} · v${UI.version}`),
      h("details", { class: "how" }, h("summary", null, UI.menu.how),
        h("div", { class: "how-body panel" }, h("p", null, STRINGS.controlsHelp), h("p", null, "Kamera: V açı değiştir · Z/C döndür · fare tekerleği yakınlaştır · sağ tuşla sürükle (📷)"), h("p", { class: "small" }, STRINGS.mobileHelp))),
      h("a", { class: "admin-link", href: "./admin.html" }, iconIfArt("admin"), "Yönetim")));
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
