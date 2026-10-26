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
