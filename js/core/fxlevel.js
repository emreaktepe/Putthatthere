// Savaş alanı gösterişinin düzeyi (Aşama C). SAF: DOM/Three bilmez; tarayıcı ipuçları dışarıdan verilir, Node'da test edilir.
// Düşük kalite (cihaz zayıf ya da oyuncu seçti) etkileri yarıya indirir/kapatır; prefers-reduced-motion hit-stop, sarsıntı ve kamera süpürmesini kapatır.
import { detectEnv, readQuality, resolveQuality } from "./quality.js";

// low: kalite "basic"; reduced: prefers-reduced-motion
export function fxProfile({ low = false, reduced = false } = {}) {
  return {
    low, reduced,
    hitStop: !low && !reduced, // 40-60 ms zaman donması
    shake: reduced ? 0 : low ? 0.5 : 1, // sarsıntı çarpanı
    sparkMul: low ? 0.5 : 1, // vuruş/ölüm parçacık çarpanı
    trailEvery: low || reduced ? 4 : 2, // mermi izi: kaç karede bir kıvılcım
    hazardMax: low ? 2 : 3, // eşzamanlı çevre tehlikesi
    rocks: low ? 2 : 4, // iç zemin kayaları
    spawnRings: low ? 2 : 3, // doğma uyarı halkaları (eşzamanlı; halka havuzu dolarsa düşman uyarısız çıkar)
    deathRing: !low,
    numbers: !low, // yüzen hasar sayısı
    sweep: !reduced, // bölüm başı kamera süpürmesi
    borderGlow: !low && !reduced,
  };
}

export function readFxProfile(g = globalThis) {
  let reduced = false;
  try { reduced = !!(g.matchMedia && g.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { /* eski tarayıcı */ }
  let pref = "auto";
  try { pref = readQuality(g.localStorage); } catch (e) { /* özel mod */ }
  return fxProfile({ low: resolveQuality(pref, detectEnv(g)) === "basic", reduced });
}

// Hit-stop süresi (sn). kill: öldürme; heavy: boss/şövalye/iri düşman; effective: matris "Etkili". Ardışık donmayı sınırlar (cooldown).
export const HITSTOP = { kill: 0.04, heavy: 0.06, cooldown: 0.35 };
export function hitStopFor({ profile, kill = false, heavy = false, effective = false, now = 0, last = -9 }) {
  if (!profile || !profile.hitStop) return 0;
  if (now - last < HITSTOP.cooldown) return 0;
  if (heavy && kill) return HITSTOP.heavy;
  if (kill && effective) return HITSTOP.kill;
  return 0;
}

// vuruş kıvılcımı sayısı: normal 5, Etkili 10 (belge 16 kısmen; mobilde yarım); sparkMul uygulanır
export const hitSparks = (profile, level) => Math.max(1, Math.round((level === "E" ? 10 : 5) * (profile ? profile.sparkMul : 1)));
