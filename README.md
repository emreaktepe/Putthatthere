# Şunu Şuraya Koy (Put That There)

MIT Media Lab'ın 1980 tarihli ["Put-That-There"](https://en.wikipedia.org/wiki/Put-That-There) demosundan (Richard Bolt) ilham alan, tarayıcı tabanlı bir "dahi testi" bulmacası. Oyuncu gerçekçi bir sahnede (metro peronu, yaya geçidi, koridor, kaldırım köşesi, otopark) eksik olan tek bir gerçek dünya nesnesini/işaretini bulur, seçer ("that") ve doğru noktaya yerleştirir ("there"); konum ve gerekiyorsa döndürme doğruluğuna göre yıldız ve puan alır.

Sahne içerikleri, gerçek dünyadaki erişilebilirlik/trafik/yangın güvenliği kurallarına (toplu taşıma dokunsal uyarı şeridi, MUTCD tarzı dur çizgisi, NFPA 10 tarzı yangın söndürücü montaj yüksekliği, ADA/PROWAG tarzı kaldırım rampası ve engelli park alanı yerleşimi) dayanır — bkz. `docs/design/research.md`.

## Çalıştırma

Build aracı veya framework yok — saf statik HTML/CSS/JS. Herhangi bir statik dosya sunucusuyla çalıştırın (tarayıcıların `fetch()` güvenlik kısıtlaması nedeniyle `index.html`'i doğrudan `file://` ile açmak çalışmaz):

```bash
python3 -m http.server 8000
# tarayıcıda http://localhost:8000 adresini açın
```

## Proje Yapısı

- `index.html`, `css/`, `js/` — oyun motoru (durum makinesi, işaretçi/sürükleme girdisi, skorlama, i18n, sonuç ekranları)
- `data/scenes.json` — 5 sahnelik içerik (hedef geometri, tolerans, TR/EN açıklama metinleri)
- `data/strings.tr.json`, `data/strings.en.json` — arayüz metinleri (varsayılan TR, sağ üstten EN'e geçilebilir)
- `assets/scenes/`, `assets/objects/` — stilize SVG sahne ve nesne görselleri
- `docs/design/` — kurgu, oyun tasarımı ve araştırma dokümanları
- `.github/workflows/deploy-pages.yml` — push'ta GitHub Pages'e otomatik dağıtım

## GitHub Pages

Bu depo statik dosyalardan oluştuğu için GitHub Actions ile otomatik yayınlanacak şekilde ayarlanmıştır. Tek seferlik olarak reponun **Settings → Pages → Source** ayarını **"GitHub Actions"** olarak seçmeniz gerekir; bundan sonra bu branch'e her push, siteyi otomatik günceller.
