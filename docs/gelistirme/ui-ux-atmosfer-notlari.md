# UI/UX ve atmosfer paketi — geliştirme notları

Kapsam: HUD, silah/yetenek çubuğu, kart tabanlı bölüm sonu, menü + giriş, harita, kamera açıları, gökyüzü/ufuk, genel görsel dil.

## Yeni/değişen modüller
- `js/ui/` hud.js (yeniden yazıldı), screens.js (ekran yönlendirici + scope temizliği), menu.js, map.js, result.js, models.js (saf görünüm modelleri), icons.js (satır içi SVG), text.js (kısa arayüz etiketleri)
- `js/game/campaign.js` (kayıt oturumu, alıştırma), `js/game/cameramath.js` (saf kamera matematiği), `js/game/progress.js` (+buildMapGraph, mapPoints)
- `js/render/camera.js` (kamera donanımı), `scene.js`/`themes.js`/`scenery.js` (gökyüzü, aurora, bulut, ufuk siluet, ay)
- `css/game.css` baştan yazıldı (belirteçler :root'ta)

## Mimariyle ilişki / sapmalar
- Config şeması, `schemaVersion`, oynanış sayıları, ses DEĞİŞMEDİ. Kamera/harita etiketleri config yerine `js/ui/text.js`'te (ileride `strings.ui` altına taşınabilir); düşman/perk simgeleri ve nadirlik UI tarafında türetilir (`models.js`), config'e alan eklenmedi.
- Mimari §11'deki ayrı `ui/router.js`, `ui/intro.js`, `tokens.css`/`map.css` dosyaları yerine: yönlendirici `screens.js`, giriş `menu.js` içinde, tek `game.css`.
- Nadirlik: perk `maxStacks` değerinden türetilir (1 destansı, 2 nadir, diğer yaygın).
- Alıştırma kayıtları: gerçek koşu `camp.practice.real`'de tutulur, kayıt hep ondan yazılır.

## Oyun ekranı yeniden tasarımı
Referans: `assets/UI Mockup/` (repoya kopyalanmadı). Palet belirteçleri `:root`'ta: `--night #0B1029`, `--mystic #2E1A59`, `--spell #6B3BFF`, `--glow #A78BFF`, `--energy #4DDCFF`, `--gold-light #FFD87A`, `--amber`, `--panel`, `--gold-line`, `--r-panel`. Yeniden kullanılabilir bileşenler: `.panel` (koyu cam, blur yok), `.gold-frame` (altın çerçeve + mor parıltı), `.panel-title`, `.round-btn`, `.gbtn.danger`.

### Yerleşim
- **Sol üst:** amblem (`assets/favicon/web/icon-192.webp`, 15 KB, 44 px) + "Büyücünün Gecesi". Altında **Görevler** paneli: en çok 2 satır (bölüm hedefi + ilerleme "3/8", bu bölümde yenilen düşman; sayaç `S.kills - RT.killBase`). Saf model: `questRows`.
- **Üst orta:** cam şerit (Bölüm n/9 + ad · altın halkalı süre sayacı · yıldızlı puan); altında kalpler (yarım can destekli) ve hedef/mana çubuğu (`Mana: 0/8`); boss çubuğu şeridin altında aynı dilde.
- **Üst sağ:** etiketli yuvarlak düğmeler Durdur · Kamera · Ses · Harita (etiketler yalnız geniş ekranda).
- **Alt orta (masaüstü):** büyü slotları 1–7 ve yetenek slotları Q/E/R iki grup halinde; slotta tuş rozeti (oyunun gerçek tuşları), ikon, ad (en çok 2 satır; config'e `shortName` eklenmedi, sığmayan ad sarılır), seçili altın çerçeve + nabız parıltısı (opacity animasyonu), bekleme örtüsü, kilitli slot = kilit + silüet (yetenekler de artık kilitliyken görünür).
- **Dokunmatik (`body.touch`):** sol altta sabit hayalet joystick halkası (dokununca parmağın yerinde belirir, bırakınca eski yerine döner), sağ altta büyük ateş düğmesi (halkası aktif büyünün rengi, `--wc`), yetenekler ateş düğmesinin üstünde dikey sütun, büyü şeridi joystick ile ateş düğmesi arasında yatay kaydırılır. Tüm hedefler >= 44 px; `env(safe-area-inset-*)` korunur.

### Kırılma noktaları (`css/game.css`, "Oyun ekranı kırılma noktaları")
| Koşul | Davranış |
|---|---|
| varsayılan (masaüstü) | tam HUD, görevler paneli, etiketli düğmeler, adlı slotlar |
| `max-width: 1000px` | yan boşluklar (`--hud-l/--hud-r`) daralır |
| `max-width: 900px` veya `max-height: 560px` | görevler paneli ve marka yazısı gizlenir (amblem kalır), şerit sola genişler |
| `max-height: 500px` + yatay (telefon yatay) | sıkışık HUD: marka yazısı ve düğme etiketleri gizli, slot 44 px, joystick 112 / ateş 84 px, şerit amblem ile düğmeler arasına oturur |
| `max-width: 700px` + dikey (telefon dikey) | düğmeler üst satırda, şerit onların altında; slot şeridi joystick satırının üstünde, yetenekler sağda ateş düğmesinin üstünde |

### Duraklatma
- Tetikleyiciler: Durdur düğmesi, **Esc / P**, sekme gizlenince otomatik (yalnız savaşta). Durum makinesi `pauseReduce` (`play | pause | leave`), saf ve testli.
- Duraklatınca `RT.paused=true`: `loop.js` oyun saatini dondurur (`dt=0`, yalnız son kare çizilir; süre, bekleme, düşman, mermi, zamanlayıcı ilerlemez), girdi bırakılır (basılı tuş, joystick, ateş), oyun tuşları ve slot/yetenek tıklamaları yok sayılır. Kart: Devam Et / Ses / Haritaya Dön (iki aşamalı onay; Harita düğmesi doğrudan onay kartını açar).
- Ses motoruna dokunulmaz: müzik çalmaya devam eder (Ses ile kapatılabilir); sekme gizlenince motor zaten kendini askıya alır. Duraklamış oyunda Ses düğmesi çalışır, Kamera düğmesi gizlenir.
- Haritaya dönüş (`flow.quitToMap`): ölümdeki "Haritaya dön" ile aynı kural; bölüm başındaki durum geri yüklenir, o bölümün puanı/ilerlemesi kaydedilmez (kayıt bölüm girişinde zaten yazılmıştı).

### Mockup'ta olup bilerek YAPILMAYANLAR
- **Mini harita:** oyunda yok (tek ekranlık arena).
- **İksir slotları:** oyunda iksir yok.
- **Sv. / XP çubuğu:** oyunda seviye/XP yok.
- **Koşu düğmesi:** oyunda koşu yok. **Mana Kristali kısayolu:** oyunda karşılığı yok. **Nişan düğmesi:** otomatik nişan var.
- **Ayarlar ve Yetenekler düğmeleri:** oyun içi karşılığı yok (süs düğme konmadı); ses/kamera ayrı düğme.
- **Envanter, "gizli sandık" görevi:** oyunda yok, uydurulmadı.
- Büyü/yetenek tuş eşlemesi değişmedi (mockup'ın Q/W/E/R düzeni yerine gerçek 1–7 ve Q/E/R rozetleri).

### Erişilebilirlik ve performans
- `prefers-reduced-motion` mevcut genel kuralla animasyonları keser; slot parıltısı yalnız `opacity`, halka/kalpler `transform`. HUD panelleri `backdrop-filter` kullanmaz (WebGL üstünde pahalı).
- Düğmelerde `aria-label`, slotlarda `aria-pressed`/`aria-disabled`, duraklatma kartı `role="dialog" aria-modal`, kart açılınca odak "Devam Et"e gider; klavye odağı altın halka.
- HUD değerleri önbellekle yalnız değişince yazılır (görev satırları dahil). `innerHTML` kullanılmaz.

### Doğrulama notları
- Ölçülen boyutlar (headless Chrome, iframe ile gerçek görünüm alanı): 1280x720, 1024x600, 800x600, 844x390, 667x375, 390x844; bölüm `cave` ve `castle` (boss çubuğu). Hepsinde `documentElement.scrollWidth/Height` = görünüm alanı (sayfa kaydırması yok), HUD/dock/düğme öğeleri görünüm dışına taşmıyor; yalnız büyü şeridi (`#weapons`) bilerek yatay kaydırılır (çubuğu gizli).
- Daha önce görülen yatay kaydırma çubuğu, test sayfasının (iframe) kendi çubuğuydu; oyun belgesinde `html, body { overflow: hidden }` var. Dokunmatik görünüm test sayfasında `body.touch` sınıfı elle eklenerek doğrulandı (headless Chrome'da `pointer: coarse` taklidi yok).
- `?dev=1` şeridi (`#devbar`) yalnız geliştirmede üst şeridin kenarına 2-3 px biner; HUD'u kapatmaz.

## Menü, harita, bölüm kartı ve bölüm sonu yeniden tasarımı

Stil: `css/screens.css` (game.css belirteçlerini yeniden kullanır; HUD'a dokunulmaz). Saf modeller `js/ui/models.js` (`continueCardModel`, `careerStats`, `sheetModel`, `foeIdsOf`, `scoreRows`, `rewardStat`, `perkRarity`), testleri `tests/screens.models.test.js`. Tüm DOM `h()`/`svg()`/textContent ile kurulur; innerHTML yok.

**Yerleşim**
- Ana menü: tam ekran `menu-arkaplan` (tek `<img>`, `object-fit: cover`), solda amblem + başlık + slogan ve dikey düğme sütunu (birincil "Devam Et" kayıtlı bölüm adı ve puanıyla; Yeni Oyun [kayıt varsa iki dokunuşlu onay], Harita, Ses, Grafik), sağ altta "Devam edilen bölüm" kartı, sol altta sürüm + "Nasıl oynanır?" + Yönetim bağlantısı, sağ üstte gerçek sayaçlar.
- Harita: üst bar (Menü, başlık, sayaçlar), tam harita görseli üstünde altın çerçeveli madalyon düğümler (numara rozeti, ad hapı, tamamlandı yıldızı), noktalı yollar; yatayda sağ detay paneli, dikeyde alt sayfa (seçilen düğüm üst kısma kaydırılır). Kapat: × düğmesi ve Esc.
- Bölüm kartı / bölüm sonu / yenilgi / final: ortada süslü köşeli kart (`.screen-card`), uzun içerik sahne içinde kaydırılır, sayfa kaydırması yoktur.

**Kırılma noktaları**
- Geniş yatay (>520 px yükseklik): tek sütun kartlar, menü sol sütun + sağ alt kart, harita sağ panel (min-aspect 10/11).
- Kısa yatay (`orientation: landscape` ve yükseklik <= 520): kartlar iki sütun, menü düğmeleri 2'li ızgara, kapak/ödül ayrıntıları sıkıştırılır; <800 px genişlikte "devam edilen bölüm" kartı gizlenir; kenar boşlukları ses düğmesi için 60 px.
- Dikey (`orientation: portrait`): menü tek sütun, kart akışta; harita alt sayfa; bölüm kartları üstte ses düğmesi payı.
- Dar (<560 px): perk kartları tek sütun yatay satır, düğmeler tam genişlik.
- `prefers-reduced-motion`: amblem/ödül ışımaları durur, sayaç animasyonu kapanır. `backdrop-filter` bu ekranlarda kullanılmaz; yalnızca transform/opacity animasyonları.

**Gerçek veri kaynakları**: sayaçlar = kayıt (`completed.length`, `best.score`; kayıt yoksa gösterilmez); devam kartı = kayıttaki `currentLevel` bölümünün `name`, `image`, `time`, düşman türü sayısı (`start` + `spawn` + totem hedefi), hedef metni; harita çipleri = bölüm `time`, kayıttaki bölüm en iyi puanı, bölümün `reward` büyüsü (varsa); skor satırları = oyunun hesapladığı süre/bölüm bonusu ve toplam; nadirlik = perk `maxStacks`; metinler `data/game.config.json` ve `js/ui/text.js`.

**Mockup'ta olup bilerek YAPILMAYANLAR**: Yetenekler/Envanter sekmeleri ve "Çıkış" (oyunda yok); kristal/yıldız genel sayaçları (oyunda toplam kristal yok; yalnızca tamamlanan bölüm ve en iyi puan gösterilir); zorluk etiketi (veri yok); "Olası ödüller" listesi (yalnızca bölümün gerçek `reward` büyüsü, çip olarak); 3'lü yıldız derecelendirme (oyunda eşik yok; yalnızca "tamamlandı" yıldızı ve en iyi puan); mini harita ve iksir (oyunda yok); menü sloganı config'teki metinle kalır (mockup metni farklı). Sürüm yazısı `UI.version` (js/ui/text.js) kaynaklıdır.

**Ölçülemeyenler**: gerçek telefon dokunması ve GPU başarımı (görsel doğrulama masaüstü Chrome + SwiftShader, `body.touch` elle eklenerek); safe-area çentiği cihazda denenmedi.

## Mobil yerleşim optimizasyonu

Gerçek iPhone denemesinden (414x896) çıkan şikâyet: HUD ve kontroller görüş alanını yiyordu. Ölçüm: headless Chrome (SwiftShader), `getBoundingClientRect`; dokunmatik görünüm için `body.touch` elle eklendi (headless'ta `pointer: coarse` yok); güvenli alan (çentik) 0 kabul edildi. Üst oran = üst HUD'ın alt kenarı / yükseklik; alt oran = alt kontrollerin (büyü şeridi, yetenekler, ateş, joystick halkası) en üst kenarından ekran altına yükseklik. Bölüm `castle` (boss + faz uyarısı).

| Boyut | Üst önce | Üst sonra | Alt önce | Alt sonra | Hedef |
|---|---|---|---|---|---|
| 414x896 (iPhone) | 25,4 % | **8,8 %** | 32,1 % | **17,0 %** | üst <= 12, alt <= 22 |
| 390x844 | - | 9,4 % | - | 18,0 % | aynı |
| 375x667 | - | 11,8 % | - | 21,0 % | aynı |
| 896x414 (yatay) | 35,7 % | **10,1 %** | 62,8 % | **21,3 %** | üst <= 14, alt <= 25 |
| 844x390 (yatay) | - | 10,8 % | - | 22,6 % | aynı |
| 1280x720 (masaüstü) | 26,1 % (sol "Görevler" paneli dahil) | merkez HUD 15,3 % | 15,8 % | 10,0 % | dock slotu 48 px |

Not: masaüstünde 26 % sol üstteki "Görevler" panelinin alt kenarıdır; ortadaki HUD (şerit + kalpler + boss) 110 px (15 %). Gerçek cihazda `env(safe-area-inset-top)` kadar (iPhone ~47-59 px) ek boşluk eklenir; HUD içeriğinin yüksekliği aynıdır (dikey: 73 px).

**Karar ve değişiklikler**
- *Üst bölge (kompakt HUD: dikey <= 700 px genişlik, yatay <= 500 px yükseklik)*: marka amblemi ve "Görevler" paneli gizli; üstte tek sıra: bölüm adı + "Bölüm n/9", 32 px süre halkası, puan, sağda yalnız Durdur düğmesi (40 px). İkinci ince sıra (28 px): kalpler + hedef çubuğu. Yatayda her şey tek satır (36 px).
- *Boss çubuğu hedef çubuğunun yerini alır*: boss varken hedef çubuğu zaten boss canıdır (`goalFrac`), iki çubuk çift bilgiydi. Boss çubuğu ikinci sıraya girer (ince 7 px, ad + faz: "Kral · Faz 2"); ayrı satır kalktı. Masaüstünde de aynı (tek çubuk).
- *Faz uyarısı (toast)*: en çok 3 sn (`toastMs`: 1,2-3 sn, eski 3,8-5 sn), yarı saydam (%60), 13-14 px, `pointer-events: none`, ve üst HUD'ın ALTINDA (`--toast-top` kırılma noktasına göre); boss çubuğunu örtmez. Metin config'teki haliyle (2 satıra sığar).
- *Taşınan/gizlenen*: kamera, ses, harita düğmeleri kompakt HUD'da üst çubuktan kalktı. Ses ve harita zaten duraklatma kartındaydı; kamera düğmesi duraklatma kartına eklendi ("Kamera açısı: ..." döngüsel). Masaüstü kısayolları (V, Z/C, Esc/P, 1-7, Q/E/R) değişmedi; masaüstünde dört düğme aynen duruyor. Kompakt modda ses düğmesi menü/haritada hâlâ görünür.
- *Alt kontroller (dokunmatik, dikey)*: büyü şeridi tek ince satır olarak en altta (slot 44 px: dokunma alanı >= 44; kilitli büyüler gizli, yerine küçük noktalar `slotLayout`; yalnız açılmış yetenekler görünür; ad ve tuş rozeti yok). Üstünde solda hayalet joystick halkası (80-88 px, boştayken %35, dokununca parmakta tam), sağda 70-78 px ateş düğmesi (aktif büyü ikonu ve halka rengi sürer), yanında soldan Q/E/R düğmeleri (44 px, sütun yerine yan yana, panelsiz). Joystick halkası ve ateş düğmesi şeridin üstünde: çakışma yok. Yatayda tek alt sıra: joystick | şerit | yetenekler | ateş.
- *Masaüstü dock*: slot 48 px, ad yalnızca fare üzerine gelince / klavye odağında açılır etiket, tuş rozeti küçük.
- *Dokunuş geçirgenliği*: `#hud`, `#actions` (yalnız düğmeler yakalar), `#toast` `pointer-events: none`; joystick halkası zaten etkileşimsiz. Görevler paneli <= 900 px genişlikte gizli (doğrulandı).
- *Harita bölüm kartı*: varsayılan kompakt: 56 px kare küçük kapak + başlık/durum, tek satır çip (süre, puan, ödül; yatay kaydırma) + "Detay ▾", birincil düğme (48 px), altında tek satır alıştırma notu. Ölçü: 21-29 % (hedef <= 32). "Detay" hedef metni, düşman çipleri (tek satır yatay kaydırma) ve büyük kapağı açar: en çok %55. Seçili düğüm kartın üstündeki görünür alanın %42'sine kaydırılır (`scrollForNode`; kart yüksekliği `--sheet-h` ile alt boşluk olur). Yatay/masaüstü: sağ panel genişliği %25-30 (<= %32), detay hep açık, yatay telefonda büyük kapak gizli. Üst bar tek satır, 50 px.
- *Menü (dikey)*: alt bilgi şeridi ("... v1.1 · Nasıl oynanır? · Yönetim") kartın DIŞINDA, akışta ayrı satır (güvenli alanın üstünde); "devam edilen bölüm" 73 px'lik ince şerit (64 px kapak + ad + tek satır hedef; süs elmasları/köşeler ve istatistik satırı gizli); düğmeler 52 px (birincil 56); üst %30 marka alanı için ayrıldı (kısa ekranda amblem/başlık küçülür, içeriğine dokunulmadı). 414x896, 390x844, 375x667'de kaydırma yok (`scrollHeight == clientHeight`), çakışma yok.

**iOS tam ekran (alt koyu bant)**
- Kök neden kesin değil (cihazda denenemedi). Tuval `body`'nin normal akışında, `setSize(innerWidth, innerHeight)` ile satır içi px boyutundaydı; ilk görünüm alanı kısa kalırsa (iOS araç çubuğu / güvenli alan) alt kenar `--bg`'ye düşüyordu.
- Düzeltme: `html` arka planı tema koyusu (`#07040f`) ve `min-height` (`100%` -> `-webkit-fill-available`); `body` `min-height: 100dvh`; tuval `position: fixed; top: 0; width: 100%; height: 100lvh` (araç çubukları çekilmiş en büyük görünüm), çizim boyutu CSS kutusundan ölçülür (`resize`: `getBoundingClientRect`, `setSize(w, h, false)`), `orientationchange` ve `load` olaylarında da yeniden ölçülür. Joystick halkası artık `100dvh` yerine alt kenara (`bottom`) bağlı. Alt kontroller `env(safe-area-inset-bottom)` kadar yukarıda, arka plan en alta uzanır.
- Headless'ta `html`/`body` yüksekliği = görünüm yüksekliği (6 boyutta), yatay kaydırma yok. iOS Safari/ana ekran uygulamasında elle denenmeli.

**Ölçemediklerim / riskler**: gerçek iPhone dokunması, çentik/güvenli alan değerleri (0 kabul), iOS alt bant düzeltmesi. Kısa yatay telefonlarda (<= 600 px genişlik) 7 büyü + yetenekler sığmazsa şerit yatay kaydırılır. Yazılım WebGL yavaş olduğundan animasyonlu geçişler (kart girişi, toast soluşması) ekran görüntülerinde ara karede yakalanabilir.

## HEXORA marka geçişi ve karşılama

**İsim kuralı**: marka/oyun adı **HEXORA**; **Büyücünün Gecesi** alt başlıktır ("HEXORA: Büyücünün Gecesi"); "Karanlığın Kalbi" üst slogan, "Bir büyü. Bir gece. Tek kader." menü sloganıdır. Değişen: `index.html` (title, description, og/twitter, `apple-mobile-web-app-title`), `manifest.webmanifest` (`name`, `short_name`, `description`), `admin.html`, admin üst başlığı ve dışa aktarım başlığı, config `meta.name` ve `strings.title` (+ `tools/extract-defaults.mjs`), `UI.hud.brand` ("HEXORA"), `UI.menu.subtitle` (slogan), README. Hikâye/diyalog metinleri (Gece Kalbi, Aldemir vb.) DEĞİŞMEDİ. Pazarlama/SEO belgeleri (`docs/icerik`, `sosyal-medya`, `reklam`, `web-seo`, `analitik`, `pazarlama-stratejisi`) bilerek dokunulmadan kaldı; toplu yeniden yazım sonraki iştir. Marka adının tescil/alan adı/mağaza uygunluğu doğrulanmadı (README'de not).

**Kayıt anahtarları bilerek değişmedi**: `buyucu_save`, `buyucu_kalite`, `buyucu_ses`, `buyucu_kamera` ... eski kayıtlar çalışmaya devam eder. Karşılama bayrağı yeni ve oturumluk: `sessionStorage["hexora_splash_seen"]`.

**Kullanılan marka renkleri** (kılavuz): büyü moru `#6B3BFF`, altın ışık `#FFD87A` (+ koyu altın `#ff9f1c`), gece laciverti `#0B1029`, mistik mor `#2E1A59`, parıltılı mor `#A78BFF`, enerji camgöbeği `#4DDCFF`. Tema rengi/arka plan `#0a0714` korundu (manifest ve `<meta theme-color>` tutarlı).

**Asset düzeni (güncel)**: Emre'nin marka dosyaları `assets/favicon/` KÖKÜNDE düzdür (`assets/brand/` ve `kurulum/`, `logo-alternatifler/`, `sosyal/`, `web/` alt klasörleri kaldırıldı); tek doğru kaynak budur. Kullanım: `icon-96.png` (favicon, index+admin), `icon-192.png` (favicon + manifest), `icon-512.png` (manifest), `apple-touch-icon.png` (180, iOS ana ekran), `icon-256.webp` (küçük emblem: HUD 32 px, harita başlığı 28 px, duraklatma kartı 40 px), `icon-512.webp` (büyük emblem: karşılama 120-168 px, menü başlığı 46-120 px; ayrıca `<link rel=preload>`), `og-image-alternatif.png` (1200x630, 527 KB; og:image ve twitter:image). Kullanılmayan, repoya girmeyen: `icon-1024.png` (1,3 MB), `icon-144.png`, `icon-180.png` (apple-touch ile aynı), `icon-256.png` (`.gitignore`); `icon-192.webp` ve `logo-yatay-1200x360.png` repoda durur ama koddan kullanılmaz. Emblem artık yuvarlak köşeli kare uygulama ikonudur: CSS'te `border-radius: 22%` + ince altın çerçeve, halo ve dönen rün halkası ikonun çevresinde kalır. HEXORA yazı logosu `wordmarkSpec()` (saf veri ağacı) ile üretilir, `brand.js` `createElementNS` ile DOM'a çevirir; ışık süpürmesi SVG içindeki maske ile yapılır. Kod: `js/ui/brandmodel.js` (saf sabitler, `wordmarkSpec`, `splashModel`, `enterDelay`, `sparkCount`; testli), `js/ui/brand.js` (DOM), `css/screens.css` sonundaki "HEXORA markası" bölümü, `tests/brand.test.js`.

**Eksik marka dosyaları ve etkileri**: (1) `favicon.ico`, 16x16 ve 32x32 PNG yok: tarayıcı sekmesi 96 px PNG'yi küçültür (küçük boyda bulanık olabilir); `/favicon.ico` isteği yapan eski tarayıcı/botlar 404 alabilir (bilerek hack eklenmedi). (2) Maskable ikon yok: manifest ikonları yalnızca `purpose: any`; ikon kenara kadar dolu olduğu için Android bunu "any" olarak, çoğunlukla beyaz/kare zeminle gösterebilir. (3) Şeffaf amblem yok: emblem arka planlı kare ikon olarak kullanılır. (4) HEXORA yazı logosu dosyası yok: elle çizilmiş SVG koda taşındı (altın gradyan serif harfler, çift konturlu halka + mor elmas, ince çizgi ve yıldız); kılavuzdaki özgün tipografiye birebir değildir, yedek yazı tipi cihaza göre biraz farklı çizilebilir. (5) HEXORA metinli paylaşım görseli yok: `og-image-alternatif.png` ve `logo-yatay-1200x360.png` üzerindeki yazı hâlâ ESKİ ad "Büyücünün Gecesi"dir (HEXORA değil); dosyalar Emre'nin olduğu için değiştirilmedi, yeni görsel gelince yalnızca dosya adı/yolu aynı kalırsa kod değişmez.

**Favicon/PWA ikonları**: artık Emre'nin güncel illüstrasyonlu ikonu (hilal + mor büyücü şapkası, yuvarlak köşeli kare) kullanılır; ayrıntı yukarıdaki asset düzeni ve eksikler maddelerinde.

**Karşılama (splash) akışı**: sayfa açılışında menü arkada hazırlanır (`stage.inert`), üstüne `#splash` biner. Animasyon ≈2,5 sn: gece arka planı yumuşak belirir ve çok yavaş yakınlaşır (18 sn), amblem yükselir + süzülür (altın halo, yavaş dönen rün halkası, 3 parıldayan yıldız), HEXORA yazısı belirir ve bir kez ışık süpürür (O'daki elmas nabız atar), "KARANLIĞIN KALBİ" (harf aralıklı) ve "Büyücünün Gecesi", en sonda yanıp sönen "Başlamak için dokun/tıkla" (dokunmatikte "dokun"). Otomatik geçiş YOK. Dokunma/tık/tuş (Shift/Ctrl/Alt/Meta/Tab hariç): ses motoru kendi window-capture `pointerdown/click/keydown` dinleyicileriyle zaten bu hareketten başlar (çakışma yok: karşılama yalnızca arkasından `sfx("click")` çalar); sonra karşılama solar (0,6 sn), `inert` kalkar, menü öğeleri 50 ms aralıkla (`--enter`) sırayla belirir ve birincil düğme odak alır. Tuş basışı karşılamada yutulur (Enter menüdeki düğmeyi tetiklemez). Aynı oturumda tekrar: doğrudan menü. `?dev`, `?debug`, `?nosplash` karşılamayı atlar. **prefers-reduced-motion**: karşılama gösterilir ama statik (animasyonsuz, parıltı/kıvılcım yok; yine dokunma bekler), menüde süzülme/parıltı/kıvılcım/stagger kapalı.

**Menü başlık alanı**: amblem (süzülme + halo) + HEXORA yazı logosu (ışık süpürmesi her 7 sn, elmas nabzı) + "Büyücünün Gecesi" (serif, açık altın) + slogan + 16 kıvılcım (CSS; yatay telefonda ve Düşük grafikte 8; reduced-motion'da 0). Düğme/kart/alt bilgi yerleşimine dokunulmadı. Ölçü (headless, kayıtlı oyunla): dikeyde marka alanı ≈%30 (414×896: 30%, 390×844: 30%, 375×667: 30%), kaydırma yok (scrollHeight = clientHeight); 896×414 yatayda marka satırı 70 px, kaydırma yok; 1280×720'de kaydırma yok. Yatay kısa ekranda slogan gizlenir (karşılamada görünür).

**Diğer yerler**: HUD üst şeridindeki marka adı "HEXORA" ve amblem `icon-256.webp`; duraklatma kartında ve harita başlığında (geniş ekranda) küçük amblem; final kartının en altında "HEXORA: Büyücünün Gecesi" imzası.

**Ölçemediklerim**: gerçek cihaz (iPhone Safari/ana ekran, Android) dokunması ve ses başlatma; animasyon akıcılığı (yazılım WebGL yavaş, ekran görüntüleri ara karedir); farklı cihazlarda Georgia yedek yazı tipinin yazı logosundaki görünümü; sosyal ağların og görselini önbellekten yenilemesi.

## Harita: geniş ekran yerleşimi

- Karar modeli `mapLayout(w, h)` (js/ui/models.js, testli): `portrait` (yükseklik > 1,1 x genişlik: alt sayfa, ≤%32 / "Detay" ile %55), `landscape-phone` (yükseklik ≤ 520: kayan dar panel, kapatılabilir), `tablet` (iki sütun, panel 320-360 px), `wide` (genişlik ≥ 1100: iki sütun, panel `clamp(340, %24, 440)` px).
- İki sütunda (tablet/geniş) panel sağda tam yükseklikte ve sürekli açıktır; kapatma düğmesi ve Esc yoktur, seçim yoksa sıradaki açık bölüm seçilir. İçerik panel içinde kaydırılır, ana düğme altta sabittir. İçerik: 16:9 kapak, büyük başlık, süre/en iyi puan, hedef kutusu, ödül büyüsü (ad + tuş), düşman çipleri, giriş metninin ilk cümlesi.
- Harita görünümü `mapView`: svg `viewBox` sütunu dolduracak şekilde yakınlaştırılır ama düğüm ve etiketler hiçbir zaman kırpılmaz (en az "meet", en çok "slice"); düğümler görselle birlikte kaydığı için hizalı kalır. Kalan boşluk blur zemin katmanıdır.
- Yatay telefonda etiketler çakıştığı için yalnızca seçili / hover / odaklı düğümün etiketi görünür (CSS `.lp`).
- Etiket yönleri (levels.*.map.label): forest above, cave below, golems right, graveyard right, pass below, village right, crystals below, tower right, castle left.


## Aşama 1 notu: yenilgi ekranı ve yardım (DDA) bilgisi
- Yenilgi ekranı: "Tekrar dene" birincil ve odaklı; tıklayınca bölüm giriş kartı ATLANIR, savaş doğrudan başlar (kart yalnızca ilk girişte). "Haritaya dön" ikincil. Kartta, varsa, bir sonraki denemenin yardım bilgisi (`.dda-note`, çerçeveli tek satır) ve bölümün ipucu satırı (`.tip-line`, soluk) görünür; mobilde 12 px.
- Yardım bilgisi aynı satırla bölüm giriş kartında ve bölüm başında 3 sn toast olarak gösterilir. "Yardım: Açık/Kapalı" düğmesi menüde ve duraklatma kartında (varsayılan açık).
- Yeni öğe ipuçları: yalnızca bölüme ilk girişte, 0,8 sn sonra, 3 sn toast; en çok 2 satır. HUD yerleşimine dokunulmadı.
- Görsel doğrulama (414x896) yapılmadı; elle kontrol edilmeli.

## Düşman becerisi uyarıları ve ipucu toast'ı (Aşama B)
- Her beceri uyarısı iki kanaldan okunur: düşman `windup` modunda (yeni animasyon yok) ve yerde halka. Renkler: kırmızı `#ff5544` = hasar verecek alan (Taş Bekçi sarsıntısı, ok işaretleri, Şövalye atılışı), mor `#b98bff` = Yarasa dalış hedefi (hasarsız işaret), açık mavi = uluma, yeşil = diriltme, turuncu = ateş lekesi, mor halka = Lanet Alanı. Eşzamanlı en çok 3 işaret; mobilde ek kalıcı Mesh <= 5.
- Bölüm başında yeni açılan beceri için TEK satırlık ipucu toast'ı (3 sn, sessiz; metin `strings.skills.<id>`), oturumda her beceri için yalnızca bir kez; alıştırma kipinde ve DDA bildirimi çıkan girişte gösterilmez. Mevcut `hint` satırlarından SONRA kuyruğa girer.
- Perdeli Ruh saydam (yaklaşık %30 opaklık) ve mermiler içinden geçer; Arcane ve Ay Işığı perdeyi deler.

## Aşama C notu (savaş alanı gösterişi)
Çevre tehlikeleri (zehir, düşen darbe, ateş, buz), doğma uyarı halkası, ölüm halkası, hit-stop ve bölüm başı kamera süpürmesi eklendi. Hepsi Düşük kalitede azalır/kapanır; `prefers-reduced-motion` hit-stop, sarsıntı ve süpürmeyi kapatır (`js/core/fxlevel.js`). Karşılama ekranında masaüstü amblem/arka plan eksikliği yeniden üretilemedi (ayrıntı strateji belgesi, Aşama C notları).
