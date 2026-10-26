# Ücretsiz 3B varlık kaynakları ve entegrasyon planı

Durum: ÖNERİ + araştırma notu. Hiçbir dış model indirilmedi, repoya girmedi. Aşağıdaki bilgiler 26 Ekim 2026'da kaynak sayfalarından okundu; lisans metinleri satır satır doğrulanmadı (sayfaların kendi özetidir).

## 1. Kaynaklar

| Kaynak | Ne sunuyor | Lisans (sayfa özeti) | Erişim | Durum |
|---|---|---|---|---|
| **threejsassets.com/assets/free** | 937 ücretsiz GLB, haftalık güncellenir; web için düşük poligon (low-poly) stili | "Ücretsiz indir, ticari kullanım serbest, atıf gerekmez" (sayfa özeti; tam lisans metni sayfada yok) | İndirmek için **ücretsiz hesapla giriş gerekli** (kart yok) | Emre indirir; biz hesap açmayız |
| **NVIDIA ücretsiz varlık platformu** | Emre "NVIDIA'nın yeni ücretsiz varlık platformu" dedi | **Doğrulanmadı.** Arama adıyla bulamadı; Omniverse "indirilebilir varlık paketleri" ve USD örnek verileri var ama lisansı görülmedi. Omniverse ürün lisansları ayrıdır. | bilinmiyor | **Emre'den platformun adı/adresi gerekli** |
| Alternatifler (öneri, doğrulanmadı) | CC0 kaynaklar (Poly Haven, Kenney, Quaternius gibi), Khronos örnek varlıkları (modele göre CC BY 4.0) | Dosya başına kontrol | herkese açık | gerekirse |

Sayfada görülenler (threejsassets): "Props & interiors" (~1150), "Nature" (168; ölü ağaç, huş, selvi, kaya/boulder çeşitleri), zindan parçaları (koridor, hücre kapısı, sandık), fener, fıçı. **Kristal** ve **karakter** ilk 100 bin karakterlik okumada görünmedi (sayfanın kalanı okunmadı). Yani: mevcut sahne dekoru ve prop çeşitliliği için uygun olabilir; Aldemir/düşman gibi karakterler için değil (bizim kodla üretilmiş 15 modelimiz zaten var).

## 2. Neye yarar, neye yaramaz

- **Yarar (öneri):** sahne ayrıntı propları (fener, sandık, fıçı, kemik/zindan parçaları), yeni 13+ bölüm teması için dekor çeşitliliği, ölü ağaç/kaya çeşitleri, hazine/ödül sandığı gibi yeni etkileşimler.
- **Yaramaz/riskli:** Stil uyumu (bizim paletimiz mor/altın fantezi; free low-poly "stylised" paketler farklı olabilir): renk ve malzeme düzeltmesi gerekebilir; karakter/düşman değişimi gerekmez; kristaller bizim kodla üretilen `big-crystal` vb. ile zaten var.
- **Maliyet:** her `.glb` için indirme, inceleme, poligon/doku ölçümü, malzeme tonlaması, mobil bütçe testi gerekir.

## 3. Çalışma akışı (hesap/giriş gerektirdiği için Emre ile birlikte)

1. **Emre** threejsassets.com'a ücretsiz hesapla giriş yapıp seçtiği `.glb` dosyalarını `assets/_incoming/` (gitignore'lu, yerel) klasörüne koyar; her dosya için kaynak URL'sini ve sitedeki lisans satırını (varsa ekran görüntüsü) `assets/_incoming/KAYNAKLAR.txt` içine yazar. NVIDIA platformu için aynısı + platformun adı/adresi.
2. **Varlık uzmanı** (yeni oda: `varlik-uzmani`) her dosyayı inceler: lisans kaydı, boyut, üçgen/malzeme/doku sayısı, hasar (NaN, eksik doku), stil uygunluğu; uygun olanları seçer ve `assets/models/` altına küçültülmüş/optimize edilmiş olarak koyar, `assets/models/LICENSES.json` içine kaynak, URL, lisans, erişim tarihi, atıf gerekliliği, dosya özetini (hash) yazar. **Lisansı doğrulanamayan dosya repoya girmez.**
3. **Geliştirici** yükleyiciyi ekler (aşağıda), sahne planına (`sceneryplan.js`) bağlar, kalite ayarına (süs dekor yalnızca Yüksek) göre gösterir.

## 4. Teknik gereksinimler (henüz YAPILMADI)

- **Yükleyici:** Three.js r185 `GLTFLoader` addon'u repoda YOK (`vendor/addons` temizlenmişti). Resmi `three` paketinden `examples/jsm/loaders/GLTFLoader.js` (+ gerekli `utils`) yerel olarak `vendor/addons/` altına eklenmeli (MIT, `vendor/THREE_LICENSE` ile uyumlu); ağdan yükleme yok. Draco/meshopt sıkıştırma kullanılacaksa decoder dosyaları da yerel olmalı (ek boyut).
- **Bütçe:** dekor props için tek örnek ≤ 1.500 üçgen (çok kez çiziliyorsa ≤ 500), toplam sahne ≤ 80 bin üçgen ve ≤ 60 çizim çağrısı (mevcut hedef); doku varsa ≤ 512 px, toplam dış varlık paketi ≤ 2 MB (varsayım, mobil ağ).
- **Malzeme:** modellerin renkleri bölüm paletine çekilmeli (`setColorAt`/malzeme tonu); PBR dokulu paketler mobilde pahalıdır.
- **Güvenlik:** `.glb` yalnızca veri; yine de boyut sınırı, doku boyutu sınırı, harici URI (`http://` dokular) reddi; yükleme hatasında kodla üretilen dekora/boş geçişe düşme.
- **Test:** üçgen/malzeme ölçümü Node'da, yükleme hatası yedeği, `dispose`.

## 5. Emre'den gerekenler

1. **NVIDIA platformunun adı/adresi** (ve oradan indirilecek varlıkların lisans sayfası).
2. Hangi dekor/prop'ları istiyorsun? Öneri: önce 10-15 küçük `.glb` (fener, sandık, fıçı, ölü ağaç, kaya, zindan/mağara parçası) ile pilot.
3. `.glb` dosyalarını `assets/_incoming/` klasörüne koyduğunda haber ver.
