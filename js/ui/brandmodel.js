// Marka sabitleri ve karşılama (splash) kuralları: saf veri/işlev, DOM gerektirmez (testli).
// İsim kuralı: marka/oyun adı HEXORA; "Büyücünün Gecesi" alt başlık/bölüm adıdır. Hikâye metinleri bundan etkilenmez.
export const BRAND = {
  name: "HEXORA",
  sub: "Büyücünün Gecesi",
  full: "HEXORA: Büyücünün Gecesi",
  kicker: "KARANLIĞIN KALBİ",
  slogan: "Bir büyü. Dokuz bölüm. Tek kader.",
  // Emre'nin uygulama ikonu (yuvarlak köşeli kare, arka planlı): küçük kullanım 256, büyük kullanım 512
  emblem256: "./assets/favicon/icon-256.webp",
  emblem512: "./assets/favicon/icon-512.webp",
  // HEXORA yazı logosu dosya değil: wordmarkSpec() ile kodda üretilir
  // "O" halkasının/elmasın merkezi (viewBox 612x170 içinde 346,76): nabız ışığı bu noktaya konur
  gem: { x: (346 / 612) * 100, y: (76 / 170) * 100 },
  colors: { violet: "#6B3BFF", gold: "#FFD87A", goldDeep: "#ff9f1c", night: "#0B1029", mystic: "#2E1A59", glow: "#A78BFF", energy: "#4DDCFF" },
};
// oturum bayrağı: yalnızca ilk açılışta karşılama; localStorage kayıt anahtarları (buyucu_*) ile ilgisi yok
export const SPLASH_KEY = "hexora_splash_seen";
export const ENTER_STAGGER_MS = 50;
export const ENTER_MAX_STEPS = 12;

// params: URLSearchParams benzeri (has). ?dev, ?debug ve ?nosplash karşılamayı atlar (otomatik denemeler/bölümden başlatma).
export function splashModel({ seen = false, reduced = false, params = null } = {}) {
  const skip = !!params && (params.has("dev") || params.has("debug") || params.has("nosplash"));
  return { show: !seen && !skip, still: !!reduced };
}
// menü öğelerinin sırayla belirmesi: i. öğenin gecikmesi (ms); çok öğe olsa da toplam süre sınırlı
export const enterDelay = (i) => Math.min(Math.max(0, i), ENTER_MAX_STEPS) * ENTER_STAGGER_MS;
// kıvılcım sayısı: yatay telefon ve düşük kalitede yarıya iner; azaltılmış harekette 0
export function sparkCount({ base = 16, reduced = false, landscapeSmall = false, low = false } = {}) {
  if (reduced) return 0;
  return landscapeSmall || low ? Math.round(base / 2) : base;
}

// HEXORA yazı logosu (altın gradyan serif harfler, elmaslı/halkalı O, ince çizgi + yıldız) için düz veri ağacı.
// DOM gerektirmez (testli); brand.js bunu createElementNS ile düğüme çevirir. Ağ isteği ve ham işaretleme yok.
// uid: sayfada aynı anda birden çok logo olabilir (karşılama + menü); gradyan kimlikleri çakışmasın diye eklenir.
export const WORDMARK_VIEWBOX = { w: 612, h: 170 };
const t = (tag, attrs = {}, ...children) => ({ tag, attrs, children });
const GLYPHS = [["H", 54], ["E", 152], ["X", 246], ["R", 450], ["A", 554]];
export function wordmarkSpec(uid = "w") {
  const id = (n) => `${n}-${uid}`, ref = (n) => `url(#${id(n)})`;
  const stop = (offset, color, opacity) => t("stop", { offset, "stop-color": color, ...(opacity === undefined ? {} : { "stop-opacity": opacity }) });
  const font = { "font-family": "Georgia, 'Times New Roman', 'Noto Serif', serif", "font-weight": 700, "font-size": 118, "text-anchor": "middle" };
  const glyphs = () => GLYPHS.map(([ch, x]) => t("text", { x, y: 120 }, ch));
  return t("svg", { viewBox: `0 0 ${WORDMARK_VIEWBOX.w} ${WORDMARK_VIEWBOX.h}`, role: "img", "aria-label": BRAND.name, class: "wm-img" },
    t("defs", {},
      t("linearGradient", { id: id("gold"), gradientUnits: "userSpaceOnUse", x1: 0, y1: 28, x2: 0, y2: 120 }, stop(0, "#fff6cf"), stop(0.45, "#ffd87a"), stop(1, "#ff9f1c")),
      t("linearGradient", { id: id("gem"), x1: 0, y1: 0, x2: 1, y2: 1 }, stop(0, "#d9ccff"), stop(0.5, "#a78bff"), stop(1, "#6b3bff")),
      t("linearGradient", { id: id("rule"), x1: 0, y1: 0, x2: 1, y2: 0 }, stop(0, "#ffd87a", 0), stop(0.5, "#ffd87a"), stop(1, "#ffd87a", 0)),
      t("linearGradient", { id: id("shine"), x1: 0, y1: 0, x2: 1, y2: 0 }, stop(0, "#ffffff", 0), stop(0.5, "#ffffff", 0.95), stop(1, "#ffffff", 0)),
      // ışık süpürmesi yalnızca harflerin ve halkanın üzerinde görünür
      t("mask", { id: id("glyphs"), maskUnits: "userSpaceOnUse", x: 0, y: 0, width: WORDMARK_VIEWBOX.w, height: WORDMARK_VIEWBOX.h },
        t("g", { fill: "#fff", ...font }, ...glyphs()),
        t("ellipse", { cx: 346, cy: 76, rx: 37, ry: 44, fill: "none", stroke: "#fff", "stroke-width": 13 }))),
    t("g", { fill: ref("gold"), stroke: "#8a5207", "stroke-width": 1.4, "stroke-linejoin": "round", ...font }, ...glyphs()),
    t("ellipse", { cx: 346, cy: 76, rx: 37, ry: 44, fill: "none", stroke: ref("gold"), "stroke-width": 13 }),
    t("ellipse", { cx: 346, cy: 76, rx: 43.5, ry: 50.5, fill: "none", stroke: "#8a5207", "stroke-width": 1.2, opacity: 0.7 }),
    t("ellipse", { cx: 346, cy: 76, rx: 30.5, ry: 37.5, fill: "none", stroke: "#8a5207", "stroke-width": 1.2, opacity: 0.7 }),
    t("polygon", { points: "346,42 362,76 346,110 330,76", fill: ref("gem"), stroke: "#fff6cf", "stroke-width": 1.6, "stroke-linejoin": "round" }),
    t("path", { d: "M346 42v68M330 76h32", fill: "none", stroke: "#fff", "stroke-opacity": 0.35, "stroke-width": 1 }),
    t("g", { mask: ref("glyphs"), "aria-hidden": "true" }, t("rect", { class: "wm-sweep", x: -240, y: 0, width: 240, height: 170, fill: ref("shine") })),
    t("rect", { x: 46, y: 147, width: 520, height: 1.6, fill: ref("rule") }),
    t("path", { d: "M306 133 l3.5 11.5 11.5 3.5 -11.5 3.5 -3.5 11.5 -3.5 -11.5 -11.5 -3.5 11.5 -3.5 z", fill: "#ffd87a" }));
}
