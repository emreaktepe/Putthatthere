# Eksik görsel listesi ve durum

Bu belge `npm run art` çıktısıyla (`tools/check-art.mjs`) birlikte okunur: betik, `data/game.config.json` içindeki kimliklerden beklenen dosya listesini üretir ve `assets/art/` ile karşılaştırır. Belgedeki sayılar 24 Ekim 2026 tarihli çıktıdandır; yeni görsel ekleyince betiği yeniden çalıştır.

Hazır istemler: `docs/icerik/gorsel-istem-paketi.md` (§7 ve sonrası). Dosya adları küçük harf, rakam ve tire içerir; yalnızca `.webp` yayınlanır (yol deseni `^assets/art/[a-z0-9-]+\.webp$`).

## 1. Mevcut durum

| Ölçüt | Sayı |
|---|---|
| Beklenen dosya (adlandırma şemasına göre) | 80 |
| Hazır (dosya var) | 20 |
| Config'e bağlı ve oyunda kullanılan | 20 |
| Eksik | 60 (P1: 30, P2: 30) |
| Bütçe uyarısı (> 200 KB) | 5 (3 büyük portre, menü ve harita arka planı) |
| Config başvurusu olup dosyası olmayan | 0 |

### Emre'nin yüklediği dosyalar ve kullanıldıkları yerler

| Dosya | Boyut / şeffaflık | Config alanı | Ekranda nerede |
|---|---|---|---|
| `portre-aldemir/piril/veyis/zerrin/taskin.webp` | 512 veya 1024 kare, şeffaf | `characters.<id>.portrait` | diyalog balonları, boss çubuğu (Veyis) |
| `menu-arkaplan.webp` | 1536x1024, opak | `game.menuBackground` | ana menü |
| `harita-arkaplan.webp` | 1536x1024, opak | `map.background.image` | harita ekranı |
| `ikon-buyu-fire/frost/arcane/lightning/poison/meteor/nova.webp` | 512 kare, şeffaf | `weapons.<id>.image` | büyü çubuğu, ödül kartı, harita bölüm kartı (ödül rozeti), yönetim önizlemesi |
| `ikon-yetenek-shield/blink/timeslow.webp` | 512 kare, şeffaf | `abilities.<id>.image` | ödül kartı, yönetim önizlemesi |
| `ikon-yetenek-<id>-128.webp` | 128 kare, şeffaf | `abilities.<id>.imageSmall` | yetenek düğmeleri (Q/E/R) |

Not: büyü ikonları 512 pikseldir (istenen 1024 değil); slotta CSS ile 44-46 px'e küçülür. 128 sürümleri P2'de.

Bütçe: 3 portre (237, 262, 281 KB), menü (218 KB) ve harita (317 KB) 200 KB sınırını aşıyor. Aşağıdaki "Sıkıştırma önerisi"ne bak.

### Kod tarafı hazır, görseli bekleyen alanlar

Aşağıdaki alanlar şemada, doğrulayıcıda, UI'da ve yönetim önizlemesinde hazırdır. Config'te boştur; dosya `assets/art/` altına konup yol yazılınca otomatik görünür. Görsel yoksa ya da yüklenemezse eski emoji/SVG görünür.

| Config alanı | Kullanım yeri |
|---|---|
| `perks.<id>.image` | bölüm sonu perk kartları |
| `enemies.<id>.image` | bölüm kartı ve giriş ekranındaki düşman rozetleri, boss çubuğu (karakter portresine tercih edilir) |
| `levels.<id>.image` | harita bölüm kartı ve bölüm girişi ekranı kapak görseli |
| `levels.<id>.nodeImage` | harita düğümü madalyonu (daire içinde) |
| `ui.icons.<ad>` | SVG ikonların yerine görsel (aşağıdaki anahtar tablosu) |
| `weapons.<id>.imageSmall` | büyü çubuğu slotu (128 px sürüm) |

`ui.icons` anahtarları: `hourglass` (süre), `crystal`, `star` (puan), `target` (hedef), `lock`, `check`, `shield`, `sound`, `mute`, `camera`, `fire` (ateş düğmesi), `admin` (menüdeki Yönetim bağlantısı), `heartFull` + `heartEmpty` (ikisi birlikte verilirse kalpler görsel olur; yarım can için dolu görsel yarı genişlikte kırpılır).

## 2. Öncelikli eksik listesi

Sütunlar: dosya, boyut/oran, şeffaf mı, ekranda nerede, şimdiki yedek, öncelik, durum.

### P1 — Perk ikonları (11)

Boyut: 512x512 kare, şeffaf. Yer: bölüm sonu perk kartı (kartta 64 px). Config: `perks.<id>.image`.

| Dosya | Perk | Şimdiki yedek | Ö | Durum |
|---|---|---|---|---|
| `ikon-perk-hp.webp` | Yaşam Özü | ❤️ | P1 | [ ] |
| `ikon-perk-speed.webp` | Rüzgâr Ayakkabıları | 👟 | P1 | [ ] |
| `ikon-perk-power.webp` | Güç Tılsımı | ⚔️ | P1 | [ ] |
| `ikon-perk-haste.webp` | Hızlı Parmaklar | ⏱️ | P1 | [ ] |
| `ikon-perk-magnet.webp` | Mana Mıknatısı | 🧲 | P1 | [ ] |
| `ikon-perk-vampire.webp` | Vampir Dokunuş | 🦇 | P1 | [ ] |
| `ikon-perk-pierce.webp` | Delici Büyü | 🏹 | P1 | [ ] |
| `ikon-perk-echo.webp` | Yankı | 🔁 | P1 | [ ] |
| `ikon-perk-piril.webp` | Pırıl'ın Işığı | ✨ | P1 | [ ] |
| `ikon-perk-stone.webp` | Taş Deri | 🪨 | P1 | [ ] |
| `ikon-perk-rain.webp` | Mana Yağmuru | 🌧️ | P1 | [ ] |

### P1 — Düşman ikonları (10)

Boyut: 512x512 kare, şeffaf. Yer: harita bölüm kartı ve bölüm girişi rozetleri (22 px yuvarlak), boss çubuğu (38 px), yönetim önizlemesi. Küçük boyutta okunması için yüz/siluet ağırlıklı çizdir. Config: `enemies.<id>.image`.

| Dosya | Düşman | Şimdiki yedek | Ö | Durum |
|---|---|---|---|---|
| `dusman-ghost.webp` | Ruh | 👻 | P1 | [ ] |
| `dusman-bat.webp` | Yarasa | 🦇 | P1 | [ ] |
| `dusman-golem.webp` | Taş Bekçi | 🗿 | P1 | [ ] |
| `dusman-archer.webp` | Kemik Okçu | 🏹 | P1 | [ ] |
| `dusman-wolf.webp` | Kurt Ruhu | 🐺 | P1 | [ ] |
| `dusman-ember.webp` | Kor Hortlak | 🔥 | P1 | [ ] |
| `dusman-priest.webp` | Karanlık Rahip | 🧙 | P1 | [ ] |
| `dusman-totem.webp` | Lanet Totemi | 🗼 | P1 | [ ] |
| `dusman-knight.webp` | Kemik Şövalye | ⚔️ | P1 | [ ] |
| `dusman-boss.webp` | Gölge Kral | 👑 (boss çubuğunda şimdi Veyis portresi) | P1 | [ ] |

### P1 — Bölüm kapak görselleri (9)

Boyut: yatay 3:2 (1536x1024), opak. Yer: harita bölüm kartı (üstte şerit) ve bölüm girişi ekranı (üstte kapak). Görsel yoksa kart şimdiki haliyle kalır. Config: `levels.<id>.image`.

| Dosya | Bölüm | Şimdiki yedek | Ö | Durum |
|---|---|---|---|---|
| `bolum-forest.webp` | Fısıldayan Orman | yok (kartta kapak yok) | P1 | [ ] |
| `bolum-cave.webp` | Yarasa Mağarası | yok | P1 | [ ] |
| `bolum-golems.webp` | Taş Bekçiler | yok | P1 | [ ] |
| `bolum-graveyard.webp` | Hortlak Mezarlığı | yok | P1 | [ ] |
| `bolum-pass.webp` | Donmuş Geçit | yok | P1 | [ ] |
| `bolum-village.webp` | Yanık Köy | yok | P1 | [ ] |
| `bolum-crystals.webp` | Kristal Yatağı | yok | P1 | [ ] |
| `bolum-tower.webp` | Kemik Kule | yok | P1 | [ ] |
| `bolum-castle.webp` | Gölge Kalesi | yok | P1 | [ ] |

### P2 — Harita düğüm madalyonları (9)

Boyut: kare 256-512, daire içine kırpılır (kenarlara önemli şey koyma), opak ya da şeffaf. Yer: harita düğümü. Şimdiki yedek: bölümün `map.icon` emojisi (🌲 🦇 🗿 🪦 ❄️ 🔥 💎 🏰 👑). Config: `levels.<id>.nodeImage`.

| Dosya | Bölüm | Ö | Durum |
|---|---|---|---|
| `dugum-forest.webp` | Fısıldayan Orman | P2 | [ ] |
| `dugum-cave.webp` | Yarasa Mağarası | P2 | [ ] |
| `dugum-golems.webp` | Taş Bekçiler | P2 | [ ] |
| `dugum-graveyard.webp` | Hortlak Mezarlığı | P2 | [ ] |
| `dugum-pass.webp` | Donmuş Geçit | P2 | [ ] |
| `dugum-village.webp` | Yanık Köy | P2 | [ ] |
| `dugum-crystals.webp` | Kristal Yatağı | P2 | [ ] |
| `dugum-tower.webp` | Kemik Kule | P2 | [ ] |
| `dugum-castle.webp` | Gölge Kalesi | P2 | [ ] |

### P2 — Arayüz ikonları (14)

Boyut: kare, 256x256 üret (ekranda 20-26 px, düğmelerde 56 px), şeffaf. Hepsi aynı çizgi kalınlığı ve parıltıyla, tek set olarak üretilmeli. Config: `ui.icons.<anahtar>`.

| Dosya | Anahtar | Ekranda nerede | Şimdiki yedek | Ö | Durum |
|---|---|---|---|---|---|
| `ui-sure.webp` | hourglass | hedef ikonu (hayatta kal), bölüm kartı süre rozeti | SVG kum saati | P2 | [ ] |
| `ui-kristal.webp` | crystal | hedef ikonu (kristal) | SVG kristal | P2 | [ ] |
| `ui-puan.webp` | star | üst çubuk puan, harita rozetleri, toplam puan | SVG yıldız | P2 | [ ] |
| `ui-hedef.webp` | target | hedef satırı (bölüm girişi, kart) | SVG hedef | P2 | [ ] |
| `ui-kilit.webp` | lock | kilitli büyü slotu, kilitli bölüm notu | SVG kilit | P2 | [ ] |
| `ui-onay.webp` | check | harita tamamlanan sayacı | SVG onay | P2 | [ ] |
| `ui-kalp-dolu.webp` | heartFull | can çubuğu (dolu) | SVG kalp | P2 | [ ] |
| `ui-kalp-bos.webp` | heartEmpty | can çubuğu (boş) | SVG kalp (soluk) | P2 | [ ] |
| `ui-kalkan.webp` | shield | boss kalkan göstergesi | SVG kalkan | P2 | [ ] |
| `ui-ses-acik.webp` | sound | ses düğmesi (açık), menü ses düğmesi | 🔊 / SVG | P2 | [ ] |
| `ui-ses-kapali.webp` | mute | ses düğmesi (kapalı) | 🔇 | P2 | [ ] |
| `ui-kamera.webp` | camera | kamera düğmesi | 📷 | P2 | [ ] |
| `ui-ates.webp` | fire | mobil ateş düğmesi | ✦ | P2 | [ ] |
| `ui-yonetim.webp` | admin | menüdeki Yönetim bağlantısı (şimdi ikonsuz) | yok | P2 | [ ] |

Not: `heartFull` ve `heartEmpty` ikisi birlikte yazılmalı; biri eksikse SVG kalpler kullanılır ve doğrulayıcı uyarı verir. İki kalp aynı boyut ve aynı çerçevede olmalı (yarım can, dolu görselin sol yarısıdır).

### P2 — Büyü ikonlarının 128 px sürümleri (7)

Boyut: 128x128, şeffaf, hedef 3-8 KB. Yer: büyü çubuğu slotu (şimdi 512 px görsel küçültülerek gösteriliyor; mobilde bellek ve çözme maliyeti gereksiz yüksek). Config: `weapons.<id>.imageSmall`. Şimdiki yedek: 512 px sürüm.

| Dosya | Durum |
|---|---|
| `ikon-buyu-fire-128.webp` | [ ] |
| `ikon-buyu-frost-128.webp` | [ ] |
| `ikon-buyu-arcane-128.webp` | [ ] |
| `ikon-buyu-lightning-128.webp` | [ ] |
| `ikon-buyu-poison-128.webp` | [ ] |
| `ikon-buyu-meteor-128.webp` | [ ] |
| `ikon-buyu-nova-128.webp` | [ ] |

### P2 — Portre varyantları (isteğe bağlı)

Üzgün, öfkeli, şaşkın gibi ifadeler (Aldemir ve Veyis için en değerli). Şu an şemada ifade alanı yok: kullanılmadan önce `characters.<id>.portraits.<ifade>` gibi bir alan ve diyalog satırına ifade seçimi eklenmeli (ayrı iş paketi). Dosya adı önerisi: `portre-aldemir-uzgun.webp`, `portre-veyis-ofkeli.webp`; 1024 kare değil 512 kare yeter. Durum: [ ] (kod tarafı da yok)

### P3 — Sonra

| Öğe | Boyut / oran | Şeffaf | Not | Durum |
|---|---|---|---|---|
| Boss ek görselleri (Gölge Kral faz 2 ve 3 portreleri, kalkan efekti) | kare 512 | evet | boss faz değişiminde kullanılabilir; şemada alan yok | [ ] |
| Zemin dokuları (9 tema) | 1024x1024 dikişsiz | hayır | 3B zeminde kullanım; bkz. 3B planı | [ ] |
| Giriş (intro) tam ekran illüstrasyonları | 3:2 yatay | hayır | açılış anlatısı için; şemada alan yok | [ ] |
| Final (ending) tam ekran illüstrasyonu | 3:2 yatay | hayır | final ekranı; şemada alan yok | [ ] |
| Uygulama ikonunun yeniden çizimi (`icon-512`, `og-image`) | 512 kare, 1200x630 | hayır | Aldemir portresiyle uyumlu; `tools/make-icons.mjs` ve `make-og-from-art.mjs` yeniden çalıştırılır | [ ] |

## 3. Sıkıştırma önerisi (bütçe uyarıları)

Üretimde ya da WebP'ye çevirirken kalite 80-85 ve hedef boyutlar: kare ikonlar 512 px (<= 120 KB), 128 px sürümler (<= 8 KB), arka planlar 1536x1024 (<= 200 KB), portreler 512 px yeter (kartta 58 px, boss çubuğunda 38 px). Mevcut 1024 px portreleri 512 px'e indirmek yaklaşık 3 portrenin 700 KB'ını 250 KB civarına düşürür (tahmin, ölçülmedi). Bunu `cwebp` ile yapmak Emre'nin işi; bu çalışmada mevcut dosyalara dokunulmadı.

## 4. Nasıl bağlanır

1. Dosyayı `assets/art/` altına doğru adla koy (yalnızca `.webp`).
2. `npm run art` ile boyutu ve bütçeyi kontrol et.
3. Yönetim sayfasından ya da doğrudan `data/game.config.json` içinde ilgili alana yolu yaz (örn. `perks.hp.image = "assets/art/ikon-perk-hp.webp"`). Dosyası olmayan yol yazma: `npm test` "config'teki yollar var" testinde kırılır.
4. `npm test` ve `npm run validate` çalıştır.
