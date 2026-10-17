# Fiyatlandırma Seçenekleri (ÖNERİ, YAYINLANMAMIŞTIR)

Bu belgedeki rakamlar yalnızca karşılaştırma içindir; kesin fiyat değildir ve yayınlanmamıştır. Fiyat yayınlamak, canlı ödeme anahtarı eklemek ve yasal metin (satış sözleşmesi, gizlilik) Emre'nin onayına tabidir (`onay_iste`).
Rakamlar "(Varsayım)" etiketlidir: talep verisi yok, rakip fiyatları `rakipler.md`'deki doğrulanmamış değerlere dayanır.

## Ön koşul gerçekler (V)

- Bugün yalnızca 5 sahne var, ödeme/hesap/analitik/sunucu yok, tamamen statik site.
- Bir sahne, JSON verisi (`data/scenes.json`) + prosedürel geometri kodu (`scene-builders.js`) gerektirir. Yani yeni sahne = veri + kod işi, saf içerik değil.
- Statik siteye gönderilen her şey tarayıcıda açıktır. Ücretli sahneleri yalnızca istemci tarafında "kilitlemek" kolayca aşılır; gerçek koruma için sunucu tarafı yetkilendirme gerekir (Mimari odasına not).
- Depo Apache 2.0: kopyalanıp satılabilir. Sahne paketlerini ayrı, kapalı bir depoda/lisansta tutmak gerekebilir.

## Seçenekler

| # | Model | Nasıl çalışır | Artı | Eksi |
|---|---|---|---|---|
| A | Tamamen ücretsiz (gelirsiz) | Mevcut hali; reklamsız, bağış/"kahve ısmarla" bağlantısı olabilir | Sıfır sürtünme, hızlı büyüme, ödeme altyapısı gerekmez | Gelir yok; sürdürülebilirlik düşük |
| B | Ücretsiz oyun + tek seferlik ücretli sahne paketleri | İlk 5 sahne ücretsiz; her biri 5 sahnelik tematik paket (ör. şantiye, hastane, okul çevresi, havalimanı) | Anlaşılır, abonelik yorgunluğu yok, kısa oyun için uygun; paket başına net teslimat | Her paket yeni geliştirme maliyeti; büyük kitle yoksa düşük gelir |
| C | Ücretsiz oyun + abonelik (GeoGuessr tarzı) | Aylık/yıllık ücretle tüm sahneler + günlük meydan okuma | Tekrarlayan gelir | 5-10 sahneyle abonelik gerekçelendirilemez; sürekli içerik üretimi şart |
| D | Tek seferlik premium oyun (Steam/itch.io, Unpacking tarzı) | Tüm oyun tek fiyat | Basit | Tarayıcıdaki ücretsiz sürümle çelişir; mevcut içerik fiyat bandının altında |
| E | Kurumsal/eğitim lisansı | Okul, İSG eğitimi, belediye için yıllık lisans + sertifika/rapor | Daha yüksek birim gelir | Satış çabası, güven ve içerik doğruluğu (TR standartları) gerekir; ilk sürüm için erken |

## Öneri

**Seçenek B**: Ücretsiz çekirdek oyun + tek seferlik ücretli sahne paketleri. Gerekçe:

1. Mevcut ürün kısa ve tek oturumluk; abonelik (C) tekrarlayan değer vaat edemez.
2. Ücretsiz çekirdek paylaşım ve keşfi sağlar, tarayıcı oyunu için en düşük sürtünme.
3. Paketler, oyuncunun zaten sevdiği şeye (daha fazla sahne) ödeme yapmasına izin verir; talep denenmeden yatırım yapılmaz.
4. E (eğitim) paketlerin üstüne, ikinci aşamada eklenebilir.

### Aşamalar

1. Aşama 0 (şimdi, ödeme yok): ölçüm + paylaşım + "yeni sahneler gelince haber ver" bekleme listesi. Kişisel veri (e-posta) toplanacaksa gizlilik/KVKK metni ve onay gerekir.
2. Aşama 1: ilk paket için sahte kapı (fake door) testi: "Şantiye Paketi, yakında" sayfası, tıklama sayısı ölçülür. Fiyat gösterilmez.
3. Aşama 2: ilk paketi (5 sahne) geliştir; test modunda ödeme entegrasyonu (Finans odası); fiyat için Emre onayı.

### Fiyat bandı (yalnızca iç hesap, YAYINLANMAZ, Varsayım)

Rakip referansları (Euclidean Skies 4,99 USD; Monument Valley 9,99 USD, doğrulanmamış) göz önüne alınarak 5 sahnelik paket için düşük tek haneli USD bandı veya karşılığı TL fiyat mantıklı görünüyor. Kesin rakam talep testinden sonra belirlenmeli. Türkiye için TL ve satın alma gücü ayrıca düşünülmeli (Varsayım).

## Riskler

- Talep kanıtı yok; paket geliştirmeden önce Aşama 0-1 verisi bekle.
- Apache 2.0 ve istemci tarafı kilidin kolay aşılması: gelirin bir kısmı kaybolabilir.
- İçerik doğruluğu: kurallar ABD/uluslararası tarzı; ücretli üründe resmi kaynaklara (TS, İSG mevzuatı) göre gözden geçirme gerekir. Bu doğrulama yapılmadı.
- Ödeme sağlayıcısı, vergi ve fatura (Türkiye) konuları bu belgede incelenmedi.
