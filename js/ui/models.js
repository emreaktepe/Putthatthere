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

// konuşmacı portresi: simge yoksa baş harf; `portrait` (görsel yolu) yalnızca karakterde varsa eklenir
export function portraitOf(characters, speakerName) {
  const c = Object.values(characters || {}).find((x) => x && x.name === speakerName);
  const initial = String(speakerName || "?").trim().charAt(0).toLocaleUpperCase("tr");
  const out = { icon: (c && c.icon) || initial, color: (c && c.color) || null };
  if (c && c.portrait) out.portrait = c.portrait;
  return out;
}

// ---------- Oyun ekranı (HUD) modelleri ----------

// görev paneli satırları: en çok 2 (bölüm hedefi + yenilen düşman). Yalnızca oyunda gerçekten izlenen değerler.
// L: bölüm ({ objective, goal }), rt: { collected, totemsDown }, kills: bu bölümde yenilen düşman, labels: { objective, kills }
export function questRows(L, rt = {}, kills = 0, labels = {}) {
  const goal = Math.max(Number(L && L.goal) || 0, 1);
  let value = "", done = false;
  if (L && L.objective === "crystal") { const n = Math.max(rt.collected || 0, 0); value = `${Math.min(n, goal)}/${goal}`; done = n >= goal; }
  else if (L && L.objective === "totem") { const n = Math.max(rt.totemsDown || 0, 0); value = `${Math.min(n, goal)}/${goal}`; done = n >= goal; }
  const icon = L && L.objective === "crystal" ? "crystal" : L && L.objective === "survive" ? "hourglass" : "target";
  return [
    { id: "goal", icon, label: String(labels.objective || ""), value, done },
    { id: "kills", icon: "skull", label: String(labels.kills || ""), value: String(Math.max(Math.floor(kills) || 0, 0)), done: false },
  ];
}

// büyü/yetenek slotu: kilitli mi, seçili mi, ekran okuyucu etiketi
export function slotModel({ name = "", key = "", unlocked = false, selected = false, kind = "weapon" } = {}) {
  const open = !!unlocked;
  return {
    open,
    active: open && !!selected,
    label: open ? `${name} (${key})` : `${kind === "ability" ? "Yetenek" : "Büyü"} ${key}: kilitli`,
  };
}

// duraklatma durum makinesi. durum: "play" | "pause" | "leave" (haritaya dönüş onayı).
// olay: toggle (Esc/P) | pause | leave | resume | hide (sekme gizlendi) | exit (haritaya dönüldü).
// running=false (bölüm dışı) ise her zaman "play": duraklatma yalnız savaşta anlamlıdır.
export function pauseReduce(state, ev, running = true) {
  if (!running) return "play";
  switch (ev) {
    case "toggle": return state === "play" ? "pause" : "play";
    case "pause": return "pause";
    case "hide": return state === "play" ? "pause" : state;
    case "leave": return "leave";
    case "resume": case "exit": return "play";
    default: return state;
  }
}
export const isPaused = (state) => state !== "play";
// duraklatmada oyun saati ilerlemez
export const stepDt = (dt, paused) => (paused ? 0 : dt);

// ---------- Menü, harita, bölüm kartı ve bölüm sonu modelleri ----------

// bölümde karşılaşılacak düşman kimlikleri (başlangıç + dalgalar + totem hedefi); yalnızca adı olanlar
export function foeIdsOf(L, names = {}, totemId = null) {
  const ids = new Set(Object.keys((L && L.start) || {}));
  ((L && L.spawn) || []).forEach((w) => Object.keys(w).forEach((k) => ids.add(k)));
  if (L && L.objective === "totem" && totemId) ids.add(totemId);
  return [...ids].filter((k) => names[k]);
}

// ana menü "devam edilen bölüm" kartı: yalnızca bölümün gerçek verisi (ad, kapak, süre, düşman türü sayısı)
export function continueCardModel(L, { index = 0, total = 0, names = {}, totemId = null } = {}) {
  if (!L) return null;
  return { n: index + 1, total, name: L.name, cover: L.image || null, time: L.time, foeCount: foeIdsOf(L, names, totemId).length };
}

// menü/harita üst sayaçları: yalnızca kayıttaki gerçek değerler (tamamlanan bölüm sayısı, en iyi toplam puan). Kayıt yoksa null.
export function careerStats(save, total) {
  if (!save) return null;
  const done = Array.isArray(save.completed) ? save.completed.length : 0;
  const best = Math.max(Math.floor(Number(save.best && save.best.score) || 0), 0);
  return { done, total, best };
}

// harita detay paneli çipleri: süre, (varsa) en iyi puan, (varsa) bölüm ödülü büyüsü adı
export function sheetModel(L, status, best, reward) {
  return {
    time: L.time,
    best: best && best.score > 0 ? best.score : null,
    reward: reward ? { id: reward.id, name: reward.name } : null,
    canPlay: status !== "locked",
    practice: status === "completed",
  };
}

// bölüm sonu skor satırları (ekrandaki sayılar countUp ile animasyonla yazılır)
export function scoreRows({ bonus = 0, levelBonus = 0, total = 0, prevTotal = 0 } = {}) {
  return [
    { id: "time", value: bonus, plus: true },
    { id: "level", value: levelBonus, plus: true },
    { id: "total", value: total, from: prevTotal, plus: false },
  ];
}

// yeni büyü kartı istatistik satırı: büyüde hasar + bekleme, yetenekte yalnız bekleme
export function rewardStat(kind, d, labels) {
  const cd = `${labels.cooldown} ${d.cd} ${labels.sec}`;
  return kind === "weapon" ? `${labels.damage} ${d.dmg} · ${cd}` : cd;
}

// ---------- Mobil yerleşim modelleri ----------

// büyü şeridi: yalnızca açılmış slotlar çizilir (sıra korunur); kilitliler yalnızca sayı olarak (küçük noktalar) gösterilir
export function slotLayout(order = [], unlocked = []) {
  const open = order.filter((id) => unlocked.includes(id));
  return { open, locked: order.length - open.length };
}

// bildirim (toast) süresi: faz uyarısı gibi uzun bildirimler de en çok 3 sn kalır, çok kısalar en az 1,2 sn
export const TOAST_MIN_MS = 1200, TOAST_MAX_MS = 3000;
export function toastMs(ms) {
  const v = Number(ms);
  return Math.min(Math.max(Number.isFinite(v) ? v : TOAST_MAX_MS, TOAST_MIN_MS), TOAST_MAX_MS);
}

// harita bölüm kartı: varsayılan kompakt (dikeyde ekranın en çok %32'si), "Detay" ile genişler (en çok %55).
// canExpand=false (kilitli bölüm gibi gösterecek detayı olmayan durum) her zaman kompakt kalır.
export const SHEET_MAX_PCT = { compact: 32, expanded: 55 };
export function sheetLayout({ expanded = false, canExpand = true } = {}) {
  const open = !!expanded && !!canExpand;
  return { expanded: open, maxPct: open ? SHEET_MAX_PCT.expanded : SHEET_MAX_PCT.compact };
}

// seçili düğümün kartın üstündeki görünür alanda kalması için kaydırma konumu.
// nodeY: düğüm merkezi (kaydırılan içerikte px), viewH: görünür yükseklik, sheetH: kartın örttüğü alt yükseklik, at: görünür alanda hedef oran
export function scrollForNode({ nodeY = 0, viewH = 0, sheetH = 0, at = 0.42 } = {}) {
  const visible = Math.max(viewH - Math.max(sheetH, 0), 0);
  return Math.max(Math.round(nodeY - visible * at), 0);
}
