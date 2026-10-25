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
