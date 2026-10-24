# 3B model listesi (kodla üretilen karakterler)

Durum: ÖNERİ. Hiçbir model henüz üretilmedi. Aldemir için gelen paket (`createAldemir`) örnek alındı. Düşman değerleri `data/game.config.json`'dan, davranışlar `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` §3'ten alındı. Poligon bütçeleri VARSAYIMDIR, gerçek telefonda ölçülmedi.

## 1. Neden bütçe önemli

Aldemir paketi ~79 bin üçgen ve ~250 mesh. Tek oyuncu için kabul edilebilir, ama düşmanlar aynı anda 10–14 tane ekranda olabilir. Aynı bütçeyle düşman yapılırsa mobil takılır. Bu yüzden düşman modelleri çok daha hafif olmalı. Hepsi `Düşük` kalite modunda eski basit modele düşecek şekilde, oyunun kalite ayarına bağlanır (`js/core/quality.js`).

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

Oyundaki mevcut durum: hepsi şimdilik `js/render/enemies.js` içindeki basit prosedürel modellerle çiziliyor.

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
3. Bağlama: `enemies.js` içindeki `buildEnemy` kalite moduna göre (`high` → yeni model, `low` → mevcut basit model) seçer. Geçişte oynanış değişmez.
4. Telefonda kare hızı sende kontrol edilir; takılırsa o modelin bütçesi düşürülür.

## 6. Açık sorular

1. Önce hangi sıradan başlayalım? Öneri: Pırıl, Ruh, Yarasa, Taş Bekçi, sonra Gölge Kral.
2. Düşman modelleri de `Düşük`te eski modele mi düşsün, yoksa düşmanlar her zaman yeni (hafif) modelle mi çizilsin? (Önerim: hafif oldukları için her zaman yeni model; yalnızca Aldemir ve boss kaliteye bağlı.)
3. Dekor için ayrı bir 3B listesi ister misin?
