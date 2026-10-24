# Ölçüm Planı (ÖNERİ, canlı ölçüm eklenmedi, onay bekliyor)

Durum: Koda hiçbir takip betiği eklenmedi. Gerçek ölçüm ID'si yok. Canlı ölçüm kişisel veri/yasal metin içerdiği için Emre'nin onayına tabidir (`onay_iste`). Dayanak: `docs/pazarlama-stratejisi/lansman-plani.md` (anonim, çerezsiz tercih). Ayrıntılı olay tablosu ve huni: `docs/analitik/olcum-plani.md`.

Önemli teknik not: Site GitHub Pages'te statik ve HTTP başlığı/sunucu kodu yok. Depo herkese açıksa ölçüm domain/ID'leri de herkese görünür olur (gizli değildir; yine de gizli API anahtarı koda girmemeli).

## 1. Seçenekler

| Seçenek | Çerez / onay | KVKK | Maliyet (Varsayım, doğrulanmadı) | Özel olay | Artı | Eksi |
|---|---|---|---|---|---|---|
| GoatCounter | Çerezsiz, kimlik yok | Kolay; yine de gizlilik notu önerilir | Kişisel olmayan kullanım için ücretsiz | Var (`goatcounter.count({event:true})`) | Sıfır maliyet, hafif | Huni/olay analizi sınırlı |
| Plausible | Çerezsiz | Kolay | Ücretli (aylık) ya da kendi sunucu | Var (`plausible(ad, {props})`) | İyi olay ve hedef arayüzü, props | Bütçe kalemi; Emre onayı |
| GA4 | Çerez + onay bandı şart | Zor: açık rıza, aydınlatma metni, yurt dışı aktarım | Ücretsiz | Çok güçlü | Reklam platformlarıyla entegre | Onay bandı oyun deneyimini bozar, veri kaybı, yasal yük |

**Öneri:** Önce GoatCounter (veya bütçe izin verirse Plausible). Çerezsiz olduğu için onay bandı gerekmez, ancak kısa bir "Anonim ölçüm yapılıyor" notu onaylanmalı. GA4 yalnızca ücretli reklam için dönüşüm izleme gerekirse ve açık rıza bandıyla düşünülür.

## 2. Yapılandırma (placeholder; gerçek değer Emre'den)

- `GOATCOUNTER_KOD`: GoatCounter site kodu (ör. `kod.goatcounter.com`).
- `PLAUSIBLE_ALAN_ADI`: Plausible'da kayıtlı alan adı.
- `GA4_OLCUM_ID`: yalnızca GA4 seçilirse, onay bandına bağlı.
- Hiçbiri depoya gerçek değerle yazılmaz; statik sitede değer HTML'e gömülecekse bunun herkese açık olduğu bilinmeli.

## 3. Olay adları (ortak sözlük, Türkçe, snake_case)

| Olay | Ne zaman | Özellikler |
|---|---|---|
| `oturum_basladi` | Başlat düğmesine basılınca | `cihaz` (mobil/masaustu) |
| `bolum_baslatildi` | Bölüm kartından savaşa geçilince | `bolum_no` (1-9) |
| `bolum_tamamlandi` | Bölüm hedefi tamamlanınca | `bolum_no`, `alistirma` (evet/hayir) |
| `bolum_kaybedildi` | Can bitince ya da süre dolunca | `bolum_no` |
| `oyun_bitti` | 9. bölüm (Gölge Kralı yenme) final ekranı | `cihaz` |
| `kamera_degistirildi` | İsteğe bağlı: kamera açısı seçimi | `aci` |

Kural: kullanıcı, IP, kimlik, serbest metin ya da kayıt içeriği göndermeyin; skor gibi değerler gerekirse kovalanır. Bu olayların hiçbiri bugün kodda yok (V).

## 4. Huni ve metrikler (lansman planı Bölüm 6 ile uyumlu)

Ziyaret, başlama (`oturum_basladi`), 1. bölüm tamamlama, 3. bölüme ulaşma, final ekranı (`oyun_bitti`). Bölüm bazlı kayıp `bolum_kaybedildi`/`bolum_baslatildi` ile okunur ve denge ayarının veri kaynağıdır.

## 5. Uygulama adımları (onaydan sonra)

1. Emre aracı seçer ve onaylar; gizlilik notu metni onaylanır.
2. Tek bir ölçüm modülü (`js/analytics.js`) eklenir; araç betiği `index.html`'e girer. `admin.html` ölçülmez.
3. Olay çağrıları oyun akışındaki ilgili noktalara (bölüm başı/sonu, ölüm, final) eklenir; Node testleri etkilenmemeli (`npm test`).
4. UTM'li deneme ziyareti panelde doğrulanır.

Durum: **onay bekliyor**.
