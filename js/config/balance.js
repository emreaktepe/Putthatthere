// Denge modeli (docs/strateji/oyun-tasarimi-zorluk-ve-bolum-plani.md §3): düşman Tehdit Puanı (TP), bölüm 30 sn tehdit yükü (B30),
// oyuncu gücü P(n), zorluk endeksi Z ve tahmini ilk-deneme geçme oranı p.
// Saf: DOM/Three.js'e dokunmaz; ham (adapt edilmemiş) konfigürasyon üzerinde çalışır; doğrulayıcı, denge botu ve testler kullanır.
// UYARI: Tüm katsayılar VARSAYIMDIR (plan V3-V6); gerçek oyuncu/bot verisiyle kalibre edilmedi. Sonuçlar "sıralama aracı"dır, mutlak p değildir.

import { skillSteps } from "../game/skills.js";
import { hazardSteps } from "../game/hazards.js";

export const TP = { hpExp: 0.45, speedBase: 0.5, speedK: 0.25, ai: { chase: 1, ranged: 1.5, charge: 1.3, bomber: 1, support: 1.5, knight: 1.3, boss: 1.5 }, totem: 3.0 };
// "mesafe tutan / hücumlu" düşmanlar için etkin hız (plan §1.2 notu)
export const V_EFF = { charge: 3.4, ranged: 2.0, support: 1.5 };
export const OBJ_X = { crystal: 0.75, survive: 1, totem: 1, miniboss: 1.4, boss: 2.2 };
export const WEAPON_COEF = { fire: 1.0, frost: 1.05, arcane: 1.35, lightning: 2.0, poison: 1.5, meteor: 1.6, nova: 0.9 };
export const Z_MODEL = { z50: 2.5, s: 0.375, anchorB30: 7.4, anchorP: 3.0, anchorX: 0.75 };
export const A_ANCHOR = (Z_MODEL.anchorB30 * Z_MODEL.anchorX) / Z_MODEL.anchorP; // 1.85
export const CRYSTAL_SEC = 2.4; // V1: kristal başına süre (yetkin oyuncu)
export const TIME_SHARE = { min: 1.4, max: 2.2 }; // kristal bölümü: time / (goal x 2.4)
export const MOBILE_CAP = 12; // V14
export const START_CAP_RATIO = 1.5;
export const JUMP_MAX = 1.35;
export const JUMP_FLOOR_Z = 1.2;
// Aşama B: zorluğu STATİK modele değil, becerileri bilen denge botuna (tools/balance/sim.mjs) göre ayarlanmış bölümler. Statik TP modeli beceri baskısını
// ve bot kaçınmasını bilmez; bu bölümlerde Z sıçraması/monotonluk/tepe ve model-p bandı kuralları uygulanmaz (p >= 0.3 şartı sürer). Sayılar VARSAYIMDIR.
export const BOT_CALIBRATED = new Set(["w1-08"]); // ardışık Z sıçraması (sınav bölümleri hariç)

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const r1 = (x) => Math.round(x * 10 + 1e-9) / 10; // plan tablolarıyla aynı yuvarlama (1 ondalık)

// TP düzeltmesi (docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §2.4; benzetim, VARSAYIM): menzilden ölen, temas olmayan "hp<=1 kovalayıcı"
// tehdidi fazla puanlanıyordu. Yavaş (Ruh) 0.5, hızlı (Yarasa) 0.8.
export const Q_FACTOR = { slowChaser: 0.5, fastChaser: 0.8 };
const qFactor = (e) => (e.ai === "chase" && (e.hp || 1) <= 1 ? ((e.speed || 0) < 3 ? Q_FACTOR.slowChaser : Q_FACTOR.fastChaser) : 1);

// düşman tanımı (konfigürasyon biçimi) -> TP
export function enemyTP(e) {
  if (!isObj(e)) return 0;
  if (e.ai === "static") return TP.totem;
  const v = V_EFF[e.ai] !== undefined ? V_EFF[e.ai] : e.speed || 0;
  const raw = Math.pow(Math.max(e.hp || 1, 0.5), TP.hpExp) * (TP.speedBase + TP.speedK * v) * Math.max(e.dmg || 0, 1) * (TP.ai[e.ai] || 1) * qFactor(e);
  return r1(raw);
}

const sumTP = (counts, en) => Object.entries(counts || {}).reduce((a, [k, n]) => a + (typeof n === "number" && en[k] ? n * enemyTP(en[k]) : 0), 0);

// bölüm (konfigürasyon biçimi) -> { Bs, lambda, B30 }
export function levelThreat(cfg, L) {
  const en = cfg.enemies || {};
  const totems = L.objective === "totem" && Array.isArray(L.totems) ? L.totems.length : 0;
  const ghostLike = Object.keys(en).find((k) => en[k] && en[k].ai === "static" && en[k].summon);
  const summonTP = ghostLike && en[en[ghostLike].summon] ? enemyTP(en[en[ghostLike].summon]) : 0;
  const Bs = sumTP(L.start, en) + totems * TP.totem;
  const waves = Array.isArray(L.spawn) ? L.spawn : [];
  const avgWave = waves.length ? waves.reduce((a, w) => a + sumTP(w, en), 0) / waves.length : 0;
  const every = typeof L.every === "number" && L.every > 0 ? L.every : 1e9;
  let lambda = avgWave / every + (totems * summonTP) / 12;
  // Boss: faz çağrıları (plan §1.4: yaklaşık 0.49 TP/sn); sabit giriş
  const boss = Object.keys(L.start || {}).find((k) => en[k] && en[k].ai === "boss" && L.start[k] > 0);
  if (boss) lambda += bossSummonFlow(cfg, en[boss]);
  return { Bs: +Bs.toFixed(2), lambda: +lambda.toFixed(3), B30: +(Bs + 30 * lambda).toFixed(1) };
}
// boss çağrıları: faz1 6 sn'de summons1, faz2 6 sn'de summons2 (ai.js); ortalama iki fazın ortalaması
function bossSummonFlow(cfg, b) {
  const en = cfg.enemies || {};
  const f = (ids) => (ids || []).reduce((a, k) => a + (en[k] ? enemyTP(en[k]) : 0), 0) / 6;
  return (f(b.summons1) + f(b.summons2)) / 2;
}

// n = bu bölüme kadar yapılan perk seçimi sayısı (bölüm sırası: n = dizin)
export function playerPower(cfg, n, levels = null) {
  const game = cfg.game || {};
  const startHp = (cfg.player && cfg.player.startHp) || game.startHp || 3, cap = game.maxHpCap || 6;
  const order = (cfg.campaign && cfg.campaign.order) || Object.keys(cfg.levels || {});
  const unlockedW = new Set([(cfg.weaponOrder || [])[0]]), abil = new Set();
  for (let i = 0; i < n && i < order.length; i++) {
    const L = (levels || cfg.levels || {})[order[i]];
    if (!L) continue;
    if (L.reward) unlockedW.add(L.reward);
    if (L.ability) abil.add(L.ability);
  }
  const coefs = [...unlockedW].map((w) => WEAPON_COEF[w] || 1).sort((a, b) => b - a);
  const Wf = (coefs[0] || 1) + 0.05 * Math.min(4, Math.max(coefs.length - 1, 0));
  const Hp = Math.min(cap, startHp + 0.2 * n);
  const Pd = n <= 12 ? 1 + 0.05 * n : 1.6 + 0.025 * (n - 12);
  const D = Wf * Pd, Af = 1 + 0.12 * abil.size;
  return Hp * (1 + 0.35 * Math.log2(D)) * Af;
}

export const zIndex = (B30, X, P) => (B30 * X) / (A_ANCHOR * P);
export const passProb = (Z) => 1 / (1 + Math.exp((Math.log(Z) - Math.log(Z_MODEL.z50)) / Z_MODEL.s));
export const zForProb = (p) => Math.exp(Math.log(Z_MODEL.z50) + Z_MODEL.s * Math.log((1 - p) / p));
export const b30ForZ = (Z, X, P) => (Z * A_ANCHOR * P) / X;

// kampanya sırasındaki tüm bölümler için model tablosu
export function campaignBalance(cfg) {
  const order = (cfg.campaign && cfg.campaign.order) || [];
  return order.filter((id) => isObj((cfg.levels || {})[id])).map((id, i) => {
    const L = cfg.levels[id], t = levelThreat(cfg, L), X = OBJ_X[L.objective] || 1, P = playerPower(cfg, i);
    const Z = zIndex(t.B30, X, P);
    return { id, index: i, objective: L.objective, ...t, X, P: +P.toFixed(2), Z: +Z.toFixed(2), p: +passProb(Z).toFixed(2) };
  });
}

// ---- Aşama A (docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §2, §8.2) ----
export const MIN_KILLS_MAX_RATIO = 0.6; // minKills <= goal x 0.6
export const PLANNED_20S_MIN = 4; // ilk 20 sn'de planlanan (başlangıç + dalgalar, cap'e kırpılmış) düşman en az; savaşan bot gerçek A20'yi sim ölçer
const sumN = (o) => Object.values(o || {}).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
// ilk 20 sn'de sahaya girecek düşman sayısı (dalgalar ortalama büyüklükle; cap üst sınır; ölenler düşülmez: üst tahmin)
export function planned20(L) {
  const waves = Array.isArray(L.spawn) ? L.spawn : [], every = L.every > 0 ? L.every : 1e9;
  const avg = waves.length ? waves.reduce((a, w) => a + sumN(w), 0) / waves.length : 0;
  return Math.min(sumN(L.start) + Math.floor(20 / every) * avg, (L.cap || 99) + sumN(L.start));
}
// minKills'in beklenen arzı: başlangıç + zamanın izin verdiği dalgalar (üst tahmin)
export function killSupply(L) {
  const waves = Array.isArray(L.spawn) ? L.spawn : [], every = L.every > 0 ? L.every : 1e9;
  const avg = waves.length ? waves.reduce((a, w) => a + sumN(w), 0) / waves.length : 0;
  return sumN(L.start) + Math.floor((L.time || 0) / every) * avg;
}

// ---- doğrulayıcı kuralları (W_BALANCE) ----
// -> [{ path: [...], message }]; yalnızca gerçek sorunlar. Girdi bozuksa boş döner (yapı hataları başka yerde raporlanır).
export function balanceIssues(cfg) {
  const out = [];
  try {
    const lv = cfg.levels, order = cfg.campaign && cfg.campaign.order;
    if (!isObj(lv) || !Array.isArray(order) || !isObj(cfg.enemies)) return out;
    for (const id of Object.keys(lv)) {
      const L = lv[id];
      if (!isObj(L)) continue;
      if (L.objective === "crystal" && Number.isInteger(L.goal) && Number.isInteger(L.time)) {
        const base = L.goal * CRYSTAL_SEC, share = L.time / base;
        if (share < TIME_SHARE.min) out.push({ path: ["levels", id, "time"], message: `${L.goal} kristal x ${CRYSTAL_SEC} sn = ${Math.round(base)} sn; süre ${L.time} sn (payı ${share.toFixed(2)}x): süre baskısı fazla (en az ${TIME_SHARE.min}x önerilir)` });
        else if (share > TIME_SHARE.max) out.push({ path: ["levels", id, "time"], message: `${L.goal} kristal için süre ${L.time} sn (payı ${share.toFixed(2)}x): gevşek, süre baskısı yok (en çok ${TIME_SHARE.max}x önerilir)` });
      }
      if (L.objective === "crystal") {
        if (!(L.minKills > 0)) out.push({ path: ["levels", id, "start"], message: "Kristal bölümünde minKills yok: hiç ateş etmeden geçilebilir (ilk bölümler boş kalır)" });
        else {
          if (Number.isInteger(L.goal) && L.minKills > L.goal * MIN_KILLS_MAX_RATIO) out.push({ path: ["levels", id, "start"], message: `minKills ${L.minKills}: goal ${L.goal} x ${MIN_KILLS_MAX_RATIO} = ${Math.floor(L.goal * MIN_KILLS_MAX_RATIO)} üstünde (kristal akışı bekler)` });
          if (killSupply(L) < L.minKills * 1.3) out.push({ path: ["levels", id, "start"], message: `minKills ${L.minKills} için düşman arzı yetersiz olabilir (başlangıç + dalgalar ~${Math.round(killSupply(L))})` });
        }
      }
      if (!["miniboss", "boss", "survive"].includes(L.objective) && planned20(L) < PLANNED_20S_MIN) out.push({ path: ["levels", id, "start"], message: `İlk 20 sn'de planlanan düşman ~${planned20(L).toFixed(1)}: ekran boş kalabilir (en az ${PLANNED_20S_MIN} önerilir)` });
      if (Number.isInteger(L.cap) && L.cap > MOBILE_CAP) out.push({ path: ["levels", id, "cap"], message: `cap ${L.cap}: mobil için en çok ${MOBILE_CAP} önerilir` });
    }
    // Aşama B: kademeli tanıtma (bölümde ilk kez açılan beceri <= 1) ve beceri kümesi önceki bölümlerin üst kümesi
    for (const st of skillSteps(lv, order)) {
      if (st.added.length > 1) out.push({ path: ["levels", st.id, "skills"], message: `Bu bölümde ${st.added.length} beceri ilk kez açılıyor (${st.added.join(", ")}): kademeli tanıtma için bölüm başına en çok 1 yeni beceri önerilir` });
      if (st.dropped.length) out.push({ path: ["levels", st.id, "skills"], message: `Önceki bölümde açık olan beceri(ler) kapanıyor (${st.dropped.join(", ")}): beceri kümesi önceki bölümlerin üst kümesi olmalı` });
    }
    // Aşama C: çevre tehlikesi türleri kademeli tanıtılır (bölümde ilk kez görülen tür <= 1)
    for (const st of hazardSteps(lv, order)) {
      if (st.added.length > 1) out.push({ path: ["levels", st.id, "hazards"], message: `Bu bölümde ${st.added.length} çevre tehlikesi türü ilk kez görünüyor (${st.added.join(", ")}): kademeli tanıtma için bölüm başına en çok 1 yeni tür önerilir` });
    }
    const rows = campaignBalance(cfg);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i], L = lv[r.id];
      const total = Object.values(L.start || {}).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
      if (Number.isInteger(L.cap) && total > L.cap * START_CAP_RATIO) out.push({ path: ["levels", r.id, "start"], message: `Başlangıçta ${total} düşman var; cap ${L.cap} için fazla (en çok cap x ${START_CAP_RATIO})` });
      if (r.p < 0.3) out.push({ path: ["levels", r.id, "start"], message: `Model tahmini ilk-deneme geçme oranı ~%${Math.round(r.p * 100)} (Z ${r.Z}, B30 ${r.B30}): hedef bandın altında (yaklaşık model)` });
      if (i > 0 && r.objective !== "miniboss" && r.objective !== "boss" && !BOT_CALIBRATED.has(r.id)) {
        const prev = rows[i - 1];
        // giriş tabanı: önceki bölüm çok kolaysa (Z < JUMP_FLOOR_Z; ilk bölüm / nefes) oran yanıltıcıdır, sıçrama sayılmaz
        if (prev.Z >= JUMP_FLOOR_Z && r.Z / prev.Z > JUMP_MAX) out.push({ path: ["levels", r.id, "start"], message: `Zorluk sıçraması: Z ${prev.Z} -> ${r.Z} (x${(r.Z / prev.Z).toFixed(2)}); en çok x${JUMP_MAX} önerilir (yaklaşık model)` });
      }
    }
  } catch (e) { /* bozuk taslak: yapısal doğrulama zaten raporlar */ }
  return out;
}
