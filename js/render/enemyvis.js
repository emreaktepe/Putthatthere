// Düşman 3B modelleri (Core6 Pro paketi) için oyun tarafı yapıştırıcı: hangi model ne ölçek/ofsetle çizilir, oyun durumu -> model modu.
// Three.js'e yalnızca modeller üzerinden bağlıdır (sahne/DOM yok); Node'da testlenir. Bağlantı: enemies.js (buildEnemy), ai.js, combat.js.
import { createArcher } from "./models/archer.js";
import { createBat } from "./models/bat.js";
import { createBoss } from "./models/boss.js";
import { createEmber } from "./models/ember.js";
import { createGhost } from "./models/ghost.js";
import { createGolem } from "./models/golem.js";
import { createKnight } from "./models/knight.js";
import { createPriest } from "./models/priest.js";
import { createTotem } from "./models/totem.js";
import { createWolf } from "./models/wolf.js";

// Düşman gövdesi ölçeği = scale * d.scale (obj ölçeği; eski modellerdeki `d.r * d.scale` yerine). Çarpışma d.r ile oyunda sabit kalır.
// cy: modelin (yerel birim) obj orijinine oturacak yüksekliği. Eski görsel obj orijinini (= config y) gövde merkezi saydığı için
//     cy = modelin dikey merkezi; böylece config `y` ve eski silueti korunur.
// grounded: yere basan model; `bob` salınımı görselden düşülür (golem/boss havada sallanmasın), çarpışma konumu (mesh.position) değişmez.
// shadow: gerçek gölge geçişine girer (yalnız boss; diğerleri zaten yumuşak "blob" gölge kullanıyor, eski modellerle aynı).
//  ghost  : model boyu ~1.6 (0.3-1.9), eski ~1.6 (0.47-2.09)  -> ölçek 1
//  bat    : kanat açıklığı ~2.6, boy ~1.0, eski ~2.4 / ~1.0; gövde merkezi y≈0 (paketin update'i body.y'yi 0 civarına kurar, 1.58 yalnız ilk değer) -> ölçek 1
//  golem  : boy ~2.4, eski ~2.5 (r=1.2)                          -> ölçek 1
//  boss   : boy ~4.0, eski ~5.0 (r=2.2, kalkan küresi ~2.9)      -> ölçek 1.3 (boy ~5.2, yarım genişlik ~1.65)
//  Full12 v2 modelleri (Node'da ölçüldü; boy = y aralığı; "eski" = prosedürel modelin d.r*size ile yaklaşık boyu):
//  archer : model 0.06-2.17 (boy 2.1), eski ~1.9 (r=0.6)                    -> ölçek 0.9, cy 1.15: ayaklar y=1.0'da zemine oturur
//  wolf   : model 0.08-1.47 (boy 1.4, uzunluk 2.6), eski ~1.2 x 2.8 (r=0.7) -> ölçek 1, cy 0.78 (ayaklar zeminde)
//  ember  : model 0.12-1.70 (boy 1.6, genişlik 1.7), eski ~0.9 x 1.8 (r=0.7)-> ölçek 0.85 (genişlik 1.45 ~ 2r), cy 0.91; havada süzülür
//  priest : model 0.17-2.64 (boy 2.5, genişlik 2.2), eski ~2.4 x 1.9 (r=0.9)-> ölçek 0.85, cy 1.35: cüppe zemine değer, bob'la süzülür
//  totem  : model 0-2.52 (boy 2.5, genişlik 1.7), eski ~4.0 x 2.4 (r=1.0)   -> ölçek 1.25 (boy 3.15, taban 2.1), cy 1.28: taban zeminde
//  knight : model 0.01-3.53 (boy 3.5, genişlik 2.5), eski ~3.2 x 2.4 (r=1.5)-> ölçek 0.9 (boy 3.2), cy 1.34: ayaklar zeminde (obj orijini göğüs altı)
// Yere basanlar (archer/wolf/totem/knight) `grounded`: bob görselden düşülür (ayak kayması yok). Şövalyenin kontak "blob" gölgesi yok: gerçek gölge (shadow).
export const ENEMY_VIS = {
  ghost: { create: createGhost, scale: 1, cy: 1.1, grounded: false, shadow: false },
  bat: { create: createBat, scale: 1, cy: 0.06, grounded: false, shadow: false },
  golem: { create: createGolem, scale: 1, cy: 1.2, grounded: true, shadow: false },
  boss: { create: createBoss, scale: 1.3, cy: 1.77, grounded: true, shadow: true },
  archer: { create: createArcher, scale: 0.9, cy: 1.15, grounded: true, shadow: false },
  wolf: { create: createWolf, scale: 1, cy: 0.78, grounded: true, shadow: false },
  ember: { create: createEmber, scale: 0.85, cy: 0.91, grounded: false, shadow: false },
  priest: { create: createPriest, scale: 0.85, cy: 1.35, grounded: false, shadow: false },
  totem: { create: createTotem, scale: 1.25, cy: 1.28, grounded: true, shadow: false },
  knight: { create: createKnight, scale: 0.9, cy: 1.34, grounded: true, shadow: true },
};

export const DEATH_TIME = 0.35; // ölüm animasyonu süresi (sn); oynanış anında işlenir, yalnız görsel bu kadar kalır

// Oyun durumu -> model modu. Öncelik: ölüm > vuruş > saldırı anı > saldırı öncesi uyarı > hareket.
//  e.dying: ölüm animasyonu; e.hurtT: hasar alınca kısa süre; e.atkT: saldırı anı (temas hasarı, boss dalgası/çağrı);
//  e.windT: saldırı öncesi uyarı (boss yer halkası, yakın temas öncesi); e.moving: o karede yürüyor.
export function enemyMode(e) {
  if (e.dying) return "dead";
  if (e.hurtT > 0) return "hurt";
  if (e.atkT > 0) return "attack";
  if (e.windT > 0) return "windup";
  return e.moving ? "walk" : "idle";
}

// ölüm sırasında ölçek çarpanı: 1 -> 0 (son anlarda hızlanarak küçülür)
export const deathScale = (t) => { const k = Math.min(Math.max(t / DEATH_TIME, 0), 1); return 1 - k * k; };

// model düğümlerinin gölge bayrakları: paket her birleşik mesh'i receiveShadow yapıyor; oyunda düşmanlar gölge almaz (eski modeller gibi).
export function prepareVisual(vis, spec) {
  vis.group.traverse((o) => {
    if (!o.isMesh) return;
    o.receiveShadow = false;
    if (!spec.shadow) o.castShadow = false;
  });
}

// çizim yükü sayacı (test/rapor): görünür Mesh/Sprite/Points sayısı = tahmini çizim çağrısı
export function drawCalls(group) {
  let n = 0;
  group.traverse((o) => { if ((o.isMesh || o.isSprite || o.isPoints) && o.visible) n++; });
  return n;
}
