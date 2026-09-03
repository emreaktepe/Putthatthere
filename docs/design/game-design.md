# Put-That-There Prototip — Oyun Tasarım Belgesi

**Durum:** v1 prototip (yalnızca işaretçi/tıklama — konuşma girişi YOK)
**Kapsam:** 5 sahnelik tek oturumluk bulmaca akışı
**Teknoloji:** Saf HTML/CSS/JS + SVG, framework/derleme aracı yok, GitHub Pages üzerinde barındırılır
**Referans:** MIT Media Lab, "Put-That-There" (Richard Bolt, 1980) — bu prototipte yalnızca işaret/tıklama etkileşimi uyarlanmıştır, ses girişi bilinçli olarak v1 kapsamı dışında bırakılmıştır.

---

## 1. Etkileşim Akışı — Durum Makinesi

Oyun, sahne başına yedi durumdan geçen tekil bir durum makinesiyle yönetilir. `IDLE` durumundan `NEXT_SCENE` durumuna kadar olan döngü her sahne için bir kez çalışır; 5. sahne tamamlandığında `NEXT_SCENE` yerine `FINAL_SUMMARY` ekranına geçilir.

### 1.1 Durum listesi ve amaç

| # | Durum | Türkçe karşılığı | Açıklama |
|---|-------|-------------------|----------|
| 1 | `IDLE` | Bekleme | Sahne yüklenmiş, nesne tepside duruyor, hiçbir şey seçili değil. |
| 2 | `OBJECT_SELECTED` | Nesne seçili ("that") | Oyuncu tepsideki nesneyi seçti/tuttu; henüz sahneye dokunmadı. |
| 3 | `DESTINATION_HOVERED` | Hedef üzerinde gezinme | İşaretçi, nesne seçiliyken sahne tuvali üzerinde geziniyor; hayalet (ghost) önizleme işaretçiyi takip ediyor. |
| 4 | `DESTINATION_CONFIRMED` | Hedef işaretlendi ("there") | Oyuncu sahne üzerinde bir noktaya tıkladı/bıraktı; hayalet o noktada asılı duruyor, kilitlenmedi. Döndürme ve yeniden konumlandırma bu durumda serbesttir. |
| 5 | `LOCKED_SCORED` | Kilitlendi ve puanlandı | "Put That There!" butonuna basıldı; yerleşim donduruldu, `positionError`/`rotationError` hesaplandı. |
| 6 | `RESULT_SHOWN` | Sonuç gösteriliyor | Yıldız, açıklama metni ve puan içeren sonuç paneli ekranda. |
| 7 | `NEXT_SCENE` | Sonraki sahneye geçiş | Kısa geçiş animasyonu; ardından `IDLE`'a (sahne < 5) ya da `FINAL_SUMMARY`'ye (sahne = 5) döner. |

### 1.2 Geçiş tablosu

| Kaynak durum | Tetikleyici | Hedef durum | Not |
|---|---|---|---|
| `IDLE` | Tepsideki nesne üzerinde `pointerdown` / `click` | `OBJECT_SELECTED` | Tıkla-tıkla ve sürükle-bırak akışlarının ortak giriş noktası. |
| `OBJECT_SELECTED` | Sahne tuvali üzerinde `pointerenter`/`pointermove` | `DESTINATION_HOVERED` | Sürükleme akışında bu geçiş `pointerdown` sonrası anında, tuval üstünde gerçekleşir. |
| `OBJECT_SELECTED` | Tepsideki nesneye tekrar tıklama veya `Escape` | `IDLE` | Seçim iptali; nesne tepsiye geri "düşer". |
| `DESTINATION_HOVERED` | Sahne tuvali üzerinde `pointerup` / `click` (geçerli bir bırakma noktasında) | `DESTINATION_CONFIRMED` | Hayaletin merkez noktası (centroid), tıklanan SVG koordinatına sabitlenir ("snap"). |
| `DESTINATION_HOVERED` | İşaretçi tuvalden çıkıp tepsiye döner | `OBJECT_SELECTED` | Nesne hâlâ seçili, sadece hover kaybolur. |
| `DESTINATION_CONFIRMED` | Tuval üzerinde farklı bir noktaya `click` | `DESTINATION_CONFIRMED` (kendi üzerine) | Yeniden konumlandırma; hayalet yeni noktaya taşınır, önceki dönüş açısı korunur. |
| `DESTINATION_CONFIRMED` | `ArrowLeft` / `ArrowRight` (yalnızca `scene.rotationRequired === true` ise etkin) | `DESTINATION_CONFIRMED` (kendi üzerine) | Her tuş basımı 5°; `Shift` basılıyken 15° döndürür. Değer sürekli tutulur, 360° modülo alınır. |
| `DESTINATION_CONFIRMED` | `Escape` veya tepsideki nesneye tekrar tıklama | `OBJECT_SELECTED` | Hedef iptal edilir, hayalet kaybolur, nesne yeniden "elde" tutulur hâle döner. |
| `DESTINATION_CONFIRMED` | "Put That There!" butonuna `click` | `LOCKED_SCORED` | Buton yalnızca bu durumda etkindir (bkz. §4). `positionError`/`rotationError` bu geçişte hesaplanır (bkz. §2). |
| `LOCKED_SCORED` | Otomatik (kilit animasyonu ~300 ms sonra) | `RESULT_SHOWN` | Kullanıcı girdisi gerekmez; tuval ve tepsi bu andan itibaren `pointer-events: none`. |
| `RESULT_SHOWN` | Sonuç panelindeki "Sonraki Sahne" / "Sonuçları Gör" butonuna `click` | `NEXT_SCENE` | Buton metni sahne 5'te `finishButton` metnine döner. |
| `NEXT_SCENE` | Otomatik, geçiş animasyonu (~250 ms) sonrası | `IDLE` (sahne < 5) veya `FINAL_SUMMARY` (sahne = 5) | Sahne sayacı, tepsi nesnesi ve tuval içeriği bu geçişte yeniden yüklenir. |

### 1.3 Durum başına görsel geri bildirim

| Durum | Tepsi/nesne görünümü | Hayalet (ghost) önizleme | Buton / diğer |
|---|---|---|---|
| `IDLE` | Nesne normal, hafif `drop-shadow`; `:hover`'da %5 büyüme + `cursor: pointer`. | Yok. | "Put That There!" butonu devre dışı (opaklık 0.4, `pointer-events: none`). |
| `OBJECT_SELECTED` | Nesne etrafında amber renkli (`#ffd166`) SVG `filter: drop-shadow` parlaması; nesne 4px yukarı kalkar; tepsi boşluğunda kesikli çerçeveli yer tutucu belirir; `cursor: grabbing`. | Yok (henüz tuvalde değil). | Buton devre dışı. |
| `DESTINATION_HOVERED` | Aynı (seçili) durum korunur. | Nesnenin yarı saydam kopyası (`opacity: 0.45`), işaretçinin SVG koordinatını takip eder; kayıt noktası nesnenin centroid'i ile hizalanır. | Buton devre dışı. |
| `DESTINATION_CONFIRMED` | Aynı (seçili) durum korunur. | Opaklık 0.75'e çıkar; kesikli mavi (`#4d96ff`) çerçeve eklenir; `scene.rotationRequired` doğruysa merkezde küçük bir döndürme halkası ve "← → ile döndür" ipucu metni görünür. | Buton etkinleşir: tam opaklık + hafif nabız (pulse) animasyonu ile dikkat çeker. |
| `LOCKED_SCORED` | Tepsi boşalır (nesne artık sahnede). | Opaklık 1.0'a çıkar, çerçeve düz çizgiye döner (artık "gerçek" nesne gibi render edilir); 300 ms'lik ölçek nabzı (`1.0 → 1.08 → 1.0`). | Buton gizlenir/devre dışı kalır; tuval etkileşimi kilitlenir. |
| `RESULT_SHOWN` | — | Yerleştirilen nesne olduğu yerde sabit kalır; skor 3 yıldızdan azsa, doğru hedefin soluk bir taslak (outline) kopyası karşılaştırma için tuval üzerinde belirir (bkz. §2.3 ipucu kuralı). | Sonuç paneli alttan yukarı kayarak (veya ortadan solarak) belirir: yıldızlar, açıklama metni, bu yerleştirmenin puanı, güncel toplam puan, "Sonraki Sahne" butonu. |
| `NEXT_SCENE` | Eski sahne 200–300 ms'de solarak kaybolur, yeni sahne ve tepsi nesnesi solarak belirir. | — | Üst bar sahne sayacı ve toplam puan güncellenir. |

**Snap davranışı netliği:** "Hedefte kilitlenmiş önizleme" ifadesi, hayaletin *doğru* konuma değil, oyuncunun *tıkladığı* noktaya kaydığı (registration point = nesnenin centroid'i = tıklama koordinatı) anlamına gelir. Doğru hedefe manyetik çekim/otomatik hizalama **yoktur** — bu, bulmacayı anlamsızlaştırır. İsteğe bağlı, tamamen kozmetik bir ayrıntı olarak 2 birimlik bir SVG ızgarasına yuvarlama uygulanabilir (yalnızca daha temiz render için, puanlamayı etkilemez).

---

## 2. Puanlama Formülü

### 2.1 Hata metrikleri

Her sahne JSON'u şu alanları tanımlar (`viewBox="0 0 800 600"` varsayımıyla):

```
targetX, targetY          → hedef centroid (SVG kullanıcı birimi)
targetAngleDeg             → hedef dönüş açısı (derece, 0–360)
rotationRequired           → boolean
toleranceRadius            → SVG kullanıcı birimi (bkz. §3 tablosu)
toleranceRotationDeg       → derece (yalnızca rotationRequired=true ise anlamlı)
```

**`positionError`** — yerleştirilen nesnenin centroid'i ile hedef centroid arasındaki Öklid mesafesi, SVG kullanıcı birimi cinsinden:

```
positionError = √[ (placedX − targetX)² + (placedY − targetY)² ]
```

**`rotationError`** — mutlak açı farkı, derece cinsinden, [0°, 180°] aralığına normalize edilmiş:

```
Eğer scene.rotationRequired === false:
    rotationError = 0

Aksi hâlde:
    delta = (placedAngleDeg − targetAngleDeg) mod 360
    Eğer delta > 180: delta = 360 − delta
    rotationError = |delta|
```

### 2.2 Birleşik hata oranı (`combinedRatio`)

Yıldız eşikleri, konum ve dönüş hatasının *her ikisinin de* tolerans dışına çıkmamasını garanti etmek için, ikisinden **daha kötü olanı** temel alır (biri iyi diye diğerindeki büyük hata maskelenmesin):

```
posRatio = positionError / toleranceRadius
rotRatio = scene.rotationRequired
             ? rotationError / toleranceRotationDeg
             : 0

combinedRatio = max(posRatio, rotRatio)
```

### 2.3 Yıldız eşikleri

| `combinedRatio` aralığı | Yıldız | Anlamı | Ekstra davranış |
|---|---|---|---|
| `combinedRatio ≤ 1.0` | ★★★ (3) | Tolerans içinde (1x) — mükemmel yerleşim | — |
| `1.0 < combinedRatio ≤ 2.0` | ★★☆ (2) | Toleransın 2 katı içinde — iyi | — |
| `2.0 < combinedRatio ≤ 3.0` | ★☆☆ (1) | Toleransın 3 katı içinde — yeterli | Sonuç panelinde ipucu metni (`hintRevealLabel`) gösterilir. |
| `combinedRatio > 3.0` | ☆☆☆ (0) | Tolerans dışı | İpucu metni **ve** tuval üzerinde doğru hedefin soluk taslağı (outline) gösterilir. |

### 2.4 Sayısal puan (0–100)

Aynı `combinedRatio` değerinden, yıldız bantlarıyla tutarlı doğrusal bir sayısal puan türetilir:

```
score = round( 100 × clamp(1 − combinedRatio / 3, 0, 1) )
```

Bu formül yıldız sınırlarıyla örtüşür:

| `combinedRatio` | Puan aralığı | Karşılık gelen yıldız |
|---|---|---|
| 0 | 100 | ★★★ (üst sınır) |
| 1.0 | ≈ 66.7 | ★★★ / ★★☆ sınırı |
| 2.0 | ≈ 33.3 | ★★☆ / ★☆☆ sınırı |
| ≥ 3.0 | 0 | ☆☆☆ |

### 2.5 Sahneler arası toplam

5 sahne boyunca:

- **Toplam puan** = Σ(`score`), maksimum 500.
- **Toplam yıldız** = Σ(yıldız), maksimum 15.
- **Genel başarı yüzdesi** (öneri, final ekranı için) = `toplamPuan / 500 × 100`.

Öneri notlandırma katmanları (final özet ekranı için, isteğe bağlı süsleme):

| Başarı yüzdesi | Rütbe (öneri) |
|---|---|
| ≥ 90% | "Usta Yerleştirici" |
| 70–89% | "Deneyimli" |
| 50–69% | "Gelişmekte" |
| < 50% | "Tekrar Dene" |

---

## 3. Zorluk Eğrisi

Zorluğu artıran üç faktör: **(a)** daha küçük `toleranceRadius` (daha hassas konum gerektirir), **(b)** dönüş gerekliliği (`rotationRequired = true`, ekstra bir serbestlik derecesi ekler), **(c)** SVG arka planındaki görsel dikkat dağıtıcı öğe sayısı (benzer çizgiler, benzer nesneler, birden fazla aday konum). Sahneler bu üç eksende kademeli olarak zorlaşacak şekilde sıralanmıştır — verilen 5 sahne, önerilen zorluk sırasına göre yeniden düzenlenmiştir (oynatma sırası bu tabloyla aynıdır).

**Referans:** `viewBox="0 0 800 600"`. `toleranceRadius` değerleri bu 800×600 alanına göredir (kıyas: tuvalin kısa kenarı 600 birim → %5 tolerans ≈ 30 birim).

> **Not (senkronizasyon düzeltmesi):** Aşağıdaki tablo, ilk taslaktan sonra `docs/design/research.md` ve `data/scenes.json`'daki gerçek dünya kaynaklı içerikle senkronize edilmiştir. Döndürme gerekliliği nesnenin **kendi fiziksel mantığından** gelir (bir söndürücü duvara asılırken tepsideki "yatık" halinden dikeye döner; bir dur çizgisi şeride dik olmalıdır), sabit/paralel bir çizgi veya sembolün ise (peron şeridi, rampa, engelli sembolü) döndürülmesine gerek yoktur — bunlar zaten tepsideki varsayılan yönleriyle doğru yöndedir. Sıralama ve tolerans değerleri `data/scenes.json` ile birebir eşleşir.

| Sıra | Sahne | `difficulty` | `toleranceRadius` (birim) | `rotationRequired` | `toleranceRotationDeg` | Zorluk kaynağı |
|---|---|---|---|---|---|---|
| 1 | Metro peronu güvenlik şeridi (metro platform safety strip) | 1 | 36 | Hayır | — | Uzun, tolere edilebilir bir şerit; peron kenarına paralel, sabit yönde; en geniş tolerans. |
| 2 | Otopark engelli işareti (parking lot accessible marking) | 2 | 30 | Hayır | — | Park yeri ortasına yerleştirme; çevredeki diğer boş park yerleri hafif dikkat dağıtıcıdır. |
| 3 | Kaldırım rampası (sidewalk curb ramp) | 3 | 26 | Hayır | — | Karşıdaki yaya geçidiyle hizalanmalı; sahnede birden fazla köşe olası yanlış hedefler sunar. |
| 4 | Yaya geçidi dur çizgisi (crosswalk stop line) | 4 | 18 | Evet | 6 | Çizgi şeride **dik** olacak şekilde döndürülmeli; küçülen tolerans ve mevcut yol çizgileri zorluğu artırır. |
| 5 | Koridor yangın söndürücü (hallway fire extinguisher) | 5 | 14 | Evet | 8 | En küçük tolerans; söndürücü tepsideki varsayılan yatık halinden duvara asılı dikey konuma döndürülmeli; çıkışa yakınlık da doğru olmalı. |

**Not:** Gerçek `data/scenes.json` şeması bu alanları şu adlarla taşır: `id`, `difficulty`, `target.x`/`target.y` (dikdörtgenin sol-üst köşesi; centroid = `x + width/2`, `y + height/2`), `target.rotationDeg`, `rotationRequired`, `target.toleranceRadius`, `target.toleranceRotationDeg`, `missingObject.id`/`missingObject.art` (tepside gösterilecek nesnenin referansı), `missingObject.defaultRotationDeg`. `viewBox` sabittir, `"0 0 800 600"`, ve kod tarafında sabit değer olarak tutulur (JSON'da tekrar edilmez).

---

## 4. Arayüz Düzeni (UI Layout)

Tek, tam-viewport düzen. Mobil uyum v1 için zorunlu değildir (nice-to-have); düzen `flex`/`grid` ile responsive olacak şekilde tasarlanmalı, ama optimize edilmesi gerekmez.

```
┌──────────────────────────────────────────────────────────────────┐
│ ÜST BAR (yükseklik ~60px)                                        │
│  [Sahne 2 / 5]        [Puan: 233 / 500]        [🌐 EN]           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│                     SAHNE TUVALİ (SVG, viewBox 0 0 800 600)      │
│                     — kalan dikey alanın tamamı —                 │
│                     (nesne tepsiden buraya taşınır,                │
│                      hayalet önizleme burada render edilir)       │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ ALT BAR (yükseklik ~100–120px)                                    │
│  [ Nesne Tepsisi ]                    [ Put That There! Butonu ] │
│  (soldan hizalı, tek                  (ortada/sağda, büyük,      │
│   nesne kartı)                         belirgin buton)            │
└──────────────────────────────────────────────────────────────────┘

RESULT_SHOWN durumunda: yukarıdaki düzenin üzerine yarı saydam
karartma + ortalanmış modal panel biner:
┌───────────────────────────────┐
│   ★ ★ ☆                       │
│   "İyi iş! Az daha yaklaş."    │
│   Bu yerleştirme: 58 / 100     │
│   Toplam: 233 / 500            │
│   [ Sonraki Sahne → ]          │
└───────────────────────────────┘

Sahne 5 sonrası FINAL_SUMMARY, tüm viewport'u kaplayan ayrı bir
ekrana geçer (tuval/tepsi kaybolur):
┌──────────────────────────────────────────────────────────────────┐
│                     Oyun Bitti!                                   │
│               Toplam Puan: 388 / 500  (%77.6)                     │
│               Toplam Yıldız: ★★★★★★★★★★★★☆☆☆ (12/15)              │
│               Rütbe: Deneyimli                                    │
│               [ Tekrar Oyna ]                                     │
└──────────────────────────────────────────────────────────────────┘
```

### Bölge özeti

| Bölge | İçerik | Görünürlük |
|---|---|---|
| Üst bar | Sahne sayacı (`sceneCounter`), güncel toplam puan (`scoreLabel`), dil değiştirme butonu (`languageToggle`) | Her zaman görünür (final ekranı hariç). |
| Sahne tuvali | Stilize SVG sahne + hayalet önizleme katmanı | `IDLE`'dan `RESULT_SHOWN`'a kadar görünür; `NEXT_SCENE`'de yeniden yüklenir. |
| Nesne tepsisi | Taşınabilir tek nesne kartı, seçim durumuna göre stil değişir | `IDLE`–`DESTINATION_CONFIRMED` arası etkin; `LOCKED_SCORED`'dan sonra boşalır. |
| Onay butonu | "Put That There!" (`putThatThereButton`) | Yalnızca `DESTINATION_CONFIRMED` durumunda etkin; diğer durumlarda devre dışı/gizli. |
| Sonuç paneli | Yıldızlar, açıklama, puan, toplam, sonraki sahne butonu | Yalnızca `RESULT_SHOWN` durumunda, modal olarak. |
| Final özet ekranı | Toplam puan, toplam yıldız, rütbe, "Tekrar Oyna" | Yalnızca sahne 5 → `NEXT_SCENE` sonrası, tam ekran. |

---

## 5. i18n Metin Anahtarları (Arayüz Metinleri)

Aşağıdaki anahtarlar yalnızca **arayüz iskeleti** (chrome) için gereklidir; sahne içeriği (nesne adları, sahne açıklamaları vb.) her sahne JSON'unda ayrı `_tr`/`_en` alanları olarak tutulur ve bu tabloya dahil değildir. Bu tablo, `data/strings.tr.json` ve `data/strings.en.json` dosyalarının doğrudan referansı olarak kullanılabilir.

| Anahtar | Türkçe (`strings.tr.json`) | English (`strings.en.json`) |
|---|---|---|
| `appTitle` | Şunu Şuraya Koy | Put That There |
| `languageToggle` | EN | TR |
| `sceneCounter` | Sahne {current} / {total} | Scene {current} / {total} |
| `scoreLabel` | Puan: {score} / {max} | Score: {score} / {max} |
| `pickUpHint` | Nesneyi seçmek için tıkla veya sürükle | Click or drag to pick up the object |
| `thatBadge` | BU | THAT |
| `thereBadge` | ORAYA | THERE |
| `putThatThereButton` | Bunu Oraya Koy! | Put That There! |
| `confirmDisabledHint` | Önce bir hedef seç | Choose a destination first |
| `rotateHint` | ← → ile döndür | Rotate with ← → |
| `cancelHint` | İptal etmek için Esc | Press Esc to cancel |
| `resultTitle` | Sonuç | Result |
| `starRating_0` | Hedeften uzak kaldın. Tekrar dene! | You missed the target. Try again! |
| `starRating_1` | Yeterli — biraz daha dikkatli olabilirsin. | Acceptable — you can be more precise. |
| `starRating_2` | İyi iş! Az daha yaklaş. | Good job! Just a bit closer. |
| `starRating_3` | Mükemmel yerleşim! | Perfect placement! |
| `scorePlacementLabel` | Bu yerleştirme: {score} / 100 | This placement: {score} / 100 |
| `runningTotalLabel` | Toplam: {total} / {max} | Total: {total} / {max} |
| `hintRevealLabel` | İşte doğru yer: | Here's the correct spot: |
| `nextSceneButton` | Sonraki Sahne → | Next Scene → |
| `finishButton` | Sonuçları Gör | See Results |
| `finalSummaryTitle` | Oyun Bitti! | Game Over! |
| `finalSummaryScoreLabel` | Toplam Puan: {total} / {max} ({percent}%) | Total Score: {total} / {max} ({percent}%) |
| `finalSummaryStarsLabel` | Toplam Yıldız: {stars} / {maxStars} | Total Stars: {stars} / {maxStars} |
| `finalSummaryRankLabel` | Rütbe: {rank} | Rank: {rank} |
| `rank_master` | Usta Yerleştirici | Master Placer |
| `rank_experienced` | Deneyimli | Experienced |
| `rank_developing` | Gelişmekte | Developing |
| `rank_retry` | Tekrar Dene | Try Again |
| `playAgainButton` | Tekrar Oyna | Play Again |
| `loadingLabel` | Yükleniyor… | Loading… |
| `errorGeneric` | Bir şeyler ters gitti. Sayfayı yenile. | Something went wrong. Please refresh. |
