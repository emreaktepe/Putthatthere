// Marka sabitleri ve karşılama (splash) kuralları: saf veri/işlev, DOM gerektirmez (testli).
// İsim kuralı: marka/oyun adı HEXORA; "Büyücünün Gecesi" alt başlık/bölüm adıdır. Hikâye metinleri bundan etkilenmez.
export const BRAND = {
  name: "HEXORA",
  sub: "Büyücünün Gecesi",
  full: "HEXORA: Büyücünün Gecesi",
  kicker: "KARANLIĞIN KALBİ",
  slogan: "Bir büyü. Dokuz bölüm. Tek kader.",
  emblem256: "./assets/brand/hexora-emblem-256.webp",
  emblem512: "./assets/brand/hexora-emblem-512.webp",
  wordmark: "./assets/brand/hexora-wordmark.svg",
  // wordmark.svg içinde "O" halkasının/elmasın merkezi (viewBox 612x170 içinde 346,76): nabız ışığı bu noktaya konur
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
