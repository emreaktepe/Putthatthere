// Silah–düşman karşıtlık çarpanı (saf; DOM/Three.js yok; Node'da test edilir). Tasarım: docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §3.
//   hasar_son = taban x güç çarpanı x multiplier(element, düşman) x durum çarpanları
// Düşman satırı: etiketler (enemies.<id>.tags -> TAG_RULES genel kuralı) + tek tek ezme tablosu (enemies.<id>.res: element -> E|N|D|I).
// Tüm çarpanlar VARSAYIMDIR (oyuncu testi yok).
import { TAG_RULES } from "../config/registry.js";

export const MULT = { E: 1.75, N: 1, D: 0.6, I: 0.25 }; // Etkili / Normal / Dirençli / Bağışık
export const LEVEL_NAME = { E: "Etkili", N: "Normal", D: "Dirençli", I: "Bağışık" };

// düzey kodu: "E" | "N" | "D" | "I"
export function matchupLevel(element, tags, res) {
  if (!element) return "N";
  if (res && res[element]) return res[element];
  let e = false, d = false;
  for (const t of tags || []) {
    const r = TAG_RULES[t];
    if (!r) continue;
    if (r.I && r.I.includes(element)) return "I";
    if (r.E && r.E.includes(element)) e = true;
    if (r.D && r.D.includes(element)) d = true;
  }
  return e && d ? "N" : e ? "E" : d ? "D" : "N";
}

// çarpan; mult: perk ile değiştirilmiş tablo (Odak Merceği / Zırh Kıran gibi, ileride) – verilmezse MULT
export const multiplier = (element, tags, res, mult = MULT) => mult[matchupLevel(element, tags, res)];

// 18 satırlık tablo görünümü: silah elementi x düşman -> düzey (testler, doğrulayıcı, admin özeti için)
export function matrix(elements, enemies) {
  const out = {};
  for (const [id, e] of Object.entries(enemies)) {
    out[id] = {};
    for (const el of elements) out[id][el] = matchupLevel(el, e.tags, e.res);
  }
  return out;
}
// bir düşmanın en zayıf olduğu element(ler) (en yüksek çarpan > 1); yoksa []
export function weakElements(elements, tags, res) {
  let best = 1; const out = [];
  for (const el of elements) {
    const m = multiplier(el, tags, res);
    if (m > best + 1e-9) { best = m; out.length = 0; out.push(el); } else if (m > 1 && Math.abs(m - best) < 1e-9) out.push(el);
  }
  return out;
}
