# Görsel boyut tablosu

Durum: ÖNERİ. Boyutlar `css/game.css` ve `js/ui/*.js` içindeki gerçek yerleşimlerden hesaplandı (CSS piksel). "Gerekli" sütunu 2× ekranlarda (retina telefon, dizüstü) netlik için asgari boyuttur (CSS boyutu × 2). "Önerilen" sütunu yeniden üretirken hedeflenecek boyuttur. Telefondaki gerçek görünüm ölçülmedi.

Genel kurallar:
- Biçim: **WebP**, kalite ~80–85. Orijinal PNG yerelde kalır (repoya girmez).
- Dosya başına bütçe: ikonlar ≤ 30 KB, madalyon/kapak ≤ 120 KB, tam ekran arka planlar ≤ 300 KB.
- Şeffaf arka plan: portre, ikon, düşman, perk, düğüm, UI ikonları. Opak: kapaklar ve arka planlar.
- Konu ortada olsun, kenarlardan ~%8 boşluk bırak (daire/yuvarlak kırpma ve gölge için).

## Tablo

| Grup | Dosya adı | Ekranda (CSS px) | Gerekli | **Önerilen** | Şimdiki | Durum |
|---|---|---|---|---|---|---|
| Menü arka planı | `menu-arkaplan.webp` | tam ekran (cover) | 1920×1280 | **1920×1280, 3:2, ≤300 KB** | 960×640 | büyük ekranda 2× büyütülür, yumuşak |
| Harita arka planı | `harita-arkaplan.webp` | tam ekran (cover) | 1920×1280 | **1920×1280, 3:2, ≤300 KB** | 960×640 | aynı |
| Bölüm kapağı | `bolum-<id>.webp` (9) | kart ~360–420 genişlik; giriş ekranı 3:2, harita kartı 3:1 kırpma | ~800×533 | **768×512, 3:2, opak** | 192×128 | **bulanık, öncelikli** |
| Düğüm madalyonu | `dugum-<id>.webp` (9) | daire ~76–120 çap | 240×240 | **256×256, şeffaf, konu ortada** | 128×128 | büyük ekranda yumuşak |
| Portre | `portre-<karakter>.webp` (5) | diyalog avatarı 58, boss madalyonu 38 | 128×128 | **256×256 (512 de olur), şeffaf** | Aldemir/Pırıl/Veyis 512, Zerrin/Taşkın 128 | şimdilik yeterli |
| Büyü ikonu (ödül kartı) | `ikon-buyu-<id>.webp` (7) | ödül kartı 100 (mobil 76) | 200×200 | **256×256, şeffaf** | 128×128 | ödül kartında hafif yumuşak |
| Büyü ikonu (slot) | `ikon-buyu-<id>-128.webp` (7) | slot ikonu 46 (mobil 44) | 92×92 | **128×128, şeffaf** | 128×128 | tamam |
| Yetenek ikonu (ödül) | `ikon-yetenek-<id>.webp` (3) | ödül kartı 100 | 200×200 | **256×256, şeffaf** | 128×128 | ödül kartında hafif yumuşak |
| Yetenek ikonu (slot) | `ikon-yetenek-<id>-128.webp` (3) | slot ikonu 44 (mobil 40) | 88×88 | **128×128, şeffaf** | 128×128 | tamam |
| Perk ikonu | `ikon-perk-<id>.webp` (11) | kart ikonu 64 (mobil 48) | 128×128 | **128×128 (192 de olur), şeffaf** | 128×128 | tamam |
| Düşman ikonu | `dusman-<id>.webp` (10) | rozet 22, boss madalyonu 38 | 76×76 | **128×128, şeffaf** | 128×128 | tamam |
| UI ikonu | `ui-<ad>.webp` (14) | 20–56 (kalp 22–26, ateş düğmesi 56) | 112×112 | **128×128, şeffaf** | 128×128 | tamam |
| Paylaşım görseli | `og-image.png` | sosyal ağlar | 1200×630 | **1200×630** | 1200×630 | tamam |
| Uygulama ikonu | `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` | ana ekran | 512 / 192 / 180 | **aynı, tam kare, kenar boşluğu %10** | 512 / 192 / 180 (kodla üretilmiş) | istersen yeni tarzla yeniden |

Notlar:
- **Yeniden üretmen gerekenler (öncelik sırasıyla):** 1) bölüm kapakları 768×512; 2) menü ve harita arka planları 1920×1280; 3) düğüm madalyonları 256×256; 4) büyü ve yetenek ödül görselleri 256×256 (`ikon-buyu-<id>.webp`, `ikon-yetenek-<id>.webp` 256, slot sürümleri `-128` 128 kalır).
- **`-128` dosyalar:** Büyü ve yetenek slotları `imageSmall` (`-128`) kullanır, ödül kartı `image` kullanır. Şu an büyülerde `image` ve `-128` aynı boyutta (128). Asıl dosyayı 256 yaparsan, config'e büyüler için `imageSmall` olarak `-128` dosyalarını bağlamamı söylemen yeterli.
- **Bölüm kapağı kırpması:** Harita bölüm kartında kapak 3:1 şerit olarak kırpılır (üst ve alttan ~%33 kesilir). Önemli öğeyi (kale, ay, kristal) dikey ortaya koy.
- **Menü arka planı kırpması:** `cover` ile kırpıldığı için dikey telefonda yatay kenarlar kesilir. Önemli öğeleri ortadaki %50'ye koy. Başlık sol karanlık alana oturduğu için bu alanı sade tut.
- **Önceki mesajdaki düzeltme:** Zerrin ve Taşkın portrelerinin 128×128 olması mevcut yerleşimler için yeterli (avatar 58 px). Yalnızca ileride büyük gösterilirse (ör. tam ekran diyalog) 256 gerekir.
- **Bellek:** 1920×1280 bir arka plan çözülünce ~10 MB bellek tutar. Menü ve harita ekranı aynı anda açık olmadığı için kabul edilebilir; telefonda doğrulanmadı.
- Telefonda ağ yükü: tüm görsel paket şu an ~1,3 MB. Önerilen boyutlarla ~2–2,5 MB'a çıkar (varsayım).

## Kontrol

Dosyaları `assets/art/` altına koyduktan sonra `npm run art` çalıştır: boyutları, şeffaflığı ve bütçe aşımını gösterir. Beklenenden küçük bir görsel varsa bana söyle, tabloya göre kıyaslayıp bildiririm.
