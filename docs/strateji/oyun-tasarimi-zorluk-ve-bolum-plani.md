# HEXORA: Büyücünün Gecesi — Oyun Tasarımı: Zorluk Modeli, Bölüm Planı ve Oyunda Tutma

Hazırlayan oda: strateji (rol: oyun tasarımcısı) · Kapsam: yalnızca planlama/tasarım. Kod ve `data/game.config.json` DEĞİŞTİRİLMEDİ.
Hikâye metni bu belgede YOKTUR; bölümlere yalnızca yer tutucu ad/tema verilmiştir. Senarist belgesi bu belgedeki bölüm kimliklerine (`w1-01` gibi) bağlanacaktır.

**Okuma notu.** Bu belgedeki her sayı, "Gerçek (koddan/config'ten okundu)" diye işaretlenmedikçe bir VARSAYIMDIR ve `[V#]` etiketiyle "Varsayım defteri"ne (bölüm 10) bağlıdır; defterde her varsayımın nasıl doğrulanacağı yazılıdır. Gerçek oyuncu testi ve bot ölçümü olmadan hiçbir hedef kesin değildir.

Kaynaklar (okundu): `data/game.config.json`, `js/game/{ai,combat,flow,loop,weapons,abilities,world,progress,campaign}.js`, `js/config/{adapt,schema,validate,registry}.js`, `js/core/{state,save,util}.js`, `js/ui/result.js`, `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md`, `docs/gelistirme/ui-ux-atmosfer-notlari.md`, `.sanal-ofis/profil.md`.

---

## 0. Yönetici özeti

| Konu | Karar / bulgu |
|---|---|
| Gerçek durum | Kampanya 9 bölüm; kusursuz oynayan biri için saf savaş süresi tahminen 4-7 dk, bölüm kartlarıyla 7-10 dk. Tüm oyun ilk oturumda biter [V1][V7]. |
| Önerilen yapı | **3 perde (dünya) x 9 bölüm = 27 bölüm.** Beklenen toplam oynama süresi tahmini 74 dk (kusursuz 56 dk), yani 6-7 oturum [V7][V8]. |
| Kimlik şeması | `w<perde>-<sıra>`: `w1-01` ... `w3-09`. 9 mevcut bölüm bu şemaya taşınır (bölüm 4.1). |
| Zorluk modeli | Düşman "tehdit puanı" (TP) → bölüm 30 sn tehdit yükü `B30` → oyuncu gücü `P(n)` → zorluk endeksi `Z = B30·X / (A·P)` → hedef ilk-deneme geçme oranı `p` (lojistik). Hedef `p`'den geriye doğru `B30` hesaplanır (bölüm 3). |
| Hedef ilk-deneme geçme oranları | Perde I: %92 → %50 (mini-boss), Perde II: %85 → %45, Perde III: %80 → %38 (final boss). Her perdenin 1. bölümü ve 6. bölümü "nefes" bölümüdür (testere dişi). |
| Yardım | Görünmez ama şeffaf DDA: 2. ölümden sonra düşman akışı -%10, 3. ölümden sonra -%20 ve +1 can, 4.'de -%30 + kalkan; asla soru sorulmaz, kart üzerinde görünür bilgi verilir. |
| Yeni hedef türleri | Zamanlı kristal koşusu (yalnız config), "hasarsız" rozeti (küçük kod), dalga savunması (orta), bölge tut (orta), eskort (büyük, ertelenebilir). |
| Meta | Yıldız (81), kozmetik (config'te zaten var olan `player.look` renkleri), ansiklopedi, "Gece Yarığı" sonsuz mod, tarih tohumlu günlük bölüm. Hepsi localStorage; hesap/skor tablosu/ödeme YOK. Güç artıran kalıcı yükseltme ÖNERİLMEZ (bölüm 6). |
| Önce yapılacak | Aşama 0: ölçüm (yerel telemetri + bot) ve ucuz düzeltmeler. Yeni içerik, ölçüm araçları çalışmadan başlamaz (bölüm 8). |

---

## 1. Mevcut durum analizi (gerçek verilerle)

### 1.1 Temel parametreler (Gerçek)

| Parametre | Değer | Kaynak |
|---|---|---|
| Başlangıç canı / üst sınır | 3 / 6 | `game.startHp`, `game.maxHpCap` |
| Bölüm sonu can yenileme | +1 (üst sınıra kadar) | `game.clearHeal`, `flow.js:174` |
| Oyuncu hızı | 8 birim/sn (x `speedMul`) | `game.baseSpeed`, `loop.js:60` |
| Arena | 28 x 28 birim (`ARENA = 14`), oyuncu ±13.5'e kısıtlı | `util.js:3`, `loop.js:61` |
| Hasar sonrası dokunulmazlık | 1.5 sn; bölüm başı 1 sn; kalkan kırılınca 0.6 sn; Işınlan 0.4 sn | `combat.js:84`, `flow.js:94`, `combat.js:76`, config `abilities.blink` |
| En hızlı ölüm (temas) | 3 can = en az 3 vuruş = en az 4.5 sn kesintisiz temas; Şövalye/Kral teması 2 hasar: 2 vuruşta ölüm | `combat.js:83-89`, config `enemies.*.dmg` |
| Toplama yarıçapı | 1.2 (+0.5 Pırıl) | `loop.js:175` |
| Kristal | Aynı anda 5 (ya da `crystals`), alınınca yenisi doğar; konum rastgele ±12.5 | `flow.js:100`, `loop.js:195`, `world.js:19` |
| Kristal dışı hedeflerde kristal | %35 ihtimalle kalp bırakır | `loop.js:201` |
| Kalp | +1 can; düşürme olasılığı: Ruh .12, Yarasa .12, Taş Bekçi .40, Okçu .20, Kurt .15, Kor .10 (intihar ölümü düşürmez), Rahip .50, Totem .50, Şövalye/Kral 0 | config `enemies.*.drop`, `combat.js:55-61` |
| Doğma | Başlangıç düşmanları ve sonraki hepsi yarıçap 14'lük halkada rastgele açıda; oyuncuya minimum uzaklık YOK | `world.js:28-30` |
| Doğma ritmi | `every` sn'de bir rastgele bir dalga; `cap` doluysa zamanlayıcı sıfırlanmaz, bir düşman ölünce hemen yenisi doğar | `loop.js:206-215` |
| Süre bitince | `survive` hariç yenilgi | `loop.js:217-223` |
| Puan | öldürme puanı + kristal 10 + ışık 25; bölüm sonu `100 x (bölüm no)` + `ceil(kalan sn) x 2` | `combat.js:56`, `loop.js`, `flow.js:153` |
| Ölünce | "Tekrar dene": bölüm başı anlık görüntüye dön, can TAM (`S.hp = S.maxHp`), bölüm giriş kartı yeniden açılır | `flow.js:127-139`, `ui/result.js:43-60` |
| Kayıt | `localStorage["buyucu_save"]`: tamamlananlar, koşu durumu, bölüm başına en iyi puan/kalan süre | `core/save.js` |
| Şema sınırları | en çok 30 bölüm, 24 tema, bölüm `time` 15-300 sn, `goal` ≤ 300, `crystals` ≤ 10, `start` ≤ 12 tür başına ve toplam ≤ 30, dalga başına ≤ 4 | `config/schema.js:264-290`, `validate.js:346` |
| Mevcut denge uyarıları | `cap` > 14; `start` toplamı > 2x`cap`; kristal x3 sn > süre; 1'den fazla boss | `validate.js:347-359` |

### 1.2 Düşmanlar ve Tehdit Puanı (TP)

TP formülü ve katsayıları [V3] (formül bölüm 3.1). Hız `v` kolon: Kurt için hücum dahil ortalama 3.4, Okçu/Rahip için "mesafe tutma" nedeniyle 2.0/1.5 alındı.

| Düşman (id) | hp | hız | r | temas hasarı | düşürme | davranış (Gerçek, `ai.js`) | TP |
|---|---|---|---|---|---|---|---|
| Ruh (`ghost`) | 1 | 2.2 | .7 | 1 | .12 | düz kovalar | 1.1 |
| Yarasa (`bat`) | 1 | 4.6 | .5 | 1 | .12 | zikzak kovalar | 1.7 |
| Taş Bekçi (`golem`) | 4 | 1.3 | 1.2 | 1 | .40 | yavaş, geniş gövde | 1.5 |
| Kemik Okçu (`archer`) | 2 | 1.6 | .6 | 1 (mermi) | .20 | 7-9 birim mesafe tutar, 2.5 sn'de bir mermi (7 birim/sn, 0.5 sn uyarı, ömür 4 sn) | 2.0 |
| Kurt Ruhu (`wolf`) | 2 | 2.4 (hücum 10) | .7 | 1 | .15 | 6 birimde 0.7 sn çömel, 0.6 sn hücum, 1 sn yorgun | 2.4 |
| Kor Hortlak (`ember`) | 2 | 3.2 | .7 | 0 (patlama 1, r 2.5) | .10 | 1.5 birimde 0.5 sn fitil, patlar; diğer düşmanlara da zarar verir | 1.8 |
| Karanlık Rahip (`priest`) | 5 | 1.2 | .9 | 0 | .50 | 8-12 mesafe tutar, 4 sn'de bir en yakın 3 düşmana tek vuruşluk kalkan + 1 hp iyileştirme | 2.7 |
| Lanet Totemi (`totem`) | 10 | 0 | 1.0 | 0 | .50 | 12 sn'de bir Ruh doğurur (`cap`+3'e kadar); `cap`'e sayılmaz | 3.0 |
| Kemik Şövalye (`knight`) | 24 | 1.1 (öfke 1.6) | 1.5 | 2 | 0 | 5 sn'de bir yarıçap 4 şok (1 sn uyarı, 2 hasar); %50 hp'de öfke | 8.4 |
| Gölge Kral (`boss`) | 45 | 1.5 | 2.2 | 2 | 0 | Faz1: 6 sn'de 2 Ruh; Faz2 (%66): +Okçu+Yarasa, 8 sn'de 2 kırmızı halka (r 2.6, 1 hasar); Faz3 (%33): kalkan + 3 ışık toplama, 6 sn savunmasız; her faz geçişinde +10 sn | 14.6 |

### 1.3 Oyuncu silahları (Gerçek: config; DPS hesabı [V2])

| Büyü | hasar | bekleme (sn) | tek hedef kuramsal DPS | not |
|---|---|---|---|---|
| Ateş Topu | 1 | .35 | 2.86 | mermi hızı 16, ömür 1.4 sn (menzil ≈ 22) |
| Buz Oku | 1 | .50 | 2.00 | düşmanı 3 sn %65 yavaşlatır (`ai.js:112`) |
| Üçlü Büyü | 1 x 3 | .65 | 4.6 (yelpaze; yakında ~2 isabet) | |
| Yıldırım | 2 | .90 | 2.2 / hedef; 3 hedefte 6.7 | OTOMATİK hedef, menzil 13, nişan gerektirmez |
| Zehir Bulutu | 1/sn | 1.4 | 1.0 / bulutta duran düşman | r 2.2, 4 sn, Rahip kalkanını geçer |
| Meteor | 3 | 2.8 | 1.07 tek; alan r 3 | 0.8 sn gecikme |
| Ay Işığı Halkası | 1 | 4.5 | .22 alan r 4 + itme 2 | acil durum |

Yetenekler: Mana Kalkanı (cd 14, 8 sn süre, bir vuruş), Işınlan (cd 5, 5 birim, 0.4 sn dokunulmazlık), Zaman Çatlağı (cd 18, 3 sn, düşman x0.4).

### 1.4 Mevcut 9 bölümün tehdit/zorluk tablosu

`B30 = Bs + λ·30` (bölüm 3.2); `Bs` = başlangıç tehdidi (totem dahil), `λ` = doğma akışı (TP/sn). `Z` zorluk endeksi, w1-01'e göre (bölüm 3.4). `p*` = modelin ham tahmini; **kalibre edilmemiştir, yalnızca sıralama için okunmalı** [V5].

| # | id | hedef | goal / süre | start | spawn / every / cap | Bs | λ | B30 | P(n) | Z | p* |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | forest | kristal | 6 / 50 | ghost3 | ghost1 / 8 / 5 | 3.3 | .14 | 7.4 | 3.0 | 1.00 | .92 |
| 2 | cave | kristal | 8 / 55 | ghost2 bat3 | bat1 ghost1 / 7 / 7 | 7.3 | .40 | 19.3 | 3.4 | 2.30 | .55 |
| 3 | golems | kristal | 10 / 60 | ghost2 bat2 golem2 | golem1 bat1 / 7 / 8 | 8.6 | .46 | 22.3 | 4.2 | 2.15 | .60 |
| 4 | graveyard | kristal | 12 / 65 | ghost3 bat2 golem2 archer2 | ghost1 archer1 / 6 / 10 | 13.7 | .52 | 29.2 | 5.2 | 2.28 | .56 |
| 5 | pass | hayatta kal | 45 / 45 | ghost3 bat3 wolf2 | wolf2 bat1 / 5 / 9 | 13.2 | 1.30 | 52.2 | 6.3 | **4.48** | .17 |
| 6 | village | totem | 3 / 75 | ghost3 golem2 ember3 + 3 totem | ember1 ghost1 / 6 / 10 | 20.7 | .76 | 43.5 | 7.4 | 3.18 | .35 |
| 7 | crystals | kristal | 14 / 80 | ghost3 bat3 golem2 archer2 priest2 | priest1 bat1 \| archer1 bat1 / 6 / 11 | 20.8 | .68 | 41.1 | 8.0 | 2.08 | .62 |
| 8 | tower | mini-boss | 1 / 85 | knight1 archer2 wolf2 | archer1 ghost1 / 6 / 9 | 17.2 | .52 | 32.7 | 8.5 | 2.91 | .40 |
| 9 | castle | boss | 1 / 100 | boss1 | (yok; boss çağrıları) / 6 / 8 | 14.6 | .49 | 29.4 | 9.8 | 3.57 | .28 |

Oyuncu gücü sütunu `P(n)`: bölüm 3.3 formülüyle, bölüm başında açık büyü/yetenek ve beklenen perk sayısı (n-1 seçim) kullanılarak hesaplandı [V4]. Açık büyüler: b1 Ateş; b2 +Buz; b3 +Üçlü; b4 +Yıldırım; b5 +Kalkan (yetenek); b6 +Işınlan; b7 +Zehir; b8 +Meteor; b9 +Ay Halkası +Zaman Çatlağı (`levels.*.reward/ability`).

### 1.5 Bulgular (koddan kanıtlı)

**B1. Kampanya aşırı kısa; ilk oturumda biter.** Bölüm hedefe ulaşılınca anında biter (`loop.js:200`, `combat.js:67,69`); `time` yalnızca üst sınırdır. Kristal bölümlerinde saf süre ≈ `goal x 1.5-3 sn` [V1]. Hesap (savaş süresi aralığı, sn): forest 9-18, cave 12-24, golems 15-30, graveyard 18-36, pass 45 (sabit), village 30-60, crystals 21-42, tower 25-60, castle 60-120 [V11]. Toplam 235-435 sn (4-7 dk); kart/harita/perk seçimi için bölüm başına ~20 sn eklenirse (6.9-10.3 dk) [V7]. Oyuncu 12 dk'lık ilk oturumda tüm hikâyeyi bitirir; kalan tek içerik "Alıştırma" ve "Yeniden oyna" (`newGame()` her şeyi sıfırlar).

**B2. Kristal bölümlerinde ateş etmek zorunlu değil, süre baskısı yok.** Hedef yalnızca toplamak (`loop.js:197-200`). Oyuncu 8 birim/sn; düşmanlar 1.1-4.6 (yalnız Kurt hücumu 10, 0.6 sn, uyarılı). Süre payı: `time / (goal x 3)` = forest 2.8, cave 2.3, golems 2.0, graveyard 1.8, crystals 1.9; mevcut doğrulayıcı eşiği 1.0 (`validate.js:352`). Hipotez [V9]: hiç ateş etmeyen bir "yürüyen bot" 1-4. bölümleri çoğunlukla geçer; bu durumda büyü çeşitliliği ilk yarıda anlamsızdır. Doğrulama: bölüm 7 yürüyen bot.

**B3. Plansız zorluk sıçramaları; boss anti-klimaks.** Modele göre Z: 1.0 → **2.30** (cave, x2.3 sıçrama; oyuncu gücü yalnızca Buz Oku'yla arttı: hasar Ateş ile aynı, atış daha yavaş) → 2.15 → 2.28 → **4.48** (pass, bir önceki bölümün 2 katı; λ = 1.3 TP/sn, `every` 5 sn, dalga Kurt2+Yarasa1, Işınlan henüz yok: bu bölümün ÖDÜLÜ) → 3.18 → 2.08 → 2.91 → 3.57. Zirve bölüm 5'te, final boss'tan önce. Boss'un `B30`'u (29) 6 bölümden düşüktür; model boss faz mekaniklerini yakalamıyor (X çarpanı ile düzeltildi, [V6]) ama sıralama sorunu gerçek: Pass'in 52 puanlık akışı son bölümden fazla. Eğri "tırmanış" değil, "diş": düzensiz.

**B4. Aynı anda iki yeni şey; öğretilmeyenler.** İlk kez gelen şeyler ve öğretim:
| Bölüm | İlk kez gelen | Nasıl öğretiliyor (config `intro`) | Eksik |
|---|---|---|---|
| 2 | Yarasa (zikzak, hız 4.6) | "Vızıltıyı duyuyor musun?" | hızlı düşmanı vurma ipucu yok |
| 3 | Taş Bekçi (4 hp) | Hikâye cümlesi | Buz/Üçlü seçimi hiç tetiklenmiyor |
| 4 | Okçu + düşman mermisi | "Menzilden vurur; hareket etmeyi bırakma" (iyi) | Mermi kaçışı uygulama alanı yok |
| 5 | Kurt hücumu + **hayatta kal hedefi** + kristalin kalp çekmesi | "sadece ayakta kal" | iki yeni şey birden; kristalin ne işe yaradığı (kalp %35, `loop.js:201`) anlatılmıyor; Işınlan ödülü bölüm SONUNDA |
| 6 | Kor (fitil/patlama) + **totem hedefi** + totem doğurması | "Totemleri yık; kor hortlaklar yakınında patlıyor" | yine iki yeni şey; totem Ruh doğuruyor (`ai.js:174`) sözü yok |
| 7 | Rahip (kalkan emer) | "Rahipler düşmanları iyileştirir; önce onları bul" | kalkanın tek vuruş emdiği, Zehir'in bypass ettiği anlatılmıyor |
| 8 | Şövalye yer şoku; Meteor/Ay Halkası ödülü sonraki bölüm | | Zaman Çatlağı ve Ay Halkası ilk kez FİNAL boss'ta (b9) kullanılır |

**B5. Perk sistemi: sınırsız yığılma ve nicemleme.** Hız, Güç, Hız (el), Mıknatıs, Taş Deri için `maxStacks` yok (config `perks`; `adapt.js:94`). `haste` 4 yığında bekleme x0.41; `speed` 4 yığında 14 birim/sn: düşmanlar hiçbir zaman yetişemez. Ayrıca `dmgMul` ondalıklı ve düşman hp tamsayı: Güç Tılsımı çoğu zaman görünmez. Ateş Topu için gereken vuruş sayısı:

| dmgMul yığını | 0 | 1 (x1.25) | 2 (x1.56) | 3 (x1.95) | 4 (x2.44) |
|---|---|---|---|---|---|
| hp 1 (Ruh/Yarasa) | 1 | 1 | 1 | 1 | 1 |
| hp 2 (Okçu/Kurt/Kor) | 2 | 2 | 2 | 2 | 1 |
| hp 4 (Taş Bekçi) | 4 | 4 | 3 | 3 | 2 |
| hp 5 (Rahip) | 5 | 4 | 4 | 3 | 3 |
| hp 10 (Totem) | 10 | 8 | 7 | 6 | 5 |
| hp 24 (Şövalye) | 24 | 20 | 16 | 13 | 10 |
| hp 45 (Kral) | 45 | 36 | 29 | 24 | 19 |

Sonuç: ilk Güç Tılsımı hp 1-2 düşmanlara hiçbir şey katmaz; oyuncu "seçtim ama hissetmedim" yaşar [V4]. Perk havuzu 11 tür; 27 bölümde ~26 seçim yapılacağından sınırlar konmazsa havuz anlamsızlaşır, konursa yaklaşık 29 slot kalır (bölüm 5 yeni perk önerisi).

**B6. Tekrar dene sürtünmesi.** Ölüm → kart → "Bu bölümü tekrar dene" (`flow.js:135`) → `introLevel()` → hikâye diyaloğu, hedef, düşman çipleri yeniden gösterilir (`result.js:43-60`) → "Savaşa gir" tıklaması. Her denemede 2 tıklama ve tekrar okunan hikâye. Tek yardım "Can tam" (`flow.js:135`): can ödül gibi çalışıyor ve ölçülmüyor. 4. ölümden sonra bile kolaylaşma yok. Ayrıca bölüm kısa olduğu için maliyet küçük (45-100 sn); 2-4 dk'lık bölümlerde bu sürtünme büyüyecek.

**B7. Doğma adaletsizliği ve tempo.** Doğma noktası yarıçap 14 halkada rastgele açı, oyuncuya minimum uzaklık yok (`world.js:28-30`). Kenara yaslanmış oyuncu (x = 13) için 5 birim içinde doğma olasılığı yaklaşık %5.7/doğma (geometrik hesap, 2·asin(2.5/14) / 360). Düşman 0.35 sn'de büyüyerek belirir (`ai.js:93`) ama temas hasarı bu sürede de işler (`ai.js:209`). Ayrıca `cap` doluyken zamanlayıcı birikir (`loop.js:210`): bir düşman ölünce yenisi aynı karede doğar; "kaos tepe" ve "nefes" yok, sabit baskı vardır. Boss faz 1 çağrısı `cap` kontrolsüz (`ai.js:56`; faz 2'de kontrol var, `ai.js:61`).

**B8. Büyü dengesi: Yıldırım baskın.** Menzil 13, otomatik hedef, 2 hasar, 3 zincir: ölçeklenmiş etkili DPS ≈ diğer mermili büyülerin yaklaşık 2 katı [V2]. 4. bölümden sonra Ateş/Buz/Üçlü seçimi anlamlı olmaktan çıkar; Zehir Rahip karşıtı, Meteor tek büyük hedef karşıtı; ama bunların seçim nedeni öğretilmiyor. Doğrulama: telemetride büyü başına atış payı (bölüm 7.3).

**B9. Ödül temposu hızlı ama tek yönlü; puan hiçbir şeyi açmaz.** 7 büyü ve 3 yetenek 8 bölümde, ~50 sn'de bir yeni şey; bittiğinde yenilik yok. Puan yalnız "en iyi skor"u günceller (`flow.js:153-155`, `progress.js recordBest`); yıldız, açılış, kozmetik yok. Kayıtlı "kalan süre" (`best.levels.time`) hayatta kal bölümünde hep 0.

**B10. Kayıt kimlikleri ve doğrulayıcı sınırları yeni yapıyı kısıtlıyor.** Kayıt bölüm kimliklerine bağlı; kimlik değişirse bilinmeyen kimlikler süzülür (`save.js:85`) ve ilerleme kaybolur: göç haritası gerekir. Doğrulayıcı 1 boss ister (`validate.js:359`), mini-boss hedefi ilk Şövalye/Kral ölümünde biter (`combat.js:69`): bir bölümde birden fazla mini-boss olamaz. Mini-boss hedef metni sabit "Kemik Şövalye'yi yen!" (`strings.objective.miniboss`).

### 1.6 Dürüstlük notu
Bu bölümdeki Z/p* değerleri model çıktısıdır; hiç oyuncu verisi yoktur. B2 ve B3'ün "gerçek zorluk" iddiaları bot ve oyuncu testiyle doğrulanana kadar HİPOTEZDİR. Bölüm 1.1-1.3 ve B4-B7'nin kod gözlemleri ise doğrudan koddan okunmuştur.

---

## 2. Tasarım ilkeleri ve hedefler

### 2.1 İlkeler
1. **Öğret → uygula → ustalaş → sına.** Her yeni mekanik: (a) güvenli bir bölümde tek başına tanıtılır (az sayıda, kaçılabilir), (b) sonraki bölümde başka bir şeyle birleştirilir, (c) bir "tırman" bölümünde kalabalıkta kullanılır, (d) perde sonu sınavında beklenmeyen kombinasyonla sınanır.
2. **Bölümde en çok bir yeni düşman VEYA bir yeni hedef türü.** (B4: mevcut bölüm 5 ve 6 iki yeni şey getiriyor.) Doğrulayıcı kuralı olarak yazılır (bölüm 7.2).
3. **Testere dişi.** Her perdenin 1. bölümü bir önceki perde sonundan düşük zorlukta, her perdenin 6. bölümü "nefes"; zirveler 5, 8 ve 9. bölümlerde.
4. **Yenilmek öğretmelidir, cezalandırmamalı.** Tekrar deneme tek tıkla, kart/diyalog atlanır; adaletsiz ölüm (doğma, görünmez saldırı) giderilir.
5. **Ustalık hissi:** güç büyür (büyü, perk, yetenek) ve oyuncu bunu "hissedecek" bir hedefle karşılaşır (nefes bölümünde kalabalığı biçmek).
6. **Şeffaflık:** yardım varsa görünür; oyuncuya "kolay mod" sorulmaz ama gizli hile de yapılmaz.
7. **Üretilebilirlik:** bölüm = config girdisi; yeni kod yalnızca yeni hedef türü ve ölçüm içindir.

### 2.2 Akış (flow) kanalı
Hedef: oyuncu becerisi ile zorluk arasındaki oran bir bant içinde kalsın. Bu bant `Z` ile `p` arasındaki eşlemeyle tanımlanır (bölüm 3.4): `p` %92 (kolay) ile %38 (boss) arası. Sıkıcılık = `p` > %95 art arda 3 bölüm; kaygı = `p` < %35 art arda 2 bölüm (telemetri alarmları bölüm 7.3).

### 2.3 Hedef ilk-deneme geçme oranları [V5][V12]
| Bölge | Bölüm | Hedef p | Beklenen deneme (1/p) |
|---|---|---|---|
| Perde I, 1-3 | w1-01..03 | %92, %90, %87 | 1.1 |
| Perde I, 4-8 | w1-04..08 | %84, %78, %88 (nefes), %72, %66 | 1.2-1.5 |
| Perde I sınavı | w1-09 | %50 | 2.0 |
| Perde II | w2-01..08 | %85, %80, %74, %70, %50 (mini), %82 (nefes), %64, %58 | 1.2-2.0 |
| Perde II sınavı | w2-09 | %45 | 2.2 |
| Perde III | w3-01..08 | %80, %72, %66, %62, %46 (mini), %78 (nefes), %56, %50 | 1.3-2.2 |
| Final boss | w3-09 | %38 | 2.6 (DDA ile ~2.1) |

Önceki isteğin "orta: %60-70, boss: %35-50" hedefiyle uyumludur. "Cömert mi, sert mi" sorusu bölüm 9'da: hardcore için tümünden -8 puan, cömert için +5 puan kaydırılır.

### 2.4 "Bir bölüm daha" döngüsü ve oturum hedefleri [V10]
- **Bölüm döngüsü:** savaş 1-3 dk (boss 3 dk) + bölüm sonu ekranı (puan, ödül, perk seçimi ~20-25 sn) → harita → sonraki düğüm. Toplam 2-4 dk. Emre'nin "2-4 dk" hedefini bölümler arası kartlar DAHİL anladım; saf savaş süresi 1-3 dk'dır (kristal toplama 2.4 sn/kristal alınarak [V1]; daha uzun savaş istenirse `goal` artırılır).
- **Çengel 1 (yeni şey):** perk seçimi her bölüm sonunda; yeni büyü/yetenek her 1-3 bölümde (ilk oturumda ~2 dk'da bir).
- **Çengel 2 (merak):** bölüm sonu ekranında sonraki düğümün adı + tek satır merak cümlesi (senarist) + varsa "yeni tür düşman" ipucu.
- **Çengel 3 (yarım kalmış yıldız):** haritada düğümde 3 yıldız yuvası; ★2/★3 kaçırılan bölüm "bir daha deneyeyim" nedeni.
- **Çengel 4 (tek tık):** bölüm sonunda "Sonraki bölüm" birincil düğme ve otomatik odaklı; ölünce "Tekrar dene" birincil düğme ve otomatik odaklı (B6).
- **İlk oturum (10-15 dk):** 5-6 bölüm (w1-01..w1-05/06), 3-4 yeni şey (Buz, Üçlü, Kalkan, Yıldırım); oturum sonu bir kanca: Yıldırım'ın ödülü ~9. dakikada. Kümülatif beklenen süre tablosu bölüm 4.4'te.
- **Gün 2-3 dönüş nedeni:** perde ilerlemesi, yıldız, "Gece Yarığı" (bölüm 6), günlük bölüm. Hesap olmadığı için bildirim yok; dönüş alışkanlığa/yer imine dayanır [V13].

---

## 3. Matematiksel zorluk modeli (algoritma)

### 3.1 Düşman Tehdit Puanı (TP)
```
TP(e) = hp^0.45 · (0.5 + 0.25·v_eff·s_hız) · max(dmg, 1) · R_ai
  hp      : config enemies.<id>.hp (ölçekte: hp·s_hp, bölüm 5'te kullanılmaz)
  v_eff   : config speed; Kurt 3.4 (hücum dahil), Okçu 2.0, Rahip 1.5 (mesafe tutanlar)
  s_hız   : bölümün enemySpeedMul'u (yeni alan; varsayılan 1)
  dmg     : temas/mermi/patlama hasarı (Kor ve Rahip için 1 alınır: dolaylı etki)
  R_ai    : chase 1.0, ranged 1.5, charge 1.3, bomber 1.0, support 1.5, knight 1.3, boss 1.5
  totem   : sabit 3.0 (kendisi + 12 sn'de bir Ruh)
```
Gerekçe [V3]: `hp^0.45` doyan bir "öldürme maliyeti" (büyük hp'de azalan etki); `0.5 + 0.25v` hızın tehdidi doğrusal artırır; `R_ai` menzilli/hücumlu saldırının kaçış gerektirmesini yansıtır. Katsayılar bot ölçümüyle uydurulacaktır (bölüm 7.4: TP ile ölçülen "başına verilen hasar" arasındaki ilişki).

Elit Şövalye varyantları (config'te yalnızca yeni `enemies` girdisi: `model: "knight"`, hp/hız farkı) [V16]:
| id | hp | hız | TP |
|---|---|---|---|
| `knight` (mevcut) | 24 | 1.1 | 8.4 |
| `knight_ii` | 36 | 1.3 | 10.8 |
| `knight_iii` | 48 | 1.4 | 12.6 |
| `knight_iv` | 60 | 1.5 | 14.4 |

### 3.2 Bölüm tehdit yükü
```
Bs   = Σ start[type]·TP(type) + n_totem·3.0              (başlangıç tehdidi)
λ    = ortalama dalga TP / every  (+ n_totem·TP(ghost)/12) (doğma akışı, TP/sn)
B30  = Bs + 30·λ                                          (ilk 30 sn tehdit yükü)
peak ≈ cap · ortalama TP                                  (eşzamanlı üst sınır; cap ≤ 12 mobil [V14])
```
30 sn penceresi: 1-3 dk'lık bölümlerde baskının oyuncunun karşılaştığı ilk yoğun kısmı yakalar. Yer tutan (set-piece) bölümler: Şövalye/Kral kendi TP'siyle Bs'e girer, çağrılar λ'ya girer.

Config eşlemesi: `start` → Bs; `spawn` (dalga listesi) + `every` → λ; `cap` → peak. Totem bölümünde `totems` + Totem'in Ruh doğurması (`ai.js:174`).

### 3.3 Oyuncu güç modeli P(n) [V4]
```
Hp(n)  = min(maxHpCap, startHp + 0.2·n)                 (hp perk'i seçilme payı 0.2/seçim)
Pd(n)  = 1 + 0.05·n   (n ≤ 12);  1.6 + 0.025·(n-12)     (hasar+bekleme+yankı perk'leri, azalan)
Wf     = en iyi açık büyü katsayısı + 0.05·min(4, diğer faydalı büyü sayısı)
         katsayılar: Ateş 1.0, Buz 1.05, Üçlü 1.35, Yıldırım 2.0, Zehir 1.5, Meteor 1.6, Ay Halkası 0.9
D(n)   = Wf · Pd(n)
Af(n)  = 1 + 0.12 · (açık yetenek sayısı)
P(n)   = Hp(n) · (1 + 0.35·log2 D(n)) · Af(n)
```
`log2`: DPS iki katına çıksa da konumsal tehditler (menzilli, hücum, şok) yok olmaz; güç büyüdükçe bölüm zorluğu "adet" ile değil "kalite" ile yükselir. Perk `maxStacks` sınırları (bölüm 8, Aşama 0) bu modelin geçerli olmasının ön koşuludur: sınırsız yığın `Pd`'yi patlatır.

Yeni 27 bölümlük planda P(n): w1-01 3.0 · w1-05 5.4 · w1-09 8.9 · w2-05 11.4 · w2-09 13.7 · w3-01 13.7 · w3-09 14.2. Perde III'te `P` platoya girer (can üst sınırı 6, tüm büyüler açık, perk azalan getiri). Sonuç: Perde III zorluğu `P` büyümesine değil bileşim kalitesine ve set-piece'lere yaslanır; bu yüzden `B30` hedefleri 50-80 aralığında kalır (mevcut en yüksek: pass 52).

### 3.4 Zorluk endeksi ve hedef geçme oranı
```
A      = (B30(w1-01) · X_kristal) / P(0) = 7.4·0.75/3 = 1.85      (çapa: w1-01 ≡ Z=1)
Z      = B30 · X_hedef / (A · P(n))
p(Z)   = 1 / (1 + exp((ln Z − ln 2.5) / 0.375))                    (lojistik; Z50 = 2.5, s = 0.375)
Z(p)   = exp( ln 2.5 + 0.375 · ln((1−p)/p) )                       (ters; tasarım yönü)
B30(n) = Z_hedef(n) · A · P(n) / X_hedef
```
Hedef türü çarpanı `X_hedef` [V6]: kristal .75, zamanlı kristal .85, hayatta kal/dalga/bölge/totem 1.0, eskort 1.1, mini-boss 1.4, boss 2.2 (model dışı faz/şok mekanikleri için "set-piece çarpanı"). Z50 ve s çapaya göre seçilmiş başlangıç değerleridir; w1-01 için p = %92 verir [V5]. Gerçek veriyle (bölüm 7.4 bot + 7.6 oyuncu testi) Z50 ve s yeniden uydurulur.

Z ↔ p örnek eşleme: Z 1.0 → .92 · 1.3 → .85 · 1.5 → .80 · 1.8 → .71 · 2.0 → .65 · 2.5 → .50 · 2.7 → .45 · 3.0 → .38.

### 3.5 Doğma planı algoritması (bölüm üreticisi)
Girdi: `B30*` (hedef), `obj`, savaş süresi `T`, düşman paleti (ağırlıklar), `speedMul`.
```
function planLevel(B30, obj, palette, wavePair, speedMul):
  fixed = set-piece TP (Şövalye/Kral) + 3.0·n_totem
  share = (obj ∈ {survive, waves, hold}) ? 0.35 : 0.50        # başlangıç payı
  Bs*   = max(share·B30, fixed + 1)
  start = en_büyük_kalan_yöntemiyle(palette, Bs* − fixed)        # tamsayı adetler, tür başına ≤ 12
  λ*    = (B30 − Bs − n_totem·TP(ghost)/12·30) / 30              # 30 sn'lik akış
  wave  = wavePair (1 ağır + 1 hafif tür) x r tekrar, r = 1..4 ; waveTP = r·(TP1+TP2)
  every = clamp(round(waveTP / λ*), 5, 12)
  cap   = clamp(ceil(0.75 · n_start_totemsiz + 3), 5, 12)
  return {start, spawn:[wave], every, cap}
```
Çıktı yuvarlama hatası taşır (özellikle küçük bütçelerde); üretici sonra `Z_tasarım`'ı yeniden hesaplar ve |Z_tasarım/Z_hedef − 1| > %15 ise "elle ayar" uyarısı verir. Bölüm 4.5 tablosundaki değerler bu algoritmanın ilk taslak çıktısıdır.

**Zaman profili (tempo)** [V12]: bugünkü motor tek tip rastgele dalga atar. Hedef tasarım (config alanı `tempo`; küçük kod, bölüm 7.2):
- `flat`: bugünkü davranış.
- `pulse`: ardışık 3 dalga `every x 0.7` ile ("kaos tepe"), sonra `every x 1.6` ile 1 dalga ("nefes"); ortalama λ aynı kalır.
- `ramp`: ilk %40'ta λ x0.7, sonra x1.3 (hayatta kal/dalga bölümleri için).
- `cap` dolunca tamponlama: zamanlayıcıyı `every`'de sınırla (bugün birikiyor, B7); bir düşman ölünce yenisi en az 0.8 sn sonra doğsun.
- Doğma noktası: oyuncudan ≥ 8 birim uzak (B7).

### 3.6 Dinamik zorluk ayarı (DDA) [V12]
`deaths` = bu bölümde, bu oturumda ard arda yenilgi sayısı (bölüm kazanılınca sıfırlanır).

| Ard arda ölüm | düşman akışı λ x | başlangıç düşman sayısı x | kalp düşürme x | ek | Z etkisi (yaklaşık) |
|---|---|---|---|---|---|
| 1 | 1.00 | 1.00 | 1.00 | yok (hızlı yeniden deneme) | 1.00 |
| 2 | 0.90 | 0.85 | 1.25 | yok | ~0.88 |
| 3 | 0.80 | 0.75 | 1.50 | +1 başlangıç canı (üst sınırı aşabilir, bölüm bitince söner) | ~0.76 |
| 4+ | 0.70 | 0.65 | 2.00 | +1 can, kalkan hazır başlar, `time` x1.2 | ~0.65 |
Zemin: etkin Z asla 0.6'nın altına inmez (tasarım Z'sinin %60'ı). Boss/mini-boss: boss hp'si DEĞİŞMEZ; yalnız can, kalp, süre, çağrı aralığı x1.2 (aralık uzar).
**Kazanma serisi:** ilk denemede art arda 3 bölüm → sonraki bölümlerde λ x1.05, her ek seri +0.05, en çok x1.15 (ilk ölümde sıfırlanır). Hızlı oyuncu sıkılmaz [V12].
**Şeffaflık:** "Pırıl bu sefer seni kolluyor" tarzı kısa bir satır ölüm kartında ve bölüm giriş kartında görünür (senarist yazar; kod `difficulty.dda.notice`). Kolay mod sorulmaz; duraklatma ekranında "Yardımı kapat" anahtarı (saflar için) önerilir (Açık soru 9). DDA etkin durumu telemetriye yazılır; böylece kazanma oranı "yardımlı" ve "yardımsız" ayrı okunur.
Bugünkü gizli yardım (can tamamlanması, B6) korunur ama tabloya dahil sayılır.

### 3.7 Skor, yıldız ve süre bonusu [V13]
- **Yıldız (bölüm başına en çok 3):**
  - ★1: bölümü bitir.
  - ★2: en çok 2 vuruş yiyerek bitir (vuruş = `damagePlayer` çağrısı, kalkan emişi sayılmaz).
  - ★3: hasarsız bitir ("Dokunulmaz" rozeti).
  - Boss ve mini-boss bölümlerinde ★3 yine hasarsızdır ama ★2 eşiği 3 vuruştur.
- Hedef dağılım: ilk geçişte ★≥2: %35-45; ★3: %8-15; hasarsız rozeti çoğu oyuncunun "ikinci tur" nedenidir.
- **Süre bonusu:** bugünkü `kalan sn x 2` korunur (puan); yıldıza girmez. Zamanlı kristal bölümlerinde (w1-07, w2-08) ek "hız rozeti" ★'dan bağımsız.
- **Bölüm puanı:** `scoreLevelBonus x (bölüm no)` 27 bölümde 2700'e çıkar; 3 perde için bölüm no yerine perde içi sıra x perde çarpanı önerilir (puan şişmesi; kritik değil).
- Yıldızlar yalnız meta ilerlemeyi besler, bölümleri KİLİTLEMEZ (kilitleme sürtünme yaratır).

### 3.8 Çalışılmış örnekler
**Örnek A, w1-02 (öğret, kristal).** `P(1) = 3.4` (Hp 3.2; Wf 1.05 x Pd 1.05 = D 1.10; `3.2 x (1 + 0.35·log2 1.10) = 3.35`). Hedef p = %90 → `Z = 1.10`. `B30 = 1.10 · 1.85 · 3.4 / 0.75 = 9.2`. Bs payı 0.5 → 4.6: `ghost:1 bat:2` = 1.1 + 3.4 = 4.5. λ* = (9.2 − 4.5)/30 = 0.16 TP/sn; dalga `bat+ghost` TP = 2.8 → `every = 2.8/0.16 = 17,5` → sınır 12 → gerçek λ = 0.233 → `B30 = 4.5 + 7.0 = 11.5`, `Z = 1.36` (p .84): sapma +%24 > %15 → **elle ayar**: `start ghost:1 bat:1` (2.8), `every 12` → `B30 = 2.8 + 7.0 = 9.8`, `Z = 1.17` (p .88): kabul. Eski karşılığı: cave `B30 = 19.3` (Z 2.30): yeni plan w1-02'yi yaklaşık yarıya indiriyor.

**Örnek B, w1-07 (zamanlı kristal; Kurt tanıtımı).** `P(6) = 7.9` (Yıldırım, Kalkan, Işınlan açık). p = %72 → `Z = 1.75`, `X = .85` → `B30 = 1.75·1.85·7.9/.85 = 30.1`. `start ghost:3 bat:3 wolf:3` = 3.3 + 5.1 + 7.2 = 15.6 (= %52); λ* = (30.1 − 15.6)/30 = 0.49; dalga `wolf+bat` = 4.1 → `every = 8.4 → 8`; gerçek λ = 0.51 → `B30 = 31.0`, `Z = 1.80`: kabul. Mevcut pass bölümüyle (B30 = 52.2, `Z = 4.48`) karşılaştır: aynı Kurt tanıtımı, yarısı kadar baskı; ayrıca Işınlan bu bölümden ÖNCE verilir (w1-06 ödülü).

**Örnek C, w2-09 (Perde II sınavı, Elit Şövalye III + Rahipler).** `P(17) = 13.7`. p = %45 → `Z = 2.70`, `X = 1.4` → `B30 = 2.7·1.85·13.7/1.4 = 48.9`. `fixed = TP(knight_iii) = 12.6`; kalan palet `priest:2 archer:2 wolf:1` = 5.4 + 4.0 + 2.4 = 11.8 → `Bs = 24.4~24.7`; λ* = 0.8; dalga `archer:2 ghost:2` = 6.4 / `every 8` = 0.8 → `B30 = 48.6`, `Z = 2.69`.

**Örnek D, w3-09 (final boss).** `P(26) = 14.2`, p = %38 → `Z = 3.0`, `X = 2.2` → `B30* = 3.0·1.85·14.2/2.2 = 35.8`. Mevcut castle parametreleri: `Bs = 14.6`, λ ≈ 0.5 → `B30 = 29.6` → `Z = 2.49` (p ≈ .50): hedefin ~%20 altında. Çare: hp değiştirmeden faz 2 çağrı aralığını 6 → 5 sn, faz 1 çağrısına `cap` ekle (B7), faz 3 savunmasız süresini 6 → 5 sn. Boss için asıl doğrulama bot + oyuncu testidir (model set-piece'i zayıf yakalar, [V6]).

---

## 4. Kampanya yapısı ve bölüm sayısı

### 4.1 Karar: 3 perde x 9 bölüm = 27
Gerekçe:
- **Üretim yükü:** bölüm = config girdisi + 2 görsel (`image` 3:2, `nodeImage` kare; şema `art` alanları) + intro/outro metni + harita düğümü. 27 bölümün 9'u mevcut; 18 yeni. Tema başına dekor/müzik config'tedir (aşağı). 30 bölüm şema sınırıdır; 27, üç adet eşit perde ve 3 adet şema payı (bölüm/tema) bırakır.
- **Retention:** ~56-74 dk toplam oyun [V7][V8] = 6-7 oturum; 24 bölüm (3x8) ~55 dk, ancak perde başına nefes + 2 mini-boss + final ritmini sıkıştırır; 30 bölüm ~82 dk, üretim yükü +%11 ve perde 3 tekrarı artar. 27 dengelidir. Açık soru 1.
- **Doğrulayıcı/şema uyumu:** `levels` ≤ 30, `themes` ≤ 24 (planlanan 22).

**Mevcut 9 → yeni kimlik göçü** (kayıt göç haritası gerekir, B10):
| Mevcut id | Yeni id | Not |
|---|---|---|
| forest | w1-01 | hedef 6 → 25 kristal (süre 60) |
| cave | w1-02 | |
| golems | w1-03 | |
| graveyard | w1-05 | aradaki w1-04 yeni |
| pass | w1-07 | "hayatta kal" yerine zamanlı kristal; hayatta kal w1-04'e taşındı |
| village | w1-08 | 3 totem korunur |
| tower | w1-09 | Perde I sınavı |
| crystals | w2-02 | Rahip tanıtımı |
| castle | w3-09 | final boss |
Senarist notu: tower outro'sunun "Kale kapısı açıldı" ve crystals outro'sunun "Kalbin son kırığı kalede" cümleleri yeni yerleşimde uyuşmaz; senarist yeniden yazar.

### 4.2 Yeniden kullanım stratejisi (tema/dekor/düşman)
- **Tema = yalnızca config** (renk, sis, hava, müzik parametreleri). `floorKind` (9 tür) ve `scenery` (9 tür) birbirinden bağımsız seçilir; 81 kombinasyon yeni sanat gerektirmez [V15]. Planda 9 mevcut tema + 13 yeni varyant = 22 (şema üst sınırı 24).
- **Düşman = mevcut 10 tür** + 3 elit Şövalye girdisi (yalnızca hp/hız). Yeni model YOK.
- **Yeni görsel yük:** bölüm kapağı + düğüm görseli (27 x 2 = 54, 18 yeni x 2 = 36) ve tema varyantı başına müzik ayarı (config). Aynı temayı tekrar kullanan bölümler (`yeniden kullanım`) mevcut kapak görselini yeniden renklendirebilir.
- **Doğrulama:** varyant temaların `scenery`/`floorKind` ile gizli bağlarının (örn. `seed`) olup olmadığı `render/` kodunda kontrol edilecek [V15].

### 4.3 Perde yapısı (şablon)
Her perde 9 bölüm: `01 nefes`, `02 öğret`, `03 öğret/uygula`, `04 uygula`, `05 öğret/tırman`, `06 nefes`, `07 tırman`, `08 tırman/sınav`, `09 perde sonu sınavı`. Z hedefleri 1.0-1.5 ile başlar, perde içinde 2.0-2.7'ye tırmanır; w?-06 hep düşük.

| Perde | Ad (yer tutucu) | Rol | Yeni düşman (sıra) | Yeni hedef | Yeni büyü/yetenek |
|---|---|---|---|---|---|
| I | "Uyanış" | Öğretim; her şeyi tanıt | Ruh (01), Yarasa (02), Taş Bekçi (03), Okçu (05), Kurt (07), Kor (08), Şövalye (09) | kristal, hayatta kal (04), totem (06), zamanlı kristal (07), mini-boss (09) | Buz, Üçlü, Kalkan, Yıldırım, Işınlan, Zehir |
| II | "Kırık Yol" | Kombinasyon ve yeni hedefler | Rahip (02); eski düşmanların kombinasyonu | dalga savunması (03), zamanlı kristal + hasarsız rozeti (08) | Meteor (03), Ay Halkası (06), Zaman Çatlağı (08) |
| III | "Gece Kalbi" | Ustalık sınavı, final | yok (yeni düşman yok; kalite artışı) | bölge tut (03), eskort (06), 6 dalga (08) | yok (yeni büyü yok; ustalık) |
Boss/mini-boss yerleşimi: mini-boss: w1-09 (Şövalye), w2-05 (II), w2-09 (III), w3-05 (IV); final boss: w3-09. Toplam 4 mini-boss + 1 boss = 5/27 bölüm (%18.5).

### 4.4 Tüm bölümlerin tek tabloda özeti
Hedef türlerinden `*` işaretliler yeni kod ister (bölüm 5). `Savaş süresi` = beklenen kusursuz savaş süresi [V11]; `goal` kristalde `süre / 2.4` [V1]; `time` limiti kristalde 1.7x, zamanlıda 1.25x, totem 2x, mini-boss 1.6x, dalga/bölge 1.8x (şema üst sınırı 300 sn); hayatta kal'da `time = goal`. `B30` bölüm 3'ün hedef değeri, `Z` hedef endeks.

| id | Ad (yer tutucu) | Tema | Hedef | Savaş sn | goal | time | B30 | Z | İlk deneme | Rol | Yeni öğe | Ödül |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| w1-01 | Orman | forest (mevcut) | kristal | 60 | 25 | 105 | 7.4 | 1.00 | %92 | Nefes/Öğret | Hareket, kristal, Ateş Topu; ilk zafer | Buz Oku |
| w1-02 | Mağara | cave (mevcut) | kristal | 70 | 29 | 120 | 9.8 | 1.17 | %88 | Öğret | Yarasa (hızlı, zikzak) | - |
| w1-03 | Harabe | golems (mevcut) | kristal | 80 | 33 | 140 | 12.3 | 1.35 | %85 | Öğret | Taş Bekçi (dayanıklı) | Üçlü Büyü |
| w1-04 | Alacakaranlık Ormanı | forest-dusk (YENİ) | hayatta kal | 60 | 60 | 60 | 11.3 | 1.36 | %84 | Uygula | Hayatta kal hedefi; kristal kalp çeker | Mana Kalkanı |
| w1-05 | Mezarlık | graveyard (mevcut) | kristal | 90 | 38 | 155 | 21.4 | 1.60 | %77 | Öğret | Kemik Okçu: mermi kaçışı | Yıldırım |
| w1-06 | Buz Mağarası | cave-ice (YENİ) | totem (1) | 75 | 1 | 150 | 15.6 | 1.26 | %86 | Nefes/Öğret | Totem hedefi (tek totem) | Işınlan |
| w1-07 | Geçit | pass (mevcut) | zamanlı kristal | 75 | 31 | 95 | 31.0 | 1.80 | %71 | Öğret | Kurt Ruhu hücumu; Işınlan kullanımı | - |
| w1-08 | Köy | village (mevcut) | totem (3) | 100 | 3 | 200 | 30.7 | 1.98 | %65 | Tırman | Kor Hortlak: patlama | Zehir Bulutu |
| w1-09 | Kule | tower (mevcut) | mini-boss | 75 | 1 | 120 | 30.3 | 2.56 | %48 | Sınav | Şövalye yer şoku; Perde I sınavı | - |
| w2-01 | Şafak Mezarlığı | graveyard-dawn (YENİ) | kristal | 80 | 33 | 140 | 29.4 | 1.26 | %86 | Nefes | Gözden geçirme; perde başı tam can | - |
| w2-02 | Kristal Yatağı | crystals (mevcut) | kristal | 100 | 42 | 170 | 37.5 | 1.53 | %79 | Öğret | Karanlık Rahip | - |
| w2-03 | Fırtına Geçidi | pass-blizzard (YENİ) | dalga savunması* (4) | 120 | 4 | 220 | 32.8 | 1.70 | %74 | Uygula | Dalga savunması hedefi | Meteor |
| w2-04 | Alevli Köy | village-ember (YENİ) | kristal | 110 | 46 | 190 | 50.3 | 1.86 | %69 | Tırman | Kor + Kurt kombinasyonu | - |
| w2-05 | Ay Kulesi | tower-moon (YENİ) | mini-boss | 90 | 1 | 145 | 36.8 | 2.44 | %52 | Sınav | Elit Şövalye II (hp 36) | - |
| w2-06 | Alacakaranlık Ormanı II | forest-dusk (yeniden) | hayatta kal | 90 | 90 | 90 | 31.7 | 1.44 | %81 | Nefes | Uzun ama sakin | Ay Halkası |
| w2-07 | Kızıl Harabe | golems-dusk (YENİ) | totem (3) | 120 | 3 | 240 | 46.5 | 2.03 | %63 | Tırman | Totem + Rahip kalkanı | - |
| w2-08 | Kızıl Kristal | crystals-red (YENİ) | zamanlı kristal | 85 | 35 | 110 | 59.4 | 2.20 | %58 | Sınav/Tırman | Hasarsız rozeti | Zaman Çatlağı |
| w2-09 | Harap Kale | castle-ruin (YENİ) | mini-boss | 120 | 1 | 195 | 48.6 | 2.69 | %45 | Sınav | Elit Şövalye III + Rahipler | - |
| w3-01 | Gece Ormanı | forest-night (YENİ) | kristal | 90 | 38 | 155 | 51.6 | 1.53 | %79 | Nefes | Perde başı tam can | - |
| w3-02 | Buz Sürüsü | cave-ice (yeniden) | hayatta kal | 100 | 100 | 100 | 44.0 | 1.73 | %73 | Uygula | Kurt + Yarasa sürüsü | - |
| w3-03 | Kutsal Halka | hold-arena (YENİ) | bölge tut* (60 sn) | 100 | 60 | 180 | 52.1 | 2.03 | %63 | Uygula | Bölge tut hedefi | - |
| w3-04 | Kor Köy II | village-ember (yeniden) | totem (3) | 130 | 3 | 260 | 52.5 | 2.04 | %63 | Tırman | Patlama zinciri + Rahip | - |
| w3-05 | Kemik Kule II | tower-moon (yeniden) | mini-boss | 100 | 1 | 160 | 47.1 | 2.56 | %48 | Sınav | Elit Şövalye IV (hp 60) | - |
| w3-06 | Pırıl'ın Yolu | crystals-void (YENİ) | eskort* | 110 | 1 | 200 | 35.8 | 1.52 | %79 | Nefes | Eskort (yedek: sakin kristal) | - |
| w3-07 | Kristal Kapısı | crystals-void (yeniden) | kristal | 120 | 50 | 205 | 81.2 | 2.34 | %54 | Tırman | Tüm düşman karması | - |
| w3-08 | Son Savunma | castle-ruin (yeniden) | dalga savunması* (6) | 150 | 6 | 270 | 68.2 | 2.61 | %47 | Sınav | 6 dalga final sınavı | - |
| w3-09 | Gölge Kalesi | castle (mevcut) | boss | 180 | 1 | 300 | 29.6 (hedef 35.8) | 2.49 (hedef 3.0) | %50 (hedef %38) | Final | Gölge Kral 3 faz | - |

Boss/mini-boss "ilk deneme" %48-52 gibi küçük farklar, yuvarlama sonrası tasarım Z'sinin hedeften sapmasıdır (bölüm 3.5); validator bunu ±%15'e çeker.

Beklenen oynama süresi (beklenen deneme sayısı 1/p, başarısız deneme maliyeti = 0.6 x savaş süresi + 8 sn, bölüm arası 25 sn [V7][V8]): Perde I ≈ 18 dk, Perde II ≈ 25 dk, Perde III ≈ 31 dk, **toplam ≈ 74 dk** (kusursuz ≈ 56 dk). Kümülatif dakika: w1-01 1 · w1-03 5 · w1-05 9 · w1-07 13 · w1-09 18 · w2-05 31 · w2-09 43 · w3-05 57 · w3-09 74. Yani ilk oturumda (12 dk) 5-6 bölüm, 2. gün Perde I'in sonu, 3.-4. oturum Perde II, 5.-7. oturum Perde III. Mevcut oyun: 6.9-10.3 dk.

### 4.5 Taslak bölüm parametreleri (doğma algoritması çıktısı + elle ayar)
`start` ve dalga tür kimlikleri config `enemies` anahtarlarıdır; `speedMul` Perde I 1.0, II 1.05, III 1.10 (yeni alan). Elle ayar işaretli satırlar bölüm 3.8'de gerekçelidir.

| id | start | spawn dalgası | every | cap | Bs | λ | B30 | Z tasarım |
|---|---|---|---|---|---|---|---|---|
| w1-01 | ghost:3 | ghost:1 | 8 | 6 | 3.3 | 0.14 | 7.4 | 1.00 |
| w1-02 (elle) | ghost:1 bat:1 | bat:1 ghost:1 | 12 | 6 | 2.8 | 0.23 | 9.8 | 1.17 |
| w1-03 (elle) | ghost:1 bat:1 golem:1 | golem:1 bat:1 | 12 | 7 | 4.3 | 0.27 | 12.3 | 1.35 |
| w1-04 | ghost:1 bat:1 golem:1 | ghost:1 bat:1 | 12 | 6 | 4.3 | 0.23 | 11.3 | 1.36 |
| w1-05 | ghost:2 bat:2 golem:1 archer:2 | ghost:1 archer:1 | 9 | 9 | 11.1 | 0.34 | 21.4 | 1.60 |
| w1-06 (elle) | ghost:1 bat:1 + 1 totem | ghost:1 bat:1 | 12 | 6 | 5.8 | 0.33 | 15.6 | 1.26 |
| w1-07 | ghost:3 bat:3 wolf:3 | wolf:1 bat:1 | 8 | 11 | 15.6 | 0.51 | 31.0 | 1.80 |
| w1-08 | ghost:1 ember:2 golem:1 + 3 totem | ember:1 ghost:1 | 12 | 7 | 15.2 | 0.52 | 30.7 | 1.98 |
| w1-09 | knight:1 archer:2 wolf:1 | archer:1 ghost:1 | 6 | 6 | 14.8 | 0.52 | 30.3 | 2.56 |
| w2-01 | ghost:3 bat:3 archer:2 golem:2 | ghost:1 archer:1 | 7 | 11 | 15.8 | 0.45 | 29.4 | 1.26 |
| w2-02 | ghost:2 bat:2 archer:2 priest:3 | priest:1 bat:1 | 7 | 11 | 18.2 | 0.65 | 37.5 | 1.53 |
| w2-03 | wolf:2 bat:2 ghost:3 | wolf:1 bat:1 | 6 | 9 | 11.8 | 0.70 | 32.8 | 1.70 |
| w2-04 | ember:4 wolf:4 golem:2 archer:2 | ember:1 wolf:1 | 5 | 12 | 24.4 | 0.86 | 50.3 | 1.86 |
| w2-05 | knight_ii:1 archer:2 wolf:2 | archer:1 wolf:1 | 8 | 7 | 19.8 | 0.56 | 36.8 | 2.44 |
| w2-06 | ghost:3 bat:3 golem:1 | ghost:2 bat:2 | 8 | 9 | 10.2 | 0.72 | 31.7 | 1.44 |
| w2-07 | golem:2 priest:2 ember:2 archer:1 + 3 totem | ember:1 archer:1 | 8 | 9 | 23.4 | 0.77 | 46.5 | 2.03 |
| w2-08 | bat:4 archer:4 wolf:3 priest:3 | archer:2 bat:2 | 8 | 12 | 30.9 | 0.95 | 59.4 | 2.20 |
| w2-09 | knight_iii:1 priest:2 archer:2 wolf:1 | archer:2 ghost:2 | 8 | 8 | 24.7 | 0.80 | 48.6 | 2.69 |
| w3-01 | ghost:4 bat:4 archer:3 wolf:3 | bat:2 archer:2 | 9 | 12 | 25.7 | 0.87 | 51.6 | 1.53 |
| w3-02 | wolf:3 bat:3 ghost:2 | wolf:2 bat:2 | 9 | 10 | 15.3 | 0.96 | 44.0 | 1.73 |
| w3-03 | golem:3 archer:2 ember:2 wolf:2 | ember:2 archer:2 | 7 | 11 | 17.8 | 1.14 | 52.1 | 2.03 |
| w3-04 | ember:3 priest:2 golem:2 wolf:1 + 3 totem | ember:1 priest:1 | 8 | 10 | 26.0 | 0.88 | 52.5 | 2.04 |
| w3-05 | knight_iv:1 archer:2 wolf:1 priest:1 | archer:1 wolf:1 | 6 | 7 | 24.0 | 0.77 | 47.1 | 2.56 |
| w3-06 | ghost:4 bat:4 archer:3 | ghost:2 bat:2 | 10 | 12 | 18.1 | 0.59 | 35.8 | 1.52 |
| w3-07 | archer:4 wolf:4 priest:4 ember:3 bat:3 | priest:2 wolf:2 | 8 | 12 | 40.9 | 1.34 | 81.2 | 2.34 |
| w3-08 | wolf:2 archer:2 priest:2 ember:2 golem:2 | wolf:2 archer:2 | 6 | 11 | 21.9 | 1.54 | 68.2 | 2.61 |
| w3-09 | boss:1 | (boss çağrıları, mevcut) | 6 | 8 | 14.6 | 0.50 | 29.6 | 2.49 (hedef 3.0, bölüm 3.8-D) |

Notlar: w3-07'nin 18 başlangıç düşmanı `cap` 12'nin 1.5 katı; mobil sahnede başlangıç anında yoğunluk testi şarttır [V14]. Dalga/bölge/eskort bölümlerinde `spawn/every` bugünkü motorla "hayatta kal" gibi çalışır; hedef türü kodu eklenince dalga ve bölge kuralları devreye girer (bölüm 5).

### 4.6 Nefes bölümlerinin işaretleri
w1-01, w1-06, w2-01, w2-06, w3-01, w3-06: hedef Z ≤ 1.5, ilk deneme ≥ %78; ödül verilen bir bölümden hemen sonra gelir veya perde başı tam can (`worldStartHeal`) vardır; duygusal/hikâye anı için uygundur (senarist). Zirve (5, 8, 9. bölümler) hemen ardından nefes gelmez; ardından gelen perde başı nefestir.

---

## 5. Yeni mekanik/içerik ihtiyaçları ve maliyet

### 5.1 Yalnızca config ile yapılabilenler (kod yok)
| Öğe | Not |
|---|---|
| 13 yeni tema varyantı | `themes` girdisi; `floorKind`/`scenery` kombinasyonu; renk, sis, hava, müzik [V15] |
| 18 yeni bölüm girdisi | `levels`, `campaign.order`, `edges`, `map` konumu |
| 3 elit Şövalye (`knight_ii..iv`) | `enemies`, `model: "knight"` [V16] |
| Zamanlı kristal koşusu | `objective: crystal` + sıkı `time` + `crystals: 2-3` |
| Perk `maxStacks` sınırları | hız 3, güç 5, el hızı 4, mıknatıs 2, taş deri 3 [V4] |
| Ödül takvimi | `reward`/`ability` alanları (bölüm 4.4) |
| Kozmetik renk paketleri | `player.look` alanları zaten config'te |

### 5.2 Kod isteyenler (geliştirici maliyeti: küçük / orta / büyük)
| # | İş | Maliyet | Dosyalar | Retention etkisi |
|---|---|---|---|---|
| 1 | Hızlı tekrar dene (kartı atla, otomatik başla) | küçük | `flow.js`, `ui/result.js` | çok yüksek |
| 2 | Doğma noktası oyuncudan ≥ 8 birim; boss faz1 `cap`; doğma tamponu | küçük | `world.js`, `ai.js`, `loop.js` | yüksek (haksız ölüm) |
| 3 | Yerel telemetri + admin "Sağlık" sekmesi | orta | yeni `core/telemetry.js`, kancalar, `admin/` | ölçüm şart |
| 4 | Bot/simülasyon aracı | orta | yeni `tools/balance/` | ölçüm şart |
| 5 | Doğrulayıcı: TP/B30/Z hesabı, yeni W_BALANCE kuralları, çoklu boss | küçük-orta | `config/validate.js`, `schema.js` | önleme |
| 6 | DDA (düşman akışı/can/kalp çarpanları + bilgi satırı) | küçük-orta | `flow.js`, `loop.js`, `combat.js` | yüksek |
| 7 | Yıldız/hasar sayacı + kayıt şeması genişletmesi | orta | `combat.js`, `core/save.js`, harita/bölüm sonu UI | orta-yüksek |
| 8 | `levels.*.enemySpeedMul`, `tempo`, `worldStartHeal`, bölüm başına mini-boss metni | küçük | `adapt.js`, `world.js`, `loop.js`, `schema.js` | orta |
| 9 | Perde (dünya) harita seçimi, 27 düğüm | orta | `ui/map.js`, `core/data.js` (`worlds`) | orta |
| 10 | Dalga savunması hedefi (`waves`) | orta | `loop.js`, `flow.js`, `schema.js` | orta |
| 11 | Bölge tut hedefi (`hold`) | orta | yeni bölge nesnesi, `loop.js`, render | orta |
| 12 | Mini-boss sayacı (bir bölümde 1+ boss; her zaman ilk ölümde bitmesin) | küçük | `combat.js:69` | düşük |
| 13 | Eskort hedefi (Pırıl'ı koru) | büyük | yeni ally AI, hedefleme, render | düşük-orta; ertelenebilir |
| 14 | "Gece Yarığı" sonsuz mod | orta-büyük | yeni mod akışı, bölüm üreticisi, ayrı kayıt | yüksek |
| 15 | Tohumlu günlük bölüm (Math.random → `mulberry`) | orta | `world.js`, `loop.js`, `weapons.js`, `util.js` | orta-yüksek |
| 16 | Yeni perk türleri (hp'si dışında yeni `stat`) | orta | `adapt.js`, `loop.js`, `combat.js` | orta |
| 17 | Yıldız kozmetik/ansiklopedi ekranları | orta | yeni `ui/*` | orta |

### 5.3 Öncelik sırası (retention etkisi / maliyet)
1. Hızlı tekrar dene (1) + doğma adaleti (2): en ucuz, en yüksek.
2. Ölçüm: telemetri (3) + bot (4) + doğrulayıcı (5): sonraki her karar buna dayanır.
3. Perk sınırları (config) + mevcut 9 bölümün yeniden dengesi (config) + DDA (6).
4. Yıldız (7) + perde haritası (9) + `enemySpeedMul/tempo` (8).
5. Dalga savunması (10), mini-boss sayacı (12), bölge tut (11).
6. Perde II/III içeriği (config).
7. Gece Yarığı (14), günlük bölüm (15), yeni perk'ler (16), ansiklopedi (17).
8. Eskort (13): en son, belki hiç (w3-06'nın yedeği hazır).

### 5.4 Yeni içerik önerileri (üretimi pahalı olanlar, değerlendirildi)
- **Yeni düşman:** gerekmiyor; yeni düşman yerine elit/varyant ve kombinasyon. Kalite artışı için `enemySpeedMul`.
- **Yeni büyü:** gerekmiyor (7 büyü, 27 bölüme yetiyor); ama dengede Yıldırım'ın menzil/hasar kısıtı gerekebilir (B8; telemetriye bak).
- **Yeni perk:** 26 seçimde havuz biter; orta vadede 4-6 yeni perk önerilir (örn. kalkan süresi, Işınlan bekleme azaltma, Zehir/Meteor alan genişletme, kritik, yeniden doğma kalbi): Aşama 5.
- **Yeni hedef türü:** dalga, bölge, eskort; zamanlı koşu ve hasarsız rozeti ucuz.

---

## 6. Meta-ilerleme ve oyunda tutma

KAPSAM DIŞI: hesap, skor tablosu, çok oyunculu, ödeme, push bildirimi. Hepsi `localStorage`.

| Öneri | Ne | Neden geri döner | Maliyet | localStorage | Güç dengesini bozar mı |
|---|---|---|---|---|---|
| **Yıldızlar** (81) | ★1/★2/★3 (bölüm 3.7), haritada düğüm üstünde | eksik yıldız tamamlama | orta | evet (`save.best.levels`'e `stars`) | hayır |
| **Kozmetik** | asa/cüppe/şapka renk paketi; yıldız eşikleri 10/25/45/65/81'de açılır | koleksiyon + kimlik | küçük (`player.look` zaten config) | evet (`unlockedLooks`) | hayır |
| **Ansiklopedi** | görülen düşman/büyü/perk kartı + "öldürme sayısı" | koleksiyon | orta | evet (`seen`) | hayır |
| **Gece Yarığı** (sonsuz dalga) | kampanya bitince açılır; dalga k için `B(k) = B0·1.06^k`, 5. dalgada mini-boss, 10.'da boss; her 3 dalgada perk; ölünce biter; en iyi dalga/puan kayıtlı | bitmeyen "bir tur daha" | orta-büyük | evet (`yarik.best`) | hayır (koşu içi güç) |
| **Günlük bölüm** | tarih (UTC gün) tohumlu: aynı bölüm düzeni/düşman/perk teklifi, sabit modifier (örn. "çift hızlı düşman", "tek can + bol kalp"); kişisel en iyi + gün serisi | günlük alışkanlık | orta | evet (`daily.{gün:skor}`, `streak`) | hayır |
| **Haftalık meydan okuma** | günlüğün 7 gün sabit, daha uzun versiyonu | haftalık dönüş | küçük (günlüğün üstüne) | evet | hayır |
| **Mana Özü kalıcı yükseltme** | bölümde toplanan özle başlangıç canı/hız/bekleme küçük kalıcı artış | ilerleme duygusu | orta | evet | **EVET** |

**Öneri:** ilk beşi (yıldız, kozmetik, ansiklopedi, Gece Yarığı, günlük) yap; Mana Özü kalıcı güç yükseltmesini YAPMA: `P(n)` modelini ve tüm hedef geçme oranlarını kaydırır, her kullanıcı için farklı zorluk üretir, bot/oyuncu testini zorlaştırır. İsteniyorsa üst sınır ≤ +10% `P` ve modele dahil edilir (Açık soru 5).
"Gece Yarığı" kampanya tamamlanınca açılır; yıldız toplamı 27'ye ulaşınca "çıraklık modu" (sonsuz) kilidi de açılabilir.
**Kayıt:** şemanın `v` alanı artırılır, eski kayıtlar göç haritasıyla taşınır; `best.levels[id].time` hayatta kal'da anlamsızdır, yerine `bestHits`/`stars` eklenir.
Neden geri döner özeti: (1) yarım yıldız, (2) günlük/haftalık meydan okuma ve seri, (3) koleksiyon (kozmetik/ansiklopedi), (4) sonsuz mod skoru, (5) perde içeriği damlatması (yeni perde yayınları). Telemetri olmadan "geri dönüş" ölçülemez (hesap yok); self-report ve oyuncu testi gerekir [V13].

---

## 7. Doğrulama ve denge araçları (mühendislik planı)

### 7.1 Şemaya eklenecek alanlar (öneri; henüz yazılmadı)
```jsonc
"difficulty": {
  "tp": { "hpExp": 0.45, "speedBase": 0.5, "speedK": 0.25,
          "ai": { "chase": 1, "ranged": 1.5, "charge": 1.3, "bomber": 1, "support": 1.5, "knight": 1.3, "boss": 1.5 },
          "totem": 3.0 },
  "anchor": { "level": "w1-01", "B30": 7.4, "P": 3.0, "X": 0.75 },
  "z":  { "z50": 2.5, "s": 0.375 },
  "obj": { "crystal": 0.75, "timed": 0.85, "survive": 1, "waves": 1, "hold": 1, "totem": 1, "escort": 1.1, "miniboss": 1.4, "boss": 2.2 },
  "dda": { "enabled": true,
           "tiers": [ {"deaths":2,"spawnMul":0.90,"startMul":0.85,"heartMul":1.25},
                      {"deaths":3,"spawnMul":0.80,"startMul":0.75,"heartMul":1.5,"bonusHp":1},
                      {"deaths":4,"spawnMul":0.70,"startMul":0.65,"heartMul":2.0,"bonusHp":1,"startShield":true,"timeMul":1.2} ],
           "streak": {"wins":3,"spawnMul":1.05,"max":1.15}, "floor": 0.6 },
  "stars": { "two": 2, "three": 0, "bossTwo": 3 },
  "mobileCap": 12
},
"worlds": {
  "w1": { "name": "...", "enemySpeedMul": 1.0, "startHeal": true, "levels": ["w1-01", "..."] },
  "w2": { "enemySpeedMul": 1.05, "...": "..." }, "w3": { "enemySpeedMul": 1.1, "...": "..." }
},
"levels.<id>": {
  "world": "w1", "index": 1, "role": "teach|apply|master|exam|breather",
  "threat": { "pass": 0.92, "B30": 7.4, "z": 1.0 },       // hedef; üretici/doğrulayıcı karşılaştırır
  "tempo": "flat|pulse|ramp",
  "objectiveText": "…",                                      // mini-boss/boss adı için (B10)
  "modifier": "noHit"                                        // isteğe bağlı rozet
}
```
`threat` ve `difficulty` blokları oyun çalışmasını etkilemez (yalnız doğrulayıcı/araç okur); `tempo`, `enemySpeedMul`, `worldStartHeal`, `dda` oyunu etkiler. Mevcut `schemaVersion: 1` artırılır; `migrate.js` eksik alanları varsayılanla doldurur.

### 7.2 Bölüm üreticisi ve doğrulayıcı (W_BALANCE genişlemesi)
Üretici (`tools/balance/plan.mjs`): bölüm 3.5 algoritması; girdi hedef p/rol/palet, çıktı `start/spawn/every/cap` + `Z_tasarım`. Doğrulayıcı kuralları (`validate.js`, `W_BALANCE` uyarısı):
| Kural | Eşik |
|---|---|
| Z sapması | \|Z_tasarım / Z_hedef − 1\| > %15 |
| Ardışık sıçrama | Z(n)/Z(n−1) > 1.35 ve n "sınav/tırman" değil |
| Yeni düşman/hedef | bir bölümde 1'den fazla yeni düşman türü ya da yeni düşman + yeni hedef türü |
| Perde başı | w?-01 Z > önceki bölümün Z'sinin %75'i |
| `cap` mobil | > `mobileCap` (12) |
| Başlangıç yoğunluğu | `start` toplamı > 1.5 x `cap` |
| Süre payı | kristal: `time` < 1.4 x (`goal` x 2.4) (süre baskısı fazla) ya da > 2.2 x (gevşek) |
| Mini-boss/boss sayısı | perde başına ≤ 2 mini-boss + 1 boss (bugünkü "1 boss" kuralı yerine) |
| Perk sınırı | sınırsız yığın (`maxStacks` yok) olan stat perk'i |
| Ödül tekrarı | mevcut kural korunur |
| Bölüm başına goal/time uyumu | mevcut `goal x 3 > time` kuralı kaldırılır (t_c = 2.4 sn, modelden okunur) |

### 7.3 Yerel telemetri (gizlilik: kişisel veri yok, dışarı gönderim yok)
- **Anahtar:** `localStorage["buyucu_telemetri"]`, `v: 1`, <10 KB; kişisel kimlik, IP, cihaz kimliği, ağ isteği YOK. Oyuncu "Telemetriyi sil" ile sıfırlayabilir; kayıttan (`buyucu_save`) bağımsızdır.
- **Bölüm başına:** `att` (deneme), `win`, `die`, `quit` (haritaya dön), `timeout`, `firstTryWin`, `sumWinSec`, `sumDieSec`, `bestSec`, `hits` (`contact|shot|hazard|blast` kaynak dökümü), `stars{1,2,3}`, `maxDdaTier`, `weaponCasts{...}`, `perkPicks{...}`, `crystalSec` (kristal başına ortalama), `deathPos` (grid hücresi sayacı, 7x7).
- **Oturum:** son 30 oturum: başlangıç tarihi (yalnız gün), süre, oynanan bölüm sayısı.
- **Gösterim:** admin sayfasında "Sağlık" sekmesi (`js/admin/`, mevcut "Doğrulama" yanında): tablo, hedef `p` ile gerçek karşılaştırması (yeşil ±10 puan, sarı ±20, kırmızı >20), kalan alarmlar:
  - 3 art arda bölümde ilk deneme > %95 (sıkıcı) · 2 art arda < %35 (çok zor)
  - `timeout` payı > %10 (süre baskısı fazla)
  - tek bir kaynaktan ölümlerin > %60'ı (örn. `shot`: Okçu aşırı)
  - büyü payı: bir büyü > %60 (baskın strateji)
  - `quit` payı > %15 (bölüm sıkıntısı)
- **Dışa aktar/içe aktar:** oyuncu testinde 5-8 kişi kendi tarayıcısında oynar; "Telemetriyi kopyala" düğmesi JSON verir (yalnız toplamlar), admin "içe aktar" ile birleştirir. Dış sunucu yok; içe aktarma doğrulanır (boyut/tür; güvenlik odası gözden geçirir).
- **Kancalar:** `flow.js` (başlat/bitir/ölüm), `combat.js` (`damagePlayer` kaynağı), `weapons.js` (atış), `loop.js` (kristal toplama süresi).

### 7.4 Bot/simülasyon ile headless denge testi
İki katman:
1. **Soyut savaş modeli (Node, hızlı):** `tools/balance/sim.mjs`. `data/game.config.json`'u okur; 2B sürekli konum, `dt = 1/30`, aynı sabitler (`ai.js` süreleri, hızlar, dokunulmazlık). Motor `three`'ye bağlı olduğu için doğrudan yeniden kullanılamaz; sabitler tek bir `constants.mjs`'te toplanır ve bir paritelik testi (`ai.js` içindeki sayılarla karşılaştırma) eklenir. Çıktı: bölüm başına kazanma oranı, ortalama süre, ortalama vuruş, ölüm nedeni dökümü, `timeout` oranı. Mantık: seed'li (mulberry), bot başına N = 300 koşu; 27 bölüm x 4 bot x 300 = 32 400 koşu, ~244 M adım; Node'da kabaca birkaç dk [V17: ölçülecek].
2. **Gerçek motorda bot (yavaş, kesin):** `?dev=1&level=<id>&bot=<profil>` ile (zaten `devStart` var, `flow.js:61`) tarayıcıda otomatik oyun; Playwright ile başsız Chromium'da (test-yayın odası) boss ve set-piece bölümleri için. Soyut model boss/set-piece'te zayıftır [V6].

Bot profilleri (parametreler [V2]): 
| Bot | isabet | tepki | kaçma | büyü/yetenek |
|---|---|---|---|---|
| yürüyen | 0 (hiç ateş etmez) | - | basit potansiyel alan | yok |
| acemi | 0.40 | 0.35 sn | yakın düşmandan uzak durur | yalnız Ateş/Yıldırım |
| yetkin | 0.60 | 0.20 sn | okçu mermisi + kurt hücumu kaçışı | kural tabanlı seçim |
| usta | 0.85 | 0.10 sn | tahminli kaçış | tam yetenek kullanımı |
Perk seçimi: rastgele ve "açgözlü" iki politika.

**Kabul eşikleri (bot):**
- yetkin botun kazanma oranı hedef p'den ±12 puan içinde (başlangıç; gerçek oyuncu verisiyle bot-insan farkı ölçülüp bir ofset uygulanır).
- acemi bot ≥ 0.5 x yetkin; usta bot Perde I'de ≥ %90.
- yürüyen bot ≥ w1-05'ten itibaren ≤ %35 (silah kullanımı gerektiği kanıtı; B2). w1-01..04'te > %80 çıkarsa bu bölümlerin amacı "kaçma öğretmek" olarak kabul edilir ama büyü öğretimi ayrı hedefe taşınır.
- ardışık yetkin bot kazanma düşüşü > 25 puan ve "sınav" değil → sıçrama hatası.
- TP katsayılarının uydurulması: bot koşularında "düşman türü başına verdiği hasar" ve "öldürme süresi" ile TP'nin korelasyonu r ≥ 0.7 olmalı; değilse katsayı yeniden uydurulur.

### 7.5 Doğrulayıcı/test dosyaları
`tests/balance.model.test.js` (TP, B30, Z, p birim testleri; örnek A-D değerleri), `tests/balance.plan.test.js` (üretici tutarlılığı), `tests/telemetry.test.js` (şema, boyut sınırı, silme), `tests/save.test.js` (göç haritası), `tests/config.validate.test.js` (yeni W_BALANCE kuralları), `tests/dda.test.js` (ölüm → çarpan tablosu).

### 7.6 Oyuncu testi planı (5-8 kişi, hızlı) [V18]
- **Katılımcı:** 2 sıradan oyuncu, 2 oyuncu (masaüstü), 2 yalnız mobil, 1-2 acemi/çocuk veya ileri yaş.
- **Süre:** 20 dk oynama + 5 dk soru. Önceden hedef yok; "bırakmak istediğin an bırak".
- **Ölçüm (telemetriden):** bölüm başına deneme, ölüm, süre, `quit`; 12. dakikadan sonra isteyerek devam eden oran; ilk deneme geçme oranı.
- **Sorular:** (1) bölüm sonunda tek soru "kolaydı/zordu (1-7)" (SEQ), (2) "hangi ölüm haksızdı?", (3) "hangi bölümde sıkıldın?", (4) "yeni büyüyü ne zaman fark ettin; ne işe yaradığını anlatabilir misin?" (öğretim sınaması), (5) "yarın yine oynar mısın (1-5)?", (6) mobil: kontroller/kaydırma.
- **Kabul:** 5-8 kişide istatistik güveni düşüktür; bu yüzden eşikler "alarm" olarak kullanılır: bir bölümde ≥ 3 kişi ≥ 3 kez ölmüşse veya ≥ 2 kişi çıkmışsa o bölüm kırmızıdır; ilk oturumda ≥ %70'i 12. dakikadan sonra devam ediyorsa "çengel" çalışıyor; haksız ölüm raporu ölümlerin ≤ %10'u; öğretim sorusunu ≥ %80 doğru anlatıyorsa tanıtım yeterli. Gün-2 dönüş: self-report (hesap yok).
- **Turlar:** bot ayarı → test turu 1 (Aşama 1 sonu) → düzeltme → tur 2 (Perde II sonu).

---

## 8. Uygulama planı (aşamalı)

Boyut: S ≈ 0.5-1, M ≈ 2-4, L ≈ 5-10 iş günü [V19]. Odalar: mimari, gelistirme, test-yayin, analitik, guvenlik, icerik (görsel/ses), senarist, strateji (denge/bölüm parametreleri).

| Aşama | İçerik | Oda | Dosya/test | Boyut | Risk |
|---|---|---|---|---|---|
| **0 Ölçüm + ucuz düzeltme** | perk `maxStacks`; hızlı tekrar dene; doğma ≥ 8 birim + boss faz1 cap; telemetri + "Sağlık" sekmesi; bot (soyut) + yürüyen bot; doğrulayıcı kuralları | gelistirme, mimari, test-yayin, guvenlik | bölüm 7.5 testleri | M-L | bot sapması (V2); telemetri boyutu |
| **1 Perde I** | w1-01..09: mevcut 7'nin yeniden dengesi + 2 yeni bölüm; DDA; yıldız (★1/★2/★3) + kayıt göçü; ikinci oyuncu testi | strateji (parametre), gelistirme (DDA, yıldız, göç), senarist (metin), icerik (2 yeni tema/kapak) | `game.config.json`, `flow.js`, `combat.js`, `save.js`, testler | M-L | eski kayıt kaybı (B10); metin yeniden yazımı |
| **2 Altyapı** | `enemySpeedMul`, `tempo`, `worldStartHeal`, mini-boss sayacı/metni, elit Şövalye girdileri; dalga savunması; bölge tut; perde haritası | gelistirme, mimari | `adapt.js`, `schema.js`, `loop.js`, `ui/map.js` | L | harita UI; yeni hedeflerin mobilde okunurluğu |
| **3 Perde II** | w2-01..09 config + kapak/düğüm görseli + tema varyantları + metin; bot/oyuncu testi turu | strateji, icerik, senarist, test-yayin | `game.config.json`, `assets/art/` | L | görsel üretim yükü; w2-03 yeni hedefe bağlı |
| **4 Perde III** | w3-01..09 + final boss ince ayarı (faz 2/3 ayarı); eskort (ya da yedek) | strateji, gelistirme, icerik, senarist | boss parametreleri, `ai.js` | L | eskort kapsamı; final p hedefi tutmama |
| **5 Meta** | kozmetik, ansiklopedi, Gece Yarığı, tohumlu günlük, yeni perk'ler | gelistirme, icerik, strateji | yeni UI/mod/akış | L | kapsam şişmesi; tohumlu RNG değişikliğinin tüm Math.random yerlerine dokunması |

### Aşama çıkış kriterleri
- **Aşama 0:** (1) perk'lerde sınırsız yığın yok; (2) ölümden sonra tekrar deneme ≤ 1 tık ve 3 sn; (3) doğma oyuncudan ≥ 8 birim; (4) telemetri `buyucu_telemetri`'ye yazıyor, Sağlık sekmesi gösteriyor, boyut < 10 KB, dışarı istek yok; (5) bot 9 mevcut bölümde çalışıyor ve tablo 1.4'ü üretiyor; yürüyen bot sonucu B2'yi doğruluyor ya da çürütüyor; (6) yeni doğrulayıcı kuralları testli.
- **Aşama 1:** (1) yetkin bot kazanma oranları hedef p ±12 puan; (2) 5-8 kişilik testte ilk oturum 12 dk'da ≥ 5 bölüm ve ≥ %70 devam; (3) eski kayıtlar göçle korunuyor; (4) hiçbir bölümde ≥ %20'den fazla `timeout`; (5) yıldız ve DDA görünür ve testli.
- **Aşama 2:** yeni hedef türleri `?dev=1&level=` ile oynanır, mobilde 30 fps, `cap` 12'de kare süresi kabul edilebilir (cihaz testi), doğrulayıcı yeşil.
- **Aşama 3:** 9 bölüm; bot + oyuncu testi sonrası hiçbir bölüm kırmızı değil; perde başı tam can; Perde II tamamlama ortalaması 20-30 dk.
- **Aşama 4:** final boss ilk deneme geçme oranı %30-45 (bot ve oyuncu), 27 bölüm yeşil; kampanya tamamlama ≈ 74 dk ±%25.
- **Aşama 5:** günlük bölüm aynı tohumda aynı düzeni üretir (test); Gece Yarığı 30 dalgaya kadar çökmez; kayıt şeması göçle uyumlu.

---

## 9. Riskler ve açık sorular (Emre'ye)

### Riskler
| Risk | Etki | Önlem |
|---|---|---|
| Kapsam/maliyet: 18 yeni bölüm + 36 görsel + metin | gecikme | Perde başına yayın; Aşama 1'de 9 bölümle yayınla, ölç |
| Model yanlış kalibre (V3-V6) | hedefler tutmaz | bot + oyuncu testi; model "sıralama aracı", mutlak p değil |
| Eski kayıtlar kayboluyor (id göçü) | oyuncu öfkesi | göç haritası + test |
| Mobil performans: `cap` 12 + başlangıç 18 düşman | takılma | `mobileCap`, cihaz testi, `quality.js` kademeleri [V14] |
| DDA algılanıp "yardımla geçtim" hissi | tatmin azalır | görünür ve nazik metin, kapatma anahtarı |
| Boss/mini-boss modelin dışında | final zayıf/sert | bot + oyuncu, parametre ince ayarı (bölüm 3.8-D) |
| Perk havuzu 26 seçimde bitiyor | sıkılma | yeni perk (Aşama 5), `maxStacks` ayarı |
| Tekrar bölüm temaları (varyant) monotonluk | sıkılma | müzik/palet farkı; Perde III'te tek bölümde 2 tema karışımı yok |

### Açık sorular
1. **Bölüm sayısı:** 24 mü (3x8), 27 mi (önerim), 30 mu? Üretim yükü ve toplam süreyi etkiler.
2. **Hikâye finali:** Gölge Kral final w3-09 olsun (önerim); Perde I ve II sonlarında Şövalye mini-boss'ları kalsın. Onay?
3. **Oturum hedefi:** ilk oturum 10-15 dk / 5-6 bölüm, sonrakiler 12-18 dk uygun mu?
4. **Zorluk felsefesi:** cömert-orta (önerim, bölüm 2.3) mi, sert (tüm p -8 puan) mi? Kalıcı bir "Zor" modu istenir mi?
5. **Meta:** yalnız kozmetik/koleksiyon/modlar mı (önerim), yoksa güç artıran kalıcı yükseltme de mi?
6. **Mobil limit:** `cap` 12 yeterli mi? Hangi cihazda test edilecek (alt sınır)?
7. **İçerik üretimi:** W2/W3'ü Perde I'in oyuncu testi sonrasına mı bırakalım (önerim)?
8. **Eskort:** yapılsın mı (büyük maliyet) yoksa w3-06 sakin kristal koşusu mu kalsın (önerim: yedek)?
9. **DDA:** görünür bilgi + "yardımı kapat" anahtarı onayı?
10. **Kayıt göçü:** mevcut oyuncuların ilerlemesi korunsun mu (önerim evet)?
11. **Gece Yarığı ve günlük bölüm:** Aşama 5'te mi, yoksa Aşama 3'e mi çekilsin (kampanya bitince geri dönüş sebebi)?

---

## 10. Varsayım defteri

| # | Varsayım | Değer | Nasıl doğrulanır |
|---|---|---|---|
| V1 | Kristal başına süre (yetkin oyuncu, savaş içinde) | 2.4 sn; boş arenada 1.5, yoğunda 3 | telemetri `crystalSec`; bot |
| V2 | Bot parametreleri ve silah isabet/DPS katsayıları (Ateş .6 isabet, Yıldırım otomatik) | bölüm 1.3, 7.4 | bot çıktısı ile oyuncu verisi karşılaştırması |
| V3 | TP formülü katsayıları (hp^0.45, 0.5+0.25v, R_ai) | bölüm 3.1 | bot: TP ile ölçülen hasar/öldürme süresi korelasyonu r ≥ 0.7 |
| V4 | Güç modeli P(n): hp perk 0.2/seçim, Pd 5%/seçim, büyü katsayıları, yetenek %12 | bölüm 3.3 | telemetri `perkPicks`, `weaponCasts`; bot perk politikaları |
| V5 | Z → p lojistiği (Z50 = 2.5, s = 0.375), çapa w1-01 = %92 | bölüm 3.4 | bot + oyuncu verisiyle yeniden uydur |
| V6 | Hedef türü çarpanları X (kristal .75 ... boss 2.2) | bölüm 3.4 | bot ve oyuncu testi; set-piece için gerçek motor botu |
| V7 | Bölüm arası süre 25 sn (kart, perk, harita); yeniden deneme +8 sn | bölüm 4.4 | telemetri oturum süreleri; oyuncu testi |
| V8 | Başarısız deneme maliyeti = 0.6 x savaş süresi | bölüm 4.4 | telemetri `sumDieSec` |
| V9 | Yürüyen bot 1-4. bölümleri çoğunlukla geçer | B2 | yürüyen bot |
| V10 | Oturum 10-15 dk, 5-6 bölüm | bölüm 2.4 | oyuncu testi |
| V11 | Mevcut bölümlerin saf savaş süresi aralıkları (goal x 1.5-3; totem 30-60; mini-boss 25-60; boss 60-120) | B1 | telemetri `sumWinSec` (aşama 0 sonrası) |
| V12 | DDA katsayıları, kazanma serisi, tempo profili | bölüm 3.5-3.6 | bot (DDA açık/kapalı) + oyuncu testi |
| V13 | Yıldız eşikleri, gün-2 dönüşü ölçülemez (hesap yok) | bölüm 3.7, 6 | self-report; yıldız dağılımı telemetride |
| V14 | `cap` 12 mobilde kabul edilebilir | bölüm 3.2 | gerçek cihaz kare süresi |
| V15 | Tema varyantları yalnız config (gizli kod bağı yok) | bölüm 4.2 | `render/` kod incelemesi, bir varyantı deneme |
| V16 | Elit Şövalye yalnız config girdisi (`model: knight`) | bölüm 3.1 | `adapt.js`/`render/enemies.js` incelemesi |
| V17 | Simülasyon süresi (birkaç dk) | bölüm 7.4 | aşama 0'da ölçülür |
| V18 | 5-8 kişilik test yalnız alarm üretir | bölüm 7.6 | tasarım gereği |
| V19 | Boyut karşılıkları S/M/L | bölüm 8 | gelistirme odası kendi tahminini verir |

---

## 11. Senarist ve diğer odalar için notlar

- **Kimlik şeması:** `w<perde>-<sıra>` (örn. `w2-05`); bölümler arası sabit; kayıt ve harita bunu kullanır. Mevcut→yeni göç tablosu bölüm 4.1.
- **Rol haritası (duygusal/oynanış):** nefes bölümleri (duygusal an için alan): w1-01, w1-06, w2-01, w2-06, w3-01, w3-06; öğretim anları: w1-02..05, w1-07, w2-02; zirve ve sınav: w1-09, w2-05, w2-09, w3-05, w3-08, w3-09.
- **Boss sayısı:** 1 final boss (w3-09) + 4 mini-boss (w1-09, w2-05, w2-09, w3-05).
- **Perde I öğretim anlatısı:** tek yeni şey/bölüm; intro en çok 2-3 cümle (mevcut sınır).
- **Yeni metin ihtiyacı:** her perde için ad ve tema cümlesi; bölüm intro/outro (18 yeni bölüm); yeni hedef türü etiketleri (dalga, bölge, eskort); mini-boss/boss hedef metni (şu an sabit "Kemik Şövalye'yi yen!"); DDA bilgi satırları (3); yıldız rozet adları (3); perde geçiş kartı.
- **Tekrar dene:** bölüm intro'su tekrar denemede gösterilmeyecek; metin bir kez okunur.
- **Zaman çizelgesi:** ödüller w1-01 (Buz), w1-03 (Üçlü), w1-04 (Kalkan), w1-05 (Yıldırım), w1-06 (Işınlan), w1-08 (Zehir), w2-03 (Meteor), w2-06 (Ay Halkası), w2-08 (Zaman Çatlağı); senarist bunları sahnelerle eşleştirebilir.
- **Görsel/icerik odası için:** 13 yeni tema varyantı, 18 yeni bölüm kapağı + düğüm görseli (mevcutlar yeniden kullanılabilir), 3 elit Şövalye (yeni model gerekmez).
- **Gelistirme/mimari için:** bölüm 5.2 iş listesi ve 7.1 şema önerisi; mevcut config ve kod bu çalışmada değiştirilmedi.
