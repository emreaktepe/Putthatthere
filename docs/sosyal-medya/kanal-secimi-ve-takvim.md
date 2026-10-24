# Sosyal Medya: Kanal Seçimi ve 30 Günlük Takvim (TASLAK)

Durum: ONAY BEKLİYOR. Hiçbir hesap açılmadı, hiçbir şey yayınlanmadı, zamanlanmadı. Hesap açma ve her yayın Emre'nin onay kapısındadır.
Dayanak: `docs/pazarlama-stratejisi/lansman-plani.md` (kanal karması, haftalık takvim) ve `docs/icerik/*` (metinler, görsel brief'leri). Çelişme durumunda onların metinleri geçerlidir; bu belge metin yeniden yazmaz, yalnızca referans verir.
Etiketler: (V) belgelerden doğrulanmış, (Varsayım) doğrulanmamış.

## 1. Kanal seçimi (3 kanal)

| # | Kanal | Rol | Gerekçe |
|---|---|---|---|
| 1 | Topluluk paylaşımları: Reddit (TR; İngilizce r/WebGames Hafta 2+), gerekirse Ekşi/Discord | Ana kanal | Lansman planında ana kanal ve birincil kitle (Türkçe oyuncular) burada (V, plan §2-3). "Yaptım, dener misiniz" biçimi geri bildirim getirir. Nakit maliyet yok. |
| 2 | Kısa video: YouTube Shorts + Instagram Reels (aynı dosya, tek üretim) | En yüksek potansiyel, en yüksek belirsizlik | Planda 4-6 videoyla öğrenme öngörülüyor (V). Büyü efektleri ve Gölge Kral görsel kanca. 3 video brief'i hazır (`gorsel-brief.md`). TikTok aynı dosyayla sonradan eklenebilir; ay 1'de hesap sayısını düşük tutmak için dışarıda. |
| 3 | LinkedIn (kişisel profil veya sayfa, Emre karar verir) | İkincil kitle | Meraklı geliştiriciler ve indie oyun çevresi (plan §2). Yapım notları metni hazır. Haftada en çok 1 gönderi. |

Seçilmeyenler ve neden: X (ay 1'de ayrı kitle kurma emeği; hazır metin isteğe bağlı olarak Gün 9'da yedek), Facebook ve Pinterest (kitle kanıtı yok), ücretli reklam (reklam odasının işi, Hafta 3-4, ayrı onay).
Varsayım: kitle davranışı doğrulanmadı; ilk ay öğrenme ayıdır. Hesap sahibi/adı (kişisel mi marka mı) Emre'nin kararıdır; açık soru.

## 2. UTM şeması

Temel adres: https://emreaktepe.github.io/Putthatthere/
Biçim: `?utm_source=<kanal>&utm_medium=<organic_social|community>&utm_campaign=lansman30&utm_content=<gonderi-kodu>`
Örnek: `https://emreaktepe.github.io/Putthatthere/?utm_source=reddit&utm_medium=community&utm_campaign=lansman30&utm_content=g03-tr`
Not: Ölçüm henüz kurulu değil (V); UTM'ler ölçüm eklenene kadar rapora dönüşmez. Reddit gibi yerlerde UTM'li bağlantı kural açısından sorun çıkarabilir; kural kontrolünde (§4) bakılır, gerekirse sade bağlantı kullanılır.

## 3. 30 günlük takvim

Gün 1 = onaylı yumuşak lansman günü (tarih Emre onayından sonra belirlenir; gerçek tarih yok). Hazırlık (Hafta 0: ölçüm kararı, gerçek telefon testi, Emre'nin 9 bölümü oynaması) Gün 1'den önce bitmelidir. Yalnızca dolu günler listelenir; listede olmayan günler boştur (yorum yanıtı, dinlenme). Tüm satırların durumu: **onay bekliyor**.
Metin sütunu `docs/icerik/eposta-ve-paylasim-metinleri.md` (A) veya `paylasim-metinleri.md` (S) kodlarına işaret eder.

| Gün | Kanal | Format | Metin / konu | Durum |
|---|---|---|---|---|
| 1 | Özel mesaj | Mesaj | Yumuşak lansman: 5-10 tanıdığa kısa mesaj (S-1) | onay bekliyor |
| 2 | (iç) | Geri bildirim | Geri bildirim toplama, hata listesi; paylaşım yok | onay bekliyor |
| 3 | Reddit TR | Gönderi | Reddit TR metni (A). Alt dizin kuralı yayından önce doğrulanır | onay bekliyor |
| 4 | Reddit TR | Yorum yanıtları | Yanıt rehberi (§5) | onay bekliyor |
| 5 | LinkedIn | Gönderi | LinkedIn metni (A) | onay bekliyor |
| 7 | (iç) | Değerlendirme | Hafta 1 özeti (Analitik odasına girdi); hata düzeltmeleri | onay bekliyor |
| 8 | Shorts + Reels | Video | Video 1 "Şafak yüzyıldır doğmadı" (15 sn). Alt yazı: S-2 | onay bekliyor |
| 9 | X (yedek, isteğe bağlı) | Gönderi | X metni (A). Hesap açılmadıysa atlanır | onay bekliyor |
| 11 | Shorts + Reels | Video | Video 2 "Yıldırım zinciri" (12 sn). Alt yazı: S-3 | onay bekliyor |
| 12 | Reddit EN (r/WebGames) | Gönderi | S-4 (kısa İngilizce). Kural kontrolü şart | onay bekliyor |
| 13 | Kişisel mesaj | DM | 5-10 oyun/Three.js topluluğuna ya da içerik üreticisine tek tek mesaj (S-5) | onay bekliyor |
| 14 | (iç) | Değerlendirme | Hafta 2 özeti; en iyi videoyu belirle | onay bekliyor |
| 15 | Shorts + Reels | Video | Video 3 "Gölge Kral" (20 sn), spoiler'sız. Alt yazı: S-3 | onay bekliyor |
| 17 | LinkedIn | Gönderi | Blog 1 özeti: "Şafak neden yüzyıldır doğmadı?" (S-6). Blog yayında ise; aksi halde atla | onay bekliyor |
| 18 | Shorts + Reels | Video | Ölçüme göre en iyi videonun yeniden paylaşımı (yeni alt yazı) | onay bekliyor |
| 20 | Reddit TR | Yorum | Kendi gönderine "geri bildirimleri uyguladım" güncellemesi (S-7), yeni gönderi değil | onay bekliyor |
| 21 | (iç) | Değerlendirme | Hafta 3 özeti. Ücretli test kararı reklam odası/Emre'de | onay bekliyor |
| 22 | LinkedIn | Gönderi | Blog 2 özeti: "Build'siz bir tarayıcı oyunu nasıl yapıldı?" (S-6). Aynı koşul | onay bekliyor |
| 26 | Reddit TR | Yorum/gönderi | "Hangi bölümde takıldın?" geri bildirim sorusu (S-8), kural izin veriyorsa | onay bekliyor |
| 28 | LinkedIn | Gönderi | Ay özeti: ne öğrendik (dürüst, gerçek veriyle; veri yoksa nitel). Sayı uydurulmaz | onay bekliyor |
| 29 | (iç) | Değerlendirme | Hafta 4 değerlendirmesi: devam / içerik / dur | onay bekliyor |
| 30 | (iç) | Karar | Emre'ye ay raporu ve sonraki ay önerisi. E-posta formu ayrı onay kapısında (kişisel veri/KVKK) | onay bekliyor |

Sıklık: ayda 4-5 video, haftada en çok 1 LinkedIn gönderisi, topluluk başına en fazla 1 yeni gönderi; her topluluğun kendi tanıtım kuralı gözetilir.

## 4. Topluluk kuralı kontrol listesi (her yayın öncesi)

Kural metinlerine erişilemedi; alt dizinlerin güncel kuralları yayın öncesi Emre/oda tarafından okunmalı (Varsayım: aşağıdakiler genel uygulamadır).

- [ ] Alt dizinin/grubun kendi tanıtım kuralı okundu (kendi projesini paylaşma serbest mi, haftalık "self-promo" başlığı var mı, etiket/flair şart mı).
- [ ] Hesap yaşı/karma/etkinlik şartı karşılanıyor mu; yeni açılmış hesap ilk gün topluluğa bağlantı atmıyor.
- [ ] Kendi tanıtım oranı: hesabın paylaşımlarının büyük kısmı tanıtım olmamalı (yaygın "%10" kuralı, Varsayım).
- [ ] Aynı metin birden çok topluluğa kopyalanmadı; her yerde farklı başlık/gövde, farklı gün.
- [ ] Oy/yorum satın alma, arkadaşlardan oy isteme, sahte hesap yok.
- [ ] Kendi projem olduğu ilk cümlede açık ("yaptım").
- [ ] Başlıkta abartı, tıklama tuzağı, büyük harf yok; sayı/"viral"/"binlerce oyuncu" iddiası yok.
- [ ] Oyunda olmayan özellik (hesap, skor tablosu, çok oyunculu, mağaza uygulaması) vaat edilmiyor; spoiler yok.
- [ ] Gizlilik/veri iddiası yok.
- [ ] Doğrudan mesaj kişiye özel ve tek tek; toplu/otomatik mesaj yok; ret isteklerine saygı.
- [ ] UTM'li bağlantı alt dizin tarafından yasaklanmıyor; yasaksa sade bağlantı.
- [ ] Silinen/kaldırılan gönderi aynı gün yeniden atılmıyor; moderatöre soruyla çözülüyor.
- [ ] Hiçbir hesap Emre'nin onayı olmadan açılmadı; hiçbir gönderi onaysız yayınlanmadı.

## 5. Yanıt rehberi (özet)

Ton: marka sesi (`docs/icerik/marka-sesi.md`): gizemli, sıcak, kısa, "sen".
- Teşekkür/övgü: kısa teşekkür, "hangi bölüm en çok zorladı?" sorusu.
- Hata/bug: teşekkür, tarayıcı ve cihaz sor, "not aldım" de; Emre'ye ilet. Düzeltme söz verme.
- "Çok zor/çok kolay": denge henüz oynanarak ayarlanmadı; notu al, hangi bölüm olduğunu sor.
- "Veri topluyor musunuz?": şu an hesap yok, ilerleme yalnızca tarayıcıda; ölçüm kurulursa gizlilik notu yayında olacak. Kesin gizlilik iddiası kurma, Emre'ye sor.
- "Mobilde çalışmıyor/takılıyor": cihaz/tarayıcı sor; gerçek cihaz performansı ölçülmedi, dürüstçe söyle.
- "Telefona uygulama / çok oyunculu / skor tablosu var mı?": yok; planda da yok, söz verme.
- "Ücretli mi?": ücretsiz; ileride ne olacağı belli değil, söz verilmez.
- Olumsuz/alaycı yorum: bir kez nazikçe cevapla, tartışma uzatma. Hakaret/spam: yanıt verme, moderatöre bildir.
- Reklam/iş birliği teklifi: cevap verme, Emre'ye ilet.

## 6. Açık sorular (Emre)

1. Hesaplar kimin adına, hangi adla açılacak (Reddit, YouTube, Instagram, LinkedIn)?
2. Önce TR mi global mi (EN gönderiler Gün 12'de denenir)?
3. Ölçüm ne zaman kurulacak (UTM'ler buna bağlı)?
4. Video üretimi kim yapacak (brief hazır, videolar çekilmedi)?
