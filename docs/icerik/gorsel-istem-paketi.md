# Görsel istem paketi (ChatGPT ile üretim)

Durum: ÖNERİ. Hiçbir görsel üretilmedi, oyuna bağlanmadı. Bu belge, Emre'nin görselleri ChatGPT arayüzünde üretip `assets/art/` klasörüne koyması için hazırlandı. Karakter, büyü, düşman ve bölüm adları `data/game.config.json` ile `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` dosyalarından alındı.

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

### P0 — Deneme seti (önce bunlar, 5 görsel)

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

### P1 — Karakter ve ikon seti

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

### P2 — Bölüm ve düşman görselleri

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

### P3 — Sonra

- Paylaşım görseli (`og-image.png`, 1200×630) ve uygulama ikonunun (`icon-512.png`) yeniden çizimi: P0 tarzı oturunca. Şu anki kodla üretilmiş sürümler yedek olarak kalır.
- Dikişsiz (seamless) zemin dokuları (1024×1024): 3B zeminlerde kullanmak için. Bkz. 3B planı, §5.

## 4. Oyuna bağlama (benim işim)

Görseller geldiğinde: boyut küçültme ve WebP'ye çevirme betiği, yükleyici (eksik dosyada mevcut kod/emoji ikonlarına düşme), konfigürasyondaki görsel alanlarının açılması, admin sayfasında önizleme. Hedefler: tek görsel en fazla ~150 KB, tüm sanat paketi toplamı mobilde makul (varsayım: 3 MB altı). Bunlar ölçülmedi, ilk bağlamadan sonra gerçek telefonda kontrol edilmeli.

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
