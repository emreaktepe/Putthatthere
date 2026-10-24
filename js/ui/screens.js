// Ekran yönlendirici: tam ekran sahne (#stage) tek bir düğümü barındırır; yeni ekran bağlanırken öncekinin
// olay dinleyicileri/zamanlayıcıları (scope) temizlenir. Konfigürasyon hatası için bağımsız #msg paneli ayrı kalır (showFatal).
import { mus, sfx } from "../audio/engine.js";
import { h } from "../core/dom.js";
import { INPUT, RT } from "../core/state.js";
import { $ } from "../core/util.js";
import { icon } from "./icons.js";

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Temizlenebilir kaynak kümesi: dinleyici, zamanlayıcı, animasyon karesi
export function scope() {
  const offs = [];
  return {
    on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); offs.push(() => target.removeEventListener(ev, fn, opts)); },
    timeout(fn, ms) { const id = setTimeout(fn, ms); offs.push(() => clearTimeout(id)); return id; },
    raf(fn) { let id = 0; const loop = (t) => { if (fn(t) !== false) id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); offs.push(() => cancelAnimationFrame(id)); },
    dispose() { for (const f of offs.splice(0)) f(); },
  };
}

let current = null;
// node: yeni ekran; sc: ekran kapsamı (scope); music: "menu" | null (null = müziği değiştirme)
export function mount(node, sc = null, { music = "menu", cls = "" } = {}) {
  if (current) current.dispose();
  current = sc;
  RT.running = false;
  document.body.classList.remove("playing", "slowtime");
  INPUT.fireHeld = false;
  $("toast").classList.remove("show");
  $("msg").hidden = true;
  const stage = $("stage");
  stage.className = cls;
  stage.replaceChildren(node);
  stage.scrollTop = 0;
  stage.hidden = false;
  if (music) mus.set(music);
  const first = node.querySelector && node.querySelector("[data-autofocus]");
  if (first) first.focus({ preventScroll: true });
}
// oyuna geçerken: sahneyi kaldırır ve temizler
export function unmount() {
  if (current) current.dispose();
  current = null;
  const stage = $("stage");
  stage.hidden = true;
  stage.replaceChildren();
  $("msg").hidden = true;
}

// Düğme: kind = "primary" | "ghost"; small = alt not. Tıklamada tık sesi.
export function button(label, fn, { kind = "primary", small = "", ic = "", aria = "", autofocus = false } = {}) {
  const el = h("button", { class: "gbtn " + kind, type: "button", "aria-label": aria || null, "data-autofocus": autofocus ? "1" : null },
    ic ? icon(ic) : null, h("span", { class: "gbtn-l" }, label), small ? h("small", null, small) : null);
  el.addEventListener("click", () => { sfx("click"); fn(); });
  return el;
}
// iki aşamalı onay düğmesi: ilk dokunuş etiketi değiştirir, 3 sn içinde ikinci dokunuş çalıştırır
export function confirmButton(label, confirmLabel, fn, sc, opts = {}) {
  const b = button(label, () => {
    if (b.dataset.armed) { fn(); return; }
    b.dataset.armed = "1";
    b.querySelector(".gbtn-l").textContent = confirmLabel;
    b.classList.add("armed");
    sc.timeout(() => { delete b.dataset.armed; b.querySelector(".gbtn-l").textContent = label; b.classList.remove("armed"); }, 3000);
  }, opts);
  return b;
}

// Konfigürasyon yüklenemediğinde/geçersizken: ses, sahne ve oyun verisinden bağımsız hata ekranı.
export function showFatal({ title, message, lines = [], retry = true }) {
  document.body.classList.remove("playing");
  $("stage").hidden = true;
  $("title").textContent = title;
  const list = lines.slice(0, 12).map((l) => h("div", { style: { "font-size": "13px", "text-align": "left", opacity: "0.85" } }, l));
  $("sub").replaceChildren(message, ...list);
  const box = $("btns");
  box.replaceChildren();
  if (retry) box.append(h("button", { class: "gbtn primary", onclick: () => location.reload() }, "Yeniden dene"));
  $("msg").hidden = false;
}
