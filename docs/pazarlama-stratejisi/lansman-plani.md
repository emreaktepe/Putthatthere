# Büyücünün Gecesi — Lansman Planı (30 gün)

Durum: ÖNERİ. Hiçbir şey yayınlanmadı, hiçbir harcama yapılmadı. Her yayın ve harcama Emre'nin onayına tabidir.
Etiketler: (V) repo/belgelerden doğrulanmış, (Varsayım) doğrulanmamış. Hedef sayılar tahmindir, benchmark değildir.
Dayanak: `README.md`, `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md`, `data/game.config.json`, `docs/gelistirme/ui-ux-atmosfer-notlari.md`.

## 1. Konumlandırma

**Cümle:** Büyücünün Gecesi, kısa bir mola için kurulumsuz ve ücretsiz, hikâyeli bir aksiyon oyunu arayan Türkçe konuşan oyuncular için, tarayıcıda (bilgisayar ve telefon) oynanan 9 bölümlük bir büyücü macerasıdır: Büyücü Aldemir ile Gece Kalbi'ni kurtar.

**Gerçekler (V):** 9 bölüm; 7 büyü (Ateş Topu, Buz Oku, Üçlü Büyü, Yıldırım, Zehir Bulutu, Meteor, Ay Işığı Halkası); 3 yetenek (Mana Kalkanı, Işınlan, Zaman Çatlağı); 11 yetenek kartı havuzu; final patronu Gölge Kral; klavye/fare ve dokunmatik kontrol; harita, 3 kamera açısı; müzik ve sesler Web Audio ile kodla üretilir; ana ekrana eklenebilir (PWA manifest); ilerleme yalnızca o tarayıcıda (`localStorage`) saklanır. Adres: https://emreaktepe.github.io/Putthatthere/ (URL'deki ad yalnızca depo adıdır).

**Üründe olmayanlar (anlatılmaz):** hesap, bulut kaydı, skor tablosu, çok oyunculu mod, mağaza uygulaması, ödeme, çevrimdışı mod iddiası (service worker yok).

**Fark (Varsayım, kapsamlı tarama yapılmadı):** Kurulumsuz tarayıcı oyunları arasında hikâyesi, 9 bölümlük ilerlemesi, bölüm hedef çeşitliliği (kristal topla, hayatta kal, totem yık, patron) ve mobil kontrolüyle öne çıkar.

## 2. Hedef kitle (hepsi Varsayım)

1. **Kısa süreli oyun arayanlar, 15-40, Türkçe (birincil):** Telefondan veya bilgisayardan indirmeden dene-oyna. Hikâye ve ilerleme ilgisini tutar.
2. **Fantastik/büyü teması sevenler (ikincil):** Reddit/Ekşi/Discord'da tarayıcı oyunu, indie oyun, fantastik paylaşımlarını takip eder.
3. **Meraklı geliştiriciler (üçüncül):** "Build'siz, tek bağımlılıklı Three.js oyunu" yapım hikâyesi ilgi çekebilir. Ay 1'de yalnızca ücretsiz paylaşım denemesi.

## 3. Kanal karması (organik ağırlıklı)

| Kanal | Rol | Beklenti (Varsayım) |
|---|---|---|
| Topluluk paylaşımı (Reddit TR/EN, Ekşi, Discord, itch.io tarzı topluluklar) | Ana kanal: "yaptım, dener misiniz" | Dalgalı; kurallara uyulur, spam yapılmaz |
| Kısa video (Reels/TikTok/Shorts) | 15-20 sn oynanış: Ateş Topu, Yıldırım zinciri, Gölge Kral | En yüksek potansiyel, en yüksek belirsizlik; 4-6 video ile öğrenme |
| Organik arama | Ana sayfa meta etiketleri (Web/SEO) | Ay 1'de ihmal edilebilir; uzun vadeli |
| Kişisel mesaj | Birkaç oyun/Three.js topluluğu ve içerik üreticisi | 5-10 mesaj, 0-2 cevap beklenir |
| Ücretli reklam | Yalnızca küçük test, ölçüm kurulduktan sonra Hafta 3-4 | Maliyet öğrenmek için; ölçekleme yok |

## 4. Bütçe önerisi (yalnızca öneri; harcama kararı Emre'nindir)

Toplam tavan: **en fazla ~5.000 ₺** (Varsayım; Emre değiştirebilir). Hiçbir kalem onaysız harcanmaz.

| Kalem | Tutar | Not |
|---|---|---|
| Ücretli test (tek küçük kampanya, Hafta 3-4) | ~3.000 ₺ | Ölçüm hazır değilse harcanmaz. Ayrıntı: `docs/reklam/kampanya-plani.md` (onay bekliyor) |
| Video düzenleme aracı / telifsiz ses | ~1.000 ₺ | Gerek yoksa harcanmaz (oyunun müziği zaten kodla üretiliyor) |
| Yedek | ~1.000 ₺ | Kullanılmazsa kullanılmaz |

Durdurma kuralı: 1.000 ₺ harcanıp oyuna başlama oranı hedefin yarısının altındaysa duraklat, Emre'ye sor.

## 5. Haftalık takvim

| Hafta | İşler | Onay gerekir mi |
|---|---|---|
| 0 (hazırlık) | Ölçüm kararı (şu an ölçüm yok), gerçek telefonda dokunmatik kontrol ve ana ekrana ekleme testi, Emre'nin 9 bölümü baştan sona oynaması, paylaşım önizlemesi kontrolü (`og-image.png` canlıda) | Analitik/kişisel veri: evet |
| 1 | Yumuşak lansman: 5-10 tanıdığa gönderim, geri bildirim, hata düzeltme. 1 Türkçe topluluk paylaşımı | Her yayın: evet |
| 2 | 3-4 kısa video, Reddit/itch tarzı topluluk denemesi, 5-10 kişisel mesaj | Her yayın: evet |
| 3 | Ölçüme göre en iyi videoyu tekrar paylaş; küçük ücretli test | Kampanya ve harcama: evet |
| 4 | Sonuç değerlendirmesi; karar: devam / içerik / dur | Fiyat/e-posta toplama: evet |

## 6. İlk hafta metrikleri (hedefler Varsayım)

Üründe kayıt ve ödeme yok (V); huni şöyle uyarlanır:

| Basamak | Metrik | Hafta 1 hedefi |
|---|---|---|
| Ziyaret | Tekil ziyaretçi | 100-300 (çoğu tanıdık/topluluk) |
| Başlama | Başlat düğmesine basan / ziyaretçi | %50+ |
| Aktivasyon | 1. bölümü bitiren / başlayan | %60+ |
| Derinlik | 3. bölüme ulaşan / başlayan | %30+ |
| Geri dönüş (Hafta 2'de ölçülür) | 7 gün içinde ikinci oturum | %15+ |
| Kayıt/ödeme | Yok | Uygulanamaz |

Bugün ölçüm yok (V: `js/` altında takip kodu yok); ölçüm kurulmadan metrik raporlanamaz.

## 7. Riskler ve açık sorular

- Talep ve kitle büyüklüğü bilinmiyor; ilk ay "öğrenme" ayıdır, gelir hedefi yoktur.
- Mobil performans gerçek cihazlarda ölçülmedi (`buyucu-oyunu-hikaye-ve-bolumler.md` §7 aynı riski belirtir); düşük seviye telefonlarda takılma olabilir. Lansmandan önce en az iki gerçek telefonda denenmeli.
- Denge sayıları oynanarak ayarlanmadı; bölüm geçiş oranları ilk hafta verisinden öğrenilecek.
- Emre'ye sorular: önce TR mi global mi; video/sosyal hesaplar kimin adına açılacak; ücretli test için hangi platform; ölçüm aracı (çerezsiz) onaylanacak mı.

## 8. Sonraki odalar için notlar

- **Analitik:** Önce ölçüm (anonim, KVKK), sonra reklam. Olay sözlüğü: `docs/analitik/olcum-plani.md`.
- **Web/SEO:** Meta etiketleri ve `og-image.png` hazır; canlıya alma Emre'nin onayında.
- **İçerik/Sosyal medya:** Ana kanca: "Şafak yüzyıldır doğmadı" ve Gölge Kral karşılaşması. Metinler onaya gönderilir.
- **Reklam:** Hafta 3 öncesi kampanya kurulmaz; tavan aşılmaz.
