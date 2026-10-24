# Analitik: Ölçüm Planı, Huni ve Maliyet Tanımı (ÖNERİ, onay bekliyor)

Durum: Koda ölçüm eklenmedi, `js/analytics.js` yok (doğrulandı: depoda dosya yok, `index.html` ve `js/*.js` içinde takip kodu yok). Canlı ölçüm kişisel veri/yasal metin kapsamındadır; Emre onayı olmadan kurulmaz. Bu belge yalnızca plandır.
Dayanak (çelişme yok): `docs/web-seo/olcum-plani.md` (olay sözlüğü, araç seçenekleri, çerezsiz tercih), `docs/pazarlama-stratejisi/lansman-plani.md` §6, `docs/reklam/kampanya-plani.md` §5-7, `docs/sosyal-medya/kanal-secimi-ve-takvim.md` §2.
Etiketler: (V) repodan doğrulandı, (Varsayım) doğrulanmadı.
Supabase/ürün veritabanı yok (V: ürün statik, kayıt ve ödeme yok); bu yüzden `sorgular.sql` üretilmedi.

## 1. Olay izleme tablosu

Olay adları web-seo ortak sözlüğüyle aynıdır (değiştirilmedi). "Yer" sütunu mevcut kodda çağrının ekleneceği nokta; satır numarası değil işlev adı verilir, çünkü kod değişebilir. Tüm çağrılar yeni `js/analytics.js` içindeki `olay(ad, props)` sarmalayıcısından geçer; araç yüklü değilse sessizce hiçbir şey yapmaz.

| Olay | Tetikleyici | Yer (dosya / işlev) | Özellikler | Not |
|---|---|---|---|---|
| (sayfa görüntüleme) | Sayfa açılışı | `index.html` içinde araç betiği (onaydan sonra) | UTM (bkz. §2) | Araç otomatik sayar; ayrı olay yok |
| `oturum_basladi` | "Başla" tıklaması | `js/main.js` / `startGame()` | `dil` | "Tekrar oyna" da `startGame()` çağırır, yani her tur sayılır; oyuncu sayısı DEĞİL tur sayısıdır |
| `sahne_baslatildi` | Sahne yüklendi | `js/main.js` / `loadCurrentScene()` | `sahne_no` (1-5) | Sahne sırası `difficulty`'e göre sıralanır (V, `loadScenes`) |
| `sahne_tamamlandi` | "Şunu şuraya koy" onayı, sonuç penceresi açıldı | `js/main.js` / `onConfirmClick()` (`scorePlacement` sonrası) | `sahne_no`, `yildiz` (0-3), `sapma_kova` | `result.error` alanı yoksa kova yalnızca yıldızdan türetilir; sapma alan adı kodda doğrulanmalı |
| `oyun_bitti` | Son sahneden sonra "Bitir" | `js/main.js` / `showFinalSummary()` | `puan_kova` (ör. 0-24, 25-49, 50-74, 75-100 yüzde), `rutbe` | `rutbe` = `rankForPercent` çıktısı |
| `dil_degistirildi` | TR/EN düğmesi | `js/main.js` / `onLangToggle()` | `dil` | |
| `webgl_yok` | 3B başlatma hatası | `js/main.js` / `init()` içindeki `catch` | yok | Şu an hata ayrımı yok (bkz. geri bildirim G3); önce hatanın WebGL kaynaklı olduğu ayrıştırılmalı |
| `skor_paylasildi` | "Skoru kopyala" tıklaması | Özellik YOK (V) | `rutbe` | Özellik eklenene kadar bu olay ölçülmez, raporda "veri yok" |
| `yeni_sahne_ilgi` | "Yeni sahneler" düğmesi | Özellik YOK (V) | yok | Aynı |

Kural: ham puan/sapma, kullanıcı kimliği, IP, serbest metin gönderilmez; yalnızca kova.

## 2. UTM okuma

- Kampanya bağlantıları iki şemadan gelir: sosyal medya `?utm_source=<kanal>&utm_medium=<organic_social|community>&utm_campaign=lansman30&utm_content=<gonderi-kodu>`; reklam `utm_medium=paid_social&utm_campaign=lansman30_test&utm_content=<v1_sapma|v2_peron|v3_kurulumsuz>&utm_term=<kitle>` (V, ilgili belgeler).
- `js/analytics.js` açılışta bir kez `new URLSearchParams(location.search)` ile `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` değerlerini okur, küçük harfe çevirir, izinli desen dışındakini (`[a-z0-9_-]{1,40}`) atar ve yalnızca bellekte tutar. Çerez, `localStorage` ve `sessionStorage` kullanılmaz (çerezsiz tercih).
- Sayfa tek sayfalık uygulama olduğu için (V: `index.html` tek sayfa, ekranlar `hidden` ile değişir) bellekteki değer oyun boyunca korunur; sayfa yenilenirse ve bağlantıdaki UTM kalmışsa yeniden okunur, aksi halde kaynak "doğrudan/bilinmiyor" olur.
- Araç seçimine göre aktarım (Varsayım, araç belgelerinden doğrulanmadı): Plausible'da UTM'ler panelde otomatik kırılır ve olaylara `props` eklenebilir; GoatCounter'da UTM/yönlendiren sayfa görüntülemeye bağlanır, olaylara özel özellik eklenip eklenemeyeceği doğrulanmadı. GoatCounter seçilirse olay bazında kaynak kırılımı mümkün olmayabilir; bu durumda tamamlama oranı kaynağa göre değil, kaynağa göre sayfa görüntüleme ile toplam olay üzerinden yaklaşık okunur. Araç seçiminden önce bu sınır Emre'ye bildirilmeli.
- Doğrulama (kurulumdan sonra): UTM'li deneme bağlantısı aç, araç panelinde kaynak/kampanya görünsün; ağ sekmesinde yalnızca araca giden istek olsun, çerez olmasın. Bugün yapılmadı (kurulum yok).

## 3. Edinme hunisi

Ürün ücretsiz, hesapsız ve ödemesizdir (V). Klasik "kayıt, ödeme" basamakları yoktur; huni oyunun kendi basamaklarına uyarlanır:

| # | Basamak | Ölçüm | Kaynak |
|---|---|---|---|
| 0 | Kanal | UTM `utm_source` / `utm_medium` / `utm_content` | bağlantı |
| 1 | Ziyaret | Sayfa görüntüleme | araç |
| 2 | Başlama | `oturum_basladi` | olay |
| 3 | Aktivasyon | `sahne_tamamlandi` (sahne_no=1) | olay |
| 4 | Tamamlama | `oyun_bitti` | olay |
| 5 | Paylaşım / ilgi | `skor_paylasildi`, `yeni_sahne_ilgi` | özellik yok, ileride |

Kayıt ve ödeme: kapsam dışı (V); raporda bu satırlar "uygulanamaz" yazılır, "veri yok" değil.

Oranlar (kanal başına, aynı dönem):
- Başlama oranı = `oturum_basladi` / ziyaret
- Aktivasyon oranı = `sahne_tamamlandi`(sahne 1) / `oturum_basladi`
- Tamamlama oranı = `oyun_bitti` / `oturum_basladi` (kampanya ve lansman planındaki tanım)
- Sahne bazlı düşüş = `sahne_tamamlandi`(n) / `sahne_tamamlandi`(n-1)

Sınırlar (dürüstlük): çerezsiz ölçümde kişi tanınmaz. "Ziyaretçi" araç tahminidir, olaylar ise tur sayısıdır; aynı kişinin tekrar oynaması oranları şişirir. Paydası 20'den küçük oranlar raporda yüzde olarak değil sayı olarak (ör. "3/9") yazılır.

## 4. CAC yerine: tamamlayan oyuncu başına maliyet

CAC (müşteri edinme maliyeti) "para ödeyen/kayıtlı müşteri başına maliyet" demektir. Bu üründe kayıt ve ödeme yok (V), bu yüzden CAC tanımsızdır; hesaplanırsa ya sıfıra bölünür ya da anlamsız bir sayı çıkar. Değer anı, oyuncunun oyunu bitirmesidir; kampanya planı da aynı ölçüyü seçmiştir. Bu yüzden:

**Tamamlayan oyuncu başına maliyet (TOBM) = kanala harcanan nakit / o kanaldan gelen `oyun_bitti` sayısı**

Yardımcı ölçüler (aynı pay):
- Ziyaret başına maliyet = harcama / ziyaret
- Aktive oyuncu başına maliyet = harcama / `sahne_tamamlandi`(sahne 1)

Kurallar:
- Yalnızca nakit harcanan kanallarda (şu an planlanan tek kanal: Meta ücretli test) hesaplanır. Organik kanalların nakit maliyeti 0'dır; TOBM yazılmaz, zaman ayrı not edilir ("emek, nakit değil").
- Harcama paydası: reklam panelindeki gerçek harcama. Kreatif/araç gideri (planda ayrı ~1.000 ₺ kalemi) varsa ikinci bir "yüklü TOBM" olarak ayrı satırda gösterilir, karıştırılmaz.
- Pay: kaynağı ilgili kanal olan `oyun_bitti`. Araç olay düzeyinde kaynak kırılımı veremezse (bkz. §2) TOBM hesaplanamaz ve raporda "kaynak kırılımı yok, hesaplanamadı" yazılır; toplam olay sayısına bölüp kanala atfetmek yapılmaz.
- Meta panelindeki "tıklama" ile sitedeki ziyaret farklı çıkabilir; sonuç siteden okunur (reklam planı §6).
- Kampanya planındaki ilk hedef (≤ 30 ₺) ve durdurma/ölçekleme eşikleri varsayımdır, dayanağı yoktur; ilk gerçek veri gelince yeniden belirlenir. Bu belge o eşikleri değiştirmez.
- Küçük örnek uyarısı: kanalda 10'dan az `oyun_bitti` varsa TOBM karar için kullanılmaz, yalnızca gösterilir.

## 5. Doğrulama durumu

| Madde | Durum |
|---|---|
| Olay sözlüğü ve tetik noktaları | Kod okunarak eşlendi (V); çalışan olay YOK |
| Etiketlerin test edilmesi | YAPILAMADI: ölçüm kurulu değil |
| Salt okunur SQL | Uygulanamaz: veritabanı yok |
| Kanal huni ve TOBM yöntemi | Yazıldı |

Kurulum adımları değişmedi (`docs/web-seo/olcum-plani.md` §5): araç seçimi, gizlilik notu onayı, `js/analytics.js`, UTM doğrulaması. Onay çağrısı genel müdürden gelmeli.
