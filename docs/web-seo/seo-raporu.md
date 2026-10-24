# SEO Raporu

Dayanak: `docs/pazarlama-stratejisi/lansman-plani.md`, `docs/strateji/*` (çelişme yok: ücretsiz çekirdek, ödeme/fiyat yok, ölçüm onay bekliyor). Yayın, alan adı ve DNS değişikliği yapılmadı.

## 1. Yapılanlar

- `index.html` `<head>`: title, description, canonical, `robots: index,follow`, Open Graph (başlık, açıklama, url, görsel + boyut + alt metin, `og:locale tr_TR`), Twitter Card (`summary_large_image`). Mevcut viewport, tema, PWA, manifest, ikon etiketleri ve importmap'e dokunulmadı; oyun mantığına dokunulmadı.
- `assets/og-image.png` (1200x630) `tools/make-og-image.mjs` ile üretildi: mor gece, hilal, şapka, yıldızlar; metin içermez.
- `robots.txt`: `Disallow: /Putthatthere/admin.html`, sitemap satırı. `sitemap.xml` yalnızca ana sayfa (`lastmod` yok).
- `admin.html` zaten `<meta name="robots" content="noindex">` taşıyor (yönetim sayfası aranmasın).
- `docs/web-seo/olcum-plani.md`: ölçüm seçenekleri ve olay adları. Takip betiği eklenmedi (onay bekliyor).

## 2. Dikkat edilecekler

- **Önizleme görseli:** `og-image.png` repoda hazır; canlıya alınınca sosyal ağların önizleme önbelleği eski/boş sonucu tutabilir. Yayından sonra Facebook/LinkedIn debugger ile kontrol edilmeli (denenmedi).
- **robots.txt konumu:** Site `emreaktepe.github.io/Putthatthere/` altında (proje sitesi); arama motorları robots.txt'yi yalnızca alan adı kökünde (`emreaktepe.github.io/robots.txt`) arar. Depo kökündeki dosya fiilen etkisizdir. Bu yüzden yönetim sayfasının asıl engeli `admin.html` içindeki `noindex` meta etiketidir; robots.txt yalnızca özel alan adı alınırsa işe yarar. Sitemap, Search Console'a elle gönderilir.
- **Tüm depo yayınlanıyor:** Dağıtım iş akışı depoyu olduğu gibi yayınlar (`.github/workflows/deploy-pages.yml`), dolayısıyla `docs/` ve `admin.html` URL'si bilinirse herkese açıktır; `noindex` gizlilik sağlamaz. İç belgeler (strateji, bütçe) açık kalmasın isteniyorsa karar Emre'nindir.
- **İçerik:** Oyun JS ile çiziliyor, sayfada indekslenecek metin çok az (arama motoru çoğunlukla `<title>` ve `description` görür). Organik arama Ay 1'de zaten düşük beklentili. Ayrı bir tanıtım sayfası (SSS, bölümler, kontroller) sonraki iş.
- **Dil:** Oyun yalnızca Türkçe; `<html lang="tr">` doğru (V). hreflang gerekmiyor.
- Yapılandırılmış veri (schema.org `VideoGame`) eklenmedi; kapsam küçük tutuldu, istenirse eklenir.
- Mobil/performans ölçülmedi (test edilmedi); Lighthouse çalıştırılmadı.

## 3. Search Console doğrulama (Emre yapar)

GitHub Pages proje sitesinde DNS erişimi yok, bu yüzden **URL öneki** mülkü ve **HTML etiketi** yöntemi kullanılır:

1. search.google.com/search-console, "Mülk ekle", "URL öneki": `https://emreaktepe.github.io/Putthatthere/`.
2. Doğrulama yöntemi "HTML etiketi"; verilen `<meta name="google-site-verification" content="...">` değerini odaya ilet (gizli değildir ama depoya Emre onayıyla girer). Alternatif: "HTML dosyası" yöntemi.
3. Değişiklik yayınlandıktan sonra "Doğrula".
4. "Site haritaları" bölümüne `sitemap.xml` yaz ve gönder.
5. "URL denetimi" ile ana sayfayı test et, "Dizine eklenmesini iste".
6. Özel alan adı alınırsa DNS TXT yöntemi tercih edilir (DNS değişikliği onaya tabidir).

## 4. Kontrol listesi

- [x] title, description, canonical, robots, OG, Twitter etiketleri
- [x] robots.txt, sitemap.xml (yalnızca ana sayfa)
- [x] admin.html noindex
- [x] OG görseli (`assets/og-image.png`)
- [x] Ölçüm planı ve olay adları
- [ ] Yayın (Emre onayı) ve sonrasında paylaşım önizleme testi
- [ ] Search Console doğrulama (Emre)
- [ ] Ölçüm kurulumu (onay bekliyor)
- [ ] Mobil ve hız testi (yapılmadı)
