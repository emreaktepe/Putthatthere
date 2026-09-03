# Put-That-There Prototip — Oyun Tasarım Belgesi (3B sürüm)

**Durum:** v2 prototip — Three.js ile 3B, yalnızca işaretçi/tıklama (konuşma girişi yok)
**Kapsam:** 5 sahnelik tek oturumluk bulmaca akışı
**Teknoloji:** Saf HTML/CSS/JS + Three.js (r185, `vendor/` altında yerel), derleme aracı yok, GitHub Pages
**Referans:** MIT Media Lab, "Put-That-There" (Richard Bolt, 1980) — bu prototipte işaret/tıklama etkileşimi 3B uzaya uyarlanmıştır; ses girişi bilinçli olarak kapsam dışıdır.

> **v1'den farkı:** İlk prototip 2B SVG sahneler kullanıyordu. Görsel gerçekçilik ve uzamsal muhakeme için tüm sahneler gerçek ölçekli (metre) 3B ortamlara taşındı. Oyun mantığı (deiktik akış, yıldız bantları, puan formülü, i18n, senaryo metinleri) korundu; koordinatlar piksel yerine **metre**, hedefe uzaklık ise SVG birimi yerine **gerçek dünya mesafesi**.

---

## 1. Etkileşim Akışı — Durum Makinesi

`js/input-raycast.js` içinde tek bir durum makinesi; sahne başına bir kez döner.

| # | Durum | Açıklama |
|---|-------|----------|
| 1 | `IDLE` | Sahne yüklendi, nesne tepside, hiçbir şey seçili değil. |
| 2 | `OBJECT_SELECTED` | Oyuncu tepsideki nesneyi aldı ("that"); henüz sahneye dokunmadı. |
| 3 | `DESTINATION_HOVERED` | İşaretçi sahne üzerinde geziniyor; yarı saydam hayalet, ışın (raycast) yüzeye çarptığı noktayı takip ediyor. |
| 4 | `DESTINATION_CONFIRMED` | Oyuncu bir noktaya tıkladı ("there"); hayalet orada duruyor. Yeniden konumlandırma ve döndürme serbest. |
| 5 | `LOCKED` | "Bunu Oraya Koy!" basıldı; yerleşim donduruldu ve puanlandı, sonuç paneli açıldı. |

### 1.1 Geçişler

| Kaynak | Tetikleyici | Hedef |
|---|---|---|
| `IDLE` | Tepsiye `pointerdown` | `OBJECT_SELECTED` |
| `OBJECT_SELECTED` | Tuval üzerinde `pointermove` (ışın bir yerleştirme yüzeyine çarparsa) | `DESTINATION_HOVERED` |
| `DESTINATION_HOVERED` | Tuval üzerinde **tıklama** | `DESTINATION_CONFIRMED` |
| `DESTINATION_CONFIRMED` | Başka bir noktaya tıklama | `DESTINATION_CONFIRMED` (yeniden konumlandırma, dönüş korunur) |
| `DESTINATION_CONFIRMED` | `←` / `→` (yalnızca `target.rotationRequired` ise) | `DESTINATION_CONFIRMED` (5°, `Shift` ile 15°) |
| herhangi biri | `Escape` veya tepsiye tekrar tıklama | `IDLE` |
| `DESTINATION_CONFIRMED` | Onay butonu | `LOCKED` |

**Tıklama mı, kamera sürüklemesi mi?** Kamera da aynı tuval üzerinde fare sürüklemesiyle döndüğü için, `pointerdown` ile `pointerup` arasında **6 pikselden fazla** hareket eden etkileşim yerleştirme değil, kamera sürüklemesi sayılır (`CLICK_SLOP_PX`). Böylece etrafına bakmak yanlışlıkla hedef seçmez.

### 1.2 Yerleştirme yüzeyleri (raycast hedefleri)

Her sahne, `placementSurfaces` altında bir veya daha fazla görünmez düzlem tanımlar; ışın bunlara çarpar ve **en yakın** isabet kazanır:

- `floor` — yatay düzlem (peron zemini, asfalt, koridor zemini)
- `wall` — dikey düzlem; `facing` ile normali verilir (örn. `-x`)

Bu, 5. sahnenin can alıcı noktasıdır: koridorda hem duvar hem zemin yerleştirilebilir yüzeydir, dolayısıyla yangın söndürücüyü **yanlışlıkla yere koymak mümkündür** ve doğal olarak sıfır puan alır. 2B sürümde bu ayrım rotasyonla taklit ediliyordu; 3B'de gerçek bir uzamsal karardır.

Duvara yerleşen nesneler yüzey normali boyunca 11 cm dışarı taşınır (braket payı) ve normale bakacak şekilde döndürülür.

### 1.3 Görsel geri bildirim

| Durum | Geri bildirim |
|---|---|
| `IDLE` | Tepside nesnenin yavaşça dönen 3B önizlemesi (`js/tray-preview.js`, ayrı küçük renderer). |
| `OBJECT_SELECTED` | Tepsi kutusu amber çerçeveyle vurgulanır. |
| `DESTINATION_HOVERED` / `DESTINATION_CONFIRMED` | Nesnenin %55 saydam kopyası hedef noktada; döndürme gerekiyorsa "← → ile döndür" ipucu görünür. |
| `LOCKED` | Nesne tam opak, gölge düşüren katı hale gelir; tepsi boşalır. |
| Sonuç (≤1 yıldız) | Doğru konumda yeşil yarı saydam kopya **ve** yarıçapı tolerans kadar olan bir halka belirir. |

---

## 2. Puanlama

### 2.1 Hata metrikleri

`js/scoring.js`, sahne JSON'undaki şu alanları kullanır:

```
target.position          → hedef nokta [x, y, z], metre
target.rotationDeg       → doğru yatay dönüş (yaw)
target.rotationRequired  → boolean
target.toleranceMeters   → konum toleransı, metre
target.toleranceRotationDeg
```

```
positionError = |placedPoint − target.position|          (3B Öklid mesafesi, metre)
rotationError = rotationRequired ? açıFarkı(yaw, hedefYaw) : 0   (0-180°)
```

Puanlanan nokta, oyuncunun **nişan aldığı yüzey noktasıdır** — nesnenin merkezi değil. Bu sayede zemin ve duvar sahneleri aynı formülle ölçülür.

### 2.2 Birleşik oran ve yıldızlar

```
combinedRatio = max(positionError / toleranceMeters,
                    rotationRequired ? rotationError / toleranceRotationDeg : 0)
```

| `combinedRatio` | Yıldız | Ekstra |
|---|---|---|
| ≤ 1.0 | ★★★ | — |
| ≤ 2.0 | ★★☆ | — |
| ≤ 3.0 | ★☆☆ | doğru konum işaretlenir |
| > 3.0 | ☆☆☆ | doğru konum işaretlenir |

İki eksenden **kötü olanı** belirleyici olduğu için, konumu mükemmel ama 90° yanlış dönmüş bir dur çizgisi yine 0 yıldız alır.

### 2.3 Sayısal puan

```
score = round(100 × clamp(1 − combinedRatio / 3, 0, 1))
```

5 sahne → maksimum 500 puan, 15 yıldız. Sonuç panelinde ayrıca sapma metre/santimetre olarak gösterilir (`errorDistanceLabel`).

### 2.4 Rütbeler

| Başarı | Rütbe (kurgu belgesinden) |
|---|---|
| ≥ 90% | Şehir Gözü Ustası |
| 70-89% | Şehir Dedektifi |
| 50-69% | Dikkatli Gözlemci |
| < 50% | Çaylak Gözlemci |

---

## 3. Zorluk Eğrisi

Zorluk üç eksende artar: **(a)** daralan tolerans, **(b)** dönüş gerekliliği, **(c)** yerleştirme yüzeyinin kendisinin bir karar haline gelmesi. Sıralama `difficulty` alanına göre yapılır ve `data/scenes.json` ile birebir eşleşir.

| Sıra | Sahne | `difficulty` | Tolerans | Yüzey | Dönüş | Zorluk kaynağı |
|---|---|---|---|---|---|---|
| 1 | Metro peronu güvenlik şeridi | 1 | 0.55 m | zemin | Hayır | En geniş tolerans; şerit zaten peronla hizalı, tek karar kenardan geri çekilme mesafesi. |
| 2 | Otopark engelli sembolü | 2 | 0.50 m | zemin | Hayır | Sembolün park yerine mi yoksa bitişik erişim şeridine mi ait olduğu ayırt edilmeli. |
| 3 | Kaldırım rampası | 3 | 0.45 m | zemin | **Evet** (±12°) | Yaya geçidiyle hizalanmalı **ve** eğim yola bakmalı. |
| 4 | Yaya geçidi dur çizgisi | 4 | 0.40 m | zemin | **Evet** (±8°) | Geçitten geri çekilme + şeride dik olma + doğru şerit; en dar dönüş toleransı. |
| 5 | Koridor yangın söndürücü | 5 | 0.35 m | **duvar + zemin** | Hayır | En dar tolerans; doğru yüzey (duvar), doğru yükseklik (üst nokta ≤1,5 m) ve çıkışa yakınlık birlikte tutturulmalı. |

---

## 4. Arayüz Düzeni

```
┌──────────────────────────────────────────────────────────────────┐
│ ÜST BAR:  [Sahne 2/5]   [Sahne adı]   [Puan: 233/500]   [🌐 EN] │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│         3B GÖRÜNÜM (Three.js tuvali, perspektif kamera)           │
│         üstte: "Nesneyi almak için alttaki kutuya tıkla"          │
│         altta: "Sürükleyerek etrafına bak · tekerlekle yakınlaş"  │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ ALT BAR:  [3B nesne tepsisi]              [ Bunu Oraya Koy! ]    │
└──────────────────────────────────────────────────────────────────┘
```

Sonuç paneli modal olarak biner: yıldızlar, açıklama metni, **sapma mesafesi**, bu yerleştirmenin puanı, toplam ve "Sonraki Sahne". 5. sahneden sonra tam ekran özet: toplam puan, yıldız, rütbe, "Tekrar Oyna".

### Kamera

Her sahne kendi kadrajını ve sınırlarını taşır (`camera` alanı): başlangıç konumu, bakılan nokta, `minDistance`/`maxDistance`, dikey açı sınırları ve başlangıç açısına göre **±`azimuthRangeDeg`** yatay serbestlik. Böylece oyuncu derinliği algılamak için etrafına bakabilir ama sahneyi arkadan/altından görüp kadrajı bozamaz.

---

## 5. i18n Metin Anahtarları

Arayüz metinleri `data/strings.tr.json` / `data/strings.en.json` içinde; sahne metinleri (`title`, `explanation`, `hints`) her sahnede `_tr`/`_en` alanı olarak durur.

| Anahtar | Türkçe | English |
|---|---|---|
| `appTitle` | Şunu Şuraya Koy | Put That There |
| `languageToggle` | EN | TR |
| `sceneCounter` | Sahne {current} / {total} | Scene {current} / {total} |
| `scoreLabel` | Puan: {score} / {max} | Score: {score} / {max} |
| `pickUpHint` | Nesneyi almak için alttaki kutuya tıkla | Click the tray below to pick up the object |
| `orbitHint` | Sürükleyerek etrafına bak · tekerlekle yakınlaş | Drag to look around · scroll to zoom |
| `putThatThereButton` | Bunu Oraya Koy! | Put That There! |
| `rotateHint` | ← → ile döndür | Rotate with ← → |
| `cancelHint` | İptal etmek için Esc | Press Esc to cancel |
| `starRating_0..3` | (0) Hedeften uzak kaldın… → (3) Mükemmel yerleşim! | (0) You missed the target… → (3) Perfect placement! |
| `errorDistanceLabel` | Sapma: {distance} | Off by: {distance} |
| `scorePlacementLabel` | Bu yerleştirme: {score} / 100 | This placement: {score} / 100 |
| `runningTotalLabel` | Toplam: {total} / {max} | Total: {total} / {max} |
| `nextSceneButton` / `finishButton` | Sonraki Sahne → / Sonuçları Gör | Next Scene → / See Results |
| `finalSummaryTitle` | Oyun Bitti! | Game Over! |
| `finalSummaryScoreLabel` | Toplam Puan: {total} / {max} ({percent}%) | Total Score: {total} / {max} ({percent}%) |
| `finalSummaryStarsLabel` | Toplam Yıldız: {stars} / {maxStars} | Total Stars: {stars} / {maxStars} |
| `finalSummaryRankLabel` | Rütbe: {rank} | Rank: {rank} |
| `rank_master` … `rank_retry` | Şehir Gözü Ustası … Çaylak Gözlemci | Master of City Eye … Rookie Observer |
| `playAgainButton` | Tekrar Oyna | Play Again |
| `introTitle` / `introBody` / `startButton` | Şehir Gözü kurgusu (bkz. `narrative.md`) | City Eye premise |
| `loadingLabel` / `errorGeneric` | Yükleniyor… / Bir şeyler ters gitti. | Loading… / Something went wrong. |

---

## 6. Kod Haritası

| Dosya | Sorumluluk |
|---|---|
| `js/main.js` | Akış kontrolü: sahne sırası, puan toplama, ekran geçişleri, dil |
| `js/three-app.js` | Renderer, kamera, ışık/gölge, orbit sınırları, raycast, hayalet ve hedef işareti |
| `js/scene-builders.js` | 5 ortamın ve 5 nesnenin prosedürel geometrisi (gerçek ölçüler) |
| `js/materials.js` | Prosedürel dokular (asfalt, beton, döşeme, dokunsal şerit, engelli sembolü) ve PBR materyaller |
| `js/input-raycast.js` | Deiktik durum makinesi, tıklama/sürükleme ayrımı, döndürme |
| `js/tray-preview.js` | Tepsideki dönen 3B nesne önizlemesi |
| `js/scoring.js` | Mesafe/dönüş hatası, yıldız ve puan |
| `js/ui-results.js` | Sonuç paneli ve final özeti |
| `js/i18n.js` | TR/EN metinler, `localStorage` ile kalıcı dil seçimi |
