# Sahne 1 (metroPlatform) bağımsız statik doğrulama

Kapsam: kod okuma + sayısal hesap + Node'da sahne kurulumu (canvas taklidiyle). Tarayıcıda görsel/render testi YAPILAMADI (tarayıcı çalıştırılmadı); parlaklık, doku okunurluğu, yazı netliği, gölge gözle doğrulanmadı.

## Bulunan gerçek hata ve düzeltme (kod değişti)
1. **Yeni materyaller tanımsızdı.** `js/materials.js` içinde doku fonksiyonları (granit, duvar karosu, istasyon adı, yön tabelası, hat haritası, ilan) vardı ama `TEXTURE_FACTORIES` kaydı ve `material()` içindeki `case`'ler yoktu. `scene-builders.js`'in kullandığı 12 ad (granite, wallTile, paintYellow, m2Green, tunnel, tunnelVoid, signalRed, railCover, panelLit, binGreen, stationName, directionSign) `default` gri materyale düşüyordu (zemin, duvar, tavan paneli, tabelalar düz gri; tünel kapağı gri; paneller yanmıyor). Ayrıca `texture("lineMap")` / `"adPoster"` çağrıları `undefined()` ile patlardı. Yenileme raporu bunları eklenmiş gösteriyordu; çalışma ağacında yoktu. Eklendi: 6 doku kaydı + 14 materyal (signalGreen dahil).
2. **Doku en-boy hatası.** `stationName` ve `directionSign` dokuları 1024x1024 kare tuvale 1024x256 çiziyordu; 2.4x0.6 m düzleme gerilince yazı dikeyde sıkışır, kalan 3/4'lük boş alan görünürdü. `canvas2d(size, height = size)` yapıldı, bu ikisi `canvas2d(1024, 256)` kullanıyor (diğer çağrılar etkilenmez).
Sonuç: Node'da `metroPlatform()` kuruldu: 102 mesh, varsayılan gri düşen materyal 0, sınır kutusu x -6..9.4, y -1.6..4.8, z -16.3..16.3.

## (1) Sözdizimi
`node --check` js/*.js (9 dosya): hepsi geçti (düzeltmeden sonra da). `data/scenes.json` JSON.parse: geçti.

## (2) Hedef ve yerleştirme düzlemi
Hedef [2.25, 0.001, 0], tolerans 0.55 m -> x 1.70..2.80. Zemin düzlemi merkez [-1.5, 0.001, 0], boyut 9x22 -> x -6..3, z -11..11. Hedef diski düzlemin içinde; peron kenarına (x=3) 0.20 m pay var, düzlem kenarı aşmıyor (oyuncu kenara/raya yerleştiremez). 0.55 m tolerans ve 10 derece makul (ürün şeridi ~1 m ölçeğinde; kenar payı toleransı aşmıyor).

## (3) Kamera hacmi (yeniden hesaplandı)
Başlangıç [-1.6, 2.9, 6.2], hedef [1.4, 0.1, 0]: mesafe 7.44 (4..7.8 içinde), polar 67.9 (60..86 içinde), azimut -25.8. Küresel koordinatla mesafe x polar x azimut (±30) ızgarası (61^3) tarandı: kamera x -5.04..1.97, y 0.38..4.00, z 1.95..7.78. Oda x -6..9.4, y 0..4.8, z -11..11 -> tüm eksenlerde içeride (en dar pay: x arka duvara 0.96 m, y zemine 0.38 m, tavana 0.80 m). near=0.1 duvara kesme yapmaz. Not: kamera-mobilya açıklığını (0.79 m iddiası) ayrıca yeniden hesaplamadım.

## (4) Başlangıç bakışında hedef kadrajı (FOV 48 dikey)
Hedef merkezi NDC (x,y): 16:9 -> (0.12, 0.01); 4:3 -> (0.16, 0.01); **9:16 portre -> (0.39, 0.01)**. Tolerans diskinin uçları portrede x 0.14..0.63 -> tamamen kadrajda (sınır |1|). Yörünge uç noktalarında (azimut ±30, mesafe 4/7.8, polar 60/86) hedef merkezi 16:9'da en çok 0.27, portrede en çok 0.86 NDC (yakın mesafe + azimut +30): portrede görünür kalıyor ama kenara yaklaşıyor. Not: yalnızca hedef noktası/disk hesaplandı; şeridin tüm uzunluğu (z ekseni) portrede kırpılabilir, bakılmadı.

## (5) Diğer sahneler
`git diff main`: `scene-builders.js` değişiklikleri yalnızca yeni yardımcılar (sat. ~109-160) ve `metroPlatform()` (son hunk sat. ~305'te biter; parkingLot sat. 309'dan başlar). `scenes.json`'da yalnızca ilk sahnenin camera ve placementSurfaces alanı. `materials.js`'te silinen satır yok; mevcut materyaller aynı (tek dokunuş: `canvas2d`'ye isteğe bağlı `height` parametresi, varsayılan eski davranış). Diğer 4 sahnenin kodu değişmedi. (Not: `git diff main --stat` docs/strateji, docs/mimari dosyalarını da gösteriyor; bunlar dal ile main arasındaki ayrımdan, bu işle ilgisiz.)

## (6) Dispose / paylaşım
`disposeTree` yalnızca `userData.disposable` bayraklı materyalleri siler; `material()` önbellekli paylaşılanlar bayraksız -> silinmez, sorun yok. Yeni kodda klon/bayrak yok. Geometriler (`nameGeo`, `colGeo`, `baseGeo`) birden çok mesh ile paylaşılıyor; tekrar `dispose()` zararsız ve ortam her yüklemede yeniden kurulduğundan yeniden kullanım yok. InstancedMesh (travers, panel) `isMesh` olduğundan geometrileri temizleniyor. `tunnelVoid` önbellekli materyalde `side = DoubleSide` her kurulumda atanıyor; yalnızca bu sahne kullanıyor, kaçak yok (istenirse `materials.js`'e taşınabilir; şu an MeshBasicMaterial siyah, ışıktan etkilenmez).

## Yapılamayanlar
Tarayıcı render/ekran görüntüsü, ışık dengesi, doku okunurluğu, performans (FPS) ölçümü, mobil gerçek cihaz testi. Commit yapılmadı.
