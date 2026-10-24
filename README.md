# Büyücünün Gecesi

Tarayıcıda çalışan, Three.js tabanlı, 9 bölümlük hikâyeli bir büyücü aksiyon oyunu. Büyücü Aldemir, çatlayan Gece Kalbi'ni kurtarmak için lanetli diyarları geçer: mana kristali toplar, ruhlara ve yaratıklara büyü yağdırır, yeni büyüler ve yetenekler kazanır, finalde Gölge Kral'la yüzleşir. Klavye/fare ve mobil (joystick + ateş butonu) ile oynanır. Müzik ve ses efektleri Web Audio ile kodla üretilir.

## Çalıştırma

Build aracı yok: saf statik HTML/JS. Tarayıcılar `file://` ile ES modüllerini yüklemediği için bir statik sunucu gerekir:

```bash
npx serve . -l 8000
# tarayıcıda http://localhost:8000 adresini açın
```

Telefondan denemek için sunucunun yazdığı "Network" adresini (aynı Wi-Fi) kullanın.

## Kontroller

- **Bilgisayar:** WASD / ok tuşları yürü · fare nişan · Boşluk veya tık büyü · 1–7 büyü seç · Q / E / R yetenekler
- **Mobil:** ekranda sürükle = yürü · sağ alttaki ✦ butonu = ateş (nişan otomatik) · alttaki simgeler = büyü değiştir

## Proje yapısı

- `index.html` — tüm oyun (sahne, düşmanlar, bölümler, hikâye, arayüz, ses); tek dosya
- `vendor/` — Three.js r185 (MIT, yerel kopya; CDN bağımlılığı yok)
- `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md` — hikâye, bölüm, düşman, büyü, görsel ve müzik tasarım belgesi
- `.github/workflows/deploy-pages.yml` — `main`'e push'ta GitHub Pages'e dağıtım

## Lisans

Bkz. `LICENSE`. Three.js için `vendor/THREE_LICENSE`.
