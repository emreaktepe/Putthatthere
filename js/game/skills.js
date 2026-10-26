// Düşman becerileri (Aşama B; docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §4.1): SAF mantık. DOM/Three.js'e dokunmaz; Node'da test edilir
// ve denge botu (tools/balance/sim.mjs) aynı sayıları ithal eder. Oyun tarafı: js/game/skillrun.js.
// Tüm sayılar VARSAYIMDIR (gerçek oyuncu testi yok). Kurallar:
//  * Beceri bölümde `levels.<id>.skills` listesiyle açılır; listede olmayan beceri HİÇ çalışmaz (eski bölümler değişmez).
//  * Her beceri uyarı süresi >= 0.6 sn (yalnız Ruh perdesi ve Totem halkası sürekli/görsel: uyarı gerektiren hasarı yok).
//  * Beceri sıklığı DDA'dan ve alıştırma kipinden ETKİLENMEZ (bu dosya dda.js'i bilmez; bekleme düşman zamanıyla işler).
//  * Aynı anda en çok MAX_WARN_MARKS yer işareti (mobil sınırı).

export const MAX_WARN_MARKS = 3;

// model: beceriyi taşıyan düşman modeli (enemies.<id>.model). cancelOnHit: uyarı sırasında vurulursa iptal.
export const SKILLS = {
  veil: { model: "ghost", range: 7, solid: 0.15, pierce: ["arcane", "light"], tp: 0.10 },
  batDive: { model: "bat", minBats: 2, near: 12, cd: 7, cdInit: [2, 6], warn: 0.6, speed: 12, maxTravel: 0.7, r: 1.2, tp: 0.12 },
  quake: { model: "golem", trigger: 4.5, cd: 7, cdInit: [1.5, 4], warn: 1.0, r: 3.2, dmg: 1, rest: 0.8, tp: 0.15 },
  volley: { model: "archer", cd: 9, cdInit: [3, 6], warn: 1.2, r: 1.5, dmg: 1, lead: 1.2, count: 3, spread: 1.8, maxDist: 16, tp: 0.15 },
  howl: { model: "wolf", minWolves: 2, hpBelow: 0.5, cd: 12, cdInit: [3, 8], warn: 0.9, near: 12, haste: 5, speedMul: 1.3, cdCut: 0.3, r: 2.5, cancelOnHit: true, tp: 0.12 },
  emberChain: { model: "ember", r: 3.5, delay: 0.25, patchR: 1.6, patchLife: 3, patchGrace: 0.5, patchDmg: 1, tp: 0.10 },
  revive: { model: "priest", near: 7, window: 4, max: 2, cd: 10, cdInit: [3, 6], warn: 1.5, hp: 1, cancelOnHit: false, tp: 0.20 },
  aura: { model: "totem", r: 6, mul: 0.6, tp: 0.10 },
  leap: { model: "knight", hpBelow: 0.75, cd: 9, cdInit: [2, 4], warn: 0.9, flight: 0.3, r: 2.2, dmg: 2, tired: 1.2, tiredMul: 1.5, open: 1.0, openMul: 1.3, minDist: 3, tp: 0.20 },
};
export const SKILL_IDS = Object.keys(SKILLS);
export const SKILL_BY_MODEL = Object.fromEntries(SKILL_IDS.map((id) => [SKILLS[id].model, id]));
// uyarı süresi olan (yer işareti/windup üreten) beceriler
export const WARN_SKILLS = SKILL_IDS.filter((id) => SKILLS[id].warn > 0);

export const isOpen = (levelSkills, id) => Array.isArray(levelSkills) && levelSkills.includes(id);
// düşman tanımı (adapt edilmiş ENEMIES girdisi) + bölüm becerileri -> bu düşmanın becerisi (yoksa null)
export function skillFor(def, levelSkills) {
  const id = def && SKILL_BY_MODEL[def.model];
  return id && isOpen(levelSkills, id) ? id : null;
}

// ---- zamanlayıcı ----
// rnd: 0..1 üreten işlev. İlk bekleme aralıktan rastgele (sürü aynı anda başlamasın).
export function initSkill(id, rnd = Math.random) {
  const s = SKILLS[id], [a, b] = s.cdInit || [0, 0];
  return { id, cd: a + (b - a) * rnd(), state: "idle", t: 0, hit: false, marks: [], count: 0, vulnT: 0, vulnMul: 1 };
}
export const tickCd = (st, dt) => { st.cd = Math.max(0, st.cd - dt); return st.cd; };

// ---- yer işareti bütçesi ----
export const warnBudgetOk = (active, need) => active + need <= MAX_WARN_MARKS;

// ---- tetikleyici ----
// ctx: { dist (oyuncuya), hpRatio, slowed, allies (aynı modelden, oyuncuya near içinde, kendisi dahil), active (yer işareti), budget,
//        dead (revive: ölü kayıtları), now, live, cap, wind (şövalye yere vurma hazırlığı), slamCd }
export function canTrigger(id, st, ctx) {
  const s = SKILLS[id];
  if (!s || !st || st.state !== "idle" || st.cd > 0) return false;
  const need = id === "volley" ? s.count : WARN_SKILLS.includes(id) ? 1 : 0;
  if (need && !warnBudgetOk(ctx.active || 0, need)) return false;
  switch (id) {
    case "batDive": return !ctx.slowed && (ctx.allies || 0) >= s.minBats && ctx.dist < s.near;
    case "quake": return ctx.dist < s.trigger;
    case "volley": return !ctx.slowed && ctx.dist < s.maxDist;
    case "howl": return (ctx.allies || 0) >= s.minWolves || (ctx.hpRatio !== undefined && ctx.hpRatio < s.hpBelow);
    case "revive": return st.count < s.max && reviveAllowed(ctx.live || 0, ctx.cap || 0) && !!pickReviveTarget(ctx.dead, ctx.pos, ctx.now, s);
    case "leap": return (ctx.hpRatio ?? 1) < s.hpBelow && !(ctx.wind > 0) && (ctx.slamCd === undefined || ctx.slamCd > 1.2) && ctx.dist >= s.minDist;
    default: return false;
  }
}

// uyarı bitince: ateşlensin mi? (iptal kuralları) ctx: { ownerAlive, hit, slowed }
export function onWindupEnd(id, ctx) {
  const s = SKILLS[id];
  if (!ctx.ownerAlive) return { fire: false, reason: "dead" };
  if (s.cancelOnHit && ctx.hit) return { fire: false, reason: "hit" };
  if (id === "batDive" && ctx.slowed) return { fire: false, reason: "slow" }; // Buz yavaşlatmış yarasa dalamaz
  return { fire: true, reason: "" };
}

// ---- Ruh: Sis Perdesi ----
// -> { solidT, veiled }. Yaklaşınca (dist <= range) solid süre dolana kadar perde sürer; uzaklaşınca anında geri gelir.
export function veilStep(dist, solidT, dt) {
  const s = SKILLS.veil;
  const t = dist <= s.range ? Math.min(s.solid, solidT + dt) : 0;
  return { solidT: t, veiled: t < s.solid };
}
// perde bu elementi geçirmez mi? (Arcane/Ay Işığı deler; elementsiz hasar [Kor patlaması] perdeyi geçemez)
export const veilBlocks = (veiled, element) => !!veiled && !SKILLS.veil.pierce.includes(element);

// ---- Kor: Zincir Patlama ----
// embers: [{ x, z, fuse, dead }] -> patlayan kaynağın r içindeki, henüz fitili yanmamış Kor'lar
export function emberChainVictims(embers, ox, oz, self) {
  const s = SKILLS.emberChain;
  return embers.filter((o) => o !== self && !o.dead && !(o.fuse > 0) && Math.hypot(o.x - ox, o.z - oz) <= s.r);
}

// ---- Rahip: Diriltme ----
export const reviveAllowed = (live, cap) => live < cap;
// küçük müttefik: hp <= 2, kovalayıcı/hücumcu/okçu, ölürken patlamayan, daha önce diriltilmemiş
export const isReviveCandidate = (d, revived) => !revived && !!d && !d.static && d.hp <= 2 && ["chase", "charge", "ranged"].includes(d.ai);
// dead: [{ type, x, z, t, used }] -> rahibin near içindeki, son window sn'de ölen en yeni kayıt (yoksa null)
export function pickReviveTarget(dead, pos, now, s = SKILLS.revive) {
  if (!dead || !pos) return null;
  let best = null;
  for (const r of dead) {
    if (r.used || now - r.t > s.window || Math.hypot(r.x - pos.x, r.z - pos.z) > s.near) continue;
    if (!best || r.t > best.t) best = r;
  }
  return best;
}

// ---- Totem: Lanet Alanı + hasar çarpanları ----
// totems: [{ ref, x, z }] yaşayan aura taşıyıcılar; hedef aura taşıyıcının kendisi (ref === self) değilse alanda x0.6
export function auraMul(totems, x, z, self) {
  const s = SKILLS.aura;
  for (const t of totems) if (t.ref !== self && Math.hypot(t.x - x, t.z - z) <= s.r) return s.mul;
  return 1;
}
// toplam beceri hasar çarpanı: vulnT > 0 ise (Şövalye yorgun/açık an) vulnMul, ayrıca aura
export const skillDamageMul = (sk, aura = 1) => (sk && sk.vulnT > 0 ? sk.vulnMul : 1) * aura;

// ---- Okçu: Ok Yağmuru işaret noktaları ----
// oyuncunun hareket yönü (dx,dz birim) +lead önü merkez; yanlara spread. -> [{x,z}] (arena sınırına kırpılı)
export function volleyPoints(px, pz, dx, dz, arena) {
  const s = SKILLS.volley, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
  const cx = px + ux * s.lead, cz = pz + uz * s.lead, c = (v) => Math.max(-arena, Math.min(arena, v));
  const pts = [{ x: c(cx), z: c(cz) }];
  for (let i = 1; i < s.count; i++) { const sg = i % 2 ? 1 : -1; pts.push({ x: c(cx - uz * s.spread * sg), z: c(cz + ux * s.spread * sg) }); }
  return pts;
}

// ---- Kademeli tanıtma (doğrulayıcı) ----
// order: bölüm kimlikleri; levels: kimlik -> { skills? } -> [{ id, added: [beceri], dropped: [beceri] }] (yalnızca skills tanımlı bölümler)
export function skillSteps(levels, order) {
  const out = [];
  let prev = [];
  for (const id of order) {
    const L = levels && levels[id];
    if (!L || !Array.isArray(L.skills)) continue;
    out.push({ id, added: L.skills.filter((x) => !prev.includes(x)), dropped: prev.filter((x) => !L.skills.includes(x)) });
    prev = L.skills;
  }
  return out;
}
// bölüm girişinde yeni açılan beceriler (ipucu toast'ı için): şimdiki \ önceki
export const newSkills = (cur, prev) => (Array.isArray(cur) ? cur : []).filter((x) => !(Array.isArray(prev) ? prev : []).includes(x));
