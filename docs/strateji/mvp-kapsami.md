# İlk Sürüm Kapsamı (v1.0 "Ücretsiz Staj Günü")

Durum etiketleri: VAR = kodda/README'de doğrulandı, YOK = yapılmamış, ÖNERİ = eklenmesi tavsiye edilen.

## 1. Mevcut durumda VAR

| Özellik | Durum | Kaynak |
|---|---|---|
| 5 sahne (metro, otopark, rampa, yaya geçidi, koridor), artan zorluk | VAR | `data/scenes.json` |
| 3B gerçek ölçekli sahne, kamera döndürme/yakınlaşma | VAR | `js/three-app.js` |
| Seç ("that") ve yerleştir ("there") akışı, hayalet önizleme, döndürme (←/→) | VAR | `docs/design/game-design.md` |
| Metre/cm cinsinden sapma, yıldız ve puan (maks. 500 puan, 15 yıldız), rütbe | VAR | `js/scoring.js` |
| Sonuç açıklaması + doğru konum gösterimi | VAR | `js/ui-results.js` |
| TR/EN arayüz | VAR | `data/strings.*.json` |
| GitHub Pages yayını | VAR | `.github/workflows/deploy-pages.yml` |

## 2. Yayın için kullanıcı hikâyeleri ve kabul kriterleri (ÖNERİ, çoğu YOK)

**H1 — Başlama.** Oyuncu olarak, kurulumsuz tek tıkla oynamaya başlamak istiyorum.
- Kabul: Sayfa açılınca giriş ekranı gelir; hesap/ödeme istenmez. (VAR; dokunma/mobil cihaz davranışı test edilmedi.)

**H2 — Oynanış.** Oyuncu olarak nesneyi alıp sahnede doğru yere koymak ve sapmamı görmek istiyorum.
- Kabul: 5 sahne tamamlanır, her sahnede sapma ve yıldız görünür. (VAR)

**H3 — Paylaşım (YOK, ÖNERİ).** Oyuncu olarak sonucumu arkadaşlarımla paylaşmak istiyorum.
- Kabul: Kapanış ekranında "Skoru kopyala" düğmesi, rütbe ve puanı içeren kısa metin panoya kopyalar. Kişisel veri içermez.

**H4 — Tekrar oynama (YOK, ÖNERİ).** Oyuncu olarak en iyi skorumu hatırlamak istiyorum.
- Kabul: En iyi skor `localStorage`'da tutulur, hesap gerekmez; tarayıcı depolaması kapalıysa oyun yine çalışır.

**H5 — Ölçüm (YOK, ÖNERİ).** Ürün sahibi olarak üç temel metriği ölçmek istiyorum (`brief.md`).
- Kabul: Oturum başlangıcı, sahne tamamlama, oyun sonu, paylaş tıklaması sayılır. Çerezsiz/anonim çözüm tercih edilir. Kişisel veri veya üçüncü taraf betik eklemek Emre onayı ve gizlilik metni gerektirir.

**H6 — Yeni sahne ilgisi (YOK, ÖNERİ).** Oyuncu olarak yeni sahneler çıkınca haberdar olmak istiyorum.
- Kabul: "Yeni sahneler: yakında" bölümü ilgi tıklamasını sayar. E-posta toplanacaksa ayrıca onay gerekir. Fiyat gösterilmez.

**H7 — Erişilebilirlik ve cihaz (YOK, ÖNERİ).** Oyuncu olarak telefonda da oynayabilmek istiyorum.
- Kabul: Dokunmatik cihazlarda sürükleme/yerleştirme ayrımı çalışır ve düzen küçük ekrana sığar. Test edilmedi, ayrıca klavye alternatifi değerlendirilmeli (oyun erişilebilirlik temalı olduğundan tutarlılık beklenir).

**H8 — İçerik doğruluğu (YOK, ÖNERİ).** Oyuncu olarak sahne kurallarının doğru olduğuna güvenmek istiyorum.
- Kabul: Her sahnenin açıklamasında kaynak notu var (`sourceNotes`, VAR); Türkiye'ye özgü standart farkı olan sahnelerde not eklenir. Resmi kaynaklarla karşılaştırma YAPILMADI.

## 3. Bilerek kapsam dışı (v1.0)

- Ücretli sahne paketleri, ödeme, hesap/giriş (talep doğrulanana kadar).
- Fiyat veya satın alma düğmesi yayınlamak.
- Reklam (kısa bir oyunda deneyimi bozar ve gelir düşük; Varsayım).
- Abonelik, liderlik tablosu (sunucu ve kötüye kullanım yönetimi gerektirir).
- Ses girişi ("put that there" konuşma demosu): tasarımda bilinçli olarak dışarıda.
- Yeni sahne üretimi ve sahne editörü.
- Mobil uygulama mağazası / Steam sürümü.
- Kurumsal/eğitim paneli.
- Üçüncü dil.

## 4. Sonraki odalara notlar

- Mimari: ücretli sahne için sunucu tarafı yetkilendirme gerekir (istemci kilidi aşılır); sahne verisi şemasını paketlemeye hazırla.
- Finans: yalnızca test modu; fiyat ve canlı anahtar için onay şart.
- Güvenlik: analitik/e-posta eklenirse KVKK metni.
- Test/yayın: mobil dokunma, WebGL desteği olmayan cihaz davranışı kontrol edilmedi.
