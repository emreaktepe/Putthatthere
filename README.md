# HEXORA: Büyücünün Gecesi

**HEXORA** (alt başlık: *Büyücünün Gecesi*, "Karanlığın Kalbi"), tarayıcıda çalışan, Three.js tabanlı, 9 bölümlük hikâyeli bir büyücü aksiyon oyunudur. Büyücü Aldemir, çatlayan Gece Kalbi'ni kurtarmak için lanetli diyarları geçer: mana kristali toplar, ruhlara ve yaratıklara büyü yağdırır, yeni büyüler ve yetenekler kazanır, finalde Gölge Kral'la yüzleşir. Klavye/fare ve mobil (joystick + ateş butonu) ile oynanır. Müzik ve ses efektleri Web Audio ile kodla üretilir.

> **Marka notu:** HEXORA adının tescil, alan adı ve mağaza (Steam/App Store/Play) uygunluğu **doğrulanmadı**; marka kılavuz kitinin kendi notu da bunu belirtir. Yayın öncesi ayrıca araştırılmalıdır. Marka dosyaları `assets/favicon/` altında düz dosyalardır (uygulama ikonu PNG/WebP, paylaşım görseli); HEXORA yazı logosu dosya değil, kodda üretilir (`js/ui/brandmodel.js`).

## Çalıştırma

Build aracı yok: saf statik HTML/JS. Tarayıcılar `file://` ile ES modüllerini yüklemediği için bir statik sunucu gerekir:

```bash
npx serve . -l 8000
# tarayıcıda http://localhost:8000 adresini açın
```

Telefondan denemek için sunucunun yazdığı "Network" adresini (aynı Wi-Fi) kullanın.

## Kontroller

- **Bilgisayar:** WASD / ok tuşları yürü · fare nişan · Boşluk veya tık büyü · 1–7 büyü seç · Q / E / R yetenekler · **Esc / P duraklat** (Devam Et / Haritaya Dön / Ses; sekme gizlenince otomatik)
- **Mobil:** ekranda sürükle = yürü · sağ alttaki ✦ butonu = ateş (nişan otomatik) · alttaki simgeler = büyü değiştir · sol alttaki halka = joystick (dokunduğun yerde belirir) · üst sağdaki düğmeler = Durdur, Kamera, Ses, Harita · HUD'daki 📷 = kamera açısı
- **Kamera:** V (veya 📷) açıyı değiştirir (Yukarıdan / Eğik / Omuz-alçak) · Z / C döndürür · fare tekerleği yakınlaştırır · sağ tuşla sürükleme döndürür. Yürüme kamera-görelidir; seçim `buyucu_kamera` anahtarında saklanır.
- **Akış:** Menü → (giriş) → Harita → bölüm kartı → savaş → ödül/perk → Harita. Kayıt `buyucu_save`; tamamlanan bölümler haritadan "alıştırma" olarak tekrar oynanır (ilerleme değişmez).

## Grafik kalitesi

Ana menüdeki **Grafik: Otomatik / Yüksek / Düşük** düğmesi oyuncu görselini seçer (değişiklik hemen uygulanır; `buyucu_kalite` anahtarında saklanır, admin ayarı değildir). **Yüksek** = ayrıntılı "pro" Aldemir modeli (`js/render/aldemir.js`, ~250 mesh; oyunda birleştirilip ~115 mesh / ~105 çizim çağrısına indirilir), **Düşük** = hafif prosedürel büyücü. **Otomatik**: dokunmatik işaretçi (`pointer: coarse`), `hardwareConcurrency <= 4` ya da `deviceMemory <= 4` ise Düşük, aksi halde Yüksek. Karar mantığı `js/core/quality.js`'te (testli). Pro modelde `player.look` içinden yalnızca `wandGlow` kullanılır; diğer renkler Düşük görünüm içindir.

## Proje yapısı

- `index.html` — tüm oyun (sahne, düşmanlar, bölümler, hikâye, arayüz, ses); tek dosya
- `js/render/decor/` + `js/render/floors/` — kodla üretilen 3B bölüm dekoru (37 tür, Environment Complete v1 paketi; `InstancedMesh`, ışıksız, çarpışmasız) ve 9 canvas zemin ressamı (gri tonlamalı, tema rengiyle çarpılır). Bölüm başına yerleşim/bütçe planı `js/render/sceneryplan.js` (saf veri, testli), kurucular `js/render/scenery.js`; süs dekor yalnız Yüksek grafik kalitesinde, Düşükte çok örnekli dekor yarıya iner.
- `js/render/models/` — kodla üretilen 3B karakter modelleri (Core6 Pro + Full12 v2 paketleri: Pırıl, Ruh, Yarasa, Taş Bekçi, Gölge Kral, Kemik Okçu, Kurt Ruhu, Kor Hortlak, Karanlık Rahip, Lanet Totemi, Kemik Şövalye + ortak `common.js`); oyuna bağlantı `js/render/enemyvis.js` + `enemies.js` (düşmanlar) ve `wizard.js` (Pırıl). 10 düşmanın hepsi grafik kalitesinden bağımsız her zaman bu modellerle çizilir. Aldemir: `js/render/aldemir.js`. Sahne figürleri (Zerrin baykuş, Taşkın, Veyis'in insan hali; savaşa katılmayan, çarpışmasız) `models/zerrin.js`, `taskin.js`, `veyis-insan.js` + saf mantık `js/render/propsvis.js` + sahne yapıştırıcısı `js/render/props3d.js` (flow.js aşamayı bildirir, loop.js tick eder); Düşük kalitede yalnız finaldeki Veyis gösterilir
- `vendor/` — Three.js r185 (MIT, yerel kopya; CDN bağımlılığı yok)
- `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` — hikâye, bölüm, düşman, büyü, görsel ve müzik tasarım belgesi
- `.github/workflows/deploy-pages.yml` — `main`'e push'ta GitHub Pages'e dağıtım

## Yönetim sayfası

`http://localhost:8000/admin.html` (oyun menüsünde "Yönetim"). Düşman, büyü, bölüm, harita, hikâye ve ses ayarları formlardan düzenlenir; değişiklikler yalnız bu tarayıcıda taslak olarak (localStorage) kalır, repoya yazılmaz.

- **Dene:** "Taslakla oyna" -> `index.html?cfg=draft`; bölüm formunda "Bu bölümden başlat" -> `?cfg=draft&dev=1&level=<id>` (kayda yazmaz).
- **Dışa aktar:** tam `game.config.json`, değişiklik yaması ya da Claude için Türkçe yönlendirme paketi (.md). Dosyayı `data/game.config.json` yerine koyup `npm run validate` çalıştırın veya paketi Claude'a verin.
- Taslak adres bazlıdır (localhost ile github.io ayrı).

## Lisans

Bkz. `LICENSE`. Three.js için `vendor/THREE_LICENSE`.
