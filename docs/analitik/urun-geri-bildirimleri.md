# Ürün Geri Bildirimleri (Ürün Stüdyosu'na)

Kapsam: Yalnızca repodaki dosyalardan doğrulanan bulgular. Kullanıcıdan gelen gerçek geri bildirim yok (lansman yapılmadı, ölçüm yok); "oyuncular şunu istiyor" türü bir iddia yazılmadı. Tarayıcıda hiçbir şey çalıştırılmadı; her madde dosya okumasına dayanır, davranış doğrulanmadı. Gerçek oyuncu geri bildirimi geldikçe tablo genişletilir (kaynak bağlantısıyla).

| # | Bulgu | Dayanak | Etki | Öneri |
|---|---|---|---|---|
| G1 | Analitik yok; `js/analytics.js` yok, takip kodu yok | `js/` dizini; `index.html` içinde ölçüm kodu yok | Lansman sonrası hiçbir huni sayısı çıkmaz; ücretli test ön koşulu sağlanamaz | Onay sonrası `docs/analitik/olcum-plani.md` §1 olay tablosunu uygula |
| G2 | Paylaşım önizleme görseli (`og-image.png`) repoda hazır ama canlıda değil | `assets/og-image.png`, `index.html` meta etiketleri | Yayına alınana kadar bağlantı paylaşımları görselsiz önizlenir | Yayından sonra Facebook/LinkedIn debugger ile kontrol |
| G3 | WebGL açılamazsa kullanıcıya açıklayıcı mesaj gösterileceği doğrulanmadı | `js/main.js`: renderer modül içe aktarılırken kuruluyor (yorum: "sahneyi hemen kurar"); `boot()` hata yakalaması bu aşamadan sonra çalışıyor | WebGL'siz/çok eski cihazlarda boş ekran olasılığı (Varsayım, denenmedi) | WebGL desteğini oyun yüklenmeden denetleyen kısa bir `index.html` uyarısı |
| G4 | Mobil/dokunma davranışı ve performans gerçek cihazda ölçülmedi | `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` §5.5 ve §7 ("cihazda ölçülmeli") | Reklam trafiği ağırlıkla mobil olacak; takılma ilk izlenimi bozabilir | Lansman öncesi en az iki gerçek telefonda tüm bölümleri dene; fps notu al |
| G5 | `robots.txt` proje alt yolunda etkisiz | `docs/web-seo/seo-raporu.md` §2: GitHub Pages proje sitesinde robots.txt yalnızca alan adı kökünde okunur | `Disallow: /Putthatthere/admin.html` fiilen işlemez | Asıl engel `admin.html` içindeki `noindex`; özel alan adı alınırsa robots.txt de işler |
| G6 | Tüm depo yayınlanıyor, `docs/` ve `admin.html` herkese açık | `.github/workflows/deploy-pages.yml`: `upload-pages-artifact` `path: '.'` | İç belgeler (strateji, bütçe, reklam planı) URL'si bilinirse okunabilir | Yayın klasörünü ayırmak ya da belgelerin açık olmasını kabul etmek: Emre'nin kararı |
| G7 | Menüde herkese görünen "Yönetim" bağlantısı var | `js/ui/menu.js` (`admin-link`) | Oyuncular yönetim sayfasına ulaşabilir (taslaklar yalnız kendi tarayıcılarında kalır, ama karışıklık yaratabilir) | Yayında bağlantıyı gizlemek (ör. yalnız `?dev=1` ile göstermek) değerlendirilsin |
| G8 | İlerleme yalnızca tarayıcıda (`buyucu_save`); hesap/bulut kaydı yok | `README.md` Kontroller/Akış | Tarayıcı verisi silinirse ya da cihaz değişirse ilerleme kaybolur; mesajlarda bu söylenmeli | Gerekirse "ilerleme bu tarayıcıda saklanır" notu ana ekranda |
| G9 | Zorluk dengesi oynanarak ayarlanmadı | `buyucu-oyunu-hikaye-ve-bolumler.md` başı ("denge testi gerekir"), §7 | İlk bölümlerde ya da patronda aşırı zorluk/kolaylık olabilir | `bolum_kaybedildi`/`bolum_baslatildi` verisiyle ayar; öncesinde Emre'nin 9 bölümü oynaması |
| G10 | Oyun yalnızca Türkçe | `data/game.config.json` metinleri Türkçe | İngilizce topluluk paylaşımlarında (r/WebGames) dil engeli | Paylaşım metinlerinde belirtildi; çeviri kapsam dışı |

## Kapsam dışı bırakılanlar (dayanak yok)

- "Skor tablosu", "paylaş" düğmesi, hesap, çok oyunculu mod, mobil mağaza uygulaması: üründe yok ve planda yok; talep kanıtı gelmeden önerilmedi.
- Fiyatlandırma: ürün ücretsiz; ödeme önerisi yapılmadı.
