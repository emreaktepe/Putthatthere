// Sahne figürleri (Zerrin, Taşkın, Veyis-insan) için oyun tarafı saf mantık: nerede durur, ne zaman görünür, hangi modda çizilir.
// Three.js'e yalnızca modeller üzerinden bağlıdır (sahne/DOM yok); Node'da testlenir. Sahne yapıştırıcısı: props3d.js.
// Figürler savaşa katılmaz: çarpışması, hedeflenebilirliği, düşman sayacı/cap'i ve ışığı yoktur (yalnız görsel).
import { createTaskin } from "./models/taskin.js";
import { createVeyisInsan } from "./models/veyis-insan.js";
import { createZerrin } from "./models/zerrin.js";

// at: [x, z] arena (ARENA=14) dışı kenar; face: bakılan nokta (arena merkezi); r: dekorun bu çemberin içine yerleşmesini engelleyen yarıçap.
// Zerrin ve Taşkın kamera varsayılan açısında arka-sol / arka-sağ kenarda; ağaç/kaya (scenery.ringPos) bu alanlara kondurulmaz.
export const PROP_SPECS = {
  // lift: paket hatası düzeltmesi — Zerrin'in update() gövde yüksekliğini (.9) ezip 0'a çeker, baykuş dalın içine/altına gömülür; update'ten sonra geri eklenir
  zerrin: { create: createZerrin, scale: 1, lift: { part: "body", y: 0.9 }, at: [-16, -5.5], face: [0, 0], r: 3.4, shadow: 1.5 },
  taskin: { create: createTaskin, scale: 0.9, at: [16, -7.5], face: [0, 0], r: 3.4, shadow: 1.7 },
  veyis: { create: createVeyisInsan, scale: 0.85, at: null, face: null, r: 0, shadow: 1.3 }, // at: oynatıcının karşısı (props3d, finalde)
};
// update() sonrası düzeltme (spec.lift); her karede update'ten hemen sonra çağrılır
export function liftProp(vis, spec) {
  if (spec.lift) vis.parts[spec.lift.part].position.y += spec.lift.y;
}
export const PROP_IDS = Object.keys(PROP_SPECS);
// dekor yerleşiminde kaçınılacak daireler: [x, z, r]
export const RESERVED = ["zerrin", "taskin"].map((k) => [...PROP_SPECS[k].at, PROP_SPECS[k].r]);
export const reservedHit = (x, z) => RESERVED.some(([cx, cz, r]) => (x - cx) ** 2 + (z - cz) ** 2 < r * r);

export const TASKIN_UNLOCK = "w1-03"; // bu bölüm tamamlanınca Taşkın dost figür olur
export const FINAL_LEVEL = "w3-09";
// harabe sahnesindeki Taşkın heykeli (scenery.js) yalnız golems tamamlanmadan görünür; tamamlanınca canlı Taşkın figürü onun yerini alır
export const taskinStatueVisible = (completed) => !(completed instanceof Set ? completed : new Set(completed || [])).has(TASKIN_UNLOCK);

// phase: "none" (menü/harita) | "intro" (bölüm girişi) | "play" | "clear" (bölüm sonu) | "final" (zafer ekranı)
// quality: resolveQuality sonucu ("pro" | "basic"). Düşük kalitede ekran yükünü azaltmak için yalnız finaldeki Veyis gösterilir.
export function visibleProps({ phase, levelId, levelIds, completed, quality = "pro" }) {
  const out = [];
  if (phase === "none") return out;
  const done = completed instanceof Set ? completed : new Set(completed || []);
  const ix = levelIds.indexOf(levelId);
  if (quality !== "basic") {
    out.push("zerrin");
    const gi = levelIds.indexOf(TASKIN_UNLOCK);
    if (gi >= 0 && done.has(TASKIN_UNLOCK) && ix >= gi) out.push("taskin");
  }
  if (phase === "final" && levelId === FINAL_LEVEL) out.push("veyis");
  return out;
}

// bakış yönü: figürün +Z'si (ön) hedefe döner
export const faceYaw = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// Zerrin bölüm girişinde başını/gövdesini oyuncuya çevirir; diğer zamanlarda hafifçe arenadan yana bakar.
export const ZERRIN_AWAY = 0.9; // rad: dinlenme sapması
export function zerrinYawTarget(base, phase) { return phase === "intro" ? base : base + ZERRIN_AWAY; }
// dönüş sürerken model "windup" (baş eğilir/döner), aksi halde "idle"
export const zerrinMode = (err) => (Math.abs(err) > 0.12 ? "windup" : "idle");

// Taşkın ara sıra (≈ 8 sn'de bir, 1.6 sn) başını eğer: 0..1 yumuşak çan
export const NOD_PERIOD = 8, NOD_LEN = 1.6;
export function nodAmount(t) {
  const k = (((t % NOD_PERIOD) + NOD_PERIOD) % NOD_PERIOD) / NOD_LEN;
  return k >= 1 ? 0 : Math.sin(k * Math.PI) ** 2;
}
export const NOD_ANGLE = 0.32;

// Veyis finalde yumuşakça belirir: boss'un görsel ölümü (0.35 sn) bitince büyür
export const VEYIS_DELAY = 0.6, VEYIS_GROW = 1.2;
export function veyisGrow(sinceShown) {
  const k = Math.min(Math.max((sinceShown - VEYIS_DELAY) / VEYIS_GROW, 0), 1);
  return k * k * (3 - 2 * k);
}

// hafif yumuşak sönümleme (kare hızından bağımsız)
export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
export const angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
