// "Etkili!" / "Dirençli" etiketi sınırlayıcısı (saf; Node'da test edilir): aynı anda en çok `max` etiket,
// aynı düşman için `perEnemyMs` içinde en çok bir etiket. key: düşman nesnesi (WeakMap anahtarı).
export const TAG_MAX = 6, TAG_PER_ENEMY_MS = 400, TAG_LIFE_MS = 700;
export function makeTagGate(max = TAG_MAX, perEnemyMs = TAG_PER_ENEMY_MS, lifeMs = TAG_LIFE_MS) {
  const last = new WeakMap();
  let live = [];
  return {
    allow(key, now) {
      live = live.filter((t) => t > now);
      if (live.length >= max) return false;
      const l = last.get(key);
      if (l !== undefined && now - l < perEnemyMs) return false;
      last.set(key, now);
      live.push(now + lifeMs);
      return true;
    },
    get active() { return live.length; },
  };
}
// düzey koduna göre etiket sınıfı: yalnız Etkili (E) ve Dirençli/Bağışık (D/I) gösterilir; Normal'de etiket yok
export const tagKind = (level) => (level === "E" ? "e" : level === "D" || level === "I" ? "d" : null);
