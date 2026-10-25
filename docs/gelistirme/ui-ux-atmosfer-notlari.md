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
