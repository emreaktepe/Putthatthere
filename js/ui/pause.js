// Duraklatma: Durdur düğmesi, Esc/P tuşu ve sekme gizlenince otomatik. Durum makinesi models.js `pauseReduce` (saf, testli).
// Duraklatınca: RT.paused (loop.js oyun saatini dondurur: dt=0, bekleme/süre/düşman/mermi ilerlemez), girdi bırakılır, kart açılır.
// Ses motoruna dokunulmaz: müzik çalmaya devam eder (Ses düğmesiyle kapatılabilir); sekme gizlenince motor zaten kendini askıya alır.
// "Haritaya dön" iki aşamalıdır (onay kartı); bölüm başındaki durum geri yüklenir (flow.quitToMap).
import { sfx } from "../audio/engine.js";
import { h } from "../core/dom.js";
import { RT } from "../core/state.js";
import { $ } from "../core/util.js";
import { quitToMap } from "../game/flow.js";
import { currentPreset, cyclePreset } from "../render/camera.js";
import { releaseInput } from "../game/input.js";
import { icon } from "./icons.js";
import { isPaused, pauseReduce } from "./models.js";
import { UI } from "./text.js";
import { BRAND } from "./brandmodel.js";

const T = UI.hud;
let state = "play";
let card = null, pauseView = null, leaveView = null, soundBtn = null, camBtn = null, resumeBtn = null, cancelBtn = null, lastFocus = null;

const muteBtn = () => $("mute");
const camLabel = () => `${T.camera}: ${currentPreset().name}`;
const soundLabel = () => (muteBtn().getAttribute("aria-pressed") === "true" ? T.soundOff : T.soundOn);

function gbtn(label, fn, kind = "ghost", ic = "") {
  const b = h("button", { class: "gbtn " + kind, type: "button" }, ic ? icon(ic) : null, h("span", { class: "gbtn-l" }, label));
  b.addEventListener("click", () => { sfx("click"); fn(); });
  return b;
}

function build() {
  resumeBtn = gbtn(T.resume, () => apply("resume"), "primary", "play");
  soundBtn = gbtn(soundLabel(), () => { muteBtn().click(); soundBtn.querySelector(".gbtn-l").textContent = soundLabel(); }, "ghost", "sound");
  // kamera düğmesi kompakt (mobil) HUD'da üst çubuktan kalktı; burada erişilebilir (masaüstünde V / Z-C kısayolları da çalışır)
  camBtn = gbtn(camLabel(), () => { cyclePreset(); camBtn.querySelector(".gbtn-l").textContent = camLabel(); }, "ghost", "target");
  pauseView = h("div", { class: "pause-view" },
    h("img", { class: "pause-emb", src: BRAND.emblem256, alt: "", width: 40, height: 40, draggable: "false", "aria-hidden": "true" }), h("h2", { id: "pause-title" }, T.paused), h("p", { class: "hint" }, T.pauseNote),
    h("div", { class: "btn-row col" }, resumeBtn, soundBtn, camBtn, gbtn(T.toMap, () => apply("leave"), "ghost", "map")),
    h("p", { class: "hint keys" }, T.pauseKeys));
  cancelBtn = gbtn(T.cancel, () => apply("pause"), "primary", "back");
  leaveView = h("div", { class: "pause-view", hidden: true },
    h("h2", { id: "leave-title" }, T.leaveTitle), h("p", { class: "hint" }, T.leaveNote),
    h("div", { class: "btn-row col" }, cancelBtn, gbtn(T.toMap, () => apply("exit"), "ghost danger", "map")));
  card = h("div", { id: "pause", role: "dialog", "aria-modal": "true", "aria-labelledby": "pause-title", hidden: true },
    h("div", { class: "card pause-card gold-frame" }, pauseView, leaveView));
  document.body.appendChild(card);
}

function show(view) {
  pauseView.hidden = view !== "pause";
  leaveView.hidden = view !== "leave";
  card.setAttribute("aria-labelledby", view === "leave" ? "leave-title" : "pause-title");
  if (view === "pause") { soundBtn.querySelector(".gbtn-l").textContent = soundLabel(); camBtn.querySelector(".gbtn-l").textContent = camLabel(); }
}

function apply(ev) {
  if (ev === "exit") { // haritaya dönüş: kart kapanır, akış devralır
    state = pauseReduce(state, "exit", RT.running);
    close();
    quitToMap();
    return;
  }
  const next = pauseReduce(state, ev, RT.running);
  if (next === state) return;
  const was = state;
  state = next;
  if (!isPaused(was) && isPaused(next)) { lastFocus = document.activeElement; releaseInput(); RT.paused = true; }
  document.body.classList.toggle("paused", isPaused(next));
  if (!isPaused(next)) { close(); return; }
  card.hidden = false;
  show(next);
  (next === "leave" ? cancelBtn : resumeBtn).focus({ preventScroll: true });
}

function close() {
  RT.paused = false;
  state = "play";
  document.body.classList.remove("paused");
  if (card) card.hidden = true;
  if (lastFocus && lastFocus.blur) lastFocus.blur();
  lastFocus = null;
  releaseInput();
}

function icons() {
  $("pause-btn").replaceChildren(icon("pause"));
  $("leave-btn").replaceChildren(icon("map"));
}

export function initPause() {
  if (card) return;
  build();
  icons();
  $("pause-btn").addEventListener("click", (e) => { apply("toggle"); e.currentTarget.blur(); });
  $("leave-btn").addEventListener("click", (e) => { apply("leave"); e.currentTarget.blur(); });
  addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === "Escape" || e.code === "KeyP") { if (RT.running) { e.preventDefault(); apply(state === "leave" && e.code === "Escape" ? "pause" : "toggle"); } }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) apply("hide"); });
  // bölüm dışına çıkılırsa (ölüm, bölüm sonu, harita) duraklatma kartı kalmasın
  new MutationObserver(() => { if (!document.body.classList.contains("playing") && (RT.paused || state !== "play")) close(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
}
