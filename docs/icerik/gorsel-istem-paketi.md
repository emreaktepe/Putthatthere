# Görsel istem paketi (ChatGPT ile üretim)

Durum (24 Ekim 2026): P0 ve P1'in portre, büyü ve yetenek kısmı üretildi ve oyuna bağlandı (20 dosya). Eksik gruplar (perk, düşman, bölüm kapağı, düğüm, UI ikonları, 128 px sürümler) için hazır istemler §7'de; güncel eksik listesi ve durum kutuları `docs/icerik/eksik-gorsel-listesi.md` dosyasında, canlı envanter `npm run art` çıktısında. Karakter, büyü, düşman ve bölüm adları `data/game.config.json` ile `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` dosyalarından alındı.

## 1. Nasıl kullanılır

1. ChatGPT'de **yeni bir sohbet** aç. İlk mesaja aşağıdaki **Ortak stil tarifi**ni yapıştır ve "Bundan sonraki tüm görselleri bu tarzda üret. Yazı, logo, filigran ekleme." de.
2. Her görsel için **ayrı bir mesaj** gönder (aşağıdaki istemlerden biri). Beğenmediğini "aynı ama ..." diyerek düzelttir.
3. Aynı karakteri tekrar çizdirirken "önceki Aldemir görseliyle aynı kişi" de. Tarz ve yüz tutarlılığı garanti değildir, her karakter için en iyi sonucu seçip onu referans kabul et.
4. Dosyaları **PNG** olarak indir ve aşağıdaki adlarla `assets/art/` altına koy. Sonra bana söyle, boyutları küçültüp oyuna bağlarım.
5. Şeffaf arka plan istenen görsellerde ChatGPT şeffaf PNG vermezse "arka plan düz #ff00ff olsun" diye yeniden iste. Ben bu rengi şeffaflığa çevirmek için küçük bir betik yazarım.

Boyutlar: ChatGPT genelde 1024×1024 (kare), 1536×1024 (yatay) ve 1024×1536 (dikey) verir. İstemlerde belirtilen en-boy oranı bunlara yakın seçildi. Güncel seçenekleri arayüzde kontrol et.

Telif ve şartlar: ChatGPT çıktılarının ticari kullanımını OpenAI'ın güncel şartlarından kontrol et. Ben doğrulamadım.

## 2. Ortak stil tarifi (ilk mesaj)

```
Stylized dark-fantasy game art, painterly and semi-realistic, rich deep purple
(#0a0714 to #4b2a9c) and warm gold (#ffd36e, #ff9f1c) palette, moonlit night mood,
soft rim light, strong readable silhouettes, gentle glow on magical elements,
clean shapes that stay readable when scaled small. No text, no letters, no logo,
no watermark, no frame, no UI.
```

## 3. Öncelik sırası

### P0 — Deneme seti (5 görsel) — HAZIR, oyuna bağlı

Amaç: menü, harita ve diyalog ekranlarının yüzünü belirlemek ve tarzı denemek. Beğenmezsen tarzı değiştirip yeniden dene, geri kalanı üretme.

| Dosya | En-boy | Şeffaf? | Kullanım |
|---|---|---|---|
| `portre-aldemir.png` | 1:1 | evet | diyalog balonu, ödül kartı, menü |
| `portre-piril.png` | 1:1 | evet | diyalog, ödül |
| `portre-veyis.png` | 1:1 | evet | boss çubuğu, diyalog |
| `harita-arkaplan.png` | 3:2 yatay | hayır | harita ekranı |
| `menu-arkaplan.png` | 3:2 yatay | hayır | ana menü |

**portre-aldemir**
```
Bust portrait of Aldemir, a middle-aged bearded wizard with a tired, kind face
carrying quiet guilt. Deep indigo robe with visible cloth folds, short cape, bent
pointed hat with a gold band and a small gold star, gnarled staff with a glowing
violet crystal at the edge of the frame. Centered, shoulders up, transparent
background, square.
```

**portre-piril**
```
Pırıl: a small floating orb of warm golden-white light with a soft halo and a
trail of tiny sparkles. Faintly inside the light, the barely visible silhouette of
a little girl. Gentle, hopeful, a little sad. Centered, transparent background, square.
```

**portre-veyis**
```
Veyis, the Shadow King: a tall crowned silhouette made of dark crimson shadow
(#7a2038), a cracked crown, glowing red-pink cracks like shards of a broken
heart-stone running through the body. He looks sorrowful, not evil, like a
grieving father. Bust portrait, transparent background, square.
```

**harita-arkaplan**
```
Top-down illustrated fantasy map of "the Night Valley" at night, no text and no
labels. A winding dark path runs from the bottom-left to the top-right through
nine regions in this order: whispering forest, bat cave, ruined stone giants,
misty graveyard, frozen pass, burned village, crystal bed, bone tower, shadow
castle with a crimson sky. Keep calm empty space along the path so icons can be
placed on top. Landscape 3:2.
```

**menu-arkaplan**
```
Wide moonlit valley at night seen from a hill: a lone wizard silhouette with a
pointed hat and staff in the foreground, a huge gold crescent moon, distant
shadow castle with a faint crimson glow, floating sparks. Leave the upper-center
area calm and darker for a game title. Landscape 3:2.
```

### P1 — Karakter ve ikon seti — HAZIR (zerrin, taskin, 7 büyü ve 3 yetenek ikonu bağlı; yeteneklerin 128 px sürümleri de var)

| Dosya | Şeffaf? | Not |
|---|---|---|
| `portre-zerrin.png` | evet | baykuş mentor |
| `portre-taskin.png` | evet | taş bekçi |
| `ikon-buyu-<ad>.png` (7 adet) | evet | büyü çubuğu, ödül kartı |
| `ikon-yetenek-<ad>.png` (3 adet) | evet | Q/E/R slotları |

**portre-zerrin**
```
Zerrin: an old wise owl, a former archmage who turned herself into an owl to
guard the shards of the Night Heart. Tawny-silver feathers, golden eyes, a
slightly sarcastic expression, a tiny star-embroidered scarf, perched on a
branch. Bust, transparent background, square.
```

**portre-taskin**
```
Taşkın: a shy, mossy cracked stone golem freed from a curse, one gentle glowing
orange eye, faint orange rune lines, hunched and slightly awkward posture.
Bust, transparent background, square.
```

Büyü ikonları için ortak ek: "Single bold game icon, centered, readable at 64 px, thick shapes, transparent background, square, no text."

| Dosya | İstem (konu cümlesi) |
|---|---|
| `ikon-buyu-fire.png` | A blazing orange fireball with a flame tail |
| `ikon-buyu-frost.png` | An ice-blue crystal arrow with frost mist |
| `ikon-buyu-arcane.png` | Three violet arcane bolts fanning out |
| `ikon-buyu-lightning.png` | A yellow-white lightning bolt with a crackling halo |
| `ikon-buyu-poison.png` | A toxic green gas cloud in a glass flask |
| `ikon-buyu-meteor.png` | A burning meteor falling at an angle with sparks |
| `ikon-buyu-nova.png` | A pale-blue moonlight ring with a crescent in the center |
| `ikon-yetenek-shield.png` | A translucent blue magic shield bubble |
| `ikon-yetenek-blink.png` | A wizard silhouette dissolving into violet smoke trails |
| `ikon-yetenek-timeslow.png` | An hourglass with a crack and floating golden sand |

### P2 — Bölüm, düşman, perk görselleri — EKSİK (hazır istemler §7'de)

| Dosya | Adet | Kullanım |
|---|---|---|
| `bolum-<id>.png` | 9 | bölüm kartı ve giriş ekranı; yatay 3:2, şeffaf değil |
| `ikon-perk-<id>.png` | 11 | perk kartları |
| `dusman-<id>.png` | 10 | düşman ansiklopedisi ve boss çubuğu; şeffaf |

Bölüm kimlikleri ve temaları (renkler `data/game.config.json` tema değerleriyle uyumlu):

| id | Ad | Tema | Ana renk |
|---|---|---|---|
| forest | Fısıldayan Orman | gece ormanı, fısıltılı ağaçlar | mor `#1a1030` |
| cave | Yarasa Mağarası | mavi mağara, sarkıtlar | mavi `#14202e` |
| golems | Taş Bekçiler | kırık harabe, devasa taş heykeller | kehribar `#2a1c14` |
| graveyard | Hortlak Mezarlığı | sisli mezarlık, yeşil ruhlar | yeşil `#142a20` |
| pass | Donmuş Geçit | buzul geçidi, aurora | buz mavisi `#1a2a3a` |
| village | Yanık Köy | yanmış evler, kızıl ay | kızıl `#2e1810` |
| crystals | Kristal Yatağı | parlayan mor kristal mağarası | mor-mavi `#1b1838` |
| tower | Kemik Kule | kemiklerden örülmüş kule | gri-mor `#1a1a22` |
| castle | Gölge Kalesi | kızıl gökyüzü altında kale | koyu kırmızı `#2e1018` |

Bölüm istem şablonu: `Wide establishing shot of {ad}: {tema}, dominant color {ana renk}, moonlit, atmospheric depth, a small wizard silhouette for scale. Landscape 3:2.`

Düşman kimlikleri: ghost (Ruh), bat (Yarasa), golem (Taş Bekçi), archer (Kemik Okçu), wolf (Kurt Ruhu), ember (Kor Hortlak), priest (Karanlık Rahip), totem (Lanet Totemi), knight (Kemik Şövalye), boss (Gölge Kral). İstem şablonu: `Creature design: {ad}, {kısa tarif}. Full body, readable silhouette, transparent background, square.` Kısa tarifleri `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` §3'ten alabilirsin.

Perk kimlikleri: hp (Yaşam Özü), speed (Rüzgâr Ayakkabıları), power (Güç Tılsımı), haste (Hızlı Parmaklar), magnet (Mana Mıknatısı), vampire (Vampir Dokunuş), pierce (Delici Büyü), echo (Yankı), piril (Pırıl'ın Işığı), stone (Taş Deri), rain (Mana Yağmuru). Büyü ikonlarıyla aynı ek ve tarz kullanılır.

### P3 — Sonra (henüz üretilmedi; ayrıntı: `eksik-gorsel-listesi.md`)

- Paylaşım görseli (`og-image.png`, 1200×630) ve uygulama ikonunun (`icon-512.png`) yeniden çizimi: P0 tarzı oturunca. Şu anki kodla üretilmiş sürümler yedek olarak kalır.
- Dikişsiz (seamless) zemin dokuları (1024×1024): 3B zeminlerde kullanmak için. Bkz. 3B planı, §5.

## 4. Oyuna bağlama

Yapıldı: WebP yolu (`assets/art/*.webp`), yedekli yükleyici (dosya yoksa ya da yüklenemezse emoji/SVG), konfigürasyondaki `image`, `imageSmall`, `nodeImage`, `ui.icons` alanları, yönetim önizlemesi ve `npm run art` envanteri. Görsel eklerken kod gerekmez: dosyayı koyup config'e yolu yaz. Bütçe: tek görsel hedefi ~200 KB (`npm run art` aşanları uyarır). Toplam paket bütçesi (varsayım: 3 MB altı) ve gerçek telefon performansı hâlâ ölçülmedi.

## 5. 3B tasarımı mükemmelleştirme planı

Mevcut durum: karakter ve düşmanlar kodla üretilen basit geometri (`js/render/wizard.js`, `enemies.js`). Zemin dokuları canvas ile üretiliyor. Ağır post-işlem yok, harici model yok.

Etki sırasına göre seçenekler:

1. **Gerçek modeller (.glb):** En büyük kalite sıçraması. Yollar: (a) Kenney, Quaternius gibi CC0 paketlerden hazır karakter/ağaç/kaya modelleri (lisansı tek tek kontrol et); (b) Blender'da elle modelleme; (c) ChatGPT görselinden 3B üretim servisleri (Meshy, Tripo, Hunyuan3D gibi). Üretilen modeller genelde temizlik ve düşük poligona indirme gerektirir. Servislerin güncel fiyat ve şartlarını doğrulamadım. Mobil bütçe önerisi (varsayım): karakter başına ~5–10 bin üçgen, toplam sahne makul tutulur. Teknik iş: three r185 ile uyumlu `GLTFLoader` eklemek (şimdi `vendor/addons` yok), sıkıştırma (meshopt) kararı, eksik dosyada mevcut kodla üretilen modele düşme.
2. **İskelet animasyonu:** Yürüme, saldırı, ölüm için. İnsansı karakterlerde Mixamo gibi servisler otomatik iskelet ve hazır animasyon verir (Adobe hesabı gerekir, şartlarını doğrulamadım). Düşmanlar için kodla yapılan sallanma yeterli kalabilir.
3. **Malzeme ve doku:** CC0 PBR doku kütüphaneleri (ambientCG, Poly Haven) veya ChatGPT ile dikişsiz doku; normal harita. Üretilen zemin dokularını bu şekilde zenginleştirmek en ucuz iyileştirmedir.
4. **Işık ve atmosfer:** Ortam haritası (HDRI) ile yansımalar, gölge kalitesi, volumetrik his veren sprite'lar, isteğe bağlı bloom (EffectComposer addon'ları eklenmeli). Bunlar mobilde pahalı; kalite seviyeleri (düşük/orta/yüksek) ve cihaza göre otomatik seçim gerekir.
5. **Performans ve kalite ayarı:** Bütçe testi (kare hızı, draw call, bellek), "Grafik kalitesi" ayarı. Gerçek telefonlarda ölçüm olmadan modelleri artırmak risklidir.
6. **Oyuncu testi:** Hiçbir görsel iyileştirme gerçek cihazda denenmedi. Her adımdan sonra telefonda kare hızı ve netlik kontrol edilmeli.

Önerilen yol: **Tek karakterle pilot.** Aldemir'i .glb olarak yap (elle, hazır paket ya da AI üretimi + temizlik), yükleyici ve yedek düşüş mantığını kur, telefonda ölç. Sonuç iyiyse düşmanlara ve dekora yay. Başlamadan önce Emre'nin seçmesi gerekenler: model kaynağı (hazır paket / AI üretim / elle), bütçe, hedef cihaz sınırı (kaç yıllık telefon).

## 6. Açık sorular (Emre'ye)

1. Önce P0 deneme setini mi üretiyorsun? Tarz beğenilmezse stil tarifini birlikte düzeltelim.
2. Görseller yalnızca 2B arayüzde mi kullanılacak (portre, ikon, harita, menü), yoksa 3B için model/doku da mı üretilecek?
3. 3B pilot için hangi model kaynağı (hazır paket, AI üretim, elle)?
4. Hedef cihaz: en eski hangi telefonda akıcı çalışmalı?

## 7. Eksik gruplar için hazır istemler (ChatGPT)

Hepsi §2'deki **Ortak stil tarifi** yazılmış bir sohbette kullanılmak üzere hazırlandı (İngilizce istem, Türkçe açıklama). Şeffaf arka plan için §1'deki notu uygula. Güncel eksik listesi ve durum kutuları: `docs/icerik/eksik-gorsel-listesi.md`.

### 7.1 Düşman ikonları (10) — `dusman-<id>.png`

Ortak ek: `Single creature icon, bust or full body, centered, strong readable silhouette, glowing eyes or core as focal point, transparent background, square, no text.` Küçük boyutta (22-38 px) okunması için yüz ve silüet büyük olmalı.

| Dosya | İstem (tek cümle tasarım) | Açıklama |
|---|---|---|
| `dusman-ghost.png` | A pale blue translucent ghost with a trailing wispy tail and hollow glowing eyes | Ruh |
| `dusman-bat.png` | A purple cave bat with wings spread wide and small red eyes | Yarasa |
| `dusman-golem.png` | A hulking mossy stone guardian with a cracked chest and glowing amber runes | Taş Bekçi (portre-taskin tarzıyla uyumlu ama daha tehditkâr) |
| `dusman-archer.png` | A skeleton archer in a tattered hood drawing a bone bow with a green-glowing arrow | Kemik Okçu |
| `dusman-wolf.png` | A spectral wolf made of pale blue mist with bright eyes, mid-lunge | Kurt Ruhu |
| `dusman-ember.png` | A burnt wraith with a glowing orange ember core and trailing smoke and sparks | Kor Hortlak |
| `dusman-priest.png` | A hooded dark priest with a crimson sigil, holding a skull-topped staff | Karanlık Rahip |
| `dusman-totem.png` | A tall carved wooden curse totem with glowing violet eyes and hanging bones | Lanet Totemi |
| `dusman-knight.png` | A heavy skeleton knight in dented dark armor with a cracked shield and a red glow in the visor | Kemik Şövalye |
| `dusman-boss.png` | The Shadow King, a tall crowned silhouette of dark crimson shadow with glowing red-pink cracks, sorrowful not evil | Gölge Kral (portre-veyis ile aynı karakter; "same character as the previous Veyis portrait" de) |

### 7.2 Perk ikonları (11) — `ikon-perk-<id>.png`

Ortak ek: `Single bold game icon, centered, readable at 64 px, thick shapes, soft glow, transparent background, square, no text.`

| Dosya | İstem (konu cümlesi) | Perk |
|---|---|---|
| `ikon-perk-hp.png` | A glowing crimson heart crystal with a small gold plus-shaped sparkle | Yaşam Özü |
| `ikon-perk-speed.png` | A pair of winged leather boots with a wind trail | Rüzgâr Ayakkabıları |
| `ikon-perk-power.png` | A gold talisman medallion with a fiery orange rune | Güç Tılsımı |
| `ikon-perk-haste.png` | Nimble glowing fingers casting sparks, with a small blur trail | Hızlı Parmaklar |
| `ikon-perk-magnet.png` | A horseshoe magnet with blue energy pulling in small sparkles | Mana Mıknatısı |
| `ikon-perk-vampire.png` | Two bat-fang drops of blood above a small dark heart | Vampir Dokunuş |
| `ikon-perk-pierce.png` | An arcane arrow piercing through two glowing rings | Delici Büyü |
| `ikon-perk-echo.png` | A glowing violet orb with two fading echo copies behind it | Yankı |
| `ikon-perk-piril.png` | A warm golden-white light orb with a tiny star trail pointing the way | Pırıl'ın Işığı |
| `ikon-perk-stone.png` | A cracked grey stone shield with moss and a faint amber glow | Taş Deri |
| `ikon-perk-rain.png` | Blue mana crystals falling like rain from a small dark cloud | Mana Yağmuru |

### 7.3 Bölüm kapakları (9) — `bolum-<id>.png`

Yatay 3:2, opak, yazı yok. Her biri §3'teki şablonun doldurulmuş halidir. Menü ve harita görselleriyle aynı sohbette üret.

| Dosya | İstem |
|---|---|
| `bolum-forest.png` | Wide establishing shot of the Whispering Forest: a moonlit night forest with twisted whispering trees and drifting spores, dominant color deep purple #1a1030, atmospheric depth, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-cave.png` | Wide establishing shot of the Bat Cave: a blue crystal-lit cave with stalactites and swarming bats, dominant color blue #14202e, moonlight through a cave mouth, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-golems.png` | Wide establishing shot of the Stone Guardians ruins: broken ancient ruins with huge dormant stone statues, dominant color amber-brown #2a1c14, moonlit dust, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-graveyard.png` | Wide establishing shot of the Haunted Graveyard: a misty graveyard with leaning tombstones and green wisps of spirits, dominant color green #142a20, moonlit fog, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-pass.png` | Wide establishing shot of the Frozen Pass: a glacier mountain pass under a faint aurora, dominant color ice blue #1a2a3a, drifting snow, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-village.png` | Wide establishing shot of the Burnt Village: charred ruined houses with embers and a red moon, dominant color red-brown #2e1810, smoke in the air, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-crystals.png` | Wide establishing shot of the Crystal Bed: a cavern full of glowing purple-blue crystals reflecting light, dominant color violet #1b1838, floating sparks, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-tower.png` | Wide establishing shot of the Bone Tower: a tall tower built from bones and skulls on a rocky cliff, dominant color grey-purple #1a1a22, cold moonlight, a small wizard silhouette for scale. Landscape 3:2. |
| `bolum-castle.png` | Wide establishing shot of the Shadow Castle: a looming dark castle under a crimson sky with a faint broken-heart glow, dominant color dark red #2e1018, storm clouds, a small wizard silhouette for scale. Landscape 3:2. |

### 7.4 Harita düğüm madalyonları (9) — `dugum-<id>.png`

Kare; daire içine kırpılacağı için konu merkezde olmalı, kenarlarda boşluk bırak. Ortak ek: `Round medallion emblem, subject centered inside a circular gold-rimmed frame, readable at 64 px, square, no text.` Şeffaf arka plan gerekmez; daire dışı kırpılır.

| Dosya | İstem (konu cümlesi) |
|---|---|
| `dugum-forest.png` | A twisted moonlit tree with whispering spores, purple tones |
| `dugum-cave.png` | A cave mouth with a bat silhouette and blue crystal glow |
| `dugum-golems.png` | A mossy stone guardian head with one amber glowing eye |
| `dugum-graveyard.png` | A leaning tombstone with a green wisp rising from it |
| `dugum-pass.png` | A frozen mountain peak with a faint aurora |
| `dugum-village.png` | A burning hut silhouette under a red moon |
| `dugum-crystals.png` | A cluster of glowing purple-blue crystals |
| `dugum-tower.png` | A tall bone tower with a skull at the top |
| `dugum-castle.png` | A dark castle with a crimson glow and a cracked crown above |

### 7.5 Arayüz ikon seti (14) — `ui-<ad>.png`

Önce setin tarzını belirle ve hepsini tek sohbette üret. Ortak ek: `Single flat-ish game UI icon, gold-and-violet palette with a soft glow, thick clean shapes, identical line weight and lighting across the set, centered, readable at 24 px, transparent background, square, no text.` Kalp çiftinde ikinci görsel "aynı çerçevede, aynı boyutta" olmalı.

| Dosya | İstem (konu cümlesi) |
|---|---|
| `ui-sure.png` | A golden hourglass with glowing violet sand |
| `ui-kristal.png` | A single cyan mana crystal with a bright facet |
| `ui-puan.png` | A five-point gold star with a soft glow |
| `ui-hedef.png` | A gold target ring with a glowing violet center |
| `ui-kilit.png` | A gold padlock, closed, with a violet keyhole glow |
| `ui-onay.png` | A bold glowing green check mark with a gold edge |
| `ui-kalp-dolu.png` | A glossy crimson heart with a gold rim and soft glow |
| `ui-kalp-bos.png` | The same heart shape and gold rim as the full heart, but empty and dark grey-violet, no glow |
| `ui-kalkan.png` | A blue magic shield with a gold rim |
| `ui-ses-acik.png` | A gold speaker with three glowing sound waves |
| `ui-ses-kapali.png` | The same gold speaker with a diagonal slash and no waves, dimmer |
| `ui-kamera.png` | A gold camera with a violet lens glow |
| `ui-ates.png` | A glowing violet magic sparkle burst, big and simple, for a round fire button |
| `ui-yonetim.png` | A gold gear with a small star in its center |

### 7.6 128 px sürümler nasıl üretilir

ChatGPT'den görseli "128 piksele küçült" diye istemek güvenilir değil: çıktı boyutları sabit seçeneklerle gelir ve küçültmeyi kullanıcının bir araçla yapması gerekir (ChatGPT'nin bunu yapıp yapamayacağını doğrulamadım). Önerilen yol:

1. ChatGPT'den normal boyutta (1024) PNG al. **Orijinal PNG'yi yerelde sakla** (`assets/art/` içinde kaynak olarak kalabilir; yalnızca `.webp` yayınlanır).
2. 512 px WebP'yi ve 128 px sürümünü ayrı ayrı üret. Örnek komutlar (**araçları ve bayrakları doğrulamadım**; kurulu sürüme göre `cwebp -longhelp` ile kontrol et):
   - `cwebp -q 85 -resize 512 512 ikon.png -o ikon-perk-hp.webp`
   - `cwebp -q 85 -resize 128 128 ikon.png -o ikon-perk-hp-128.webp`
   - Araç kurmak istemezsen squoosh.app: dosyayı yükle, WebP seç, boyutu 128 ya da 512 yap, kaliteyi ~85 tut, indir. Şeffaflığın korunduğunu kontrol et.
3. Adlandırma: büyük `ikon-<grup>-<id>.webp`, küçük `ikon-<grup>-<id>-128.webp`. 7 büyü ikonunun `-128` sürümleri üretilince `weapons.<id>.imageSmall` alanına yazılır.
4. `npm run art` ile kontrol et; küçük sürüm ~8 KB, büyük sürüm ~120 KB civarında olmalı.
