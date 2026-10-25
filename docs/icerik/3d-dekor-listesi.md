# 3B dekor listesi (bölüm sahneleri)

Durum: **HAZIR ve oyuna bağlı.** P0–P3 dahil 37/37 dekor (`js/render/decor/`) ve 9/9 zemin (`js/render/floors/`) Emre'nin "3D Environment Complete v1" paketinden kopyalandı; bölüm yapıcıları `js/render/scenery.js` + yerleşim/bütçe planı `js/render/sceneryplan.js` ile bağlandı. Testler: `tests/decor.test.js`, `tests/floors.test.js`. Gerçek telefonda kare hızı ölçülmedi.

| Öncelik | Durum |
|---|---|
| P0 (8 dekor) | HAZIR, bağlı |
| P1 (18 dekor) | HAZIR, bağlı |
| P2 (7 dekor) | HAZIR, bağlı |
| P3 (4 dekor: taskin-statue, crypt, frozen-bridge, throne) | HAZIR, bağlı (harabe, mezarlık, geçit, kale) |
| Zemin P0–P2 (9 tür) | HAZIR, bağlı (`FLOORS[floorKind]`, seed formülü aynı) |

Tahmini dekor bütçesi (yüksek kalite; çağrı / üçgen): orman 10/13,6 bin · mağara 22/3,6 bin · harabe 17/5,4 bin · mezarlık 12/14,5 bin · geçit 14/6,6 bin · köy 21/3,2 bin · kristal 22/2,8 bin · kule 9/8,8 bin · kale 11/2,8 bin (hepsi hedefin altında; `tests/decor.test.js` ölçer). Süs dekorlar (grass-tuft, mushroom-glow, puddle, snow-mound, charred-stump, crystal-shard, log, rubble) yalnız Yüksek kalitede; Düşükte çok örnekli dekor yarıya iner.

## 1. Karakterlerden farkı

- Dekor **çok sayıda** çizilir (ağaç 46 adet, kristal, mezar taşı, kemik...). Bu yüzden her biri çok hafif olmalı ve `InstancedMesh` ile çizilir: bir dekor tipi = bir çizim çağrısı (malzeme başına).
- Dekor **animasyonsuz** (rüzgâr sallanması gibi küçük şeyler shader/ölçek ile kodda yapılır, modelde değil). Parıltı için emissive malzeme ve oyunun kendi `glowSprite`'ı kullanılır.
- Dekor **oynanışa etkisiz**: arenanın dışında halkada (`ARENA+1 .. ARENA+9`) ya da kenar köşelerinde durur, çarpışması yok. İstisnalar (arena içi, düz dekor) ayrıca belirtildi.
- Kamera yukarıdan ve eğik bakıyor. Detay yakından değil, **siluet ve renk** önemli. Alçak "Omuz" kamera açısında dekor daha yakından görülür; yine de ince detay boşa gider.

## 2. Ortak sözleşme (üreticiye olduğu gibi ver)

Karakter sözleşmesinden farklı olarak dekor, doğrudan `InstancedMesh`'e verilecek ham parçalar döndürür:

```js
import * as THREE from 'three';                    // r185, importmap ile
export function createDecorX({ variant = 0 } = {}) {
  return {
    parts: [                                       // malzeme başına BİR birleştirilmiş geometri
      { geometry: THREE.BufferGeometry, material: THREE.Material },
    ],
    height: 4.2,                                   // metre; ölçek referansı (model boyu)
    footprint: 1.6,                                // yarıçap (yerleşimde çakışmayı önlemek için)
    castShadow: true,                              // yalnızca büyük/belirgin dekorda
    glow: null,                                    // varsa { color: 0xffcc77, y: 3.3, size: 3.5 } (kodda glowSprite eklenir)
    dispose() {}                                   // geometri ve malzemeleri serbest bırak
  };
}
```

Kurallar:
- Zemin `y=0`, Y yukarı, +Z ön, orijin tabanın ortasında.
- Aynı malzemeli parçalar **tek geometride birleşik** olsun (`BufferGeometryUtils.mergeGeometries` kullanma, addon yok; kendi birleştirme yardımcınızı yazın). Hedef: bir dekor tipi ≤ 3 malzeme.
- `variant` (0, 1, 2) küçük çeşitlilik verir (örn. 3 ağaç, 3 taş boyu); kod her `variant` için ayrı `InstancedMesh` kurar.
- **Işık yok** (`PointLight` vb.), harici dosya ve ağ yok. Doku gerekirse küçük `CanvasTexture` (≤ 128 px) ve yinelenen (tileable).
- Renk, tema paletinden gelen `color` ile `InstancedMesh.setColorAt` aracılığıyla çeşitlenir; modelin ana malzemesi beyaza yakın bırakılmalı (çarpılarak renklenecek) **ya da** sabit renkli malzemeler tanımlanmalı. Hangisi olduğunu dosya başına yorum olarak yaz.
- Geometri şekli düşük poligon ama **düz gölgelendirme** (flat shading) dostu olsun; oyunun görünümü zaten `flatShading: true` ile tutarlı.
- `dispose()` paylaşılan ilkel geometrileri iki kez serbest bırakmasın.

## 3. Bütçeler (varsayım)

| Sınıf | Tek örnek üçgen | Örnek sayısı | Çizim çağrısı |
|---|---|---|---|
| Küçük (mantar, kemik, kandil) | ≤ 150 | 20–60 | 1 |
| Orta (taş, mezar, kristal, ağaç) | ≤ 500 | 10–50 | 1–3 |
| Büyük (kemer, sütun, kuyu, ev iskeleti) | ≤ 1.200 | 4–12 | 1–3 |
| Tekil anıt (kule, kale kapısı, kalp) | ≤ 6.000 | 1 | ≤ 6 |

Sahne başına toplam dekor hedefi (varsayım): ≤ 80 bin üçgen, ≤ 60 çizim çağrısı. Ağaç gibi çok örnekli dekorun üçgeni özellikle düşük tutulmalı (46 × 400 = ~18 bin).

## 4. Genel (birden çok bölümde kullanılan) dekor

| Dosya | Dekor | Bölümler | Notlar | Sınıf | Öncelik |
|---|---|---|---|---|---|
| `pine.js` | Çam (3 varyant: yüksek, geniş, cılız) | orman, geçit | Şimdi: silindir + 2 koni. Yeni: katmanlı dallar, hafif eğri gövde. Taç rengi tema/`color` ile. Orman 46, geçit 14 örnek. | orta | P0 |
| `dead-tree.js` | Kuru ağaç (3 varyant) | mezarlık (14), kule (10) | Şimdi: gövde silindiri + 3 dal. Yeni: çatallı, kıvrık dallar, kopuk uç. | orta | P0 |
| `rock.js` | Kaya (3 boyut, 2 şekil) | mağara, harabe, geçit, kristal | Ortak kaya; renk tema ile (gri, mavi-gri, kahve). Yüzü çok dilimli, düz gölge. | küçük-orta | P1 |
| `grass-tuft.js` | Çim/ot tutamı | orman, köy (kül içinde), mezarlık | İsteğe bağlı; ince, kesişen iki dörtgen. Çok örnek (100+) olabilir, bu yüzden ≤ 40 üçgen. | küçük | P2 |

## 5. Bölüme özel dekor

Parantez içi: bugünkü yapı (`scenery.js`). Tema renkleri `data/game.config.json` içindeki `themes` alanından.

### 1 · Fısıldayan Orman (`forest`, mor `#1a1030`, çim zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `mushroom-glow.js` | Parlayan mantar (2 varyant) | Şimdi: ince silindir + yarım küre, yeşil emissive. Gövde, şapka, benekler, küçük kümeler. Emissive yeşil `#2fe08a`. | küçük | P1 |
| `log.js` | Devrik kütük | Şimdi: kalın silindir. Halkalı kesit, kabuk, yosun. | orta | P2 |
| (Zerrin dalı) | — | Artık 3B Zerrin figürü; ayrı dekor gerekmez. | — | — |

### 2 · Yarasa Mağarası (`cave`, mavi `#08101a`, ıslak zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `stalactite.js` | Sarkıt ve dikit (2 yön, 3 boy) | Şimdi: koni. Sivri, eğri, yüzeyi damlalı. Tavan olmadığı için dikitler arena kenarında yerden; sarkıtlar kamera görmez, sadece dikit önceliklidir. | orta | P1 |
| `cave-crystal.js` | Mavi kristal kümesi | Şimdi: oktahedron + glow sprite. 3–5 sivri prizma kümesi, emissive `#66b8ff`. | orta | P1 |
| `puddle.js` | Su birikintisi | Şimdi: yarı saydam daire. Hafif dalgalı kenar, düz yüzey; parçalar saydam malzeme gerektirir (`transparent`). | küçük | P2 |

### 3 · Taş Bekçiler / harabe (`ruins`, kehribar `#140c08`, bayrak taşı zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `column.js` | Sütun (tam, kırık, 2 varyant) | Şimdi: silindir + başlık kutusu. Yivli gövde, kırık üst, oturma tabanı. | büyük | P0 |
| `arch.js` | Yıkık kemer | Şimdi: kemer parçaları. İki sütun + kırık kemer taşları. | büyük | P1 |
| `rubble.js` | Moloz (3 varyant) | Şimdi: kutu/silindir parçaları. Düzensiz kırık taş yığını. | orta | P1 |
| `rune-banner.js` | Parlayan rünlü pano | Şimdi: turuncu düz dörtgen. Dikili taş üzerinde turuncu rün; emissive `#ffa044`. | orta | P2 |
| `taskin-statue.js` | Taşkın heykeli (yarı gömülü) | Mevcut sahnede var; canlı Taşkın ile aynı sahnede çifti olabilir, çözüm: heykel yalnız `golems` tamamlanmadan görünsün (kod işi). Yeni model zorunlu değil. | orta | P3 |

### 4 · Hortlak Mezarlığı (`graveyard`, yeşil `#0a1410`, toprak zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `gravestone.js` | Mezar taşı (3 varyant: dikdörtgen, yuvarlak, haç) | Şimdi: kutu. Aşınmış üst, yosun, eğik. En çok örnekli dekor (30+). | küçük-orta | P0 |
| `grave-mound.js` | Mezar höyüğü | Şimdi: yarım küre. Toprak yığını, taşla. | küçük | P1 |
| `iron-fence.js` | Demir çit (1 parça 4 m) | Şimdi: direk + ray + sivri uçlar. Kıvrımlı uçlu çit parçası; bazı parçalar eğik/kırık. | orta | P1 |
| `lamp-post.js` | Fener direği | Şimdi: direk + glow sprite. Demir kafes fener, içinde sarı ışık; `glow`: `#ffcc77`. Kod ışığı ayrıca ekler. Tekil. | tekil | P1 |
| `crypt.js` | Küçük mozole/kapı | Yok. İsteğe bağlı; arka plan derinliği. | büyük | P3 |

### 5 · Donmuş Geçit (`ice`, buz mavisi `#0b1a28`, kar zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `ice-spike.js` | Buz kristali/sivri (3 boy) | Şimdi: yarı saydam koni. Prizmatik, kenarları parlak, yarı saydam açık mavi `#9ee8ff`. | orta | P1 |
| `snow-mound.js` | Kar yığını | Şimdi: küre. Düzensiz, kenarı eğri. | küçük | P2 |
| (çam) | Çam | Genel çam, taçta kar rengi `#cfe3f2`. | — | P0 (genel) |
| `frozen-bridge.js` | Donmuş köprü ya da kemer | Yok. Harita görselinde köprü var; arka plan için tutarlı. | büyük | P3 |

### 6 · Yanık Köy (`village`, kızıl `#1a0a08`, kül zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `burnt-house.js` | Yanık ev iskeleti (2 varyant) | Şimdi: direk, kiriş, duvar parçaları ayrı ayrı. Çökmüş çatı kirişleri, kömürleşmiş duvar, kapı boşluğu. En görünür köy dekoru. | büyük | P0 |
| `well.js` | Kuyu | Şimdi: halka + iç yüzey. Taş halka, direk, makara. Tekil. | tekil | P1 |
| `bonfire.js` | Ateş yığını | Şimdi: kütük + animasyonlu ateş sprite. Model yalnızca odun ve kömür yığınıdır; ateş kodla eklenir (`glow`: `#ff7a2a`). Tekil değil, 3–4 örnek. | küçük | P1 |
| `charred-stump.js` | Yanık kütük | Şimdi: silindir. Kırık, siyah, kor çizgili. | küçük | P2 |

### 7 · Kristal Yatağı (`crystals`, mor-mavi `#100c2a`, faset zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `big-crystal.js` | Mor kristal kümesi (3 varyant) | Şimdi: oktahedron örnekleri + glow. 3–7 sivri prizma, aynı tabandan; emissive mor `#6a3aa0`. | orta-büyük | P0 |
| `crystal-shard.js` | Küçük kristal parçası | Zemin dekoru; tek sivri prizma. | küçük | P1 |
| `crystal-pillar.js` | Büyük anıt kristal | Tekil, arka planda (şimdiki sahnede `setFireLight` ile aydınlatılan noktada). | tekil | P2 |

### 8 · Kemik Kule (`tower`, gri-mor `#0c0c12`, kemik zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `bone-pile.js` | Kemik yığını (kafatası, kemik, çene) | Şimdi: kemik silindirleri + kafatası küre + çene kutu. Düzensiz kemik ve kafatası kümesi. | küçük-orta | P1 |
| `rib-arch.js` | Kaburga kemeri | Şimdi: kemik ve küre parçaları. Dev kaburga kemiği kemeri. | orta | P1 |
| `bone-tower.js` | Kemik kule (köşede) | Şimdi: silindir kule + pencereler. Kemiklerden örülmüş, sivri uçlu, pencere boşlukları; üst kısımda kırmızı parıltı (`glow`: `#ff3b3b`). Tekil, en büyük anıt dekoru. | tekil | P0 |
| (kuru ağaç) | Kuru ağaç | Genel. | — | P0 (genel) |

### 9 · Gölge Kalesi (`castle`, koyu kırmızı `#1a0508`, karo zemin)
| Dosya | Dekor | Not | Sınıf | Öncelik |
|---|---|---|---|---|
| `castle-pillar.js` | Kale sütunu (kare tabanlı, başlıklı) | Şimdi: silindir + kutu. Gotik sütun; yan kıvrım çizgileri. | büyük | P0 |
| `castle-banner.js` | Kızıl kale bayrağı/perdesi | Şimdi: düz dörtgen. Sarkık, yırtık kenarlı; bölümün ana rengi `#6a1020`. | orta | P1 |
| `castle-window.js` | Vitray pencere (arka duvarda 5 adet) | Şimdi: düz dörtgenler + emissive. Sivri kemerli pencere çerçevesi; vitray rengi kodda verilir. | orta | P1 |
| `shadow-heart.js` | Gece Kalbi (tekil, çatlak taş) | Şimdi: küre + glow sprite. Çatlak parlayan kristal; boss ile ilgili önemli anıt. Emissive `#ff3a5a`, dönerken kodda animasyonla. | tekil | P1 |
| `throne.js` | Taht (isteğe bağlı) | Yok. Final için atmosfer. | tekil | P3 |

## 6. Öncelik özeti

| Öncelik | Dosyalar | Sayı |
|---|---|---|
| **P0** (en çok görünür) | `pine`, `dead-tree`, `column`, `gravestone`, `burnt-house`, `big-crystal`, `bone-tower`, `castle-pillar` | 8 |
| **P1** | `rock`, `mushroom-glow`, `stalactite`, `cave-crystal`, `arch`, `rubble`, `grave-mound`, `iron-fence`, `lamp-post`, `ice-spike`, `well`, `bonfire`, `crystal-shard`, `bone-pile`, `rib-arch`, `castle-banner`, `castle-window`, `shadow-heart` | 18 |
| **P2** | `grass-tuft`, `log`, `puddle`, `rune-banner`, `snow-mound`, `charred-stump`, `crystal-pillar` | 7 |
| **P3** | `taskin-statue`, `crypt`, `frozen-bridge`, `throne` | 4 |

Toplam 37 dekor dosyası + 9 zemin dokusu (bölüm 9). Önerim: önce **P0 dekorların 8 dosyası**, çünkü bunlar her bölümün siluetini belirler.

## 7. Üreticiye verilecek istem şablonu

```
Create a standalone ES module `<dosya>.js` that exports `createDecor<Ad>({ variant })`
for Three.js r185 (import * as THREE from 'three'). It returns
{ parts: [{ geometry, material }], height, footprint, castShadow, glow, dispose },
exactly as specified here: <§2 sözleşmesini yapıştır>.

Subject: <tablodaki dekor ve not>. Theme: <bölüm adı, ana renk>.
Budget: at most <üçgen> triangles per instance and at most <malzeme> materials.
Style: stylized low-poly with flat-shaded faces, readable silhouette from above.
No lights, no network, no external files. Merge geometry by material.
Provide <varyant sayısı> variants selectable by `variant`.
Add a short comment header with the measured triangle count per variant.
```

## 8. Teslim ve entegrasyon

1. Bana yalnızca `.js` modüllerini ver (çalıştırılabilir paket yok); `js/render/decor/` altına koyarım.
2. Ben: sözleşme uyumunu, üçgen ve malzeme sayısını Node'da ölçerim; ışık, ağ ve dinamik kod yokluğunu denetlerim.
3. `scenery.js` içindeki ilgili bölüm yapıcıları yeni dekoru `InstancedMesh` ile kurar; eski basit dekor, model yüklenemezse yedek kalmaz (karakterlerdeki gibi doğrudan değişir). Yerleşim mantığı (`ringPos`, rezerve alanlar) değişmez.
4. Düşük kalite: dekor çok hafif olduğu için kaliteden bağımsız yeni modellerle çizilir; yalnızca `high`'da ek süs (çim tutamı, küçük mantar) açılabilir.
5. Telefonda kare hızı sende kontrol edilir; takılırsa örnek sayıları (`scenery.js`) ve üçgenler düşürülür.

## 9. Zemin dokuları (bu listeye dahil)

### 9.1 Şimdiki durum (koddan)

- Zemin tek bir düzlem: **28 × 28 m** (`ARENA*2`), `js/render/scene.js`. Doku **döşenmiyor**, tüm arenaya bir kez gerilir. Bu yüzden dikişsizlik (seamless) gerekmez; ama kenarlar sis ve arena dışı zeminle birleşir, kenarda keskin desen olmamalı.
- Doku `js/render/themes.js` içindeki `drawFloor()` ile canvas'a çiziliyor: **1024×1024** (masaüstü), **512×512** (dokunmatik). Orta gri (`#bdbdbd`) zemin üzerine lekeler, noktalar, çizgiler, çatlaklar.
- Doku **gri tonlamalıdır** ve malzeme rengiyle çarpılır (`floorMat.color = tema floor rengi × 2`, `map: floorTex`). Renk bilgisi dokuda DEĞİL temadadır. Bu sayede 9 bölüm aynı yöntemle farklı renk alır.
- Işık: `roughness: 1`, normal/yükseklik haritası yok. Zemin gölge alır (`receiveShadow`).
- Dokunun yoğunluğu 28 m için ~36 piksel/metre (masaüstü), ~18 piksel/metre (dokunmatik). Küçük detay (çim teli) bu yüzden okunmaz; **orta ölçekli lekeler, taş derzleri, çatlaklar** okunur.

### 9.2 Zemin türleri (9 adet, `floorKind`)

| Tür | Bölüm | Şimdiki görünüm | Yeni dokuda istenen |
|---|---|---|---|
| `grass` | Fısıldayan Orman | gri leke + açık/koyu çim çizgileri | çim yamaları, ot yönü, çıplak toprak lekeleri, düşmüş yaprak |
| `wet` | Yarasa Mağarası | leke + çatlak | ıslak taş, su parlaması izi (açık leke), çatlak, çamur |
| `flag` | Taş Bekçiler | 64 px karolu döşeme + çatlak | düzensiz kaldırım taşları, derzler, yosun, kırık karolar |
| `dirt` | Hortlak Mezarlığı | noktalı toprak | çiğnenmiş toprak, ot kırıntısı, taş parçası, ayak izi çukurları |
| `snow` | Donmuş Geçit | yumuşak leke + açık çizgiler | kar yüzeyi, rüzgâr dalgaları, buz çatlakları, buzlu lekeler |
| `ash` | Yanık Köy | çok çatlak + koyu leke | kül ve kömür, çatlak toprak, kor çizgisi izleri (açık küçük çizgiler) |
| `facet` | Kristal Yatağı | rastgele üçgen yüzeyler | kristal zemin yüzeyleri, sivri parçalar, açık kenar çizgileri |
| `bone` | Kemik Kule | çatlak + noktalar | kemik/kum zemin, çatlak, küçük kemik parçacıkları |
| `tile` | Gölge Kalesi | 128 px satranç karo | cilalı koyu mermer/karo, ince derz, hafif çatlak, parlaklık çeşitliliği |

### 9.3 Sözleşme (iki seçenek; hangisini üretici yapabiliyorsa)

**Seçenek A (önerim): canvas çizim fonksiyonu**, mevcut `drawFloor` ile aynı yapı. Harici dosya yok, depoya hafif girer, mobil/masaüstü çözünürlüğü kodla ayarlanır.

```js
// js/render/floors/<tür>.js
export function paintFloor(ctx, size, rand) {
  // ctx: CanvasRenderingContext2D (size × size)
  // rand: [0,1) döndüren deterministik üretici (aynı seed → aynı zemin)
  // Çıktı: GRİ TONLAMALI (R=G=B), ortalama parlaklık ~#bdbdbd (190), aralık ~[90, 255].
}
```

**Seçenek B: hazır görsel**, `assets/art/zemin-<tür>.webp`, gri tonlamalı, **1024×1024** (+ isteğe bağlı 512×512 `-512` sürümü), ≤ 250 KB, dikişsiz olması gerekmez. Config'e `themes.<id>.floorImage` alanı eklenir, kod görseli tema rengiyle çarpar.

Ortak kurallar:
- **Gri tonlamalı ve orta parlaklık.** Çok koyu veya çok açık bir doku, tema renginin ×2 çarpımıyla patlar ya da kararır. Ortalama ~190, en koyu ~90, en açık ~255.
- **Renk yok.** Renk temadan gelir. (Çok hafif ton farkı (R≈G≈B) yeterli.)
- **Kenarda sade.** Arena kenarı ince parlak çerçeve ve sisle birleşir; kenar 40 pikselde ani koyu/açık bant olmasın.
- **Merkez sade.** Oyuncu ve düşmanlar merkezde; merkezde yoğun kontrast, savaşı okumayı zorlaştırır. Detay yoğunluğu kenarlara doğru artabilir.
- **Kontrast ölçülü.** Düşman, kristal ve mermi okunmalı. Kenar çizgi kalınlığı 1–3 px (1024'te), lekeler yumuşak.
- 512 px (dokunmatik) sürümü için aynı fonksiyon `size=512` ile çağrılır; çizim `size`'a göre ölçeklenmeli (`k = size/512`, mevcut kodun yaptığı gibi).
- `rand` dışında `Math.random()` kullanma (her açılışta aynı görünüm).
- Işık, ağ, harici dosya yok.

### 9.4 Öncelik

| Öncelik | Tür | Neden |
|---|---|---|
| P0 | `grass`, `dirt`, `flag` | ilk üç bölüm ve en çok görülen zemin |
| P1 | `wet`, `snow`, `ash`, `tile` | belirgin tema farkı |
| P2 | `facet`, `bone` | zaten sade; küçük kazanç |

İstersen önce **bir tür** (örn. `grass`) üretip oyunda denenir, sonra kalanı yapılır. Not: şimdiki canvas dokuları çalışıyor, bu iş kalite artırma işi; telefonda ek maliyet (çizim süresi) oluşabilir: Seçenek A'da çizim her bölüm başında bir kez yapılır (bugünkü gibi), Seçenek B'de görsel yüklenir ve bellekte ~4 MB tutar (1024×1024×4 bayt).

### 9.5 Zemin için üreticiye istem şablonu

```
Write a standalone ES module `<tür>.js` exporting `paintFloor(ctx, size, rand)`
that paints a GRAYSCALE floor texture (R=G=B) for a top-down game arena,
floor kind "<tür>" (<bölüm adı>): <tablodaki "yeni dokuda istenen">.
Average luminance ~190/255, range ~90..255. It will be multiplied by a theme colour.
Calm center, richer detail toward the edges, soft edge fade. Scales with `size`
(design for 512, use k = size / 512). Use only `rand()` for randomness, no Math.random.
Single sheet covering 28x28 m (no tiling needed). No lights, no network, no external files.
Add a short comment with the render time you measured for size 1024.
```

## 10. Açık sorular ve kararlar

Karar verildi (Emre):
1. P0 dekorlarını **Emre dışarıda ürettirip `.js` olarak verecek**; ben başlamıyorum. Dosyalar gelince sözleşme uyumunu ölçüp bağlarım.
2. Çim tutamı, küçük mantar gibi **süs dekorları yalnız Yüksek kalitede açılır**.
3. **Zemin dokuları bu listeye dahil** (bölüm 9).

Kapandı:
- Zemin: **Seçenek A (canvas fonksiyonu)** seçildi.
- Klasörler: dekor `js/render/decor/`, zemin `js/render/floors/`.
