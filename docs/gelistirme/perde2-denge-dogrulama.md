# Perde II denge doğrulaması

1 Kasım 2026: kullanıcı mevcut test denge kurallarının esas alınmasını onayladı. Bu not, önceki savaş tasarımı tablosundaki ilgili karşıtlık satırlarının güncellemesidir.

- Alfa Kurt: Ateş yanında Arcane da etkili. Buz bağışıklığı ve Yıkım direnci korunur; M1 için iki etkili karşılık vardır.
- Kalkan Nöbetçisi: Yıldırım normal, Işık dirençli. Yıkım etkili; Arcane/Zehir direnci ve yönlü kalkan korunur. Böylece tek silah üstünlüğü azalır ve Işık tüm düşmanlara genel çözüm olmaz. Nova'nın hasarı veya bekleme süresi değiştirilmez.
- Final başlangıcına üç Kemik Okçu eklenir. Daha uzun kampanyada biriken oyuncu gücüne karşı finalin zirve olması korunur: statik model Z=2.44, p=0.52 (önce Z=1.92, p=0.67). Mevcut hedef 0.40 ve mevcut ±0.13 toleransı değiştirilmedi. Boss canı ve davranışı korunur.

Testlerde eski 11 bölüm/11 tema/10 düşman kapsamı, 19 bölüm/18 tema/20 düşmana genişletildi. Eski içerik eşdeğerliği korunur; değişen Kristal Yatağı ve yeni Perde II bölümleri/düşmanları/temaları sabit `tests/fixtures/perde2.json` referansı ile bütünüyle karşılaştırılır. Matris artık mevcut 20 düşmanın her elementini denetler. Beceri sırası, ödül ilerlemesi ve Don Hortlağı'nın Yıldırım karşıtlığı kapsanır. M1–M4 eşikleri veya test toleransları genişletilmez.

Remote main başlangıcı: 274/274; PR düzeltme öncesi: 263/274; düzeltme sonrası: 274/274. Statik model ve otomatik arayüz kontrolleri, gerçek oyuncularla uzun süreli denge testinin yerine geçmez.
