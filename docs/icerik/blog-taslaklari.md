# Blog Yazısı Taslakları (2 adet, TASLAK, yayınlanmadı)

Dayanak: `docs/design/research.md` (kaynak notları genel/yaygın kabul gören kurallardır, belirli bir ülkenin mevzuat maddesi değildir). Etiketler: **[R]** research.md'de var; **[DOĞRULANMAMIŞ]** bağımsız kaynakla teyit edilmedi, yayından önce kontrol edilmeli. Web erişimi kullanılmadı; yeni olgusal iddia eklenmedi.

Ortak uyarı kutusu (iki yazının sonuna): "Bu yazı resmi bir eğitim veya mevzuat kaynağı değildir. Anlatılan kurallar ABD/uluslararası tarzı rehberlere dayanır; Türkiye'deki yönetmelik ve standartlarla karşılaştırılmadı. Gerçek bir uygulama için ilgili yerel mevzuata ve uzmana bakın."

---

## Yazı 1: Metro peronundaki sarı şerit neden kenara bitişik değil?

**Başlık:** Metro peronundaki sarı şerit kenardan ne kadar geride durur?
**Meta açıklama (≤155 kr):** Peron kenarındaki kabartmalı uyarı şeridi neden kenara yapışık değil? Genel rehberlere göre mesafe ve nedeni; sonra oyunda dene.
**Anahtar kelime fikri (Varsayım, arama hacmi ölçülmedi):** metro peron uyarı şeridi, dokunsal yüzey.

**Taslak metin**

Metroda beklerken ayağının altındaki kabartmalı sarı şeride hiç dikkat ettin mi? Genellikle yuvarlak kabartmalıdır ve peron boyunca uzanır. [R]

Akla gelen ilk tahmin, şeridin peronun tam kenarında olduğu yönünde. Genel rehberlere göre durum farklı: şerit kenara bitişik değil, kenardan belirli bir güvenlik payı bırakılarak döşenir. Raylı sistem rehberlerinde sık anılan aralık kabaca 500-700 mm'dir (yaklaşık 20-28 inç). Genel tehlike uyarıları için anılan yaklaşık 300 mm'den daha fazladır. [R; kesin değer ülkeye/idareye göre değişebilir, TR için DOĞRULANMAMIŞ]

Neden geride? İki sebep:
1. Görme engelli bir yolcu bastonuyla ya da ayağıyla şeridi fark edip, boşluğa varmadan durabilsin. [R]
2. Herkes, ani gelen bir trenin yanında kenara çok yakın durmasın; şerit bir güvenlik tamponu oluşturur. [R]

Şerit tek bir noktada değil, bekleme alanı boyunca kesintisiz sürer. [R]

**Şimdi dene:** Oyunun ilk sahnesi tam olarak bu. Eksik şeridi peronda doğru yere koyarsan ne kadar saptığını santimetreyle görürsün ("Sapma: 38 cm" gibi). 5 sahne, kayıt yok: https://emreaktepe.github.io/Putthatthere/

(Uyarı kutusu)

**İç bağlantı önerileri:** Yazı 2; ana sayfa (oyun); gelecekte "oyun nasıl çalışır" sayfası.
**Notlar:** Fotoğraf kullanılacaksa lisanslı/kendi çekimimiz olmalı. "Tüm metrolarda böyledir" gibi genelleme yapılmaz.

---

## Yazı 2: Yangın söndürücü duvarda ne kadar yüksekte asılır?

**Başlık:** Yangın söndürücü duvara kaç metre yükseğe asılır?
**Meta açıklama (≤155 kr):** Koridordaki söndürücünün asılma yüksekliği için genel NFPA 10 tarzı rehber: üst nokta yaklaşık 1,5 m. Sonra oyunda dene.
**Anahtar kelime fikri (Varsayım):** yangın söndürücü montaj yüksekliği.

**Taslak metin**

Koridordaki kırmızı tüp yerde mi durur, duvarda mı? Ve duvarda ne kadar yükseklikte? Oyun, bunu "sapma" ile ölçüyor; aşağıda genel kural var.

Genel (NFPA 10 tarzı) rehbere göre söndürücü koridorda kolay görülebilir ve erişilebilir bir noktaya, çoğunlukla çıkışa yakın ya da belirgin bir tehlike kaynağının yanına, duvara **dikey** olarak monte edilir. [R]

Yükseklik: ağırlığı yaklaşık 18 kg (40 lb) veya altında olan söndürücülerde tüpün **üst noktası** yerden en fazla yaklaşık 1,5 m (5 fit) yükseklikte olmalıdır; alt kısım yerden birkaç santim yukarıda kalır. Amaç, hem uzun hem kısa boylu kişilerin hızla kavrayabilmesi. [R; ağır söndürücüler için farklı değer vardır, bu yazıda ele alınmadı, DOĞRULANMAMIŞ; TR yönetmeliği karşılaştırılmadı]

Gizli tuzak: 3B koridor sahnesinde hem duvar hem zemin yerleştirilebilir yüzeydir. Söndürücüyü yanlışlıkla yere koymak mümkün ve oyunda sıfır puan demek. (Oyun tasarımı, `game-design.md`.)

**Şimdi dene:** Koridor sahnesi 5. sahne. https://emreaktepe.github.io/Putthatthere/

(Uyarı kutusu)

**İç bağlantı önerileri:** Yazı 1; ana sayfa.
**Notlar:** "Yasal zorunluluk", "mevzuata uygun" denmez. Bina yangın yönetmeliği sorusu okura yönlendirilir, yanıtlanmaz.

---

## Yayın öncesi kontrol

- [ ] Rakamlar (500-700 mm, ~1,5 m) bağımsız kaynakla teyit edilsin ya da "genel rehber" ifadesi korunsun.
- [ ] Emre onayı; yayın yeri (blog altyapısı) henüz yok, web-seo odasının işi.
