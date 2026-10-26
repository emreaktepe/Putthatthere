// YAKLAŞIK denge simülasyonu (Node, headless, seed'li, deterministik). Plan §7.4.
//
// ÖNEMLİ SINIRLAMALAR (sonuçları bu yüzden "yaklaşık" etiketleyin; gerçek oyunun yerini TUTMAZ):
//  * Gerçek js/game/ai.js, loop.js, combat.js Three.js/DOM'a bağlı olduğu için İTHAL EDİLEMEZ. Bu dosya onların sabitlerini ve durum makinelerini
//    BASİTLEŞTİRİLMİŞ bir 2B modelde YENİDEN YAZAR (aynı sayılar: hızlar, süreler, yarıçaplar, dokunulmazlık, doğma kuralı). Saf modüller ithal edilir:
//    js/game/dda.js, js/game/damage.js, js/game/spawnmath.js, js/config/{validate,adapt}.js (perk ok/apply dahil).
//  * Mermi uçuş süresi yok (isabet anında hesaplanır, olasılıkla); isabet oranı bot profilinin parametresidir (VARSAYIM V2).
//  * Bot gerçek bir insan değildir: tepki süresi, kaçış, hedef seçimi basit kurallardır. Oyuncu bölüm başında tam canla ve kampanya sırasına göre
//    (n bölüm = n perk seçimi, bölüm ödülleriyle açılan büyü/yetenek) başlar; bölümler arası can taşıması YOKTUR (iyimser).
//  * Boss/mini-boss mekanikleri sadeleştirilmiştir (faz geçişleri, ışık toplama, yer halkaları var; animasyon/kamera/ses yok).
//  * Kalibrasyon yapılmamıştır: mutlak oranlar değil, bölümler arası SIRALAMA ve profiller arası fark anlamlıdır.
import fs from "node:fs";
import { adapt } from "../../js/config/adapt.js";
import { validate } from "../../js/config/validate.js";
import { mulberry } from "../../js/core/util.js";
import { ddaFor, scaledEvery, scaledStart } from "../../js/game/dda.js";
import { rollDamage } from "../../js/game/damage.js";
import { effectiveCap, pickSpawnPoint } from "../../js/game/spawnmath.js";

export const ARENA = 14;
export const DT = 1 / 30;
const PRIORITY = ["lightning", "arcane", "frost", "fire"];
const GREEDY = ["hp", "power", "haste", "pierce", "vampire", "speed", "stone", "magnet", "echo", "piril", "rain"];

// bot profilleri (VARSAYIM V2). acc: projektil isabet olasılığı tabanı; react: karar yenileme süresi (sn); fleeR: kaçış başlama mesafesi
export const PROFILES = {
  yuruyen: { id: "yuruyen", ad: "yürüyen", shoot: false, acc: 0, react: 0.15, fleeR: 3.6, smart: false, abil: false, greedy: false },
  orta: { id: "orta", ad: "orta", shoot: true, acc: 0.5, duty: 0.45, react: 0.25, fleeR: 3.2, smart: false, abil: false, shieldOnly: true, greedy: false },
  iyi: { id: "iyi", ad: "iyi", shoot: true, acc: 0.8, duty: 0.7, react: 0.1, fleeR: 4.2, smart: true, abil: true, greedy: true },
};

export function loadConfig(path = "data/game.config.json") {
  const raw = JSON.parse(fs.readFileSync(path, "utf8"));
  const r = validate(raw);
  if (r.errors.length) throw new Error("Konfigürasyon geçersiz: " + r.errors[0].message);
  return adapt(r.sanitized);
}

// ---- oyuncu donanımı: n bölüm öncesi perk/büyü/yetenek ----
function makeKit(A, idx, prof, rnd) {
  const hp = A.PLAYER.startHp ?? A.GAME.startHp;
  const S = { level: 0, hp, maxHp: hp, speedMul: 1, dmgMul: 1, cdMul: 1, magnet: 0, echo: 0, rain: 0, pierce: false, vampire: false, piril: false, stoneLevels: 0, perkCount: {}, lastPerk: "" };
  const weapons = new Set([A.WEAPON_ORDER[0]]), abil = new Set();
  for (let i = 0; i < idx; i++) {
    const L = A.LEVELS[i];
    if (L.reward) weapons.add(L.reward);
    if (L.ability) abil.add(L.ability);
    S.level = i + 1;
    const pool = A.PERKS.filter((p) => p.id !== S.lastPerk && p.ok(S)).sort(() => rnd() - 0.5).slice(0, A.GAME.perkChoices);
    if (!pool.length) continue;
    const pick = prof.greedy ? pool.slice().sort((a, b) => GREEDY.indexOf(a.id) - GREEDY.indexOf(b.id))[0] : pool[0];
    pick.apply(S);
    S.perkCount[pick.id] = (S.perkCount[pick.id] || 0) + 1;
    S.lastPerk = pick.id;
  }
  S.level = idx;
  S.hp = S.maxHp;
  return { S, weapons, abil };
}

const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// opts: { dda: ard arda ölüm sayısı (0 = yardım yok) }
export function simulate(A, idx, prof, seed, opts = {}) {
  const rnd = mulberry(seed >>> 0);
  const L = A.LEVELS[idx], E = A.ENEMIES;
  const { S, weapons, abil } = makeKit(A, idx, prof, rnd);
  const dda = ddaFor(opts.dda || 0, !!opts.dda);
  const cap = L.cap, every = scaledEvery(L.every, dda.spawnMul);
  const isFixed = (k) => ["boss", "knight", "static"].includes(E[k] && E[k].ai);
  const abP = (id) => (A.ABILITIES[id] && A.ABILITIES[id].params) || {};
  const abCd = { shield: 0, blink: 0, timeslow: 0 };
  const dmgSt = { carry: 0 };

  const P = { x: 0, z: 0 };
  let invuln = 1, shieldT = 0, timeslowT = 0, cooldown = 0, stoneReady = S.stoneLevels > 0 && rnd() < 0.5;
  if (dda.bonusHp) { S.maxHp += dda.bonusHp; S.hp += dda.bonusHp; }
  if (dda.startShield) shieldT = abP("shield").duration || 8;
  let timeLeft = L.objective === "survive" ? L.time : L.time * dda.timeMul;
  let elapsed = 0, hits = 0, dmgTaken = 0, kills = 0, collected = 0, totemsDown = 0, spawnTimer = 0, bossSummon = 5;
  let result = null, lastKill = 0;

  const enemies = [], eshots = [], pickups = [], clouds = [], strikes = [], hazards = [];
  const live = () => { let n = 0; for (const e of enemies) if (!e.d.noCap) n++; return n; };
  const crystalsWanted = L.crystals !== undefined ? L.crystals : L.objective === "crystal" ? 5 : 0;
  const rr = (r) => (rnd() * 2 - 1) * r;
  const crystal = () => pickups.push({ type: "crystal", x: rr(ARENA - 1.5), z: rr(ARENA - 1.5) });

  function spawn(type, at) {
    const d = E[type];
    const sp = at || pickSpawnPoint(P, rnd, ARENA);
    const e = { type, d, x: sp.x, z: sp.z, hp: d.hp, maxHp: d.hp, slow: 0, shield: 0, phase: rnd() * 10, age: 0, cd: 0, st: "approach", tm: 0, fuse: 0, wind: 0, spd: d.speed, enraged: false, bp: 1, shielded: false, vuln: 0, waveT: 8, kx: 0, kz: 0, vx: 0, vz: 0, cx: 0, cz: 0, dead: false, exploded: false };
    if (d.ai === "ranged") e.cd = 1 + rnd() * 1.5;
    if (d.ai === "support") e.cd = 2 + rnd() * 2;
    if (d.ai === "static") e.cd = 12;
    if (d.ai === "knight") e.cd = 4;
    enemies.push(e);
    return e;
  }

  function hitPlayer(n) {
    if (result) return;
    if (shieldT > 0) { shieldT = 0; invuln = 0.6; return; }
    if (stoneReady) { n *= 0.5; stoneReady = false; }
    S.hp -= n; hits++; dmgTaken += n; invuln = 1.5;
    if (S.hp <= 0) result = { win: false, cause: "dead" };
  }

  function kill(e) {
    if (e.dead) return;
    e.dead = true;
    lastKill = elapsed;
    const i = enemies.indexOf(e);
    if (i >= 0) enemies.splice(i, 1);
    if (e.d.ai === "bomber" && !e.exploded) explode(e);
    if (e.d.ai === "support") for (const o of enemies) if (d2(o.x, o.z, e.x, e.z) < 8) o.shield = 0;
    if (!e.suicide) {
      if (!e.d.static) { kills++; if (S.vampire && kills % 12 === 0 && S.hp < S.maxHp) S.hp++; }
      if (rnd() < e.d.drop * dda.heartMul) pickups.push({ type: "heart", x: e.x, z: e.z });
    }
    if (e.d.ai === "static") { totemsDown++; if (totemsDown >= L.goal && !result) result = { win: true, cause: "win" }; }
    if ((e.d.ai === "boss" || e.d.ai === "knight") && !result) result = { win: true, cause: "win" };
  }
  function explode(e) {
    e.exploded = true;
    if (invuln <= 0 && d2(e.x, e.z, P.x, P.z) < 2.5) hitPlayer(1);
    for (const o of [...enemies]) if (o !== e && !o.dead && d2(o.x, o.z, e.x, e.z) < 2.5) hurt(o, 1, false, false);
  }
  function hurt(e, dmg, slow, bypass) {
    if (e.dead) return;
    if (e.shielded) return;
    if (e.shield > 0 && !bypass) { e.shield = 0; return; }
    e.hp -= dmg;
    if (e.d.ai === "boss" && e.bp < 3) e.hp = Math.max(e.hp, e.maxHp * (e.bp === 1 ? 0.66 : 0.33) - 0.001);
    if (slow) e.slow = 3;
    if (!e.d.static && e.d.ai !== "boss" && e.d.ai !== "knight") { const l = d2(e.x, e.z, P.x, P.z) || 1; e.kx = ((e.x - P.x) / l) * 3; e.kz = ((e.z - P.z) / l) * 3; }
    if (e.hp <= 0) kill(e);
  }

  // ---- başlangıç ----
  for (let i = 0; i < crystalsWanted; i++) crystal();
  for (const [type, n] of Object.entries(scaledStart(L.start, dda.startMul, isFixed))) for (let i = 0; i < n; i++) spawn(type);
  if (L.objective === "totem") { const tid = Object.keys(E).find((k) => E[k].ai === "static"); for (const [x, z] of L.totems) spawn(tid, { x, z }); }
  const primary = () => PRIORITY.find((w) => weapons.has(w)) || A.WEAPON_ORDER[0];

  // ---- bot kararı ----
  let dirX = 0, dirZ = 0, decideT = 0;
  function nearestOf(list, filter) {
    let best = null, bd = 1e9;
    for (const o of list) { if (filter && !filter(o)) continue; const d = d2(o.x, o.z, P.x, P.z); if (d < bd) { bd = d; best = o; } }
    return best ? { o: best, d: bd } : null;
  }
  function decide() {
    let ax = 0, az = 0;
    // çekim hedefi
    let tgt = null;
    const boss = enemies.find((e) => e.d.ai === "boss");
    if (boss && boss.shielded) tgt = nearestOf(pickups, (p) => p.type === "light");
    if (!tgt && L.objective === "crystal") tgt = nearestOf(pickups, (p) => p.type === "crystal");
    if (!tgt && (prof.smart || S.hp < S.maxHp) && S.hp < S.maxHp) { const h = nearestOf(pickups, (p) => p.type === "heart"); if (h && h.d < 7) tgt = h; }
    if (!tgt && prof.shoot) {
      if (L.objective === "totem") { const t = nearestOf(enemies, (e) => e.d.ai === "static"); if (t && t.d > 9) tgt = t; }
      if (L.objective === "miniboss" || L.objective === "boss") { const b = nearestOf(enemies, (e) => e.d.ai === "knight" || (e.d.ai === "boss" && !e.shielded)); if (b && b.d > 9) tgt = b; }
    }
    if (tgt) { const l = tgt.d || 1; ax = (tgt.o.x - P.x) / l; az = (tgt.o.z - P.z) / l; }
    else if (Math.hypot(P.x, P.z) > 7) { ax = -P.x / 14; az = -P.z / 14; }
    // kaçış
    let rx = 0, rz = 0;
    for (const e of enemies) {
      if (e.d.static) continue;
      const big = e.d.ai === "knight" || e.d.ai === "boss";
      const R = prof.fleeR + e.d.r + (e.d.ai === "charge" && (e.st === "crouch" || e.st === "charge") ? 2.5 : 0) + (big ? 2 : 0) + (e.d.ai === "bomber" ? 1.5 : 0);
      const d = d2(e.x, e.z, P.x, P.z);
      if (d < R && d > 1e-4) { const w = ((R - d) / R) * 2.2; rx += ((P.x - e.x) / d) * w; rz += ((P.z - e.z) / d) * w; }
    }
    for (const s of eshots) {
      const d = d2(s.x, s.z, P.x, P.z);
      if (d < 5 && (prof.smart || rnd() < 0.5)) { // yana kaçış: merminin yönüne dik
        const cross = s.vx * (P.z - s.z) - s.vz * (P.x - s.x), sg = cross >= 0 ? 1 : -1;
        const l = Math.hypot(s.vx, s.vz) || 1;
        rx += (-s.vz / l) * sg * 1.4; rz += (s.vx / l) * sg * 1.4;
      }
    }
    for (const h of hazards) {
      const d = d2(h.x, h.z, P.x, P.z);
      if (h.dmg > 0 && d < h.r + 1.2 && (prof.smart || h.seen) && d > 1e-4) { rx += ((P.x - h.x) / d) * 2.5; rz += ((P.z - h.z) / d) * 2.5; }
    }
    if (Math.abs(P.x) > 10.5) rx -= Math.sign(P.x) * ((Math.abs(P.x) - 10.5) / 3) * 1.5;
    if (Math.abs(P.z) > 10.5) rz -= Math.sign(P.z) * ((Math.abs(P.z) - 10.5) / 3) * 1.5;
    let vx = ax + rx, vz = az + rz;
    const rl = Math.hypot(rx, rz);
    if (rl > 0.8) { vx = rx + ax * 0.3; vz = rz + az * 0.3; }
    const l = Math.hypot(vx, vz);
    if (l > 1) { vx /= l; vz /= l; }
    dirX = vx; dirZ = vz;
  }

  function useAbilities() {
    if (!prof.abil && !prof.shieldOnly) return;
    const near = (r, f) => { let n = 0; for (const e of enemies) if (!e.d.static && d2(e.x, e.z, P.x, P.z) < r && (!f || f(e))) n++; return n; };
    if (abil.has("shield") && abCd.shield <= 0 && shieldT <= 0) {
      const need = prof.abil ? near(3.5) > 0 || eshots.some((s) => d2(s.x, s.z, P.x, P.z) < 3.5) : S.hp <= 1 && near(3) > 0;
      if (need) { shieldT = abP("shield").duration || 8; abCd.shield = A.ABILITIES.shield.cd; }
    }
    if (!prof.abil) return;
    if (abil.has("blink") && abCd.blink <= 0 && (near(1.8) > 0 || near(5, (e) => e.d.ai === "charge" && (e.st === "crouch" || e.st === "charge")) > 0)) {
      let fx = 0, fz = 0;
      for (const e of enemies) { const d = d2(e.x, e.z, P.x, P.z); if (!e.d.static && d < 6 && d > 1e-4) { fx += (P.x - e.x) / d; fz += (P.z - e.z) / d; } }
      const l = Math.hypot(fx, fz) || 1;
      const dist = abP("blink").dist || 5;
      P.x = clamp(P.x + (fx / l) * dist, -ARENA + 0.5, ARENA - 0.5); P.z = clamp(P.z + (fz / l) * dist, -ARENA + 0.5, ARENA - 0.5);
      invuln = Math.max(invuln, abP("blink").iframes ?? 0.4); abCd.blink = A.ABILITIES.blink.cd;
    }
    if (abil.has("timeslow") && abCd.timeslow <= 0 && (near(7) >= 4 || enemies.some((e) => e.d.ai === "boss" && e.bp >= 2))) { timeslowT = abP("timeslow").duration || 3; abCd.timeslow = A.ABILITIES.timeslow.cd; }
  }

  function shoot() {
    if (!prof.shoot || cooldown > 0) return;
    let tgt = null, bd = 1e9;
    for (const e of enemies) {
      if (e.dead) continue;
      let d = d2(e.x, e.z, P.x, P.z);
      if (d > 20) continue;
      if (prof.smart && d < 14) { if (e.d.ai === "bomber" || e.d.ai === "ranged" || e.d.ai === "support") d -= 3; if (e.d.static) d += 2; }
      if (d < bd) { bd = d; tgt = e; }
    }
    if (!tgt) return;
    const dist = d2(tgt.x, tgt.z, P.x, P.z);
    let wid = primary();
    if (prof.smart) {
      if (weapons.has("meteor") && tgt.maxHp >= 4 && dist > 3.5 && dist < 16 && !tgt.shielded && cooldown <= 0) wid = "meteor";
      else if (weapons.has("nova")) { let c = 0; for (const e of enemies) if (!e.d.static && d2(e.x, e.z, P.x, P.z) < 3.8) c++; if (c >= 3) wid = "nova"; }
    }
    const w = A.WEAPONS[wid];
    cooldown = (w.cd * S.cdMul) / (prof.duty || 1); // duty: kaçarken/nişan alırken atış kaybı (VARSAYIM)
    const times = S.echo > 0 && rnd() < S.echo ? 2 : 1;
    for (let k = 0; k < times; k++) cast(w, wid, tgt, dist);
  }
  function cast(w, wid, tgt, dist) {
    const dmg = rollDamage(w.dmg, S.dmgMul, dmgSt);
    if (w.chain) {
      const list = enemies.filter((e) => d2(e.x, e.z, P.x, P.z) <= w.range).sort((a, b) => d2(a.x, a.z, P.x, P.z) - d2(b.x, b.z, P.x, P.z)).slice(0, w.chain);
      for (const e of list) hurt(e, dmg, false, false);
    } else if (w.nova) {
      for (const e of [...enemies]) {
        if (e.dead || d2(e.x, e.z, P.x, P.z) > w.nova.r + e.d.r * 0.5) continue;
        hurt(e, dmg, false, false);
        if (!e.dead && !e.d.static && e.d.ai !== "boss" && e.d.ai !== "knight") { const l = d2(e.x, e.z, P.x, P.z) || 1; e.x = clamp(e.x + ((e.x - P.x) / l) * w.nova.push, -ARENA - 1, ARENA + 1); e.z = clamp(e.z + ((e.z - P.z) / l) * w.nova.push, -ARENA - 1, ARENA + 1); }
      }
    } else if (w.meteor) {
      const lead = prof.smart ? w.meteor.delay : 0;
      strikes.push({ x: clamp(tgt.x + tgt.vx * lead, -ARENA, ARENA), z: clamp(tgt.z + tgt.vz * lead, -ARENA, ARENA), t: w.meteor.delay, r: w.meteor.r, dmg });
    } else if (w.cloud) {
      const miss = rnd() > prof.acc;
      clouds.push({ x: tgt.x + (miss ? rr(2.5) : 0), z: tgt.z + (miss ? rr(2.5) : 0), life: w.cloud.life, tick: 0, r: w.cloud.r, dmg });
    } else {
      let p = prof.acc * (dist <= 10 ? 1 : Math.max(0.4, 1 - (dist - 10) * 0.06));
      if (tgt.d.zig) p *= 0.75;
      if (tgt.d.ai === "charge" && tgt.st === "charge") p *= 0.7;
      const pellets = w.spread ? [1, dist < 9 ? 0.7 : 0, dist < 6 ? 0.5 : 0] : [1];
      for (const q of pellets) {
        if (q > 0 && rnd() < p * q) {
          hurt(tgt, dmg, !!w.slow, false);
          if (S.pierce && w.pierceable && rnd() < 0.5) { const o = enemies.find((e) => e !== tgt && !e.dead && d2(e.x, e.z, tgt.x, tgt.z) < 3); if (o) hurt(o, dmg, !!w.slow, false); }
        }
      }
    }
  }

  // ---- düşman yapay zekâsı (ai.js'in sade modeli) ----
  function updateEnemies(dt, es) {
    for (const e of [...enemies]) {
      if (e.dead) continue;
      const d = e.d;
      e.slow = Math.max(e.slow - dt, 0); e.age += dt;
      const ts = es * (e.slow > 0 ? 0.35 : 1), edt = dt * ts;
      const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || 1e-4, ux = dx / dist, uz = dz / dist;
      if (e.shield > 0) e.shield = Math.max(e.shield - dt, 0);
      let mx = 0, mz = 0;
      switch (d.ai) {
        case "chase": {
          let cx = ux, cz = uz;
          if (d.zig) { const a = Math.sin(elapsed * 5 + e.phase) * 0.9, c = Math.cos(a), s = Math.sin(a); cx = ux * c + uz * s; cz = -ux * s + uz * c; }
          mx = cx * e.spd; mz = cz * e.spd; break;
        }
        case "ranged": {
          const want = dist > 9 ? 1 : dist < 7 ? -1 : 0;
          mx = ux * e.spd * want; mz = uz * e.spd * want;
          e.cd -= edt;
          if (e.cd <= 0) { e.cd = 2.5; eshots.push({ x: e.x, z: e.z, vx: ux * 7, vz: uz * 7, life: 4 }); }
          break;
        }
        case "charge":
          if (e.st === "approach") { mx = ux * e.spd; mz = uz * e.spd; if (dist < 6) { e.st = "crouch"; e.tm = 0.7; } }
          else if (e.st === "crouch") { e.tm -= edt; if (e.tm <= 0) { e.st = "charge"; e.tm = 0.6; e.cx = ux; e.cz = uz; } }
          else if (e.st === "charge") { mx = e.cx * 10; mz = e.cz * 10; e.tm -= edt; if (e.tm <= 0) { e.st = "tired"; e.tm = 1; } }
          else { mx = ux * e.spd * 0.3; mz = uz * e.spd * 0.3; e.tm -= edt; if (e.tm <= 0) e.st = "approach"; }
          break;
        case "bomber":
          if (e.fuse > 0) { e.fuse -= edt; if (e.fuse <= 0) { e.suicide = true; kill(e); continue; } }
          else { mx = ux * e.spd; mz = uz * e.spd; if (dist < 1.5) e.fuse = 0.5; }
          break;
        case "support": {
          const want = dist < 8 ? -1 : dist > 12 ? 1 : 0;
          mx = ux * e.spd * want; mz = uz * e.spd * want;
          e.cd -= edt;
          if (e.cd <= 0) {
            e.cd = 4;
            const near = enemies.filter((o) => o !== e && !o.dead && !o.d.static && o.d.ai !== "boss" && o.d.ai !== "knight").sort((a, b) => d2(a.x, a.z, e.x, e.z) - d2(b.x, b.z, e.x, e.z)).slice(0, 3);
            let weak = null;
            for (const o of near) { o.shield = 6; if (o.hp < o.maxHp && (!weak || o.hp < weak.hp)) weak = o; }
            if (weak) weak.hp = Math.min(weak.hp + 1, weak.maxHp);
          }
          break;
        }
        case "static":
          e.cd -= edt;
          if (e.cd <= 0) { e.cd = 12; if (d.summon && live() < cap + 3) spawn(d.summon, { x: e.x + rr(1.5), z: e.z + rr(1.5) }); }
          break;
        case "knight":
          if (!e.enraged && e.hp <= e.maxHp * 0.5) { e.enraged = true; e.spd = 1.6; e.cd = 0; }
          if (e.wind > 0) e.wind -= edt;
          else {
            mx = ux * e.spd; mz = uz * e.spd; e.cd -= edt;
            if (e.cd <= 0) { e.cd = 5; e.wind = 1; hazards.push({ x: e.x, z: e.z, r: 4, t: 1, dmg: 2, seen: rnd() < 0.6 }); }
          }
          break;
        case "boss": bossLogic(e, dt, es); mx = ux * e.spd; mz = uz * e.spd; break;
      }
      const ox = e.x, oz = e.z;
      e.x = clamp(e.x + mx * edt + e.kx * dt, -ARENA - 1, ARENA + 1);
      e.z = clamp(e.z + mz * edt + e.kz * dt, -ARENA - 1, ARENA + 1);
      const kd = Math.exp(-dt * 10); e.kx *= kd; e.kz *= kd;
      e.vx = (e.x - ox) / dt; e.vz = (e.z - oz) / dt;
      if (d.dmg > 0 && invuln <= 0 && dist < d.r + 0.5) { hitPlayer(d.dmg); if (result) return; }
    }
  }
  function bossLogic(e, dt, es) {
    const ratio = e.hp / e.maxHp, ph = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (ph > e.bp) {
      e.bp = ph; timeLeft += 10;
      if (ph === 2) { e.waveT = 3; bossSummon = 2; } else { e.shielded = true; e.vuln = 0; for (let i = 0; i < 3; i++) pickups.push({ type: "light", x: rr(ARENA - 2.5), z: rr(ARENA - 2.5) }); }
    }
    const edt = dt * es;
    if (e.bp === 1) { bossSummon -= edt; if (bossSummon <= 0) { bossSummon = 6; for (const id of e.d.summons1 || []) if (live() < cap) spawn(id); } }
    else if (e.bp === 2) {
      bossSummon -= edt;
      if (bossSummon <= 0) { bossSummon = 6; for (const id of e.d.summons2 || []) if (live() < cap) spawn(id); }
      e.waveT -= edt;
      if (e.waveT <= 0) { e.waveT = 8; hazards.push({ x: P.x, z: P.z, r: 2.6, t: 1.2, dmg: 1, seen: rnd() < 0.6 }); hazards.push({ x: clamp(P.x + rr(7), -ARENA, ARENA), z: clamp(P.z + rr(7), -ARENA, ARENA), r: 2.6, t: 1.2, dmg: 1, seen: rnd() < 0.6 }); }
    } else if (e.shielded) {
      if (!pickups.some((p) => p.type === "light")) { e.shielded = false; e.vuln = 6; e.spd *= 1.1; }
    } else { e.vuln -= dt; if (e.vuln <= 0) { e.shielded = true; for (let i = 0; i < 3; i++) pickups.push({ type: "light", x: rr(ARENA - 2.5), z: rr(ARENA - 2.5) }); } }
  }

  // ---- ana döngü ----
  const maxSteps = Math.ceil((L.time * 1.2 + 60) / DT) + 4000;
  for (let step = 0; step < maxSteps && !result; step++) {
    const dt = DT;
    elapsed += dt; cooldown -= dt; invuln -= dt;
    for (const k of Object.keys(abCd)) abCd[k] = Math.max(abCd[k] - dt, 0);
    shieldT = Math.max(shieldT - dt, 0); timeslowT = Math.max(timeslowT - dt, 0);
    const es = timeslowT > 0 ? abP("timeslow").factor || 0.4 : 1;

    decideT -= dt;
    if (decideT <= 0) { decide(); decideT = prof.react; useAbilities(); }
    const sp = 8 * (A.PLAYER.speedMul || 1) * S.speedMul * dt;
    P.x = clamp(P.x + dirX * sp, -ARENA + 0.5, ARENA - 0.5); P.z = clamp(P.z + dirZ * sp, -ARENA + 0.5, ARENA - 0.5);
    shoot();

    updateEnemies(dt, es);
    if (result) break;

    for (let i = eshots.length - 1; i >= 0; i--) {
      const s = eshots[i];
      s.x += s.vx * dt * es; s.z += s.vz * dt * es; s.life -= dt * es;
      let gone = s.life <= 0 || Math.abs(s.x) > ARENA + 2 || Math.abs(s.z) > ARENA + 2;
      if (!gone && invuln <= 0 && d2(s.x, s.z, P.x, P.z) < 0.8) { gone = true; hitPlayer(1); }
      if (gone) eshots.splice(i, 1);
      if (result) break;
    }
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.life -= dt; c.tick -= dt;
      if (c.tick <= 0) { c.tick = 0.5; for (const e of [...enemies]) if (!e.dead && d2(e.x, e.z, c.x, c.z) < c.r + e.d.r * 0.5) hurt(e, c.dmg * 0.5, false, true); }
      if (c.life <= 0) clouds.splice(i, 1);
    }
    for (let i = strikes.length - 1; i >= 0; i--) {
      const s = strikes[i];
      s.t -= dt;
      if (s.t <= 0) { strikes.splice(i, 1); for (const e of [...enemies]) if (!e.dead && d2(e.x, e.z, s.x, s.z) < s.r + e.d.r * 0.5) hurt(e, s.dmg, false, false); }
    }
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.t -= dt * es;
      if (h.t <= 0) { hazards.splice(i, 1); if (h.dmg > 0 && invuln <= 0 && d2(P.x, P.z, h.x, h.z) < h.r) hitPlayer(h.dmg); }
    }
    if (result) break;

    const pr = 1.2 + (S.piril ? 0.5 : 0);
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      const d = d2(p.x, p.z, P.x, P.z);
      if (S.magnet && d < S.magnet && d > 1e-4) { p.x += ((P.x - p.x) / d) * 9 * dt; p.z += ((P.z - p.z) / d) * 9 * dt; }
      if (d < pr) {
        pickups.splice(i, 1);
        if (p.type === "heart") S.hp = Math.min(S.hp + 1, S.maxHp);
        else if (p.type === "crystal") {
          if (pickups.filter((q) => q.type === "crystal").length < crystalsWanted) crystal();
          if (L.objective === "crystal") {
            collected++;
            if (S.rain && rnd() < S.rain) collected++;
            if (collected >= L.goal) { result = { win: true, cause: "win" }; break; }
          } else if (rnd() < 0.35 * dda.heartMul) pickups.push({ type: "heart", x: p.x, z: p.z });
        }
      }
    }
    if (result) break;

    if (L.spawn.length) {
      spawnTimer += dt;
      const capNow = effectiveCap(cap, L.objective, elapsed - lastKill);
      if (spawnTimer > every && live() < capNow) {
        spawnTimer = 0;
        const wave = L.spawn[Math.floor(rnd() * L.spawn.length)];
        for (const [type, n] of Object.entries(wave)) for (let k = 0; k < n; k++) if (live() < capNow) spawn(type);
      }
    }
    timeLeft -= dt;
    if (timeLeft <= 0) { result = L.objective === "survive" ? { win: true, cause: "win" } : { win: false, cause: "timeout" }; }
  }
  if (!result) result = { win: false, cause: "timeout" };
  return { ...result, sec: elapsed, hits, dmg: dmgTaken, hpEnd: S.hp };
}

// N koşu -> özet. seed'ler (bölüm, profil, koşu) üçlüsünden türetilir: aynı girdi = aynı sonuç
export function runMany(A, idx, prof, N = 200, seed = 1, opts = {}) {
  const off = Object.keys(PROFILES).indexOf(prof.id) * 99991 + idx * 7919;
  let win = 0, timeout = 0, dead = 0, secWin = 0, secAll = 0, hits = 0, dmg = 0;
  for (let k = 0; k < N; k++) {
    const r = simulate(A, idx, prof, seed * 1000003 + off + k * 15485863, opts);
    if (r.win) { win++; secWin += r.sec; } else if (r.cause === "timeout") timeout++; else dead++;
    secAll += r.sec; hits += r.hits; dmg += r.dmg;
  }
  return { n: N, winRate: win / N, timeoutRate: timeout / N, deathRate: dead / N, avgSecWin: win ? secWin / win : null, avgSec: secAll / N, avgHits: hits / N, avgDmg: dmg / N };
}
