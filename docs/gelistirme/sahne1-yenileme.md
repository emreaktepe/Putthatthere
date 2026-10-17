# Sahne 1 (Metro Peronu) yenileme raporu

## Ne değişti
- `js/scene-builders.js` / `metroPlatform()` baştan yazıldı. Yeni yardımcılar: `wallPlane`, `put`, `still`, `bench`, `trashBin`, `wallBoard`.
- `js/materials.js`: yeni prosedürel dokular (granit zemin, duvar karosu, istasyon adı M2/TAKSİM, yön tabelası, hat haritası, ilan posteri) ve materyaller (granite, wallTile, paintYellow, m2Green, tunnel, tunnelVoid, signalRed/Green, railCover, panelLit, binGreen vb.). Mevcut materyallere dokunulmadı (diğer sahneler aynı).
- `data/scenes.json` yalnızca ilk sahnenin `camera` ve `placementSurfaces` alanı. Hedef (position/tolerance/explanation) aynı.
- `three-app`, scoring, input-raycast ve diğer 4 sahne değişmedi.

## Kapalı hacim
Peron x -6..3 (kenar x=3), raylar x 3..9.4, salon z -11..11 (30 m yerine 22 m), zemin y=0, tavan y=4.8. Her yönde duvar var: arka/uzak yan duvar, iki uç duvar, tavan. Uç duvarlarda ray üzerinde tünel ağzı (x 3.5..7.4, y -1.1..3.2) var; arkasında 5.3 m'lik koyu tünel kovuğu ve siyah kapak bulunuyor, dışarısı hiçbir açıdan görünmez. Sahnenin tüm geometri sınır kutusu x -6..9.4, z -16.3..16.3 (yalnızca tünel kovukları salonun dışında).

## Kamera sınırları ve hesap
Yeni kamera: pozisyon [-1.6, 2.9, 6.2], lookAt [1.4, 0.1, 0] (başlangıç mesafe 7.44, azimut -25.8°, polar 67.9°), minDistance 4, maxDistance 7.8, polar 60..86°, azimut ±30°.
Küresel koordinattan (OrbitControls ile aynı: x = r sinφ sinθ, z = r sinφ cosθ, y = d cosφ) mesafe x polar x azimut için 25^3'lük ızgarada tüm sınır kombinasyonları tarandı:

| Eksen | Kamera aralığı | Oda | Pay |
|---|---|---|---|
| x | -5.04 .. 1.97 | -6 .. 9.4 | 0.96 / 7.43 |
| y | 0.38 .. 4.00 | 0 .. 4.8 | 0.38 / 0.80 |
| z | 1.95 .. 7.78 | -11 .. 11 | 12.95 / 3.22 |

Kamera hiçbir kombinasyonda duvar/tavan/zemine girmiyor. Ayrıca sahnedeki mobilya ve yolcu sınır kutularına en yakın kamera mesafesi 0.79 m (sütun/bank/çöp kutusu konumları buna göre seçildi). Eski kameradaki sorun: maxDistance 14 + polar 86 + ±40° azimut kamerayı duvarın dışına taşıyordu.

## Gerçekçilik ve performans
- Granit peron zemini (1 m plakalar, koyu) + sarı kenar çizgisi; sahnede dokunsal şerit YOK, şerit sarı olduğu için koyu granitten net ayrışır.
- Hedef bölgesi (x 1.4..3.1, z ±6.5) boş; yolcular x <= -1, ve arka plana yakın. Düğüm testinde bu bölgede hiçbir nesne çıkmadı.
- Raylar, 50 adet instanced travers, üçüncü ray + sarı kapak bandı, kablo tavası, tünel ağızlarında çerçeve ve kırmızı sinyal, kaplamalı duvar, M2 yeşil şerit, 15 instanced emissive tavan paneli, kirişler, sütunlar, bankler, çöp kutusu, istasyon adı/yön tabelaları, hat haritası, ilan panoları, 5 yolcu.
- Işık: 1 hemisphere + 3 PointLight (7'den düştü) + 1 gölgeli directional. Tavan/duvar/ray gölge atmaz (directional dışarıdan geldiği için tavan gölgesi odayı karartmasın diye).
- Fog 20..50 (salon içinde etkisi çok az).
- Placement zemin düzlemi: merkez [-1.5, 0.001, 0], boyut [9, 22] -> x -6..3, kenarı aşmaz.

## Test
Yapılan:
- `node --check` js/scene-builders.js ve js/materials.js: geçti. scenes.json `JSON.parse`: geçti.
- Node ortamında (canvas/document taklidi ile) `metroPlatform()` hatasız çalıştırıldı: 102 mesh, 3 PointLight, sınır kutusu doğrulandı, hedef bölgesinde nesne yok, kamera-mobilya açıklığı hesaplandı.
- Kamera sınır hesabı yukarıdaki gibi sayısal.

Yapılamayan: tarayıcıda gerçek render ALINMADI (tarayıcı çalıştırılmadı). Bu yüzden parlaklık/ışık dengesi, doku görünümü, yazıların okunurluğu ve gölgeler gözle doğrulanmadı.

## Riskler
- Işık şiddetleri (hemisphere 1.1, point 14, directional 1.2) tahmine dayanıyor; ekran koyu/parlak çıkarsa bu üç değer ayarlanmalı.
- `tunnelVoid` önbellekli materyalde `side` DoubleSide yapılıyor; sadece bu sahnede kullanılıyor.
- Yeni dokular canvas ile oluşuyor (512-1024 px, 6 adet): sahne açılışında küçük bir ek yükleme maliyeti olabilir.
- maxDistance 7.8'e düştü; oyuncu eskisi kadar uzaklaşamaz (bilinçli: kapalı hacim için).
- Dokular rastgele gürültü içerir (mevcut dokularla aynı).
