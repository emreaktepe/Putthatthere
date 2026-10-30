// Çevre tehlikeleri (Aşama C, docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §7.1). SAF mantık: DOM/Three yok, Node'da test edilir.
// Sahneye bağlayan kısım js/game/hazardrun.js'tedir. Tüm sayılar VARSAYIMDIR (gerçek oyuncu testi yok).
// Adalet ilkeleri: uyarı >= 1.0 sn; hasar veren tehlike oyuncunun BULUNDUĞU noktaya doğrudan konmaz (merkez >= MIN_PLAYER_DIST uzakta);
// ilk tehlike bölüm başından en az FIRST_MIN sn sonra; DDA yardımı seyreltir; eşzamanlı sınır (mobil <= 3).
export const HAZARD_IDS = ["poison", "fall", "fire", "ice"];
export const MIN_PLAYER_DIST = 1.5; // hasarlı tehlikenin merkezi oyuncudan en az bu kadar uzakta
export const FIRST_MIN = 8; // ilk tehlike en erken (sn)
export const GLOBAL_MAX = 3; // aynı anda en çok (mobil bütçesi); Düşük kalitede 2
export const MAX_KINDS = 2; // bölüm başına en çok tür

// kind: tanım. warn: uyarı (sn); life: etkin süre (sn; fall için çarpma sonrası kalıntı); r: yarıçap; dmgP/dmgE: oyuncuya/düşmana hasar;
// tick: hasar aralığı (sn; 0 = tek çarpma); every: varsayılan doğma aralığı (sn); maxActive: aynı anda (tür başına); player/enemy: kime etki.
export const HAZARDS = {
  poison: { warn: 1.3, life: 2.5, r: 2.0, dmgP: 1, dmgE: 0.5, tick: 1.0, every: 14, maxActive: 2, color: 0x6bd44a, player: true, enemy: true },
  fall: { warn: 1.2, life: 0.5, r: 2.0, dmgP: 1, dmgE: 2, tick: 0, every: 7, maxActive: 2, color: 0xc9b27a, player: true, enemy: true },
  fire: { warn: 1.2, life: 2.0, r: 1.8, dmgP: 1, dmgE: 1, tick: 1.0, every: 10, maxActive: 2, color: 0xff7a2a, player: true, enemy: true },
  // buz yaması: hasar yok; oyuncu kayar (yön değiştirme gecikmeli), düşman yavaşlar (buz türleri bağışık)
  ice: { warn: 1.0, life: 7.0, r: 3.2, dmgP: 0, dmgE: 0, tick: 0, every: 15, maxActive: 2, color: 0x9fe8ff, player: true, enemy: true, slowE: 0.7, slide: 2.2 },
};
export const isKind = (k) => Object.prototype.hasOwnProperty.call(HAZARDS, k);

// config satırlarını ([{kind, every?, maxActive?}]) çalışma tanımlarına çevirir; bilinmeyen/yinelenen tür atılır, en çok MAX_KINDS
export function hazardDefs(list) {
  const out = [], seen = new Set();
  if (!Array.isArray(list)) return out;
  for (const row of list) {
    if (!row || !isKind(row.kind) || seen.has(row.kind)) continue;
    seen.add(row.kind);
    const base = HAZARDS[row.kind];
    const every = Number.isFinite(row.every) ? Math.max(4, row.every) : base.every;
    const maxActive = Number.isInteger(row.maxActive) ? Math.min(3, Math.max(1, row.maxActive)) : base.maxActive;
    out.push({ kind: row.kind, ...base, every, maxActive });
    if (out.length >= MAX_KINDS) break;
  }
  return out;
}

// DDA kademesi (0..3): seyreltme. Tier>=1 aralık x(1+0.25 tier); tier>=2 tür başına bir eş zamanlı az; tier>=3 oyuncu hasarı en çok 1.
export function ddaDef(def, tier = 0) {
  const t = Math.max(0, Math.floor(tier) || 0);
  return {
    ...def,
    every: def.every * (1 + 0.25 * t),
    maxActive: Math.max(1, def.maxActive - (t >= 2 ? 1 : 0)),
    dmgP: t >= 3 ? Math.min(def.dmgP, 1) : def.dmgP,
  };
}
export const globalMax = (low) => (low ? 2 : GLOBAL_MAX);
export const firstDelay = (def) => Math.max(FIRST_MIN, def.every * 0.9);
export const nextDelay = (def, rnd) => def.every * (0.85 + 0.3 * rnd());

// Zamanlayıcı girdisi: { def, t }. true dönerse "şimdi bir tane başlat" (çağıran başlatamazsa 0.5 sn sonra yeniden dener).
export const newEntry = (def) => ({ def, t: firstDelay(def) });
export function entryTick(en, dt, canStart, rnd) {
  en.t -= dt;
  if (en.t > 0) return false;
  if (!canStart) { en.t = 0.5; return false; }
  en.t = nextDelay(en.def, rnd);
  return true;
}

// Yerleşim: { x, z } | null. player {x,z}; mv {x,z} birim yön (moving=false ise yok sayılır); others [{x,z,r}] (canlı tehlikeler/işaretler).
// Hasarlı türde merkez oyuncudan >= MIN_PLAYER_DIST; adayların yarısı oyuncunun hareket yönünün önüne (hafif tahmin) konur.
export function pickHazardPoint(def, player, mv, moving, rnd, arena, others = [], tries = 14) {
  const lim = arena - 1.5, dmg = def.dmgP > 0;
  for (let i = 0; i < tries; i++) {
    let x, z;
    if (rnd() < 0.55) {
      const bx = player.x + (moving ? mv.x * 2.4 : 0), bz = player.z + (moving ? mv.z * 2.4 : 0);
      const a = rnd() * Math.PI * 2, d = 1.2 + rnd() * 2.2;
      x = bx + Math.cos(a) * d; z = bz + Math.sin(a) * d;
    } else { x = (rnd() * 2 - 1) * lim; z = (rnd() * 2 - 1) * lim; }
    x = Math.max(-lim, Math.min(lim, x)); z = Math.max(-lim, Math.min(lim, z));
    if (dmg && Math.hypot(x - player.x, z - player.z) < MIN_PLAYER_DIST) continue;
    let ok = true;
    for (const o of others) if (Math.hypot(x - o.x, z - o.z) < def.r + (o.r || 0) * 0.8) { ok = false; break; }
    if (ok) return { x, z };
  }
  return null;
}

// Etkin tehlike durum makinesi. phase: warn -> live -> done. Dönüş: olay bit maskesi (ortak dizi üretmez).
export const EV_START = 1, EV_TICK = 2, EV_STRIKE = 4, EV_END = 8;
export function newActive(def, x, z) {
  return { kind: def.kind, def, x, z, phase: "warn", t: def.warn, dur: def.warn, tickT: 0, life: def.life };
}
export function stepActive(a, dt) {
  const d = a.def;
  let ev = 0;
  if (a.phase === "warn") {
    a.t -= dt;
    if (a.t > 0) return 0;
    a.phase = "live"; a.t = a.life; a.tickT = 0.3; // 0.3 sn tolerans: çıkmaya vakit
    ev |= d.tick > 0 || d.kind === "ice" ? EV_START : EV_STRIKE;
    if (d.kind === "fall") return ev; // çarpma tek an; kalıntı yalnız görsel
    dt = 0;
  }
  if (a.phase === "live") {
    a.t -= dt;
    if (d.tick > 0 && d.kind !== "fall") { a.tickT -= dt; if (a.tickT <= 0) { a.tickT += d.tick; ev |= EV_TICK; } }
    if (a.t <= 0) { a.phase = "done"; ev |= EV_END; }
  }
  return ev;
}
export const inZone = (a, x, z, pad = 0) => Math.hypot(x - a.x, z - a.z) < a.def.r + pad;

// Buz: oyuncu hızı hedef hıza `slide` /sn oranıyla yaklaşır (kayma); buz dışında anında. vel {x,z} yerinde güncellenir.
export function slideVel(vel, tx, tz, dt, onIce, slide = HAZARDS.ice.slide) {
  if (!onIce) { vel.x = tx; vel.z = tz; return vel; }
  const k = 1 - Math.exp(-slide * dt);
  vel.x += (tx - vel.x) * k; vel.z += (tz - vel.z) * k;
  return vel;
}

// Bölümlerde tehlike türü kademeli tanıtma: her bölümde ilk kez görülen tür sayısı (balance.js W_BALANCE)
export function hazardSteps(levels, order) {
  const out = [], seen = new Set();
  for (const id of order) {
    const L = levels && levels[id];
    if (!L || !Array.isArray(L.hazards)) continue;
    const kinds = L.hazards.map((h) => h && h.kind).filter(isKind);
    out.push({ id, kinds, added: kinds.filter((k) => !seen.has(k)) });
    kinds.forEach((k) => seen.add(k));
  }
  return out;
}

// Denge botu için soyut yük: tür başına saniyede beklenen "tehlike alanı karşılaşması" (oyuncu alanı oranı yaklaşık)
export const hazardRate = (def, arena = 14) => (def.dmgP > 0 ? (Math.PI * def.r * def.r * (def.tick > 0 ? def.life + def.warn * 0.2 : 1)) / (4 * arena * arena) / def.every : 0);
