// Eski bölüm kimliği -> yeni kimlik (docs/strateji/oyun-tasarimi-zorluk-ve-bolum-plani.md §4.1, 27 bölümlük kimlik planı).
// Kayıt (buyucu_save v1) ve telemetri (buyucu_telemetri) bu tabloyla SESSİZCE göç eder. Yeni kimlikler tabloda anahtar olmadığından
// dönüşüm idempotenttir (zaten göç etmiş veri değişmez). Saf: DOM'a dokunmaz.

export const LEGACY_LEVEL_IDS = {
  forest: "w1-01", cave: "w1-02", golems: "w1-03", graveyard: "w1-05", pass: "w1-07",
  village: "w1-08", tower: "w1-09", crystals: "w2-02", castle: "w3-09",
};

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const newLevelId = (id) => (typeof id === "string" && own(LEGACY_LEVEL_IDS, id) ? LEGACY_LEVEL_IDS[id] : id);

// kimlik listesi -> yeni kimlikler (sıra korunur, yinelenenler atılır)
export function mapIdList(list) {
  if (!Array.isArray(list)) return list;
  const out = [];
  for (const id of list) { const n = newLevelId(id); if (typeof n !== "string" || !out.includes(n)) out.push(n); }
  return out;
}

// { eskiId: değer } -> { yeniId: değer }; iki taraf da varsa merge(a, b) ile birleştirilir (varsayılan: yeni kimlikteki değer kalır)
export function mapIdKeys(obj, merge = (a) => a) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    if (!own(obj, k) || k === "__proto__") continue;
    const n = newLevelId(k);
    out[n] = own(out, n) ? merge(out[n], obj[k]) : obj[k];
  }
  return out;
}
