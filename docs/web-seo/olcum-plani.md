# Ölçüm Planı (ÖNERİ — canlı ölçüm eklenmedi, onay bekliyor)

Durum: Koda hiçbir takip betiği eklenmedi. Gerçek ölçüm ID'si yok. Canlı ölçüm kişisel veri/yasal metin içerdiği için Emre'nin onayına tabidir (`onay_iste`). Dayanak: `docs/pazarlama-stratejisi/lansman-plani.md` (anonim, çerezsiz tercih), `docs/strateji/mvp-kapsami.md` H5.

Önemli teknik not: Site GitHub Pages'te statik ve HTTP başlığı/sunucu kodu yok. Depo Apache 2.0 olduğundan ve kaynak açık olduğundan, ölçüm domain/ID'leri herkese görünür olur (gizli değildir; yine de gizli API anahtarı koda girmemeli).

## 1. Seçenekler

| Seçenek | Çerez / onay | KVKK | Maliyet (Varsayım, doğrulanmadı) | Özel olay | Artı | Eksi |
|---|---|---|---|---|---|---|
| GoatCounter | Çerezsiz, kimlik yok | Kolay; yine de gizlilik notu önerilir | Kişisel olmayan kullanım için ücretsiz | Var (`goatcounter.count({event:true})`) | Sıfır maliyet, hafif | Huni/olay analizi sınırlı |
| Plausible | Çerezsiz | Kolay | Ücretli (aylık) ya da kendi sunucu | Var (`plausible(ad, {props})`) | İyi olay ve hedef arayüzü, props | Bütçe kalemi; Emre onayı |
| GA4 | Çerez + onay bandı şart | Zor: açık rıza, aydınlatma metni, yurt dışı aktarım | Ücretsiz | Çok güçlü | Reklam platformlarıyla entegre | Onay bandı oyunu bozar, veri kaybı, yasal yük |

**Öneri:** Önce GoatCounter (veya bütçe izin verirse Plausible). Çerezsiz olduğu için onay bandı gerekmez, ancak gizlilik metni (kısa bir "Anonim ölçüm yapılıyor" notu) onaylanmalı. GA4, yalnızca Hafta 3 ücretli reklam için dönüşüm izleme gerekirse ve açık rıza bandıyla düşünülür.

## 2. Yapılandırma (placeholder; gerçek değer Emre'den)

- `GOATCOUNTER_KOD` — GoatCounter site kodu (ör. `kod.goatcounter.com`).
- `PLAUSIBLE_ALAN_ADI` — Plausible'da kayıtlı alan adı.
- `GA4_OLCUM_ID` — yalnızca GA4 seçilirse (`G-XXXXXXX`), onay bandına bağlı.
- Hiçbiri depoya gerçek değerle yazılmaz; statik sitede değer HTML'e gömülecekse bunun herkese açık olduğu bilinmeli.

## 3. Olay adları (ortak sözlük, Türkçe, snake_case)

| Olay | Ne zaman | Özellikler |
|---|---|---|
| `oturum_basladi` | "Başla" tıklanınca | `dil` (tr/en) |
| `sahne_baslatildi` | Sahne yüklenince | `sahne_no` (1-5) |
| `sahne_tamamlandi` | Yerleştirme onaylanıp sonuç gösterilince | `sahne_no`, `yildiz` (0-3), `sapma_cm` aralığı (kova) |
| `oyun_bitti` | 5. sahne sonuç/kapanış ekranı | `toplam_puan` (kova), `rutbe` |
| `skor_paylasildi` | "Skoru kopyala" tıklanınca (özellik henüz YOK) | `rutbe` |
| `yeni_sahne_ilgi` | "Yeni sahneler" ilgi düğmesi (YOK) | — |
| `dil_degistirildi` | TR/EN düğmesi | `dil` |
| `webgl_yok` | WebGL başlatılamadı | — |

Kural: Ham sapma/skor yerine kovalar; kullanıcı, IP, kimlik, serbest metin göndermeyin.

## 4. Huni ve metrikler (lansman planı Bölüm 6 ile uyumlu)

Ziyaret (sayfa görüntüleme) -> `oturum_basladi` -> `sahne_tamamlandi` (sahne_no=1) -> `oyun_bitti` -> `skor_paylasildi`.
Tamamlama = `oyun_bitti` / `oturum_basladi`. Hedefler lansman planında (Varsayım).

## 5. Uygulama adımları (onaydan sonra)

1. Emre aracı seçer, hesap açar, kodu/alan adını verir.
2. Gizlilik notu metni onaylanır (yasal metin).
3. Küçük bir `js/analytics.js` sarmalayıcı: `olay(ad, props)`; araç yüklenmemişse sessizce hiçbir şey yapmaz. Ana oyun mantığına bu olay çağrıları eklenir (Geliştirme/Analitik odası; bu oda JS'e dokunmadı).
4. UTM'li kampanya bağlantıları (ör. `?utm_source=reddit`) Hafta 3 öncesi tanımlanır.
5. Doğrulama: tarayıcı ağ sekmesinde yalnızca beklenen istek, çerez yok.

Durum: **onay bekliyor**.
