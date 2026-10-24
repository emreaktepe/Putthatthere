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
export function fillMedallion(box, path, name, fallback, cls = "") {
  const img = portraitImg(path, name, cls);
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

// ---------- ikon / kapak görselleri (hepsi isteğe bağlı; yoksa ya da yüklenemezse yedek) ----------
// Saf: bir öğenin (büyü, yetenek, perk...) görsel yolunu seçer. small=true -> imageSmall (yoksa image).
export function pickArt(item, small = false) {
  if (!item || typeof item !== "object") return null;
  const first = small ? [item.imageSmall, item.image] : [item.image];
  return first.find((p) => artPath(p)) || null;
}

// ui.icons: kalp görseli çift olarak geçerliyse { full, empty }, aksi halde null (SVG kalpler)
export function heartPair(icons) {
  const o = icons || {};
  return artPath(o.heartFull) && artPath(o.heartEmpty) ? { full: o.heartFull, empty: o.heartEmpty } : null;
}

// yedeği olan görsel: yol geçerliyse <img> (hata olursa yedekle değişir; yedek null ise kaldırılır), değilse yedek düğüm
export function artOr(path, fallback, { cls = "", size = 0, lazy = true, alt = "" } = {}) {
  const src = artPath(path);
  if (!src) return fallback;
  const img = h("img", { class: "art-ic " + cls, src, alt, decoding: "async", draggable: "false", loading: lazy ? "lazy" : "eager", width: size || null, height: size || null });
  img.addEventListener("error", () => { if (fallback) img.replaceWith(fallback); else img.remove(); });
  return img;
}
