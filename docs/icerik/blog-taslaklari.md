# Blog Yazısı Taslakları (2 adet, TASLAK, yayınlanmadı)

Durum: taslak. Yayın Emre onayına tabidir. Dayanak: `README.md`, `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md`, `docs/mimari/oyun-konfigurasyon-mimarisi.md`, `data/game.config.json`. Yalnızca repoda var olan özellikler anlatılır; Pırıl'ın kimliği ve finalin sonu açıklanmaz.

## Yazı 1: Şafak neden yüzyıldır doğmadı? (Büyücünün Gecesi'nin hikâyesi, spoiler'sız)

Hedef: 600-800 kelime, oyuna ilgi çekmek. Anahtar ifade: "tarayıcıda büyücü oyunu".

**İskelet**
1. **Giriş (kanca):** "Gece Vadisi'nde yüzyıllardır bir mana taşı gündüzü getirirdi. Sonra taş çatladı." Oyunun açılış cümlesi (V): "Şafak yüzyıldır doğmadı."
2. **Kahraman:** Aldemir, Gece Kulesi'nin eski çırağı. Kritik gece nöbette uyuyakalmış; lanetin kalkmasını kendi borcu sayıyor.
3. **Yol arkadaşları:** Baykuş Usta Zerrin ipucu verir (bazen alaycıdır), Pırıl adlı küçük bir ışık yol gösterir, Taşkın adlı taşlaşmış bekçi sonradan katılır (V: `characters`).
4. **Yolculuk:** 9 bölüm: Fısıldayan Orman'dan Gölge Kalesi'ne. Her bölümün ayrı bir hedefi var: kristal topla, hayatta kal, lanet totemlerini yık, patronu yen (V: `levels`). Tamamı listelenir ama hiçbir sürprizi açıklanmaz.
5. **Büyücülük:** İlerledikçe yeni büyüler (Buz Oku, Üçlü Büyü, Yıldırım...) ve yetenekler açılır.
6. **Kapanış:** "Telefonda ya da bilgisayarda tarayıcıdan aç, ilk bölüm birkaç dakika." Bağlantı: https://emreaktepe.github.io/Putthatthere/ . Geri bildirim isteği.

**Doğrulama notları:** "Birkaç dakika" ifadesi: bölüm süreleri 45-100 sn arasındadır (V: `data/game.config.json`), ancak toplam oynanış süresi ölçülmedi; "X saat" denmez.

## Yazı 2: Build'siz bir tarayıcı oyunu nasıl yapıldı? (yapım notları)

Hedef: 700-900 kelime, meraklı geliştiriciler. Anahtar ifade: "Three.js ile tarayıcı oyunu".

**İskelet**
1. **Kısıt:** Derleme adımı yok; saf statik HTML/JS, GitHub Pages'ten yayınlanır (V: `README.md`).
2. **Three.js yerel kopya:** r185 `vendor/` altında; CDN bağımlılığı yok (V).
3. **Ses:** Müzik ve efektler dosya değil, Web Audio ile kodla üretilir (V). Neden: dosya boyutu yok, bölüme göre gam/tempo değişimi.
4. **Veri güdümlü tasarım:** Bölümler, düşmanlar, büyüler `data/game.config.json` içinde; bir doğrulama betiği (`npm run validate`) ve Node testleri var (V).
5. **Yönetim sayfası:** `admin.html` ile düşman/büyü/bölüm formdan düzenlenir, taslak yalnızca tarayıcıda kalır (V).
6. **Mobil:** Joystick + ateş butonu; kamera açıları. Gerçek cihaz performansı ölçülmedi (dürüst not).
7. **Kapanış:** Bağlantı, "nerede takıldı" sorusu.

**Doğrulama notları:** Satır sayısı, performans ve FPS iddiası yazılmaz (ölçülmedi). Yapay zekâyla üretim sürecinden bahsedilecekse Emre karar verir.

## Yayın öncesi kontrol

- [ ] Metinde olmayan özellik (hesap, skor tablosu, çok oyunculu, mağaza uygulaması) yok.
- [ ] Spoiler yok (Pırıl, final).
- [ ] Emre yazıyı okuyup onayladı. Yayın yeri (kendi sitesi mi, Medium/dev.to mu) belirlendi.
- [ ] Ekran görüntüsü kullanılacaksa gerçek oyundan alındı.
