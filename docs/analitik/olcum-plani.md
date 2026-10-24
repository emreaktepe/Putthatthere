# Analitik: Ölçüm Planı, Huni ve Maliyet Tanımı (ÖNERİ, onay bekliyor)

Durum: Koda ölçüm eklenmedi, `js/analytics.js` yok (V: `js/` altında ve `index.html` içinde takip kodu yok). Canlı ölçüm kişisel veri/yasal metin kapsamındadır; Emre onayı olmadan kurulmaz. Bu belge yalnızca plandır.
Dayanak (çelişme yok): `docs/web-seo/olcum-plani.md` (olay sözlüğü, araç seçenekleri, çerezsiz tercih), `docs/pazarlama-stratejisi/lansman-plani.md` §6, `docs/reklam/kampanya-plani.md` §5-7, `docs/sosyal-medya/kanal-secimi-ve-takvim.md` §2.
Etiketler: (V) repodan doğrulandı, (Varsayım) doğrulanmadı.
Ürün veritabanı yok (V: statik oyun, kayıt ve ödeme yok); bu yüzden SQL sorguları üretilmedi.

## 1. Olay izleme tablosu

Olay adları web-seo ortak sözlüğüyle aynıdır. "Yer" sütunu çağrının ekleneceği nokta; satır numarası değil işlev adı verilir, çünkü kod değişebilir. Tüm çağrılar yeni `js/analytics.js` içindeki `olay(ad, props)` sarmalayıcısından geçer; araç yüklü değilse sessizce hiçbir şey yapmaz. Aşağıdaki işlev eşlemeleri dosya listesinden yapıldı; çağrı noktaları uygulama sırasında kodla doğrulanmalı (Varsayım).

| Olay | Tetikleyici | Yer (dosya / işlev) | Özellikler | Not |
|---|---|---|---|---|
| (sayfa görüntüleme) | Sayfa açılışı | `index.html` içinde araç betiği (onaydan sonra) | UTM (bkz. §2) | Araç otomatik sayar |
| `oturum_basladi` | Menüden başlat/devam | `js/game/campaign.js` / `newGame()`, `continueGame()` | `cihaz` | Tur/oturum sayısıdır, oyuncu sayısı değil |
| `bolum_baslatildi` | Bölüm kartından savaşa geçiş | `js/game/flow.js` / `startLevel()` | `bolum_no` (1-9) | Alıştırma modunda `alistirma=evet` |
| `bolum_tamamlandi` | Bölüm hedefi tamamlandı | `js/game/flow.js` / `levelClear()` | `bolum_no`, `alistirma` | |
| `bolum_kaybedildi` | Can bitti / süre doldu | `js/game/flow.js` / `gameOver()` | `bolum_no` | |
| `oyun_bitti` | 9. bölüm (Gölge Kalesi) tamamlanıp final ekranı | `js/game/flow.js` / `levelClear()` son bölüm dalı | `cihaz` | |

Kural: kullanıcı kimliği, IP, serbest metin gönderilmez; ham skor gerekirse kova olarak. Skor tablosu, paylaşım düğmesi ve "haber ver" formu üründe YOK (V); ilgili olaylar tanımlanmadı.

## 2. UTM okuma

- Kampanya bağlantıları iki şemadan gelir: sosyal medya `?utm_source=<kanal>&utm_medium=<organic_social|community>&utm_campaign=lansman30&utm_content=<gonderi-kodu>`; reklam `utm_medium=paid_social&utm_campaign=lansman30_test&utm_content=<v1_safak|v2_buyu|v3_kurulumsuz>&utm_term=<kitle>` (V, ilgili belgeler).
- `js/analytics.js` açılışta bir kez `URLSearchParams(location.search)` ile `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` değerlerini okur, küçük harfe çevirir, izinli desen dışındakini (`[a-z0-9_-]{1,40}`) atar ve yalnızca bellekte tutar. Oyunun kendi kayıt anahtarları (`buyucu_save`, `buyucu_kamera`) dışında yeni çerez veya `localStorage` kaydı açılmaz.
- Araç seçimine göre aktarım (Varsayım, araç belgelerinden doğrulanmadı): Plausible'da UTM'ler panelde otomatik kırılır ve olaylara `props` eklenebilir; GoatCounter'da olaylara özel özellik eklenip eklenemeyeceği doğrulanmadı. GoatCounter seçilirse olay bazında kaynak kırılımı mümkün olmayabilir; araç seçiminden önce bu sınır Emre'ye bildirilmeli.
- Doğrulama (kurulumdan sonra): UTM'li deneme bağlantısı aç, panelde kaynak/kampanya görünsün; ağ sekmesinde yalnızca araca giden istek olsun, çerez olmasın. Bugün yapılmadı (kurulum yok).

## 3. Edinme hunisi

Ürün ücretsiz, hesapsız ve ödemesizdir (V). Klasik "kayıt, ödeme" basamakları yoktur; huni oyunun kendi basamaklarına uyarlanır:

| # | Basamak | Ölçüm | Kaynak |
|---|---|---|---|
| 0 | Kanal | UTM `utm_source` / `utm_medium` / `utm_content` | bağlantı |
| 1 | Ziyaret | Sayfa görüntüleme | araç |
| 2 | Başlama | `oturum_basladi` | olay |
| 3 | Aktivasyon | `bolum_tamamlandi` (bolum_no=1) | olay |
| 4 | Derinlik | `bolum_tamamlandi` (bolum_no=3) | olay |
| 5 | Tamamlama | `oyun_bitti` | olay |

Kayıt ve ödeme: kapsam dışı (V); raporda bu satırlar "uygulanamaz" yazılır, "veri yok" değil.

Oranlar (kanal başına, aynı dönem):
- Başlama oranı = `oturum_basladi` / ziyaret
- Aktivasyon oranı = `bolum_tamamlandi`(1) / `oturum_basladi`
- Tamamlama oranı = `oyun_bitti` / `oturum_basladi`
- Bölüm bazlı düşüş = `bolum_tamamlandi`(n) / `bolum_tamamlandi`(n-1); bölüm başarı oranı = `bolum_tamamlandi`(n) / `bolum_baslatildi`(n) (denge ayarının ana girdisi)

Sınırlar (dürüstlük): kişi tanınmaz. "Ziyaretçi" araç tahminidir, olaylar ise tur sayısıdır; aynı kişinin tekrar oynaması oranları şişirir. Alıştırma modunda yeniden oynanan bölümler ayrıştırılmazsa oranlar şişer (`alistirma` özelliği). Paydası 20'den küçük oranlar yüzde olarak değil sayı olarak (ör. "3/9") yazılır.

## 4. CAC yerine: tamamlayan oyuncu başına maliyet

CAC "para ödeyen/kayıtlı müşteri başına maliyet" demektir. Bu üründe kayıt ve ödeme yok (V), bu yüzden CAC tanımsızdır. Değer anı, oyuncunun ilk bölümü bitirmesidir (aktivasyon); kampanya planı da bunu seçmiştir. Bu yüzden:

**Aktive oyuncu başına maliyet (AOBM) = kanala harcanan nakit / o kanaldan gelen `bolum_tamamlandi`(1) sayısı**

Yardımcı ölçüler:
- Ziyaret başına maliyet = harcama / ziyaret
- Oyunu bitiren başına maliyet = harcama / `oyun_bitti` (az sayıda olur, yalnızca bilgi)

Kurallar:
- Yalnızca nakit harcanan kanallarda (şu an planlanan tek kanal: Meta ücretli test) hesaplanır. Organik kanallarda nakit maliyeti 0'dır; AOBM yazılmaz, zaman ayrı not edilir.
- Harcama paydası: reklam panelindeki gerçek harcama. Kreatif/araç gideri varsa ayrı satırda gösterilir, karıştırılmaz.
- Araç olay düzeyinde kaynak kırılımı veremezse AOBM hesaplanamaz ve raporda "kaynak kırılımı yok, hesaplanamadı" yazılır; toplam olay sayısını kanala atfetmek yapılmaz.
- Meta panelindeki "tıklama" ile sitedeki ziyaret farklı çıkabilir; sonuç siteden okunur.
- Kampanya planındaki eşikler varsayımdır, dayanağı yoktur; ilk gerçek veri gelince yeniden belirlenir.
- Küçük örnek uyarısı: kanalda 10'dan az aktive oyuncu varsa AOBM karar için kullanılmaz, yalnızca gösterilir.

## 5. Doğrulama durumu

| Madde | Durum |
|---|---|
| Olay sözlüğü ve tetik noktaları | Dosya yapısından eşlendi; çağrı noktaları uygulamada doğrulanacak; çalışan olay YOK |
| Etiketlerin test edilmesi | YAPILAMADI: ölçüm kurulu değil |
| Salt okunur SQL | Uygulanamaz: veritabanı yok |
| Kanal huni ve AOBM yöntemi | Yazıldı |

Kurulum adımları: `docs/web-seo/olcum-plani.md` §5 (araç seçimi, gizlilik notu onayı, `js/analytics.js`, UTM doğrulaması). Onay çağrısı genel müdürden gelmeli.
