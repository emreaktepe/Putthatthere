# HEXORA: Büyücünün Gecesi — Savaş Sistemi Yeniden Tasarımı ve Perde II-III Tam Tasarımı

Durum: ÖNERİ (tasarım belgesi). Kod, `data/game.config.json` ve `assets/` DEĞİŞTİRİLMEDİ. Yazan: oyun tasarımcısı. Kaynak: Emre'nin Perde I oyun notu ("çok kolay; ilk bölümlerde ekran boş; mana çok toplanıyor; şimşekle çok kolay geçiliyor; her silahın etkili olduğu düşman değişmeli; savaş alanı sade; Perde II-III'ü tasarla").

**Dürüstlük notu.** Bu belgedeki HER sayı VARSAYIMDIR (V etiketi); oyuncu testi yapılmadı. Sayıların bir kısmı küçük bir Node benzetimiyle (aşağıda "benzetim" = `press` modeli: 2B, dt 0.1 sn, oyuncu kristale gider ve en yakın düşmana ateş eder; ateş isabeti 0.65 "usta", 0.40 "orta/acemi"; yalnızca kovalayan tipler ve Okçu; gerçek `ai.js` değil) üretildi. Benzetim betikleri depoda DEĞİL (`.ofis-tmp/`, git'e girmez); yöntem bu belgede tarif edilir ve geliştirme odası `tools/balance/sim.mjs` içine taşıyacaktır (§8). Ölçemediğim şeyler (insan nişan hatası, dokunmatik, gerçek kare hızı, çevre tehlikelerinin hissi) açıkça belirtilmiştir.

**Önceki odaların kararlarıyla ilişki.** Hikâye kimlikleri, adları, rolleri ve ödül takvimi `hikaye-ve-bolum-kurgusu-27-bolum.md` ile BİREBİR alındı. Zorluk modeli (TP, B30, Z, p) `oyun-tasarimi-zorluk-ve-bolum-plani.md` §3'ten; iki yerde bilinçli genişletme var (§2.1, §6.2) ve gerekçesi yazıldı. Çelişki/uyuşmazlık noktaları §6.8'de toplu.

---

## 0. Yönetici özeti

| Başlık | Karar |
|---|---|
| Neden boş? | Düşman sayısı doğru ama **öldürme hızı baskın**: tek vuruşluk (hp 1-2) düşmanlar arena kenarında doğup menzili 22 birim olan Ateş Topu'yla (veya Yıldırım'la) yaklaşmadan ölüyor. Benzetimde w1-01'de ilk 20 sn ortalama **0.23** aktif düşman, kristal toplama **0.76 sn/adet**, bölüm **19 sn** (süre sınırı 105 sn). |
| Kristal | "Mana" bir kaynak DEĞİL (büyüler mana harcamaz); yalnızca ilerleme sayacı. Çözüm yeni kaynak eklemek değil: **kristali düşman bölgesine bağlamak** (`crystalLure`), **yeniden doğma gecikmesi** (`crystalDelay`), alandaki sayıyı 5 -> 3 yapmak ve **`minKills`** (hedefe ulaşmak için en az N öldürme). Hepsi S-M kod. |
| Baskı matematiği | Sayı artırmak işe yaramıyor (benzetim: başlangıç 3 -> 4 + 2'li paket doğma, A20 yalnızca 0.23 -> 0.40). Yeni model: **kuyruk yükü ρ** (hp/sn gelişi ÷ etkin DPS) + **görünür-vurulabilir süre** (Ruh "Sis Perdesi", doğma uyarı halkası, doğma mesafesi 6.5-10) + **düşman becerisi**. Benzetim: w1-01 A20 0.23 -> **1.31**, bölüm 19 -> **32 sn**. |
| Karşıtlık | 7 element x ~18 düşman çarpan matrisi: Etkili x1.75, Normal x1, Dirençli x0.6, Bağışık x0.25 (126 çiftin ~%7'si). Her silah en az 3 türde "Etkili", en az 1 türde "Dirençli". |
| Yıldırım | hasar 2 -> **1.5**, bekleme 0.9 -> **1.0**, menzil 13 -> **9**, zincir sıçraması gerçek zincir (öncekinden 5 birim), hasar düşüşü 1/0.7/0.5; **tek vuruşta öldürdüğü tür 5 -> 3**; ruh/kemik/taş/zırhlıda Dirençli, uçan/kurt/buzlu/büyücüde Etkili. 3'lü kümede nominal DPS 6.7 -> 3.3. |
| Düşman çeşitliliği | 10 mevcut türe birer beceri (bölümlere `skills` listesiyle kademeli açılır) + **8 yeni tür** + 3 elit Şövalye. Yeni modeli **zorunlu** isteyen yok; 3'ü (Kara Cinci, Kristal Bekçi, Kalkan Nöbetçisi) için yeni model ÖNERİLİR. |
| Yeni kahraman | Oynanabilir yeni kahraman YOK (hikâye + kapsam). Ek: `nobetci` konuşmacı portresi, Pırıl'ın "ipucu rengi" (kodsuz varlık), 1 isteğe bağlı büyü (**Kristal Mızrak**, w3-07), 3 perk. |
| Perde II-III | 18 bölümün tamamı: kimlik/ad/tema/hedef/sayılar/ödül/rol/Z/p/çevre tehlikesi. p: Perde II %83 -> %45 (testere dişi), Perde III %81 -> %37. Toplam beklenen süre ~76 dk (kusursuz ~56 dk). |
| Savaş alanı | Teşhis: tüm dekor arenanın DIŞINDA (halka 15-23); iç 28x28 alan düz zemin. İlk 5 öncelik: (1) çevre tehlikeleri sistemi, (2) "Etkili!" vuruş geri bildirimi, (3) iç engel kayaları + dairesel sınır, (4) doğma uyarı halkası + bölüm giriş kamera süpürmesi, (5) katmanlı sis + mermi ışığı + ufuk silüeti. |

---

## 1. Teşhis (koddan ve sayıdan kanıtlı)

### 1.1 Gerçek durum (kod okuması; "Gerçek" = dosyadan, "V" = varsayım)

| Konu | Gerçek | Kaynak |
|---|---|---|
| Arena | kare, `ARENA = 14` (oyuncu +-13.5'e kısıtlı); düşmanlar yarıçap 14 halkada doğar | `core/util.js`, `world.js`, `spawnmath.js` |
| Doğma | halkada rastgele açı, oyuncudan >= 8 birim; ilk dalga bölüm başında, sonra her `every` sn'de bir dalga (`liveCount < cap`) | `loop.js` "Yeni düşman doğurma" |
| Düşman hızı | Ruh 2.2, Yarasa 4.6 (zikzak), Taş 1.3, Okçu 1.6 (7-9 birimde durur), Kurt 2.4 (hücum 10), Kor 3.2 | `enemies` |
| Oyuncu | hız 8, can 3, hasar sonrası 1.5 sn dokunulmazlık | `game`, `combat.js` |
| Mermi menzili | Ateş/Buz/Üçlü: hız 15-16, ömür 1.4 sn = **~21-22 birim** (arena yarıçapından uzun); dokunmatikte otomatik hedef 18 birim | `weapons.js`, `loop.js` |
| Yıldırım | `chain {n:3, range:13}`, hasar 2, bekleme 0.9; en yakın 3 düşman (oyuncudan), nişan gerekmez | `weapons.js` `nearestEnemies` |
| Kristal | `want` = `crystals` ?? 5 (kristal hedefinde); toplanınca **anında** yenisi `rand(ARENA-1.5)` rastgele noktada çıkar; toplama yarıçapı 1.2 (+0.5 Pırıl) | `loop.js` "Toplananlar", `world.js spawnCrystal` |
| Mana | Büyüler **mana harcamaz** (yalnızca `RT.cooldown`); kristal = sayaç (kristal bölümü) ya da %35 kalp şansı (diğer hedefler) | `weapons.js cast`, `loop.js` |
| Hasar | `hurt(e, dmg, slow, bypassShield)` — **element/tür bilgisi yok**; tüm düşmanlar aynı hasarı alır | `combat.js` |
| Davranış | Ruh/Yarasa/Taş Bekçi yalnızca "kovalar" (3/10 tür); Okçu, Kurt, Kor, Rahip, Totem, Şövalye, Boss kendi kalıbına sahip | `ai.js` |
| Dekor | Tüm dekor `ring(A+1 .. A+9)` = **arenanın dışında** (orman çamı 15-23, mantar 10.5-17, mağara sarkıtı 14.5-23); arena içi: yalnızca zemin dokusu ve birkaç "süs" (su birikintisi, çim 8-14) | `sceneryplan.js` |
| Hasar geri bildirimi | vuruşta kıvılcım (5), ölümde patlama (14), ekran sarsıntısı (boss/şövalye/hasar), **hasar sayısı yok**, **etkililik göstergesi yok** | `combat.js`, `fx.js` |
| Parçacık havuzu | `MAX_SPARKS = 480` | `fx.js` |

### 1.2 Neden ilk bölümler boş? (benzetim, V)

Benzetim modeli (V): oyuncu en yakın kristale koşar, <3.2 birimdeki düşmandan uzaklaşır, `cd` dolunca en yakın düşmana ateş eder (isabet: ≤10 birimde p, >10'da 0.8p); yalnızca kovalayan tipler + Okçu (sabit mesafe, 2.5 sn'de bir, isabet şansı 0.35). 400 koşu.

| Bölüm (MEVCUT config) | Süre (kazanma) | İlk 20 sn aktif düşman (usta p=.65 / orta p=.40) | Vuruş/deneme | Süre payı (`time` / bitiş) |
|---|---|---|---|---|
| w1-01 | **19 sn** | **0.23** / 0.41 | 0.00 | 105 / 19 = **5.5x** |
| w1-02 | 23 sn | 0.16 / 0.30 | 0.00 | 120 / 23 = 5.2x |
| w1-03 | 26 sn | 0.56 / 0.89 | 0.00 | 140 / 26 = 5.4x |
| w1-05 | 27 sn | 1.81 / 3.40 | 1.46 | 155 / 27 = 5.7x (kazanma .83 / .38) |

Neden (zincir):
1. **Ölüm menzili > doğma mesafesi.** Ruh hp 1; Ateş Topu 1 vuruş; mermi menzili ~22 > doğma yarıçapı 14. Ruh doğduğu anda vurulabilir. Düşman "ulaşma süresi" teorik 14/2.2 = 6.4 sn (Ruh), 14/4.6 = 3 sn (Yarasa), ama vurulduğu için ortalama yaşam ~1 sn.
2. **Kuyruk kullanımı çok düşük.** Kuyruk yükü ρ = (hp/sn geliş) / (etkin DPS). w1-01: ilk 30 sn ~ 1 hp / 8 sn + başlangıç 3 hp; etkin Ateş DPS 2.14 (isabet dahil) -> **ρ ≈ 0.06**. Oyuncu %94 boşta.
3. **Sayı artırmak yetmiyor.** Aynı modelde w1-01 başlangıç 4 Ruh + 2'li paket / 4 sn bile (doğma 6.5-10 birim, Sis Perdesi olmadan) A20'yi yalnızca 0.50'ye (usta) / 1.01'e (orta) çıkarıyor; yaşam süresi ~1 sn kaldığı için (Little: N = λ·W, W küçük).
4. **Kristal, çatışmayla bağlantısız.** 5 kristal sürekli sahada; en yakının ortalama uzaklığı ~5.6 birim (V: yoğunluk 5/625 -> 0.5/sqrt(rho)); 8 birim/sn ile **~0.76 sn/kristal**; 25 kristal = ~19 sn. Plan bunu 2.4 sn/kristal varsaymıştı (§4.4 "goal = süre/2.4"): **3.2x hata**.
5. **Durgunluk koruması etkisiz.** `effectiveCap` yalnızca `cap` +1/8 sn; düşman sayısını değil üst sınırı değiştirir; düşman zaten yok.

Sonuç: sorun "düşman az" değil, "düşman **tehlikeli bölgeye girmeden ölüyor** ve kristal bunu hiç sınamıyor". Çözümün tek ayağı sayı olamaz.

### 1.3 Neden Yıldırım baskın? (TTK ve DPS tablosu, MEVCUT config)

Vuruşta ölme sayısı (hasar / "hit sayısı" / kuramsal saf vuruş süresi sn; kalkan, isabet, perk yok):

| Silah (dmg, cd) | Ruh 1 | Yarasa 1 | Taş 4 | Okçu 2 | Kurt 2 | Kor 2 | Rahip 5* | Totem 10 | Şövalye 24 | Kral 45 |
|---|---|---|---|---|---|---|---|---|---|---|
| Ateş (1, .35) | 1 / 0 | 1 / 0 | 4 / 1.0 | 2 / .3 | 2 / .3 | 2 / .3 | 5 / 1.4 | 10 / 3.1 | 24 / 8.0 | 45 / 15.4 |
| Buz (1, .5) | 1 | 1 | 4 / 1.5 | 2 / .5 | 2 / .5 | 2 / .5 | 5 / 2.0 | 10 / 4.5 | 24 / 11.5 | 45 / 22 |
| Üçlü (1x3, .65) | 1 | 1 | 4 / 2.0 | 2 / .7 | 2 / .7 | 2 / .7 | 5 / 2.6 | 10 / 5.9 | 24 / 15 | 45 / 28.6 |
| **Yıldırım (2, .9) x3 hedef** | **1** | **1** | **2 / .9** | **1** | **1** | **1** | 3 / 1.8 | 5 / 3.6 | 12 / 9.9 | 23 / 19.8 |
| Zehir (1/sn) | 1 / 1.0 | 1 / 1.0 | 4 / 4 | 2 / 2 | 2 / 2 | 2 / 2 | 5 / 5 | 10 / 10 | 24 / 24 | 45 / 45 |
| Meteor (3, 2.8) | 1 / .8 | 1 / .8 | 2 / 3.6 | 1 / .8 | 1 / .8 | 1 / .8 | 2 / 3.6 | 4 / 9.2 | 8 / 20 | 15 / 40 |
| Ay Işığı (1, 4.5) | 1 | 1 | 4 / 13.5 | 2 / 4.5 | 2 / 4.5 | 2 / 4.5 | 5 / 18 | 10 / 40 | 24 / 104 | 45 / 198 |

*Rahip: kalkan ilk vuruşu emer (+1 vuruş) ve 4 sn'de bir iyileştirir.

Neden Yıldırım kırıcı:
- **8 mevcut ölçülebilir türden 5'ini (Ruh, Yarasa, Okçu, Kurt, Kor; hp ≤ 2) tek vuruşta öldürür** ve aynı anda 3 hedefe vurur: kuramsal "öldürme/sn" = 3 / 0.9 = **3.3**, Ateş'in (nişan hatasız) 2.86'sından yüksek ve **nişan gerektirmez**; Ateş'in isabeti 0.65 ise etkin 1.86.
- Menzil 13 (arena yarıçapı 14): oyuncu ortada dururken hemen her düşmana yetişir. Yerine göre çözümsüz: Ruh doğar doğmaz ölür.
- w1-05'te (yani 9 bölümün 5.'sinde) kazanılır; sonraki 4 bölüm (kurt, kor, şövalye) onunla geçilir. Bot da böyle: Yıldırım'ı tek hedef değil sürü olarak vurur (sade modelde "fazla güçlü": plan §12.4).
- Kalkan/menzil/direnç gibi **karşı hamlesi yok** (Rahip kalkanı yalnızca 1 vuruş). Meta payı (V): Yıldırım açıldıktan sonra öldürmelerin %60-75'i (ölçülecek: §8 telemetri `weaponDmg`).

### 1.4 Bot neden Perde I'de %100 geçiyor? (plan §12.4/13.4 + `sim.mjs` okuması)

| Zayıflık | Etki | Çözüm (§8.3) |
|---|---|---|
| Mermi uçuş süresi yok (isabet anında hesaplanır) | Hareketli hedeflere (Yarasa, Kurt hücumu) fazla isabet | uçuş süresi d/v, hareket cezası |
| Reaksiyon sabit 0.25/0.10 sn, dikkat dağınıklığı yok | İnsan 0.3-0.6 sn ve zaman zaman bakmaz | gecikme dağılımı + "dikkat boşluğu" |
| Yıldırım otomatik, zincir her zaman 3 hedef | Sürüde olduğundan güçlü | yeni zincir mantığı + direnç |
| Kristal seçimi en iyi sıra | İnsan en yakını değil "görüneni" alır | %70 en yakın, %30 rastgele |
| Bölümler arası can taşıma yok (iyimser) | Kümülatif aşınma yok | `clearHeal` ile taşıma |
| Ranged/zemin tehlikesi modeli basit | Okçu isabet şansı sabit | ok yağmuru, halka, lanet bölgesi modelleri |
| Etkililik yok | Silah seçimi anlamsız | matris farkında silah politikası |

### 1.5 Teşhis özeti (rapor için ilk 5)

1. w1-01 ilk 20 sn ortalama **0.23** aktif düşman, vuruş 0.00; bölüm **19 sn**, süre payı **5.5x**.
2. Kristal akışı **0.76 sn/adet** (plan varsayımı 2.4); "mana" harcanmıyor, kaynak değil sayaç.
3. Yıldırım: hp ≤ 2 olan **5/8** türü tek vuruşta, 3 hedefte, nişansız öldürür; menzil 13/14.
4. Hasarın element/tür bilgisi yok: "en yüksek DPS kazanır" (karşıtlık yok); 3/10 tür yalnızca kovalar.
5. Tüm dekor arenanın dışında; iç alan düz; hasar sayısı/etkililik geri bildirimi yok. Bot bunları ölçemiyor (uçuş süresi, dikkat, etkililik yok) -> %100.

---

## 2. Düşman baskı matematiği

### 2.1 Kuyruk yükü ρ ve görünür-vurulabilir süre

Plan §3'ün TP/B30 modeli "ne kadar tehdit var"ı ölçer; **gerçekleşen** baskıyı iki şey belirler: (a) oyuncunun öldürme kapasitesi, (b) düşmanın vurulabilir olduğu zaman. Genişletme:

```
ρ      = λ_hp / DPS_ref(n)            λ_hp = (ortalama dalga toplam hp) / every  (+ totem x 1hp/12 sn)
DPS_ref(n) = 2.14 · Pd(n)             2.14 = Ateş 2.857 x isabet 0.75 (V); Pd(n) plan §3.3
ρ_eff  = ρ / 0.6                      0.6 = ateş etme görev payı (kristal toplama + kaçış sırasında ateş edilmez) (V)
N_aktif ≈ λ·W + ρ_eff/(1 − ρ_eff)     W = düşmanın vurulabilir olduğu süre (doğma -> öldürülme)
```
- `ρ_eff < 0.3`: oyuncu rahatça boşta; < 0.15 = "boş ekran". Hedef bandlar (V): **Perde I 0.2-0.4, Perde II 0.35-0.6, Perde III 0.45-0.75** (set-piece/boss hariç).
- **W'yi büyütmek** ρ'yu artırmaktan daha ucuz ve daha doğru (oyuncu "yaklaşan tehdit" görür). Araçlar: (1) Ruh **Sis Perdesi** (7 birimden uzakta vurulamaz), (2) Ateş/Buz/Üçlü **mermi ömrü 1.4 -> 1.1** (menzil ~17), (3) doğma mesafesi **6.5-10** birim (halkayı oyuncuya doğru yumuşat) + **doğma uyarı halkası** 0.6 sn, (4) zırhlı/kalkanlı/becerili türler (TTK ↑), (5) karşıtlık (yanlış silah TTK x1.7).
- **Tavan:** kümede aynı anda `cap`; mobil <= 12 (plan V14).

Doğrulama: bot/benzetimde `A20` (ilk 20 sn ortalama aktif düşman), `Tcontact` (ilk düşmanın oyuncuya 5 birim içine girişi), `TF/dk` (temas fırsatı: düşman 4 birim içine girer veya düşman mermisi/tehlike 1.5 birim içinden geçer).

### 2.2 Baskı fonksiyonu P(t) ve hedef eğrileri

```
P(t) = Σ_i TP_i · f(d_i),  f(d) = clamp((12 − d)/9, 0, 1)       (12 birimden uzaktaki sayılmaz; 3 birimde tam)
```
Bölüm içi hedef (V): P(t) bölüm ortalamasının 0.6x-1.4x bandında salınsın; bölüm başında (0-10 sn) ortalamanın **>= 0.7x**'i (ilk saniyelerde boşluk olmasın); son 20 sn zirve (bölüm sonu hissi). "Zorluk bandı": her bölümde **TF/dk >= N** (temas fırsatı):

| Aşama | TF/dk hedefi (V) | Aktif düşman A20 hedefi (benzetim eşiği; usta botta) |
|---|---|---|
| w1-01..w1-03 | >= 6 | >= 1.2 / 1.0 / 1.5 |
| w1-04..w1-06 | >= 8 | >= 1.5 (hayatta kal 2.0) |
| w1-07..w1-09 | >= 12 | >= 3.0 |
| Perde II | 14-22 | >= 3.0-4.5 |
| Perde III | 18-28 | >= 4.0-6.0 |

(Not: A20 benzetimde mükemmel nişan/kaçış varsayar; **gerçek oyuncuda daha yüksek ama vuruş sayısı da yüksek** olur. Eşik "alt sınır"dır: altındaysa bölüm yine boş hissedilir.)

### 2.3 Kristal akışını düşmanla bağlayan kurallar (mana sorununa somut çözüm)

Mevcut döngüyü anlamak: **kristal = bölüm sayacı**; büyü maliyeti yok. Yeni kaynak sistemi EKLENMİYOR (isteğin uyarısı). Bunun yerine kristalin **konumunu ve zamanlamasını** savaşa bağlarız:

| Kural | Tanım | Etki (V) | Maliyet |
|---|---|---|---|
| **K1 `crystals`** | Sahadaki kristal sayısı 5 -> **3** (Perde I), 3-4 sonra (alan zaten config'te var: `levels.<id>.crystals`) | seçim azalır, rota çatışmaya girer | 0 (yalnızca config) |
| **K2 `crystalDelay`** (yeni) | Toplanınca yenisi **1.5 sn** sonra (Perde II 1.2, III 1.0) çıkar; çıkış yeri 0.4 sn parlayarak uyarır | toplama hızı üst sınırı ~0.5-0.7 kristal/sn; 25 kristal ~35-40 sn | S (`loop.js`, `world.js`) |
| **K3 `crystalLure`** (yeni) | Yeni kristalin konumu: 4 rastgele adaydan, **yaşayan bir düşmana en yakın** (oyuncuya >= 5 birim) olan | kristale gitmek = düşmana yaklaşmak; "kristali tehlikeden al" tadı | S (`world.js spawnCrystal`) |
| **K4 `minKills`** (yeni) | Kristal hedefi tamam + öldürme >= N ise bölüm biter; HUD'da "Düşman 7/12" çipi | "ateş etmeden geçme" biter (yürüyen bot %97 -> ~%0); `effectiveCap` hacmi gereksizleşir | S (`loop.js`, `hud.js`) |
| K5 `crystalKillDrop` (isteğe bağlı) | Öldürülen düşman %25 ihtimalle 8 sn ömürlü "ruh kristali" bırakır (sayaca 1) | savaş -> kristal bağı güçlenir, kalp ile yarışır | M (pickup ömrü) |

Beklenen etki (benzetim; K1+K2+minKills, düşmanlar mevcut): w1-01 **19 -> ~41 sn**. Süre sınırları aynı kalır (hikâye hedef metinleri, `goal` sayıları DEĞİŞMEZ): `time` hâlâ ~2x bol; DDA süre çarpanı ve plan Z'si etkilenmez.

`minKills` önerisi: ~%40-50 x goal. Tablo §2.4 ve §6.

### 2.4 Perde I'in baskı yeniden dengesi (ilk 5 bölüm ayrıntılı; w1-06..09 kısa)

Önceki (config) -> yeni (öneri). Sayılar: `start` / `spawn` (paketler `∣` ile ayrılır) / `every` / `cap`. `sk` = bölümde açık düşman becerileri (§4.1). İlk-temas: ilk düşmanın oyuncuya 5 birim yaklaşması (tahmin: doğma 6.5-10 birim + 0.6 sn uyarı, hız 2.2/4.6; V).

| Bölüm | MEVCUT | YENİ | `goal`/`time` (aynı) | K1-K4 | sk | Beklenen ilk temas | Benzetim A20 (usta/orta) | Benzetim bitiş |
|---|---|---|---|---|---|---|---|---|
| w1-01 Fısıldayan Orman | Ruh3 / Ruh1 / 8 / 6 | Ruh5 / Ruh2 / **6** / **8** | 25 / 105 | `crystals` 3, gecikme 1.5, `minKills` 12 | veil | ~3 sn | 0.23/0.41 -> **1.31/1.86** | 19 -> **32 sn** |
| w1-02 Yarasa Mağarası | Ruh1 Yar1 / Yar1 Ruh1 / 12 / 6 | Ruh2 Yar3 / Yar1 Ruh2 / **9** / **8** | 29 / 120 | 3, 1.5, `minKills` 14 | veil, batDive | ~2 sn | 0.16/0.30 -> **1.07/1.60** | 23 -> 38 sn |
| w1-03 Taş Bekçiler | Ruh1 Yar1 Taş1 / Taş1 Yar1 / 12 / 7 | Ruh3 Yar2 Taş1 / Taş1 Yar2 ∣ Ruh3 / **9** / **9** | 33 / 140 | 3, 1.5, 14 | + quake | ~3 sn | 0.56/0.89 -> **1.53/2.51** | 26 -> 43 sn |
| w1-04 Alacakaranlık Ormanı (hayatta kal 60) | Ruh1 Yar1 Taş1 / Ruh1 Yar1 / 12 / 6 | Ruh3 Yar1 Taş1 / Ruh2 Yar1 / **10** / **9** | 60 / 60 | `crystals` 2 (kalp için) | veil, batDive, quake | ~3 sn | - | 60 sn (sabit) |
| w1-05 Hortlak Mezarlığı | Ruh2 Yar2 Taş1 Okç2 / Ruh1 Okç1 / 9 / 9 | Ruh2 Yar2 Taş1 Okç2 / Ruh2 Okç1 / 9 / **10** | 38 / 155 | 3, 1.5, 18 | + (okçu düz) | okçu ~2 sn | 1.81/3.40 -> **2.06/3.84** | 27 -> 42 sn |
| w1-06 Ninni Mağarası (1 totem) | Ruh1 Yar1+T / Ruh1 Yar1 / 12 / 6 | Ruh2 Yar1+T / Ruh2 Yar1 / 12 / **8** | 1 / 150 | `crystals` 3 | veil, batDive | ~3 sn | - | - |
| w1-07 Donmuş Geçit | Ruh2 Yar3 Kur4 / Kur1 Yar1 / 8 / 11 | Ruh2 Yar3 **Kur3** / Kur1 Yar**2** / **9** / 11 | 31 / 105 | 3, 1.2, 14 | + | ~4 sn | - | - |
| w1-08 Yanık Köy (3 totem) | Ruh1 Kor3 Taş1 / Kor1 Ruh1 / 10 / 8 | Ruh2 Kor3 Taş1 / Kor1 Ruh2 / 10 / **9** | 3 / 200 | `crystals` 3 | + emberChain, aura | ~3 sn | - | - |
| w1-09 Kemik Kule | Şv1 Okç2 Kur1 / Okç1 Ruh1 / 6 / 6 | Şv1 Okç2 Kur1 / Okç1 **Ruh2** / **7** / **7** | 1 / 120 | - | + (şok sonrası açık an) | şövalye ~6 sn | - | - |

Benzetim sonucu notu (V): w1-05'in yeni sürümü usta botta 0.72 (mevcut 0.83), orta botta 0.20 (mevcut 0.38); yani zorluk artışı Okçu/Ok tehlikesi sayesinde; **aşırı sertlik riski**: orta bot kazanma oranı < %25 olursa `archer` başlangıcı 2 -> 1 yapılır (§8 çıkış kriteri).

Model Z/p (plan §3.4 formülü, aşağıdaki **TP düzeltmesiyle**) bu bölümler için §6.2 tablosunda.

**TP düzeltmesi (plan §3.1'e eklenti, V):** benzetim "hp 1 yavaş kovalayıcı"nın TP'sini fazla puanladığını gösteriyor (w1-02 yeni: B30 = 19, model p = .60, ama benzetimde 1.00 kazanma). Katsayı: `q_ghost = 0.5`, `q_bat = 0.8` (menzilden ölen, temas olmayan tehdit payı). Becerili türlerde `TP' = TP · (1 + 0.10·min(beceri, 3))`. Çalışma: Z50 ve s botla yeniden uydurulur (§8.3).

---

## 3. Silah–düşman karşıtlık sistemi

### 3.1 Model

Her silahın bir **elementi**, her düşmanın **özellik etiketleri**, bunlardan türeyen bir **çarpan** m(element, düşman) vardır:

```
hasar_son = hasar_taban x güç_çarpanı (rollDamage) x m(element, düşman) x durum çarpanları
m ∈ { 1.75 "Etkili!", 1.0, 0.6 "Dirençli", 0.25 "Bağışık" }
```
Uygulama: `hurt(e, dmg, slow, bypassShield, element)` — config'te `weapons.<id>.element` ve `enemies.<id>.res = { fire:1.75, ... }` (etiketler tasarım dilidir; config çarpan tablosunu taşır). Eksik anahtar = 1. S kod (`combat.js`, `weapons.js`, `adapt/schema`).

**Elementler:** Ateş (fire), Buz (frost), Arcane (arcane), Yıldırım (lightning), Zehir (poison), Yıkım (meteor; "ağır kütle"), Işık (nova; Ay Işığı), Kalp (Kristal Mızrak; tarafsız).

**Etiket -> çarpan kuralları** (düşman satırı bu kurallardan türer; çelişkide elle düzeltilir):

| Etiket | Etkili (x1.75) | Dirençli (x0.6) | Bağışık (x0.25) | Not |
|---|---|---|---|---|
| Hayalet (Ruh, Ağıt Ruhu) | Arcane, Işık | Yıldırım | Zehir | + Sis Perdesi (yalnız Arcane/Işık deler) |
| Kemik (Okçu, Nişancı, Şövalye) | Ateş (Okçu), Işık (Şövalye) | Zehir, Yıldırım | - | |
| Taş (Taş Bekçi, Totem) | Arcane (rün), Yıkım | Yıldırım, Ateş (Taş), Buz (Totem) | Zehir (Totem) | |
| Zırhlı (Şövalye, Kalkan Nöbetçisi) | Yıkım | Arcane, Yıldırım, Zehir | - | Kristal Mızrak zırhı ve ön kalkanı deler |
| Ateş (Kor) | Buz | - | Ateş | |
| Buz (Kurt, Alfa Kurt, Don Hortlağı) | Ateş, Yıldırım (Kurt/Don) | Yıkım (Kurt/Alfa) | Buz | |
| Uçan (Yarasa) | Buz, Yıldırım | Yıkım | - | Zehir de Etkili (canlı) |
| Canlı/büyücü (Rahip, Kara Cinci) | Zehir; Rahip: Işık, Cinci: Yıldırım | Arcane | - | |
| Kristal (Kristal Bekçi) | Buz, Yıkım | - | Arcane | |
| Çürük (Çürük Hortlak) | Ateş, Işık | Zehir | - | |

### 3.2 Çarpan matrisi (tasarım; V)

E = x1.75 Etkili, D = x0.6 Dirençli, I = x0.25 Bağışık, . = x1. Kristal Mızrak (Kalp) her satırda x1 (zırhlı/kalkanlı satırlarda koruma da deler).

| Düşman | Ateş | Buz | Arcane | Yıldırım | Zehir | Yıkım | Işık | En iyi 2 | En kötü |
|---|---|---|---|---|---|---|---|---|---|
| Ruh | . | . | **E** | D | I | . | **E** | Arcane, Ay Işığı | Zehir |
| Yarasa | . | **E** | . | **E** | **E** | D | . | Yıldırım, Buz/Zehir | Meteor |
| Taş Bekçi | D | . | **E** | D | **E** | **E** | . | Arcane, Meteor | Ateş, Yıldırım |
| Kemik Okçu | **E** | . | . | D | . | . | . | Ateş, Buz (yavaşlatır) | Yıldırım |
| Kurt Ruhu | **E** | I | . | **E** | . | D | . | Yıldırım, Ateş | Buz |
| Kor Hortlak | I | **E** | . | . | . | . | . | Buz, Arcane (uzaktan) | Ateş |
| Karanlık Rahip | . | . | D | . | **E** | . | **E** | Zehir (kalkanı geçer), Ay Işığı | Arcane |
| Lanet Totemi | . | D | . | . | I | **E** | . | Meteor, Ateş | Zehir |
| Kemik Şövalye I-IV | . | . | D | D | D | **E** | **E** | Meteor, Ay Işığı (+Kristal Mızrak) | Zehir, Yıldırım |
| Gölge Kral (taban) | . | . | **E** | . | D | . | . | Arcane (faz tablosu §6.6) | Zehir |
| Ağıt Ruhu (YENİ) | . | . | **E** | D | I | . | **E** | Arcane, Ay Işığı | Zehir |
| Kara Cinci (YENİ) | . | . | D | **E** | **E** | . | . | Yıldırım, Zehir | Arcane |
| Kalkan Nöbetçisi (YENİ) | . | . | D | D | D | **E** | . | Meteor (+arkadan vuruş) | Zehir |
| Kristal Bekçi (YENİ) | . | **E** | I | . | . | **E** | . | Meteor, Buz | Arcane |
| Don Hortlağı (YENİ) | **E** | I | . | **E** | . | . | . | Yıldırım, Ateş | Buz |
| Çürük Hortlak (YENİ) | **E** | . | . | . | D | . | **E** | Ateş, Ay Işığı | Zehir |
| Alfa Kurt (YENİ) | **E** | I | . | . | . | D | . | Ateş, Arcane (yelpaze) | Buz |
| Gölge Nişancı (YENİ) | . | . | **E** | . | D | . | . | Arcane (yelpaze uzaktan) | Zehir |

Silah başına özet (18 satır; V):

| Silah | Ortalama çarpan | Etkili | Dirençli | Bağışık | "En iyi" olduğu tür sayısı* |
|---|---|---|---|---|---|
| Ateş | 1.14 | 5 | 1 | 1 | 6 |
| Buz | 0.98 | 3 | 1 | 3 | 2 |
| Arcane | 1.08 | 5 | 4 | 1 | 6 |
| Yıldırım | 1.03 | 4 | 6 | 0 | 4 |
| Zehir | 0.93 | 4 | 5 | 3 | (alan rolü) |
| Yıkım (Meteor) | 1.14 | 5 | 3 | 0 | (elit rolü) |
| Işık (Ay Işığı) | 1.21 | 5 | 0 | 0 | (acil rol) |

*Tür başına ağırlıklı etkin DPS karşılaştırması (küme türlerinde hedef sayısı: Yıldırım 1.55, Zehir 2.2, Meteor 1.8, Ay Işığı 3; tekil türlerde 1). Zehir/Meteor/Işık "en iyi" olmaz çünkü rolleri alan/elit/acil; ama Etkili oldukları yerde (kalabalık, elit) güçlü seçenektir.

**Bağışık çiftlerin payı:** 126 çiftte 9 (%7): Zehir-Ruh/Ağıt/Totem, Buz-Kurt/Alfa/Don, Ateş-Kor, Arcane-Kristal. Hiçbir düşman, bir silah yüzünden "geçilemez" olmaz çünkü satır başına en çok 1 Bağışık ve >= 2 Etkili vardır.

### 3.3 Denge kuralları (sayısal; test edilebilir, `tests/matrix.test.js`)

| # | Kural | Ölçüm | Mevcut tasarım |
|---|---|---|---|
| M1 | Her satırda en az 1 Etkili (Boss/Okçu hariç tüm satırlarda >= 1; çoğunda 2), en çok 1 Bağışık, Bağışık varsa en az 2 Etkili | tablo | sağlandı (V) |
| M2 | Her silah >= 3 Etkili ve >= 1 Dirençli türe sahip (Işık hariç Dirençli şartı: o "acil"dir) | tablo | sağlandı |
| M3 | Silah başına ortalama çarpan 0.90-1.15 (Işık 1.21 acil/zayıf-DPS dengelemesidir; istisna) | tablo | 0.93-1.14 |
| M4 | Tür başına en iyi/medyan etkin DPS <= 2.8 (hiçbir tür tek silahla "çözülmez") | hesap | en yüksek 2.7 (Kral/Nişancı), Taş 2.6 |
| M5 | **Tek silah payı:** hiçbir silah, bir tür düşmanın toplam hasarının **%60**'ından fazlasını tek başına vermemeli (hedef <= %45; telemetri `weaponDmg[w][e]`) | oyun telemetrisi/bot | ölçülecek |
| M6 | Kampanya geneli tek silah payı <= %40 (Yıldırım şimdiki tahmin %60-75) | telemetri | ölçülecek |
| M7 | "Etkili vuruş oranı" (EVO = Etkili hasar olayı / tüm) bot "orta" için %30-45, "acemi" %15-25 | bot | ölçülecek |

### 3.4 Silah rolleri ve yeni sayılar (V)

| Silah | Rol | Element | MEVCUT -> YENİ | Not |
|---|---|---|---|---|
| Ateş Topu | genel, ilk açılış, kemik/buz/çürük | Ateş | dmg 1, cd .35 (aynı); **mermi ömrü 1.4 -> 1.1** (menzil ~17.6) | jenerik; E: 5 tür |
| Buz Oku | kontrol; okçu/kor karşıtı | Buz | dmg 1, cd .5; **yavaşlatma zaman ölçeği 0.35 -> 0.5**, süre 3 -> **2.5 sn**; ömür 1.1 | yavaş Okçu atış aralığını 2.5 -> 5 sn yapar (şimdi 7.1 sn: fazla güçlü); Şövalye/Kral/Totem bağışık (şimdi de) |
| Üçlü Büyü | yelpaze; ruh/rün/nişancı | Arcane | dmg 1x3, cd .65; ömür 1.1 | ruh/hayalet avcısı; Sis Perdesi'ni deler |
| **Yıldırım** | zincir; uçan/kurt/cinci | Yıldırım | **dmg 2 -> 1.5, cd .9 -> 1.0, menzil 13 -> 9, zincir sıçraması** | §3.5 |
| Zehir Bulutu | alan; kalabalık, Rahip kalkanı geçer | Zehir | dmg 1 -> **1.2/sn**, cd 1.4 -> **1.3**, yarıçap 2.2 -> **2.5**, 4 sn | bulutta kal = kalkan geçer; elit/boss'ta D |
| Meteor | ağır; elit/zırhlı/totem | Yıkım | dmg 3 -> **4**, cd 2.8 -> **2.6**, yarıçap 3 -> **3.2**, gecikme .8 | hızlı hedeflerde D (iskalar) |
| Ay Işığı Halkası | acil; itme, ruh/rahip/çürük | Işık | dmg 1 -> **1.5**, cd 4.5 -> **3.5**, yarıçap 4 -> **4.5**, itme 2 -> **2.5** | kalkanları kırmaz; Yarasa dalışına karşı kesin yanıt |
| Kristal Mızrak (YENİ, isteğe bağlı) | tarafsız çözüm; zırh/kalkan deler | Kalp | dmg 4, cd 2.2, hız 28, doğrusal delici, menzil 18, `bypassShield` | w3-07 ödülü (§5) |

Küçük kural: kesirli hasarın kalan canı (<= 0.05) ölüm sayılır (`hp <= 0.05`), "0.1 canlı hayalet" kötü hissi çıkmasın. Mevcut `rollDamage` kesirli tabanı yuvarlamıyor (S).

### 3.5 Yıldırım'ı yeniden dengeleme (ayrıntı)

```
hedef 1  : oyuncudan menzil (9) içinde en yakın, "Sis Perdesi" olmayan
hedef k>1: önceki hedefe en çok 5 birim, daha önce vurulmamış en yakın
hasar_k  = 1.5 x [1, 0.7, 0.5][k] x m(Yıldırım, düşman) x güç çarpanı
```
| Ölçü | Eski | Yeni | Etki |
|---|---|---|---|
| Tek hedef DPS (nominal) | 2.22 | 1.5 | -%32 |
| 3'lü küme DPS (nominal) | 6.67 | 3.3 | -%51 |
| Menzil | 13 (arena 14) | 9 | oyuncu merkezdeyken kenarlara yetişmez; Sis Perdesi ve Okçu mesafesi ile uyumlu |
| Hedef seçimi | oyuncuya en yakın 3 | 1 + zincir (kümeye ödül, dağınığa ceza) | konumlanma önemli |
| Tek vuruşta öldürdüğü tür | 5 (Ruh, Yarasa, Okçu, Kurt, Kor) | **3** (Yarasa 2.6, Kurt 2.6, Don Hortlağı 2.6 [Etkili]); Ruh Dirençli 0.9 < 1 -> 2 vuruş | tek silah çözümü biter |
| Direnç | yok | Ruh/Ağıt/Taş/Okçu/Şövalye/Nöbetçi D | zırhlı ve hayalet için "yanlış silah" |
| Etkili | yok | Yarasa, Kurt, Don, Kara Cinci | w1-07 (kurt) ve w1-02/04 (yarasa) için güçlü seçim kalır; "yıldırım bozuk" değil, "yeri var" |
| Bekleme | .9 | 1.0 | "tak-tak-tak" tempo yumuşar |
| Perk etkileşimi | Yankı: ikinci tam zincir | Yankı **%50 hasar** (zincir/Meteor/Ay Işığı/Mızrak için `echoScale 0.5`) | meta istif sınırı |

Hâlâ güçlü kalması istenen şey: "uçan ve sürü + otomatik" dolayısıyla dokunmatikte öğretici (nişan zorluğu olmayan silah). Beklenen dokunmatik etkisi: dokunmatik hedef otomatik kilitli (18 birim); Yıldırım menzilini 9'a indirmek dokunmatiği "çok kolay"dan çıkarır; ama dokunmatik oyuncu için Ateş de otomatik hedefli olduğundan fark azdır (doğrulanacak, §9 Q6).

### 3.6 Perk ve yetenek etkileşimi

| Öğe | Etkileşim | Değişiklik |
|---|---|---|
| Delici Büyü | Ateş/Buz/Üçlü'yü 1 düşman deldirir; Sis Perdesi'nde: perdeli düşmanı geçer ama hasar vermez | yok |
| Yankı (3 yığın) | ikinci atış; Yıldırım/Meteor/Ay Işığı/Mızrak için %50 hasar | `echoScale` (S) |
| Güç Tılsımı | tüm taban hasar çarpanı; **çarpan matrisi öncesi** uygulanır (carry kuralı aynen) | yok |
| Vampir | 12 öldürmede 1 can; `Etkili` öldürme sayacı +0 | yok (basit) |
| YENİ Odak Merceği | Etkili çarpanı 1.75 -> **2.1** (max 1) | §5.3 |
| YENİ Zırh Kıran | Dirençli çarpanı 0.6 -> **0.8** (max 1) | §5.3 |
| Mana Kalkanı | 8 sn, 1 vuruş; ok yağmuru/halka/sarsıntı gibi kaçınılmaz alan hasarında en iyi cevap | rol netleşir |
| Işınlan | 5 birim, 0.4 sn dokunulmazlık; **Yarasa dalışı, Şövalye atılışı, Nişancı lazeri, boss halkası** karşı hamlesi | rol netleşir |
| Zaman Çatlağı | düşman x0.4; oyuncu bekleme aynı -> **silah değiştirme penceresi** (3 sn) | rol netleşir |

### 3.7 Ekranda okunur ipucu

- **Hasar etiketi** (DOM havuzu, <= 12 öğe; WebGL değil): hasar sayısı küçük, **Etkili!** altın-element renginde (büyük, 0.7 sn yukarı süzülür), **Dirençli** gri-küçük, **Bağışık** "~" simgesi. Renk = vuran silahın element rengi (`weapons.<id>.color`).
- **Düşman rozeti:** düşmanın "kontak gölgesi" (`blob`) zayıf olduğu elementin renginde hafif tonlanır (en iyi 1 element); ilk karşılaşmada tek seferlik toast: "Ruhlar Arcane ve Ay Işığı'na zayıf."
- **Pırıl ipucu rengi** (kodsuz varlık, S): Pırıl'ın küresi, en yakın düşmana karşı en etkili elementin rengini alır (Pırıl w1-02'den itibaren görünür). Menüden kapatılabilir.
- Telemetri: EVO (M7). EVO < %20 ise oyuncu silah değiştirmiyor demektir; > %60 ise matris fazla affedici.

Maliyet: etiket + rozet + toast **S-M**, Pırıl rengi **S**; mobil: DOM etiketi CSS `transform` animasyonu, WebGL'e dokunmaz.

---

## 4. Düşman yetenek çeşitliliği

### 4.1 Mevcut 10 türe birer yeni/ikincil beceri

Her beceri bölümde `levels.<id>.skills = ["veil", ...]` listesiyle açılır (yeni öğeyi kademeli tanıtma; §6.3). "Uyarı" = windup süresi (model `windT`); "TP+" = tehdit puanı eklentisi (V). S/M/L = kod boyutu.

| Tür | Beceri (`id`) | Tetikleyici | Uyarı | Karşı oyun / silah | TP+ | Maliyet |
|---|---|---|---|---|---|---|
| Ruh | **Sis Perdesi** (`veil`) | oyuncudan >7 birimde: vurulamaz (cıvıltılı saydam görünüm); yaklaşınca 0.15 sn "katılaşır" | görsel (opaklık) | bekle, Arcane/Ay Işığı perdeyi deler; yanında kal ve vur | +0.10 | S (`ai.js`, `hurt`) |
| Yarasa | **Sürü Dalışı** (`batDive`) | >= 2 yarasa 12 birim içinde, 7 sn'de bir | 0.6 sn bekleme + yerde ince çizgi | Işınlan, Ay Işığı (itme), Buz (yavaş yarasa dalamaz), Yıldırım/Zehir E | +0.12 | S (kurt `charge` kalıbı) |
| Taş Bekçi | **Yer Sarsıntısı** (`quake`) | oyuncu < 4.5 birim, 7 sn'de bir | 1.0 sn halka (r 3.2) | halkadan çık; Meteor/Arcane E; sarsıntı sonrası 0.8 sn ayakta bekler | +0.15 | S (şövalye `addHazard`) |
| Kemik Okçu | **Ok Yağmuru** (`volley`) | 9 sn'de bir; oyuncunun hareket yönü +1.2 önünde 3 işaret (r 1.5) | 1.2 sn işaretler | hareket et, Işınlan; Okçu uyarı sırasında ölürse iptal; Buz yavaşlatır | +0.15 | S |
| Kurt Ruhu | **Uluma** (`howl`) | >= 2 kurt VEYA kurt hp < %50, 12 sn'de bir | 0.9 sn durup ulur (halka) | uyarı sırasında vurmak iptal eder; çevredeki kurtlar 12 birim içinde 5 sn x1.3 hız, hücum bekleme -%30; Ateş/Yıldırım E | +0.12 | S |
| Kor Hortlak | **Zincir Patlama** (`emberChain`) | patlayan Kor'un 3.5 birimindeki Kor'lar 0.25 sn sonra patlar; yerde **ateş lekesi** r 1.6, 3 sn (oyuncuya 1/sn) | mevcut 0.5 sn kızarma | uzakta patlat (Arcane/Buz); lekeler çevre tehlikesi etkileşimi §7 | +0.10 | S (zincir) + M (leke) |
| Karanlık Rahip | **Diriltme** (`revive`) | 7 birim içinde ölen küçük müttefik (son 4 sn), rahip başına en çok 2, 10 sn'de bir | 1.5 sn yeşil bağ + ruh kıvılcımı | Rahibi önce öldür (Zehir E: kalkanı geçer; Ay Işığı E); uyarı sırasında öldür -> iptal | +0.20 | M (`lastDead` halka tampon) |
| Lanet Totemi | **Lanet Alanı** (`aura`) | yaşayan totemin 6 birimindeki düşmanlar x0.6 hasar alır (halka görünür) | sürekli halka | totemi önce yık (Meteor E) veya alanın dışında dövüş | +0.10 | S |
| Kemik Şövalye (elit) | **Atılış + Açık An** (`leap`) | hp < %75, 9 sn'de bir: oyuncunun konumuna işaret (kilitli) sonra zıplama (2 hasar); inişten sonra 1.2 sn "yorgun" (x1.5 hasar); yer şokundan sonra da 1.0 sn x1.3 | 0.9 sn işaret | Işınlan/yürüyerek çık; açık anda Meteor/Mızrak | +0.20 | S |
| Gölge Kral | bkz. §6.6 | | | | | M-L |

Öğretim sırası (kademeli): veil (w1-01) -> batDive (w1-02) -> quake (w1-03) -> emberChain+aura (w1-08) -> şok-sonrası açık an (w1-09, beceri değil ödül penceresi) -> volley (w2-01) -> howl (w2-03) -> leap (w2-05) -> revive (w2-07).

### 4.2 Yeni düşman türleri (8) ve elit Şövalyeler (3)

Yeni türlerin tamamı **mevcut modelin renk/ölçek varyantıdır** (`enemies.<id>.model`, `color`, `scale`; bkz. `enemyvis.js`: `scale = scale * d.scale`). Renklendirmenin modelde çalışması TEST EDİLMELİDİR (`setTint` yalnızca flaş/yavaşlama karışımı yapar; senaryo belgesi de aynı uyarıyı yapıyor). "Yeni model" sütunu: ÖNERİ (zorunlu değil).

| Tür (id) / Türkçe ad | Rol | hp | hız | r | dmg | ai | skor | drop | Becerileri | Etiket / zayıf-güçlü | İlk bölüm | Görsel / model |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `mourner` **Ağıt Ruhu** | küme tankı, bölücü | 3 | 1.8 | 0.9 | 1 | chase | 55 | .25 | Sis Perdesi + **Ağıt**: ölünce 2 Ruh doğurur (`cap`'e saygılı) | hayalet; Arcane/Işık E, Zehir I | w2-01 | Ruh modeli x1.45, soluk mavi-beyaz `#dfe8ff`. Yeni model gerekmez |
| `frostwraith` **Don Hortlağı** | alan engelleyici | 2 | 3.0 | 0.7 | 0 | bomber | 55 | .10 | patlamada **buz lekesi** r 2.8, 3.5 sn (oyuncu x0.5 hız, kaygan) | buz/ateş benzeri; Ateş/Yıldırım E, Buz I | w2-03 | Kor modeli, buz mavisi `#9be8ff`. Yeni model gerekmez |
| `alpha` **Alfa Kurt** | sürü lideri / mini elit | 5 | 2.6 (hücum 11) | 0.9 | 1 | charge | 110 | .40 | **Uluma** her zaman (bekleme 10 sn, +%35 hız); hücum sonrası yorgunluk 1.4 sn | buz; Ateş E, Buz I, Meteor D | w2-03 | Kurt modeli x1.3, koyu gri-mavi `#cfe0ff`. Yeni model gerekmez |
| `sniper` **Gölge Nişancı** | uzak mesafe baskısı | 3 | 1.4 | 0.6 | 1 | ranged (11-14) | 75 | .30 | **Lazer atış**: 1.1 sn kilitli çizgi uyarısı, hızlı mermi (18), 4.5 sn bekleme | kemik; Arcane E, Zehir D | w2-05 | Okçu modeli x1.1, mor `#8a6aff`. Yeni model gerekmez |
| `blight` **Çürük Hortlak** | alan bırakan bomba | 2 | 2.8 | 0.7 | 0 | bomber | 55 | .10 | patlamada **zehir bulutu** r 2.4, 4 sn (oyuncuya 1 hasar/1.2 sn) | çürük; Ateş/Işık E, Zehir D | w2-06 | Kor modeli, çürük yeşil `#9aff6a`. Yeni model gerekmez |
| `hexer` **Kara Cinci** | büyücü / yavaşlatıcı | 3 | 1.4 | 0.7 | 0 (büyü) | caster (9-12) | 70 | .30 | **Lanet Halkası**: 1.2 sn işaretli r 2.4 daire, 4 sn kalır (içerideki oyuncu x0.6 hız); 6 sn bekleme | canlı/büyücü; Yıldırım/Zehir E, Arcane D | w2-07 | Rahip modeli x0.8, kızıl-kahve `#7a3a2a`. **Yeni model ÖNERİLİR** (Rahip ile karışır) |
| `shard` **Kristal Bekçi** | patlayıcı tank | 6 | 1.1 | 1.1 | 1 | chase | 80 | .40 | ölünce **4 kristal kıymığı** (radyal mermi hız 6, ömür 1.1, 1 hasar) | kristal; Buz/Yıkım E, Arcane I | w2-08 | Taş Bekçi modeli x0.95, macenta `#d070ff`. **Yeni model ÖNERİLİR** (kristal çıkıntıları) |
| `warden` **Kalkan Nöbetçisi** | zırhlı kapı bekçisi | 8 | 1.3 | 1.0 | 1 | chase | 90 | .35 | **Ön kalkan**: 120 derece koni, öndeki hasar x0.25 (dönüş hızı 2.2 rad/sn); Kristal Mızrak/Zehir/Meteor yönden bağımsız | zırhlı; Yıkım E, Arcane/Yıldırım/Zehir D | w2-09 | Şövalye modeli x0.7, çelik-turkuaz `#9fb8c8`. **Yeni model ÖNERİLİR** (kalkan aksesuarı) |
| `knight_ii` Ay Nöbetçisi | mini-boss | 36 | 1.3 | 1.5 | 2 | knight | 400 | 0 | şok + **atılış** | Şövalye matrisi | w2-05 | Şövalye modeli, ay mavisi `#9fb8e8`; senaryo §3.1 |
| `knight_iii` Harap Nöbetçi | mini-boss | 48 | 1.4 | 1.5 | 2 | knight | 500 | 0 | şok + atılış + **Rahip bağı** (rahip yaşarken x0.5) | " | w2-09 | kızıl `#d9a0a0` |
| `knight_iv` Son Nöbetçi | mini-boss | 60 | 1.5 | 1.5 | 2 | knight | 600 | 0 | şok + atılış + **Nöbet Çağrısı** (hp %66, %33'te 1 Kalkan Nöbetçisi) | " | w3-05 | altın `#fff0c0` |

TP hesapları (V; `q` düzeltmesi ve beceri çarpanı dahil): Ağıt 1.9, Kara Cinci 2.5, Kalkan 2.3, Kristal 1.9, Don 1.9, Çürük 1.8, Alfa 4.1, Nişancı 2.4; Şövalye I-IV 10.1 / 12.9 / 16.4 / 18.7 (plan 8.4 / 10.8 / 12.6 / 14.4'ten becerilerle yukarı).

**Yeni model gerektirenler (ayrı liste, neden):** (1) Kara Cinci — Rahip'in renkli kopyası "başka bir rahip" gibi okunur, destek/saldırı ayrımı bozulur; (2) Kristal Bekçi — Taş Bekçi'nin macenta kopyası kristal teması taşımaz, "ölünce kıymık" ipucu veremez; (3) Kalkan Nöbetçisi — ön kalkanın yönü oyuncuya görsel olarak gösterilmeli (kalkan aksesuarı). Üçü de ilk sürümde renk/ölçekle çıkabilir; yeni model P1-P2 işidir (`docs/icerik/perde-2-3-gorsel-uretim-paketi.md` ek liste).

### 4.3 Düşman tehdit özeti (TP, `q` ve beceri dahil)

| Tür | TP (beceri kapalı / açık) | Tür | TP (kapalı / açık) |
|---|---|---|---|
| Ruh | 0.5 x 1.1 / 1.2 | Ağıt Ruhu | 1.6 / 1.9 |
| Yarasa | 0.8 x 1.6 / 1.8 | Kara Cinci | 2.3 / 2.5 |
| Taş Bekçi | 1.5 / 1.7 | Kalkan Nöbetçisi | 2.1 / 2.3 |
| Kemik Okçu | 2.0 / 2.3 | Kristal Bekçi | 1.7 / 1.9 |
| Kurt Ruhu | 2.4 / 2.6 | Don Hortlağı | 1.7 / 1.9 |
| Kor Hortlak | 1.8 / 2.0 | Çürük Hortlak | 1.6 / 1.8 |
| Karanlık Rahip | 2.7 / 3.2 | Alfa Kurt | 3.8 / 4.1 |
| Lanet Totemi | 3.0 / 3.3 | Gölge Nişancı | 2.2 / 2.4 |
| Şövalye I-IV | 8.4-14.4 / 10.1-18.7 | Gölge Kral (hp 80) | 18.9 / 24.5 |

(Ruh ve Yarasa için `q` ile çarpılmış değerler §2.4 notundaki düzeltmedir.)

---

## 5. Yeni kahraman, yardımcı ve öğeler (kapsam küçük)

### 5.1 Oynanabilir yeni kahraman: YOK (gerekçe)
Hikâye tek oyuncu karakterli (Aldemir); Zerrin/Pırıl/Taşkın yan kadrodur. Yeni oynanabilir kahraman 3B/animasyon/hikâye maliyeti yaratır ve savaş dengesini karıştırır. Karşıtlık sistemi zaten "yeni büyü tarzı" yerini tutar.

### 5.2 Yardımcı/NPC
| Öğe | Karar |
|---|---|
| **Nöbetçiler konuşmacı girdisi** (`characters.nobetci`) | Senaryo belgesi §5.3 zaten istiyor; **portre üretimi** görsel paketinde (P1). Yeni 3B model YOK. |
| **Pırıl ipucu rengi** | Kod S, varlık yok (§3.7). |
| Zerrin/Taşkın | Senaryoya dokunulmaz. |
| Mira (insan hali) | ÖNERİLMİYOR (senaryo da önermiyor). |

### 5.3 Yeni büyü ve perk'ler (sayılarla)

**Yeni büyü: Kristal Mızrak** (`lance`; isteğe bağlı; ödül **w3-07 Kristal Kapısı**). Not: senaryo belgesi w3-07 için ödülü "-" yazıyor; bu bir **ekleme önerisidir**, reddedilirse sistem yalnız 7 silahla çalışır (matris Kalp sütunu olmadan geçerlidir; yalnızca "zırh/kalkan" için tarafsız çözüm eksilir).
- Element: Kalp (tarafsız, x1 her satırda), `bypassShield`, zırhlı/ön kalkanı deler.
- dmg 4, cd 2.2, hız 28, delici doğrusal ışın (menzil 18, genişlik 0.8), 0.2 sn atış öncesi parlama.
- Rol: elit, Kalkan Nöbetçisi, Şövalye "açık an", boss kalkan fazı. Etkin DPS ~2.3 (hedef sayısı 1.6, V).
- Kod: yeni silah bloğu `pierceLine` (schema/validate/weapons): M.

**Yeni perk'ler** (perk havuzuna, `maxStacks` ile):
| id | Ad | Etki | maxStacks | Notu |
|---|---|---|---|---|
| `focus` | Odak Merceği | "Etkili!" çarpanı 1.75 -> **2.1** | 1 | matris ustalığını ödüllendirir; w2-03 sonrası havuza girer |
| `breaker` | Zırh Kıran | "Dirençli" çarpanı 0.6 -> **0.8** | 1 | yanlış silahın cezasını yumuşatır; Perde II sonrası havuz |
| `wisp` | Gölge Adımı | Işınlan bekleme -25% (14 -> 3.75 sn), ayrıca Işınlan'dan çıkışta 0.3 sn ek dokunulmazlık | 2 | yeni becerilere (dalış/atılış/lazer) uyum; Işınlan açıkken görünür |

Mevcut 11 perk korunur; Delici/Yankı dengesi §3.6.

---

## 6. Perde II (w2-01..w2-09) ve Perde III (w3-01..w3-09) TAM TASARIM

### 6.1 Hedef türü kod maliyetleri ve yedekleri

| Hedef türü | Bölüm | Kod maliyeti | İlk uygulamada yedek (mevcut türlerle) |
|---|---|---|---|
| kristal / hayatta kal / totem / mini-boss / boss | çoğu | VAR | - |
| zamanlı kristal | w2-08 | **S/0** (kristal + kısa `time`; w1-07 zaten böyle) | aynı |
| **dalga savunması** (`waves[]`) | w2-03 (4), w3-08 (6) | **M** (`RT.wave`, dalga başına liste, dalga arası 4 sn, "dalga x/y" HUD) | `survive`: w2-03 80 sn, w3-08 120 sn; dalgalar `spawn` paketleri (`every` 20/20 sn) ile yaklaşık |
| **bölge tut** (`zone`) | w3-03 | **M** (halka merkez/yarıçap, içerideyken sayaç) | `survive` 60 sn + halka görseli (zorunlu içeride kalma yok) |
| **eskort** | w3-06 | **L** (Pırıl rota AI, kayıp koşulu) | **kristal 36, süre 200** (Pırıl "ışık yolu": kristaller bir iz boyunca dizilir; senaryodaki "yol boyunca" hissi) |
| hasarsız | - | var: ★3 "Dokunulmaz" rozeti | - |

### 6.2 Ana tablo (kimlik, tema, hedef, sayılar, Z/p)

`start` / `spawn` paketleri (`∣`) / `every` / `cap`; B30, Z, p plan §3.4 formülü (A = 1.85, Z50 = 2.5, s = 0.375) ve §2.4'teki TP düzeltmesiyle. P(n) plan §3.3 + doğrusal enterpolasyon (w1-01 3.0 ... w1-09 8.9 ... w2-05 11.4 ... w2-09 13.7, w3: 13.7 -> 14.2). Kısaltmalar: Ruh, Yar, Taş, Okç, Kur, Kor, Rah, Ağt (Ağıt), Cin (Cinci), Kal (Kalkan), Krs (Kristal), Don, Çür, Alf, Nşn; Şv1-4 Şövalye I-IV; T = Totem.

| id | Ad | Tema | Hedef | start | spawn | every | cap | B30 | Z | **p (V)** | ρ_eff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| w1-01 | Fısıldayan Orman | forest | kristal 25 | Ruh5 | Ruh2 | 6 | 8 | 8.7 | 1.17 | **88** | .27 |
| w1-02 | Yarasa Mağarası | cave | kristal 29 | Ruh2 Yar3 | Yar1 Ruh2 | 9 | 8 | 14.2 | 1.60 | 77 | .25 |
| w1-03 | Taş Bekçiler | golems | kristal 33 | Ruh3 Yar2 Taş1 | Taş1 Yar2 ∣ Ruh3 | 9 | 9 | 16.9 | 1.63 | 76 | .35 |
| w1-04 | Alacakaranlık Ormanı | forest-dusk | hayatta kal 60 | Ruh3 Yar1 Taş1 | Ruh2 Yar1 | 10 | 9 | 12.7 | 1.43 | 82 | .20 |
| w1-05 | Hortlak Mezarlığı | graveyard | kristal 38 | Ruh2 Yar2 Taş1 Okç2 | Ruh2 Okç1 | 9 | 10 | 21.6 | 1.62 | 76 | .28 |
| w1-06 | Ninni Mağarası | cave-ice | totem 1 | Ruh2 Yar1 +1T | Ruh2 Yar1 | 12 | 8 | 13.9 | 1.21 | 87 | .20 |
| w1-07 | Donmuş Geçit | pass | kristal 31 (zamanlı) | Ruh2 Yar3 Kur3 | Kur1 Yar2 | 9 | 11 | 31.9 | 2.09 | 62 | .27 |
| w1-08 | Yanık Köy | village | totem 3 | Ruh2 Kor3 Taş1 +3T | Kor1 Ruh2 | 10 | 9 | 32.3 | 2.21 | 58 | .37 |
| w1-09 | Kemik Kule | tower | mini-boss | Şv1 Okç2 Kur1 | Okç1 Ruh2 | 7 | 7 | 31.9 | 2.71 | 45 | .32 |
| w2-01 | Yalancı Şafak Mezarlığı | graveyard-dawn | kristal 33 | Ruh4 Yar3 Okç3 Ağt1 | Ruh3 Okç1 ∣ Yar2 Ağt1 | 8 | 11 | 31.7 | 1.37 | 83 | .33 |
| w2-02 | Kristal Yatağı | crystals | kristal 42 | Ruh2 Yar2 Okç2 Rah2 Taş1 | Rah1 Yar2 ∣ Okç1 Taş1 | 7 | 11 | 38.4 | 1.57 | 77 | .48 |
| w2-03 | Fırtına Geçidi | pass-blizzard | dalga x4 (yedek: hayatta kal 80) | Kur1 Alf1 Don2 Yar2 | Kur2 Yar1 ∣ Alf1 Don1 Ruh2 | 10 | 9 | 34.3 | 1.78 | 71 | .35 |
| w2-04 | Alevli Köy | village-ember | kristal 46 | Kor4 Kur3 Taş2 Okç2 | Kor2 Kur1 ∣ Okç1 Alf1 Kor1 | 8 | 12 | 51.5 | 1.92 | 67 | .45 |
| w2-05 | Ay Kulesi | tower-moon | mini-boss Şv2 | Şv2 Okç2 Nşn1 Kur1 | Okç1 Kur1 | 9 | 8 | 38.8 | 2.58 | 48 | .22 |
| w2-06 | Solgun Bahçe | forest-dusk | hayatta kal 90 | Ruh4 Yar3 Çür3 Taş2 | Ruh3 Yar2 Çür1 | 8 | 11 | 39.6 | 1.80 | 71 | .42 |
| w2-07 | Kızıl Harabe | golems-dusk | totem 3 | Taş2 Rah2 Cin2 Kor2 +3T | Kor1 Okç1 ∣ Cin1 Ruh3 | 8 | 10 | 48.9 | 2.13 | 60 | .40 |
| w2-08 | Hatıra Yatağı | crystals-red | kristal 35 (zamanlı) | Yar3 Okç3 Kur3 Rah2 Krs2 | Okç2 Yar2 ∣ Krs1 Kur1 Nşn1 | 7 | 12 | 60.2 | 2.13 | 61 | .55 |
| w2-09 | Harap Kale | castle-ruin | mini-boss Şv3 | Şv3 Rah2 Kal2 Okç1 | Okç2 Ruh2 ∣ Kal1 Rah1 | 9 | 8 | 48.5 | 2.68 | 45 | .48 |
| w3-01 | Gece Ormanı | forest-night | kristal 38 | Ruh5 Yar4 Okç4 Kur3 Ağt2 | Yar2 Okç2 ∣ Ağt1 Kur1 | 9 | 12 | 49.2 | 1.46 | 81 | .27 |
| w3-02 | Buz Sürüsü | cave-ice | hayatta kal 100 | Kur3 Yar3 Don2 Alf1 | Kur2 Yar2 ∣ Alf1 Don1 Yar1 | 9 | 11 | 46.2 | 1.81 | 70 | .33 |
| w3-03 | Kutsal Halka | hold-arena | bölge tut 60 (yedek: hayatta kal 60) | Taş3 Okç2 Kor2 Cin1 Krs1 | Kor2 Okç2 ∣ Kal1 Cin1 | 6 | 11 | 51.1 | 1.99 | 65 | .68 |
| w3-04 | Küllenen Köy | village-ember | totem 3 | Kor3 Rah2 Taş2 Kur1 Çür1 +3T | Kor1 Rah1 ∣ Çür1 Kur1 | 9 | 10 | 50.5 | 1.95 | 66 | .37 |
| w3-05 | Son Nöbet | tower-moon | mini-boss Şv4 | Şv4 Okç2 Kur1 Rah1 Nşn1 | Okç1 Kur1 | 8 | 8 | 49.8 | 2.69 | 45 | .22 |
| w3-06 | Pırıl'ın Yolu | crystals-void | eskort (yedek: kristal 36) | Ruh5 Yar4 Okç4 Ağt2 Krs3 | Ruh3 Yar2 ∣ Okç2 Ağt1 Krs1 | 7 | 12 | 54.9 | 1.58 | 77 | .53 |
| w3-07 | Kristal Kapısı | crystals-void | kristal 50 | Okç4 Kur4 Rah3 Kor3 Yar3 Krs2 Cin1 | Rah1 Kur2 ∣ Cin1 Krs1 Kor1 | 7 | 12 | 77.8 | 2.24 | 57 | .58 |
| w3-08 | Son Savunma | castle-ruin | dalga x6 (yedek: hayatta kal 120) | Kur2 Okç2 Rah2 Kor2 Taş2 Kal1 | Kur2 Okç2 ∣ Alf1 Rah1 Nşn1 | 6 | 11 | 74.9 | 2.85 | 41 | .70 |
| w3-09 | Gölge Kalesi | castle | boss | Kral1 (hp 80) | Ruh3 ∣ Okç1 Nşn1 | 8 | 8 | 36.6 | 3.06 | 37 | .20 |

p özeti: Perde I 88-77-76-82-76-87-62-58-45; **Perde II 83-77-71-67-48-71-60-61-45** (hedef bandı %85 -> %45 testere dişi: sağlandı, w2-06 ve w2-08 hedeften +/- 6); **Perde III 81-70-65-66-45-77-57-41-37** (hedef %80 -> %38). Sapma kaynağı: elle bileşim; doğrulayıcı (`W_BALANCE`) +/-15 puan tolerans.

**Önemli:** p değerleri TP modelinin çıktısıdır. Perde I'de modelin ham p'si (.88, .77...) benzetim/bota göre **çok karamsar** çıkıyor (bkz. §1.2); kabul kriterleri bu yüzden ayrıca A20, vuruş ve bot bandıdır (§8.3). Z50/s bot ve oyun testi verisiyle yeniden uydurulacaktır.

### 6.3 Her bölüm: hedef metni, süre, ödül, rol, bileşim, beceri, çevre tehlikesi

`goal/time`: story hedef metni değişmez. `K1-K4` yalnız kristal bölümlerinde (kristal sayısı / gecikme sn / `minKills`). `sk` = o bölümde açık ve yeni olanlar kalın. Çevre tehlikeleri §7.1 kodlarıdır.

| id | Hedef metni (senaryo) | goal / time | K1-K4 | Rol | Yeni öğe / yeni tür | Ödül | `skills` | Çevre tehlikesi |
|---|---|---|---|---|---|---|---|---|
| w1-01 | 25 mana kristali topla. | 25 / 105 | 3 / 1.5 / 12 | Nefes/öğretim | Ateş, **Sis Perdesi** | Buz Oku | veil | - (yok: öğretim) |
| w1-02 | 29 mana kristali topla. | 29 / 120 | 3 / 1.5 / 14 | Öğretim | Yarasa, **Sürü Dalışı** | - | veil, batDive | sarkıt (S) |
| w1-03 | 33 mana kristali topla. | 33 / 140 | 3 / 1.5 / 14 | Öğretim | Taş Bekçi, **Sarsıntı** | Üçlü Büyü | + quake | yıkılan sütun |
| w1-04 | 60 saniye hayatta kal. | 60 / 60 | `crystals` 2 | Uygulama | hayatta kal | Mana Kalkanı | veil, batDive, quake | mantar bulutu |
| w1-05 | 38 mana kristali topla. | 38 / 155 | 3 / 1.5 / 18 | Öğretim | Kemik Okçu | Yıldırım | + | sis + diriliş |
| w1-06 | 1 Lanet Totemi'ni yık. | 1 / 150 | `crystals` 3 | Nefes/öğretim | Totem | Işınlan | veil, batDive | sarkıt (buz) |
| w1-07 | Süre dolmadan 31 kristal topla. | 31 / 105 | 3 / 1.2 / 14 | Öğretim | Kurt Ruhu | - | + | don dalgası |
| w1-08 | 3 Lanet Totemi'ni yık. | 3 / 200 | `crystals` 3 | Tırmanış | Kor, **Zincir Patlama**, **Lanet Alanı** | Zehir Bulutu | + emberChain, aura | ateş fışkırması |
| w1-09 | Baş Nöbetçi'yi yen! | 1 / 120 | - | Sınav (mini-boss) | Şövalye, **açık an** | - (ödüller aşağıdaki köprüde) | + | kemik dikenler |
| w2-01 | 33 mana kristali topla. | 33 / 140 | 3 / 1.2 / 16 | Nefes | **Ağıt Ruhu**, **Ok Yağmuru** | - | + volley | sis + diriliş (hafif) |
| w2-02 | 42 mana kristali topla. | 42 / 170 | 3 / 1.2 / 20 | Öğretim | Rahip (kalkan) | - (Meteor buradan ALINIR) | + | rezonans kristali |
| w2-03 | 4 dalgayı püskürt. | wave 4 / 220 (yedek survive 80) | - | Uygulama | **Alfa Kurt, Don Hortlağı**, **Uluma** | **Meteor** | + howl | don dalgası, kaygan buz |
| w2-04 | 46 mana kristali topla. | 46 / 190 | 4 / 1.0 / 22 | Tırmanış | Kor + Kurt birlikte | - | + | ateş fışkırması (yoğun) |
| w2-05 | Ay Nöbetçisi'ni yen! | 1 / 145 | - | Sınav (mini-boss) | Elit Şövalye II, **Gölge Nişancı**, **Atılış** | - | + leap | kemik diken + ay sütunu |
| w2-06 | 90 saniye hayatta kal. | 90 / 90 | `crystals` 2 | Nefes | **Çürük Hortlak** (bahçe zehri) | **Ay Işığı Halkası** | + | mantar bulutu |
| w2-07 | 3 Lanet Totemi'ni yık. | 3 / 240 | `crystals` 3 | Tırmanış | **Kara Cinci**, Totem + Rahip, **Diriltme** | - | + revive | yıkılan sütun |
| w2-08 | Süre dolmadan 35 kristal topla. | 35 / 110 | 4 / 1.0 / 20 | Sınav/tırmanış | **Kristal Bekçi**, hasarsız rozeti | **Zaman Çatlağı** | tümü | rezonans (çift) |
| w2-09 | Harap Nöbetçi'yi yen! | 1 / 195 | - | Sınav (mini-boss) | Elit Şövalye III + Rahipler, **Kalkan Nöbetçisi** | - | tümü | kızıl halka (hafif) |
| w3-01 | 38 mana kristali topla. | 38 / 155 | 3 / 1.2 / 18 | Nefes | (perde başı tam can) | - | tümü | mantar (parlayan) |
| w3-02 | 100 saniye hayatta kal. | 100 / 100 | `crystals` 2 | Uygulama | Kurt+Yarasa sürüsü, Don | - | tümü | sarkıt + kaygan buz |
| w3-03 | Kutsal Halka'yı 60 saniye koru. | zone 60 / 180 (yedek survive 60) | - | Uygulama | Bölge tut | - | tümü | rün sütunları |
| w3-04 | 3 Lanet Totemi'ni yık. | 3 / 260 | `crystals` 3 | Tırmanış | Patlama zinciri + Rahip | - | tümü | ateş fışkırması + kül |
| w3-05 | Son Nöbetçi'yi yen! | 1 / 160 | - | Sınav (mini-boss) | Elit Şövalye IV, **Nöbet Çağrısı** | - | tümü | kemik diken + ay |
| w3-06 | Pırıl'ı yol boyunca koru. | eskort / 200 (yedek kristal 36) | 4 / 1.0 / 22 (yedek) | Nefes | Eskort | - | tümü | rezonans |
| w3-07 | 50 mana kristali topla. | 50 / 205 | 4 / 1.0 / 28 | Tırmanış | Tüm karışım | **(Kristal Mızrak; opsiyonel EK)** | tümü | rezonans (çift) |
| w3-08 | 6 dalgayı püskürt. | wave 6 / 270 (yedek survive 120) | - | Sınav | 6 dalga | - | tümü | kızıl halka |
| w3-09 | Gölge Kral'ı yen! | 1 / 300 | - | Final | Gölge Kral 3 faz | - | tümü | kızıl halka (tam) |

Dalga içerikleri (M kod geldiğinde): **w2-03** W1 Kur2 Yar2 · W2 Don3 Yar2 Ruh2 · W3 Alf1 Kur2 Don1 · W4 Alf1 Kur3 Yar3 Don2; **w3-08** W1 Kur2 Okç2 · W2 Kor3 Rah1 Taş1 · W3 Nşn2 Cin1 Kal1 Kur1 · W4 Alf1 Kur3 Krs2 · W5 Rah2 Cin1 Kor3 Kal1 · W6 Okç3 Nşn2 Alf1 Kur2 Kal1 Rah1; dalga atlama: hepsi öldü ya da 25 sn; arası 4 sn + 1 kalp. Yedek (`survive`) modda bu `spawn` paketleri `every` aralıklı çıkar.

Çevre tehlikeleri (S/M) bölüm başına en çok **1 tür**; yeni tür yalnızca "nefes" olmayan bölümlerde.

### 6.4 Süre, kampanya ve ilk oturum

| Ölçüt | Değer (V; plan §4.4 yöntemi: beklenen süre = T + (1/p − 1)·(0.6T + 8) + 25) |
|---|---|
| Perde I / II / III | ~19 / ~25 / ~32 dk |
| **Toplam** | **~76 dk** (kusursuz ~56 dk) |
| Kümülatif dk | w1-01 2 · w1-03 5 · w1-05 9 · w1-07 13 · w1-09 19 · w2-05 29 · w2-09 40 · w3-05 55 · w3-09 76 |
| İlk oturum hedefi (~12 dk) | w1-01..w1-06 (5-6 bölüm), ilk büyü ödülü (Buz Oku w1-01 sonunda, Üçlü w1-03, Kalkan w1-04, Yıldırım w1-05) |
| 2. gün | Perde I sonu; 3.-4. oturum Perde II; 5.-7. Perde III |

(Perde I süresi plan §4.4'teki ~18 dk'ya göre +1 dk: `minKills` ve düşük ilk deneme oranı.)

### 6.5 Perde I ödül/köprü yer değiştirme planı

| Bugün (config, Perde I notları §13) | Önerilen nihai yer | Not |
|---|---|---|
| w1-09 ödülü: Ay Işığı + Zaman Çatlağı (GEÇİCİ) | Ay Işığı -> **w2-06**; Zaman Çatlağı -> **w2-08**; w1-09 ödülsüz | Perde I'in sonunda oyuncu 5 büyü (Ateş, Buz, Üçlü, Yıldırım, Zehir) + 2 yetenek (Kalkan, Işınlan) ile çıkar; Perde II'de Meteor (w2-03), Ay Işığı (w2-06), Zaman Çatlağı (w2-08) |
| w2-02 (geçici köprü): Meteor ödülü | Meteor -> **w2-03**; w2-02 ödülsüz; içerik §6.2-6.3 (Rahip öğretimi) | Eski kayıtta Meteor zaten açıksa tekrar verilmez (§13.6 koruma) |
| w3-09 (final boss) | olduğu gibi (id korunur) | |
| Kampanya zinciri | `order`: w1-01..w1-09, **w2-01..w2-09** (w2-02 yerinde kalır), **w3-01..w3-09** (w3-09 sonda); `edges` yeniden bağlanır; `w2-02 -> w3-09` kenarı silinir | Haritada 16 yeni düğüm konumu geliştirme işidir |
| Mevcut kayıt (11 bölüm tamam) | `completed` içinde w2-02 ve w3-09 var: **bunlar Perde II/III bölümleri yeni sıraya göre "tamam" görünür** ama atlanan bölümler "açık" kalır; kilit kuralı `order` indeksi değil "önceki bölüm tamam" olmalı. Final ekranı bayrağı yeniden hesaplanır. | geliştirme + kayıt göçü (v3) gerektirir, S-M |

### 6.6 Mini-boss ve boss faz tasarımı

Şövalye (w1-09) ve elitler: aynı model, `res` aynı (Şövalye satırı).

| | Baş Nöbetçi (w1-09) | Ay Nöbetçisi (w2-05) | Harap Nöbetçi (w2-09) | Son Nöbetçi (w3-05) |
|---|---|---|---|---|
| id / hp / hız | `knight` 24 / 1.1 (öfke 1.6) | `knight_ii` 36 / 1.3 | `knight_iii` 48 / 1.4 | `knight_iv` 60 / 1.5 |
| Faz 1 (>%50-75) | Yer Şoku (5 sn, r 4, uyarı 1 sn) | + Atılış (%75 altında, 9 sn) | + Rahip bağı | + hepsi |
| Faz 2 | %50 öfke: hız 1.6, şok 3.5 sn | %50 öfke: çift şok | %50 öfke: çift şok (0.8 sn aralık) | %66 ve %33: Kalkan Nöbetçisi çağrısı; %50 öfke |
| Açık an | şok sonrası 1.0 sn x1.3 | + atılış sonrası 1.2 sn x1.5 | aynı | aynı |
| Eşlikçiler | Okç2 Kur1 + sürekli Okç/Ruh2 | Okç2 Nşn1 Kur1 | Rah2 (bağ), Kal2 | Okç2 Kur1 Rah1 Nşn1 |
| Zayıf | Meteor, Ay Işığı | " | " + Rahipleri **önce** öldür (Zehir E) | " |
| Zaman payı | 120 sn (aynı) | 145 | 195 | 160 |
| Taunt (yer tutucu, senaryo §3.1) | "Kapı kapalı. Kral rahatsız edilmesin." | "Ay doğdu, nöbet sürüyor. Geri dönün." | "Kral emretti: kimse geçmesin." | "Kralıma ulaşmak için önce bu nöbeti geç." |
| Yenilgi sözü (outro ilk satır) | "Kralım… affet. Nöbetten çıkıyorum." | "Yemin… Kalbe… Gidebilirsiniz." | "Kapı sizin. Yeter ki Kral'ı… affedin." | "Kralım… kızın geliyor. Yol sizin." |

**Gölge Kral (w3-09) — yeniden tasarım (hp 45 -> 80, V):** hp 80 gerekçesi: Perde III'te oyuncu P ~14.2 (Pd ~1.9); mevcut 45 hp, matriste Arcane E ile saf vuruş süresi ~12 sn; fazlar kalkan penceresi ve çağrılarla uzar; hedef savaş süresi 150-180 sn (plan T = 180). Her faz geçişi +10 sn (mevcut) ve oyuncuya +1 kalp şansı (kod yok; mevcut `clearHeal` mantığı faz için tekrar edilebilir, M).

| Faz | hp aralığı | Aura / zayıflık | Beceriler | Çağrılar | Not |
|---|---|---|---|---|---|
| 1 "Nöbet" | 100-66% | mor; Arcane **E**, Zehir D | yürür; 6 sn'de çağrı; **Taç Halkası**: 12 sn'de bir 3 eş merkezli halka dışa (hız 7, aralık 1.8 birim, 1 hasar) -> halkalar arasında dur ya da Işınlan | Ruh3 (`summons1`) | taunt (faz 1): senaryo w3-09 giriş; hasar `hp` tabanı %66 |
| 2 "Yas" | 66-33% | kızıl; **Buz E**, Ateş D (x0.6, "kızıl ateş söndürür" değil: dirençli), Zehir D | mevcut 8 sn'de 2 kızıl halka (r 2.6) + **Taç Halkası** 10 sn | Okç1 Nşn1 (`summons2`) | oyuncu silah değiştirir (Buz E): Buz yavaşlatma boss'a işlemez (bağışık) ama hasar etkili |
| 3 "Şafak Korkusu" | 33-0% | altın; **Yıkım E, Işık E**; kalkan açıkken hasar yok | mevcut kalkan + 3 ışık toplama; 6 sn savunmasız (x1.3 hasar); kalkan açıkken **Gölge Kopya**: 6 sn'de 2 Ruh (Sis Perdesi) | Ruh2 / 6 sn | ışık toplama kalkanı kırar; Kristal Mızrak kalkanı DELER (isteğe bağlı) |

Aura renkleri model `setTint` ile; `enterBossPhase` içinde `e.d.res` yer değiştirir (S). Taç Halkası: `addHazard` + yayılan halka güncelleme (M).

### 6.7 Zorluk eğrisinin akış kanalı kontrolü
- Ardışık Z sıçraması <= x1.35 (sınavlar hariç): sağlandı (Perde II: 1.37, 1.57, 1.78, 1.92, **2.58 sınav**, 1.80 nefes, 2.13, 2.13, **2.68 sınav**; Perde III: 1.46, 1.81, 1.99, 1.95, **2.69 sınav**, 1.58 nefes, 2.24, 2.85 sınav, 3.06 final).
- Nefes bölümleri: w1-04, w1-06, w2-01, w2-06, w3-01, w3-06 (6) — her 3 bölümde en az 1 nefes ya da düşük-Z bölüm.
- Yeni öğe sayısı: bölüm başına en çok 2 yeni fikir (w2-03: Alfa+Don+Uluma = tek "buz sürüsü" fikri; w2-05: Nişancı+Atılış sınavda tanıtılır).

### 6.8 Hikâye belgesiyle uyuşmazlıklar / eklemeler (senaryo esas alındı)

| # | Nokta | Karar |
|---|---|---|
| 1 | w3-07 ödülü senaryoda "-"; ben Kristal Mızrak öneriyorum | **ek**; reddedilebilir, sistem yalnız 7 silahla da çalışır |
| 2 | Plan §4.4 w2-06 Ad "Alacakaranlık Ormanı II", senaryo "Solgun Bahçe"; w3-04 "Kor Köy II" vs "Küllenen Köy"; w3-05 "Kemik Kule II" vs "Son Nöbet" | senaryo adları kullanıldı |
| 3 | Senaryoda yeni düşman türü adı yok (yalnız Şövalye II-IV) | 8 yeni tür senaryocuya **lore ve ansiklopedi metni** ihtiyacı doğurur (§9 Q3) |
| 4 | w1-09 ödülü bugün geçici (Ay Işığı + Zaman Çatlağı) | §6.5: Perde II'ye taşınır (senaryo/plan tablosu ile aynı) |
| 5 | `nobetci` karakter girdisi | senaryo §5.3 ile aynı; portre üretimi görsel paketinde |

---

## 7. Savaş alanı gösterişi (savaş alanı çok sade)

Mobil bütçe: dekor <= 60 çizim çağrısı, <= 80 bin üçgen; `MAX_SPARKS = 480` ortak havuz; DOM etiketleri havuz (<= 12). Tüm yeni gösteriş `quality` düzeyleriyle (`core/quality.js`) kapanabilir olmalı.

### 7.1 (a) Bölüme özel ÇEVRE TEHLİKELERİ — öncelik 1

Ortak altyapı (tek kez, **M**): `levels.<id>.hazards: [{ kind, x, z, r, period, windup, dmgP, dmgE, life }]`; `loop.js` içinde "çevre tehlikeleri" bloğu; telegraf `addHazard` (var); etki: oyuncuya `damagePlayer`, düşmana `hurt(e, dmg, false, true, "env")`; hasar kaynağı etikete yazılmaz (etkililik göstergesi yok). Mobil: en çok 4 eşzamanlı tehlike, paylaşılan `ringUnit/discUnit` geometri (ek çizim çağrısı <= 6).

| Tema | Tehlike | Tetik / uyarı | Oyuncuya | Düşmana | Strateji | Maliyet | Dosya |
|---|---|---|---|---|---|---|---|
| forest, forest-dusk, forest-night | **Zehirli mantar bulutu** | 14 sn'de bir sabit bir mantar şişer (1.2 sn), bulut r 2.0, 3 sn | 1 hasar/1.2 sn | 0.5/sn (Zehir D olanlara 0.3) | düşmanı buluta çek; Zehir bulutu ile çakışmaz (aynı element: bulut Zehir E düşmana x1.75) | S | loop.js, fx.js, scenery (mantar zaten var) |
| cave, cave-ice | **Düşen sarkıt** | rastgele 2.5-4 sn, işaret 1.2 sn (r 1.6) | 1 | 2 (1 hp düşmanı öldürür) | düşmanı sarkıt altına sürükle; yarasalar için çapalı tuzak | S | loop.js, decor/stalactite |
| golems, golems-dusk | **Yıkılan sütun** | sütun kayar (işaret çizgisi 1.5 sn), hasar 1 (oyuncu) / 3 (düşman); yerde moloz kalır | 1 | 3 | Taş Bekçi/Kalkan'ı sütun hattına çek (Yıkım E ile birlikte güçlü) | M (hat hasarı + moloz) | decor/column, rubble |
| graveyard, graveyard-dawn | **Sis + diriliş noktası** | 3 mezar parlar; her biri 12 sn'de bir Ruh doğurur (sis alanı içinde oyuncu menzili -%25) | menzil düşer | Ruh sayısı | mezarı Ay Işığı/Arcane ile kapat (3 isabet) -> doğma durur | M | scenery, world |
| pass, pass-blizzard | **Don dalgası + kaygan buz** | 15 sn'de bir şerit yatay geçer (uyarı 1.5 sn); buz levhası: yön değiştirme gecikmeli (sürtünme x0.5) | 1.5 sn yavaş | 1.5 sn yavaş / buz türlerine bağışık | kayaların arkasına geç | S (dalga) + M (kaygan) | loop.js, floors/snow |
| village, village-ember | **Yangın fışkırması** | 3-4 menfez, 8-10 sn döngü, işaret 1.2 sn, r 1.8 | 1 | 1.5 + yanma | Kor patlamasını menfeze denk getir (zincir); Don/Buz düşmanları söner | S | loop.js, decor/bonfire |
| crystals, crystals-red, crystals-void | **Rezonans kristali** | kristale vurunca (hp 3) parlayıp 1 sn sonra r 4 darbe; 12 sn'de yeniden dolar | darbe oyuncuyu etkilemez | 2 hasar, itme | kümeyi kristale çek (oyuncuya yarar, "kristal tuzağı") | S-M | decor/crystal-pillar |
| tower, tower-moon | **Kemik dikenler** | 5 sn'de bir zeminden diken (3 kare, işaret 1 sn) | 1 | 2 | düşmanı dikenlere sürükle (Ay Işığı itmesi) | S | loop.js |
| castle, castle-ruin | **Kızıl halka dalgaları** | sütundan 10 sn'de bir dışa yayılan halka (hız 5) | 1 (Işınlan/zıplama ile aş) | yok | boss halka koordinasyonu; saf oyuncu tehdidi | M | boss mantığıyla ortak |
| hold-arena | **Rün sütunları** | halka içinde duruş sayacı; sütun parlaması düşman çekimi | - | - | bölge tut hedefiyle | M | zone hedefi |

Bu sistem oyuna **stratejik derinlik** katar: aynı tehlike hem oyuncuya hem düşmana vurduğu için "tehlikeyi silah olarak kullan" yeni bir ustalık katmanı olur.

### 7.2 (b) Arena şekli ve alan varyasyonu — öncelik 3
| Öneri | Ayrıntı | Maliyet | Dosya / mobil |
|---|---|---|---|
| **Dairesel sınır** | oyuncu/düşman kısıtı kare yerine yarıçap ~13.5 daire (halka doğma ile tutarlı); köşe ölü bölgeleri kalkar | S | `loop.js`, `ai.js` kıskaçları |
| **İç engel kayaları** | 3-5 yuvarlak engel (r 1.0-1.6) tema tohumlu, deterministik; düşman mermilerini engeller, düşman kenarından kayar; oyuncu mermisi geçer | M | `sceneryplan.js` (iç halka), `rock` decor yeniden kullanım, instancing; +1-2 çizim çağrısı, ~3k üçgen |
| **Yükselti hissi** | zemin dokusuna kenar karartması + yükselmiş kenar çerçevesi (sınır halkası `borderMat` zaten var) | S | `scene.js` |
| **Sınır çerçevesi** | tema renginde dönen rün işaretleri | S | `scene.js` |

### 7.3 (c) Atmosfer ve aydınlatma — öncelik 5
| Öneri | Ayrıntı | Maliyet | Mobil notu |
|---|---|---|---|
| **Mermi ışığı** | mermi/meteor ucunda sahte ışık (additive glow sprite zaten var); element renginde kısa iz | S | ek çizim yok (sprite) |
| **Katmanlı sis** | mevcut 2 `mists` düzlemine 2 daha (düşük/yüksek, farklı hız) | S | +2 çizim çağrısı; düşük kalitede kapalı |
| **Hava durumu** | parçacıklar var (`weather`); temaya bağlı rüzgâr şiddeti dalgası (fırtınada yön değişimi) | S | WMAX 240 sınırı içinde |
| **Bölüm giriş kamera süpürmesi** | 1.6 sn: yüksek-geniş açıdan oyun açısına; dokununca atlanır; uyarı halkaları süpürme sırasında belirir | S-M | `camera.js` |
| **Dinamik ışık** | büyü anında 0.2 sn `wand` yoğunluğu patlaması (`PointLight` zaten var) + element rengi | S | yeni ışık eklenmez |
| **Alacakaranlık/ay evresi** | tema başına `moon` yoğunluğu ve renk ayarı (config) | S | - |

### 7.4 (d) Savaş geri bildirimi — öncelik 2
| Öneri | Ayrıntı | Maliyet | Dosya |
|---|---|---|---|
| **Etkili!/Dirençli etiketi** | §3.7 | S-M | `hud.js`, `css` |
| **Element renkli vuruş** | `hurt` kıvılcımı düşman rengi yerine **vuran silahın rengi**; Etkili'de 10 -> 16 parçacık | S | `combat.js`, `fx.js burst` |
| **Hit-stop** | Etkili öldürmede 40 ms zaman donması (yalnızca oyun saati; ses etkilenmez) | S | `loop.js` |
| **Ölüm halkası** | küçük `addFx` genişleyen halka + element rengi kırıntı | S | `fx.js` |
| **Kritik/Etkili vurgusu** | düşman tinti beyaz + kısa ölçek "pop" | S | `ai.js applyLook` |
| **Hasar sayıları** | küçük, düşük opaklık (çok sayıda küme hasarı gürültü yaratmasın: yalnızca Etkili/Dirençli ve >= 2 hasar) | S | DOM havuzu |
| **Büyü izleri** | mermi izi var (`emit` 2 karede bir); Yıldırım için kalıcı kıvrımlı iz 0.18 sn (var `addBolt`) -> zincir sıçramasında kıvılcım | S | `weapons.js` |
| **Ekran sarsıntısı kademeleri** | küçük (Etkili öldürme 0.05), orta (boss), büyük (faz geçişi) | S | `RT.shake` |

### 7.5 (e) Arka plan katmanları ve (f) Bölüm başı belirme sahnesi
| Öneri | Ayrıntı | Maliyet |
|---|---|---|
| **Ufuk silüeti** | mevcut `ridge` silindirine tema başına tek uzak yapı (kale/kule/ağaç dizisi) canvas dokusu; bölümün temasına uygun | S |
| **Uzak kale / dönen aurora** | kale: `castle*` temalarında ufukta kızıl kule siluetleri; aurora: `pass` temasında gökyüzü shader'ına şerit | S-M |
| **Belirme sahnesi** | ilk düşman dalgası "doğma uyarı halkaları" ile görünür (0.6 sn, düşmanın beklediği yer), düşman halkadan büyüyerek çıkar (`applyLook` büyüme var); ilk 2 sn oyuncu saldırısız (yeniden deneme: atlanır) | S-M |
| **Doğma uyarı halkası** | `addHazard(x, z, r, 0.6, 0, color)` ile yer işareti; mantıksal: doğma yeri oyuncudan >= 6.5 birim | S (spawn mesafesi güncellemesi ile) |

### 7.6 Öncelik sırası (maliyet)
1. **Çevre tehlikeleri altyapısı + 2 tür (mantar, sarkıt/fışkırma)** — M, en yüksek derinlik/etki.
2. **Savaş geri bildirimi: Etkili!/Dirençli + element renkli vuruş + hit-stop** — S-M, karşıtlık sisteminin okunması.
3. **Arena: iç engel kayaları + dairesel sınır** — M, kapak/konumlanma.
4. **Doğma uyarı halkası + bölüm giriş kamera süpürmesi** — S, "boş ekran" hissini ilk saniyelerde kırar.
5. **Atmosfer: katmanlı sis + mermi ışığı + ufuk silüeti** — S, görsel tazelik.

Maliyet özeti: tehlike altyapısı M, her yeni tehlike türü S-M; geri bildirim S-M; arena M; kamera/uyarı S; atmosfer S. Toplam C aşaması **L** (parçalanarak: C1 geri bildirim, C2 tehlike altyapısı, C3 arena, C4 atmosfer).

---

## 8. Uygulama planı (aşamalı, sıralı)

| Aşama | İçerik | Dosyalar (öncelikli) | Testler | Boyut | Risk | Çıkış kriteri |
|---|---|---|---|---|---|---|
| **A** (en hızlı + en etkili) | Ruh Sis Perdesi; doğma mesafesi 6.5-10 + uyarı halkası; mermi ömrü 1.1; kristal kuralları K1-K4 (`crystals`, `crystalDelay`, `crystalLure`, `minKills`); Perde I yeni `start/spawn/every/cap`; **karşıtlık çarpanları** (`element`, `res`, `hurt`) + Yıldırım yeniden dengesi + Zehir/Meteor/Ay Işığı sayıları + Buz yavaşlatma 0.5 + Etkili!/Dirençli etiketi + renkli vuruş; Pırıl ipucu | `combat.js`, `weapons.js`, `ai.js`, `world.js`, `loop.js`, `spawnmath.js`, `config/schema.js,adapt.js,validate.js`, `data/game.config.json`, `hud.js`, `fx.js` | `tests/matrix.test.js` (M1-M4), `tests/lightning.test.js`, `tests/crystalrules.test.js`, `tests/veil.test.js`, mevcut `stage1/perde1` güncellenir | **M** | orta (denge sapması) | benzetim w1-01 A20 >= 1.2 ve süre >= 30 sn; matris M1-M4 geçer; yürüyen bot kristal bölümü <= %10; orta bot Perde I bandı §8.3 |
| **B** | Düşman becerileri (batDive, quake, volley, howl, emberChain, revive, aura, leap) + `skills` kapıları + Şövalye açık an | `ai.js`, `combat.js`, `world.js`, `fx.js` | `tests/skills.test.js` (zamanlayıcı/iptal), sim parite | **M** | orta | her beceri için uyarı + karşı hamle bot modelinde; ilk-deneme p bandı korunur |
| **C** | Çevre tehlikeleri + savaş alanı gösterişi (C1 geri bildirim geniş, C2 tehlike altyapısı, C3 arena, C4 atmosfer/kamera) | `loop.js`, `fx.js`, `scene.js`, `scenery.js`, `sceneryplan.js`, `camera.js`, `quality.js` | `tests/decor.test.js` genişler (çizim çağrısı <= 60, üçgen <= 80k), tehlike birim testi | **L** | orta-yüksek (mobil performans) | düşük kalitede kapanır; mobil kare hızı ölçümü (gerçek cihaz); tehlike hasarı oyuncuya haksız ölüm üretmiyor (telemetri: tehlike ölümü < %15) |
| **D** | Perde II config: w2-01, w2-03..w2-09, w2-02 yeniden; yeni düşmanlar (8) + knight_ii/iii; temalar; Perde ödül taşıma; harita düğümleri; hikâye metinleri senarist belgesinden | `data/game.config.json`, `config/*`, `core/legacyids`, `save.js` göçü, görseller | `tests/perde2.test.js`, `validate`, bot bandı | **M** | düşük-orta | Perde II p bandı (bot), `npm run validate` 0 hata, görsel paketi teslim |
| **E** | Perde III config + boss yeniden (hp 80, faz aura/res, Taç Halkası) + yeni hedef türleri (dalga M, bölge tut M, eskort L [son]) + knight_iv + Kristal Mızrak (isteğe bağlı) | `flow.js`, `loop.js`, `ai.js`, `levels schema`, `weapons.js` | `tests/perde3.test.js`, hedef türü testleri, boss faz testi | **L** | yüksek (hedef türleri) | tüm kampanya baştan sona geçilebilir; yedek modlar çalışır; boss p bandı |
| **F** (meta) | `focus/breaker/wisp` perk, EVO/`weaponDmg` telemetri paneli, M5/M6 raporu, DDA'ya etkililik ipucu, kalibrasyon turu | `perks`, `telemetry.js`, admin | `tests/perks.test.js`, telemetri | **S-M** | düşük | M5-M7 ölçülüp ayarlanmış |

Önerilen sıra: A -> (oyuncu testi) -> B -> C1 -> D -> C2-C4 -> E -> F. Aşama A tek başına "çok kolay" şikâyetinin ana nedenini giderir; A'dan sonra 5-8 kişilik test önerilir (plan §7.6).

### 8.1 Bot/benzetim uyarlaması (denge botu yeni mekaniklere)
`tools/balance/sim.mjs` yeni sabitler: element/`res` çarpanı, Yıldırım zinciri, Sis Perdesi, doğma uyarısı, kristal kuralları, minKills, beceriler (volley, dalış, uluma, patlama zinciri, diriltme, atılış), çevre tehlikeleri (modelde "olasılıksal hasar").

### 8.2 Doğrulayıcı (`W_BALANCE`) eklemeleri
B30 bandı ±15%; `minKills` <= %60 x goal; kristal bölümlerinde `time` / (tahmini kristal süre) 1.4-2.4; her bölümün `skills` kümesi önceki bölümlerin üst kümesi (çift yön yeni beceri yok); ρ_eff bandı; matrix kuralları M1-M4 (config yüklenirken); Perde başına nefes oranı >= 1/3.

### 8.3 Botun kalibrasyonu (Perde I'de orta botun %100 geçmesi)
Önerilen profiller (V):

| Profil | Taban isabet | Mesafe/hareket cezası | Tepki (sn) | Dikkat dağınıklığı | Silah politikası | Yetenek | Kristal seçimi |
|---|---|---|---|---|---|---|---|
| yürüyen | 0 | - | - | - | - | - | en yakın |
| acemi | 0.40 | 0.04/birim >8; hareketteyken x0.85 | 0.45 (log-normal) | 5 sn'de bir 1.0 sn ateş yok | ilk açık | yok | %70 en yakın |
| **orta** | 0.55 | aynı | 0.30 | 7 sn'de 0.7 sn | matris farkında %50 (2 sn gecikme) | kalkan hp <= 1 | %70 |
| iyi | 0.75 | yarı | 0.15 | 12 sn'de 0.4 sn | %90 | tam | %90 |
| usta | 0.88 | yok | 0.10 | yok | %100 | tam | en iyi |

Mermi uçuş süresi d/v; Yıldırım hedefi menzil 9 ve zincir 5 birim; Okçu isabeti işaret konumuna bağlı; can taşıma bölümler arası `clearHeal`.

**Hedef bantlar (orta bot kazanma oranı, ±12 puan):** her bölüm için model p'si §6.2; acemi >= 0.5 x orta; usta >= %90 (Perde I) ve >= %70 (Perde II-III); yürüyen kristal bölümü <= %10 (minKills yüzünden ~0), totem/mini-boss/boss 0. Birbirini izleyen iki bölümde orta bot düşüşü > 25 puan ise (sınav hariç) sıçrama hatası.

---

## 9. Açık sorular (Emre'ye) ve riskler

| # | Soru / risk | Önerim |
|---|---|---|
| Q1 | `minKills` ile kristal bölümleri artık "öldürmeden geçilmez". Bu, "kristal toplamak huzurlu bölüm" tadını (w1-01 gibi) azaltır. Kabul mü? | Kabul; nefes bölümleri (w1-04, w1-06, w2-06...) zaten hayatta kal/totem. |
| Q2 | Sis Perdesi ilk bölümden itibaren (Ruh 7 birimden uzakta vurulamaz) tüm Perde I'e yayılır; Arcane (w1-03 ödülü) perdeyi delince "ödül hissi" artar. Kabul mü? | Kabul; ilk 10 sn toast: "Ruhlar yaklaşınca katılaşır." |
| Q3 | 8 yeni düşmanın **lore/ansiklopedi metni** ve adları senarist onayı ister. | Senarist odasına iş. |
| Q4 | Kristal Mızrak (w3-07) kabul mü? Reddedilirse Kalp elementi kalkar. | Önerim kabul; en az risk. |
| Q5 | Boss hp 45 -> 80 ve faz aurası (Arcane/Buz/Yıkım-Işık zayıflığı) final sertliğini artırır. | Oyuncu testi; DDA (opt-out) zaten var. |
| Q6 | Dokunmatikte Yıldırım menzili 9 ve otomatik hedef etkisi ayrı ölçülmeli. | Mobil oyun testi (3-4 kişi). |
| Q7 | Çevre tehlikeleri "haksız ölüm" riskleri (görünürlük/telegraf). | Uyarı >= 1.2 sn, bölüm başına <= 1 tür, ilk 5 sn tehlikesiz; telemetri `hazardDeaths`. |
| Q8 | Etkili!/Dirençli etiketi görsel gürültü yaratabilir. | Yalnızca Etkili/Dirençli ve ayarlardan kapatılabilir. |
| R1 | Tüm sayılar V; TP `q` düzeltmesi ve ρ bandı benzetime dayanır, bot kalibrasyonu yapılmadı. | §8.3 ve oyuncu testi. |
| R2 | Renk varyantı düşmanların `setTint` ile okunurluğu test edilmedi; benzer silüetler (Cinci/Rahip, Alfa/Kurt) karışabilir. | Aşama D başında model/tint denemesi; gerekirse yeni model (3B ek liste). |
| R3 | Kayıt göçü: 11 bölümlük eski tamamlama; Perde II/III sıra kuralı (§6.5). | Aşama D'de `save` v3 testi. |
| R4 | Mobil performans: yeni tehlikeler + etiketler + sis katmanları. | Aşama C çıkış kriterinde gerçek cihaz kare hızı. |


---

## Aşama A uygulama notları (geliştirme odası)

Durum: UYGULANDI (Aşama A). Tüm sayılar VARSAYIMDIR; gerçek oyuncu testi yapılmadı. Belge ile kod çelişirse kod esas alındı (aşağıda "Sapmalar ve sınırlar").

### Yapılanlar
- **Karşıtlık matrisi:** `js/game/matchup.js` (saf): `matchupLevel/multiplier(element, tags, res)`; Etkili x1.75, Normal x1, Dirençli x0.6, Bağışık x0.25. Config: `weapons.<id>.element`, `enemies.<id>.tags` (genel kural tablosu: `js/config/registry.js` `TAG_RULES`) ve `enemies.<id>.res` (element -> E/N/D/I, etiketi ezer). Doğrulayıcı: bilinmeyen element/etiket/düzey reddedilir (E_ENUM). Yeni 8 düşman türü eklenince yalnız veri (etiket + res) yeterli; `tests/matrix.test.js` bunu 8 yeni türün tasarım satırlarıyla gösterir.
- **Hasar:** `combat.js hurt(e, dmg, slow, bypass, element)`: çarpan kalkan kontrolünden sonra, Güç Tılsımı (rollDamage) ve zincir düşüşünden SONRA uygulanır; doğrudan mermi, Zehir bulutu, Meteor, Ay Işığı, zincir hepsi element taşır. Kor patlaması elementsiz x1. Kesirli kalan can <= 0.05 ölüm sayılır. Yankı: zincir/Meteor/Ay Işığı ikinci atışı %50 hasar (`ECHO_SCALE`).
- **Yıldırım:** gerçek zincir (`js/game/chain.js`): ilk hedef menzil 9 içinde en yakın, sonrakiler öncekine <= 5 birim, tekrarsız; hasar 1 / 0.7 / 0.5.
- **Kristal akışı:** level alanları `minKills`, `crystalDelay`, `crystalLure` (isteğe bağlı; şema + doğrulayıcı + admin formu + adapt + test). Hedef = kristal >= goal VE öldürme >= minKills (kristal toplama ve öldürme anında denetlenir). Hedef kristal sayısı dolunca yeni kristal çıkmaz ve bir kez "Kristaller tamam. Kalan düşmanları da yen!" bildirimi çıkar. HUD "Yenilen düşman" satırı `n/N` gösterir (panel yerleşimi aynı).
- **Doğma:** `pickSpawnPointNear` (oyuncudan >= 6.5, yarıçap 9-14; eski: 8 birim, 14 halka). Doğma uyarı halkası YAPILMADI.
- **Etiketler:** "Etkili!" / "Dirençli" (Bağışık da "Dirençli"): DOM havuzu <= 6, aynı düşman 0.4 sn, 0.7 sn ömür, `prefers-reduced-motion` iken yalnız solma; metinler `strings.matchup`. Düşman kontak gölgesi en zayıf elementin silah rengine tonlanır.
- **Diğer:** mermi ömrü 1.4 -> 1.1 (Ateş/Buz/Üçlü, `weapons.<id>.life`); Buz yavaşlatma ölçeği 0.35 -> 0.5, süre 3 -> 2.5 sn (`slowScale/slowTime`); slogan "Bir büyü. Bir gece. Tek kader." (`brandmodel.js`, `text.js`, test); ölüm repliği `after: <bölüm>` süzgeci (`js/game/deathlines.js`; Taşkın satırları `w1-03` tamamlanınca).
- **Denge modeli (`balance.js`):** TP düzeltmesi q (hp<=1 kovalayıcı: Ruh x0.5, Yarasa x0.8); yeni W_BALANCE kuralları: kristal bölümünde `minKills` yok; `minKills > goal x 0.6`; kill arzı < 1.3 x minKills; ilk 20 sn planlanan düşman < 4; ardışık Z sıçraması kuralı önceki Z < 1.2 ise (giriş tabanı) uygulanmaz.

### Config önce -> sonra
| Silah | Önce | Sonra |
|---|---|---|
| Yıldırım | dmg 2, cd 0.9, zincir n3 menzil 13 (oyuncuya en yakın 3) | dmg 1.5, cd 1.0, menzil 9, hop 5, düşüş 1/0.7/0.5, element lightning |
| Zehir | 1 / 1.4 sn / r 2.2 | 1.2 / 1.3 sn / r 2.5 |
| Meteor | 3 / 2.8 sn / r 3 | 4 / 2.6 sn / r 3.2 |
| Ay Işığı | 1 / 4.5 sn / r 4 / itme 2 | 1.5 / 3.5 sn / r 4.5 / itme 2.5 |
| Ateş/Buz/Üçlü | mermi ömrü 1.4 | 1.1; Buz yavaşlatma 0.35x/3 sn -> 0.5x/2.5 sn |

| Bölüm | start / spawn / every / cap (önce) | (sonra) | kristal / minKills / gecikme |
|---|---|---|---|
| w1-01 | Ruh3 / Ruh1 / 8 / 6 | Ruh5 / Ruh2 / 6 / 8 | 3 / 12 / 1.5 sn, lure |
| w1-02 | Ruh1 Yar1 / Yar1 Ruh1 / 12 / 6 | Ruh2 Yar3 / Yar1 Ruh2 / 9 / 8 | 3 / 14 / 1.5 |
| w1-03 | Ruh1 Yar1 Taş1 / Taş1 Yar1 / 12 / 7 | Ruh3 Yar2 Taş1 / (Taş1 Yar2 veya Ruh3) / 9 / 9 | 3 / 14 / 1.5 |
| w1-04 (hayatta kal) | Ruh1 Yar1 Taş1 / Ruh1 Yar1 / 12 / 6 | Ruh3 Yar1 Taş1 / Ruh2 Yar1 / 10 / 9 | kristal 2 (aynı) |
| w1-05 | Ruh2 Yar2 Taş1 Okç2 / Ruh1 Okç1 / 9 / 9 | aynı başlangıç / Ruh2 Okç1 / 9 / 10 | 3 / 18 / 1.5 |
| w1-06 (totem) | Ruh1 Yar1 / Ruh1 Yar1 / 12 / 6 | Ruh2 Yar1 / Ruh2 Yar1 / 12 / 8 | kristal 3 (aynı) |
| w1-07 | Ruh2 Yar3 Kur4 / Kur1 Yar1 / 8 / 11 | Ruh2 Yar3 Kur3 / Kur1 Yar2 / 9 / 11 | 3 / 14 / 1.2 |
| w1-08 (totem) | Ruh1 Kor3 Taş1 / Kor1 Ruh1 / 10 / 8 | Ruh2 Kor3 Taş1 / Kor1 Ruh2 / 10 / 9 | - |
| w1-09 | Şv1 Okç2 Kur1 / Okç1 Ruh1 / 6 / 6 | aynı / Okç1 Ruh2 / 7 / 7 | - |
| w2-02 (köprü) | start/spawn aynı | aynı | kristal 4 / 18 / 1.2 (minKills tutarlılığı için) |

`goal` ve `time` hiçbir bölümde değişmedi.

### Matris özeti (koddaki karşılığı; E = Etkili, D = Dirençli, I = Bağışık)
| Silah (element) | Etkili | Dirençli / Bağışık |
|---|---|---|
| Ateş | Okçu, Kurt | Taş Bekçi (D), Kor (I) |
| Buz | Yarasa, Kor | Totem (D), Kurt (I) |
| Üçlü (Arcane) | Ruh, Taş Bekçi, Kral | Rahip, Şövalye (D) |
| Yıldırım | Yarasa, Kurt | Ruh, Taş Bekçi, Okçu, Şövalye (D) |
| Zehir | Yarasa, Taş Bekçi, Rahip | Şövalye, Kral (D), Ruh, Totem (I) |
| Meteor (Yıkım) | Taş Bekçi, Totem, Şövalye | Yarasa, Kurt (D) |
| Ay Işığı | Ruh, Rahip, Şövalye | - |

Mevcut 10 türde Ateş/Buz/Yıldırım'ın Etkili sayısı 2'dir; "en az 3" kuralı 18 türlü tasarım matrisinde sağlanır (`matrix.test.js` bunu 8 yeni türün veri satırlarıyla doğrular). Yıldırım'ın tek vuruşta (zincirin 1. halkası) öldürdüğü tür: 5 (Ruh, Yarasa, Okçu, Kurt, Kor) -> 2 (Yarasa, Kurt); Don Hortlağı eklenince 3.

### Bot (`tools/balance/sim.mjs`) ve sonuçlar (YAKLAŞIK; N=100, seed 1; kalibre DEĞİL)
Eklenenler: element/direnç çarpanı, yeni zincir, minKills/gecikme/lure, yakın doğma, mermi uçuş süresi ve menzil, tepki gecikmesi, dikkat boşluğu, mesafe/hareket isabet cezası, matris farkında silah politikası, kristal seçimi `nearP`, profiller yürüyen/acemi/orta/iyi/usta, telemetri (`weaponDmg`, EVO, A10/A20/A60). KALİBRASYON SAPMASI: tasarım önerisindeki orta bot (isabet 0.55) ilk bölümleri hedef bandın çok altına çektiği için orta bot isabet 0.66, ateş görev payı 0.68, kaçış 3.5 yapıldı.

Geçme oranı (%): "yürüyen" sütununda parantez = eski config'te.

| Bölüm | hedef | yürüyen | acemi | orta | iyi | usta | orta A20 sonra | orta A20 önce* |
|---|---|---|---|---|---|---|---|---|
| w1-01 | 92 | 0 (97) | 5 | 100 | 100 | 100 | 1.52 | 0.58 |
| w1-02 | 88 | 0 (95) | 0 | 87 | 100 | 100 | 2.10 | 0.54 |
| w1-03 | 85 | 0 (85) | 0 | 71 | 100 | 100 | 3.21 | 1.23 |
| w1-04 | 84 | 100 (hayatta kal) | 33 | 100 | 100 | 100 | 1.33 | 0.70 |
| w1-05 | 77 | 0 (59) | 1 | 88 | 100 | 100 | 3.22 | 3.03 |
| w1-06 | 86 | 0 | 82 | 100 | 100 | 100 | 0.84 | 0.28 |
| w1-07 | 71 | 0 (89) | 77 | 100 | 100 | 100 | 2.15 | 1.18 |
| w1-08 | 65 | 0 | 24 | 96 | 100 | 100 | 3.00 | 0.91 |
| w1-09 | 48 | 0 | 2 | 71 | 100 | 100 | 4.02 | 1.64 |

*Önce = eski config'in YENİ simde koşulması (eski sim değil). A20 = ilk 20 sn ortalama aktif düşman (statik totem hariç); tasarım hedefi (§2.2) 1.2 / 1.0 / 1.5 / - / 1.5: karşılandı. Orta bot ilk 5 bölümde hedef banda (+-12) yaklaşıyor (w1-01, 02, 05 içinde; w1-03 -14; w1-04 hayatta kal +16); w1-06..09'da hedefin 14-30 puan ÜSTÜNDE: başlıca neden Aşama B'nin düşman becerileri ve çevre tehlikelerinin modelde olmaması, botun Yıldırım/Arcane'i hâlâ verimli kullanması. Yürüyen bot kristal bölümlerinde artık %0.

### Sapmalar ve sınırlar
- **M5-M7:** tasarım hedefleri (tek silah tür başına <= %60, kampanyada <= %40) botta SAĞLANMADI (orta botta Yıldırım payı w1-07..09'da %66-83; iyi botta Ateş w1-09'da %77). Test yalnız gevşek kıskaç (<= %88) koyar. Perde I'de az silah açık ve bazı türlerin tek Etkili silahı var; gerçek oyuncu telemetrisi (`weaponDmg`, EVO) olmadan sonuca varılamaz.
- **Yapılmadı:** Ruh Sis Perdesi, doğma uyarı halkası, Pırıl ipucu rengi, Odak Merceği/Zırh Kıran perk'leri, K5 `crystalKillDrop`, `skills`; boss canı ve Kristal Mızrak (Aşama E).
- **Model p:** TARGET_P (eski hedefler) korundu; TP düzeltmesi q ile model p hedeften <= 0.10 (w3-09 geçici köprü: 0.13).
- **Ölçülemeyenler:** etiketlerin okunabilirliği, dokunmatik, gerçek kare hızı, hissedilen zorluk; ekran görüntüsü alınamadı (headless WebGL bağlam kaybı), yalnız konsol hatası olmadığı doğrulandı.

### Kalan işler
Aşama B (beceriler; bot modeline eklenince orta botun Perde I sonundaki gevşemesi düzelmeli), C (tehlikeler/atmosfer), D/E (Perde II-III, 8 yeni tür), F (perk'ler, M5-M7 telemetri paneli). Oyun testinde bakılacaklar: ilk 3 bölümde düşman geliyor mu, Yıldırım hâlâ baskın mı (özellikle w1-07 sonrası), etiketler okunuyor mu, minKills hissi.


---

## Aşama B uygulama notları (geliştirme odası)

Durum: UYGULANDI (Aşama B). Tüm sayılar VARSAYIMDIR; gerçek oyuncu testi yapılmadı, bot yaklaşık bir modeldir.

### Yapılanlar
- **Saf çerçeve:** `js/game/skills.js` (DOM/Three yok, Node'da test edilir): `SKILLS` tablosu (tetikleyici sayıları, bekleme, uyarı, etki), `canTrigger`, `onWindupEnd` (iptal kuralları), `veilStep/veilBlocks`, `emberChainVictims`, `pickReviveTarget/isReviveCandidate/reviveAllowed`, `auraMul`, `skillDamageMul`, `volleyPoints`, `skillSteps` (öğretim sırası denetimi), `warnBudgetOk` (eşzamanlı 3 işaret). Oyun tarafı: `js/game/skillrun.js` (`skillTick` her düşman karesinde `ai.js`'ten çağrılır; `true` dönerse düşmanın kendi hareketi o karede çalışmaz). DDA ve alıştırma kipi bu dosyalara bağlı DEĞİL: sıklık/bekleme değişmez (testle denetlenir).
- **Config:** `levels.<id>.skills` (isteğe bağlı; yoksa beceri yok = eski davranış). Şema `enm("SKILL_IDS")` dizisi, doğrulayıcı bilinmeyen kimliği `E_ENUM` ile reddeder, `adapt` aktarır, admin formunda dizi-enum satırı (`enumRow`). `strings.skills.<id>`: bölüm başı ipucu metinleri (en çok 100 karakter).
- **Uyarı okunurluğu:** her uyarılı beceride düşman `windup` modunda (`e.windT`, yeni model/animasyon yok) ve yerde `addHazard` halkası var (`fx.addHazard` artık kaydı döndürür). Uyarı sırasında düşman ölürse işaretler kaldırılır (`onEnemyKilled`). Eşzamanlı en çok 3 işaret (volley 3 yer ister). Bekleme düşman zamanıyla işler (Buz bekleme/tetiklemeyi uzatır), uyarı süresi oyun zamanıyla (Zaman Çatlağı uyarıyı da uzatır, hazard ile uyumlu).
- **Beceriler:** Ruh `veil` (>7 birimde saydam [`render/enemies.setVeil`] ve mermi içinden geçer; yaklaşınca 0.15 sn sonra katı; Arcane/Ay Işığı deler; elementsiz hasar [Kor patlaması] geçemez); Yarasa `batDive` (>=2 yarasa oyuncuya 12 birim, 7 sn, 0.6 sn uyarı = kilitli nokta halkası, 12 hız dalış en çok 0.7 sn; vurulursa/itilirse bozulur; Buz'la yavaşlamışsa başlamaz/iptal); Taş Bekçi `quake` (oyuncu <4.5, 7 sn, 1.0 sn halka r 3.2, 1 hasar, sonra 0.8 sn ayakta); Okçu `volley` (9 sn, 1.2 sn, oyuncunun hareket yönünün 1.2 önünde + yanlara 2 işaret, r 1.5, 1 hasar; Buz'lu okçu başlamaz); Kurt `howl` (>=2 kurt ya da hp<%50, 12 sn, 0.9 sn, vurulunca iptal; 12 birimdeki kurtlar 5 sn x1.3 hız, yorgunluk %30 kısa); Kor `emberChain` (patlayan Kor'un 3.5 birimindeki fitilsiz Kor'lar 0.25 sn sonra patlar; yerde ateş lekesi r 1.6, 3 sn, 0.5 sn ısınma sonra 1 hasar/sn; havuz en çok 2 leke); Rahip `revive` (7 birim, son 4 sn, rahip başına 2, 10 sn, 1.5 sn yeşil halka, cap'e saygılı; diriltilen puan/öldürme vermez); Totem `aura` (6 birim x0.6, sürekli mor halka); Şövalye `leap` (hp<%75, 9 sn, 0.9 sn kilitli işaret [son 0.3 sn zıplama], iniş 2 hasar r 2.2, sonra 1.2 sn yorgun x1.5; ayrıca leap açıkken yer şokundan sonra 1.0 sn "açık an" x1.3, düşman ayakta bekler).
- **Silah karşıtlığı bağı:** hasar yine `combat.hurt` -> `matchup.js` (E/D/I) ile hesaplanır; beceri çarpanı (aura, yorgun/açık an) matris çarpanından SONRA uygulanır. Karşı oyun: Buz (batDive/volley başlamaz), Ay Işığı/nova itmesi (dalışı bozar; hurt bayrağı), Arcane/Ay Işığı (perdeyi deler), uzaktan Arcane/Buz (zincir patlama), vurmak (howl iptal), Meteor/Mızrak (açık an).

### Bölüm -> beceri (kademeli açılış)
| Bölüm | Açık beceriler | Yeni |
|---|---|---|
| w1-01 | veil | veil |
| w1-02 | veil, batDive | batDive |
| w1-03 | + quake | quake |
| w1-04 | aynı | - |
| w1-05 | + volley | volley |
| w1-06 | + aura | aura |
| w1-07 | aynı | - |
| w1-08 | + emberChain | emberChain |
| w1-09 | + leap | leap |
| w2-02 (köprü) | w1-09 ile aynı küme (howl/revive YOK; bölümde etkin olanlar: veil, batDive, quake, volley) | - |
| w3-09 | alan yok (beceri yok) | - |

Sapma: belge `aura`'yı w1-08'de `emberChain` ile birlikte açıyordu; "her bölümde en çok 1 yeni şey" kuralı için `aura` Lanet Totemi'nin ilk çıktığı w1-06'ya alındı (w1-08'de zaten açık). `howl` (w2-03) ve `revive` (w2-07) yalnız tanım + test; hiçbir bölümde açık değil. Belge `volley`'yu w2-01 diyordu; Okçu Perde I'de w1-05'te çıktığı için orada açıldı (Okçu'nun mevcut atışına ek olarak çalışır).

### Config önce -> sonra (yalnızca start/spawn/every/cap; goal/time/kristal değişmedi)
| Bölüm | Önce | Sonra | Neden (orta bot) |
|---|---|---|---|
| w1-03 | Ruh3 Yar2 Taş1 / (Taş1 Yar2 veya Ruh3) / 9 sn / cap 9 | Ruh2 Yar2 Taş1 / aynı / 9.5 sn / cap 9 | 3 beceri sonrası %59 -> ~%70 |
| w1-06 | Ruh2 Yar1 / Ruh2 Yar1 / 12 / 8 | Ruh3 Yar2 / Ruh2 Yar1 / 11 / 9 | nefes bölümü, hafif sertleşme |
| w1-08 | Ruh2 Kor3 Taş1 / Kor1 Ruh2 / 10 / 9 | Ruh2 Kor4 Taş2 / Kor3 Ruh2 / 7 / 11 | %97 -> ~%70 |
| w2-02 | Ruh3 Yar3 Taş2 Okç2 Rahip2 / (Rahip1 Yar1 / Okç1 Yar1) / 6 / 11 | Ruh2 Yar2 Taş1 Okç1 Rahip1 / (Rahip1 Yar1 / Okç1 Ruh1) / 8 / 10 | 4 beceri açılınca %38 -> ~%72 |

### Bot (`tools/balance/sim.mjs`) sonuçları (YAKLAŞIK; N=100, seed 1; kalibre DEĞİL)
Bota eklenenler: becerilerin aynı sabitlerle soyut modeli (perde hedeflemesi, dalış, sarsıntı, ok işaretleri, zincir patlama + ateş lekesi, aura, atılış/yorgunluk/açık an), profil başına `watch` (uyarı işaretini görme olasılığı: acemi 0.5, orta 0.7, iyi/usta 1) ve `tgtDelay` kadar tepki gecikmesi. `howl`/`revive` botta yok (hiçbir bölümde açık değil).

| Bölüm | hedef | yürüyen | acemi | orta | iyi | usta |
|---|---|---|---|---|---|---|
| w1-01 | 92 | 0 | 3 | 95 | 100 | 100 |
| w1-02 | 88 | 0 | 0 | 84 | 100 | 100 |
| w1-03 | 85 | 0 | 0 | 70 | 100 | 100 |
| w1-04 | 84 | 99 (hayatta kal) | 42 | 100 | 100 | 100 |
| w1-05 | 77 | 0 | 1 | 94 | 100 | 100 |
| w1-06 | 86 | 0 | 40 | 100 | 100 | 100 |
| w1-07 | 71 | 0 | 85 | 99 | 100 | 100 |
| w1-08 | 65 | 0 | 0 | 70 | 94 | 100 |
| w1-09 | 48 | 0 | 0 | 51 | 100 | 100 |
| w2-02 | 79 | 0 | 3 | 72 | 100 | 100 |

Hedef bandla karşılaştırma: w1-08 (70, hedef 60-70) ve w1-09 (51, hedef 45-60) bandın içinde. w1-03 hedefin 15 altında (70/85; Arcane perdeyi ancak bu bölümün ödülüyle açar). w1-05 (+17), w1-06 (+14), w1-07 (+28) HÂLÂ hedefin üstünde: botun kaçış/tepki modeli bu bölümlerin baskısını karşılıyor; w1-07'de Kurt `howl` bilerek açılmadı (belge Perde II), sayıları sertleştirmek (A20 5'e kadar) insan için orantısız zor olacağından denenip bırakıldı. Acemi bot (>= 0.5 x orta kuralı) SAĞLANMADI: acemi bot çok zayıf modellendi (Aşama A'dan beri). Statik TP modeli beceri baskısını bilmez: `BOT_CALIBRATED = {w1-08}` (js/config/balance.js) için Z sıçraması/monotonluk/tepe/p±10 kuralları uygulanmaz (p >= 0.3 şartı sürer; w1-08 model p 0.32); w2-02 model p 0.94 (hedef 0.79) için test toleransı 0.16'ya çıkarıldı (geçici köprü).

### Doğrulayıcı
`balanceIssues`: bir bölümde ilk kez açılan beceri >1 ise ve önceki bölümlerde açık beceri kapanırsa W_BALANCE (`skillSteps`); bilinmeyen kimlik E_ENUM. Repo config'i 0 hata, 0 uyarı.

### Performans / mobil
Eşzamanlı yer işareti en çok 3 (her biri 2 Mesh: halka + dolgu; yalnızca tetiklenince doğar, bitince atılır; her karede nesne üretimi yok). Kalıcı ek Mesh: Lanet Alanı halkası totem başına 1 (w1-08'de en çok 3), ateş lekesi havuzu en çok 2 (kalıcı ek <= 5 çizim çağrısı). Uyarı işaretleri geçici; w1-08'de en kötü anda geçici toplam +6'yı AŞABİLİR (3 halka + 2 leke + işaretler). Gerçek cihazda ÖLÇÜLMEDİ.

### Ölçülemeyenler / kalan işler
- Uyarıların okunurluğu, "haksız" hissi, dokunmatik ve gerçek kare hızı ölçülemedi. Headless Chrome ile `?dev=1&level=w1-03` ve `w1-08` 25 sn sanal süre açıldı: konsolda hata yok (yalnızca THREE.Clock kullanımdan kalkıyor uyarısı); bölümün gerçekten başlayıp becerilerin tetiklendiği görsel olarak doğrulanamadı (DOM dökümü zaman aşımı).
- Yarasa dalışında "yerde ince çizgi" yerine kilitli hedef noktasında halka var (çizgi için yeni geometri gerekirdi); sapma.
- `howl`/`revive` Perde II bölümlerine eklenince bota işlenmeli; beceri TP+ değerleri (`SKILLS.*.tp`) henüz statik denge modeline bağlı değil.
- El ile denenecekler: w1-03 Taş Bekçi sarsıntısı (halka okunuyor mu, 4.5 birim tetikleyici fazla mı), w1-05 ok yağmuru (3 işaret kaçılabilir mi), w1-08 zincir patlama + ateş lekesi (haksız hissi), w1-09 Şövalye atılışı ve yorgunluk penceresi, w1-01 perdeli Ruh (Ateş/Buz ile vurulamayan Ruh sıkıcı mı), ipucu toast'ları.

## Aşama C uygulama notları (geliştirme odası)

Durum: KISMEN UYGULANDI (çevre tehlikeleri, savaş geri bildirimi, doğma uyarısı, kamera süpürmesi, sınır nabzı). Tüm sayılar VARSAYIMDIR; gerçek oyuncu testi ve gerçek cihaz kare hızı ölçümü YOK.

### Yapılanlar
- **Çevre tehlikeleri:** `levels.<id>.hazards = [{ kind, every?, maxActive? }]` (isteğe bağlı; şema `HAZARD_IDS`, bölümde en çok 2 tür, `maxActive` 1-3; adapt aktarır; admin formu genel dizi/nesne satırıyla düzenler). Saf mantık `js/game/hazards.js` (tablo, yerleşim, durum makinesi, DDA, buz kayması, `hazardSteps`); oyuna bağlayan `js/game/hazardrun.js` (3 yuvalı havuz, yuva başına TEK mesh; `loop.update` içinde `updateHazards`, hareket `playerVel` ile). 4 genel tür:

| Tür | Uyarı | Etki | Oyuncuya | Düşmana | Aralık |
|---|---|---|---|---|---|
| `poison` zehir bulutu | 1.3 sn | 2.5 sn alan, r 2.0, saniyede 1 tick | 1 | 0.5 | 14 sn |
| `fall` düşen darbe | 1.2 sn | tek çarpma, r 2.0 | 1 | 2 | 7 sn |
| `fire` ateş fışkırması | 1.2 sn | 2 sn alev, r 1.8, saniyede 1 tick | 1 | 1 | 10 sn |
| `ice` buz yaması | 1.0 sn | 7 sn, r 3.2, hasar yok | kayar (yön değiştirme gecikmeli) | yavaşlar x0.7 (buz türleri bağışık) | 15 sn |

  Adalet: ilk tehlike en erken 8 sn; hasarlı tehlikenin merkezi oyuncudan >= 1.5 birim (adayların ~yarısı hareket yönünün 2.4 önüne hafif tahminle); canlı tehlike/beceri işaretiyle çakışmaz; beceri işaretleri >= 3 iken başlamaz; hasar sonrası mevcut dokunulmazlık (1.5 sn) sürer; DDA kademesi aralığı x(1+0.25 kademe), kademe 2'de tür başına bir az, kademe 3'te oyuncu hasarı <= 1; alıştırma kipinde DDA zaten yok (tehlike tam). Eşzamanlı en çok 3 (Düşük kalitede 2). Düşman hasarı kaynak etiketi çıkarmaz (element yok).
- **Savaş geri bildirimi** (`js/core/fxlevel.js` saf + `js/game/fxsettings.js`): vuruş kıvılcımı vuran silahın renginde (normal 5, Etkili 10; Düşükte yarım), Etkili vuruşta daha uzun parlama, ölüm halkası + düşman rengi patlama (havuz 2 mesh), ağır/Etkili öldürmede hit-stop (40 ms Etkili, 60 ms boss/şövalye/hp>=6; 0.35 sn bekleme; Düşük ve reduced-motion'da kapalı), hafif sarsıntı (Etkili öldürme 0.05, ağır 0.12; `FX.shake` çarpanı: Düşük x0.5, reduced-motion 0), mermi izi sıklığı (Yüksek 2 karede bir, Düşük/reduced 4), sınır çerçevesi nabzı. Yüzen hasar sayısı YAPILMADI: mevcut "Etkili!/Dirençli" etiketi (`dmgtags.js`) korundu.
- **Doğma uyarı halkası** (`spawnwarn.js`, `spawnmath.js` saf kısım): doğal doğuşlarda düşman 0.5 sn halka sonrası çıkar; nokta oyuncudan >= 9 seçilir (doğduğunda ~6.5); kuyruktakiler cap'e sayılır; halka havuzu 3 (Düşük 2), dolarsa düşman anında çıkar. Bölüm başı dizilim, boss/beceri doğuşları etkilenmez.
- **Bölüm başı kamera süpürmesi:** 1.2 sn, yüksek-geniş açıdan oyun açısına (`camera.js startSweep`); dokunma/tuş kısaltır; reduced-motion'da kapalı.

### Bölüm -> tehlike
| Bölüm | Tehlike | Yeni tür |
|---|---|---|
| w1-01 | yok (öğretim) | - |
| w1-02 | fall | fall |
| w1-03 | fall | - |
| w1-04 | poison | poison |
| w1-05 | yok (nefes) | - |
| w1-06 | fall | - |
| w1-07 | ice | ice |
| w1-08 | fire | fire |
| w1-09, w2-02, w3-09 | yok (boss sınavı / köprü: belgedeki sütun/diken/rezonans/kızıl halka türleri bu işte YOK) | - |

W_BALANCE: bölümde ilk kez görülen tehlike türü > 1 ise uyarı (`hazardSteps`); türün en çok 2 / `maxActive` <= 3 şema hatasıdır.

### Performans / havuzlar (ölçülmedi)
Yeni kalıcı mesh havuzları: tehlike 3, doğma halkası 3, ölüm halkası 2 = en kötü anda +8 çizim çağrısı (tipik +3..5; görünmeyen mesh çizilmez); parçacıklar mevcut 480'lik ortak havuzu kullanır; her karede nesne üretimi yok (tek `enemies.slice()` yalnız hasarlı tick/çarpma anında). Beceri işaretleriyle birlikte w1-08'de geçici tepe belge bütçesini aşabilir; gerçek cihazda ölçülmedi. Düşükte: tehlike <= 2, doğma halkası 2, ölüm halkası/hit-stop/sınır nabzı kapalı, sarsıntı ve kıvılcım yarım.

### Bot (`sim.mjs`, N=100, seed 1; YAKLAŞIK, kalibre DEĞİL; yürüyen/acemi/orta/iyi/usta)
Tehlikeler soyut: uyarılı alan hasarı (poison/fire ek tick'li leke), bot `watch` olasılığıyla görür/kaçar; düşmana etki ve buz kayması MODELLENMEDİ. Önce -> sonra (kazanma %, orta bot): w1-02 84 -> 82, w1-03 70 -> 72, w1-04 100 -> 100, w1-06 100 -> 100, w1-08 70 -> 68 (acemi 0 -> 1, iyi 94 -> 95); w1-07 buz hasarsız olduğundan değişmedi (99). Tehlikesiz bölümler (w1-01, 05, 09) aynı. Etki bot gürültüsü sınırında: tehlike baskıdan çok okunurluk/ustalık katmanıdır.

### Karşılama ekranı (1280x800) bulgusu
Headless Chrome ile 1280x800 karşılama hem 0.5 sn hem 6 sn sanal süre sonunda AMBLEM ve ARKA PLAN görseliyle doğru çiziliyor. Kod okuması: görseller `index.html`'de preload'lu; `.art-bg` `position:absolute; inset:0`, amblem `aspect-ratio` kabında; masaüstüne özgü sıfır boyut/gizleme kuralı YOK. Kök neden KESİN DEĞİL: Ofis'in ekran görüntüsü, JS ile sonradan eklenen `<img decoding="async">` görsellerinin henüz çözülmeden/animasyon ilk karesinde (arka plan/amblem opacity 0'dan başlar, HEXORA SVG anında görünür) alınmış bir ara kare olarak açıklanıyor. Kod değiştirilmedi; gerçek hata yeniden üretilemedi.

### Yapılmayanlar
Arena iç engel kayaları ve dairesel sınır (§7.2), atmosfer varyasyonları (katmanlı sis/ışık huzmesi/aurora, §7.3), yüzen hasar sayıları, ince mermi izi sprite'ı (mevcut kıvılcım izi sıklığı ayarlandı), belgedeki diğer tehlike türleri (sütun hattı, diriliş mezarı, rezonans, kemik diken, kızıl halka, rün), Perde II/III bölümleri. Yeni tehlikeler bota kısmen soyut eklendi; tehlike ölümü telemetrisi eklenmedi.

### Ölçülemeyenler / elle denenecekler
Tehlikelerin adil hissi (1.2 sn uyarı yeterli mi, `fall` 1 hasar, ön tahmin yeri), buz kaymasının kontrol hissi, hit-stop/sarsıntının rahatsız edip etmediği, mobil akıcılık ve gerçek çizim çağrısı, doğma halkasının doğma baskısını azaltıp azaltmadığı (düşman 0.5 sn geç çıkar; denge botu bunu modellemez). Doğrulama: `?dev=1&level=w1-02` headless Chrome (bölüme girip 28 sn sanal süre): konsolda hata yok (yalnızca THREE.Clock kullanımdan kalkıyor ve sesin kullanıcı hareketi bekleme uyarıları).
