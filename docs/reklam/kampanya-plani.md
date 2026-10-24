# Ücretli Test Kampanyası Planı (ÖNERİ, onay bekliyor)

Durum: **ONAY BEKLİYOR.** Kampanya kurulmadı, hesap açılmadı, hiçbir harcama yapılmadı. Kampanya başlatma ve bütçe harcama Emre'nin onayına tabidir (`onay_iste`; genel müdür sunar).
Dayanak: `docs/pazarlama-stratejisi/lansman-plani.md` (§3-§4, §9), `docs/icerik/marka-sesi.md`, `docs/icerik/eposta-ve-paylasim-metinleri.md`, `docs/sosyal-medya/kanal-secimi-ve-takvim.md`, `docs/web-seo/olcum-plani.md`, `docs/web-seo/seo-raporu.md`. Bunlarla çelişmez.
Etiketler: (V) belgelerden doğrulanmış, (Varsayım) doğrulanmamış. Hedef sayılar benchmark değil, tahmindir.

## 1. Platform seçimi: Meta (tek platform), Google atlanır

Lansman planı "Meta veya Google, tek küçük kampanya" der (V). Öneri: **Meta (Instagram + Facebook akışı/Reels yerleşimi).**

| Ölçüt | Meta | Google (Arama) |
|---|---|---|
| Talep türü | Talep yaratır: kimse "Sapma: 38 cm" aramaz, ürün kategorisi yeni | Mevcut aramayı yakalar: "tarayıcı oyunu" gibi genel kelimeler rekabetli ve niyeti belirsiz; ürüne özgü arama hacmi büyük olasılıkla ~0 (Varsayım) |
| Kreatif | Kanca görsel/video: "Sapma: 38 cm" anı; `gorsel-brief.md` videoları yeniden kullanılır | Yalnızca metin; asıl kozumuz kullanılamaz |
| 3.000 ₺'de öğrenme | Düşük bütçeyle kreatif karşılaştırılabilir | Az tıklamayla kelime testi anlamsız kalır |
| Ölçüm gereksinimi | Pixel olmadan "bağlantı tıklaması" hedeflenebilir; sonuç GoatCounter UTM'inden okunur | Dönüşüm izleme için GA4/etiket gerekir; çerez/onay yükü (`olcum-plani.md` §1) |

Google atlama nedeni: niş, yeni bir kategori için arama niyeti zayıf; kreatif avantajımız kullanılamıyor; dönüşüm etiketi onay bandı gerektirir. Kitle öğrenildikten sonra (Ay 2+) oyun adı aramaları için yeniden değerlendirilir.

Kritik uyum: Plan çerezsiz ölçüm tercih ediyor. Bu yüzden **Meta Pixel / Conversions API kurulmaz**; kampanya hedefi "Trafik / bağlantı tıklaması", gerçek sonuç (tamamlama) GoatCounter olaylarından UTM kırılımıyla okunur. Pixel eklenmesi ayrı bir yasal/onay konusudur ve bu planın dışındadır.

## 2. Bütçe dağılımı

Tavan: lansman planındaki ücretli test payı **~3.000 ₺** (V). Aşılmaz. Kreatif/düzenleme (~1.000 ₺) ve yedek (~1.000 ₺) kalemleri bu planın dışındadır ve buradan harcanmaz.

| Aşama | Süre | Günlük | Toplam | Not |
|---|---|---|---|---|
| A. Test | 7 gün (Hafta 3) | 200 ₺ | 1.400 ₺ | 1 reklam seti, 3 kreatif birlikte; Meta dağıtımına bırakılır |
| B. Ölçekleme (yalnızca kurallar sağlanırsa) | en çok 7 gün (Hafta 4) | 200-230 ₺ | en çok 1.600 ₺ | Kazanan kreatif; günlük artış en çok %20 |
| **Toplam tavan** | 14 gün | | **3.000 ₺** | A+B toplamı; harcanmayan kısım harcanmaz |

Onay çağrısında sunulacak tutarlar: **toplam 3.000 ₺ (tavan); günlük 200 ₺ (Aşama A).** Aşama B için ayrı bir ara onay istenmesi önerilir (günlük en çok 230 ₺). KDV dahil tavan 3.000 ₺ sayılır; Meta'nın gerçek faturalanan tutarı hesap ayarında kontrol edilmeli (Varsayım).

## 3. Hedefleme (hepsi Varsayım, ilk testte dar tutulur)

- Konum: Türkiye. Dil: Türkçe. Yaş: 18-45 (plan §2 birincil kitle; küçük yaş hedeflenmez).
- Kitle (tek reklam seti, geniş ilgi alanı): bulmaca/zeka oyunları, tarayıcı/hafif oyunlar, strateji oyunları, mimarlık, şehir planlama, iş sağlığı ve güvenliği. İlgi alanı adları Meta arayüzünde birebir bulunmayabilir; yakın karşılık seçilir.
- Bölme: 3.000 ₺'de veri dağılmasın diye kitle bölünmez. Oyuncu ilgisi mi, şehircilik/İSG ilgisi mi sorusu Aşama B'de, gerekirse bütçe içinde ikinci setle sınanır.
- Yerleşim: Instagram Reels ve akış, Facebook akış; Audience Network kapalı. Cihaz: ağırlık mobil, ama önce mobil dokunma testi geçmeli (ön koşul).
- Yurt dışı ve İngilizce kitle yok (EN denemesi organik, Hafta 2).
- Saat optimizasyonu yapılmaz, sürekli yayın.

## 4. Kreatif varyantları (3)

Çizgi: `marka-sesi.md`. Abartı yok; "resmi eğitim/sertifika/uyumlu" yok; uydurma sayı veya yorum yok; demo anılmaz. Format: 15-20 sn dikey ekran kaydı (`gorsel-brief.md` brief'leriyle) veya tek görsel yedeği. Gerçek oyun ekranı kullanılır. Videolar Emre onayına ayrıca gider.

**V1, Kanca "Sapma"**
- Başlık: "Sapma: 38 cm. Senin gözün kaç?"
- Ana metin: "Eksik nesneyi koy, ne kadar ıskaladığını santimetreyle gör. 5 sahne, birkaç dakika, kayıt yok."
- Buton: Oyna. Görsel: sapma sonucunun çıktığı an.

**V2, Soru "Peron şeridi"**
- Başlık: "Peron şeridi kenardan ne kadar uzakta olmalı?"
- Ana metin: "Her gün gördüğün şeylerin nerede durması gerektiğini bilir misin? Tarayıcıda dene, 3B bir bulmaca. Kurallar ABD/uluslararası tarzı rehberlere dayanır."
- Buton: Oyna. Görsel: metro peronu sahnesi, yerleştirme anı.

**V3, Kolaylık "Kurulumsuz"**
- Başlık: "Tarayıcıda 5 sahnelik bir bulmaca"
- Ana metin: "Ücretsiz, kurulumsuz. Metro peronundan yangın koridoruna, eksik nesneyi doğru yere koy. Resmi bir eğitim değil, bir bulmaca."
- Buton: Oyna. Görsel: 5 sahneden kısa kolaj.

Notlar: "Ücretsiz, kurulumsuz, kayıt yok" doğrudur (V). "Veri toplamıyoruz" denmez, gizlilik iddiası kurulmaz. Politika ön kontrolü (yalnızca metin düzeyinde): güvenlik/sağlık garantisi yok, kişiyi hedef alan özellik iması yok ("gözün kötü mü?" gibi), karşılaştırmalı üstünlük yok. Meta'nın gerçek inceleme sonucu bilinmez; reddedilirse metin sadeleştirilir.

## 5. UTM şeması

Temel adres: https://emreaktepe.github.io/Putthatthere/ (V). Kampanya adı sosyal medya odasıyla uyumlu (`lansman30`), ücretli trafik `paid_social` ile ayrılır.

Biçim: `?utm_source=meta&utm_medium=paid_social&utm_campaign=lansman30_test&utm_content=<kreatif>&utm_term=<kitle>`

| Kreatif | utm_content | Örnek |
|---|---|---|
| V1 | `v1_sapma` | `https://emreaktepe.github.io/Putthatthere/?utm_source=meta&utm_medium=paid_social&utm_campaign=lansman30_test&utm_content=v1_sapma&utm_term=genis_tr` |
| V2 | `v2_peron` | aynı biçim, `utm_content=v2_peron` |
| V3 | `v3_kurulumsuz` | aynı biçim, `utm_content=v3_kurulumsuz` |

Kurallar: küçük harf, alt çizgi, Türkçe karakter yok. UTM'lerin GoatCounter'da okunabilmesi `js/analytics.js` uygulamasına bağlıdır (Analitik/Geliştirme odası; doğrulanmadı). Aşama A öncesi UTM'li bir bağlantıyla deneme ziyareti yapılıp panelde görüldüğü doğrulanır.

## 6. Ölçüm ve hedefler (Varsayım)

Kaynak: GoatCounter olayları, UTM kırılımı (`olcum-plani.md` §3-4).
- Bağlantı tıklaması başına maliyet (Meta panelinden): öğrenilecek; ön eşik ≤ 4 ₺ (Varsayım).
- Tamamlama oranı = `oyun_bitti` / `oturum_basladi`: hedef %50+ (plan §6); yarısı %25 durdurma eşiğidir.
- **Hedef maliyet (CAC yerine):** Ürün ücretsiz ve kayıtsız (V); kayıt/satın alma yok. Bu yüzden **tamamlayan oyuncu başına maliyet** izlenir; ilk hedef ≤ 30 ₺ (Varsayım, dayanağı yok; test sonunda gerçek veriyle yeniden belirlenir).
- Meta tıklaması ile sitedeki ziyaret sayısı arasında fark çıkabilir; sonuç sitedeki sayıdan okunur.

## 7. Durdurma ve ölçekleme kuralları

Durdurma (biri yeter; hepsi Emre'ye bildirilir):
1. Harcama 1.000 ₺'ye ulaştı ve tamamlama oranı %25'in altında: duraklat, Emre'ye sor (plan §4 ile aynı).
2. İlk 3 gün (~600 ₺) içinde sitede `oturum_basladi` görünmüyor (ölçüm bozuk ya da trafik yok): duraklat, nedenini araştır.
3. Bir kreatif 300 ₺ harcayıp ortalama tıklama maliyetinin 2 katından pahalı: yalnızca o reklam kapatılır.
4. Reklam reddi, hesap uyarısı veya olumsuz yorum/şikayet dalgası: duraklat, metni gözden geçir.
5. `webgl_yok` ya da mobil hata oranı yüksek: duraklat, Test/yayın odasına ilet.
6. Toplam harcama 3.000 ₺: biter; hesapta toplam harcama limiti ayrıca ayarlanır.

Ölçekleme (Aşama B; hepsi sağlanırsa ve Emre onaylarsa):
- Tamamlama oranı ≥ %40 ve tamamlayan başına maliyet ≤ 30 ₺ (Varsayım eşikleri).
- Yeterli veri yoksa (kreatif başına ~100 tıklamadan az) karar "belirsiz": ölçeklenmez, test 2-3 gün uzatılır (tavan içinde).
- Yalnızca kazanan kreatif; günlük artış en çok %20; tavan aşılmaz.
- Hiçbir koşul sağlanmazsa: kampanya kapatılır, kalan bütçe harcanmaz, öğrenilenler rapora yazılır.

## 8. Test planı

| Soru | Nasıl | Sonuç |
|---|---|---|
| Hangi kanca daha iyi? | V1/V2/V3 aynı sette, `utm_content` ile | Tıklama maliyeti ve tamamlama oranı |
| Ücretli trafik oyunu bitiriyor mu? | `oyun_bitti`/`oturum_basladi`, kaynak=meta | Organikle kıyas |
| Paylaşım var mı? | `skor_paylasildi` (özellik henüz yok) | Yoksa yalnızca not |
| Karar | Hafta 4 sonu: devam / içerik / dur | Plan §5 ile aynı |

## 9. Ön koşullar (hepsi sağlanmadan hiçbir şey başlamaz)

- [ ] **Ölçüm kurulu ve doğrulanmış:** GoatCounter (veya seçilen araç) canlı; `oturum_basladi` ve `oyun_bitti` çalışıyor; UTM'li deneme ziyareti panelde görünüyor. Bugün kurulu değil (V, `olcum-plani.md`: onay bekliyor).
- [ ] Gizlilik notu ("Anonim ölçüm yapılıyor") Emre tarafından onaylı.
- [ ] **OG görseli** (`assets/og-image.png`, 1200x630) hazır; şu an yok (V, `seo-raporu.md`).
- [ ] Emre 5 sahneyi kendi tarayıcısında oynadı; mobil dokunma ve WebGL yedeği doğrulandı (plan Hafta 0).
- [ ] Kreatifler (video/görsel) üretildi ve Emre onayladı.
- [ ] Meta reklam hesabı, ödeme yöntemi ve sayfa/Instagram hesabı Emre adına açık (kimin adına olacağı açık soru); hesap harcama limiti 3.000 ₺.
- [ ] Zamanlama: Hafta 3'ten önce kampanya kurulmaz (plan §9).
- [ ] **Emre onayı:** `onay_iste` ile toplam 3.000 ₺ (tavan) ve günlük 200 ₺ belirtilerek. **Durum: onay bekliyor; onaysız kampanya kurulmaz, harcama yapılmaz.**

## 10. Açık sorular ve riskler

- Meta hesabı kimin adına, hangi sayfa/hesapla (Emre karar verir).
- Kreatif videoları kim, ne zaman üretecek (İçerik/Sosyal medya odaları).
- Pixel kurulmadığı için Meta tamamlamaya göre optimize edemez, yalnızca tıklamaya göre; bu bilinçli bir sınırlamadır.
- Demo (Küre Toplayıcı) hiçbir kreatifte yoktur (plan §7).
- Politika uygunluğu yalnızca metin düzeyinde kontrol edildi; platform incelemesi yapılmadı.
