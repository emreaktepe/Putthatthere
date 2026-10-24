// Tam ekran kaplama (#msg): başlık + içerik + düğmeler. 2. aşamada (menü/harita/kayıt) bu modül ekran yönlendiriciye
// (ui/router.js) dönüşecek; screen() geçiş köprüsü olarak kalır.
// content: dize | DOM düğümü | bunların dizisi. Etiketler yalnızca metin düğümü olarak basılır.
import { mus, sfx } from "../audio/engine.js";
import { h } from "../core/dom.js";
import { INPUT, RT } from "../core/state.js";
import { $ } from "../core/util.js";

export function screen(title, content, buttons) {
  RT.running = false;
  document.body.classList.remove("playing", "slowtime");
  INPUT.fireHeld = false;
  $("toast").classList.remove("show");
  $("title").textContent = title;
  $("sub").replaceChildren(...[content].flat(Infinity));
  const box = $("btns");
  box.replaceChildren();
  for (const b of buttons) {
    const el = h("button", { class: "gbtn" }, b.label, b.small ? h("small", null, b.small) : null);
    el.onclick = () => { sfx("click"); b.fn(); };
    box.appendChild(el);
  }
  mus.set("menu");
  $("msg").hidden = false;
}

// Konfigürasyon yüklenemediğinde/geçersizken: ses, sahne ve oyun verisinden bağımsız hata ekranı.
export function showFatal({ title, message, lines = [], retry = true }) {
  document.body.classList.remove("playing");
  $("title").textContent = title;
  const list = lines.slice(0, 12).map((l) => h("div", { style: { "font-size": "13px", "text-align": "left", opacity: "0.85" } }, l));
  $("sub").replaceChildren(message, ...list);
  const box = $("btns");
  box.replaceChildren();
  if (retry) box.append(h("button", { class: "gbtn", onclick: () => location.reload() }, "Yeniden dene"));
  $("msg").hidden = false;
}
