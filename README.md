## English summary

*Put That There* is a browser-based "genius test" puzzle inspired by Richard Bolt's 1980 MIT Media Lab "Put-That-There" demo. In each real-scale 3D scene (a metro platform, a parking lot, a sidewalk corner, a crosswalk and a building corridor), one real-world object or marking is missing, and you pick it ("that") and place it in the right spot ("there"). Placement error is measured in real-world units (e.g. "Offset: 38 cm"), and you earn stars and points based on position and rotation accuracy, following real accessibility, traffic and fire-safety rules. There is no build step: it is plain static HTML/CSS/JS, so serve the folder with any static file server, e.g. `python3 -m http.server 8000`, and open http://localhost:8000 (opening `index.html` via `file://` will not work). The interface defaults to Turkish and can be switched to English from the top-right corner. Play it live at **https://emreaktepe.github.io/Putthatthere/**.

# Şunu Şuraya Koy (Put That There)

MIT Media Lab'ın 1980 tarihli ["Put-That-There"](https://en.wikipedia.org/wiki/Put-That-There) demosundan (Richard Bolt) ilham alan, tarayıcı tabanlı bir "dahi testi" bulmacası. Oyuncu **3B** ve gerçek ölçekli bir sahnede (metro peronu, otopark, kaldırım köşesi, yaya geçidi, bina koridoru) eksik olan tek bir gerçek dünya nesnesini/işaretini bulur, seçer ("that") ve doğru noktaya yerleştirir ("there"); konum ve gerekiyorsa döndürme doğruluğuna göre yıldız ve puan alır. Sahnede sürükleyerek etrafına bakabilir, tekerlekle yakınlaşabilir.

Yerleştirme hatası gerçek dünya birimiyle ölçülür: "Sapma: 38 cm". Koridor sahnesinde hem duvar hem zemin yerleştirilebilir olduğu için yangın söndürücüyü yanlış yüzeye koymak da mümkündür — tıpkı gerçekte olduğu gibi.

Sahne içerikleri, gerçek dünyadaki erişilebilirlik/trafik/yangın güvenliği kurallarına (toplu taşıma dokunsal uyarı şeridi, MUTCD tarzı dur çizgisi, NFPA 10 tarzı yangın söndürücü montaj yüksekliği, ADA/PROWAG tarzı kaldırım rampası ve engelli park alanı yerleşimi) dayanır — bkz. `docs/design/research.md`.

## Çalıştırma

Build aracı veya framework yok — saf statik HTML/CSS/JS. Herhangi bir statik dosya sunucusuyla çalıştırın (tarayıcıların `fetch()` güvenlik kısıtlaması nedeniyle `index.html`'i doğrudan `file://` ile açmak çalışmaz):

```bash
python3 -m http.server 8000
# tarayıcıda http://localhost:8000 adresini açın
```

## Proje Yapısı

- `index.html`, `css/`, `js/` — oyun motoru:
  - `three-app.js` (renderer, kamera, ışık/gölge, raycast, hayalet önizleme)
  - `scene-builders.js` (5 ortamın ve 5 nesnenin prosedürel geometrisi, metre cinsinden)
  - `materials.js` (prosedürel dokular: asfalt, beton, döşeme, dokunsal şerit, engelli sembolü)
  - `input-raycast.js` (deiktik durum makinesi), `scoring.js`, `ui-results.js`, `i18n.js`, `tray-preview.js`
- `data/scenes.json` — 5 sahnelik içerik (hedef konum/tolerans metre cinsinden, kamera kadrajı, yerleştirme yüzeyleri, TR/EN açıklamalar)
- `data/strings.tr.json`, `data/strings.en.json` — arayüz metinleri (varsayılan TR, sağ üstten EN'e geçilebilir)
- `vendor/` — Three.js r185 (MIT, yerel kopya; CDN bağımlılığı yok)
- `demo/index.html` — bağımsız küçük Three.js demo oyunu (Büyücünün Gecesi); sunucu açıkken `/demo/` adresinden oynanır
- `docs/design/` — kurgu, oyun tasarımı ve araştırma dokümanları
- `.github/workflows/deploy-pages.yml` — push'ta GitHub Pages'e otomatik dağıtım

## GitHub Pages

Site GitHub Actions ile otomatik yayınlanır: **https://emreaktepe.github.io/Putthatthere/**

`main`'e yapılan her push `deploy-pages.yml` iş akışını tetikler ve siteyi günceller. `github-pages` ortamı varsayılan olarak yalnızca `main` branch'inden dağıtıma izin verdiği için, feature branch'ten yayınlamak isterseniz **Settings → Environments → github-pages → Deployment branches** listesine o branch'i eklemeniz gerekir.
