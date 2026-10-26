// Gerçek zincir hedef seçimi (saf): ilk hedef = menzil (range) içindeki en yakın; sonraki hedef = öncekine en çok `hop` birim,
// daha önce vurulmamış en yakın. Yıldırım yeniden dengesi: docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §3.5.
// cands: [{ x, z, ... }]; çıktı: seçilen aday nesneleri sırayla.
export const CHAIN_HOP = 5;
export const CHAIN_FALLOFF = [1, 0.7, 0.5];
export function chainTargets(origin, cands, n, range, hop = CHAIN_HOP) {
  const out = [], used = new Set();
  let from = origin, reach = range;
  for (let k = 0; k < n; k++) {
    let best = null, bd = Infinity;
    for (const c of cands) {
      if (used.has(c)) continue;
      const d = Math.hypot(c.x - from.x, c.z - from.z);
      if (d <= reach && d < bd) { bd = d; best = c; }
    }
    if (!best) break;
    out.push(best); used.add(best); from = best; reach = hop;
  }
  return out;
}
// k. halkanın hasar çarpanı (son değer tekrarlanır)
export const chainFalloff = (falloff, k) => { const f = falloff && falloff.length ? falloff : CHAIN_FALLOFF; return f[Math.min(k, f.length - 1)]; };
