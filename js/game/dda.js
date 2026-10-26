// Dinamik yardım (DDA), plan §3.6. Saf: DOM/Three.js'e dokunmaz, Node'da test edilir.
// Kural: AYNI bölümde art arda ölüm sayısına göre yardım kademesi (bölüm geçilince sıfırlanır, alıştırmada uygulanmaz).
// Yardım şeffaftır: kademe bilgisi oyuncuya gösterilir (metin config strings.dda) ve duraklatma/menüden kapatılabilir.
// Tüm çarpanlar VARSAYIMDIR (plan V12); bölüm 7 denge botuyla (--dda) ve oyuncu testiyle kalibre edilecek.

export const DDA_TIERS = [
  { deaths: 2, spawnMul: 0.9, startMul: 0.85, heartMul: 1.25, bonusHp: 0, startShield: false, timeMul: 1 },
  { deaths: 3, spawnMul: 0.8, startMul: 0.75, heartMul: 1.5, bonusHp: 1, startShield: false, timeMul: 1 },
  { deaths: 4, spawnMul: 0.7, startMul: 0.65, heartMul: 2.0, bonusHp: 1, startShield: true, timeMul: 1.2 },
];
export const DDA_NEUTRAL = { tier: 0, deaths: 0, spawnMul: 1, startMul: 1, heartMul: 1, bonusHp: 0, startShield: false, timeMul: 1 };
export const DDA_Z_FLOOR = 0.6; // etkin zorluk, tasarım zorluğunun %60'ının altına inmez (plan §3.6 zemin)

// deaths: bu bölümde art arda ölüm sayısı. enabled=false -> yardım yok. -> { tier: 0..3, ...çarpanlar }
export function ddaFor(deaths, enabled = true) {
  const n = Number.isFinite(deaths) ? Math.max(0, Math.floor(deaths)) : 0;
  if (!enabled || n < DDA_TIERS[0].deaths) return { ...DDA_NEUTRAL, deaths: n };
  let tier = 0;
  DDA_TIERS.forEach((t, i) => { if (n >= t.deaths) tier = i + 1; });
  return { tier, ...DDA_TIERS[tier - 1], deaths: n };
}

// ard arda ölüm sayacı: { [bölümKimliği]: sayı } (oturum belleği; kayda yazılmaz)
export const recordDeath = (counts, id) => ({ ...counts, [id]: (counts[id] || 0) + 1 });
export function resetLevel(counts, id) {
  if (!counts[id]) return counts;
  const c = { ...counts };
  delete c[id];
  return c;
}

// başlangıç düşman sayıları x startMul; set-piece (Şövalye/Kral) ve totem sabit kalır; sayısı > 0 olan tür en az 1 kalır
export function scaledStart(start, startMul, isFixed = () => false) {
  const out = {};
  for (const [k, n] of Object.entries(start)) out[k] = isFixed(k) || startMul >= 1 ? n : Math.max(n > 0 ? 1 : 0, Math.round(n * startMul));
  return out;
}
// doğma aralığı: akış (λ) x spawnMul demek aralığı / spawnMul demektir
export const scaledEvery = (every, spawnMul) => every / (spawnMul > 0 ? spawnMul : 1);

// yaklaşık etkin zorluk çarpanı (akış ve başlangıç payı %50/%50 varsayımıyla); test/doğrulama içindir
export const approxZMul = (p) => 0.5 * p.spawnMul + 0.5 * p.startMul;
