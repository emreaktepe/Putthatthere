# SEO Raporu

Dayanak: `docs/pazarlama-stratejisi/lansman-plani.md`, `docs/strateji/*` (çelişme yok: ücretsiz çekirdek, ödeme/fiyat yok, ölçüm onay bekliyor). Yayın, alan adı ve DNS değişikliği yapılmadı.

## 1. Yapılanlar

- `index.html` `<head>`: title, description, canonical, robots, theme-color, Open Graph, Twitter Card. JS/oyun mantığına dokunulmadı.
- `robots.txt` ve `sitemap.xml` (yalnızca ana sayfa). `demo/` sitemap'te yok ve robots'ta Disallow (onay bekliyor).
- `docs/web-seo/olcum-plani.md`: ölçüm seçenekleri ve olay adları. Takip betiği eklenmedi (onay bekliyor).

## 2. Dikkat edilecekler

- **OG görseli yok:** `assets/og-image.png` (1200x630) yer tutucu yoldur; dosya henüz yok. Brief: metro peronu ekran görüntüsü, üstte "Sapma: 38 cm" rozeti, oyun adı, sade koyu zemin, metin güvenli alan içinde. Görsel hazır olana kadar paylaşım önizlemesi görselsiz çıkar. İçerik odasına iletilmeli.
- **robots.txt konumu:** Site `emreaktepe.github.io/Putthatthere/` altında (proje sitesi); arama motorları robots.txt'yi yalnızca alan adı kökünde (`emreaktepe.github.io/robots.txt`) arar, alt yoldakini okumaz. Dolayısıyla bu dosya fiilen etkisizdir; `demo/` için gerçek engelleme `<meta name="robots" content="noindex">` ile demo sayfasında yapılmalı (demo/ dosyasına dokunmadım) ya da özel alan adı kullanılmalı. Sitemap, Search Console'a elle gönderilir.
- **Dil:** İki dil aynı URL'de JS ile değişiyor; ayrı URL olmadığından hreflang eklenmedi. Arama motoru yalnızca ilk HTML'i (TR) görür; EN için ayrı sayfa ileride düşünülmeli.
- **İçerik:** Oyun JS ile çiziliyor, sayfada indekslenecek metin çok az. Organik arama Ay 1'de zaten düşük beklentili (lansman planı). Ayrı bir tanıtım sayfası (SSS, özellikler) sonraki iş; fiyat yayınlanmaz.
- Yapılandırılmış veri (schema.org `VideoGame`/`WebApplication`) eklenmedi; kapsam küçük tutuldu, istenirse eklenir.
- Mobil/performans ölçülmedi (test edilmedi).

## 3. Search Console doğrulama (Emre yapar)

GitHub Pages proje sitesinde DNS erişimi yok, bu yüzden **URL öneki** mülkü ve **HTML etiketi** yöntemi kullanılır:

1. search.google.com/search-console, "Mülk ekle", "URL öneki": `https://emreaktepe.github.io/Putthatthere/`.
2. Doğrulama yöntemi "HTML etiketi"; verilen `<meta name="google-site-verification" content="...">` değerini bana/odaya ilet (kod gizli değildir ama depoya Emre onayıyla girer). Alternatif: "HTML dosyası" yöntemi, dosyayı depo köküne koy.
3. Değişiklik yayınlandıktan sonra "Doğrula".
4. "Site haritaları" bölümüne `sitemap.xml` yaz ve gönder.
5. "URL denetimi" ile ana sayfayı test et, "Dizine eklenmesini iste".
6. Özel alan adı alınırsa DNS TXT yöntemi ve "Alan adı" mülkü tercih edilir (DNS değişikliği onaya tabidir).

## 4. Kontrol listesi

- [x] title, description, canonical, OG, Twitter etiketleri
- [x] robots.txt, sitemap.xml (demo hariç)
- [x] Ölçüm planı ve olay adları
- [ ] OG görseli (yer tutucu yol, dosya yok)
- [ ] Search Console doğrulama (Emre)
- [ ] Ölçüm kurulumu (onay bekliyor)
- [ ] Yayın ve doğrulama sonrası paylaşım önizleme testi (Facebook/LinkedIn debugger)
- [ ] Mobil ve hız testi (yapılmadı)
- [x] demo/ için noindex (demo/index.html içine eklendi)
