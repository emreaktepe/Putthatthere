# "Put That There" — Sahne Araştırması / Scene Research

Bu belge, oyundaki 5 sahnenin her biri için eksik nesnenin gerçek dünyadaki yerleşim kuralını,
kısa Türkçe ve İngilizce açıklamalarla ve sahnenin içermesi gereken görsel öğelerle özetler.

> **Not:** Bu araştırma 2B SVG prototipi için yapıldı; sahneler o zamandan beri Three.js ile
> gerçek ölçekli (metre) 3B ortamlara taşındı. Aşağıdaki yerleşim kuralları ve kaynak
> dayanakları aynen geçerlidir — yalnızca "SVG arka planı" notlarını, 3B ortamın içermesi
> gereken öğelerin listesi olarak okuyun (`js/scene-builders.js`). Kurallar; toplu taşıma erişilebilirlik rehberleri, trafik mühendisliği standartları
(MUTCD tarzı), NFPA 10 yangın söndürücü rehberi ve ADA/PROWAG erişilebilirlik rehberlerine
dayanan **genel, yaygın kabul görmüş** kurallardır. Prototip amaçlı olduğu için birebir yasal
madde numaraları yerine, doğru ve iyi kaynaklı genel kural anlatımı kullanılmıştır.

---

## 1. Metro Peronu — Peron Kenarı Güvenlik / Dokunsal Uyarı Şeridi

**Eksik nesne:** Peron kenarı boyunca uzanan, kabartmalı (tactile) dokunsal uyarı şeridi
(genelde sarı, yuvarlak kabartma desenli).

**Kural (TR):** Dokunsal uyarı şeridi, peron kenarının hemen bitişiğinde değil, kenardan
belirli bir güvenlik payı bırakılarak (raylı sistemlerde tipik olarak 500-700 mm geride)
peron boyunca kesintisiz şekilde döşenir. Bu mesafe, görme engelli bir yolcunun bastonuyla
şeridi fark edip durabilmesi, ayrıca herkesin ani bir tren gelişinde kenara çok yakın
durmaması için güvenlik tamponu sağlar. Şerit, peronun tüm kenarı boyunca (yolcu bekleme
alanı boyunca) devam etmelidir, sadece bir noktada değil.

**Placement rule (EN):** The tactile/detectable warning strip runs continuously along the
platform edge, set back a fixed safety distance from the actual edge (transit guidance
commonly cites roughly 500-700 mm / ~20-28 in for rail platforms — larger than the ~300 mm
used for generic hazard warnings) so pedestrians feel it underfoot before reaching the drop-off
and keep a safe standing distance from an arriving train.

**SVG background should contain:** peron kenarı ve ray hattı, birkaç bekleyen yolcu silueti,
bilgi/yön tabelaları, zemin dokusu (beton peron), tünel ağzı arka planda.

**Source basis:** Transit accessibility / tactile paving guidance (UK/AU/international transit
tactile paving standards summarized via pedbikeinfo.org TWSI review and tactile paving
guidance docs) — general, widely-cited setback convention for rail platform edges.

---

## 2. Cadde Geçidi (Yaya Geçidi) — Dur Çizgisi (Stop Line)

**Eksik nesne:** Yaya geçidinden önce, araçların durması gereken enine "dur çizgisi" (stop line / stop bar).

**Kural (TR):** Dur çizgisi, yaya geçidinin hemen üzerine değil, geçidin en yakın kenarından
belirli bir mesafe önce (trafik mühendisliği pratiğinde tipik olarak en az ~1,2 m / 4 fit önce,
kavşak tipine göre daha da geride) ve geçide paralel olarak çizilir. Bu boşluk, duran bir
aracın yaya geçidini veya yayaların görüş hattını kapatmamasını sağlar; sürücünün geçitteki
yayaları görebilmesi ve yayaların araç görüş açısını engellememesi için bırakılır.

**Placement rule (EN):** The stop line is painted as a solid line across the approach lane,
parallel to and set back from the crosswalk — general traffic-engineering practice (MUTCD-style)
places it at least ~4 ft (1.2 m) before the nearest crosswalk edge — so a stopped vehicle does
not encroach on the crosswalk and drivers keep sight-lines to pedestrians.

**SVG background should contain:** zebra/yaya geçidi çizgileri, kaldırım kenarları, trafik ışığı
direği, birkaç park/geçen araç silueti, yol asfalt dokusu.

**Source basis:** MUTCD-style traffic engineering practice (stop line/stop bar placement
guidance summarized from ITE toolkit and MUTCD-referencing sources) — general convention, not a
specific national law citation.

---

## 3. Bina Koridoru — Yangın Söndürücü (Duvara Monte)

**Eksik nesne:** Duvara asılı taşınabilir yangın söndürme tüpü (yangın dolabı/kabin veya braket üzerinde).

**Kural (TR):** Yangın söndürücü, koridorda kolay görülebilir ve erişilebilir bir noktaya —
genellikle çıkışa yakın veya belirgin bir tehlike kaynağının yanına — duvara dikey olarak monte
edilir. Ağırlığı ~18 kg (40 lb) veya altında olan söndürücülerde tüpün **üst noktası** yerden en
fazla ~1,5 m (5 fit) yükseklikte olmalı, alt kısmı ise yerden en az birkaç santim yukarıda
asılmalıdır; böylece hem güçlü hem kısa boylu kullanıcılar tarafından kolayca kavranabilir.

**Placement rule (EN):** The extinguisher hangs vertically on the wall (bracket-mounted), placed
along an egress path near an exit or hazard area, at a standardized height range — general
guidance (NFPA 10-style) puts the top of a extinguisher ≤40 lb no higher than about 5 ft (1.5 m)
above the floor, with the bottom kept a few inches off the floor — so it stays quickly visible
and reachable in an emergency.

**SVG background should contain:** düz koridor duvarları, tavan aydınlatması, çıkış tabelası
(yönlendirme oku), kapılar, zemin dokusu; söndürücü braketi duvarda dikey konumda hedef.

**Source basis:** NFPA 10-style general fire-extinguisher mounting-height guidance (summarized
from multiple fire-safety compliance explainer sources) — general convention, not a specific
jurisdiction's fire code citation. `rotationDeg` marked wall-mount / vertical in scenes.json.

---

## 4. Kaldırım Köşesi — Rampa (Kaldırım İnişi / Curb Ramp)

**Eksik nesne:** Kaldırım köşesindeki eğimli rampa (dropped curb / curb ramp), genelde
kabartmalı uyarı yüzeyiyle (truncated domes) birlikte.

**Kural (TR):** Kaldırım rampası, yaya geçidinin tam karşısına, kaldırımın yola indiği noktaya
yerleştirilir — yani rampa her zaman bir yaya geçidiyle hizalı olmalıdır, rastgele bir köşede
değil. Her yaya geçişi için kaldırımın iki ucunda da (ya da köşeyi tek bir eğimli geçişle
kapsayan "blended transition" ile) bir rampa bulunur; böylece tekerlekli sandalye, bebek arabası
veya bastonla hareket eden biri kaldırımdan yola sorunsuz geçebilir.

**Placement rule (EN):** A curb ramp (or blended transition) is placed at the point where the
sidewalk meets the roadway directly in line with a marked or logical pedestrian crossing point —
general accessibility guidance (ADA/PROWAG-style) requires a ramp aligned with each crosswalk
at a corner (or a single blended transition serving the whole corner), so the pedestrian path
stays continuous and usable by wheelchair/stroller users.

**SVG background should contain:** kaldırım köşesi, yol kenarı/bordür taşı, karşıdaki yaya
geçidi çizgileri, birkaç ağaç/direk, kaldırım döşeme dokusu.

**Source basis:** ADA/PROWAG-style curb ramp placement guidance (U.S. Access Board PROWAG
summary) — general, widely-cited accessibility convention.

---

## 5. Otopark — Engelli Park Yeri İşareti / Erişim Şeridi

**Eksik nesne:** Zemine boyalı engelli (tekerlekli sandalye) sembolü ve/veya çizgili erişim
şeridi (access aisle) olan engelli park yeri işaretlemesi.

**Kural (TR):** Engelli park sembolü, park yerinin ortasına, zeminde net görülecek şekilde
boyanır ve yanında araç kapısının tam açılıp tekerlekli sandalyenin inip binebilmesi için
ayrılmış, çapraz çizgilerle taralı bir "erişim şeridi" (access aisle) bulunur; bu şerit park
yerine bitişik ve onunla aynı uzunluktadır. Ayrıca dikey bir tabela (genelde tekerlekli
sandalye sembolü, yerden en az ~1,5 m yükseklikte) park yerinin önüne konur.

**Placement rule (EN):** The accessibility symbol is painted centered in the parking stall, with
a striped/hatched access aisle running the full length of the space immediately adjacent to it
(access aisles must be at least 60 in / 1525 mm wide per ADA-style guidance) to give room for a
wheelchair lift or door swing, plus a vertical sign with the International Symbol of
Accessibility mounted at ~60 in minimum above grade.

**SVG background should contain:** otopark zemin çizgileri (birkaç normal park yeri), asfalt
dokusu, birkaç park halinde araç silueti, dikey engelli park tabelası direği (boş bırakılan hedef
yanında).

**Source basis:** ADA-style accessible parking space guidance (U.S. Access Board Chapter 5
Parking Spaces summary) — general, widely-cited convention.
