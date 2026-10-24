// Arayüz görünüm modelleri. Saf: DOM'a dokunmaz, Node'da test edilir.

// can -> kalp durumları ["full" | "half" | "empty", ...]; kesirli can (0.5) yarım kalp
export function heartStates(hp, maxHp) {
  const out = [];
  const total = Math.max(Math.round(maxHp), 0);
  const full = Math.max(Math.floor(hp + 1e-6), 0);
  const half = hp > 0 && hp - full > 1e-6;
  for (let i = 0; i < total; i++) out.push(i < full ? "full" : i === full && half ? "half" : "empty");
  return out;
}

// süre göstergesi: oran, tam saniye, ton (ok | warn | crit)
export function timerModel(timeLeft, total) {
  const t = Math.max(timeLeft, 0), frac = total > 0 ? Math.min(t / total, 1) : 0, secs = Math.ceil(t);
  return { frac, secs, tone: secs <= 10 ? "crit" : frac <= 0.3 ? "warn" : "ok" };
}

// hedef ilerleme oranı 0..1 (boss/mini boss: kalan can oranı, yoksa 0)
export function goalFrac(objective, { collected = 0, totemsDown = 0, goal = 1, timeLeft = 0, time = 1, bossFrac = null } = {}) {
  const f = (v) => Math.min(Math.max(v, 0), 1);
  if (objective === "crystal") return f(collected / Math.max(goal, 1));
  if (objective === "totem") return f(totemsDown / Math.max(goal, 1));
  if (objective === "survive") return f(1 - timeLeft / Math.max(time, 1));
  return bossFrac === null ? 0 : f(bossFrac);
}

// bekleme örtüsü oranı: 1 = yeni başladı (tam örtülü), 0 = hazır
export function cooldownFrac(remaining, total) {
  return total > 0 ? Math.min(Math.max(remaining / total, 0), 1) : 0;
}

// perk nadirliği: yığın sınırı küçüldükçe nadir (1 = destansı, 2 = nadir, diğerleri/sınırsız = yaygın)
export function perkRarity(maxStacks) {
  if (maxStacks === 1) return "epic";
  if (maxStacks === 2) return "rare";
  return "common";
}
export const RARITY_LABEL = { common: "Yaygın", rare: "Nadir", epic: "Destansı" };

const PERK_ICONS = { maxHp: "❤️", speedMul: "👟", dmgMul: "⚔️", cdMul: "⏱️", magnet: "🧲", vampire: "🦇", pierce: "🏹", echo: "🔁", piril: "✨", stoneLevels: "🪨", rain: "🌧️" };
export const perkIcon = (effect) => (effect && PERK_ICONS[effect.stat]) || "🔮";

const ENEMY_ICONS = { ghost: "👻", bat: "🦇", golem: "🗿", archer: "🏹", wolf: "🐺", ember: "🔥", priest: "🧙", totem: "🗼", knight: "⚔️", boss: "👑" };
export const enemyIcon = (id) => ENEMY_ICONS[id] || "👾";

// giriş metni -> sırayla belirecek satırlar (cümle sonlarından böler, boşları atar)
export function storyLines(text) {
  return String(text || "").split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
}

export const easeOutCubic = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
export const countValue = (from, to, t) => Math.round(from + (to - from) * easeOutCubic(t));

// konuşmacı portresi: simge yoksa baş harf
export function portraitOf(characters, speakerName) {
  const c = Object.values(characters || {}).find((x) => x && x.name === speakerName);
  const initial = String(speakerName || "?").trim().charAt(0).toLocaleUpperCase("tr");
  return { icon: (c && c.icon) || initial, color: (c && c.color) || null };
}
