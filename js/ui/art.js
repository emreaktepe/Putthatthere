// Görsel yardımcıları. Konfigürasyondan gelen görsel yolları YALNIZCA ART_RE'den geçtiyse kullanılır
// (doğrulayıcı zaten eler; burada ikinci savunma). Düğümler yalnızca DOM API ile kurulur.
// Yüklenemeyen görsel düğümden kaldırılır: arayüz yedek (renk/emoji/CSS arka plan) ile çalışmaya devam eder.
import { ART_RE } from "../config/registry.js";
import { h } from "../core/dom.js";

export const artPath = (p) => (typeof p === "string" && ART_RE.test(p) ? "./" + p : null);

// tam ekran arka plan görseli (yüklenemezse kaldırılır, CSS arka plan görünür)
export function artBg(path, cls = "") {
  const src = artPath(path);
  if (!src) return null;
  const img = h("img", { class: "art-bg " + cls, src, alt: "", "aria-hidden": "true", decoding: "async", draggable: "false" });
  img.addEventListener("error", () => img.remove());
  return img;
}

// portre görseli: yoksa/yüklenemezse onError(img) çağrılır (çağıran yedeği gösterir). Tembel yüklenir.
export function portraitImg(path, name, cls = "") {
  const src = artPath(path);
  if (!src) return null;
  const img = h("img", { class: "portrait-img " + cls, src, alt: String(name || ""), loading: "lazy", decoding: "async", draggable: "false" });
  return img;
}

// madalyon: görsel varsa <img>, yoksa (ya da yüklenemezse) yedek düğüm. Kap elemanı çağırandan gelir.
export function fillMedallion(box, path, name, fallback) {
  const img = portraitImg(path, name);
  if (!img) { box.replaceChildren(fallback); return box; }
  box.classList.add("has-img");
  img.addEventListener("error", () => { box.classList.remove("has-img"); box.replaceChildren(fallback); });
  box.replaceChildren(img);
  return box;
}

// erken yükleme (gecikmeli): bir sonraki ekranın görseli ağı meşgul etmeden hazırlanır
const warmed = new Set();
export function warmArt(path) {
  const src = artPath(path);
  if (!src || warmed.has(src)) return;
  warmed.add(src);
  const go = () => { const i = new Image(); i.decoding = "async"; i.src = src; };
  (window.requestIdleCallback || ((f) => setTimeout(f, 600)))(go);
}
