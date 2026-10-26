// Düşman doğma noktası: arena halkasında, oyuncudan en az minDist uzakta (plan B7: haksız temas ölümü).
// Saf: rnd() [0,1) döndüren işlev verilir; Node'da test edilir.
export const SPAWN_MIN_DIST = 8;
export function pickSpawnPoint(player, rnd, arena, minDist = SPAWN_MIN_DIST, tries = 16) {
  for (let i = 0; i < tries; i++) {
    const a = rnd() * Math.PI * 2, x = Math.cos(a) * arena, z = Math.sin(a) * arena;
    if (Math.hypot(x - player.x, z - player.z) >= minDist) return { x, z };
  }
  // yedek: oyuncunun tam karşısındaki halka noktası (her zaman >= arena uzaklığında)
  const a = Math.atan2(-player.z, -player.x);
  return { x: Math.cos(a) * arena, z: Math.sin(a) * arena };
}

// "Durgunluk baskısı" (plan B2: kristal bölümlerinde ateş etmeden yürüyerek geçilebiliyor): kristal bölümünde son öldürmeden beri
// her 8 sn için eşzamanlı düşman sınırı +1 (en çok +4). Savaşan oyuncu için etkisizdir (öldürme sayacı sıfırlanır). VARSAYIM.
export const IDLE_STEP = 8, IDLE_MAX = 4;
export function effectiveCap(cap, objective, idleSec) {
  if (objective !== "crystal") return cap;
  return cap + Math.min(IDLE_MAX, Math.max(0, Math.floor(idleSec / IDLE_STEP)));
}

// ---- Aşama A (docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §2.1, §2.3) ----
// "Yakın doğma": halka yerine [rMin, arena] aralığında bir yarıçap (düşman daha çabuk görünür/vurulabilir olmasın değil, daha çabuk TEMAS etsin);
// oyuncudan en az minDist uzak (haksız temas ölümü koruması sürer). Saf. VARSAYIM: 6.5 / 9.
export const NEAR_SPAWN = { minDist: 6.5, rMin: 9 };
export function pickSpawnPointNear(player, rnd, arena, opt = NEAR_SPAWN, tries = 24) {
  for (let i = 0; i < tries; i++) {
    const a = rnd() * Math.PI * 2, r = opt.rMin + rnd() * (arena - opt.rMin), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - player.x, z - player.z) >= opt.minDist) return { x, z };
  }
  return pickSpawnPoint(player, rnd, arena, Math.max(opt.minDist, SPAWN_MIN_DIST));
}

// Kristal yeri (K3 crystalLure): lure=false -> rastgele nokta; lure=true -> 4 adaydan yaşayan bir düşmana en yakın olan
// (oyuncuya >= 5 birim; uygun aday yoksa ilk aday). foes: [{ x, z }]. Saf.
export function pickCrystalPoint(player, foes, rnd, lim, lure) {
  const rr = () => (rnd() * 2 - 1) * lim;
  if (!lure || !foes.length) return { x: rr(), z: rr() };
  let best = null, bd = Infinity, first = null;
  for (let i = 0; i < 4; i++) {
    const c = { x: rr(), z: rr() };
    if (!first) first = c;
    if (Math.hypot(c.x - player.x, c.z - player.z) < 5) continue;
    let d = Infinity;
    for (const f of foes) d = Math.min(d, Math.hypot(c.x - f.x, c.z - f.z));
    if (d < bd) { bd = d; best = c; }
  }
  return best || first;
}

// K4 minKills: kristal hedefi tamam (toplanan >= goal) VE bu bölümde öldürülen düşman >= minKills (minKills yoksa/0 ise yalnız kristal). Saf.
export const crystalGoalMet = (L, collected, kills) => collected >= L.goal && kills >= (L.minKills || 0);
