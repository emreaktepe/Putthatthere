# HEXORA: Büyücünün Gecesi — Hikâye ve Bölüm Kurgusu (3 Perde x 9 = 27 Bölüm)

Hazırlayan oda: strateji (rol: senarist) · Kapsam: yalnızca senaryo/tasarım belgesi. Kod ve `data/game.config.json` DEĞİŞTİRİLMEDİ.
Dayandığı belgeler: `docs/strateji/oyun-tasarimi-zorluk-ve-bolum-plani.md` (bölüm kimlikleri, rol haritası, ödül takvimi, hedef türleri; sayı/denge ona aittir ve burada değiştirilmedi), `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` (kanon), `data/game.config.json` (`characters`, `strings`, `levels.*.intro/outro`), `docs/icerik/3d-model-listesi.md`, `docs/icerik/3d-dekor-listesi.md`, `js/config/schema.js`, `js/ui/result.js`, `js/ui/menu.js`.

**Dürüstlük notu.** Hiçbir metin oyunda denenmedi; ekranda sığma, okuma süresi ve oyuncunun tepkisi VARSAYIMDIR. Oyunda bugün OLMAYAN her şey (perde kartı, kırıntı kartı, yıldız, DDA, yeni hedef türleri, ansiklopedi, Gece Yarığı, bölüme özel mini-boss hedef metni) bu belgede `[KOD]` etiketiyle işaretlidir; etiketsiz metinler bugünkü şemaya (bölüm adı <= 40, diyalog satırı <= 240, `intro/outro` 1-4 satır, `deathLines` en çok 12) olduğu gibi girer. Bölüm denge sayıları (goal, süre) yalnızca tasarım belgesinden anılır.

---

## 0. Yönetici özeti

| Konu | Karar |
|---|---|
| Kampanyanın tek cümlelik vaadi | "Bir gece uyuyakalan büyücü, şafağı geri getirirken hem bir babayı hem bir kızı hem kendini bağışlamayı öğrenir." |
| Perdeler | **I · Uyanış** (suçluluk) · **II · Kırık Yol** (sorumluluk) · **III · Gece Kalbi** (fedakârlık ve bırakma). Tasarım belgesindeki yer tutucu adlar korundu. |
| Ana yay | Aldemir "benim suçum" der → "benim işim" der → "bırakıyorum" der. Düşman, canavar değil yaslı bir babadır; final, yenilgiden çok bir vedadır. |
| Açığa çıkma ritmi | 9 büyük açığa çıkma, her 3 bölümde bir (bölüm 2.2). Perde sonu çengelleri: I = "Kızım… neredesin?" · II = Zerrin susar, Pırıl adını hatırlar · III = Gece Yarığı. |
| Kanona dokunuş | Gece Kalbi çatlak, şafak doğmuyor, Aldemir kulede uyuyakaldı: korunur. Üç GENİŞLETME var ve Emre onayı ister (bölüm 8.4): (1) o uykuyu Zerrin'in büyüsü derinleştirmiştir, (2) "Pırıl" Mira'ya babasının taktığı takma addır, (3) Dört Nöbetçi (mevcut Kemik Şövalye modeliyle). |
| Yeni model gerekir mi | Hayır. Tüm sahnelemeler mevcut 15 modelle (Aldemir, Pırıl, 10 düşman, Zerrin, Taşkın, Veyis-insan) yapılabilir. İsteğe bağlı tek yeni model: Mira'nın insan silueti (bölüm 5.3). |
| Gerçek gereksinim | Metinlerin ~%65'i bugünkü şemaya girer. Perde kartı, kırıntı kartı, DDA satırı, rozet, ansiklopedi ve yeni hedef türü metinleri geliştirici işi ister (bölüm 7). |
| Önce yazılacak | Perde I tam metin (burada), Perde II-III de tam metin yazıldı ama "taslak v1" sayılır; Perde I oyun testine girdikten sonra ton ayarı yapılır (bölüm 8.5). |

---

## 1. Üst hikâye ve tema

### 1.1 Vaat ve tema

**Vaat (tek cümle):** Şafağı geri getirmek için çıktığın yolda, kapattığın her gece bir başkasının kaybıdır; bu yüzden zafer, bir şeyi bırakmayı öğrenmektir.

**Tema:** Sorumluluk ve bırakmak. Üç karakter aynı hatanın üç yüzünü yaşar:
- Aldemir uyudu (ihmal, suçluluk).
- Veyis bırakmadı (aşırı sahiplenme, yas).
- Zerrin saklamak için kendini harcadı (korumacı yalan).
Pırıl/Mira üçünün de ortasında durur; çünkü gitmesi gereken odur ve bunu kimsenin yüzüne söylememiştir.

**Ton:** Karanlık ama umutlu. Şaka ve sıcaklık (Zerrin'in nükteleri, Pırıl'ın çocuksuluğu) karanlığı kırmak için vardır; hiçbir bölüm umutsuz bitmez.

### 1.2 Dünyanın kuralları (oyun içinde söylenebilecekler)

1. **Gece Kalbi** vadiye gündüzü getiren mana taşıdır; çatlaktır ve şafak doğmaz.
2. **Kırıntılar:** Kalbin kırıkları vadiye saçıldı. Her kırık, taş olduğu kadar bir **hatıra** taşır (kırıntı kartlarının kaynağı, bölüm 2.3).
3. **Totemler** kırıntılarla beslenen lanet direkleridir; Veyis'in "bir gece daha" dileğinin biçimidir.
4. **Gece sürerse Mira'nın ışığı vadide kalır.** Şafak gelirse ışık, "gün ışığına varır" ve gider. Veyis'in şafak korkusu budur: şafak, kızını almak demektir.
5. **Dört Nöbetçi:** Kralın dört baş nöbetçisi (Kemik Şövalye modeli). Yemin Kalbe'ydi, krala değildi; ama kral kapıları kapattıkça nöbet bir hapse dönüştü.

### 1.3 Perdeler

| | Perde I · UYANIŞ | Perde II · KIRIK YOL | Perde III · GECE KALBİ |
|---|---|---|---|
| Duygu | Suçluluk, merak, şaşkınlık | Sorumluluk, yas, yakınlık | Fedakârlık, bırakma, şefkat |
| Aldemir'in cümlesi | "Uyuyakaldım." | "Benim işim." | "Bırakıyorum." |
| Ana soru | Bu ışık kim, bu ses kimin? | Kral bunu neden yaptı ve gerçek uyku kimin suçuydu? | Şafak kimden ne alır, ve bir baba kızını bırakabilir mi? |
| Mekân yayı | Orman, mağara, harabe, mezarlık, geçit, köy: vadinin dışı | Mezarlık, kristal, kar, köy, kule, bahçe, harabe: lanetin içi, hatıra | Orman, buz, halka, köy, kule, kapı, kale: kalbin yolu |
| Oynanış rolü | Öğretim (tasarım belgesi) | Kombinasyon | Ustalık ve final |
| Perde sonu kancası | "Kızım… neredesin?" (baba sesi) | Zerrin susar; Pırıl: "Babama gideceğim." | Şafak doğar; rüyada ince bir yarık açılır (Gece Yarığı) |
| Perde sonu bölümü | w1-09 Kemik Kule | w2-09 Harap Kale | w3-09 Gölge Kalesi |

### 1.4 Karakter yayları (özet; ayrıntı bölüm 5)

**Aldemir (suçluluk → sorumluluk → fedakârlık/affetme).**
- Perde I: Utanç. Her mezarda kendi uykusunu görür. Kendini cezalandırarak yürür.
- Perde II: w2-04'te dönüş: "Benim suçum" yerine "benim işim". w2-09'da uykunun bir kısmı Zerrin'in büyüsü çıkar; Aldemir öfkelenmez, "Suçlu kim, önemli değil; düzeltecek kim, o önemli" der. Bu sahne affetmenin ilk adımıdır.
- Perde III: Zerrin'in nüktelerini taşımayı denemesi (yası şakayla taşıma). Final: Veyis'i affeder ("Seni anlıyorum"), son vuruşun ardından kendi ışığından bir parçayı çatlağa bırakır (bölüm 4.4) ve ilk kez rahat uyur.
- Mantra: **"Uyanığım."** (I) → **"Buradayım."** (II) → **"Bırakıyorum."** (III). Her birini ilgili perdede en az bir kez, en doğal anda söyler.

**Veyis / Gölge Kral (trajik baba).** Kızı Mira hastalandı. Gece Kalbi'ni kendine bağladı, çünkü gece süresince Mira'nın "ışığı" vadide kalıyordu: şafak gelirse ışık gün ışığına varıp gidecekti. Taşı kırdı, kendini taşa bağladı; Gölge Kral oldu. Düşmanlar onun yası, totemler onun "bir gece daha"sıdır. Yaklaşımı: öfke yok, çaresizlik var. Replikleri kısa, yorgun, bazen kızına söylenir gibi biter. Canon cümlesi: "Kızımı geri verin. Şafak gelirse onu bir daha göremem." tüm kurgunun anahtarıdır.

**Mira / Pırıl (çocuksu ama bilmek isteyen).** Perde I'de kim olduğunu bilmez: ışığı küçük, merakı büyük. Pırıl, babasının ona taktığı isimdir (kanonla çelişmez: Pırıl adı zaten oyunda); gerçek adı Mira'dır. Perde II'de adını hatırlar. Perde III'te en derin gerçeği hatırlar: **şafakta gideceğini biliyordu ve babasına söylemeye kıyamamıştı.** Bu saklanan söz, babanın "gitme" demesinin acısını büyütmüştür. Final, o sözün söylenmesidir.

**Zerrin (fedakâr bilge).** Nüktelerle bilgeliği saklar. Perde I-II boyunca vadinin hafızasıdır. w2-04 ve sonrasında tüyleri dökülmeye başlar (ritüel nükteleri azalır). w2-09'da son kırıntısını vererek kapıyı açar, gizli sırrını (uyku) söyler ve susar. Ölmez: gözleri kapalı, dalında nöbet tutar; epilogda tek bir cümleyle uyanır (bölüm 4.5). Perde III'te yalnızca üç kez "yankı" olarak konuşur (w3-01 vasiyet kartı, w3-07 tüy parıltısı, w3-09 intro).

**Taşkın (sadakatin kendisi).** w1-03'te katılır. Tek tük kelime konuşur ("Nöbet.", "Komutan.", "Tutarız."). w1-09 ve Perde II'de Nöbetçilerle yüzleşmesi onun yayıdır: eski komutanlarını hem sevdiği hem durdurmak zorunda olduğu için. w3-03'te yemini tamamlar, w3-08'de finalden önce kapıda nöbette kalır.

### 1.5 Pırıl'ın kimliği ve spoiler yönetimi

Mevcut 6. bölümdeki sürpriz (village, "Bu ses… babamın sesi") yeni yerleşimde **w1-08 Yanık Köy**'e düşer ve **kısmi** bir sürpriz olur; tam açıklama aşamalıdır:

| Aşama | Bölüm | Oyuncu ne öğrenir | Nasıl |
|---|---|---|---|
| İpucu 1 | w1-01 | Pırıl, Aldemir'in adını söylenmeden biliyor | Çıkış kancası |
| İpucu 2 | w1-02, w1-06 | Karanlıkta birinin elini tutmuş gibi hatırlıyor; bir ninni biliyor | Çıkış repliği + kanca |
| Açığa çıkma 1 | w1-08 | Pırıl'ın bir babası var ve sesi lanetin içinden geliyor | Canon replik: "Bu ses… babamın sesi." (korundu) |
| Netleşme | w1-09 | O ses Kral'ın sesi; Kral kızını arıyor | Baba sesi: "Kızım… neredesin?" (korundu, yeni yerleşim) |
| Ad | w2-06 | Adı Mira; "Pırıl" babasının taktığı ad | Nefes bölümünde, bahçede |
| Neden | w3-03 | Veyis şafaktan korkar çünkü şafak onu götürür | Pırıl söyler |
| Saklı söz | w3-06 | Mira gideceğini biliyordu ve söylemedi | Pırıl söyler + kırıntı kartı |
| Kapanış | w3-09 | Söz söylenir; veda | Final |

Kural: Veyis'in adı w2-02'de, "Mira" adı w2-06'da söylenir; ondan önceki kartlar, repliklar ve kırıntılar ikisini de anmaz ("kral", "kız", "baba" der). Bu kural bölüm 8.2'de kontrol listesi olarak tekrarlanır.

---

## 2. Retention araçları (anlatı tarafı)

### 2.1 Bölüm sonu çengelleri

Her bölümün çıkışında 1 satır "kanca" vardır (bölüm 3, her bölümde). Kancalar üç türdendir ve dönüşümlüdür: (a) bir soru ("Ona adını kim söylemişti?"), (b) bir ses/işaret ("ağır, düzenli adımlar"), (c) bir kayıp ya da değişim ("Zerrin ilk kez nüktesiz kaldı"). İlk oturum (tasarım belgesi: ~5-6 bölüm, w1-01..w1-05/06) çengelleri: w1-01 adını biliyor, w1-02 ağır adımlar, w1-03 "Komutan", w1-04 mezarlık kapısı, w1-05 ninni sesi, w1-06 ninniyi bitirdi. Böylece oturumu bırakan oyuncu hiçbir noktada çözülmüş bir soruyla bırakmaz.

`[KOD]` Kanca, bölüm sonu ekranında outro altında, sonraki bölümün adıyla birlikte tek satır gösterilir (tasarım belgesi §2.4 "Çengel 2"). Bugünkü şemada `outro` içine son satır olarak yazılabilir (geçici çözüm: kanca = outro'nun son satırı, konuşmacısız).

### 2.2 Açığa çıkma takvimi (her 3 bölümde bir)

| # | Bölüm | Açığa çıkan | Perde |
|---|---|---|---|
| A1 | w1-03 | Taş Bekçiler, kralın nöbetçileriydi; Taşkın tek kurtulan | I |
| A2 | w1-06 | Pırıl bir ninni biliyor; totem, hatırlamaya benzer bir şey tetikliyor | I |
| A3 | w1-09 | Kral kızını arıyor ("Kızım… neredesin?") | I |
| A4 | w2-03 | Veyis hasta kızı için Gece Kalbi'ni bağladı; taş çatladı | II |
| A5 | w2-06 | Pırıl'ın adı Mira | II |
| A6 | w2-09 | Aldemir'i o gece Zerrin uyuttu; Zerrin fedakârlık yapıp susar | II |
| A7 | w3-03 | Veyis şafaktan neden korkuyor: şafak Mira'yı götürür | III |
| A8 | w3-06 | Mira gideceğini biliyordu ve söylemedi | III |
| A9 | w3-09 | Veyis bırakır; veda | III |

Aralardaki bölümler (w1-01/02/04/05/07/08, w2-01/02/04/05/07/08, w3-01/02/04/05/07/08) "küçük açığa çıkma" taşır: yeni bir ipucu cümlesi ya da bir kırıntı kartı (bölüm 2.3).

### 2.3 Toplanabilir lore: Gece Kalbi kırıntısı (hatıra kartı)

**Fikir:** Her bölüm tamamlanınca bir "Kırıntı" kazanılır: Gece Kalbi'nin bir kırığında saklı, 1-2 cümlelik bir **hatıra**. 27 kırıntı birlikte hikâyenin "ikinci anlatısını" (kral, kız, Zerrin, nöbetçiler) verir; her bölümde "yeni bir parça" hissi sağlar ve tamamlama hırsı yaratır. Bölüm 3'te 27 kırıntının metni bölüm bölüm verilmiştir.

- `[KOD]` Bugün oyunda kırıntı kartı YOKTUR. Gerekli: (a) `levels.<id>.shard` (str, <= 200) alanı, (b) bölüm sonu ekranında gösterim, (c) `save` içinde `shards[]` (kazanılan bölüm kimlikleri; mevcut `completed` listesi ile aynıdır, ek kayıt şart değil), (d) isteğe bağlı "Kırıntı Defteri" ekranı (liste; kazanılmayanlar kilitli).
- Kod yoksa geçici çözüm: kırıntı metni `outro`nun son konuşmacısız satırı olarak yazılabilir (240 sınırı içinde), ancak "defter" ve sayaç olmaz.
- Kartın "anlatan"ı: Zerrin notu, Veyis hatırası, Mira hatırası, Nöbetçi mührü, Taşkın yemini, halk sesi. Ön ek formatı: `Kırıntı 12 · Zerrin'in notu: …`.
- Sıra kuralı: spoiler kuralı (bölüm 1.5) kırıntılara da uygulanır.
- Retention etkisi: koleksiyon tamamlama (27/27); tekrar oynayan oyuncuya "kaçırdığım hatıra var mı?" nedeni. Ölçülmediği için etkisi VARSAYIMDIR.

### 2.4 Tekrarlayan ritüeller

| Ritüel | Kim | Ne zaman | Nasıl evrilir |
|---|---|---|---|
| Nükte | Zerrin | Perde I-II intro/outro, ölüm repliği | Perde II ortasında azalır (w2-04), w2-09'da son; Perde III'te Aldemir nükteyi devralır (w3-02, w3-05'te "Zerrin olsa derdi ki…") |
| Tek kelime | Taşkın | w1-03'ten itibaren | "Nöbet." → "Komutan." → "Kardeşler." → "Yemin tutuldu." → "Gidin. Kapıyı ben tutarım." |
| Sayma | Pırıl | Kristal bölümleri | "Bir, iki, çok!" (Perde I) → "Bir, iki, üç… hepsini saydım!" (Perde III) |
| Mantra | Aldemir | Perde başına bir kez | "Uyanığım." → "Buradayım." → "Bırakıyorum." |
| Işığın ritmi | Pırıl | Ölüm ve DDA | Pırıl solgunlaşır, yeniden parlar |

Zerrin nükte havuzu (intro/outro/ölüm rotasyonunda serbestçe kullanılabilir; Perde I-II): 
- "Baykuş olmanın tek iyi yanı: kimse seninle tartışmıyor."
- "Tüylerim dökülüyor, sabrım hâlâ yerinde."
- "Büyücü önce okur, sonra ateş eder. Sen tersini seçiyorsun."
- "Ölmek de bir yöntemdir, ama çok yavaş öğretir."
- "Korkma; korkmak için önce hayatta kalman gerek."
- "Ben bir yüzyıldır dalda oturuyorum, sen iki adım koşunca yoruldun mu?"
- "Bu düşman yavaş, sen daha yavaşsın. Neyse, adil."

Taşkın kelime havuzu: "Nöbet." · "Yürü." · "Tamam." · "Hayır." · "Sağlam." · "Tekrar." · "Komutan." · "Patlar." · "Yan yana." · "Tutarız."

### 2.5 Düşman ansiklopedisi: 1-2 cümlelik lore

`[KOD]` Ansiklopedi ekranı bugün YOKTUR (tasarım belgesi §6, öneri). Metinler hazır; geçici olarak yalnızca config'te `enemies.<id>.lore` alanında (şemada yok, bölüm 7) tutulabilir.

| Düşman | Ad | Lore (<= 160 karakter) |
|---|---|---|
| ghost | Ruh | Mezarda yatamayan kederin gölgesi. Düz yürür, düz düşer; tek vuruş yeter. |
| bat | Yarasa | Lanetin ilk dokunduğu canlılardan. Korkudan zikzak çizer, korkuttukça hızlanır. |
| golem | Taş Bekçi | Kralın nöbetçilerinden kalan taş kabuk. Yavaştır ama içinde hâlâ bir yemin var. |
| archer | Kemik Okçu | Menzili hâlâ ölçen eski bir nöbetçi. Atıştan hemen önce yayı parlar. |
| wolf | Kurt Ruhu | Buzulun açlığı, sürü hâlinde. Çömeldiğinde hücuma hazırdır; hücum sonrası yorulur. |
| ember | Kor Hortlak | Yanan köyün unutamadığı yangın. Yaklaşınca kızarır ve patlar; yanındakilere de zarar verir. |
| priest | Karanlık Rahip | Kralı kutsarken kendini kaybeden rahip. Dostlarını iyileştirir, kalkanla örter. |
| totem | Lanet Totemi | Gece Kalbi'nin kırıntısıyla beslenen direk. "Bir gece daha" dileğinin biçimi; ruh doğurur. |
| knight | Kemik Şövalye | Kralın baş nöbetçisi. Yemini Kalbe'ydi; kapıyı kapatan emri ise kraldan aldı. |
| knight_ii | Ay Nöbetçisi | Ay Kulesi'nin bekçisi. Daha dayanıklı, daha yorgun; yemini hâlâ taşıyor. |
| knight_iii | Harap Nöbetçi | Kale kapısının eski kıdemlisi. Sertliğinin altında bir özür saklı. |
| knight_iv | Son Nöbetçi | Dördüncü ve son. Kralı hâlâ baba olarak görür; ona ulaşmanın bedelini bilir. |
| boss | Gölge Kral | Bir babanın, kızı için tuttuğu gece. Yenmek için öfke gerekmez; bırakmayı öğretmek gerekir. |

### 2.6 Ölüm ve yeniden deneme repliği (rotasyon)

Şema `deathLines` en çok **12** satır alır (`schema.js:100`). Aşağıdaki 16 satırın ilk 12'si (işaretli) bugünkü şemaya girer; kalan 4 için sınırın 16-24'e çıkarılması gerekir `[KOD]`. İlke: yenilgi suçlu aramaz; ışığa, yola, öğrenmeye bağlanır. Etiket: **[I-II]** = Zerrin konuşuyorsa yalnız Perde I-II'de seçilmeli (Perde III'te Zerrin susmuştur); `[KOD]` perde süzgeci gerekir. Süzgeç yoksa Zerrin satırlarını çıkarıp yerine Aldemir/Pırıl satırlarını tut.

| # | Konuşmacı | Satır | Şemaya girer mi |
|---|---|---|---|
| 1 | (anlatı) | Karanlık kazandı… bu gece. | evet (mevcut) |
| 2 | zerrin | Kalk. Bir yanlış daha yap, ama başka bir yanlış. | evet (mevcut) [I-II] |
| 3 | (anlatı) | Pırıl solgunlaştı. Tekrar dene. | evet (mevcut) |
| 4 | aldemir | Daha uykum yok. Bir daha. | evet |
| 5 | piril | Ben hâlâ buradayım! Hadi! | evet |
| 6 | taskin | Tekrar. | evet (w1-03 sonrası) |
| 7 | zerrin | Ölmek de bir yöntemdir ama çok yavaş öğretir. | evet [I-II] |
| 8 | piril | Yanıp sönmek serbest. Sönüp kalmak yasak. | evet |
| 9 | (anlatı) | Gece güldü. Kısa sürecek. | evet |
| 10 | aldemir | Bir kere uyudum, bir vadi bedel ödedi. İkinci kez pes etmem. | evet |
| 11 | taskin | Kalk. Yürü. | evet (w1-03 sonrası) |
| 12 | piril | Bir kırıntı daha lazım. Bir daha! | evet |
| 13 | zerrin | Baykuşlar da uçmayı düşerek öğrenir. Hadi. | `[KOD]` sınır artarsa [I-II] |
| 14 | aldemir | Zerrin olsa derdi ki: "Kalk, tüylerini silkele." Kalkıyorum. | `[KOD]` sınır artarsa [III] |
| 15 | piril | Işığım seninle. Gözlerini aç, yeniden bak. | `[KOD]` sınır artarsa |
| 16 | (anlatı) | Kırıntılar seni bekliyor. | `[KOD]` sınır artarsa |

### 2.7 Final sonrası: "Gece Yarığı" modunun anlatı mazereti

`[KOD]` Gece Yarığı modu bugün YOKTUR (tasarım belgesi §6, orta-büyük iş). Anlatı gerekçesi şöyle:

> Şafak doğdu; Aldemir ilk kez rahat uyudu. Ama rüyasında, uykunun kenarında ince bir yarık parlıyordu: Gece Kalbi'nin çatlağının hatırası. Ondan, vadinin bütün geçmiş geceleri sızıyordu. Bu kez Aldemir uykuda bile nöbet tutmayı **seçti**: suçluluktan değil, sorumluluktan.

- Mod adı: **Gece Yarığı**. Alt başlık: "Rüyanın kenarında nöbet".
- Dalga adı (HUD): "Yankı {n}". (Bir gecenin yankısı.)
- 5. dalga mini-boss = "Nöbetçinin yankısı" (Şövalye modelinin sürümü), 10. dalga boss = "Veyis'in yankısı": dövüşte öfke yoktur; boss çubuğu adı "Bir Babanın Yankısı". Yenilince ekranda tek satır: "Yankı dindi. Bir gece daha geçti."
- Her 3 dalgada perk seçimi: "Pırıl'ın armağanı" (adlandırma).
- Ölünce: "Rüya bitti. Yarık seni bekliyor." + en iyi dalga.
- Neden geri dönülür: hikâye bitti ama dünya bitmedi; rüya sonsuz; Aldemir'in "nöbeti" bırakılabilir bir şey değil, seçilmiş bir şey.

---
## 3. 27 bölümün kurgusu

**Okuma notu.**
- Kimlik, tema, hedef türü, rol ve ödül tasarım belgesi §4.4 ile BİREBİR aynıdır; burada değiştirilmedi (sayı/denge ona aittir). "Yeni öğe" sütunu §4.4'teki "Yeni öğe" ile aynıdır.
- Giriş/çıkış metinleri: en çok 3 satır, toplam <= 3 cümle (tek kelimelik seslenmeler, "Nöbet." gibi, cümleden sayılmaz). Konuşmacı yok = `anlatı:` (config'te `speaker` alanı verilmez). Tüm satırlar kopyala-yapıştır içindir ve 240 karakter sınırının çok altındadır. Tek istisna: w3-09 çıkışı (final ekranı, bölüm 4.4).
- **[DEĞİŞTİ]** = mevcut config metninden farklıdır; neden yazıldı. **[KORUNDU]** = aynen.
- "Hedef metni" `strings.objective` kalıplarına uyar; bugün olmayan kalıplar `[KOD]`.

### 3.0 Bir bakışta (tablo)

| id | Ad | Tema | Hedef metni | Oynanış rolü | Yeni öğe | Ödül |
|---|---|---|---|---|---|---|
| w1-01 | Fısıldayan Orman | forest | 25 mana kristali topla. | Nefes/öğret | Ruh, Ateş Topu | Buz Oku |
| w1-02 | Yarasa Mağarası | cave | 29 mana kristali topla. | Öğret | Yarasa | - |
| w1-03 | Taş Bekçiler | golems | 33 mana kristali topla. | Öğret | Taş Bekçi, Taşkın | Üçlü Büyü |
| w1-04 | Alacakaranlık Ormanı | forest-dusk (YENİ) | 60 saniye hayatta kal. | Uygula | Hayatta kal hedefi | Mana Kalkanı |
| w1-05 | Hortlak Mezarlığı | graveyard | 38 mana kristali topla. | Öğret | Kemik Okçu | Yıldırım |
| w1-06 | Ninni Mağarası | cave-ice (YENİ) | 1 Lanet Totemi'ni yık. | Nefes/öğret | Totem hedefi (tek) | Işınlan |
| w1-07 | Donmuş Geçit | pass | Süre dolmadan 31 kristal topla. `[KOD]` | Öğret | Kurt Ruhu | - |
| w1-08 | Yanık Köy | village | 3 Lanet Totemi'ni yık. | Tırman | Kor Hortlak | Zehir Bulutu |
| w1-09 | Kemik Kule | tower | Baş Nöbetçi'yi yen! `[KOD]` | Sınav (mini-boss) | Kemik Şövalye | - |
| w2-01 | Yalancı Şafak Mezarlığı | graveyard-dawn (YENİ) | 33 mana kristali topla. | Nefes | - (perde başı tam can) | - |
| w2-02 | Kristal Yatağı | crystals | 42 mana kristali topla. | Öğret | Karanlık Rahip | - |
| w2-03 | Fırtına Geçidi | pass-blizzard (YENİ) | 4 dalgayı püskürt. `[KOD]` | Uygula | Dalga savunması | Meteor |
| w2-04 | Alevli Köy | village-ember (YENİ) | 46 mana kristali topla. | Tırman | Kor + Kurt birlikte | - |
| w2-05 | Ay Kulesi | tower-moon (YENİ) | Ay Nöbetçisi'ni yen! `[KOD]` | Sınav (mini-boss) | Elit Şövalye II | - |
| w2-06 | Solgun Bahçe | forest-dusk (yeniden) | 90 saniye hayatta kal. | Nefes | Uzun ama sakin | Ay Işığı Halkası |
| w2-07 | Kızıl Harabe | golems-dusk (YENİ) | 3 Lanet Totemi'ni yık. | Tırman | Totem + Rahip kalkanı | - |
| w2-08 | Hatıra Yatağı | crystals-red (YENİ) | Süre dolmadan 35 kristal topla. `[KOD]` | Sınav/tırman | Hasarsız rozeti | Zaman Çatlağı |
| w2-09 | Harap Kale | castle-ruin (YENİ) | Harap Nöbetçi'yi yen! `[KOD]` | Sınav (mini-boss) | Elit Şövalye III + Rahipler | - |
| w3-01 | Gece Ormanı | forest-night (YENİ) | 38 mana kristali topla. | Nefes | - (perde başı tam can) | - |
| w3-02 | Buz Sürüsü | cave-ice (yeniden) | 100 saniye hayatta kal. | Uygula | Kurt + Yarasa sürüsü | - |
| w3-03 | Kutsal Halka | hold-arena (YENİ) | Kutsal Halka'yı 60 saniye koru. `[KOD]` | Uygula | Bölge tut | - |
| w3-04 | Küllenen Köy | village-ember (yeniden) | 3 Lanet Totemi'ni yık. | Tırman | Patlama zinciri + Rahip | - |
| w3-05 | Son Nöbet | tower-moon (yeniden) | Son Nöbetçi'yi yen! `[KOD]` | Sınav (mini-boss) | Elit Şövalye IV | - |
| w3-06 | Pırıl'ın Yolu | crystals-void (YENİ) | Pırıl'ı yol boyunca koru. `[KOD]` (yedek: bölüm 3.6 notu) | Nefes | Eskort | - |
| w3-07 | Kristal Kapısı | crystals-void (yeniden) | 50 mana kristali topla. | Tırman | Tüm düşman karması | - |
| w3-08 | Son Savunma | castle-ruin (yeniden) | 6 dalgayı püskürt. `[KOD]` | Sınav | 6 dalga | - |
| w3-09 | Gölge Kalesi | castle | Gölge Kral'ı yen! | Final (boss) | Gölge Kral 3 faz | - |

**Not (tasarım belgesi ile tutarsızlık).** Belgede "13 yeni tema varyantı" yazıyor, ama §4.4 tablosundan ÇIKARILAN ayrı yeni tema yalnızca **12**'dir (aşağıdaki tablo). 13. tema olarak epilog/Gece Yarığı için `dawn-valley` önerilir (bölüm 3.0.2); tasarımcı ve Emre karar verir.

### 3.0.2 Yeni tema ihtiyacı (kısa ad + görsel brief)

Tema = yalnızca config (tasarım belgesi §4.2, `floorKind`/`scenery` kombinasyonu, yeni sanat yok). Aşağıdaki "ring" renkleri ÖNERİDİR (mevcut halka renkleri: forest #8e44ff, cave #44a0ff, golems #ffa044, graveyard #44ff9a, pass #9ee8ff, village #ff7a2a, crystals #c58cff, tower #d8d8ff, castle #ff4466).

| Tema | Taban (zemin/dekor) | Atmosfer ve renk (öneri) | Görsel brief (1 cümle) |
|---|---|---|---|
| forest-dusk | forest | Alacakaranlık: turuncu-mor sis, ring #d98cb3 | Gece ile gündüz arasında kalmış orman; ağaç siluetleri morun üstünde amber bir kenar ışığı taşır. |
| cave-ice | cave | Buz mavisi, ring #9ee8ff, çok hafif kar kıvılcımı | Sarkıt ve dikitlerin buz tuttuğu, her damlanın dondurulmuş gibi asılı durduğu sessiz mağara. |
| graveyard-dawn | graveyard | Soluk pembe-altın sis, ring #ffb3a7 | Mezar taşlarının üstünde "yalancı şafak": ufukta kızıl-pembe, ama gökyüzünün geri kalanı hâlâ siyah. |
| pass-blizzard | pass (ice dekoru, kar zemini) | Beyaz-mavi, yoğun kar, mist yüksek, ring #cfe8ff | Görüş mesafesi kısalmış, rüzgârın yatay savurduğu kar fırtınası. |
| village-ember | village | Kor yoğunluğu yüksek, kıvılcım/kül, ring #ff5a1a | Aynı köy, ama yangın hâlâ sönmemiş; kömürleşmiş kirişlerin arasında küçük alevler. |
| tower-moon | tower | Mavi-gümüş ay ışığı, ring #cfd8ff | Kemik kule, tam ay altında; zemin çatlaklarında gümüş yansıma. |
| golems-dusk | golems (ruins) | Kızıl akşam, ring #ff7a5a | Taş Bekçi harabesi gün batarken; sütunlar uzun kızıl gölge atar. |
| crystals-red | crystals | Kızıl-magenta kristaller, ring #ff4f7a | Mor kristal yatağının kızıl "yas" sürümü; kristaller içten atan kalp gibi parlar. |
| castle-ruin | castle | Kırık duvar, çatlak taht, ring #b0506a | Kalenin dış avlusu; yıkık surlar, devrik bayraklar, uzakta tahtın silüeti. |
| forest-night | forest | Koyu lacivert, ay yok, ışık böceği benzeri noktalar, ring #5fa8ff | En karanlık orman; yalnız Pırıl'ın ışığı ve birkaç mantar parıltısı yol gösterir. |
| hold-arena | golems (ruins) | Altın ve taş, ring #ffd27a | Ortasında taş bir çember olan, etrafı runik sütunlarla çevrili sade arena; "tutulacak bölge" belli olmalı. |
| crystals-void | crystals | Siyah boşluk, beyaz-mor kristaller, mist yüksek, ring #ffffff | Kristallerin havada asılı durduğu, zemini neredeyse görünmeyen "kalbin içi". |
| dawn-valley (13., OPSİYONEL) | grass | Altın-pembe, ring #ffe9a8 | Epilog ve Gece Yarığı arka planı; vadinin ilk şafak sahnesi. |

Yeniden kullanım: w2-06 forest-dusk, w3-02 cave-ice, w3-04 village-ember, w3-05 tower-moon, w3-07 crystals-void, w3-08 castle-ruin. Tekrarı kırmak için hikâye ışığı farkı önerilir (örn. w3-04'te daha az alev, daha çok kül; w3-05'te ay doğu ufkunda).

---

### PERDE I · UYANIŞ

#### w1-01 · Fısıldayan Orman — tema: forest
- **Hikâye rolü:** Aldemir uyanır; ilk adımı atar; Pırıl ile ilk karşılaşma.
- **Oynanış rolü:** Nefes/öğret (hareket, kristal, Ateş Topu). Hedef: 25 mana kristali topla.
- **Yeni öğe:** Ruh. "Ruhlar düz yürür; kaçmak kolaydır, vurmak daha kolay."
- **Giriş [KORUNDU + 1 satır]**
```
zerrin: Kule sustu, orman konuşuyor. Kristalleri topla; mana olmadan büyü olmaz.
aldemir: O gece uyuyakaldım; bu gece uyanığım.
```
- **Çıkış [KORUNDU + 1 satır]**
```
zerrin: Fena değil. Ormanın fısıltısı seni tanıdı.
anlatı: Küçük bir ışık yolunu aydınlattı.
piril: Merhaba, Aldemir!
```
- **Kanca:** Küçük ışık, ona yol göstermek için sanki yıllardır bekliyordu.
- **Kırıntı 1:** Kule defterinden: "Bu gece Aldemir nöbette. Şafağa kadar uyanık kalacak."

#### w1-02 · Yarasa Mağarası — tema: cave
- **Hikâye rolü:** Lanet hayvanları çıldırtıyor; Pırıl konuşkan ve Aldemir'in adını bilmesi tuhaf.
- **Oynanış rolü:** Öğret. Hedef: 29 mana kristali topla.
- **Yeni öğe:** Yarasa. "Yarasalar zikzak çizer; nişan alırken biraz önlerini hedefle."
- **Giriş [DEĞİŞTİ: ad eklendi + soru]**
```
piril: Vızıltıyı duyuyor musun, Aldemir? Mağara canlı.
aldemir: Adımı nereden biliyorsun?
```
- **Çıkış [DEĞİŞTİ: "Üçlü büyü bunu halleder" kaldırıldı, çünkü Üçlü artık w1-03 ödülüdür]**
```
zerrin: Yarasalar korkudan değil, lanetten çıldırıyor.
piril: Karanlıkta hep biri elimi tutardı gibi geliyor.
```
- **Kanca:** Pırıl adı nereden bildiğini söylemedi; belki kendisi de bilmiyordu.
- **Kırıntı 2:** Zerrin'in notu: "Lanet önce hayvanlara işler. Hayvan, insandan önce hisseder."

#### w1-03 · Taş Bekçiler — tema: golems
- **Hikâye rolü:** Açığa çıkma A1: bu harabe kralın nöbetçilerinin evi; Taşkın katılır.
- **Oynanış rolü:** Öğret. Hedef: 33 mana kristali topla.
- **Yeni öğe:** Taş Bekçi (+ sahnede Taşkın figürü). "Taş Bekçiler yavaştır ama kolay yıkılmaz."
- **Giriş [KORUNDU + 1 satır]**
```
anlatı: Bu harabe bir zamanlar kralın nöbetçilerinin evi. Şimdi lanet, onları taşa gömdü.
zerrin: Taş Bekçiler yavaş ama dayanıklı; bol ateş gerekecek.
```
- **Çıkış [DEĞİŞTİ: "Yıldırım çarptığında…" cümlesi kaldırıldı; Yıldırım artık w1-05 ödülü]**
```
anlatı: Taşkın taşlaşmış kabuğunu çatlattı.
taskin: Ben… yürüyebiliyorum. Peşindeyim.
```
- **Kanca:** Taşkın kuleye baktı ve tek kelime etti: "Komutan."
- **Kırıntı 3:** Taşkın'ın yemini: "Gece Kalbi'ni korumak için taş olmayı bile kabul ederim."

#### w1-04 · Alacakaranlık Ormanı — tema: forest-dusk (YENİ)
- **Hikâye rolü:** Aldemir'in suçluluğu en ağır anında; "Kalkan" bir omuz yükü gibi sunulur.
- **Oynanış rolü:** Uygula. Hedef: 60 saniye hayatta kal.
- **Yeni öğe:** Hayatta kal hedefi; kristal toplamak ara sıra kalp verir. "Bu bölümde kristal hedef değil, ama toplarsan ara sıra kalp çıkar."
- **Giriş**
```
zerrin: Burada ne gece var ne gündüz. Altmış saniye ayakta kal.
taskin: Nöbet.
```
- **Çıkış**
```
aldemir: Bir vuruşu emer, diyorlar. Keşke her şey bir vuruşla bitseydi.
piril: Yürü yeter!
```
- **Kanca:** Ormanın ardında bir mezarlık kapısı gıcırdadı.
- **Kırıntı 4:** Zerrin'in notu: "Alacakaranlık, Gece Kalbi'nin son nefesi. Çatladığı gün vadi ikiye bölündü: ne gece ne gündüz."

#### w1-05 · Hortlak Mezarlığı — tema: graveyard
- **Hikâye rolü:** Aldemir mezarlarda kendi uykusunun bedelini görür.
- **Oynanış rolü:** Öğret. Hedef: 38 mana kristali topla.
- **Yeni öğe:** Kemik Okçu. "Okçu atıştan hemen önce parlar; o an yönünü değiştir."
- **Giriş [KORUNDU + 1 satır]**
```
anlatı: Mezarlar açık, mezarcı yok. Kemik Okçuları menzilden vurur; hareket etmeyi bırakma.
aldemir: Burada yatanların çoğu ben yokken öldü.
```
- **Çıkış [KORUNDU + 1 satır]**
```
zerrin: Kralın askerleri bile huzur bulamıyor. Gece Kalbi'nin çatlağı büyüyor.
aldemir: Zaman kaybedemeyiz.
```
- **Kanca:** Buzul yolundan, bir ninni gibi ince bir ses geliyordu.
- **Kırıntı 5:** Mezarcının günlüğü: "Bu gece de şafak doğmadı. Gömdüklerimi saymayı bıraktım."

#### w1-06 · Ninni Mağarası — tema: cave-ice (YENİ)
- **Hikâye rolü:** A2: Pırıl totemin içinden bir ninni duyar ve sözlerini bilir.
- **Oynanış rolü:** Nefes/öğret (tek totem). Hedef: 1 Lanet Totemi'ni yık.
- **Yeni öğe:** Totem hedefi. "Totem 12 saniyede bir Ruh doğurur; ne kadar erken yıkarsan o kadar rahat edersin."
- **Giriş**
```
piril: Çok sessiz. Bu sessizlik… tanıdık.
zerrin: Tek bir totem yeter; yık da mağara nefes alsın.
```
- **Çıkış**
```
anlatı: Totem çatladı; mağarada eski bir ninni yankılandı.
piril: Bu şarkıyı biliyorum. Kim söylerdi bana?
```
- **Kanca:** Pırıl ninniyi sonuna kadar söyledi; kimse ona öğretmemişti.
- **Kırıntı 6:** Bir ninninin sözleri: "Gece uzun olsun küçüğüm, sabah sana yakın olsun."

#### w1-07 · Donmuş Geçit — tema: pass
- **Hikâye rolü:** Rüzgârda sıcak bir an: Pırıl'ın ışığı ilk kez "ısıtır".
- **Oynanış rolü:** Öğret; zamanlı kristal. Hedef: Süre dolmadan 31 kristal topla `[KOD]`.
- **Yeni öğe:** Kurt Ruhu hücumu. "Kurt çömelince hücuma geçer; yana sıçra, yorulunca vur."
- **Giriş [DEĞİŞTİ: "sadece ayakta kal" → "zaman daralıyor": hedef artık hayatta kal değil, zamanlı kristal]**
```
anlatı: Rüzgâr kemiğe işliyor. Kurt ruhları sürü hâlinde geliyor; zaman daralıyor.
zerrin: Kurt çömelince Işınlan'ı kullan!
```
- **Çıkış [KORUNDU + 1 satır]**
```
anlatı: Şafağa daha çok var, ama Pırıl'ın ışığı ilk kez gerçek bir sıcaklık gibi hissettirdi.
piril: Üşümüyorum. Ama sen titriyorsun, Aldemir.
```
- **Kanca:** Geçidin ucunda bir köy, kor gibi yanıyordu.
- **Kırıntı 7:** Donmuş bir haberci: "Kral kapıları kapattı. Kimse kaleye giremez, kimse çıkamaz."

#### w1-08 · Yanık Köy — tema: village
- **Hikâye rolü:** A (kısmi sürpriz): Pırıl'ın babası var ve sesi lanetin içinden geliyor.
- **Oynanış rolü:** Tırman. Hedef: 3 Lanet Totemi'ni yık.
- **Yeni öğe:** Kor Hortlak. "Kor yaklaşınca kızarır ve patlar; kalabalığa çekersen diğerlerine de zarar verir."
- **Giriş [KORUNDU + Taşkın]**
```
anlatı: Köy yanmadı, lanet yangını hatırlıyor. Totemleri yık; kor hortlaklar yakınında patlıyor.
taskin: Patlar. Dikkat.
```
- **Çıkış [KORUNDU; Zehir ödülü sistem satırında zaten gösterilir]**
```
anlatı: Son totem parçalanınca Pırıl titredi.
piril: Bu ses… babamın sesi.
anlatı: Zerrin sustu.
```
- **Kanca:** Zerrin'in sessizliği, söylediği her şeyden daha fazla şey söyledi.
- **Kırıntı 8:** Totemin içinden bir ses: "Bir gece daha… yalnız bir gece daha tutayım."

#### w1-09 · Kemik Kule — tema: tower — PERDE I SINAVI (mini-boss: Baş Nöbetçi)
- **Hikâye rolü:** A3: baba sesi. Taşkın eski komutanıyla yüzleşir.
- **Oynanış rolü:** Sınav (mini-boss). Hedef: Baş Nöbetçi'yi yen! `[KOD]` (bugün sabit metin: "Kemik Şövalye'yi yen!").
- **Yeni öğe:** Kemik Şövalye. "Şövalye yere vurmadan önce bir saniye bekler; o an yarıçap dört birimden uzaklaş."
- **Giriş [KORUNDU + Taşkın]**
```
anlatı: Kralın baş nöbetçisi kuleyi bırakmadı. Şövalye ağır ama bir vuruşu seni gönderir.
taskin: Komutan.
```
- **Çıkış [DEĞİŞTİ: "Kale kapısı açıldı" kaldırıldı; kale Perde III'te. Ses, uzaktaki kaleden gelir.]**
```
anlatı: Şövalye toza döndü; uzaktaki kaleden bir ses süzüldü.
veyis: Kızım… neredesin?
piril: Beni… çağırıyor.
```
- **Kanca:** Pırıl'ın ışığı ilk kez titredi, sonra kaleye doğru yöneldi.
- **Kırıntı 9:** Baş Nöbetçi'nin mührü: "Kalbi koruyacağım. Tahtı değil."
- **Mini-boss repliği:** taunt (savaş başında) "Kapı kapalı. Kral rahatsız edilmesin." · yenilgi "Kralım… affet. Nöbetten çıkıyorum." (konuşmacı: Nöbetçi, bölüm 5.3)

**Perde I kapanış kancası:** "Kızım… neredesin?"

---

### PERDE II · KIRIK YOL

#### w2-01 · Yalancı Şafak Mezarlığı — tema: graveyard-dawn (YENİ)
- **Hikâye rolü:** Perde başı nefesi; gökyüzünde kırık Kalp'in yansıması şafak sanılır.
- **Oynanış rolü:** Nefes. Hedef: 33 mana kristali topla. (Perde başı tam can: tasarım belgesi `worldStartHeal`.)
- **Yeni öğe:** Yok.
- **Giriş**
```
zerrin: Gökyüzü ağarıyor ama bu şafak değil; çatlak Kalp'in yansıması.
piril: Olsun, güzel.
```
- **Çıkış**
```
aldemir: Yalancı şafak bile iyi geldi.
zerrin: Bundan sonrası Kırık Yol: her adımda bir şey eksilir.
```
- **Kanca:** Mezarlığın ardında, kırıkların ışığı kızıla çalıyordu.
- **Kırıntı 10:** Bir hatıra: bahçede koşan küçük bir kız ve ilk kez kahkaha duyan bir kral.

#### w2-02 · Kristal Yatağı — tema: crystals
- **Hikâye rolü:** Veyis'in adı ilk kez söylenir; kırıkların hatıra taşıdığı ortaya çıkar.
- **Oynanış rolü:** Öğret. Hedef: 42 mana kristali topla.
- **Yeni öğe:** Karanlık Rahip. "Rahibin kalkanı bir vuruşu emer; Zehir Bulutu kalkanı geçer."
- **Giriş [KORUNDU + Taşkın]**
```
anlatı: Gece Kalbi'nin kırıkları burada parlıyor. Rahipler düşmanları iyileştirir; önce onları bul.
taskin: Rahip. Önce.
```
- **Çıkış [KORUNDU + 1 satır; Meteor artık w2-03 ödülü]**
```
zerrin: Kalbin son kırığı kalede. Dikkat et Aldemir, o kısım artık Veyis'in kendisi.
aldemir: Veyis demek.
```
- **Kanca:** Kırığın içinde bir hatıra kıpırdadı; Zerrin ona bakmamayı seçti.
- **Kırıntı 11:** Veyis'in kırığı: "Tahta oturmak istemedim. Yalnız kızımın yanında oturmak istedim."

#### w2-03 · Fırtına Geçidi — tema: pass-blizzard (YENİ)
- **Hikâye rolü:** A4: Zerrin, Veyis'in hikâyesini anlatır.
- **Oynanış rolü:** Uygula. Hedef: 4 dalgayı püskürt. `[KOD]`
- **Yeni öğe:** Dalga savunması. "Dalgalar sırayla gelir; her dalgayı bitirdikçe sayaç ilerler."
- **Giriş**
```
zerrin: Kar fırtınası dört dalga getiriyor.
aldemir: Geçidi tutacağız.
taskin: Tutarız.
```
- **Çıkış**
```
zerrin: Veyis, hasta kızı için Gece Kalbi'ni kendine bağladı.
aldemir: Kurtarabildi mi?
zerrin: Taş çatladı; kral da.
```
- **Kanca:** Pırıl "hasta kız" lafında bir an sönüp yandı.
- **Kırıntı 12:** Karın altında bir ilaç şişesi, etiketi silik: "P… için. Her gece bir kaşık."

#### w2-04 · Alevli Köy — tema: village-ember (YENİ)
- **Hikâye rolü:** Aldemir'in dönüş noktası: suçluluktan sorumluluğa.
- **Oynanış rolü:** Tırman. Hedef: 46 mana kristali topla.
- **Yeni öğe:** Kor + Kurt birlikte. "Kor patlar, kurt fırlar; ikisi birlikte gelince bir yerde durma."
- **Giriş**
```
aldemir: Evlerin çoğu boş. İnsanlar ya kaçtı ya da…
zerrin: Kor patlar, kurt fırlar; ikisi birlikte gelince durma.
```
- **Çıkış**
```
aldemir: Artık "benim suçum" demeyeceğim. "Benim işim" diyeceğim.
zerrin: Bu cümleyi uzun zamandır bekliyordum.
```
- **Kanca:** Köy çanı bir kez çaldı; onu çalan kimse yoktu.
- **Kırıntı 13:** Duvara kazınmış: "Kral bizi korumak istedi. Kaleye sığınanlar geri dönmedi."

#### w2-05 · Ay Kulesi — tema: tower-moon (YENİ) — mini-boss: Ay Nöbetçisi
- **Hikâye rolü:** Nöbetçilerin yemininin Kalbe, krala değil olduğu ortaya çıkar.
- **Oynanış rolü:** Sınav (mini-boss, Elit Şövalye II). Hedef: Ay Nöbetçisi'ni yen! `[KOD]`
- **Yeni öğe:** Elit Şövalye II (daha dayanıklı Şövalye). "Bu şövalye ötekinden daha dayanıklı; sabırlı ol."
- **Giriş**
```
anlatı: Ay Kulesi'nin nöbetçisi geceyi yerinden kıpırdamadan geçiriyor. Bu şövalye ötekinden daha dayanıklı.
taskin: Eski dost.
```
- **Çıkış**
```
nobetci: Yemin Kalbe'ydi, krala değil. Ama yine de nöbetteydim.
aldemir: Dinlen.
```
- **Kanca:** Ay, bir an için küçük bir kızın yüzü gibi göründü.
- **Kırıntı 14:** Ay Nöbetçisi'nin yeminden kalan satır: "Şafak gelirse nöbet biter. Gelmezse nöbet bizi bitirir."
- **Mini-boss repliği:** taunt "Ay doğdu, nöbet sürüyor. Geri dönün." · yenilgi "Yemin… Kalbe… Gidebilirsiniz."

#### w2-06 · Solgun Bahçe — tema: forest-dusk (yeniden)
- **Hikâye rolü:** A5: Pırıl adını hatırlar: Mira.
- **Oynanış rolü:** Nefes (uzun ama sakin). Hedef: 90 saniye hayatta kal.
- **Yeni öğe:** Ay Işığı Halkası ödülü. "Halka yakınındaki düşmanları iter; sıkıştığında kullan."
- **Giriş**
```
piril: Burayı tanıyorum. Çiçekler benim içindi.
zerrin: Doksan saniye ayakta kal; gerisi senin değil, onun.
```
- **Çıkış**
```
piril: Babam bana Pırıl derdi. Adım Mira.
aldemir: Buradayım, Mira.
```
- **Kanca:** Işığı hiç bu kadar parlamamıştı; hiç bu kadar solabilir de görünmemişti.
- **Kırıntı 15:** Bahçıvanın notu: "Prensesin çiçekleri solmasın diye geceleri sulandı. Kral her sabah camdan bakardı."

#### w2-07 · Kızıl Harabe — tema: golems-dusk (YENİ)
- **Hikâye rolü:** Taşkın'ın yası ve sadakati; Zerrin zayıflamaya başlar.
- **Oynanış rolü:** Tırman. Hedef: 3 Lanet Totemi'ni yık.
- **Yeni öğe:** Totem + Rahip kalkanı. "Rahibin kalkanı totemi de örter; önce rahip, sonra totem."
- **Giriş**
```
taskin: Burası. Evim.
zerrin: Totemleri rahipler koruyor; önce rahipleri sustur.
```
- **Çıkış**
```
taskin: Kardeşler huzurda.
aldemir: Sen hâlâ nöbettesin, dostum.
```
- **Kanca:** Zerrin'in kanadından bir tüy düştü; bu kez eğilip almadı.
- **Kırıntı 16:** Taş Bekçi yemini: "Taş olmak kolay. Taş kalmak ağır."

#### w2-08 · Hatıra Yatağı — tema: crystals-red (YENİ)
- **Hikâye rolü:** Veyis'in yası kristal olmuştur; Zaman Çatlağı, onun "anı tutma" çabasının küçük, bırakılabilir sürümüdür.
- **Oynanış rolü:** Sınav/tırman; zamanlı kristal + hasarsız rozeti. Hedef: Süre dolmadan 35 kristal topla `[KOD]`.
- **Yeni öğe:** Hasarsız rozeti; Zaman Çatlağı ödülü. "Zaman Çatlağı düşmanları üç saniye yavaşlatır, sen normal kalırsın."
- **Giriş**
```
zerrin: Bu kristaller kızıl: Veyis'in yası.
piril: Dokunuşları sıcak ama içleri acıyor.
```
- **Çıkış**
```
zerrin: Zaman Çatlağı bir anı uzatır ama durduramaz.
aldemir: Bunu Veyis'e de anlatacağım.
```
- **Kanca:** Kristalin içinde genç Zerrin belirdi; elinde bir demlik vardı.
- **Kırıntı 17:** Veyis'in kırığı: "Kızımın ateşi düşmüyor, Zerrin." — "Biliyorum, Majesteleri. Biliyorum."

#### w2-09 · Harap Kale — tema: castle-ruin (YENİ) — PERDE II SINAVI (mini-boss: Harap Nöbetçi)
- **Hikâye rolü:** A6: Zerrin'in sırrı ve fedakârlığı.
- **Oynanış rolü:** Sınav (mini-boss, Elit Şövalye III + Rahipler). Hedef: Harap Nöbetçi'yi yen! `[KOD]`
- **Yeni öğe:** Elit Şövalye III + Rahipler. "Rahipler şövalyeyi kalkanla örter; önce onları sustur."
- **Giriş**
```
anlatı: Harap Kale'nin kapısında üçüncü nöbetçi bekliyor; yanında iki Rahip var.
zerrin: Kapıyı açmak için son kırıntımı vereceğim. Beni kolla.
```
- **Çıkış**
```
zerrin: O gece seni ben uyuttum, Aldemir; Veyis'in planını biliyordum ve seni korumak istedim.
aldemir: Suçlu kim, artık önemli değil. Düzeltecek kim, o önemli.
```
- **Kanca:** Zerrin son kırıntıyı kapıya bıraktı ve baykuş gözlerini kapadı.
- **Kırıntı 18:** Zerrin'in son notu: "Aldemir'e söylemedim; söylersem kendimi affettirmeye çalışırdım."
- **Mini-boss repliği:** taunt "Kral emretti: kimse geçmesin." · yenilgi "Kapı sizin. Yeter ki Kral'ı… affedin."

**Perde II kapanış kancası:** Zerrin sustu; Pırıl: "Babama gideceğim, Aldemir."

---

### PERDE III · GECE KALBİ

#### w3-01 · Gece Ormanı — tema: forest-night (YENİ)
- **Hikâye rolü:** Yas ve kararlılık; Zerrin'siz ilk bölüm.
- **Oynanış rolü:** Nefes. Hedef: 38 mana kristali topla. (Perde başı tam can.)
- **Yeni öğe:** Yok.
- **Giriş**
```
aldemir: Zerrin'siz orman daha sessiz.
piril: Tüyü hâlâ ışıyor.
taskin: Birlikte.
```
- **Çıkış**
```
aldemir: Yürüyeceğim. Onun için de, senin için de.
piril: Hep birlikte!
```
- **Kanca:** Dalda tek bir tüy ışıyordu; baykuşun yüzü huzurluydu.
- **Kırıntı 19:** Zerrin'in vasiyeti: "Aldemir, nükte yap. Ağlayacaksan sonra ağla."

#### w3-02 · Buz Sürüsü — tema: cave-ice (yeniden)
- **Hikâye rolü:** Aldemir ilk kez Zerrin'in nüktesini devralır; Pırıl sarayın arka yolunu bilir.
- **Oynanış rolü:** Uygula. Hedef: 100 saniye hayatta kal.
- **Yeni öğe:** Kurt + Yarasa sürüsü. "Sürü hâlinde gelenlere karşı sürekli hareket et."
- **Giriş**
```
aldemir: Zerrin olsa derdi ki: "Kurtlar da üşüyor, ısıtalım."
taskin: Isıt.
```
- **Çıkış**
```
anlatı: Sürü dağıldı; mağaranın ucunda ışık gibi bir kapı göründü.
piril: Bu yol sarayın arka kapısına çıkıyor. Biliyorum.
```
- **Kanca:** Pırıl yolu biliyordu; ilk kez kimse ona yol göstermiyordu.
- **Kırıntı 20:** Kale bekçisinin notu: "Sürü, kralın av köpeklerinin torunları. Kral gidince sahipsiz kaldılar."

#### w3-03 · Kutsal Halka — tema: hold-arena (YENİ)
- **Hikâye rolü:** A7: Veyis'in şafak korkusu açıklanır; Taşkın yemini tamamlar.
- **Oynanış rolü:** Uygula. Hedef: Kutsal Halka'yı 60 saniye koru. `[KOD]`
- **Yeni öğe:** Bölge tut. "Halkanın içinde kaldığın sürece sayaç ilerler." (Kuralın kesin biçimi geliştirme kararıdır.)
- **Giriş**
```
taskin: Kutsal Halka. Nöbet yerim.
piril: Halkanın içinde dur, ben seni kollarım.
```
- **Çıkış**
```
taskin: Yemin tutuldu.
piril: Babam şafaktan korkmuyor. Şafakta beni kaybedeceğinden korkuyor.
```
- **Kanca:** Kale hâlâ karanlıktı, ama karanlığın içinde biri ağlıyordu.
- **Kırıntı 21:** Veyis'in kırığı: "Gün doğarsa kızım gider. Gün doğmasın. Yeter ki gün doğmasın."

#### w3-04 · Küllenen Köy — tema: village-ember (yeniden)
- **Hikâye rolü:** Totemler yeniden yükselmiştir: Veyis vazgeçmiyor. Pırıl'ın cümlesi: "Artık tutunmasın."
- **Oynanış rolü:** Tırman. Hedef: 3 Lanet Totemi'ni yık.
- **Yeni öğe:** Patlama zinciri + Rahip. "Kor hortlak yalnız seni değil, yanındakileri de patlatır; zincir kur."
- **Giriş**
```
anlatı: Totemler külün üstünden yeniden yükselmiş; Veyis vazgeçmiyor.
piril: Kor hortlaklar yalnız seni değil, rahipleri de patlatır.
```
- **Çıkış**
```
aldemir: Her totem, bir babanın bir gece daha tutunması.
piril: Artık tutunmasın.
```
- **Kanca:** Kalenin kulesinde bir ışık söndü; Gece Kalbi bir kez daha attı.
- **Kırıntı 22:** Bir totemin dibinde minik bir ayakkabı: kral her totemin altına kızının bir eşyasını gömmüş.

#### w3-05 · Son Nöbet — tema: tower-moon (yeniden) — mini-boss: Son Nöbetçi
- **Hikâye rolü:** Dördüncü nöbetçi, Aldemir'den bir söz ister: Veyis'i affetmeye çalışmak.
- **Oynanış rolü:** Sınav (mini-boss, Elit Şövalye IV). Hedef: Son Nöbetçi'yi yen! `[KOD]`
- **Yeni öğe:** Elit Şövalye IV (en dayanıklı). "Son nöbetçi en sabırlısıdır; kaç, vur, nefes al."
- **Giriş**
```
anlatı: Son Nöbetçi kule tepesinde kıpırtısız; kılıcı kralın yemini kadar ağır.
taskin: Komutan. Son.
```
- **Çıkış**
```
nobetci: Kralı affetmeye çalışın. O kötü değil; o bir baba.
aldemir: Çalışacağım.
```
- **Kanca:** Kulenin kapısı açıldı; kale bir dilek gibi uzaktan parlıyordu.
- **Kırıntı 23:** Dört Nöbetçi'nin ortak yemini: "Taht düşse de Kalp düşmesin. Kral düşse de baba düşmesin."
- **Mini-boss repliği:** taunt "Kralıma ulaşmak için önce bu nöbeti geç." · yenilgi "Kralım… kızın geliyor. Yol sizin."

#### w3-06 · Pırıl'ın Yolu — tema: crystals-void (YENİ)
- **Hikâye rolü:** A8: Mira, babasına söylemediği sözü hatırlar.
- **Oynanış rolü:** Nefes (eskort). Hedef: Pırıl'ı yol boyunca koru. `[KOD]`
- **Yeni öğe:** Eskort. "Pırıl yolu gösterir; sen onu düşmanlardan koru."
- **Giriş**
```
piril: Babama giden yolu ben gösteririm.
aldemir: Buradayım.
```
- **Çıkış**
```
piril: Hatırladım. Gideceğimi babama söylemeye kıyamadım.
aldemir: Şimdi söyleyeceksin; ben yanında olacağım.
```
- **Kanca:** Kristal Kapısı'nın ardında bir baba, kızının ayak seslerini bekliyordu.
- **Kırıntı 24:** Mira'nın hatırası: "Kule büyücüsü bana her bayram ışıktan kuş yapardı. O gece gelmedi. Kızmadım; uyumuştur dedim."
- **Eskort ertelenirse (yedek):** hedef metni "Pırıl yolu açarken 50 kristal topla." (sayı tasarımcıya bağlı); giriş/çıkış metinleri değişmeden geçerlidir.

#### w3-07 · Kristal Kapısı — tema: crystals-void (yeniden)
- **Hikâye rolü:** Kapı bir şarkıyla açılır; Pırıl şarkının sonunu söyler.
- **Oynanış rolü:** Tırman. Hedef: 50 mana kristali topla.
- **Yeni öğe:** Tüm düşman karması. "Karanlığın bütün yüzleri bu kapının önünde; öğrendiklerini kullan."
- **Giriş**
```
anlatı: Kale kapısı kristalle mühürlü; elli kristal topla.
aldemir: Yorgunum ama uykum yok.
```
- **Çıkış**
```
piril: Şarkının sonunu ben biliyorum.
anlatı: Kapı çiçek gibi açıldı; Zerrin'in tüyü asada bir an parladı.
aldemir: Duyuyorum seni, Zerrin.
```
- **Kanca:** Koridorun sonunda tek bir kandil yanıyor, ağlama sesi sürüyordu.
- **Kırıntı 25:** Kapı kitabesi: "Bu kapı yalnız bir şarkıyla açılır. Şarkıyı baba başlatır, kız bitirir."

#### w3-08 · Son Savunma — tema: castle-ruin (yeniden)
- **Hikâye rolü:** Final öncesi son sınav; Taşkın finalden önce kapıda nöbet tutmayı seçer.
- **Oynanış rolü:** Sınav. Hedef: 6 dalgayı püskürt. `[KOD]`
- **Yeni öğe:** 6 dalga. "Altı dalga var; ritmi koru, yeteneklerini sakla."
- **Giriş**
```
aldemir: Altı dalga. Sonra o.
taskin: Yan yana.
```
- **Çıkış**
```
taskin: Gidin. Kapıyı ben tutarım.
aldemir: Bekle bizi.
```
- **Kanca:** Tahtın başında bir gölge ayağa kalktı.
- **Kırıntı 26:** Tahtın arkasındaki yazıt: "Gece Kalbi'ni bağlayan kral, kendini kalbe bağlamıştı."

#### w3-09 · Gölge Kalesi — tema: castle — FİNAL (Gölge Kral)
- **Hikâye rolü:** A9: söz söylenir, baba bırakır, şafak doğar.
- **Oynanış rolü:** Final (boss, 3 faz). Hedef: Gölge Kral'ı yen! (mevcut metin).
- **Yeni öğe:** Gölge Kral 3 faz (mevcut). Faz toast'ları mevcut config'te kalır (`toasts.bossPhase2/3`); aşağıdaki repliklar EK tauntlardır.
- **Giriş [KORUNDU; Zerrin satırı "yankı" olarak sahnelenir: Zerrin susmuştur, tüyü parlar]**
```
veyis: Kızımı geri verin. Şafak gelirse onu bir daha göremem.
zerrin: Aldemir, ona acıma ama unutma da.
```
- **Çıkış (final ekranı) [DEĞİŞTİ: canon anlatı korundu, öncesine iki replik eklendi. Bu bölüm kuralın tek istisnasıdır: ~8 cümle, final sahnesidir]**
```
aldemir: Seni anlıyorum, Veyis. Şimdi bırak.
veyis: Git, Mira. Baban seni artık tutmuyor.
anlatı: Gölge dağıldı. Pırıl babasının elini tuttu ve ilk şafak sökerken ikisi de ışığa karıştı. Vadi uyandı. Aldemir ilk kez rahat uyudu.
```
- **Kanca:** Şafak geldi… ama rüyanın kenarında ince bir yarık parladı.
- **Kırıntı 27:** Son hatıra: bir sabah, bir baba ve kızı ilk kez şafağı izliyor. "Bugün güzel bir gün olacak, Pırıl."
- **Boss taunt'ları `[KOD]` (yeni `toasts.bossTaunt1..3`, <= 120 karakter; faz geçişlerinde, mevcut faz toast'ının altında):**
  - Faz 1 (Karanlık Taht): "Geri dönün. Gece, kızımın tek güvenli yeri."
  - Faz 2 (Gölge Dalgası): "Her şafak onu benden alıyor. Anlamıyor musunuz?"
  - Faz 3 (Kızın Işığı): "Hayır… gitme. Bir gece daha, yalnız bir gece."
- **Boss yenilgi repliği (boss ölümünde, çıkışın hemen öncesi):** "Kızım… ışığın hep benimleymiş."

### 3.1 Mini-boss ve boss özeti

| Bölüm | Ad | Model / config | Taunt (savaş başı) | Yenilgi repliği |
|---|---|---|---|---|
| w1-09 | Baş Nöbetçi | `knight` (mevcut) | Kapı kapalı. Kral rahatsız edilmesin. | Kralım… affet. Nöbetten çıkıyorum. |
| w2-05 | Ay Nöbetçisi | `knight_ii` (hp 36, tasarım belgesi §3.1) | Ay doğdu, nöbet sürüyor. Geri dönün. | Yemin… Kalbe… Gidebilirsiniz. |
| w2-09 | Harap Nöbetçi | `knight_iii` (hp 48) | Kral emretti: kimse geçmesin. | Kapı sizin. Yeter ki Kral'ı… affedin. |
| w3-05 | Son Nöbetçi | `knight_iv` (hp 60) | Kralıma ulaşmak için önce bu nöbeti geç. | Kralım… kızın geliyor. Yol sizin. |
| w3-09 | Gölge Kral | `boss` (mevcut) | bölüm 3, w3-09 | Kızım… ışığın hep benimleymiş. |

`[KOD]` Taunt ve yenilgi repliklerinin gösterimi bugün mümkün DEĞİLDİR: mini-boss/boss için savaş başı/sonu replik alanı yoktur. Geçici çözüm: taunt'ı `intro`nun son satırı, yenilgi repliğini `outro`nun ilk satırı yap. (Yukarıdaki outro'lar bunu zaten yapar: w2-05, w2-09, w3-05 çıkışlarının ilk satırı Nöbetçi'nin yenilgi sözüdür.) Konuşmacı `nobetci` için yeni karakter girdisi gerekir (bölüm 5.3).

### 3.2 Mevcut 9 bölümün yeni yerleşime uyarlanması (neyi neden değiştirdim)

| Eski id → yeni | Eski metin | Yeni durum | Değişiklik gerekçesi |
|---|---|---|---|
| forest → w1-01 | giriş: Zerrin; çıkış: Zerrin + ışık | Aynen korundu; giriş +Aldemir, çıkış +"Merhaba, Aldemir!" | Uyanışı ve Pırıl'ın sesini kurar |
| cave → w1-02 | çıkış: "Üçlü büyü bunu halleder" | Üçlü kaldırıldı, Pırıl'ın "elimi tutardı" cümlesi eklendi | Üçlü artık w1-03 ödülü (tasarım §4.4) |
| golems → w1-03 | çıkış: "Yıldırım çarptığında…" | Yıldırım cümlesi kaldırıldı | Yıldırım artık w1-05 ödülü |
| graveyard → w1-05 | `ability: shield` (ödül) | Kalkan artık w1-04'te; w1-05 ödülü Yıldırım. Metin korundu | Ödül takvimi (tasarım §4.4) |
| pass → w1-07 | "sadece ayakta kal" | "zaman daralıyor"; ödül Işınlan artık w1-06'da | Hedef "zamanlı kristal"e döndü, hayatta kal w1-04'e taşındı |
| village → w1-08 | giriş + sürpriz | Aynen korundu; sürpriz Perde I'in kısmi açığa çıkmasıdır | "Zehir" ödülü zaten bu bölümde |
| crystals → w2-02 | "Kalbin son kırığı kalede…" | Aynen korundu; Meteor artık w2-03 ödülü | "Kale" cümlesi hâlâ doğru (kale Perde III'te); Veyis'in adı burada geçer |
| tower → w1-09 | "Kale kapısı açıldı…" | "Uzaktaki kaleden bir ses süzüldü" | Kale artık Perde III'te; "Kale kapısı açıldı" yeni yerleşimle çelişirdi |
| castle → w3-09 | Veyis + Zerrin giriş, tek satır çıkış | Giriş aynen (Zerrin "yankı"); çıkış 3 satıra bölündü | Zerrin Perde II sonunda susmuştur; Aldemir'in affı ve Veyis'in "bırakıyorum"u eklendi |

---
## 4. Perde sonları ve final

### 4.1 Perde I sonu (w1-09 Kemik Kule): "Kızım… neredesin?"

- **Sahneleme (mevcut araçlarla):** Şövalye ölünce çıkış kartı açılır. Konuşmacı `veyis` (portre var: `assets/art/portre-veyis.webp`) tek satır söyler. Pırıl'ın ışığının titremesi `[KOD, isteğe bağlı]`: yoksa metinle anlatılır ("Pırıl'ın ışığı ilk kez titredi", kanca satırı).
- **Duygu:** Şaşkınlık ve acı. Oyuncu "bu ses Kral'ın sesi, o halde Pırıl'ın babası Kral" sonucuna kendisi varır; metin söylemez.
- **Perde çıkış kartı:** bölüm 6.1.

### 4.2 Perde II sonu (w2-09 Harap Kale): Zerrin susar

- **Sahneleme:** Mini-boss ölünce çıkışta Zerrin'in iki satırı (itiraf + Aldemir'in cevabı). Zerrin figürü (arena dışında sol-arka kenar, `propsvis.js`) sonraki bölümlerde de orada kalır; dalına sabit, **sessiz**. `[KOD/model, küçük]` Zerrin'in "uyuyan" görünmesi için en ucuz yol `setTint` ile hafif soluk mavi ton ve idle'ın yavaşlatılmasıdır (modelin `setTint` arayüzü var; "kapalı göz" pozu YOKTUR, yeni model/poz gerekir). Hiçbiri yapılmazsa figür aynen kalır ve metin ("gözlerini kapadı") yeterli olur.
- **Duygu:** Kayıp ama bir bağışlama. Aldemir öfkelenmez; "Suçlu kim, artık önemli değil. Düzeltecek kim, o önemli" cümlesi Aldemir'in sorumluluk yayını kapatır.
- **Perde çıkış kartı:** bölüm 6.1.

### 4.3 Perde III finali: Gölge Kral ile duygusal doruk (w3-09)

Dövüşün üç fazı duygu üç aşamasıdır; mekanik değişmez, yalnız anlatı katmanı eklenir:

| Faz (mevcut) | Mekanik (mevcut) | Duygu | Anlatı katmanı |
|---|---|---|---|
| 1 · Karanlık Taht | 6 sn'de 2 Ruh | Direnç, yas | Taunt: "Geri dönün. Gece, kızımın tek güvenli yeri." |
| 2 · Gölge Dalgası (%66) | Okçu + Yarasa, kırmızı halkalar | Öfke yerine çaresizlik | Taunt: "Her şafak onu benden alıyor. Anlamıyor musunuz?" |
| 3 · Kızın Işığı (%33) | Kalkan, 3 ışık kristali, savunmasız 6 sn | Bırakmayı öğrenmek | Taunt: "Hayır… gitme. Bir gece daha, yalnız bir gece." |

Faz 3 yorumu (config'teki mevcut mekanikle birebir uyumlu): "Kalkan", Veyis'in kızına sarılışıdır; "3 ışık kristali", Mira'nın üç hatırasıdır (ninni, çiçek, ışıktan kuş). Kristali toplayan oyuncu o hatırayı Veyis'e "geri verir" ve kalkan kırılır. Bu yorum oyuna ek mekanik yüklemez; yalnız faz 3 toast metni isteğe bağlı güncellenebilir (`toasts.bossPhase3`, mevcut: "Faz 3 · Kızın Işığı — Pırıl'ın 3 ışık kristalini topla; kalkan kırılınca vur! (+10 sn)", korunması önerilir).

**Son vuruş:** Boss ölünce `veyis-insan` figürü (mevcut, yalnız gerçek finalde) Aldemir'in 3,4 birim karşısında belirir. Çıkış satırları (bölüm 3, w3-09) bu figürün konuşmasıdır. **Sinematik dil:** vuruş yok, söz var. Aldemir, Veyis'i "yendi" ama son söz bir veda.

### 4.4 İki son seçeneği: MVP dışı; tek son + sonraki sürüm notu

- **MVP (bu belge):** Tek son: Veyis bırakır, Mira ışığa gider, şafak doğar. (Kanon.)
- **Sonraki sürüm notu `[KOD]`:** Faz 3 kalkan kırılışında iki seçenek: **"Elini uzat"** (kanonik son, yukarıdaki) ve **"Vur"** (acı son: Veyis dağılır, Mira'nın ışığı babasız yola çıkar, Aldemir uyuyamaz ve final ekranında "Şafak doğdu ama kimse kutlamadı" yazar; Gece Yarığı doğrudan açılır). Bu seçim ek ekran, ek kayıt alanı ve ek final metni ister; kapsam dışıdır. "Vur" sonu kanona UYMAZ ("Aldemir ilk kez rahat uyudu"); eklenecekse alternatif son olarak adlandırılmalıdır.

### 4.5 Final ekranı ve kapanış metni

Mevcut `finalScreen({ outro, score, … })` outro'yu (w3-09 çıkışı), `finalLine`'ı ve puanı gösterir.

| Alan | Metin | Durum |
|---|---|---|
| `finalTitle` | Şafak doğdu! | [KORUNDU] |
| `finalLine` | Gölge Kral yenildi. Lanet kalktı. | [KORUNDU] |
| Kapanış kartı `[KOD]` (yeni `strings.closing`, <= 240) | Veyis kızını ilk kez bıraktı. Mira babasının elini ilk kez bıraktı. Vadi, ikisinin bırakışıyla uyandı. | yeni |
| Epilog `[KOD]` (yeni `strings.epilogue`, 3 satır) | `taskin: Şafak.` · `zerrin: Ben bir şey kaçırdım mı?` · `anlatı: Çatlağı kapatan ışığın bir parçası Aldemir'indi. Bunu hiçbir zaman söylemedi.` | yeni |
| Gece Yarığı kancası `[KOD]` (yeni `strings.rift`) | Başlık: **Gece Yarığı** · Metin: "Aldemir ilk kez rahat uyudu. Ama rüyasının kenarında ince bir yarık parlıyordu." · Düğme: "Yarığa gir" | yeni |

Notlar:
- **Aldemir'in fedakârlığı** (kendi ışığından bir parçayı çatlağa bırakması) kasıtlı olarak SESSİZ yazıldı: epilog satırı yalnızca bir izdir. Hiçbir oyun içi nesne/mekanik eklemez.
- **Zerrin'in uyanışı** Emre'ye açık soru (bölüm 8.4, madde 2): isterse epilog Zerrin'siz kalır ve Zerrin'in dalında tek bir tüy ışıldamaya devam eder.
- **Yeni oyun+:** Oyunda bugün YOKTUR (`newGame()` her şeyi sıfırlar). Anlatı karşılığı: Kırıntı Defteri'ni yeniden okumak ve Gece Yarığı. "Yeniden oyna" düğmesinin metni: "Baştan yürü".

---

## 5. Karakter bibliyografisi (kısa)

### 5.1 Ana kadro

| Karakter | Ses / üslup | Motivasyon | Yay | Örnek 3 replik |
|---|---|---|---|---|
| **Aldemir** (oyuncu) | Sade, kısa, vicdanlı. Süslü söz kurmaz; soru sorar. Perde III'te Zerrin'in nüktesini kullanmayı dener. | O gece yokluğunun bedelini ödemek; sonra "bedeli ödemek" yerine "işi bitirmek". | Suçluluk → sorumluluk → fedakârlık/affetme. Mantra: Uyanığım → Buradayım → Bırakıyorum. | "O gece uyuyakaldım; bu gece uyanığım." · "Artık 'benim suçum' demeyeceğim. 'Benim işim' diyeceğim." · "Seni anlıyorum, Veyis. Şimdi bırak." |
| **Zerrin** | Bilge, nüktedan, hafif alaycı; ciddi anda cümleyi kısaltır. Humor onun zırhıdır. | Kalbin kırıntılarını saklamak ve Aldemir'i (ve Mira'yı) korumak. | Nükte → suskunluk. w2-04 ile zayıflar, w2-09 itiraf ve fedakârlık, Perde III'te "yankı", epilogda uyanış (onaya bağlı). | "Tüylerim dökülüyor, sabrım hâlâ yerinde." · "Kalk. Bir yanlış daha yap, ama başka bir yanlış." · "O gece seni ben uyuttum, Aldemir." |
| **Pırıl / Mira** | Çocuksu, meraklı, içten; kısa heceli ünlemler. Hatırladıkça cümleleri uzar ve olgunlaşır. | Kim olduğunu ve neden burada olduğunu öğrenmek; sonra babasına gerçeği söylemek. | Meraklı ışık → Mira (ad) → "gideceğimi söylemeye kıyamadım" → veda. | "Vızıltıyı duyuyor musun? Mağara canlı." · "Üşümüyorum. Ama sen titriyorsun, Aldemir." · "Babam şafaktan korkmuyor. Şafakta beni kaybedeceğinden korkuyor." |
| **Taşkın** | Tek tük kelime. Anlam sessizliğinde. Hiç soru sormaz. | Nöbet yemini; eski komutanlarını huzura erdirmek. | Katılım (w1-03) → komutanla yüzleşme → yemin tamam (w3-03) → kapıda nöbet (w3-08). | "Nöbet." · "Yemin tutuldu." · "Gidin. Kapıyı ben tutarım." |
| **Veyis / Gölge Kral** | Yaslı baba. Düşünceyi tamamlayamaz; cümleler "kızım" ile ya da bir sessizlikle biter. Öfke yok. | Kızını kaybetmemek; şafak = veda. | Çaresiz baba → bırakan baba. | "Kızımı geri verin. Şafak gelirse onu bir daha göremem." · "Bir gece daha… yalnız bir gece daha." · "Git, Mira. Baban seni artık tutmuyor." |

### 5.2 Önerilen config `bio` güncellemeleri (`characters.*.bio`, <= 300; spoiler içermez)

Mevcut biyografiler spoiler içermiyor ve yeni kurguya UYUYOR; ZORUNLU değişiklik yok. İsteğe bağlı, tonu derinleştiren sürümler (Veyis hariç, dokunulmaması önerilir; çünkü bio bugün zaten "kızını geri isteyen Gölge Kral" diyor):
- aldemir: "O gece uyuyakalan büyücü. Yüzleşmek, kaçmaktan daha zor; yine de ilk adımı o atar." 
- zerrin: "Kulenin yaşlı baş büyücüsü; baykuşa dönüşmüş mentor. Nükteyle yazdığı her şeyin altında bir sır saklar."
- piril: "Gün ışığına varamayan küçük bir ışık; Aldemir'in yoldaşı. Hatırladıkça biraz daha parlar."
- taskin: "Lanetten kurtulan tek Taş Bekçi. Çok az konuşur; sözünü ise asla geri almaz."

### 5.3 Yeni yan karakterler

| Karakter | Neden | Sahneleme | Yeni model? | Öncelik |
|---|---|---|---|---|
| **Dört Nöbetçi** ("Baş Nöbetçi", "Ay Nöbetçisi", "Harap Nöbetçi", "Son Nöbetçi") | Mini-boss'lara kişilik ve Taşkın'a yüzleşme kazandırır; her biri Veyis'in yası ile Kalbe verdikleri yemin arasında kalmıştır | Mevcut `knight` modeli + `knight_ii..iv` (tasarım belgesi §3.1, config'te yeni `enemies` girdileri: yalnız hp/hız/ad). Renk ayırımı için `enemies.<id>.color`; modelin renge duyarlılığı TEST EDİLMELİ | HAYIR | P1 |
| Nöbetçi konuşmacı girdisi (`characters.nobetci`) | Yenilgi sözlerinin konuşmacısı olması için | `role: "npc"`, `icon: "🛡️"`, `color: "#cfd0dc"`, `bio: "Kralın dört baş nöbetçisinden biri. Yemini Kalbe'ydi; kapıyı kapatan emri ise krala bağlıydı."`; `portrait` isteğe bağlı: yoksa simge görünür (portre üretimi fal.ai ile yapılacaksa Emre onayı gerekir) | HAYIR | P1 |
| **Mira (insan hali)** | Final duygusunu güçlendirebilir | Yeni 3B model gerekir (Veyis-insan'a benzer, çocuk) | **EVET** | P3, ÖNERİLMEZ: Pırıl ışığı + Veyis-insan figürü yeter; Mira'yı hiç göstermemek hatırayı daha güçlü tutar |

---

## 6. Arayüz metinleri paketi

Tüm metinler kopyala-yapıştır içindir. `[KOD]` = bugün alanı/ekranı yok.

### 6.1 Perde adları, giriş ve çıkış kartları `[KOD]` (yeni `worlds` yapısı, tasarım belgesi §7.1)

| Perde | Ad | Alt başlık | Giriş kartı (<= 2 cümle) | Çıkış kartı (<= 2 cümle) | Kanca |
|---|---|---|---|---|---|
| I | Uyanış | Bir gece uyudum. | Aldemir uyandı. Vadi, onu bekleyen bir gecenin içinde. | Kule arkada kaldı. Uzaktan bir ses geliyor ve Pırıl onu tanıyor. | "Kızım… neredesin?" |
| II | Kırık Yol | Her adımda bir şey eksilir. | Gece Kalbi'nin kırıkları hatıra taşıyor. Aldemir artık yalnız karanlıkla değil, gerçekle de savaşıyor. | Zerrin sustu; Pırıl adını hatırladı. Kalenin kapısı açık. | "Babama gideceğim, Aldemir." |
| III | Gece Kalbi | Şafak, bir şeyi bırakmadan gelmez. | Son yol kalbin çatlağından geçiyor. Aldemir bu kez yalnız değil: yanında bir ışık, bir bekçi ve bir hatıra var. | (Final ekranı: bölüm 4.5) | Şafak geldi… ama rüyanın kenarında ince bir yarık parladı. |

### 6.2 DDA yardım bilgi satırları `[KOD]` (yeni `difficulty.dda.notice`, 3 kademe; tasarım belgesi §3.6)

Ton: şeffaf, utandırmayan; yardımın ne yaptığını söyler; kapatma yolunu gösterir.

| Kademe (ard arda ölüm) | Ne değişir (tasarım belgesi) | Bilgi satırı (<= 120) |
|---|---|---|
| 2 | Düşman akışı -%10, başlangıç düşmanı -%15, kalp +%25 | Pırıl bu sefer seni kolluyor: düşmanlar biraz seyrek, kalpler biraz sık. |
| 3 | -%20 akış, -%25 başlangıç, kalp +%50, +1 can | Pırıl ışığını artırdı: bu denemede +1 can ve daha az düşman var. |
| 4+ | -%30 akış, -%35 başlangıç, kalp x2, +1 can, hazır kalkan, süre +%20 | Pırıl kalkanını açtı: +1 can, hazır kalkan ve biraz daha süre. Yardımı duraklatma ekranından kapatabilirsin. |

Not: "Yardımı kapat" anahtarı tasarım belgesinde ÖNERİ'dir (Açık soru 9); yoksa son cümle çıkarılmalıdır.

### 6.3 Yıldız rozet adları `[KOD]` (tasarım belgesi §3.7)

| Yıldız | Ölçüt (tasarım belgesi) | Rozet adı | Açıklama (<= 60) |
|---|---|---|---|
| ★1 | Bölümü bitir | **Yolcu** | Bölümü tamamladın. |
| ★2 | En çok 2 vuruş (boss/mini-boss: 3) | **Sakınan** | En çok iki vuruş yiyerek bitirdin. |
| ★3 | Hasarsız | **Dokunulmaz** | Hiç hasar almadan bitirdin. |
| (ek) Zamanlı kristal koşusunda hız rozeti | tasarım belgesi §3.7: ★'dan bağımsız | **Rüzgâr Adımı** | Süre dolmadan, rekor hızda topladın. (w1-07, w2-08) |

### 6.4 Hedef türü etiketleri ve metinleri

`strings.objective` kalıpları (mevcut): crystal "{goal} mana kristali topla." · survive "{goal} saniye hayatta kal." · totem "{goal} Lanet Totemi'ni yık." · miniboss "Kemik Şövalye'yi yen!" · boss "Gölge Kral'ı yen!".

| Tür | Etiket (kısa ad) | Hedef metni kalıbı (<= 60) | HUD kalıbı | Durum |
|---|---|---|---|---|
| Kristal | Kristal Toplama | {goal} mana kristali topla. | Mana: {n}/{goal} | mevcut |
| Zamanlı kristal | Kristal Koşusu | Süre dolmadan {goal} kristal topla. | Mana: {n}/{goal} (süre vurgulu) | `[KOD]` yeni `objective.timed` |
| Hayatta kal | Hayatta Kal | {goal} saniye hayatta kal. | Hedef: Hayatta kal | mevcut |
| Totem | Totem Avı | {goal} Lanet Totemi'ni yık. | Totem: {n}/{goal} | mevcut |
| Dalga savunması | Dalgaları Püskürt | {goal} dalgayı püskürt. | Dalga: {n}/{goal} | `[KOD]` `objective.waves` |
| Bölge tut | Halkayı Koru | Kutsal Halka'yı {goal} saniye koru. | Halka: {n}/{goal} sn | `[KOD]` `objective.hold` |
| Eskort | Pırıl'ı Koru | Pırıl'ı yol boyunca koru. | Pırıl: yola devam | `[KOD]` `objective.escort` |
| Mini-boss | (per-level) | "{boss adı} yen!" (örn. Baş Nöbetçi'yi yen!) | Hedef: {boss adı} | `[KOD]` bölüme özel `objectiveText` (bugün tek sabit metin) |
| Boss | Boss | Gölge Kral'ı yen! | Hedef: Gölge Kral · Faz {phase} | mevcut |
| Hasarsız | (rozet, hedef türü değil) | — | — | `[KOD]` küçük sayaç (tasarım belgesi §5.2) |

### 6.5 "Bölüm tamam" ve "Yetenek seç" varyasyonları `[KOD]` (rastgele ya da bölüm numarasına göre)

`strings.clear.title` bugün tek metin. Varyasyonlar (<= 60, {n} yer tutucusu):
1. Bölüm {n} tamam!
2. Bölüm {n} geride kaldı!
3. Gece bir adım geri çekildi · Bölüm {n}
4. Bölüm {n} aydınlandı!
5. Yol açıldı · Bölüm {n}
6. Bölüm {n} tamam, Aldemir!
7. Pırıl parlıyor · Bölüm {n} tamam
8. Bir kırıntı daha toplandı · Bölüm {n}

`strings.clear.pickPerk` bugün tek metin ("Bir yetenek seç:"). Varyasyonlar (<= 60):
1. Bir yetenek seç:
2. Hangi ışığı yanına alırsın?
3. Gece sana bir armağan bıraktı. Seç:
4. Birini seç; yol uzun.
5. Pırıl bir şey önerdi. Sen seç:
6. Gücünü seç, Aldemir:

### 6.6 Yenilgi ekranı başlık / alt satır çiftleri `[KOD]` (yeni `gameOver.titles[]`; 14 çift)

Bugün yenilgi ekranı `deathLines` (diyalog satırı), `gameOver.stats`, `retry`, `retryNote` ve `restart` gösterir; ayrı bir başlık/alt satır yoktur. Çiftler, `deathLines` ile birlikte ya da onun yerine rotasyonda kullanılabilir (başlık <= 40, alt satır <= 80).

| # | Başlık | Alt satır |
|---|---|---|
| 1 | Gece bu turu aldı. | Ama bu bölümü artık tanıyorsun. |
| 2 | Işık bir an söndü. | Pırıl hâlâ seni bekliyor. |
| 3 | Düştün, Aldemir. | Düşmek de yolun parçası. Kalk. |
| 4 | Bir deneme daha. | Her tur bir ipucu bırakır. |
| 5 | Karanlık biraz öne geçti. | Ritmi öğrendin; şimdi tersine çevir. |
| 6 | Henüz bitmedi. | Nerede sıkıştığını artık biliyorsun. |
| 7 | Kristaller seni bekliyor. | Bu sefer daha hafif adımlarla. |
| 8 | Taşkın başını salladı. | "Tekrar." dedi. Haklı. |
| 9 | Gece uzun, sen inatçısın. | Bir deneme daha. |
| 10 | Zerrin olsa ne derdi? | "Düşmeden yürüyen, yürümeyi bilmez." |
| 11 | Kalkan kırıldı, sen değil. | Hâlâ buradasın; yeniden dene. |
| 12 | Mana tükenmedi, umut da. | Derin bir nefes al ve dön. |
| 13 | Hatıralar seni çağırıyor. | Bir kırıntı daha toplamak için geri dön. |
| 14 | Pırıl kıpırdadı. | Bir şans daha ister misin? O ister. |

(Satır 10 ve 8 Zerrin/Taşkın sesindedir; Zerrin Perde III'te susar: satır 10 orada "yankı" olarak okunur, bu bir kabuldür; istenirse Perde III'te satır 10 çıkarılır.)

### 6.7 Harita ipuçları `[KOD]` (harita ekranı alt satırı, <= 100)

1. Düğümün altındaki yıldızlar, bölümü kaç vuruşla bitirdiğini gösterir. (yıldız sistemi gelirse)
2. Yeni bir perde, yeni bir duygu getirir. Hazır ol.
3. Zor bir bölümde takılırsan Pırıl yardım eder; yardımı duraklatma ekranından görebilirsin. (DDA gelirse)
4. Eksik yıldızlar sana başka bir sefer için neden verir.
5. Kırıntı Defteri hikâyenin saklı yarısını anlatır. (Defter gelirse)
6. Her perdenin altıncı bölümü sakindir. Soluklan.
7. Mini-boss bölümlerinde ilerlemeden önce canını tazele.
8. Haritadaki noktalı yol, kaleye giden çizgidir.

Not: ipuçları 1, 3, 5 ilgili sistem eklenmeden gösterilmemeli. 2, 4 ve 6-8 bugün de doğrudur ya da zararsızdır (6: tasarım belgesi §4.6; 7: bölüm sonu +1 can için "tazele" ifadesi yerine "can" demek de yeter).

### 6.8 Menü sloganı varyasyonları (`strings.tagline`, {levelCount} yer tutucusu zorunlu; <= 400)

1. {levelCount} lanetli bölümden geç. Mana kristallerini topla, totemleri yık, düşmanları büyüyle durdur; yeni büyüler ve yetenekler kazan. **(mevcut)**
2. {levelCount} bölüm, bir ışık ve şafağı geri getirmesi gereken bir büyücü. Gece uzun; sen inatçısın.
3. Kristalleri topla, büyüyü yağdır, Gece Kalbi'ni onar: {levelCount} bölümlük bir gece seni bekliyor.
4. Bir büyücü uyuyakaldı, bir vadi uyanamadı. {levelCount} bölümde şafağı geri getir.

### 6.9 Karşılama / yükleme ipuçları (14, mekanik öğreten, hikâyeye bağlı)

Her ipucu ilgili kaynakta doğrulanmıştır (tasarım belgesi §1.1-1.3 ve §1.2). "Nerede" = ilk gösterileceği yer.

| # | İpucu (<= 100) | Nerede | Doğrulandığı yer |
|---|---|---|---|
| 1 | Hasar aldıktan sonra bir buçuk saniye dokunulmazsın; o süreyi kaçmak için kullan. | w1-01 | `combat.js:84` |
| 2 | Bölüm sonunda canın bir yenilenir. Zorlanıyorsan sonuna kadar dayan. | w1-01 | `game.clearHeal` |
| 3 | Buz Oku düşmanı üç saniye yavaşlatır; Yarasaya iyi gelir. | w1-02 | `ai.js:112` |
| 4 | Kristal toplayarak ara sıra kalp kazanırsın; hayatta kalma bölümlerinde de. | w1-04 | `loop.js:201` (%35) |
| 5 | Yıldırım kendi hedefini bulur; sen yalnız kaçmaya bak. | w1-05 | config `lightning` |
| 6 | Kemik Okçu atıştan yarım saniye önce parlar; o an yönünü değiştir. | w1-05 | `ai.js` |
| 7 | Totem on iki saniyede bir Ruh doğurur; ne kadar erken yıkarsan o kadar rahat edersin. | w1-06 | `ai.js:174` |
| 8 | Işınlan seni beş adım ileri atar ve anlık dokunulmaz yapar. | w1-07 | config `abilities.blink` |
| 9 | Kurt çömelince hücuma geçer; yana sıçra, yorulunca vur. | w1-07 | `ai.js` |
| 10 | Kor Hortlak yaklaşınca kızarır ve patlar; yanındaki düşmanlara da zarar verir. | w1-08 | `ai.js` |
| 11 | Şövalye yere vurmadan önce bir saniye bekler; o anda dört adım geri çekil. | w1-09 | config `knight` |
| 12 | Rahibin kalkanı tek vuruş emer; Zehir Bulutu kalkanı geçer. | w2-02 | `ai.js` + config |
| 13 | Meteor hemen düşmez; kısa bir gecikmesi var, hedefi biraz önceden seç. | w2-03 | config `meteor` |
| 14 | Zaman Çatlağı düşmanları üç saniye yavaşlatır; sen normal hızda kalırsın. | w2-08 | config `timeslow` |
| 15 | Mobilde alttaki çubuğu kaydırarak büyü değiştir. | ilk mobil açılış | `strings.mobileHelp` |

(15. madde 14 sınırının üstündedir; gerekirse çıkarılır. Mekanik rakamları tasarım belgesindeki doğrulanmış değerlerdir; değişirse metin güncellenmelidir.)

---

## 7. Config'e aktarım planı

### 7.1 Bugünkü şemaya OLDUĞU GİBİ girer (geliştirici yalnız yapıştırır)

| Alan | Kapsam | Sınır / uyum |
|---|---|---|
| `levels.<id>.name` | 27 bölüm adı (bölüm 3.0) | <= 40; en uzunu "Yalancı Şafak Mezarlığı" (25) |
| `levels.<id>.intro` / `.outro` | 27 x 2 diyalog (bölüm 3) | 1-4 satır, her satır <= 240; en uzun tek satır w3-09 anlatı (~140 karakter) |
| `levels.<id>.reward` / `.ability` | Tasarım belgesi §4.4 | Değişmedi |
| `strings.deathLines` | İlk 12 satır (bölüm 2.6) | En çok 12 |
| `strings.finalTitle`, `finalLine`, `replay` | Korunur; `replay` = "Baştan yürü" | uyumlu |
| `strings.tagline` | Slogan 2/3/4'ten biri | <= 400, {levelCount} var |
| `characters.<id>.bio` | İsteğe bağlı (bölüm 5.2) | <= 300 |
| `characters.nobetci` | Yeni girdi (bölüm 5.3) | `name` <= 24, `icon` <= 4, `role` ROLES içinde ("npc"); `portrait` şemada isteğe bağlıdır, doğrulanmalı |
| `enemies.knight_ii/iii/iv` | Ad ("Ay Nöbetçisi", "Harap Nöbetçi", "Son Nöbetçi") | `name` <= 24 (en uzunu "Harap Nöbetçi", 13); diğer sayılar tasarımcıya aittir |
| `themes.<12 yeni>` | Bölüm 3.0.2 | `themes` en çok 24; toplam 21-22 |
| `campaign.order`, `campaign.edges`, `map` | 27 düğüm | `levels` en çok 30 |
| `strings.objective.miniboss` | Yeni bölümlerde GEÇERSİZ olur (tek sabit metin) | bkz. 7.2 |

### 7.2 Şemada OLMAYAN alanlar (geliştirici işi; yazım sınırı önerisi)

| Önerilen alan | Tür / sınır | Kaynak metin | İhtiyaç | Maliyet |
|---|---|---|---|---|
| `worlds.<w1..w3>.name` / `subtitle` / `intro` / `outro` / `hook` | str(<= 40 / 60 / 160 / 160 / 120) | bölüm 6.1 | Perde kartları | orta (harita/menü) |
| `levels.<id>.hook` | str(<= 120) | bölüm 3, "Kanca" | Bölüm sonu çengeli | küçük (outro altına tek satır) |
| `levels.<id>.shard` (+ isteğe bağlı `shardSpeaker`) | str(<= 200) | bölüm 3, "Kırıntı" | Kırıntı kartı / defteri | orta |
| `levels.<id>.objectiveText` | str(<= 60) | bölüm 3.0 | Mini-boss'a özel hedef metni | küçük |
| `enemies.<id>.lore` | str(<= 160) | bölüm 2.5 | Ansiklopedi | orta |
| `strings.objective.timed / waves / hold / escort` | str(<= 100) | bölüm 6.4 | Yeni hedef türleri (kodu ile birlikte) | tür başına orta |
| `strings.hud.goalWaves / goalHold / goalEscort` | str(<= 60) | bölüm 6.4 | Yeni hedef türleri HUD'u | küçük |
| `strings.clear.titles[]`, `strings.clear.pickPerks[]` | arr(str) | bölüm 6.5 | Varyasyon rotasyonu | küçük |
| `strings.gameOver.titles[]` (başlık + alt satır) | arr(obj) | bölüm 6.6 | Yenilgi ekranı | küçük |
| `difficulty.dda.notice[]` (3 kademe) | arr(str <= 120) | bölüm 6.2 | DDA şeffaflık satırı (DDA kodu ile) | küçük |
| `strings.badges.star1/2/3/speed` | str (ad <= 20, açıklama <= 60) | bölüm 6.3 | Yıldız sistemi ile birlikte | küçük |
| `strings.toasts.bossTaunt1..3` | str(<= 120) | bölüm 3, w3-09 | Boss tauntları | küçük |
| `strings.closing`, `strings.epilogue[]`, `strings.rift` | str / arr / obj | bölüm 4.5 | Final ekranı, Gece Yarığı kancası | orta |
| `strings.mapHints[]`, `strings.tips[]` | arr(str <= 100) | bölüm 6.7, 6.9 | Harita ve yükleme ipuçları | küçük |
| `strings.deathLines` sınırı | `arr(…, 1, 12)` → 1-24 | bölüm 2.6 | 12'den fazla replik ve perde süzgeci | küçük |
| Bölüme göre süzgeç (örn. `deathLines[].worlds`) | str[] | bölüm 2.6 | Zerrin satırları Perde III'te çıkarılsın | küçük |

### 7.3 Kimlik eşleme (eski → yeni)

Tasarım belgesi §4.1 ile birebir aynıdır; kayıt göçü için kopyalanmıştır (kayıt göç haritası geliştirme işidir).

| Eski id | Yeni id | Eski id | Yeni id |
|---|---|---|---|
| forest | w1-01 | village | w1-08 |
| cave | w1-02 | tower | w1-09 |
| golems | w1-03 | crystals | w2-02 |
| graveyard | w1-05 | castle | w3-09 |
| pass | w1-07 | | |

### 7.4 Metin uzunluk kontrolü

Bu belgedeki tüm diyalog satırları yazım sırasında 240 sınırının çok altında tutuldu. Belge teslim edilmeden önce otomatik kontrol yapıldı (bölüm 8.3). Telefon okunabilirliği için hedef: tek satır <= 110 karakter, bir kart toplam <= 2 satır görünür (ikinci satır kaydırma gerektirmesin).

---

## 8. Kalite kontrol ve riskler

### 8.1 Kanon tutarlılığı (kontrol listesi)

| Kanon maddesi | Durum |
|---|---|
| Gece Kalbi çatlak, şafak doğmuyor | Korundu. Çatlak bölüm 3'te kurgunun merkezidir. |
| Aldemir kulede uyuyakaldı | Korundu. Zerrin itirafı (w2-09) uykunun nedenini DERİNLEŞTİRİR; "uyuyakalma" olgusunu silmez (bölüm 8.4, madde 1). |
| Zerrin baykuşa dönüşmüş, kırıntıları saklıyor | Korundu; fedakârlık = son kırıntıyı vermek. |
| Pırıl = Kral'ın kızı Mira'nın ruhu | Korundu; açıklama aşamalı (bölüm 1.5). |
| Taşkın 3. bölümde katılır | Korundu (w1-03). |
| Veyis kızını geri istiyor, "şafak gelirse onu bir daha göremem" | Korundu; w3-09 girişi birebir. |
| Final: Pırıl babasının elini tutar, ışığa karışırlar, Aldemir rahat uyur | Korundu; w3-09 anlatısı birebir. |
| İki son MVP dışı | Korundu (bölüm 4.4). |
| Ölüm repliği 3 mevcut satır | Korundu (bölüm 2.6, 1-3). |
| Tasarım belgesi: bölüm kimlikleri, tema, hedef, rol, ödül | Hiçbiri değiştirilmedi. |

### 8.2 Spoiler sırası kontrolü (yazımda uygulandı; teslimden önce yeniden okunmalı)

- "Mira" adı w2-06'dan önce HİÇBİR metinde geçmiyor (kırıntılar dahil): w1-01..w2-05 metinleri "kız", "kral", "baba" der.
- "Veyis" adı w2-02'de ilk kez geçiyor; ondan önce metinler "kral" der (w1-09'da konuşmacı `veyis` portresi/adı etiketi görünür, çünkü `speaker` alanı karakter kimliğidir; bu, oyuncuya adın "Veyis" olduğunu w1-09'da ekranda gösterir). **Uyarı:** `speaker: veyis` etiketi ad gösteriyorsa Veyis'in adı w1-09'da zaten öğrenilir; sorun değil, çünkü bu aşamada bilgi "kral Veyis'tir" demektir. Ancak Pırıl'ın kızı olduğu hâlâ kesin değildir. Sakıncalıysa w1-09'daki satırın konuşmacısını boş bırakıp "(uzaktan bir ses)" anlatısına çevir.
- Zerrin'in itirafı (uykuyu o verdi) yalnız w2-09 çıkışında; w2-08 kancası (demlik) yalnız ipucu.
- w3-03'ten önce "şafak Mira'yı götürür" cümlesi geçmiyor.
- w3-06'dan önce "Mira gideceğini biliyordu" geçmiyor.
- "Pırıl" ile "Mira" aynı kişidir cümlesi hiçbir yerde düz metin olarak yazılmıyor; oyuncu replikten çıkarır.

### 8.3 Metin uzunluğu ve okunabilirlik

Teslimden önce Node ile otomatik kontrol yapıldı (bölüm bloklarındaki tüm diyalog satırları ayıklandı): **en uzun tek satır 130 karakter** (w3-09 final anlatısı, canon metin); 140 üzeri satır YOK; tüm satırlar şema sınırının (240) çok altında. Giriş/çıkış blokları <= 3 satırdır; tek istisna w3-09 çıkışıdır (final ekranı: 3 satır ama ~8 cümle). Cümle sayısı sezgisel sayıldı; canon korunan bazı çıkışlar tek kelimelik seslenmelerle 4 kısa cümle birimine çıkar (w1-01, w1-08, w2-02); bu, bölüm 3 okuma notundaki "tek kelimelik seslenmeler cümleden sayılmaz" kuralına dayanır. Telefonda 3 satırlık bir kart fazla yer kaplayabilir; kritik dokunuşlar ilk iki satırda tutuldu. `[KOD]` Okuma süresi VARSAYIMI: ortalama oyuncu kısa bir satırı ~3 saniyede okur; 3 satır = ~8 sn. Gerçek oyuncu testi yoktur. "Mira" adı w1-01..w2-05 metinlerinde otomatik taramayla 0 kez bulundu.

### 8.4 Emre'ye açık sorular

1. **Zerrin'in uyku büyüsü sırrı (w2-09):** "Seni o gece ben uyuttum" cümlesi Aldemir'in suçluluğunu hafifletir ve Zerrin'e fedakârlık dayanağı verir. Ama canondaki "Aldemir uyuyakaldı" ifadesini yeniden yorumlar. Onaylar mısın? Reddedilirse w2-09 çıkışı şu şekilde değişir: zerrin: "Kırıntıların hepsini sakladım ama seni koruyamadım. Bunun bedeli bende." · aldemir: "Suçlu kim, artık önemli değil. Düzeltecek kim, o önemli." (aynı cümle geçerli kalır.)
2. **Zerrin epilogda uyansın mı?** (Varsayılan: evet, tek cümle: "Ben bir şey kaçırdım mı?"). Hayır dersen Zerrin hiç konuşmaz; dalında tek bir tüy ışıldamaya devam eder.
3. **Aldemir'in uykusu ne kadar sürdü?** Açılış "Şafak yüzyıldır doğmadı" diyor, Aldemir "orta yaşlı". Öneri: uyku büyülüydü, uzun sürdü, yaşlanmadı (Zerrin'in itirafıyla uyumlu). Alternatif: belirsiz bırak. Bu belgedeki metinler süreyi söylemiyor; seçim Perde II'de hiçbir şeyi değiştirmez.
4. **Dört Nöbetçi** yeni karakter olarak onaylanıyor mu? (Yeni model gerekmez; konuşmacı girdisi + 3 elit Şövalye girdisi yeter.) Portre üretimi (fal.ai) ücretli; yapılacaksa Emre onayı gerekir.
5. **Kırıntı kartı** (27 hatıra) geliştirme önceliğine girer mi? Oyuncuyu tutmak için yüksek değer, ama orta maliyet ve defter ekranı gerekir.
6. **Pırıl adı:** "Pırıl, Mira'ya babasının taktığı ad" bir genişletmedir. Onaylar mısın?
7. **Gece Yarığı anlatısı:** "Rüyanın kenarında nöbet" sevilir mi, yoksa farklı bir mazeret mi istersin?
8. **Ton:** Perde II-III dramı ağır mı? İstenirse Zerrin'in nükte sıklığı Perde III'te Aldemir'e devredilerek artırılabilir (zaten başlatıldı: w3-02).

### 8.5 Kapsam riski ve önceliklendirme

| Parça | Öncelik | Neden |
|---|---|---|
| Perde I (w1-01..w1-09): `levels.*.intro/outro` | P0 | Bugünkü şemaya girer; kod gerektirmez; ilk oturumun %100'ü |
| 9 mevcut bölümün kimlik göçü ve metin değişikliği (bölüm 3.2) | P0 | Eski kayıtlar ve eski ödül metinleri çelişmesin |
| `deathLines` 12 satır | P0 | Sıfır kod; yenilgiyi yumuşatır |
| `strings.tagline`, `characters.nobetci`, `enemies.knight_ii..iv` | P1 | Küçük, ama Perde II için gerekli |
| Perde II ve III `intro/outro` | P1 | Tam metin yazıldı; "taslak v1" (oyuncu testi sonrası ton ayarı) |
| Kanca satırı (outro son satırı olarak) | P1 | Kod gerektirmeden bugün de uygulanabilir |
| Kırıntı kartı, perde kartı, DDA satırı, rozet, ansiklopedi, Gece Yarığı kancası | P2 | Her biri ek mekanik/ekran ister (bölüm 7.2) |
| Yeni hedef türü metinleri (timed, waves, hold, escort) | Mekanik ile birlikte | Mekanik yoksa metin işe yaramaz |
| Eskort (w3-06), "Vur" sonu | P3 / ertelenebilir | Yedek hazır (bölüm 3, w3-06) |

Büyük risk: **metin hacmi.** 27 bölüm x (intro+outro) + 27 kırıntı + 27 kanca + 13 lore + ~80 UI satırı = ~280 ayrı metin. Üretim hatası riski vardır (kimlik karışıklığı, uzunluk). Öneri: Perde I'i oyuna aktar, 3-5 kişiyle test et (okuma süresi, duygusal tepki, spoiler algısı); sonra Perde II-III'ü yayınla.

### 8.6 Doğrulama planı (nasıl ölçülür)

1. **Okuma süresi:** 5 oyuncuya Perde I'i oynat; kart başına ortalama bekleme süresi ve "atla" oranı ölç. Hedef: kart başına <= 8 sn ve atlama oranı < %40. (VARSAYIM, ölçülmedi.)
2. **Kanca etkisi:** Her bölüm sonunda "sonraki bölüme geçtin mi?" oranı (yerel telemetri, tasarım belgesi §7.3); düşük kalan kancalar yeniden yazılır.
3. **Spoiler algısı:** Oyuncuya w1-09 sonrası "Pırıl kim?" sorusu sorulur; doğru yanıt oranı %50 civarı hedeflenir (çok yüksekse ipuçları azaltılır, çok düşükse w1-08'in cümlesi netleştirilir).
4. **Telefon okunabilirliği:** 360 x 640 çözünürlükte 3 satırlık kart ve kırıntı kartının taşmadığı ELLE doğrulanır.
5. **Tutarlılık taraması:** `levels.*.intro/outro`, `characters`, `strings` içinde "Mira" araması: w2-06'dan önceki hiçbir metinde geçmemeli.

### 8.7 Bir sonraki odanın bilmesi gerekenler

- **Geliştirme:** bölüm 7.2 alan listesi ve 7.1 yapıştırılabilir kısım. Tüm metinler bu belgededir; config yazılmadı.
- **Oyun tasarımcısı:** Bu belge hedef türü, yıldız, DDA ve rozet tanımlarını DEĞİŞTİRMEDİ; yalnız metin ekledi. `knight_ii..iv` adları ve `objectiveText` gereksinimi sizi ilgilendirir.
- **Görsel/içerik:** 12 yeni tema (bölüm 3.0.2), 18 yeni bölüm kapağı ve düğüm görseli, Nöbetçi portresi (isteğe bağlı), perde kartı arka planları (yeni değil: mevcut kapakların yeniden kullanımı mümkün).
- **Test/yayın:** Spoiler sırası kontrolü (bölüm 8.2) ve "Mira" taraması yayın öncesi kontrol listesine girmeli.


---

## 9. Config'e aktarım durumu (gelistirme odası, Perde I)

Perde I (w1-01..w1-09) metinleri `data/game.config.json` içine **belgeden birebir** aktarıldı (kod: gelistirme odası; sayılar tasarım belgesi §13).

| Aktarılan | Nerede |
|---|---|
| Bölüm adı, giriş/çıkış diyalogları (w1-01..09) | `levels.<id>.name/intro/outro` (konuşmacısız satır = anlatı) |
| Kanca (w1-01..09) | `levels.<id>.hook` (YENİ isteğe bağlı alan, <= 120; bölüm sonu kartında outro altında italik) |
| Perde adı "Perde I · Uyanış" | `levels.<id>.world` (YENİ isteğe bağlı alan, <= 40; intro kartı + geniş harita paneli). `worlds` yapısı (alt başlık, giriş/çıkış kartı) YAPILMADI |
| Hedef metni | w1-07 "Süre dolmadan 31 kristal topla." ve w1-09 "Baş Nöbetçi'yi yen!" -> `levels.<id>.objectiveText` (YENİ isteğe bağlı alan, <= 60); diğerleri `strings.objective` şablonu |
| Yeni öğe ipuçları | `levels.<id>.hint` (§6.9 #1, #3, #4, #6, #7, #8, #9, #10, #11; w1-03 için "Yeni öğe" satırı). **Kullanılmadı:** #2 (w1-01'de 2. ipucu sınırı 2'dir, mevcut ipucu kaldı), #5 (Yıldırım henüz kazanılmamışken w1-05'te gösterilmez) |
| Yenilgi repliği | `strings.deathLines` ilk 12 satır (§2.6), sınır 12 olduğu için şema değişmedi |
| Slogan | `strings.tagline` = §6.8 #4 ("Bir büyücü uyuyakaldı, bir vadi uyanamadı. {levelCount} bölümde şafağı geri getir.") |
| Yıldız rozet adları/açıklamaları (§6.3) | `js/ui/text.js` `UI.stars` (config'e değil; "Rüzgâr Adımı" hız rozeti yapılmadı). ★2 mini-boss/boss açıklaması "En çok üç vuruş yiyerek bitirdin." (belgede yoktu, ★2 eşiği 3 vuruş olduğu için tek cümle eklendi) |

**Aktarılmayanlar:** kırıntı kartları (§2.3), perde kartları, DDA `difficulty.dda.notice[]` (Aşama 1'de `strings.dda.notice2..4` zaten var), `gameOver.titles[]` (§6.6), `clear.titles[]`/`pickPerks[]` (§6.5), harita ipuçları (§6.7), `tips[]`, düşman lore, karakter bio güncellemeleri, `nobetci` karakteri ("Baş Nöbetçi" taunt/yenilgi repliği yok), Perde II/III metinleri ve w2-02/w3-09 yeniden yazımları (köprü bölümlerinde ESKİ metin duruyor: w2-02 çıkışı "Kalbin son kırığı kalede…" kale w3-09 olarak hâlâ bir sonraki bölüm olduğundan çelişmiyor).

Kısaltma/değişiklik: yok (tüm Perde I satırları 240 sınırının çok altında). Konuşmacı kimlikleri: `zerrin`, `aldemir`, `piril`, `taskin`, `veyis`. Kanon testi: Perde I metinlerinde "Mira" geçmez (`tests/perde1.test.js`).
