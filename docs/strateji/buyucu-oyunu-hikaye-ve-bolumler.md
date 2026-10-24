# Büyücünün Gecesi — Hikâye, Bölüm, Düşman, Büyü, Görsel ve Müzik Tasarımı

Durum: TASARIM ÖNERİSİ. Kod yazılmadı; `demo/index.html` değiştirilmedi. Sayılar (hp, hız, süre) oynanarak ayarlanmamış başlangıç değerleridir, "denge testi gerekir".
Kaynak: `demo/index.html` (665 satır) okundu. Aşağıdaki tasarım onun veri yapılarına oturtulmuştur.

## 0. Mevcut oyunun özeti (tasarımın dayandığı gerçekler)

- Arena `ARENA = 14` (28x28), kamera yukarıdan eğik, `BASE_SPEED = 8`, başlangıç can 3.
- `LEVELS`: 5 bölüm; alanlar `name, goal, time, start{}, spawn{}, every, cap, reward, boss`. Süreler 50/55/60/65/100 sn.
- `WEAPONS`: fire, frost (yavaşlatır), arcane (3'lü yelpaze), lightning (zincir 3, 2 hasar). Tuşlar 1–4. Yeni büyü her bölüm sonunda `reward` ile açılıyor.
- `ENEMIES`: ghost (hp1), bat (hp1, zikzak), golem (hp4), boss (hp30, her 6 sn 2 ruh çağırır). Hepsi oyuncuya düz yürür; menzilli saldırı, mermi ya da bölge hasarı yok.
- `PERKS`: hp, speed, power, haste, magnet (bölüm sonu 3 rastgele seçenek).
- Hedef yalnızca "N mana kristali topla" ve "boss'u öldür". Ekranda 5 kristal bulunur, biri alınınca yenisi doğar.
- Bölüm başı/sonu ekranı `screen(title, html, buttons)` ile çiziliyor; hikâye metni için hazır yer var (`introLevel` ve `levelClear`).
- Görsel: tüm geometri ilkel şekiller; kıvılcımlar her seferinde yeni `Mesh` + `SphereGeometry` (performans notu, bkz. §5).
- `three` sürümü 0.185.1 (`vendor/`). `vendor/addons` içinde yalnızca `controls` var; **EffectComposer / UnrealBloomPass yok**. Bloom istenirse addon dosyaları vendor'a eklenmeli (bu tasarım bloom'u sahte yöntemle çözer, gerekmez).

Varsayımlar: oyunun tek dosyada kalması istendiği için hiçbir öneri harici model, görsel ya da ses dosyası gerektirmez. Mobil performansı gerçek cihazda ölçmedim; bütçeler tahmindir.

---

## 1. Ana hikâye

### 1.1 Dünya ve arka plan

Gece Vadisi'nde yüzyıllardır "Gece Kalbi" denen bir mana taşı gündüzü getirirdi. Vadinin son kralı **Veyis**, kızı **Mira** hastalanıp ölünce taşı kendine bağladı: ölümü durduracaktı. Taş çatladı, Veyis bir **Gölge Kral**'a dönüştü, Mira'nın ruhu ise gün ışığına varamayan küçük bir ışık olarak vadide kaldı. O günden beri şafak sökmüyor; ölüler mezarda durmuyor, orman fısıldıyor.

### 1.2 Oyuncu karakteri

**Aldemir** — Gece Kulesi'nin eski çırağı, şimdi orta yaşlı, sakallı, sıradan bir büyücü. Motivasyonu: Kralın taşı bağladığı gece kulede nöbetteydi ve uyuyakaldı. Suçluluk taşıyor; lanetin kalkmasını kendi borcu sayıyor. Oyuncunun görmesi gereken tek duygusal yay: suçluluktan sorumluluğa.

### 1.3 Yan karakterler

| Karakter | Rol | Nasıl görünür (oyun içi) |
|---|---|---|
| **Usta Zerrin** | Mentor. Kulenin yaşlı baş büyücüsü; kendini Gece Kalbi'nin parçalarını saklamak için bir baykuşa dönüştürdü. Bilgelik ve ipucu verir, bazen alaycıdır. | Diyalogda baykuş simgesi; bölüm başlarında "Zerrin: …" satırı. İsteğe bağlı: arenanın kenarında bir ağaç dalında sabit baykuş modeli. |
| **Pırıl** | Dost ruh. Küçük, parlayan bir ışık; aslında Kral'ın kızı Mira'nın ruhu (oyuncu bunu 6. bölümde öğrenir). Aldemir'e yol gösterir, kristallere çeker. | Büyücünün çevresinde dönen küçük emissive küre + PointLight. Kristal toplayınca parlar. Oynanış etkisi: bkz. §4 yetenek "Pırıl'ın Işığı". |
| **Taşkın** | Taş Bekçi'lerin lanetten kurtulmuş tek üyesi; 3. bölümde Aldemir'e katılır, mizahi yan ses. Az konuşur. | 3. bölümden sonra kenarda duran kırık bir golem heykeli (dekor) ve kısa replikler. Savaşa katılmaz (kapsam sınırlama). |

Gölge Kral **Veyis**: kızını geri istiyor; "ben kötü değilim, baba oldum" tonu. Düşmanın trajik olması finali duygusal yapar ve metni kısa tutmayı kolaylaştırır.

### 1.4 Hikâye yayı (üç perde)

1. **Başlangıç (Bölüm 1–3):** Aldemir kuleden çıkar, orman, mağara ve harabede lanetin yayıldığını görür. Pırıl ile tanışır, Taşkın'ı kurtarır. Büyü kazanır.
2. **Gelişme (Bölüm 4–7):** Mezarlık, buzul, yanık köy, kristal yatağı. Lanetin kaynağının Gece Kalbi'nin çatlağı olduğu ve Pırıl'ın kimliği ortaya çıkar. Zerrin'in fedakârlığı. Düşmanlar çeşitlenir.
3. **Final (Bölüm 8–9):** Kemik Kule'deki nöbetçiyi yen, kaleye gir. Gölge Kral ile üç aşamalı savaş. Pırıl'ın ışığı Kral'ın kalkanını kırar; son vuruştan sonra şafak.

### 1.5 Final seçeneği (kapsam notu)

İki son (öldür / kurtar) **MVP dışıdır**. Tek son: Kral yenilir, Pırıl babasının ruhuyla vedalaşır, şafak. İkinci son, istenirse sonraki iterasyonda tek bir seçim ekranıyla eklenir.

### 1.6 Oyun içi sabit metin (açılış ve kapanış)

- Açılış ekranı: "Şafak yüzyıldır doğmadı. Gece Kalbi çatladı. Bunu düzeltebilecek tek kişi, o gece uyuyakalan büyücü: sensin."
- Final ekranı: "Gölge dağıldı. Pırıl babasının elini tuttu ve ilk şafak sökerken ikisi de ışığa karıştı. Vadi uyandı. Aldemir ilk kez rahat uyudu."
- Ölüm ekranı (mevcut "Ruhlar seni yakaladı…" yerine rotasyon, rastgele biri): "Karanlık kazandı… bu gece." / "Zerrin: Kalk. Bir yanlış daha yap, ama başka bir yanlış." / "Pırıl solgunlaştı. Tekrar dene."

---

## 2. Bölümler (9 bölüm)

Genel kural: her bölüm girişte 2 cümlelik anlatı + hedef + düşmanlar gösterir (`introLevel` içindeki `screen` metni); çıkışta 1–2 cümlelik anlatı `levelClear` ekranında yetenek seçiminin üstüne gelir. Metinler ekrana sığsın diye en fazla 3 cümle.

Hedef türleri (yeni tipler uygulama notları §7'de):
- `crystal` = N mana kristali topla (mevcut).
- `survive` = X sn hayatta kal (kristal doğmaz, süre bitince kazanılır; "süre sıfır = kaybet" mantığı tersine döner).
- `totem` = lanet totemlerini yık (sabit, hp'li, hasar almayan düşman gibi davranan nesne).
- `miniboss`, `boss`.

### Bölüm 1 — Fısıldayan Orman
- **Mekân/palet:** Gece ormanı. Zemin `0x1a1030` mor-siyah, sis `0x0a0714`, halka `0x8e44ff`. Pırıl'ın açık yeşil-camgöbeği ışığı vurgu.
- **Dekor:** Mevcut koni ağaçlar + kök çıkıntıları, yer yer mantar kümeleri (emissive yeşil küçük kubbeler), düşmüş kütük, kenarda baykuşlu dal.
- **Hedef:** `crystal`, 6 kristal. **Süre:** 50 sn.
- **Düşman:** başlangıç 3 Ruh; sonradan 8 sn'de bir 1 Ruh, üst sınır 5. (mevcut değerler korunur.)
- **Giriş:** "Zerrin: Kule sustu, orman konuşuyor. Kristalleri topla; mana olmadan büyü olmaz." 
- **Çıkış:** "Zerrin: Fena değil. Ormanın fısıltısı seni tanıdı." Pırıl ilk kez görünür: "Küçük bir ışık yolunu aydınlattı."
- **Açılan:** Buz Oku (mevcut `reward: frost`).
- **Eğri:** Öğretici. Tek düşman tipi, düşük baskı; ödül: buz ile yavaşlatma kavramı.

### Bölüm 2 — Yarasa Mağarası
- **Palet:** Zemin `0x14202e`, sis `0x08101a`, halka `0x44a0ff`. Soğuk mavi, ıslak taş.
- **Dekor:** Sarkıt/dikit (ConeGeometry, baş aşağı ve yukarı), duvar kenarında parlayan mavi kristal kümeleri, zemin su birikintisi (yansımasız, açık mavi yarı saydam disk), tavandan sarkan sarmaşık.
- **Hedef:** `crystal`, 8. **Süre:** 55 sn.
- **Düşman:** başlangıç 2 Ruh + 3 Yarasa; 7 sn'de bir 1 Yarasa + 1 Ruh, üst sınır 7.
- **Giriş:** "Pırıl: Vızıltıyı duyuyor musun? Mağara canlı." 
- **Çıkış:** "Zerrin: Yarasalar korkudan değil, lanetten çıldırıyor. Üçlü büyü bunu halleder."
- **Açılan:** Üçlü Büyü (mevcut `arcane`).
- **Eğri:** Hız tehdidi (zikzaklı yarasa); yelpaze büyü tam ihtiyaç.

### Bölüm 3 — Taş Bekçiler (Kırık Harabe)
- **Palet:** Zemin `0x2a1c14`, sis `0x140c08`, halka `0xffa044`. Kehribar, toz.
- **Dekor:** Yıkık sütunlar (silindir, yarısı kırık), taş kemer (iki sütun + kutu), devrik heykel parçaları, yüzeyde rune çizgileri (emissive ince plane). Taşkın'ın heykeli zeminde yarı gömülü.
- **Hedef:** `crystal`, 10. **Süre:** 60 sn.
- **Düşman:** başlangıç 2 Ruh, 2 Yarasa, 2 Taş Bekçi; 7 sn'de bir 1 Taş Bekçi + 1 Yarasa, üst sınır 8.
- **Giriş:** "Bu harabe bir zamanlar kralın nöbetçilerinin evi. Şimdi lanet, onları taşa gömdü."
- **Çıkış:** "Taşkın taşlaşmış kabuğunu çatlattı: 'Ben… yürüyebiliyorum. Peşindeyim.' Yıldırım çarptığında lanet bir an titredi."
- **Açılan:** Yıldırım (mevcut `reward: lightning`).
- **Eğri:** İlk "dayanıklı düşman" (hp4); oyuncu hareket + zincir hasarı öğrenir.

### Bölüm 4 — Hortlak Mezarlığı
- **Palet:** Zemin `0x142a20`, sis `0x0a1410`, halka `0x44ff9a`. Soluk yeşil, bulutlu ay.
- **Dekor:** Mezar taşları (BoxGeometry + üstte yarım silindir, rastgele eğik; 30–40 adet InstancedMesh), demir çit parçaları, çıplak ölü ağaçlar, zeminde alçak sis katmanı (yarı saydam büyük plane, yavaş kayan), tek fener direği (PointLight, hafif titrer).
- **Hedef:** `crystal`, 12. **Süre:** 65 sn.
- **Düşman:** başlangıç 3 Ruh, 2 Yarasa, 2 Taş Bekçi, **2 Kemik Okçu (yeni)**; 6 sn'de bir Ruh + Okçu, üst sınır 10.
- **Giriş:** "Mezarlar açık, mezarcı yok. Kemik Okçuları menzilden vurur; hareket etmeyi bırakma."
- **Çıkış:** "Zerrin: Kralın askerleri bile huzur bulamıyor. Gece Kalbi'nin çatlağı büyüyor." 
- **Açılan:** yeni büyü yok; **aktif yetenek: Mana Kalkanı** (§4.2). Böylece mevcut `reward: null` bölümü anlamlı hale gelir.
- **Eğri:** İlk menzilli tehdit; "kaç, vur, topla" döngüsüne geçiş. İlk gerçek zorluk sıçraması.

### Bölüm 5 — Donmuş Geçit (Buzul)
- **Palet:** Zemin `0x1a2a3a` açık çelik mavisi, sis `0x0b1a28`, halka `0x9ee8ff`. Parlak beyaz-mavi vurgular.
- **Dekor:** Buz sütunları (yarı saydam Octahedron/uzun koni, `transmission` yerine `opacity 0.6` ucuz), kar yığınları (düzleştirilmiş küreler), donmuş ağaç silüetleri, düşen kar parçacığı (Points, yavaş aşağı), parlayan aurora şeridi gökyüzünde (gradyan plane).
- **Hedef:** `survive`, 45 sn (en kısa bölüm; Kurt Ruhu dalgaları gelir, kristal yok; ekranda 2 kristal rastgele doğar ve kalp/mana ödülü verir, ama hedefi etkilemez).
- **Düşman:** başlangıç 3 Ruh, 3 Yarasa, **2 Kurt Ruhu (yeni)**; 5 sn'de bir 2 Kurt Ruhu + 1 Yarasa, üst sınır 9.
- **Giriş:** "Rüzgâr kemiğe işliyor. Kurt ruhları sürü halinde geliyor; sadece ayakta kal."
- **Çıkış:** "Şafağa daha çok var, ama Pırıl'ın ışığı ilk kez gerçek bir sıcaklık gibi hissettirdi."
- **Açılan:** aktif yetenek **Işınlan (Blink)** (§4.2).
- **Eğri:** Değişim: toplama yerine kaçınma. Kısa ama yoğun (zirve değil, sıçrama).

### Bölüm 6 — Yanık Köy (Totemler)
- **Palet:** Zemin `0x2e1810` kömür, sis `0x1a0a08`, halka `0xff7a2a`. Kızıl-turuncu, dumanlı.
- **Dekor:** Yanmış ev iskeletleri (kutu çerçeveler), köy kuyusu, bükülmüş ahşap kirişler, zeminde kor parçaları (emissive turuncu noktalar), küçük ateş (animasyonlu koni + PointLight), yukarı çıkan kıvılcım/kül parçacıkları.
- **Hedef:** `totem`, 3 Lanet Totemi yık (her biri 10 hp; arenada sabit köşelerde; kristal doğar ama sayılmaz, mana/kalp kaynağıdır). **Süre:** 75 sn.
- **Düşman:** başlangıç 3 Ruh, 2 Taş Bekçi, **3 Kor Hortlak (yeni)**; 6 sn'de bir Kor Hortlak + Ruh, üst sınır 10. Her totem 12 sn'de bir 1 Ruh doğurur.
- **Giriş:** "Köy yanmadı, lanet onu hatırlatıyor. Totemleri yık; kor hortlaklar yakınında patlıyor."
- **Çıkış:** "Totem parçalanınca Pırıl titredi: 'Bu ses… babamın sesi.' Zerrin sustu."  *(Pırıl'ın kimliği açıklanır.)*
- **Açılan:** **Zehir Bulutu** (yeni büyü, §4.1).
- **Eğri:** Hedef değişikliği + alan hasarı; ilk "ne yapmalı?" kararı (totemlere git mi, düşmanı temizle mi).

### Bölüm 7 — Kristal Yatağı
- **Palet:** Zemin `0x1b1838`, sis `0x100c2a`, halka `0xc58cff`. Parlak mor/magenta kristaller, bu oyunun en "renkli" bölümü.
- **Dekor:** Büyük kristal sütunlar (Octahedron, emissive, eksen etrafında hafif yavaş dönen), duvar boyunca kristal kümeleri, zeminde ışık yansımaları (additive plane), havada süzülen toz.
- **Hedef:** `crystal`, 14. **Süre:** 80 sn.
- **Düşman:** başlangıç 3 Ruh, 3 Yarasa, 2 Taş Bekçi, 2 Kemik Okçu, **2 Karanlık Rahip (yeni)**; 6 sn'de bir Rahip veya Okçu + Yarasa, üst sınır 11.
- **Giriş:** "Gece Kalbi'nin kırıkları burada parlıyor. Rahipler düşmanları iyileştirir; önce onları bul."
- **Çıkış:** "Zerrin: Kalbin son kırığı kalede. Dikkat et Aldemir, o kısım artık Veyis'in kendisi."
- **Açılan:** **Meteor** (yeni büyü).
- **Eğri:** Öncelik hedefleme bulmacası (rahibi öldür). Kasıtlı uzun, tırmanışın zirvesi öncesi.

### Bölüm 8 — Kemik Kule (Mini-Boss)
- **Palet:** Zemin `0x1a1a22`, sis `0x0c0c12`, halka `0xd8d8ff`. Soluk gri-mavi, kemik beyazı.
- **Dekor:** Kemik yığınları, kafatası kümeleri (ikosahedron + çene), kuleyi andıran merkezde yüksek silindir çevresinde kemik çit, zemin çatlakları (kırmızı hafif parlayan çizgiler), kuru ağaç.
- **Hedef:** `miniboss`: **Kemik Şövalye** (hp 24, yavaş ağır saldırgan, kalkan sallar). **Süre:** 85 sn.
- **Düşman:** Kemik Şövalye + başlangıç 2 Kemik Okçu, 2 Kurt Ruhu; 6 sn'de bir Okçu + Ruh, üst sınır 9. Şövalye hp %50'de yere kılıç vurup 4 yarıçaplı şok dalgası yapar.
- **Giriş:** "Kralın baş nöbetçisi kuleyi bırakmadı. Şövalye ağır ama bir vuruşu seni gönderir."
- **Çıkış:** "Şövalye toza döndü. Kale kapısı açıldı ve yukarıdan bir ses duyuldu: 'Kızım… neredesin?'"
- **Açılan:** aktif yetenek **Zaman Çatlağı** (kısa süreli düşman yavaşlatma, §4.2).
- **Eğri:** Zirve öncesi sınav: tüm mekanikleri (menzil, kaçış, AoE) birleştirir.

### Bölüm 9 — Gölge Kalesi (Final: Gölge Kral)
- **Palet:** Zemin `0x2e1018`, sis `0x1a0508`, halka `0xff4466` (mevcut boss teması). Kırmızı-mor, ilk fazda sönük; 3. fazda arka plana gün ışığı hissi (çok hafif sıcak ton).
- **Dekor:** Taht (kutular + yüksek arkalık) arenanın uzak ucunda, kırık vitray pencereler (renkli emissive plane), uzun kırmızı perde şeritleri, hâlâ çatlak Gece Kalbi taşı tahtın arkasında yavaş atan emissive küre.
- **Hedef:** `boss` (3 faz). **Süre:** 100 sn (mevcut değer; yetersiz kalırsa faz geçişlerinde +10 sn bonus).
- **Düşman:** Gölge Kral (hp 30 → önerilen 45, denge testi gerekir) + bölüme özel yan düşman: Faz 1 her 6 sn 2 Ruh (mevcut), Faz 2 her 6 sn 1 Kemik Okçu + 1 Yarasa, Faz 3 sadece Pırıl'ın kristalleri ve Kral. Üst sınır 8.
- **Fazlar:**
  1. **Karanlık Taht (hp %100–66):** mevcut yavaş yaklaşma + ruh çağırma.
  2. **Gölge Dalgası (%66–33):** her 8 sn'de yerde kırmızı halka işareti 1.2 sn belirir, sonra o halka alanında hasar (kaçış öğretisi). Okçu çağırır.
  3. **Kızın Işığı (%33–0):** Kral kalkanlı (hasar almaz). Pırıl 3 "ışık kristali" bırakır; hepsi toplanınca kalkan 6 sn kırılır ve hasar alır. Döngü; her kalkan kırılışında Kral +%10 hız.
- **Giriş:** "Veyis: Kızımı geri verin. Şafak gelirse onu bir daha göremem." Zerrin: "Aldemir, ona acıma ama unutma de."
- **Çıkış (final ekranı):** §1.6'daki final metni.
- **Açılan:** yok. Yalnızca skor ekranı.
- **Eğri:** Tepe nokta; kalkan fazı kristal toplama mekaniğini hedef olarak geri getirir.

### Zorluk eğrisi özeti

| # | Bölüm | Hedef | Süre | Başlangıç düşman sayısı | Ort. baskı |
|---|---|---|---|---|---|
| 1 | Fısıldayan Orman | 6 kristal | 50 | 3 | Çok düşük |
| 2 | Yarasa Mağarası | 8 kristal | 55 | 5 | Düşük |
| 3 | Taş Bekçiler | 10 kristal | 60 | 6 | Düşük-orta |
| 4 | Hortlak Mezarlığı | 12 kristal | 65 | 9 | Orta (ilk menzilli) |
| 5 | Donmuş Geçit | 45 sn hayatta kal | 45 | 8 | Orta, kısa ve yoğun |
| 6 | Yanık Köy | 3 totem | 75 | 8 + totem | Orta-yüksek |
| 7 | Kristal Yatağı | 14 kristal | 80 | 12 | Yüksek |
| 8 | Kemik Kule | Mini-boss | 85 | 5 + şövalye | Yüksek |
| 9 | Gölge Kalesi | Boss (3 faz) | 100 | 1 + çağrılar | Tepe |

Ritim: yükselme (1–4), kısa soluk/ritim değişimi (5), hedef çeşitliliği (6), zirve öncesi yoğunluk (7), sınav (8), final (9). Bölüm sonu can +1 (mevcut) ve yetenek seçimi (mevcut) dengeyi korur. Ölüm sonrası "bu bölümü tekrar dene" mevcut `snapshot` ile çalışır; yeni durum alanları da snapshot'a girmeli (§7).

---

## 3. Yeni düşman tipleri (mevcut 4'e ek: 4 tip + 2 özel nesne)

Değerler `ENEMIES` yapısına uyumludur (`hp, speed, r, y, score, drop, color, emissive, dmg`). Davranış için yeni alanlar: `ai: "ranged"|"charge"|"bomber"|"support"`.

| Düşman | İlk bölüm | hp | hız | r | Davranış | Skor / drop |
|---|---|---|---|---|---|---|
| **Kemik Okçu** (`archer`) | 4 | 2 | 1.6 | 0.6 | Oyuncuya 7–9 birim mesafe kalana kadar yaklaşır; daha yakınsa geri çekilir. 2.5 sn'de bir yavaş (hız 7) kemik mermi atar, hasar 1; atıştan önce 0.5 sn silah ışığı parlar (kaçış penceresi). Mermiler büyülere çarpmaz. | 40 / 0.2 kalp |
| **Kurt Ruhu** (`wolf`) | 5 | 2 | 2.4 (hücumda 10) | 0.7 | Oyuncuya yaklaşır; 6 birim yakında durur, 0.7 sn çömelip (gövde alçalır, gözler parlar) düz bir çizgide hücum eder (0.6 sn). Hücum sonrası 1 sn yorgun (yavaş, savunmasız). Buz ile yavaşlatma hücumu iptal etmez ama süresini uzatır. | 45 / 0.15 |
| **Kor Hortlak** (`ember`) | 6 | 2 | 3.2 | 0.7 | Hızlıca koşar. Oyuncuya 1.5 birim yaklaşınca ya da ölünce patlar: yarıçap 2.5 alan hasarı 1 (diğer düşmanlara da, zincir patlama için kullanışlı). Patlamadan önce 0.5 sn kızarır. | 50 / 0.1 |
| **Karanlık Rahip** (`priest`) | 7 | 5 | 1.2 | 0.9 | Oyuncudan uzak durur (10 birim). 4 sn'de bir en yakın 3 düşmana kısa kalkan verir (+1 hp, tek vuruş emer) ve 1 hp'si az olanı iyileştirir. Hasar vermez; öncelikli hedef. Öldüğünde civardaki kalkanlar kalkar. | 80 / 0.5 kalp |

Özel nesneler (düşman listesine "benzer" ama ayrı ele alınır):
- **Lanet Totemi** (`totem`, Bölüm 6): hareketsiz, hp 10, hasar vermez, 12 sn'de bir Ruh doğurur, kristal gibi bir emissive sütun. Yıkıldığında Pırıl'a kısa bir ışık patlaması.
- **Kemik Şövalye** (`knight`, Bölüm 8, mini-boss): hp 24, hız 1.1, r 1.5, dmg 2. Oyuncuya yürür; 5 sn'de bir 1 sn bekleme hazırlığıyla yere vurur (yarıçap 4 şok). Hp %50'de hızlanır (1.6).

Çeşitlilik özeti: yakın dövüş (ghost, golem, knight), hız/zikzak (bat), hücum (wolf), menzil (archer), alan (ember), destek (priest), duvar (totem). Her yeni tip, oyuncunun farklı bir becerisini (kaçma, öncelik, konum) ölçer.

Not (varsayım): Mevcut ruh, yarasa, golem aynı şekilde tüm bölümlerde kullanılıyor; zorluk eğrisini sağlamak için 4. bölümden sonra Ruh sayıları azaltılmıştır (§2 tablosunda görünür).

---

## 4. Yeni büyüler ve yetenekler

### 4.1 Yeni büyüler (silah çubuğuna eklenir)

| Büyü | Tuş | Bölüm | cd | Etki | Uygulama notu |
|---|---|---|---|---|---|
| **Zehir Bulutu** (`poison`) | 5 | 6 sonu | 1.4 | Nişan yönünde 8 birim ileri gider, orada 4 sn kalan yarıçap 2.2 bir bulut bırakır. Bulutta düşmanlar saniyede 1 hasar alır (dmg çarpanı dikkate alınır). Rahip kalkanı hasarı emmez. | Mermi yerine "bulut" nesnesi; her 0.5 sn kontrolle hasar. |
| **Meteor** (`meteor`) | 6 | 7 sonu | 2.8 | İmleç/nişan noktasına (mobilde en yakın düşman) 0.8 sn gecikmeyle gökten düşen ateş topu; yarıçap 3, hasar 3. Düşmanların gecikmeyi kaçırması mümkün (öğretir). | Yer işareti halkası + hızla inen küre; yakın düşmana otomatik. |
| **Ay Işığı Halkası** (`nova`) | 7 | 8 sonu | 4.5 | Oyuncunun çevresinde yarıçap 4 şok dalgası, hasar 1 + itme. Yaklaşan düşmanlar için "acil durum" büyüsü. | Mevcut `wizard.position` merkezli genişleyen ring. |

Toplam 7 büyü; 1–4 ile 5–7 tuşları. Mobilde 7 buton sığmaz: bkz. §7 maddesi 3 (büyü çubuğu mobilde kaydırılabilir veya "son büyü / sonraki büyü" butonu).

Her büyü bir rol üstlenir: Ateş (genel), Buz (kontrol), Üçlü (kalabalık), Yıldırım (zincir/hedefsiz), Zehir (alan/zaman), Meteor (yüksek hasar), Halka (savunma).

### 4.2 Aktif yetenekler (cooldown'lu, büyü çubuğundan ayrı)

Ayrı tuşlar: `Q` ve `E`; mobilde ateş butonunun üstünde iki küçük buton.

| Yetenek | Bölüm | cd | Etki |
|---|---|---|---|
| **Mana Kalkanı** (`shield`) | 4 sonu | 14 sn | Bir sonraki hasarı emer (en fazla 8 sn). Büyücünün çevresinde mavi küre. |
| **Işınlan** (`blink`) | 5 sonu | 5 sn | İmleç/hareket yönünde 5 birim anlık atılma, 0.4 sn dokunulmazlık, iz bırakan kıvılcım. |
| **Zaman Çatlağı** (`timeslow`) | 8 sonu | 18 sn | 3 sn boyunca tüm düşman ve mermiler %60 yavaşlar (oyuncu normal). Boss'a da etki eder (kalkan fazında sayacı kırmaz). |

Dengesizlik riski: Kalkan + Işınlan + Zaman Çatlağı birlikte "fazla güçlü" olabilir. Başlangıçta cd'ler uzun tutuldu; denge testi gerekir.

### 4.3 Yeni pasif yetenekler (PERKS'e ek; mevcut 5'in üstüne 6 tane)

| Yetenek | Etki |
|---|---|
| **Vampir Dokunuş** | Her 12 öldürmede 1 can (azami canı geçmez). |
| **Delici Büyü** | Ateş/Buz/Üçlü mermileri 1 düşmanı delip geçer. |
| **Yankı** | %20 ihtimalle büyü iki kez atılır. |
| **Pırıl'ın Işığı** | Pırıl en yakın kristale doğru küçük bir ışık çizgisi gösterir ve kristal toplama yarıçapı +0.5. (Hikâye bağlantılı; Bölüm 2'den sonra seçenek olarak çıkar.) |
| **Taş Deri** | Sonraki 2 bölümde alınan hasarın ilk vuruşunu %50 azaltır (bölüm başı yenilenir). |
| **Mana Yağmuru** | Kristal toplandığında %10 ihtimalle ekstra 1 kristal sayılır. |

Seçim havuzu 11 yetenek olur, her bölüm sonunda rastgele 3 gösterilir (mevcut mantık). Kuralı: aynı perk art arda iki kez gelmesin ve `hp` perk'i en fazla 3 kez alınsın (azami can 6 sınırı, HUD'a sığması için).

### 4.4 Bölümlere dağılım

| Bölüm sonu | Ödül |
|---|---|
| 1 | Buz Oku |
| 2 | Üçlü Büyü |
| 3 | Yıldırım |
| 4 | Mana Kalkanı (aktif) |
| 5 | Işınlan (aktif) |
| 6 | Zehir Bulutu |
| 7 | Meteor |
| 8 | Ay Işığı Halkası + Zaman Çatlağı (aktif) |
| 9 | — |

Not: Bölüm 8 çift ödül verir çünkü 9. bölüm tek bir hedefe odaklanır. İstenirse Zaman Çatlağı'nı Bölüm 7'ye çekerek dağılım düzeltilebilir.

---

## 5. Görsel yön (Three.js 0.185, harici model yok)

Genel ilke: ilkel şekilleri **birleştirip** (grup), **vertex rengi ve düz gölgelendirme (flatShading)** ile elle yapılmış hissi vermek; gerçekçilik "silüet + ışık + küçük hareket" ile gelir, poligon sayısıyla değil. Hedef bütçe (tahmin, ölçülmedi): sahne toplamı 60–80k üçgen, 2 gölge ışığı, 100–150 draw call. Mobilde `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`.

### 5.1 Büyücü (Aldemir)

- **Cüppe:** `ConeGeometry` yerine `LatheGeometry` (profil noktaları: omuz 0.35, bel 0.30, etek 0.75, yükseklik 1.7). Etek kıvrımı için lathe sonrası vertex yarıçapını açıya göre bozmak: `r *= 1 + 0.07*sin(7*theta) + 0.03*sin(13*theta)` (yalnızca alt yarı, y<0.8). 24 radyal segment. `flatShading: true`.
- **Renk gradyanı:** vertex colors; yukarı `0x5a34b8`, etek `0x24104f` (aşağı doğru kararır). Etek altına koyu kenar şeridi (ince torus, `0x1a0a38`).
- **Kemer ve kese:** Bel yüksekliğinde `TorusGeometry(0.33, 0.04)` altın (`0xc8a24a`, metalness 0.6), yanına küçük kutu/küre kese.
- **Kollar:** İki adet `CylinderGeometry` (üst 0.12, alt 0.2, uzunluk 0.7) geniş kol ağzıyla; sağ kol asaya doğru hafifçe öne uzanık, sol kol aşağıda. Eller: küçük küreler (ten rengi).
- **Pelerin/kukuleta arkası:** 6x8 bölmeli `PlaneGeometry`; her karede arka alt satır vertex'lerine `sin(t*2 + x*3)*0.05` ile dalga (toplam 63 vertex, ucuz). Hareket hızına göre arkaya savrulur (`dir` ters yönüne eğim).
- **Baş:** Küre yerine hafif sivri çene için `SphereGeometry` y-ölçeği 1.1, z-ölçeği 0.95. Burun: küçük koni. Gözler: iki küçük emissive küre (`0xffe9a8`), kaşlar ince kutu.
- **Sakal:** 3 katlı: büyük çene konisi (ters çevrilmiş, ağır, `0xe8e4f2` gri-beyaz), iki yan kıvrım için küçük koni çiftleri, bıyık için iki küçük yatık silindir. Her karede sakal grubu `rotation.x = sin(t*2)*0.05 + hareket*0.2` ile sallanır. Burun gölgede kalırsa sakal yüze doğru ışık yansıtır (emissive düşük).
- **Şapka:** Mevcut koni 3 parçaya bölünür: alt koni, orta koni (bükülmüş), uç koni (kıvrık). Bükme: ConeGeometry vertex'lerinde `x += y*y*0.12` ile eğim. Kenar: `CylinderGeometry` yerine `RingGeometry` + kalınlık için ince silindir; kenar hafif dalgalı (vertex y `+= sin(angle*5)*0.03`). Şapka bandı: altın torus + küçük toka (kutu). Uçta küçük bir yıldız (emissive Octahedron).
- **Asa:** Mevcut düz silindir yerine `TubeGeometry` (CatmullRomCurve3, 6 kontrol noktası, hafif eğri/burkulma) yarıçap 0.05; üst uçta 3 pençe (ince koni ×3) arasında emissive `orbTip` kristali (Octahedron, büyü rengi). Pulse: `scale = 1 + 0.1*sin(t*6)`. `wand` PointLight rengi seçilen büyüyle değişir (şu an sabit mor; `selectWeapon` bunu yapmıyor).
- **Animasyon (kemiksiz):** Yürürken gövde `position.y` sallanması (`abs(sin(t*10))*0.06`) ve öne eğim; dururken nefes (`scale.y = 1 + sin(t*1.5)*0.015`). Ateş edince asa kolu 0.15 sn öne vurur (basit rotasyon tween).
- **Pırıl:** küçük icosahedron, additive sprite hale, 3–4 yörünge parçacığı, 8 saniyede bir kısa "zikzak" uçuş.

### 5.2 Düşman silüetleri

Düşmanlar şu an tek ilkel şekil (küre, koni, kutu). Hedef: **uzaktan bile tanınabilir siluet** (kamera yukarıdan olduğu için üst görünüm okunur olmalı).
- **Ruh:** Lathe ile damla gövde + dalgalı alt kenar (vertex dalga animasyonu), iki içbükey kör göz çukuru (koyu küre) ve içinde emissive nokta. İki uzun kol kıvrımı (ince koni). Opaklık 0.7; arkasında additive yarı saydam hale.
- **Yarasa:** Küçük gövde (küre) + iki kanat (her biri 4 üçgenli özel BufferGeometry), kanatlar `rotation.z = sin(t*18)*0.7` ile çırpar. İki küçük kulak (koni), kırmızı gözler.
- **Taş Bekçi:** Kutu yığını: gövde (geniş kutu), omuzlar (iki küçük kutu), baş (küçük kutu, kaşlı), kollar (uzun kutu); gövdede emissive rune çizgileri (ince plane, yeşil/kehribar), yosun yamaları (yeşil düzleştirilmiş küreler). Yürürken sağ-sol sallanma.
- **Kemik Okçu:** İnce kutu gövde (kaburga için 3 yatay ince silindir), küçük kafatası (küre + çene kutusu), yay (yarım `TorusGeometry` + ince çizgi). Mavi-beyaz emissive göz.
- **Kurt Ruhu:** Alçak uzun gövde (kapsül), koni burun, iki üçgen kulak, uzun kuyruk (koni dizisi). Şeffaf mavi-beyaz, buz teması; hücum öncesi emissive artar.
- **Kor Hortlak:** İkosahedron çekirdek (turuncu emissive) + etrafında dönen 3 küçük kor parçası; arkasında kıvılcım izi. Patlamadan önce renk beyaza kayar.
- **Karanlık Rahip:** Uzun siyah-mor cüppe (büyücünün lathe'ının ters paleti), kukuleta (yarım küre), asasında yeşil kristal; etrafında yavaş dönen halka (kalkan verdiği hedefe ışık çizgisi).
- **Gölge Kral:** Büyücünün 1.8x ölçeği, siyah-kırmızı cüppe; kafada diken-taç (6–8 koni), omuzlarda zırh plakaları, yırtık pelerin. Etrafında dönen 5–6 gölge parçası (Octahedron, yarı saydam), gövde içinden kırmızı çatlak çizgiler (emissive). Faz 3'te göğüste Gece Kalbi küresi parlar.

Tüm düşmanlarda **vuruş efekti:** vurulunca 0.08 sn boyunca `emissive` beyaza, ve hafif geri itme (şu an yok). Yavaşlama için mevcut renk değişimi korunur ama buz kristali (küçük Octahedron'lar) eklenir.

### 5.3 Işık ve gölge

- Ay: `DirectionalLight` mevcut; `shadow.mapSize` masaüstü 2048, mobil 1024; `shadow.bias = -0.0005`, `normalBias = 0.03`.
- Büyücü `wand` ışığı: mevcut. Eklenecek: kıvılcım gibi hafif titreme (`intensity = 40 + sin(t*13)*4 + rand`), ve seçili büyü rengine geçiş.
- Mermiler: her büyü mermisi küçük bir `PointLight` taşımamalı (performans); yerine additive hale sprite. Tek istisna: Meteor çarpma anında 0.2 sn'lik tek ışık.
- Bölüm başına `hemi` ve `moon` rengi tema tablosuna eklenir (`THEMES` içine `hemi, moon, fog density`). Bölüm 5'te daha açık mavi ay, Bölüm 6'da turuncu hemi, Bölüm 9'da kırmızı-mor.
- **Fake bloom:** Post-process yok (addon vendor'da yok). Parlak şeyler (kristal, orb, kalp, gözler) etrafında additive, `depthWrite: false` yumuşak yuvarlak sprite (canvas ile üretilmiş radyal gradyan texture) kullan.
- **Kontakt gölgesi:** Düşmanlar için `castShadow` yerine altlarına yarı saydam koyu daire (blob gölge); gölge haritası maliyetini düşürür. Büyücü ve boss gerçek gölge atar.

### 5.4 Parçacık ve çevre

- **Kıvılcım havuzu:** Mevcut `burst` her çağrıda yeni `Mesh` + `SphereGeometry` + `MeshBasicMaterial` oluşturuyor (çöp üretir, Bölüm 4+ yoğunluğunda takılma riski). Yerine tek `THREE.Points` (örn. 600 parçacık, `BufferAttribute` konum/renk/ömür), `AdditiveBlending`. `burst` yalnızca havuzdan boş slot alır.
- **Dekor instancing:** Ağaç, mezar taşı, sütun için `InstancedMesh`; tema değişince matrisler yeniden yazılır. Mevcut 28 ağaç ayrı mesh + her biri kendi materyalini oluşturuyor; instancing ile paylaşılır.
- **Sis:** Mevcut `FogExp2` + zeminde 2–3 katman yarı saydam büyük plane (canvas gürültü texture), yavaş UV kaydırma. Bölüm 4 ve 8'de yoğun.
- **Hava:** Bölüm 5 kar (Points aşağı akış), 6 kül/kıvılcım (yukarı), 7 toz/kristal parıltısı, 9 kırmızı toz.
- **Zemin:** `CanvasTexture` ile 256x256 gürültü/çatlak/ot dokusu (elle üretilmiş: rastgele noktalar, çizgiler); tema rengiyle çarpılır. Düz tek renk yerine bu tek hamle gerçekçiliği en çok artıran şeydir.
- **Gökyüzü:** `scene.background` yerine gradyan shader küre ya da büyük canvas texture; ay (büyük sprite + hale), yıldızlar yanıp sönen (Points'ın `size` veya renk animasyonu). Mevcut yıldızlar: 600 float'tan 200 nokta, kamera hareketinden bağımsız.
- **Büyü efektleri:** Ateş topu: çekirdek + yukarı doğru dalgalı kuyruk (3 azalan küre). Buz: uzun sivri koni (ok), iz bırakan beyaz parçacık. Üçlü: mor, küçük dönen halka. Yıldırım: mevcut `Line` (WebGL'de çizgi kalınlığı 1 piksel; kalın görünüm için 3 çizgi küçük ofsetle ya da `Mesh` şerit). Yıldırım çizgisini sinüsle titrek (zigzag, 6–8 ara nokta) yap.

### 5.5 Dürüstlük notu

Bu yönergelerin hiçbiri bu oturumda denenmedi; Three.js API'leri (LatheGeometry, TubeGeometry, InstancedMesh, CanvasTexture) 0.185'te mevcuttur, ama poligon/draw call bütçesi cihazda ölçülmeli. "Gerçekçilik" burada **stilize ama detaylı** anlamında; fotogerçekçi değildir.

---

## 6. Müzik ve ses yönü (Web Audio API, harici dosya yok)

### 6.1 Mimari

- Tek `AudioContext`, kullanıcının ilk tıklamasında ("Büyüyü Başlat") `resume()` edilir (tarayıcı otomatik oynatma kuralı). Ses kapat/aç düğmesi HUD'da ve `localStorage` ayarı (isteğe bağlı).
- Grafik: `master gain → compressor → destination`. Paylaşılan `ConvolverNode` reverb (1.8 sn gürültüden üretilmiş üssel sönümlü impulse; kuru/ıslak mix %25). Mobilde reverb impulse 1.2 sn.
- **Zamanlayıcı:** `setInterval(25ms)` ile lookahead (0.15 sn) planlayıcı; nota zamanlaması `ctx.currentTime` üzerinden. (Klasik "A Tale of Two Clocks" deseni.) Sekme arka plana gidince `visibilitychange` ile müzik durur.
- **Katmanlar** (bölümlere göre ayrı gain; geçişlerde 1.5 sn crossfade):
  1. **Pad:** 3 detune'lu `sawtooth` osilatör (±7 cent) → alçak geçiren filtre (cutoff 600–1200 Hz, yavaş LFO ile salınır) → yavaş saldırı (1.5 sn) ve bırakma (2 sn). Akor değişimi her 2 ölçü.
  2. **Arp:** `triangle` veya yumuşak `square` + kısa zarf (attack 5 ms, decay 250 ms), 8'lik nota, gamdan rastgele-yönlü seçim (son notayı tekrar etmeme kuralı). Reverb'e yüksek gönderme.
  3. **Çan:** Sinüs + ikinci sinüs (frekans ×2.76, yarı genlik) + üçüncü (×5.4, çeyrek genlik); uzun bırakma (2.5 sn). Seyrek (2–4 ölçüde bir).
  4. **Bas/drone:** Kök notada `sine` + bir oktav altı, 4 ölçü sabit.
  5. **Rüzgâr/atmosfer:** Beyaz gürültü → bant geçiren filtre (cutoff yavaş LFO), çok düşük ses.
  6. **Savaş katmanı (ritim):** Yumuşak "tom" (sine, frekans 120→50 Hz hızlı düşüş), "hi-hat" (beyaz gürültü + yüksek geçiren, 30 ms), 8'lik ve 16'lık nota; yalnızca savaş yoğunluğu yüksekse.
- **Yoğunluk sistemi:** `intensity` 0–1: ekrandaki düşman sayısı / `cap`, can azlığı ve süre sonu (son 10 sn) ile hesaplanır, saniyede bir güncellenir. `intensity > 0.5`: ritim katmanı + arp 16'lık; `> 0.8`: bas yürüyüşü ve filtre açılımı. Böylece "savaş vs. sakin" aynı bölüm içinde fark oluşur.
- **Ses sınırı:** Aynı anda en fazla ~14 canlı osilatör; üstünde yeni notalar atlanır. Her nota bitince `stop()` ve düğüm kopar (bellek sızıntısı olmasın).

### 6.2 Bölüm başına ruh hali

MIDI kök notaları yaklaşıktır; tempo BPM; gamlar yarım ton dizileri.

| # | Bölüm | Kök / gam | BPM | Ruh hali | Baskın sesler |
|---|---|---|---|---|---|
| 1 | Fısıldayan Orman | D dorian `[0,2,3,5,7,9,10]` | 66 | Gizemli, nazik | Pad + seyrek çan, yavaş arp, rüzgâr |
| 2 | Yarasa Mağarası | E phrygian `[0,1,3,5,7,8,10]` | 60 | Soğuk, yankılı | Alçak pad, damla (çan, uzun reverb), düşük gürültü |
| 3 | Taş Bekçiler | C minör pentatonik `[0,3,5,7,10]` | 72 | Ağır, anıtsal | Boş beşli bas drone, ağır tom, tek nota çan |
| 4 | Hortlak Mezarlığı | A harmonik minör `[0,2,3,5,7,8,11]` | 76 | Ürpertici | Detune pad (daha geniş), seyrek yüksek arp, gerilimli çan |
| 5 | Donmuş Geçit | E lidyen `[0,2,4,6,7,9,11]` | 84 | Parlak ama tehlikeli | Cam gibi çanlar, hızlı yüksek arp, rüzgâr yoğun |
| 6 | Yanık Köy | D frig dominant `[0,1,4,5,7,8,10]` | 96 | Gergin, ritimli | Sürekli tom, çarpık arp, kısa gürültü patlamaları |
| 7 | Kristal Yatağı | G lidyen `[0,2,4,6,7,9,11]` | 88 | Büyüleyici, parlak | Yoğun çan/arp, geniş pad |
| 8 | Kemik Kule | C# azalan (whole-half) `[0,2,3,5,6,8,9,11]` | 80 | Soğuk, rahatsız | Dissonant pad, tek nota tekrarı, ağır tom |
| 9 | Gölge Kalesi (Boss) | D harmonik minör `[0,2,3,5,7,8,11]` | 108 | Dramatik | Bkz. 6.3 |

Menü/ara ekran: Bölüm 1'in pad'i, arp'sız, daha düşük filtre. Kazanma ekranı: majör (D majör) kısa çan arpı + pad açılımı (yaklaşık 6 sn).

### 6.3 Savaş ve boss farkı

- **Normal bölüm savaşı:** ritim katmanı yalnızca `intensity > 0.5`; tempo sabit; arpejler 8'likten 16'lığa.
- **Boss (Bölüm 9):** BPM 108, sürekli ritim (tom 4/4 + yarım ölçüde hi-hat), bas yürüyüşü (kök–b6–kök–5), geniş dört sesli `sawtooth` "pirinç benzeri" pad (daha parlak filtre), akor değişimi her ölçü. Faz geçişlerinde: Faz 2'de ritim 16'lıklara, Faz 3'te ritim sustuktan sonra yalnızca çan melodisi + yumuşak pad (Pırıl teması) ve kalkan kırılınca kısa tam ritim patlaması. Pırıl teması: D majör pentatonik, yavaş, tek sesli çan; Bölüm 1–2'de sessizce ima edilir (leitmotif).
- Yenilgi: kısa alçalan minör arp + low-pass süpürme (filtre 1200 → 120 Hz, 1.2 sn).

### 6.4 Ses efektleri listesi

Hepsi osilatör/gürültü ile üretilir; her biri en fazla 0.1–1.2 sn.

| Efekt | Tarif |
|---|---|
| Ateş topu | Gürültü → bant geçiren (900 Hz, aşağı süpürme) + sawtooth 220→110 Hz, 0.25 sn |
| Buz oku | Yüksek sine 1800→2400 Hz + kısa cam çınlaması (üçüncü harmonik), 0.2 sn |
| Üçlü büyü | Üç ardışık küçük çan (aralarında 40 ms), akor notaları |
| Yıldırım | Beyaz gürültü patlaması + 60 Hz sine vuruş, yüksek geçiren; zincirde her hedef için 50 ms gecikmeli tık |
| Zehir Bulutu | Düşük gürültü + yavaş vibrato sine, "fışırtı" 0.6 sn |
| Meteor | Düşüş: sine 600→80 Hz (0.8 sn); çarpma: gürültü + 40 Hz tom, düşük geçiren |
| Ay Işığı Halkası | Genişleyen sine süpürmesi 200→800 Hz + çan |
| Mermi isabeti | Çok kısa gürültü tıkı (30 ms) + sine pitch düşüşü |
| Düşman ölümü | Ruh: ters süpürme (sine 600→200 Hz, soluk). Taş Bekçi: düşük "çatırtı" (gürültü) + tom. Yarasa: kısa tiz cik. |
| Hasar alma | Sawtooth 200→60 Hz + gürültü 0.25 sn; ekran titremesi eşlik |
| Can (kalp) | İki sesli yükselen sine (kısa, sıcak) |
| Kristal toplama | Sine çan (frekans toplanan sayıya göre yükselir: gamdaki sonraki nota) — oyuncu ilerlemeyi duyar |
| Bölüm geçişi (başarı) | 4 notalı yükselen çan arpı + pad açılımı, 2 sn |
| Yeni büyü/yetenek açıldı | Parlak "parıltı" (yüksek sine'lar hızlı, rastgele) + kısa akor |
| Menü tıkı | 20 ms yumuşak square tık |
| Totem yıkımı | Bas darbe + cam kırılması (gürültü), Pırıl'ın kısa yankı çanı |
| Kalkan kırıldı (boss) | Güçlü yüksek cam çınlaması + 60 Hz tom |
| Zaman Çatlağı | Kayıt geri sarma hissi: sine 800→100 Hz, filtre kapanması, sonra bırakınca ters |

### 6.5 Dürüstlük notu

Hiçbir ses duyulmadı/test edilmedi. Parametreler (cutoff, ADSR, BPM) yazılı öneri; ilk uygulamada mutlaka kulakla ayarlanmalı. Müzik "kötü" çıkarsa en güvenli geri çekilme: yalnızca pad + seyrek çan + ses efektleri (arp ve ritim katmanları kapatılır).

---

## 7. Geliştirme odası için uygulama listesi (öncelik sıralı)

Hedef: tek `index.html` kalsın. Tahmini büyüme: ~665 satırdan ~1900–2400 satıra. Aşağıdaki sıra, her adımdan sonra oyunun çalışır kalmasını gözetir. Tahmini zorluk: K=küçük, O=orta, B=büyük.

### P0 — Veri altyapısı (oynanış zemini; ilk yapılacak)

1. **LEVELS genişlet (K):** 5 → 9 bölüm; alanlar: `objective` (`crystal|survive|totem|miniboss|boss`), `intro`, `outro` (metin), `theme` index. `THEMES` 9 girişe çıkar (+ `hemi`, `moon`, fog). `ENEMY_NAMES` ve `introLevel`, `levelClear`'daki "5 bölüm" gibi sabitler `LEVELS.length`'e bağlanmalı (ana ekrandaki "5 lanetli bölüm" metni dahil).
2. **Hedef türleri (O):** `survive` (süre azalıp 0'a inince kazanma; `timeLeft<=0` kodu `gameOver` yerine `levelClear`), `totem` (sabit nesne listesi; `killEnemy` benzeri), `miniboss` (boss mantığının genellemesi: `bossRef`'in `boss/knight` ikisini de taşıması, HUD).
3. **Hikâye ekranları (K):** `introLevel` ve `levelClear` metnine `L.intro` / `L.outro` ekle. Konuşan karakter adı kalın. Açılış, final ve ölüm metinleri (§1.6).
4. **Snapshot genişlemesi (K):** `S`'e yeni alanlar (yeni büyüler, `abilities`, perk sayaçları) eklendiğinde `snapshot` kopyası ve "Bu bölümü tekrar dene" doğru çalışmalı (derin kopya mevcut; yeni diziler için kontrol).

### P1 — Yeni düşmanlar ve boss fazları (oynanışın asıl çeşitliliği)

5. **Düşman AI (O-B):** `ENEMIES`'e `ai` alanı; döngüde `switch(e.d.ai)`: `ranged` (mesafe tutma + atış), `charge` (durum makinesi: yaklaş/çömel/hücum/yorgun), `bomber` (yaklaşınca patla), `support` (kalkan/iyileştirme + uzak durma). Düşman mermileri için `enemyShots` listesi (oyuncuya çarpınca `damagePlayer`).
6. **Yeni düşman geometrisi (O):** §5.2 grupları; `enemyGeos` yerine `buildEnemy(type)` fabrikası (grup döndürür). Çarpışma hâlâ `d.r` ile yapılır, görsel grup bağımsız.
7. **Boss fazları (O):** `bossRef.hp` oranına göre `phase`; yer işareti halkaları (telegraph), Faz 3 kalkan + ışık kristalleri.
8. **Mini-boss Kemik Şövalye (K-O):** boss kodunun küçük varyantı.

### P2 — Yeni büyüler, aktif yetenekler, yeni perk'ler

9. **WEAPONS / WEAPON_ORDER genişlet (O):** `poison`, `meteor`, `nova`; klavye `Digit5–7`; `cast()` içinde yeni dallar (`cloud`, `aoe`, `nova`).
10. **Aktif yetenekler (O):** `ABILITIES` tablosu (`shield`, `blink`, `timeslow`), tuşlar Q/E, cd göstergesi (HUD butonları); `damagePlayer` kalkan kontrolü; hareket sırasında blink; `timeslow` için global `dtScale`.
11. **PERKS genişlet (K):** 6 yeni perk; havuz kuralı (art arda tekrar yok, `hp` üst sınırı).
12. **Mobil UI (O):** 7 büyü butonu sığmaz → büyü çubuğu yatay kaydırılabilir ya da tek "büyü değiştir" butonu + son seçilen; yetenek butonları ateş butonunun yanında (basma alanı ≥ 44 px). Gerçek cihazda denenmedi.

### P3 — Görsel yükseltme

13. **Performans temeli (O):** Kıvılcım havuzu (tek `Points`), ağaç/dekor `InstancedMesh`, ortak materyaller. Bu madde, P1'in yeni görsellerinden **önce** yapılırsa kare hızı düşmez.
14. **Büyücü modeli (O):** §5.1 (lathe cüppe, sakal, şapka, asa, kollar, pelerin dalgası, Pırıl).
15. **Bölüm dekoru (O-B):** `buildScenery(themeIndex)`: eski dekoru siler (dispose), bölüme uygun grupları kurar (ağaç, mezar, sütun, kristal, buz, kemik, vitray). 9 bölüm için ortak yardımcı fonksiyonlar (`makeTree`, `makeGrave`, `makePillar`, `makeCrystalCluster`).
16. **Işık/gölge/gökyüzü (K-O):** §5.3–5.4: zemin texture, ay sprite, gökyüzü gradyanı, hava parçacığı, wand ışığı titremesi/renk değişimi.
17. **Vuruş geri bildirimi (K):** emissive flash, geri itme, ekran titremesi (kamera offset).

### P4 — Ses ve müzik

18. **Ses motoru (O):** `AudioEngine` nesnesi (context, master, reverb, scheduler) + `sfx.*` fonksiyonları (§6.4), ilk tıklamada başlatma, sessize alma düğmesi.
19. **Müzik (B):** Bölüm ruh hali tablosu `MUSIC[level]` (kök, gam, bpm, katmanlar), yoğunluk sistemi, boss özel müziği, faz ve geçiş sesleri.

### P5 — Cila (zaman kalırsa)

20. İkinci son (kurtarma/öldürme), kalıcı en yüksek skor (`localStorage`), Taşkın ve Zerrin için sahne içi görünür nesneler, zorluk seçeneği.

### Ölçeklendirme ve risk notları

- **Dosya büyüklüğü:** Tek HTML 2000+ satır olabilir; bakım zorlaşırsa veriyi (LEVELS/ENEMIES/MUSIC) dosyanın başında tek bloğa topla, bölümlerde yorum başlıkları kullan. Ayrı dosya yapmak "tek dosya" kısıtını bozar; karar Emre'nin.
- **Mobil performans:** En büyük risk. Sırayla: kıvılcım havuzu, gölge çözünürlüğü, dekor instancing, pixelRatio üst sınırı. Yeni düşman sayısı `cap` ile sınırlı kalsın (≤ 11).
- **Denge:** Tüm sayılar tahmindir. Önerilen test: her bölüm için ortalama süre-bitirme oranı ve ölüm sayısı (en az 5 deneme); hedefler: B1–3 %90 geçiş, B4–6 %70, B7–8 %50, B9 %40 (ilk denemede).
- **Test edemedim:** Hiçbir kod çalıştırılmadı; bütün sayılar ve API kullanımı kâğıt üstünde.
- **Eksik bilgi:** Hedef cihaz listesi ve fps hedefi verilmedi; 60 fps masaüstü, 30+ fps orta seviye mobil varsaydım.
- **Çeviri/tutarlılık:** Metinler ekranda 2–3 cümleyi geçmesin; Türkçe karakterli font (Georgia) mevcut; yeni simgeler için emoji desteği cihazlara göre değişir (ör. 🪄 eski cihazlarda kutu görünebilir).
