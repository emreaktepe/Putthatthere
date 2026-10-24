# 3B model listesi (kodla üretilen karakterler)

Durum: Aldemir, Pırıl ve 10 düşmanın tamamı (Ruh, Yarasa, Taş Bekçi, Gölge Kral + Okçu, Kurt, Kor Hortlak, Rahip, Totem, Şövalye; Full12 Pro v2 paketi) HAZIR ve oyuna bağlı (12/12). Yalnızca P3 sahne figürleri (Zerrin, Taşkın, Veyis-insan) hâlâ yok. Aldemir için gelen paket (`createAldemir`) örnek alındı. Düşman değerleri `data/game.config.json`'dan, davranışlar `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` §3'ten alındı. Poligon bütçeleri VARSAYIMDIR, gerçek telefonda ölçülmedi.

## 1. Neden bütçe önemli

Aldemir paketi ~79 bin üçgen ve ~250 mesh. Tek oyuncu için kabul edilebilir, ama düşmanlar aynı anda 10–14 tane ekranda olabilir. Aynı bütçeyle düşman yapılırsa mobil takılır. Bu yüzden düşman modelleri çok daha hafif olmalı. Karar güncellemesi: hafif düşman modelleri kalite ayarından bağımsız her zaman çizilir; yalnızca Aldemir kaliteye bağlıdır (`js/core/quality.js`).

Varsayım bütçeler (üçgen / mesh, tek örnek):

| Sınıf | Üçgen | Mesh | Örnek |
|---|---|---|---|
| Küçük düşman | ≤ 3.000 | ≤ 15 | ruh, yarasa, kor hortlak |
| Orta düşman | ≤ 6.000 | ≤ 25 | okçu, kurt, rahip, taş bekçi |
| Elit | ≤ 12.000 | ≤ 40 | şövalye, totem |
| Boss | ≤ 25.000 | ≤ 60 | Gölge Kral |
| Eşlikçi | ≤ 2.000 | ≤ 12 | Pırıl |

Aynı anda ekrandaki toplam düşman gövdesi için hedef (varsayım): ≤ 100 bin üçgen, ≤ 250 çizim çağrısı (gölge geçişi dahil).

## 2. Ortak sözleşme (her model için aynı)

Aldemir paketiyle aynı yapı, düşmanlar için genişletilmiş. Model üreticiye (ChatGPT vb.) bu bölümü olduğu gibi ver:

```js
import * as THREE from 'three';           // r185, importmap ile
export function createX({ scale = 1, color = 0x... } = {}) {
  return {
    group,                                 // THREE.Group; Y yukarı, +Z ön, zemin y=0
    update(time, delta, mode),             // mode: 'idle' | 'walk' | 'windup' | 'attack' | 'hurt' | 'dead'
    setTint(hex, amount),                  // donma/yavaşlama/hasar parlaması için renk karışımı (0..1)
    dispose(),                             // geometri/malzeme/doku serbest bırak
    parts: { ... }                         // animasyonlu düğümler
  };
}
```

Kurallar:
- Yükseklik/ölçek: modelin görsel boyu, config'teki `r` (yarıçap) ve `y` (yükseklik) değerlerine uysun (aşağıdaki tabloda). Çarpışma oyunda sabit, yalnızca görsel ölçek ayarlanır.
- `scale` parametresi görseli ölçeklesin, `color` ana gövde rengini versin (config `color`).
- **Işık ekleme yok:** modelin içinde `PointLight`/`SpotLight` olmasın (sahnede tek asa ışığı var). Parlama emissive malzeme ve additive sprite ile yapılsın.
- Malzeme ve geometri paylaşımı: aynı modelin birden çok örneği çok olabilir; geometriyi ve malzemeyi modül düzeyinde bir kez üret, örnekler paylaşsın (yalnızca `setTint` için malzeme kopyası gerekiyorsa küçük tut).
- Statik parçalar aynı malzemeyle tek geometride birleştirilsin; yalnızca animasyonlu parçalar ayrı düğüm olsun.
- `castShadow`: yalnızca büyük gövde parçalarında. İnce parçalar gölge atmasın.
- Harici dosya, ağ isteği, `eval` yok. Doku gerekirse `CanvasTexture` (küçük, ≤ 256 px).
- `update` içinde yeni nesne üretme (çöp toplayıcı baskısı); `Vector3`/`Quaternion` yeniden kullan.
- `mode`: `idle` bekleme/nefes, `walk` hareket, `windup` saldırı öncesi uyarı (oyuncunun kaçması için 0.5–1.2 sn, belirgin siluet/parlama değişimi), `attack` saldırı anı, `hurt` kısa vuruş tepkisi, `dead` düşüş/dağılma (oyun şimdilik anında kaldırıyor, ama hazır olsun).

## 3. Model listesi ve öncelik

**Bağlı modeller (durum):**

| Karakter | Durum | Dosya / bağlantı | Ölçek ve yerleşim |
|---|---|---|---|
| Aldemir | HAZIR, bağlı (kaliteye bağlı: Yüksek=pro) | `js/render/aldemir.js`, `aldemir-pro.js` | ölçek 0.8 |
| Pırıl | HAZIR, bağlı | `js/render/models/piril.js` -> `wizard.js` (`pirilVis`) | ölçek 0.6; büyücü yürürken `walk`, durunca `idle` |
| Ruh | HAZIR, bağlı (kaliteden bağımsız) | `models/ghost.js` -> `enemyvis.js` | ölçek 1, merkez 1.1 |
| Yarasa | HAZIR, bağlı (kaliteden bağımsız) | `models/bat.js` | ölçek 1, merkez 0.06 |
| Taş Bekçi | HAZIR, bağlı (kaliteden bağımsız) | `models/golem.js` | ölçek 1, merkez 1.2, yere basar |
| Gölge Kral | HAZIR, bağlı (kaliteden bağımsız) | `models/boss.js` | ölçek 1.3, merkez 1.77, yere basar; faz 3 kalkanı modelin kendi küresi |
| Kemik Okçu | HAZIR, bağlı (kaliteden bağımsız) | `models/archer.js` | ölçek 0.9, merkez 1.15, yere basar (5095 üçgen) |
| Kurt Ruhu | HAZIR, bağlı (kaliteden bağımsız) | `models/wolf.js` | ölçek 1, merkez 0.78, yere basar (3682) |
| Kor Hortlak | HAZIR, bağlı (kaliteden bağımsız) | `models/ember.js` | ölçek 0.85, merkez 0.91, havada süzülür (2124) |
| Karanlık Rahip | HAZIR, bağlı (kaliteden bağımsız) | `models/priest.js` | ölçek 0.85, merkez 1.35, süzülür (5199) |
| Lanet Totemi | HAZIR, bağlı (kaliteden bağımsız) | `models/totem.js` | ölçek 1.25, merkez 1.28, yere basar (4036) |
| Kemik Şövalye | HAZIR, bağlı (kaliteden bağımsız) | `models/knight.js` | ölçek 0.9, merkez 1.34, yere basar, gerçek gölge; `setEnraged` (6994) |

Mod eşlemesi (oyun durumu -> `update` modu): hareket `walk`/durağan `idle`; temas hasarından hemen önce (`dist < r + 1.2`) ve Gölge Kral yer halkası uyarısı süresince `windup`; temas hasarı anı, boss halka patlaması ve boss çağrısı `attack`; hasar alınca 0.28 sn `hurt`; ölümde ~0.35 sn `dead` (oynanış ölümü anında işlenir, yalnız görsel gecikmeli silinir). Donma/vuruş flaşı `setTint` ile. Bağlantı mantığı: `js/render/enemyvis.js`.

Full12 v2 düşmanları için ek eşleme (`ai.js` durum bilgisinden; sayılar/oynanış değişmedi): **Okçu** `windup` = atıştan önceki son 0,5 sn, `attack` = atış anı (0,3 sn). **Kurt** `windup` = çömelme (0,7 sn), `attack` = hücum (0,6 sn), yorgunlukta (1 sn) yavaş `walk`. **Kor Hortlak** `windup` = patlama öncesi 0,5 sn kızarma; patlamada düşman ölür (`dead`, 0,35 sn küçülme), ayrı bir `attack` karesi yok. **Rahip** `windup` = kalkan/iyileştirmeden önceki son 0,5 sn, `attack` = verme anı (0,6 sn). **Totem** hep `idle`; doğurmadan önceki son 1 sn `windup`, doğurma anı `attack` (0,8 sn). **Şövalye** `windup` = yere vurma hazırlığı (1 sn), `attack` = şok dalgası patlarken (0,4 sn); %50 hp öfkesi modelin `setEnraged(true)` çağrısına bağlı (`e.enraged`, mor aura + parlayan göz). Eski prosedürel düşman modelleri (`BUILD`) kaldırıldı, yedek yok: modül yüklenemezse oyun açılmaz (modeller statik import).

Oyundaki mevcut durum: 10 düşmanın hepsi 3B modelle çiziliyor (`js/render/enemies.js` içindeki eski prosedürel modeller kaldırıldı).

### P0 — En görünür (oyunun ilk izlenimi)

| Dosya | Karakter | Config `r` / `y` | Bölüm | Tasarım ve animasyon notu | Sınıf |
|---|---|---|---|---|---|
| `aldemir.js` | Aldemir | – | hepsi | **HAZIR ve bağlı** (pro kalite). | oyuncu |
| `piril.js` | Pırıl (eşlikçi) | – | hepsi | Küçük parlayan ışık küresi; içinde belli belirsiz küçük kız silüeti. Büyücünün çevresinde süzülür, kristal toplayınca parlar. `update` modları: idle, `walk` (peşinden gelir), `attack` (büyü sırasında hafif atılma). Zikzak süzülme, kıvılcım kuyruğu (≤ 12 parçacık). | eşlikçi |
| `ghost.js` | Ruh | 0.7 / 1.2 | 1–9 | Yarı saydam yeşil `#c9ffd9` hayalet: eteği dalgalı, boş göz çukurları, hafif parlama. En çok görülen düşman. Süzülür, hafif öne eğilir. Saydam malzeme için `depthWrite:false` unutulmasın. | küçük |
| `bat.js` | Yarasa | 0.5 / 1.6 | 2+ | Mor `#b98bff`: kanat çırpma animasyonu (kanat düğümleri), küçük gövde, sivri kulaklar, zikzak uçuş eğimi. | küçük |
| `golem.js` | Taş Bekçi | 1.2 / 1.2 | 3+ | Gri `#8a8a96` yosunlu taş devi: iri omuzlar, çatlaklar, tek parlayan turuncu rün gözü. Yavaş, ağır adım. Elit hissi. | orta |

### P1 — Set parçaları ve çeşitlilik

| Dosya | Karakter | `r` / `y` | Bölüm | Tasarım ve animasyon notu | Sınıf |
|---|---|---|---|---|---|
| `boss.js` | Gölge Kral (Veyis) | 2.2 / 2.4 | 9 | Koyu kızıl `#7a2038` gölgeden oluşan taçlı dev; çatlak taç, gövdeden geçen kırmızı-pembe parlayan çatlaklar (Gece Kalbi kırıntıları), kederli duruş. **Üç faz** görseli: Faz 1 sakin; Faz 2 halka çağırma jesti (`windup`); Faz 3 kalkanlı (parlak kalkan küresi çocuk düğüm). `setTint` ile kalkan/faz rengi. | boss |
| `knight.js` | Kemik Şövalye | 1.5 / 1.2 | 8 | `#cfd0dc` kemik zırhlı iri şövalye, yırtık pelerin, büyük kemik kılıç/topuz. `windup`: silahı kaldırır (1 sn), `attack`: yere vurur (şok dalgası oyunda ayrı efekt). Hp %50'de duruş değişimi (isteğe bağlı). | elit |
| `archer.js` | Kemik Okçu | 0.6 / 1.0 | 4+ | `#e8e4d0` ince iskelet, kemik yay. `windup`: yayı gerer ve ok ucu parlar (0.5 sn), geri çekilirken ters yürüyüş. | orta |
| `wolf.js` | Kurt Ruhu | 0.7 / 0.7 | 5+ | `#bfe9ff` yarı saydam buz mavisi kurt: dört ayak yürüyüşü, `windup`: çömelir, gözler parlar (0.7 sn), `attack`: uzanarak atılma. | orta |

### P2 — Tamamlayıcılar

| Dosya | Karakter | `r` / `y` | Bölüm | Tasarım ve animasyon notu | Sınıf |
|---|---|---|---|---|---|
| `ember.js` | Kor Hortlak | 0.7 / 1.0 | 6+ | `#ff8a3a` yanan kömür hortlağı: çatlak gövde, içeriden turuncu parıltı, ateş parçacıkları. `windup`: kızarır ve şişer (0.5 sn, patlama uyarısı). | küçük |
| `priest.js` | Karanlık Rahip | 0.9 / 1.0 | 7 | `#4a2a6a` koyu mor kapüşonlu rahip, yüzsüz, süzülen cüppe, elinde karanlık küre. `windup`: kalkan verirken ellerini açar (3 düşmana bağlantı çizgisi oyunda ayrı efekt). Öncelikli hedef olduğu için siluet belirgin olmalı. | orta |
| `totem.js` | Lanet Totemi | 1.0 / 1.6 | 6 | Hareketsiz, kristal gibi parlayan turuncu `#ff7a2a` sütun/direk; yüzeyinde yüz/rün kabartması, tepede dönen halkalar. 12 sn'de bir ruh doğurur: `windup` (halkalar hızlanır). | elit |

### P3 — Sahne figürleri (isteğe bağlı)

| Dosya | Karakter | Not |
|---|---|---|
| `zerrin.js` | Zerrin (baykuş) | Arenanın kenarında bir dalda duran baykuş; bölüm girişinde başını çevirir. Savaşa katılmaz. Küçük sınıf. |
| `taskin.js` | Taşkın | 3. bölümden sonra kenarda duran, kırık, lanetten kurtulmuş taş bekçi heykeli; ara sıra kafasını eğer. Savaşa katılmaz. Orta sınıf. |
| `veyis-insan.js` | Veyis (insan hali) | Final diyaloğu / son sahne için taçsız, yaşlı kral. Gerekirse portre yeterli. |

### Bonus — Karakter olmayan ama etkisi büyük (3B)

Dekor (bugün `js/render/scenery.js` basit geometri): ağaç (3 çeşit), mezar taşı, kırık sütun, buz kristali, mor kristal kümesi, kemik kule parçası, yanık ev kalıntısı, kale surları. Tekrarlı kullanıldığı için `InstancedMesh` ile çizilmeli. İstenirse ayrı bir liste hazırlayabilirim.

## 4. Üreticiye verilecek istem şablonu

```
Create a standalone ES module `<dosya>.js` that exports `create<Ad>({ scale, color })`
for Three.js r185 (import * as THREE from 'three'). Follow this contract exactly:
<buraya §2'deki sözleşmeyi yapıştır>

Character: <tablodaki karakter, renk, tasarım ve animasyon notu>.
Budget: at most <üçgen> triangles and <mesh> meshes in total. Target height <y> units,
body radius <r> units, ground at y=0, facing +Z. No lights, no network, no external files.
Merge static parts by material. Share geometry and materials across instances.
Provide a short comment header with triangle/mesh counts you measured.
```

## 5. Çıktıyı teslim alırken kontrol

1. Dosyayı bana ver (`js/render/models/<dosya>.js` altına koyarım). Betik/çalıştırılabilir paket yerine yalnızca `.js` modülü ver.
2. Ben: sözleşmeye uyumu, ışık/ağ/dinamik kod yokluğunu, üçgen ve mesh sayısını Node'da ölçerim; `dispose` sızıntısını ve malzeme paylaşımını incelerim.
3. Bağlama: `enemies.js` içindeki `buildEnemy` modeli `js/render/enemyvis.js` tablosundan (`ENEMY_VIS`) seçer. Karar: hafif düşman modelleri (Ruh, Yarasa, Taş Bekçi, Gölge Kral) kaliteden bağımsız her zaman yeni modelle çizilir. Oynanış değişmez.
4. Telefonda kare hızı sende kontrol edilir; takılırsa o modelin bütçesi düşürülür.

## 6. Açık sorular

1. Önce hangi sıradan başlayalım? Öneri: Pırıl, Ruh, Yarasa, Taş Bekçi, sonra Gölge Kral.
2. (Karara bağlandı) Düşman modelleri `Düşük`te de yeni modelle çizilir; yalnızca Aldemir kaliteye bağlıdır.
3. Dekor için ayrı bir 3B listesi ister misin?
