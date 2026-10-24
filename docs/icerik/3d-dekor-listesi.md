# 3B dekor listesi (bölüm sahneleri)

Durum: ÖNERİ. Hiçbir dekor modeli henüz üretilmedi. Liste, `js/render/scenery.js` içindeki mevcut dekorlar (şu an basit geometri: koni, silindir, kutu, oktahedron) ve `data/game.config.json` tema verilerinden çıkarıldı. Üçgen bütçeleri VARSAYIMDIR, gerçek telefonda ölçülmedi.

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

Toplam 37 dosya. Önerim: önce **P0'daki 8 dosya**, çünkü bunlar her bölümün siluetini belirler.

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

## 9. Açık sorular

1. Önce P0'daki 8 dosyayla mı başlayalım?
2. Çim tutamı, küçük mantar gibi süs dekorları yalnız Yüksek kalitede mi açılsın? (Önerim: evet.)
3. Zemin dokularını (9 tür, şu an canvas ile üretiliyor) de ayrı bir listeye almak ister misin?
