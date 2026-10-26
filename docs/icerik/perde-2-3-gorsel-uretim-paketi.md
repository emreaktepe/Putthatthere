# Perde II-III görsel üretim paketi (ChatGPT ile üretilecek)

Durum: ÖNERİ / ÜRETİM LİSTESİ. Kaynak tasarım: `docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md` (düşman/büyü/perk/bölüm kimlikleri oradan). Bu belge `assets/art/` içine koyacağın dosyaların listesidir; kodu ve `data/game.config.json`'u değiştirmez. Biçim, ortak stil ve "yazı yok" kuralı `docs/icerik/gorsel-istem-paketi.md` (§2 Ortak stil tarifi), boyutlar `docs/icerik/gorsel-boyut-tablosu.md` ile aynıdır.

**Kısa özet:** toplam **62 görsel** (P0: 22 · P1: 26 · P2: 14) + **18 kopyalama** (yeni üretim yok) + 3B ek listesi (Emre ayrı üretiyor). Hiçbir görsel burada üretilmedi (fal.ai kullanılmadı; ChatGPT elle üretilecek).

---

## 1. Önce bunu yap: adlandırma ve `npm run art` durumu

`tools/check-art.mjs` her bölüm için `bolum-<bölüm-kimliği>.webp` ve `dugum-<bölüm-kimliği>.webp` bekler (`levels.<id>.image` / `nodeImage` yolundan değil, kimlikten türetir). Perde I yeni kimliklere geçtiği için bugün `npm run art` şunu söylüyor: **22 eksik = 11 kapak + 11 madalyon** (`bolum-w1-01..w1-09`, `bolum-w2-02`, `bolum-w3-09` ve `dugum-` karşılıkları). Eski tema adlı dosyalar (`bolum-forest.webp` vb.) hâlâ config'te bağlı ve çalışıyor; yalnızca denetçi listesi uyuşmuyor.

**Kural (bundan sonra):** her bölüm için `bolum-<id>.webp` (kapak) ve `dugum-<id>.webp` (madalyon), `<id>` = `w2-03`, `w3-07` gibi. Aynı tema tekrar kullanılan bölümlerde yeni görsel üretmek şart değildir: eski dosyayı yeni adla **kopyala** (aşağıda 2. bölüm); sonra bana haber ver, config'teki `image`/`nodeImage` yollarını yeni adlara bağlarım.

## 2. Üretmeye GEREK OLMAYANLAR (mevcut görseller)

### 2.1 Perde I eksikleri için kopyalama (18 dosya; yeni üretim yok)
Dosyayı kopyalayıp yeni adla `assets/art/` içine koy (eski dosya kalsın; ben config'i bağlarım):

| Yeni ad (kopya) | Kaynak (mevcut) | Not |
|---|---|---|
| `bolum-w1-01.webp` / `dugum-w1-01.webp` | `bolum-forest.webp` / `dugum-forest.webp` | |
| `bolum-w1-02.webp` / `dugum-w1-02.webp` | `bolum-cave.webp` / `dugum-cave.webp` | |
| `bolum-w1-03.webp` / `dugum-w1-03.webp` | `bolum-golems.webp` / `dugum-golems.webp` | |
| `bolum-w1-05.webp` / `dugum-w1-05.webp` | `bolum-graveyard.webp` / `dugum-graveyard.webp` | |
| `bolum-w1-07.webp` / `dugum-w1-07.webp` | `bolum-pass.webp` / `dugum-pass.webp` | |
| `bolum-w1-08.webp` / `dugum-w1-08.webp` | `bolum-village.webp` / `dugum-village.webp` | |
| `bolum-w1-09.webp` / `dugum-w1-09.webp` | `bolum-tower.webp` / `dugum-tower.webp` | |
| `bolum-w2-02.webp` / `dugum-w2-02.webp` | `bolum-crystals.webp` / `dugum-crystals.webp` | |
| `bolum-w3-09.webp` / `dugum-w3-09.webp` | `bolum-castle.webp` / `dugum-castle.webp` | |

`w1-04` (Alacakaranlık Ormanı) ve `w1-06` (Ninni Mağarası) şimdi `forest` / `cave` görsellerini paylaşıyor; **kendi görselleri P1'de üretilecek** (bkz. 6. ve 7. bölümde `bolum-w1-04`, `bolum-w1-06`, `dugum-w1-04`, `dugum-w1-06`).

### 2.2 Yeniden kullanılacak / yeniden renklendirilecek (üretim yok)
| Öğe | Kullanım |
|---|---|
| `dusman-knight.webp` | Şövalye II-IV'ün geçici ikonu (P1'de renk varyantı önerilir) |
| `ikon-buyu-*`, `ikon-yetenek-*`, `ikon-perk-*` (mevcut 11 perk) | değişmez |
| `ui-*` (14) | değişmez |
| `portre-aldemir/zerrin/piril/veyis/taskin.webp` | değişmez (Perde II-III için yeni kahraman YOK) |
| `menu-arkaplan.webp`, `harita-arkaplan.webp` | değişmez (278/292 KB: bütçe uyarısı eski; istersen sıkıştır) |
| Tema tekrarı olan bölümler (w2-06, w3-02, w3-04, w3-05, w3-07, w3-08) | geçici olarak eski/yeni temadaki mevcut kapağı **kopyala**; benzersiz görsel P2 |

### 2.3 Yeni düşmanların oyundaki 3B görünümü
Yeni düşmanların 3B hâli mevcut modellerin renk/ölçek varyantıdır (görsel üretim gerekmez). Bu pakette yalnızca **ikon/rozet** görselleri istenir.

---

## 3. Üretim sırası ve toplam adet

| Sıra | Grup | Adet | Öncelik |
|---|---|---|---|
| 1 | Perde II düşman ikonları (8): mourner, frostwraith, alpha, sniper, blight, hexer, shard, warden | 8 | **P0** |
| 2 | Perde II kapakları (7): w2-01, w2-03, w2-04, w2-05, w2-07, w2-08, w2-09 | 7 | **P0** |
| 3 | Perde II madalyonları (7): aynı kimlikler | 7 | **P0** |
| 4 | Perde III kapakları (3): w3-01, w3-03, w3-06 | 3 | P1 |
| 5 | Perde III madalyonları (3) | 3 | P1 |
| 6 | Perde I benzersiz kapak+madalyon: w1-04, w1-06 (4) | 4 | P1 |
| 7 | Elit Şövalye ikonları (3): knight-ii, knight-iii, knight-iv | 3 | P1 |
| 8 | Nöbetçi portresi (1) | 1 | P1 |
| 9 | Yeni büyü ikonu: Kristal Mızrak (2: 256 + 128) | 2 | P1 (büyü kabul edilirse) |
| 10 | Yeni perk ikonları (3): focus, breaker, wisp | 3 | P1 |
| 11 | Element rozet ikonları (7) | 7 | P1 |
| 12 | Tekrar temalı bölümler için benzersiz kapak (6) + madalyon (6) | 12 | P2 |
| 13 | Perde kartları (2): Perde II, Perde III | 2 | P2 |
| | **Toplam** | **62** (P0: 22 · P1: 26 · P2: 14) | |

Önce 1. satırın ilk 3 görselini üret ve tarzı onayla (Emre beğenmeden çoğaltma). Bu paket **ücretli bir hizmet kullanmaz**; ChatGPT hesabındaki kotan kadar üretirsin.

---

## 4. Ortak stil tarifi (HER SOHBETİN İLK MESAJI; `gorsel-istem-paketi.md` §2 ile aynı)

```
Stylized dark-fantasy game art, painterly and semi-realistic, rich deep purple
(#0a0714 to #4b2a9c) and warm gold (#ffd36e, #ff9f1c) palette, moonlit night mood,
soft rim light, strong readable silhouettes, gentle glow on magical elements,
clean shapes that stay readable when scaled small. No text, no letters, no logo,
no watermark, no frame, no UI.
```
İlk mesajın sonuna ekle: "Bundan sonraki tüm görselleri bu tarzda üret. Yazı, logo, filigran ekleme."

**Tutarlılık ipuçları**
- Her grup için AYRI sohbet aç (düşmanlar bir sohbet, kapaklar bir sohbet, madalyonlar bir sohbet, ikonlar bir sohbet); grup içinde aynı sohbette kal.
- Aynı karakterin renk varyantı için: "same character and pose as the previous image, only recolored: ..." de.
- Mevcut görselle uyum için sohbete mevcut `dusman-ghost.webp` (düşmanlar için), `bolum-forest.webp` (kapaklar için) görselini yükleyip "match this art style exactly" de.
- Şeffaf arka plan gelmezse: "arka plan düz #ff00ff olsun" de; ben/sen sonradan şeffaflığa çevirirsin (istem paketi §1).
- Kenarlardan ~%8 boşluk bırak ("leave 8% margin") — daire kırpma ve gölge için.

---

## 5. Düşman ikonları (11) — `dusman-<id>.webp`, 128×128 (ChatGPT 1024 verir; küçült), şeffaf, ≤ 30 KB

Ortak ek (her istemin sonuna): `Single creature icon, bust or full body, centered, strong readable silhouette, glowing eyes or core as focal point, transparent background, square, no text.` Küçük boyutta (22-38 px) okunmalı: yüz/silüet büyük.

| Dosya | Düşman (Türkçe) | Ekranda | Öncelik | İstem (konu cümlesi) |
|---|---|---|---|---|
| `dusman-mourner.webp` | Ağıt Ruhu | bölüm kartı ve giriş rozeti (w2-01+) | P0 | A large pale blue-white weeping ghost with a long veil of mist for hair, hollow sorrowful eyes and wispy arms spread, bigger and sadder than a small ghost, soft inner glow |
| `dusman-frostwraith.webp` | Don Hortlağı | w2-03, w3-02 | P0 | A floating ice-blue wraith with a glowing frozen core in its chest, trailing frost mist and tiny ice shards, same shape language as a burning ember wraith but cold |
| `dusman-alpha.webp` | Alfa Kurt | w2-03, w2-04, w3-02 | P0 | A huge spectral pack-leader wolf made of pale blue mist, larger than a normal wolf, with a scarred snout, bright icy eyes and a lowered howling head |
| `dusman-sniper.webp` | Gölge Nişancı | w2-05, w2-08 | P0 | A tall skeleton marksman in a long dark violet hooded cloak holding a long bone rifle-bow, one eye glowing violet through a scope-like lens |
| `dusman-blight.webp` | Çürük Hortlak | w2-06, w3-04 | P0 | A rotting wraith made of green decayed moss and spore sacs, glowing toxic green core, dripping slime, floating, sickly but readable |
| `dusman-hexer.webp` | Kara Cinci | w2-07, w3-03 | P0 | A hunched dark hexer in a red-brown tattered hood, long clawed hands drawing a glowing crimson curse circle in the air, no face, only two glowing eyes |
| `dusman-shard.webp` | Kristal Bekçi | w2-08, w3-06 | P0 | A stone guardian with magenta crystal growths bursting from its shoulders and back, cracked body glowing from inside with violet-pink light |
| `dusman-warden.webp` | Kalkan Nöbetçisi | w2-09, w3-03, w3-08 | P0 | A stocky armored skeleton warden in steel-teal plate holding a huge dented tower shield in front, only glowing eyes visible over the rim |
| `dusman-knight-ii.webp` | Ay Nöbetçisi | w2-05 boss çubuğu | P1 | The same heavy skeleton knight as the existing knight icon but with moon-blue silver armor, a crescent moon engraved on the shield, pale blue glow in the visor |
| `dusman-knight-iii.webp` | Harap Nöbetçi | w2-09 boss çubuğu | P1 | The same heavy skeleton knight as the existing knight icon but with dusty red armor, a broken castle gate engraved on the shield, dim crimson glow in the visor |
| `dusman-knight-iv.webp` | Son Nöbetçi | w3-05 boss çubuğu | P1 | The same heavy skeleton knight as the existing knight icon but with worn gold armor and a ragged white cape, steady warm gold glow in the visor |

Not (varyantlar): `knight-ii/iii/iv` için sohbete mevcut `dusman-knight.webp`'i yükle ve "same character, recolored" de. Config id'leri `knight_ii` vb. olsa da **dosya adında alt çizgi olmaz** (denetçi deseni `[a-z0-9-]`); yol config'te `assets/art/dusman-knight-ii.webp` olarak bağlanır.

---

## 6. Bölüm kapakları — `bolum-<id>.webp`, 768×512 (3:2), opak, ≤ 120 KB

Ortak ek: `Wide establishing shot, landscape 3:2, atmospheric depth, a small wizard silhouette for scale, key subject in the vertical center (the strip is cropped to 3:1 on the map).` Menü/harita görselleriyle aynı sohbette üret.

Dosya adı = bölüm kimliği: örn. `bolum-w2-03.webp`, config'te `levels.w2-03.image` bu yola bağlanır (kimlik uyumu).

| Dosya | Bölüm / tema | Öncelik | İstem |
|---|---|---|---|
| `bolum-w2-01.webp` | Yalancı Şafak Mezarlığı / graveyard-dawn | P0 | Wide establishing shot of a false-dawn graveyard: leaning tombstones under a black sky, a faint pink-gold glow on the horizon that is only a reflection of a cracked glowing crystal heart, drifting pale mist, dominant color soft rose-grey #3a2a3a |
| `bolum-w2-03.webp` | Fırtına Geçidi / pass-blizzard | P0 | Wide establishing shot of a blizzard-struck mountain pass: sideways snow, almost no visibility, dark rocks and twisted pines half-buried, cold white-blue light, dominant color blue-white #cfe8ff on dark slate |
| `bolum-w2-04.webp` | Alevli Köy / village-ember | P0 | Wide establishing shot of a burning village still smoldering: charred beams, small flames between ruins, heavy ember sparks and ash falling, orange fire glow against black smoke, dominant color #ff5a1a on dark red-brown |
| `bolum-w2-05.webp` | Ay Kulesi / tower-moon | P0 | Wide establishing shot of a tall bone tower under a huge full moon, silver-blue moonlight on pale bones, cracked floor reflecting moonlight, dominant color blue-silver #cfd8ff on dark grey-violet |
| `bolum-w2-07.webp` | Kızıl Harabe / golems-dusk | P0 | Wide establishing shot of ancient golem ruins at sunset: long red shadows from broken columns, dormant stone guardians, a cursed totem silhouette, dominant color brick red #ff7a5a on dark amber-brown |
| `bolum-w2-08.webp` | Hatıra Yatağı / crystals-red | P0 | Wide establishing shot of a crystal cavern turned red-magenta: crystals glowing from the inside like beating hearts, floating glowing motes like memories, dominant color magenta-crimson #ff4f7a on dark violet |
| `bolum-w2-09.webp` | Harap Kale / castle-ruin | P0 | Wide establishing shot of the outer courtyard of a ruined castle: collapsed walls, fallen banners, a distant cracked throne silhouette, dim dusty-rose sky, dominant color #b0506a on dark grey-red |
| `bolum-w3-01.webp` | Gece Ormanı / forest-night | P1 | Wide establishing shot of the darkest forest at night with no moon: deep navy trees, tiny glowing mushrooms and firefly lights, one small warm golden light guiding the path, dominant color deep navy-blue #0c1630 with blue accents #5fa8ff |
| `bolum-w3-03.webp` | Kutsal Halka / hold-arena | P1 | Wide establishing shot of a sacred stone ring arena: a large circular stone platform with glowing gold runes, surrounded by runic pillars, calm and solemn, dominant color gold-stone #ffd27a on dark brown |
| `bolum-w3-06.webp` | Pırıl'ın Yolu / crystals-void | P1 | Wide establishing shot inside the heart of the crystals: black void with huge white-violet crystals floating in the air, a faint golden path of light winding between them, dominant color white-violet on pure black |
| `bolum-w1-04.webp` | Alacakaranlık Ormanı / forest-dusk (Perde I, benzersiz) | P1 | Wide establishing shot of a twilight forest between night and day: orange-purple mist, tree silhouettes with an amber rim light, dominant color dusky violet #2a1636 with amber edges |
| `bolum-w1-06.webp` | Ninni Mağarası / cave-ice (Perde I, benzersiz) | P1 | Wide establishing shot of a silent ice cave: stalactites and stalagmites coated in frost, each water drop frozen mid-air, soft cyan glow, dominant color ice blue #162a3a |
| `bolum-w2-06.webp` | Solgun Bahçe / forest-dusk (yeniden) | P2 | Wide establishing shot of a withered garden at dusk: wilted flowers, bent iron trellis, pale spores, faded purple-amber light, dominant color faded violet #2a1636 |
| `bolum-w3-02.webp` | Buz Sürüsü / cave-ice (yeniden) | P2 | Wide establishing shot of an ice cave where spectral wolves glimmer in the dark, frost fog, pale blue light, dominant color #162a3a |
| `bolum-w3-04.webp` | Küllenen Köy / village-ember (yeniden) | P2 | Wide establishing shot of the same burnt village but later: mostly cold ash, fewer flames, gray smoke, faint red embers, dominant color #2e1810 |
| `bolum-w3-05.webp` | Son Nöbet / tower-moon (yeniden) | P2 | Wide establishing shot of the bone tower with the moon low on the eastern horizon, long silver shadows, a single armored silhouette at the top, dominant color #1a1a22 |
| `bolum-w3-07.webp` | Kristal Kapısı / crystals-void (yeniden) | P2 | Wide establishing shot of a huge glowing crystal gateway in a black void, white-violet light spilling through, dominant color white-violet |
| `bolum-w3-08.webp` | Son Savunma / castle-ruin (yeniden) | P2 | Wide establishing shot of the castle gate courtyard before the final battle: broken walls, red storm clouds, an empty wide arena, dominant color #b0506a |

---

## 7. Harita düğüm madalyonları — `dugum-<id>.webp`, 256×256, ≤ 30 KB

Kare; daire içine kırpılır, konu merkezde, kenarlarda boşluk. Ortak ek: `Round medallion emblem, subject centered inside a circular gold-rimmed frame, readable at 64 px, square, no text.`

| Dosya | Konu cümlesi | Öncelik |
|---|---|---|
| `dugum-w2-01.webp` | A tombstone with a faint pink-gold glow rising behind it | P0 |
| `dugum-w2-03.webp` | A snow-swept mountain pass with swirling white wind | P0 |
| `dugum-w2-04.webp` | A burning hut with a bright orange flame and rising embers | P0 |
| `dugum-w2-05.webp` | A tall bone tower under a large silver moon | P0 |
| `dugum-w2-07.webp` | A stone guardian head silhouetted against a red sunset | P0 |
| `dugum-w2-08.webp` | A single red-magenta crystal glowing like a heart | P0 |
| `dugum-w2-09.webp` | A broken castle gate with a torn banner | P0 |
| `dugum-w3-01.webp` | A dark tree with a tiny golden light at its base | P1 |
| `dugum-w3-03.webp` | A gold rune circle on a stone floor | P1 |
| `dugum-w3-06.webp` | A glowing white-violet crystal with a golden light path | P1 |
| `dugum-w1-04.webp` | A tree silhouette in orange-purple twilight | P1 |
| `dugum-w1-06.webp` | A frozen cave mouth with a blue glow | P1 |
| `dugum-w2-06.webp` | A withered flower in pale violet light | P2 |
| `dugum-w3-02.webp` | A frosty wolf silhouette in an ice cave | P2 |
| `dugum-w3-04.webp` | A smoldering ash pile with dim embers | P2 |
| `dugum-w3-05.webp` | A bone tower with the moon on the horizon | P2 |
| `dugum-w3-07.webp` | A radiant crystal gateway | P2 |
| `dugum-w3-08.webp` | A dark castle gate with red sky | P2 |

---

## 8. Karakter portresi (1) — `portre-nobetci.webp`, 256×256, şeffaf, ≤ 30 KB, P1

Senaryo belgesi §5.3 (`characters.nobetci`): Dört Nöbetçi'nin ortak konuşmacı yüzü (Baş/Ay/Harap/Son Nöbetçi; tek portre).

```
Bust portrait of a Nöbetçi, one of the four old night-watch knights of the king: a weathered skeleton knight in dented dark steel armor, tattered grey cape, a cracked helm with calm pale-blue glowing eye sockets, a tired and dutiful expression rather than a menacing one. Centered, shoulders up, transparent background, square.
```
Tutarlılık: "same style as the existing Kemik Şövalye icon" de ve `dusman-knight.webp`'i yükle.

---

## 9. Büyü, perk ve UI ikonları

### 9.1 Yeni büyü ikonu (P1; büyü kabul edilirse) — Kristal Mızrak
| Dosya | Boyut | İstem |
|---|---|---|
| `ikon-buyu-lance.webp` | 256×256, şeffaf, ≤ 30 KB | A long glowing white-violet crystal spear flying diagonally with a bright core and a trailing beam of light |
| `ikon-buyu-lance-128.webp` | 128×128 | aynı görselin 128 px küçültmesi (§11) |

Ortak ek: `Single bold game icon, centered, readable at 64 px, thick shapes, transparent background, square, no text.`

### 9.2 Yeni perk ikonları (P1) — `ikon-perk-<id>.webp`, 128×128 (192 de olur), şeffaf, ≤ 30 KB
Ortak ek: `Single bold game icon, centered, readable at 64 px, thick shapes, soft glow, transparent background, square, no text.`
| Dosya | Perk | İstem |
|---|---|---|
| `ikon-perk-focus.webp` | Odak Merceği | A gold-rimmed magic lens focusing a thin golden beam into a bright point with small sparkles |
| `ikon-perk-breaker.webp` | Zırh Kıran | A cracked steel breastplate shattering with a bright crack of white-violet light |
| `ikon-perk-wisp.webp` | Gölge Adımı | Two faint violet footprints dissolving into smoke wisps with a small spark between them |

### 9.3 Element rozet ikonları (7; P1) — `ui-el-<ad>.webp`, 128×128 (ekranda 20-28 px), şeffaf
"Etkili!/Dirençli" etiketi ve düşman rozeti için. Önce emoji/CSS ile çıkılabilir; görsel bunun yerini alır. Setin tarzı `ui-*` seti ile aynı; ortak ek: `Single flat-ish game UI icon, gold-and-violet palette with a soft glow, thick clean shapes, identical line weight and lighting across the set, centered, readable at 24 px, transparent background, square, no text.` Hepsini tek sohbette üret.
| Dosya | Element | İstem |
|---|---|---|
| `ui-el-ates.webp` | Ateş | A bright orange flame |
| `ui-el-buz.webp` | Buz | A cyan ice crystal snowflake |
| `ui-el-arcane.webp` | Arcane | A violet star-shaped arcane sigil |
| `ui-el-yildirim.webp` | Yıldırım | A yellow-white lightning bolt |
| `ui-el-zehir.webp` | Zehir | A green poison droplet with a small skull-like bubble |
| `ui-el-meteor.webp` | Yıkım (Meteor) | A burning grey-orange rock |
| `ui-el-isik.webp` | Işık (Ay Işığı) | A pale-blue crescent moon with a soft halo |

---

## 10. Perde kartları (2; P2) — `perde-2.webp`, `perde-3.webp`, 768×512, opak, ≤ 120 KB
Şu an config'te karşılığı yok (`worlds` perde kartı alanı kod işidir, senaryo belgesi §6.1). Kod gelene kadar kullanılmaz; isteğe bağlı.
| Dosya | İstem |
|---|---|
| `perde-2.webp` | A cracked winding road under a false dawn, a small wizard walking away, shards of a broken crystal heart in the sky, dominant color dusty rose and dark violet |
| `perde-3.webp` | A path of golden light leading into a huge luminous crystal heart in the dark, a tiny wizard and a small glowing orb walking toward it, dominant color deep navy with gold |

---

## 11. WebP'ye çevirme (kısa)

- ChatGPT PNG verir (genelde 1024×1024, 1536×1024). Orijinal PNG'yi yerelde sakla; repoya yalnızca `.webp` girer.
- Kalite ~80-85. Bütçeler: **ikon ≤ 30 KB**, **kapak/madalyon ≤ 120 KB** (madalyon 256 px olduğundan genelde ≤ 30 KB), tam ekran arka plan ≤ 300 KB.
- Boyutlar: düşman ikonu 128, perk 128, element 128, büyü 256 (+128), portre 256, kapak 768×512, madalyon 256.
- Araç önerisi (komut bayraklarını doğrulamadım): `cwebp -q 85 -resize 128 128 giris.png -o dusman-mourner.webp`; kurmak istemezsen squoosh.app (WebP, kalite ~85, boyutu yaz, şeffaflığı kontrol et).
- Dosya adları küçük harf, rakam ve tire içerir (`^assets/art/[a-z0-9-]+\.webp$`).

## 12. Üretimden sonra Emre ne yapacak?
1. Dosyaları `assets/art/` içine koy (kopyalama tablosu dahil) ve haber ver.
2. Ben `npm run art` ile boyut/şeffaflık/bütçeyi kontrol ederim; eksik/fazla dosyayı bildiririm.
3. Geliştirme odası config'te `image`/`nodeImage`/`enemies.<id>.image`/`perks.<id>.image` yollarını bağlar.
4. Denetçi listesindeki beklenen dosya sayısı: Perde II-III yapılınca 11 + 16 yeni bölüm = **27 kapak + 27 madalyon**; kopya + üretilenler birlikte bunu doldurur.

---

## 13. 3B model ve dekor ek listesi (Emre ayrı üretiyor; `3d-model-listesi.md` / `3d-dekor-listesi.md` biçimi)

Bütçe sınıfları aynı: küçük düşman ≤ 3.000 üçgen / ≤ 15 mesh; orta ≤ 6.000 / ≤ 25; elit ≤ 12.000 / ≤ 40. Sözleşme: `create<Ad>({ scale, color })`, modlar `idle/walk/windup/attack/hurt/dead`, `setTint`, +Z'ye bakar, yere basar. **Bu modeller ZORUNLU değildir**: ilk sürüm mevcut modellerin renk/ölçek varyantıyla çıkar (tasarım belgesi §4.2); aşağıdakiler kalite yükseltmesidir.

### 13.1 Düşman modelleri (3, önerilen)
| Dosya | Karakter | Config `r` / `y` | Bölüm | Tasarım ve animasyon notu | Sınıf | Neden |
|---|---|---|---|---|---|---|
| `hexer.js` | Kara Cinci | 0.7 / 1.0 | w2-07+ | Kızıl-kahve `#7a3a2a` kapüşonlu, kambur büyücü; uzun pençeli eller, yüzsüz, iki parlak göz; `windup`: iki eliyle havada kıpkırmızı lanet halkası çizer (1.2 sn); süzülür. Rahip'ten ayırt edilmeli (daha kambur, asasız, kıpkırmızı) | orta | Rahip'in rengi değişmiş kopyası destek/saldırı ayrımını bozar |
| `shard.js` | Kristal Bekçi | 1.1 / 1.2 | w2-08+ | Macenta `#d070ff` taş gövde; omuz ve sırttan fışkıran kristal sivrilikler, içten mor-pembe atan çatlaklar; ağır adım; `dead`: kristaller dışa saçılır (4 kıymık yönü oyundaki mermilerle uyumlu) | orta | Ölürken saçılan kıymık ipucunu görsel olarak verir; Taş Bekçi'den ayrılır |
| `warden.js` | Kalkan Nöbetçisi | 1.0 / 1.2 | w2-09+ | Çelik-turkuaz `#9fb8c8` zırhlı kısa iskelet nöbetçi; sol kolunda büyük kule kalkanı (ön yarım küre yüzü); kalkan oyuncuya dönük yön gösterir; `windup`: kalkanı kaldırır; dönüş yavaş | orta | Ön kalkan yönü okunmalı (oynanış) |

### 13.2 Renk/ölçek varyantı olarak çıkacaklar (yeni model YOK)
`mourner` (Ruh x1.45 `#dfe8ff`), `frostwraith` (Kor `#9be8ff`), `blight` (Kor `#9aff6a`), `alpha` (Kurt x1.3 `#cfe0ff`), `sniper` (Okçu x1.1 `#8a6aff`), `knight_ii/iii/iv` (Şövalye `#9fb8e8` / `#d9a0a0` / `#fff0c0`). Test notu: renklendirmenin modelde çalıştığı (setTint yalnızca flaş/yavaşlama karışımı yapar) Aşama D başında denenmeli.

### 13.3 Çevre tehlikesi dekorları (yeni 3 + yeniden kullanım)
| Dosya | Dekor | Bölümler | Not | Sınıf | Öncelik |
|---|---|---|---|---|---|
| `bone-spike.js` | Zeminden fışkıran kemik diken (3 kare, çıkış animasyonu) | w1-09, w2-05, w3-05 | Dikenler 5 sn döngüde yükselir/çekilir; çizim çağrısı örnekli (InstancedMesh) | küçük | P1 |
| `fire-vent.js` | Yangın fışkırması menfezi (taş halka + kor çatlağı) | w1-08, w2-04, w3-04 | Alev parçacığı kodla eklenir (`glow #ff7a2a`); model yalnızca menfez | küçük | P1 |
| `rune-pillar.js` | Rünlü kutsal sütun (altın rün) | w3-03 | `column.js`'in rünlü, daha ince hâli; `glow #ffd27a` | orta | P2 |
| (yeniden kullanım) | `mushroom-glow` (mantar bulutu için şişme animasyonu), `stalactite` (sarkıt tehlikesi), `crystal-pillar`/`big-crystal` (rezonans kristali), `column` + `rubble` (yıkılan sütun), `grave-mound` (diriliş noktası), `rock` (iç engel kayaları), `castle-pillar` (kızıl halka kaynağı) | | yeni model yok; yalnızca davranış | | |

İç engel kayaları için yeni model gerekmez: `rock.js` 3 boyut x 2 şekil, arena içine instancing ile yerleştirilir (+1-2 çizim çağrısı, ~3.000 üçgen; mobil bütçe: dekor ≤ 60 çizim çağrısı, ≤ 80 bin üçgen).

---

## 14. Açık sorular
1. Kristal Mızrak (w3-07) kabul edilirse 9.1 üretilir; reddedilirse atla.
2. Kara Cinci / Kristal Bekçi / Kalkan Nöbetçisi için yeni 3B model istiyor musun (13.1) yoksa ilk sürümde renk varyantıyla mı çıkalım?
3. 18 kopyalama (2.1) için dosyaları sen mi kopyalarsın yoksa config'i eski adlara bağlı bırakıp denetçi listesini mi güncelleyelim? (Öneri: kopyala; kalıcı kural `bolum-<id>`.)
