# Şunu Şuraya Koy — İlk Yayın Stratejisi (Brief)

Durum: ÖNERİ taslağı. Hiçbir fiyat veya duyuru yayınlanmamıştır. Kaynak: `README.md`, `docs/design/*`, `data/scenes.json`, kaynak kod.
Not: Bu belgedeki "(V)" doğrulanmış/koddan teyit edilmiş, "(Varsayım)" doğrulanmamış bilgiyi gösterir.

## 1. Tek cümlelik tanım

Şunu Şuraya Koy, gerçek dünya erişilebilirlik, trafik ve yangın güvenliği kurallarını 3B sahnelerde "eksik nesneyi doğru yere koyarak" öğrenmek ve sınamak isteyen meraklı yetişkinlere yönelik, tarayıcıda çalışan kısa bir bulmaca oyunudur.

Çözdüğü problem: Bu kurallar (peron uyarı şeridi mesafesi, söndürücü yüksekliği, kaldırım rampası yönü) herkesin her gün gördüğü ama kimsenin bilinçli olarak öğrenmediği bilgilerdir. Oyun bunu ders anlatmadan, "sapma: 38 cm" gibi somut geri bildirimle eğlenceli hale getirir.

## 2. Hedef kitle

Öncelik sırasıyla (hepsi Varsayım; kullanıcı araştırması yapılmadı):

1. **Birincil: Meraklı genel oyuncular (18-45, Türkçe konuşan).** Kısa tarayıcı bulmacası, "dahi testi" tarzı paylaşılabilir skor arayanlar. Kurulum yok, 5 sahne yaklaşık birkaç dakika.
2. **İkincil: Şehircilik, mimarlık, inşaat, iş sağlığı ve güvenliği (İSG) öğrencileri ve eğitmenleri.** Ders girişinde 5 dakikalık etkinlik olarak kullanabilir. Kurumsal/eğitim satışına açılabilecek ama ilk sürümde hedeflenmiyor.
3. **Üçüncül: İngilizce konuşan oyuncular.** Arayüz EN desteği var (V), ancak kurallar ABD/uluslararası tarzı (MUTCD, NFPA 10, ADA). Türkiye'ye özgü standartlar (TS) kullanılmadığı için yerelleştirme doğruluğu ayrıca incelenmeli (Varsayım/risk).

## 3. Ürünün bugünkü durumu (V, koddan)

- 5 sahne: metro peronu, otopark, kaldırım rampası, yaya geçidi, koridor (yangın söndürücü). Zorluk 1 -> 5 artar.
- Tek oturumluk akış, 500 puan / 15 yıldız üzerinden, rütbe sistemi, TR/EN arayüz.
- Saf statik HTML/JS + Three.js, GitHub Pages'te canlı. Hesap, sunucu, ödeme, analitik, ses, ilerleme kaydı YOK. Tarayıcıda yalnızca dil tercihi saklanıyor (`localStorage`).
- Lisans: depoda Apache 2.0 `LICENSE` var (V). Bu, kodun başkaları tarafından ticari kullanım/kopyalanmasına izin verir; ücretli içerik stratejisi için önemli bir karardır (bkz. `fiyatlandirma.md`, Riskler).

## 4. Öneri özeti

- İlk yayın: ücretsiz, kayıtsız, mevcut 5 sahne ile "Ücretsiz Staj Günü". Ödeme yok.
- Ölçüm ve paylaşım ekleyerek gerçek talebi test et, sonra ücretli sahne paketini (ör. "Şantiye", "Hastane") ekle.
- Gelir modeli önerisi: ücretsiz çekirdek oyun + tek seferlik ücretli sahne paketleri (ayrıntı `fiyatlandirma.md`).

## 5. Başarı metrikleri (ilk sürüm için 3 adet)

| Metrik | Tanım | Neden | Başlangıç hedefi (Varsayım) |
|---|---|---|---|
| Tamamlama oranı | 5. sahne sonuç ekranına ulaşan oturumlar / başlayan oturumlar | Oyun akışının ve zorluk eğrisinin çalıştığını gösterir | %50 üzeri |
| Tekrar oynama / geri dönüş oranı | 7 gün içinde ikinci oturumu açan tekil ziyaretçi oranı | Paketlere ödeme isteğinin öncü göstergesi | %15 üzeri |
| Paylaşım ve "paket ilgisi" oranı | Skor paylaşan veya "yeni sahneler" bekleme listesine yazılan oturumlar / tamamlanan oturumlar | Organik büyüme ve ücretli ürüne talep | %5 üzeri |

Not: Bugün analitik yok (V). Bu metrikler ölçülemez; ölçüm eklemek ilk işlerden biri (gizlilik/KVKK onayı gerekir: kişisel veri içeren her değişiklik onay kapısına tabi). Hedef sayılar benchmark'a dayanmaz, yalnızca başlangıç tahminidir.

## 6. Açık sorular (Emre'ye)

1. Hedef önce Türkçe pazar mı, global mi?
2. Apache 2.0 lisansı bilerek mi seçildi? Ücretli sahne paketleri için kod/içerik lisansı ayrımı gerekir.
3. Eğitim/kurumsal kullanım ilk yıl için hedef mi?
4. Yayın kanalı: yalnızca GitHub Pages mı, itch.io / Steam / mobil sarmalayıcı da düşünülüyor mu?
