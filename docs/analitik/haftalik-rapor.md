# Haftalık Büyüme Raporu: Şablon ve İlk Hafta Metrikleri

Durum: ŞABLON. Ölçüm kurulu değil, yayın/lansman yapılmadı; hiçbir gerçek veri yok. Aşağıdaki tüm sayı alanları boş bırakıldı. Hedefler `docs/pazarlama-stratejisi/lansman-plani.md` §6'dan alınmıştır ve oradaki gibi Varsayım'dır (benchmark değil).
Tanımlar için: `docs/analitik/olcum-plani.md`.

## 1. İlk hafta (Hafta 1) izlenecek metrikler

| Metrik | Tanım | Hafta 1 hedefi (Varsayım, lansman planı) | Veri kaynağı | Şu an |
|---|---|---|---|---|
| Ziyaretçi | Tekil ziyaretçi (araç tahmini) | 100-300 | Araç sayfa görüntüleme | veri yok |
| Başlama oranı | `oturum_basladi` / ziyaret | %50+ | Araç + olay | veri yok |
| Aktivasyon | `bolum_tamamlandi`(1) / `oturum_basladi` | %60+ | Olay | veri yok |
| Derinlik | `bolum_tamamlandi`(3) / `oturum_basladi` | %30+ | Olay | veri yok |
| Bölüm başarı oranı | `bolum_tamamlandi`(n) / `bolum_baslatildi`(n) | hedef konmadı | Olay | veri yok |
| Tamamlama | `oyun_bitti` / `oturum_basladi` | hedef konmadı | Olay | veri yok |
| Geri dönüş | 7 gün içinde ikinci oturum | %15+ (Hafta 2'de ölçülür) | Çerezsiz ölçümde kişi tanınmaz; ölçülemeyebilir | ölçülemeyebilir |
| Cihaz dağılımı | `cihaz` özelliği (mobil/masaüstü) | hedef konmadı | Olay | veri yok |
| Kayıt / ödeme | Üründe yok | uygulanamaz | uygulanamaz | uygulanamaz |
| Nitel geri bildirim | Yumuşak lansmandan gelen mesaj/yorumlar | hedef konmadı | Elle | veri yok |

Hafta 1 çoğunlukla tanıdıklara gönderimdir (lansman planı); sayıların kitleyi temsil etmediği rapora yazılır.

## 2. Haftalık rapor şablonu

Doldurma kuralları: Veri yoksa "veri yok" yazılır. Tahmin, ortalama alma ya da geçen haftadan taşıma yapılmaz. Payda 20'nin altındaysa yüzde yerine "x/y" yazılır. Uygulanamaz olan satır "uygulanamaz" yazılır.

```
# Haftalık Büyüme Raporu: Hafta __ (başlangıç: __ / bitiş: __)

Hazırlayan: analitik   Veri kaynağı ve çekilme tarihi: __
Ölçüm durumu: kurulu / kurulu değil   Son doğrulama tarihi: __
Bu hafta yapılan yayın/harcama (onaylı olanlar): __

## 1. Özet (en çok 3 madde, yalnızca ölçülmüş şeyler)
- __

## 2. Huni (tüm kanallar)
| Basamak | Bu hafta | Geçen hafta | Hedef | Not |
| Ziyaret | __ | __ | __ | |
| oturum_basladi | __ | __ | | |
| bolum_tamamlandi (1) | __ | __ | | |
| bolum_tamamlandi (3) | __ | __ | | |
| oyun_bitti | __ | __ | | |
| Aktivasyon oranı | __ | __ | %60+ | |
| Derinlik oranı | __ | __ | %30+ | |

## 3. Kanal bazında
| Kanal (utm_source) | Ziyaret | oturum_basladi | bolum1 | oyun_bitti | Aktivasyon oranı | Nakit harcama | AOBM |
| reddit | __ | __ | __ | __ | __ | 0 (organik) | hesaplanmaz |
| linkedin | __ | __ | __ | __ | __ | 0 (organik) | hesaplanmaz |
| shorts/reels | __ | __ | __ | __ | __ | 0 (organik) | hesaplanmaz |
| meta (ücretli) | __ | __ | __ | __ | __ | __ ₺ (panel) | __ ₺ |
| doğrudan / bilinmiyor | __ | __ | __ | __ | __ | 0 | hesaplanmaz |
AOBM = nakit harcama / kanalın bolum_tamamlandi(1) sayısı. Kanalda bu sayı < 10 ise karar için kullanılmaz.

## 4. Kreatif / gönderi kırılımı (utm_content)
| utm_content | Ziyaret | Aktivasyon | Not |

## 5. Bölüm bazlı düşüş
| Bölüm (1-9) | baslatildi | tamamlandi | kaybedildi | Başarı oranı | Önceki bölümden oran |

## 6. Ürün geri bildirimleri (Ürün Stüdyosu'na)
- Kaynak: elle toplanan yorum/mesaj (kaç kayıt: __), olay verisi (bölüm düşüşü, cihaz dağılımı).
- Takıldığı bölüm: __   İstenen özellik: __   Hata/uyumsuzluk (cihaz, tarayıcı): __
- Dayanaksız çıkarım yazılmaz; her madde için kaynak (yorum bağlantısı/olay) belirtilir.
- Kalıcı bulgular için bkz. `docs/analitik/urun-geri-bildirimleri.md`.

## 7. Veri yok / ölçülemeyenler
- __ (neden: ölçüm yok / özellik yok / örnek küçük)

## 8. Sonraki hafta için karar önerisi (Emre onayına)
- devam / içerik / dur: __ (gerekçe yalnızca yukarıdaki ölçülmüş verilerden)
- Onay bekleyen işler: __
```

## 3. İlk rapor: Hafta 1 (şu anki durum)

Hafta 1 başlamadı ve ölçüm kurulu değil (V). Aşağıdakilerin hepsi "veri yok".

- Ziyaret: veri yok
- oturum_basladi: veri yok
- bolum_tamamlandi (1): veri yok
- oyun_bitti: veri yok
- Bölüm bazlı tüm satırlar: veri yok
- Kanal bazında tüm satırlar: veri yok
- Nakit harcama: 0 ₺ (hiçbir kampanya kurulmadı, harcama onayı yok; V: `kampanya-plani.md` durumu "onay bekliyor")
- AOBM: hesaplanamaz (ücretli trafik ve ölçüm yok)

İlk gerçek rapor, ölçüm kurulup doğrulandıktan ve yumuşak lansman yapıldıktan sonra doldurulur.
