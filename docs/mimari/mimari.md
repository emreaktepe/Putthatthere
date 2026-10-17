# Mimari Karar Kaydı: Şunu Şuraya Koy (Put That There)

Durum: ÖNERİ taslağı. Kod değiştirilmedi, canlı anahtar eklenmedi, fiyat ve yasal metin yayınlanmadı.
Etiketler: (V) koddan/belgeden doğrulandı, (W) web aramasıyla kısmen görüldü, resmi kaynaktan teyit edilmedi, (Varsayım) doğrulanmadı.
Girdiler: `docs/strateji/brief.md`, `fiyatlandirma.md`, `mvp-kapsami.md`, `rakipler.md`, `README.md`, `js/`, `data/`, `.github/workflows/`.

## 1. Mevcut kodun mimari özeti

### 1.1 Yapı (V)
- Saf statik site: `index.html`, `css/style.css`, `js/*.js` (ES modülleri), `data/*.json`, `vendor/`. Derleme adımı, paket yöneticisi, `package.json` yok. Toplam yaklaşık 1960 satır JS/JSON.
- `index.html` bir importmap ile `three` ve `three/addons/` yollarını `vendor/` altındaki yerel kopyaya bağlar. CDN bağımlılığı yok.
- Üç ekran (giriş, oyun, sonuç modalı) tek sayfada `hidden` ile değiştirilir. Yönlendirici (router) yok.
- Modüller:
  - `main.js` (207 satır): akış, sahne sırası, puan toplamı. `fetch("data/scenes.json")` ile içeriği yükler.
  - `three-app.js`: renderer, kamera, OrbitControls, ışık/gölge, raycast, hayalet önizleme.
  - `scene-builders.js` (488 satır): 5 ortam ve 5 nesne için prosedürel geometri, metre cinsinden. JSON'daki `builder` alanı buradaki bir fonksiyona karşılık gelir.
  - `materials.js`: prosedürel dokular. `input-raycast.js`: seç/yerleştir durum makinesi. `scoring.js`: puan ve rütbe. `ui-results.js`, `tray-preview.js`, `i18n.js`.
- Veri: `data/scenes.json` (5 sahne: hedef konum, tolerans, kamera, yüzeyler, TR/EN açıklama, ipuçları, `sourceNotes`), `data/strings.{tr,en}.json`.
- Durum saklama: yalnızca dil tercihi `localStorage` (V). İlerleme, skor, hesap, ağ çağrısı (veri dosyaları dışında) yok.

### 1.2 Bağımlılıklar (V)
- Three.js 0.185.1 (MIT), `vendor/` altında minify edilmiş. Başka bağımlılık yok.
- Lisans: depo Apache 2.0, `vendor/THREE_LICENSE` ayrı.

### 1.3 Derleme ve yayın (V)
- `.github/workflows/deploy-pages.yml`: `main` push'unda tüm depo kökünü (`path: '.'`) GitHub Pages'e yükler. Yani `docs/`, `.github/` dahil her şey herkese açık yayınlanır; yalnızca `data/scenes.json` değil, ileride eklenecek her dosya da.
- Adres: `https://emreaktepe.github.io/Putthatthere/`.

### 1.4 Mimari açıdan çıkarımlar
1. Doğru/hedef konumlar (`target`) tarayıcıya JSON olarak iner. Ücretsiz sahnelerde sorun değil; ücretli sahnelerde hem sahne içeriği hem cevap anahtarı istemcide açık olur (bkz. 3.3).
2. Sahne = JSON + `scene-builders.js` içindeki kod. Ücretli paketin kodu da statik dosyada durursa kilit anlamsızdır. Sahne tanımının builder kodundan ayrılması gerekir (bkz. 3.3, seçenek "veri odaklı sahne").
3. Puanlama istemcide (`scoring.js`). Liderlik tablosu veya ödül gibi şeyler için sunucuda yeniden hesaplanmalı; v1 kapsamında zaten yok.
4. Mevcut yapı korunmalı: yeniden yazma gerekmiyor. Eklenecekler ince katmanlardır (analitik, hesap, ödeme, yetkilendirme API'si).

## 2. Ödeme seçenekleri (Türkiye'den satış)

Uyarı: Aşağıdaki oranlar ve koşullar web aramasıyla kısmen görüldü; çoğu satıcı blogu, forum veya rakip yazısı. Resmi fiyat sayfalarından teyit edilmedi. Karar öncesi her sağlayıcının resmi sayfası ve satış ekibiyle doğrulanmalı. Bu odada hiçbir hesap açılmadı, anahtar eklenmedi.

### 2.1 Karşılaştırma

| Seçenek | Tür | Oran/komisyon | Kurulum gereksinimi | Vergi/fatura | Not |
|---|---|---|---|---|---|
| iyzico | Yerel ödeme kuruluşu (TR) | Resmi tablo doğrulanamadı. Bir kaynak "22 gün bloke süresi" demiş (W, zayıf). | Genellikle şirket (şahıs şirketi veya tüzel kişi) başvurusu; bireysel için kısıtlı (W, zayıf). KYC belgeleri. | Satıcı olarak sizsiniz: KDV, e-Arşiv/e-Fatura/e-SMM düzenleme yükümlülüğü sizde (Varsayım, mali müşavirle teyit). | Taksit, yerel kartlar, TL; yurt dışı kartı ve döviz desteği ayrıca sorulmalı. |
| PayTR | Yerel sanal pos/ödeme kuruluşu (TR) | Bir satıcı sitesi %0,99-%4,00 aralığı veriyor, ciroya göre değişken (W, resmi değil). | Şirket, vergi levhası, site/ürün incelemesi. | Satıcı sizsiniz, iyzico ile aynı yükümlülükler. | Dijital oyun içeriği kategorisinin kabulü sorulmalı. |
| Stripe | Küresel ödeme altyapısı | 2.9% + sabit ücret civarı yaygın bilgi (Varsayım, doğrulanmadı). | Türkiye'de doğrudan hesap durumu çelişkili: eski kaynaklar "yok", bazı pazarlama sayfaları "2024'te girdi" diyor (W, teyitsiz). Stripe'ın resmi desteklenen ülke listesine bakılmalı. Yabancı şirket (ör. UK/ABD) kurma yolu hukuki/vergi yük getirir. | Satıcı sizsiniz (yabancı şirketle de vergi doğurur). | Stripe'ın yeni "Managed Payments" (MoR) ürünü ve Lemon Squeezy ile ilişkisi 2026 kaynaklarında geçiyor (W, teyitsiz). |
| Paddle | Merchant-of-record (MoR) | %5 + 0,50 USD, birçok blogda (W). | Satıcı onayı gerekir; ürün incelemesi. TRY dahil çok sayıda para birimi listeleniyor (W). Türkiye'den ödeme alma (payout) koşulu resmi sayfadan doğrulanmalı. | MoR: yurt dışı alıcıya karşı satıcı Paddle'dır; küresel KDV/satış vergisini Paddle toplar ve öder. Siz Paddle'a (yurt dışına) hizmet/komisyon faturası keseceksiniz; bunun TR'de nasıl faturalanacağı (ihracat/hizmet ihracatı istisnası) mali müşavirle teyit edilmeli (Varsayım). | Yazılım/SaaS odaklı; oyun içeriği kabulü sorulmalı. |
| Lemon Squeezy | MoR | %5 + 0,50 USD (W). | Ödeme çıkışının PayPal/USD ağırlıklı olduğu söyleniyor; PayPal Türkiye'de yok (W). Stripe tarafından devralındığı/göç ettirildiği haberi (W, teyitsiz). | MoR, Paddle gibi. | Geleceği belirsiz, yeni başlangıç için riskli (Varsayım). |
| Polar | MoR | %4 + 0,40 USD (W, çelişkili: oran artışı iddiası var). Gizli kalemler olabilir. | Stripe Connect Express üzerinden payout; Türkiye'nin kapsamda olup olmadığı resmi sayfadan teyit edilmeli (W, zayıf). | MoR. | Genç ürün; geliştiricilere dönük. |
| Gumroad | Pazar yeri + MoR benzeri | Oran/koşul doğrulanamadı (Varsayım: yüzde bazlı komisyon). | Ödeme çıkışı için ülke desteği doğrulanmadı. | Doğrulanmadı. | Dijital dosya satışına uygun; oyun içi sahne yetkilendirmesi için API/webhook esnekliği sınırlı olabilir (Varsayım). |
| itch.io | Oyun pazar yeri | Doğrulanmadı (Varsayım: gelirden pay, ayarlanabilir). | Doğrulanmadı. | Doğrulanmadı. | Keşif kanalı olarak ilginç; ürünün kendi hesap/yetki sistemiyle bütünleşmez. |

### 2.2 Değerlendirme ölçütleri
1. Satıcı kim? MoR olmayan çözümlerde (iyzico, PayTR, Stripe) KDV, fatura ve vergi bildirimi Emre'nin şirketinde. Küresel Türkçe/İngilizce kitle için yabancı alıcılarda vergi karmaşıklığı büyür.
2. Para Emre'ye nasıl ulaşır? TL banka hesabı (yerel çözümler) mi, döviz/yabancı kanal (MoR) mı? Döviz gelirinin TR'de faturalanması ve vergilendirilmesi mali müşavirle çözülmeli.
3. Düşük hacim: sabit ücretler (0,40-0,50 USD) düşük fiyatlı pakette orantısız yük getirir (ör. tek haneli USD fiyatta %5 + 0,50 USD etkin oranı belirgin biçimde yükseltir; hesap yapılmalı).
4. Webhook/API: ödeme tamamlanınca sunucuda hak (entitlement) verebilmek şart (bkz. 3.3).

### 2.3 Öneri (Varsayımlara dayalı)

- Aşama 0-1 (ödeme yok): ödeme entegrasyonu yapma. Bekleme listesi ve fake door yeterli.
- Aşama 2 için iki yol, Emre'nin iki karşılığı yanıtlamasıyla (bkz. açık sorular) seçilir:
  - **Yol A, global ağırlıklı ve düşük idari yük: MoR (ilk aday Paddle).** Gerekçe: küresel vergiyi MoR üstlenir, TRY dahil birçok para birimi. Önkoşul: Türkiye'den satıcı onayı, payout ve oyun içeriği kabulünün resmi sayfadan teyidi. Teyit çıkmazsa Polar yedek aday.
  - **Yol B, Türkçe pazar ağırlıklı: iyzico veya PayTR + şahıs/limited şirket.** Gerekçe: TL, taksit, yerel kart. Maliyeti: şirket kurulumu, e-Arşiv/e-Fatura, KDV yönetimi.
- Lemon Squeezy: 2026 kaynaklarındaki belirsizlik ve PayPal bağımlılığı nedeniyle önerilmez (teyit edilene kadar).
- Gumroad ve itch.io: ürüne entegre ödeme yerine ikincil keşif/dağıtım kanalı olarak değerlendirilebilir; ürün içi yetkilendirmeyle uyumu doğrulanmadı.
- Ödeme sağlayıcısından bağımsız soyutlama: sunucuda `payments` adaptörü ve `entitlements` tablosu (bkz. 4.1). Sağlayıcı değişse bile istemci ve veri modeli değişmez. Detayı Finans odası belirler; test modu dışında canlı anahtar için onay şart.

## 3. Barındırma önerisi

### 3.1 Statik site
- GitHub Pages ticari kullanıma uygun değildir (şirket kuralı); ödeme alınacak ürünü Pages'te barındırma.
- Öneri: **Cloudflare Pages** (ilk tercih) veya Vercel/Netlify. Gerekçe: statik site + aynı platformda edge fonksiyonları (Cloudflare Workers/Pages Functions veya Vercel/Netlify Functions); özel alan adı, önizleme dağıtımları. Ücretsiz katmanların ticari kullanım koşulları (özellikle Vercel Hobby'nin ticari olmayan kullanım şartı) kontrol edilmeli (Varsayım, doğrulanmadı).
- Aşama 0 (ödeme yok) için mevcut Pages yayını sürebilir; ödemeden önce taşınmalı. Alan adı/DNS değişikliği ve canlıya alma onay kapısına tabidir.
- Derleme: şu an yok. Öneri: küçük bir `build` adımı ekleyip yalnızca yayın klasörünü (`index.html`, `css/`, `js/`, `data/`, `vendor/`, `assets/`) dağıtmak; `docs/` ve `.github/` yayına gitmesin. Mevcut dosya düzenini taşımadan, bir `public/` çıktısı üretilir.

### 3.2 Sunucu katmanı
- Yığın varsayılanı: Supabase (Postgres, Auth, Storage, Realtime) + edge fonksiyon (Node/TypeScript). Sapma yok. Sunucu işi küçük: ödeme webhook'u, yetkili sahne verisi dağıtımı, analitik toplama.
- Ayrı bir uzun süreli sunucuya gerek yok (Varsayım: trafik düşük).

### 3.3 Ücretli sahneler için yetkilendirme
Sorun: statikte gönderilen her şey açıktır; hedef konumlar dahil. Seçenekler:

| Seçenek | Açıklama | Koruma | Maliyet |
|---|---|---|---|
| 1. İstemci bayrağı | `locked: true` ile düğmeyi gizle | Yok, kolayca aşılır | Çok düşük |
| 2. Sunucudan sahne JSON'u | Ücretli sahne verisi (`scenes` içeriği) Supabase'de, yalnızca hak sahibine RLS ile dönülür | Sahne verisi ve hedef konum korunur; builder kodu hâlâ açıksa geometri açıkta | Düşük |
| 3. Veri odaklı sahne + paket başına ayrı builder | Ücretli sahnenin geometrisi de parametrik JSON olarak sunucudan; ya da builder modülü imzalı kısa ömürlü URL ile (Supabase Storage) yüklenir | Hem veri hem geometri korunur. Yine de tam gizlilik yok: yetkili kullanıcı tarayıcıdan kopyalayabilir | Orta |
| 4. Cevabı sunucuda doğrula | İstemci yalnızca konum gönderir, puan sunucuda hesaplanır, hedef konum hiç inmez | Cevap anahtarı korunur | Orta, gecikme ekler |

Öneri: **Seçenek 2 ile başla, ücretli paket için 3'e geç**; 4 yalnızca liderlik tablosu gibi rekabetçi özellik gelirse. Hak kontrolü RLS ile (kullanıcının `entitlements` kaydı), imzalı URL'lerle. Not: Apache 2.0 depoda kalan kod kopyalanabilir; ücretli sahne içeriği ve builder kodu ayrı, kapalı bir depoda veya Storage'da tutulmalı (strateji brief'indeki açık soru 2 ile bağlantılı, Emre'nin kararı).

Hesap: Supabase Auth; e-posta + sihirli bağlantı veya Google. Ücretsiz oyun hesapsız kalır (anonim). Satın alma anında hesap istenir.

## 4. Kullanıcı verisi

### 4.1 Supabase şeması taslağı (migration DEĞİL, tasarım taslağı)

```sql
-- profiles: auth.users ile 1-1
profiles(id uuid pk references auth.users, display_name text, locale text default 'tr',
         created_at timestamptz default now())

-- sahne paketleri ve sahneler (ücretsiz çekirdek herkese açık)
packs(id text pk, title_tr text, title_en text, is_free boolean, published boolean)
scenes(id text pk, pack_id text references packs, sort int, definition jsonb, published boolean)
  -- definition: scenes.json içindeki sahne nesnesi (target dahil)

-- hak (satın alma sonucu); yalnızca sunucu (service role) yazar
entitlements(id uuid pk, user_id uuid references profiles, pack_id text references packs,
             provider text, provider_order_id text unique, status text, created_at timestamptz)

-- oyun sonuçları (hesaplı kullanıcı)
runs(id uuid pk, user_id uuid references profiles, pack_id text, total_score int,
     stars int, started_at timestamptz, finished_at timestamptz)
run_scenes(run_id uuid references runs, scene_id text, score int, stars int,
           error_cm numeric, rotation_error_deg numeric, primary key (run_id, scene_id))

-- bekleme listesi (e-posta = kişisel veri)
waitlist(id uuid pk, email text unique, pack_interest text, consent_at timestamptz not null,
         created_at timestamptz default now())

-- anonim olay sayacı (kişisel veri yok)
events(id bigserial pk, name text, scene_id text, session_hash text, day date, created_at timestamptz)
```

### 4.2 RLS yaklaşımı
- Her tabloda RLS açık, varsayılan reddet; politikalar migration ile birlikte yazılır.
- `profiles`: kullanıcı yalnızca kendi satırını okur/günceller (`auth.uid() = id`).
- `packs`, ücretsiz `scenes`: `published` ise anonim okuma. Ücretli `scenes`: yalnızca `entitlements` kaydı olan kullanıcı okuyabilir (alt sorgu ile).
- `entitlements`: kullanıcı yalnızca kendi kayıtlarını okur; yazma yalnızca service role (webhook). İstemciden ekleme/güncelleme yok.
- `runs`, `run_scenes`: kullanıcı yalnızca kendininkini okur/ekler.
- `waitlist`: anonim yalnızca ekleyebilir (okuma yok); okuma yalnızca service role. Hız sınırı/kötüye kullanım koruması edge fonksiyonda.
- `events`: anonim yalnızca ekleyebilir (okuma yok), tercihen edge fonksiyon üzerinden.
- Service role anahtarı yalnızca sunucu ortamında; tarayıcıya asla gitmez (`.env.example` yalnızca değişken adları içerir).

### 4.3 KVKK notları (hukuki görüş DEĞİLDİR, avukat/danışman teyidi gerekir)
- E-posta, hesap ve satın alma kaydı kişisel veridir. Aydınlatma metni, açık rıza (bekleme listesi için), gizlilik politikası ve çerez bilgilendirmesi gerekir. Yasal metin yazmak ve yayınlamak Emre onayına tabidir; bu belgede yazılmadı.
- Veri sorumlusu kim olacak (şahıs, şirket) ve VERBİS kayıt yükümlülüğü eşiği: kontrol edilmeli (Varsayım, doğrulanmadı).
- Yurt dışına aktarım: Supabase/Cloudflare/MoR sağlayıcıları yurt dışında işler; KVKK'daki yurt dışı aktarım şartları ve sağlayıcı bölgesi seçimi (ör. AB bölgesi) hukuki olarak değerlendirilmeli (Varsayım).
- Veri minimizasyonu: ödeme kartı verisi hiç bizde tutulmaz (sağlayıcıda). Çocuk kitlesi hedeflenmiyor (hedef 18-45, brief); yaş doğrulaması kararı Emre'de.
- Silme/dışa aktarma: kullanıcı hesabını silince `profiles`, `runs`, `run_scenes` zincirleme silinmeli; `entitlements` ve fatura kayıtları yasal saklama süresi nedeniyle ayrı değerlendirilmeli (süre mali müşavirle teyit).

### 4.4 Analitik
- Hedef: `brief.md` üç metriği (tamamlama, geri dönüş, paylaşım/paket ilgisi).
- Öneri: çerezsiz, anonim, kendi `events` tablosu veya çerezsiz bir hazır araç (ör. Plausible, Umami, Cloudflare Web Analytics; sunucu konumu/koşullar doğrulanmadı). Kendi tablomuz: oturum başlangıcı, sahne tamamlama, oyun sonu, paylaş tıklaması, paket ilgisi. IP saklanmaz; `session_hash` günlük dönen rastgele tuz ile üretilir.
- Geri dönüş oranı (7 gün) çerezsiz ölçümde yaklaşıktır; `localStorage` anonim kimliği bunu iyileştirir ama bu da bir tanımlayıcıdır; bilgilendirme gerekir (hukuki teyit).
- Üçüncü taraf betik eklemek ve kişisel veri toplamak Emre onayı ve gizlilik metni gerektirir.

## 5. Aşamalı geçiş planı

| Aşama | İçerik | Barındırma | Onay kapısı |
|---|---|---|---|
| 0 | Mevcut oyun + paylaşım düğmesi, en iyi skor (`localStorage`), anonim analitik, "yakında" ilgi sayacı. Hesap/ödeme yok. | Pages sürebilir (ödeme yok); tercihen Cloudflare Pages'e taşı | Analitik/gizlilik metni, alan adı değişikliği |
| 1 | Bekleme listesi (e-posta, rıza), Supabase kurulumu, fake door (fiyatsız) | Cloudflare Pages + Supabase | KVKK metni, e-posta toplama |
| 2 | Hesap (Supabase Auth), sahne verisinin sunucudan dağıtımı (RLS), ücretli paket altyapısı, test modunda ödeme | Aynı | Fiyat, canlı anahtar, satış sözleşmesi, canlıya alma |
| 3 | İlk ücretli paket (5 sahne) yayını, webhook ile hak verme, fatura süreci | Aynı | Canlıya alma, fiyat yayını |
| 4 | Kurumsal/eğitim, liderlik tablosu (sunucuda puan doğrulama), 3. dil | Aynı | Duruma göre |

Geçiş ilkeleri: mevcut oyun yeniden yazılmaz; ücretsiz sahneler `data/scenes.json`'dan okunmaya devam eder, ücretli sahneler aynı şemayla sunucudan gelir. Böylece `scenes.json` şeması paket modelinin tek kaynağı olur.

## 6. Açık sorular (Emre'ye)

1. Önce Türkçe pazar mı, global mi? (Ödeme Yol A / Yol B kararını belirler.)
2. Şirket yapısı: şahıs şirketi var mı, kurulacak mı? Yerel ödeme sağlayıcıları için gerekli. Mali müşavirle döviz geliri/hizmet ihracatı faturalaması konuşulmalı.
3. Apache 2.0 bilerek mi seçildi? Ücretli içerik için ayrı kapalı depo/lisans kabul edilir mi?
4. Veri bölgesi tercihi (AB mi?) ve KVKK danışmanı/avukat var mı?
5. Ücretsiz katman koşulları: ticari ürünü Vercel/Netlify/Cloudflare ücretsiz planında çalıştırmak kabul mü, yoksa ücretli plan bütçesi var mı?
6. Ücretli sahnelerde "kopyalanabilir" riskini kabul düzeyi: Seçenek 2 yeterli mi, 3 mü?
7. Çocuk/öğrenci kullanımı (okullar) KVKK ve yaş doğrulaması gerektirir; ilk yıl hedef mi?

## 7. Doğrulanamayan konular (özet)
- Stripe'ın Türkiye'de doğrudan hesap açma durumu: kaynaklar çelişiyor, resmi sayfa kontrol edilmeli.
- iyzico ve PayTR resmi komisyon tabloları, şahıs şirketi koşulları, blokaj süreleri.
- Paddle/Polar/Lemon Squeezy/Gumroad'ın Türkiye'den satıcı kabulü ve payout detayları. Lemon Squeezy'nin Stripe'a göçü.
- Vercel/Netlify/Cloudflare ücretsiz plan ticari kullanım şartları.
- KVKK ve vergi konularının tamamı: uzman teyidi gerekir.

Kaynaklar (arama sonuçları, hepsi ikincil): osome.com/uk/blog/stripe-account-turkey-guide, incorpuk.com/blog/open-stripe-account-in-turkey, zunapro.com (TR ödeme sistemleri yazıları), dodopayments.com/blogs (Polar, Lemon Squeezy, MoR karşılaştırmaları; rakip yazıları), alexcloudstar.com (MoR 2026), learnwithhasan.com/payment-gateways/country/turkey, ideasoft.com.tr (PayTR ve iyzico), birfatura.com (sanal pos).
