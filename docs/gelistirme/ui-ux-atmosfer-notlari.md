# UI/UX ve atmosfer paketi — geliştirme notları

Kapsam: HUD, silah/yetenek çubuğu, kart tabanlı bölüm sonu, menü + giriş, harita, kamera açıları, gökyüzü/ufuk, genel görsel dil.

## Yeni/değişen modüller
- `js/ui/` hud.js (yeniden yazıldı), screens.js (ekran yönlendirici + scope temizliği), menu.js, map.js, result.js, models.js (saf görünüm modelleri), icons.js (satır içi SVG), text.js (kısa arayüz etiketleri)
- `js/game/campaign.js` (kayıt oturumu, alıştırma), `js/game/cameramath.js` (saf kamera matematiği), `js/game/progress.js` (+buildMapGraph, mapPoints)
- `js/render/camera.js` (kamera donanımı), `scene.js`/`themes.js`/`scenery.js` (gökyüzü, aurora, bulut, ufuk siluet, ay)
- `css/game.css` baştan yazıldı (belirteçler :root'ta)

## Mimariyle ilişki / sapmalar
- Config şeması, `schemaVersion`, oynanış sayıları, ses DEĞİŞMEDİ. Kamera/harita etiketleri config yerine `js/ui/text.js`'te (ileride `strings.ui` altına taşınabilir); düşman/perk simgeleri ve nadirlik UI tarafında türetilir (`models.js`), config'e alan eklenmedi.
- Mimari §11'deki ayrı `ui/router.js`, `ui/intro.js`, `tokens.css`/`map.css` dosyaları yerine: yönlendirici `screens.js`, giriş `menu.js` içinde, tek `game.css`.
- Nadirlik: perk `maxStacks` değerinden türetilir (1 destansı, 2 nadir, diğer yaygın).
- Alıştırma kayıtları: gerçek koşu `camp.practice.real`'de tutulur, kayıt hep ondan yazılır.
