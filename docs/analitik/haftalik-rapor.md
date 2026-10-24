# Haftalık Büyüme Raporu: Şablon ve İlk Hafta Metrikleri

Durum: ŞABLON. Ölçüm kurulu değil, yayın/lansman yapılmadı; hiçbir gerçek veri yok. Aşağıdaki tüm sayı alanları boş bırakıldı. Hedefler `docs/pazarlama-stratejisi/lansman-plani.md` §6'dan alınmıştır ve oradaki gibi Varsayım'dır (benchmark değil).
Tanımlar için: `docs/analitik/olcum-plani.md`.

## 1. İlk hafta (Hafta 1) izlenecek metrikler

| Metrik | Tanım | Hafta 1 hedefi (Varsayım, lansman planı) | Veri kaynağı | Şu an |
|---|---|---|---|---|
| Ziyaretçi | Tekil ziyaretçi (araç tahmini) | 100-300 | Araç sayfa görüntüleme | veri yok |
| Başlama oranı | `oturum_basladi` / ziyaret | hedef konmadı | Araç + olay | veri yok |
| Aktivasyon | `sahne_tamamlandi`(1) / ziyaretçi | %50+ | Olay | veri yok |
| Tamamlama | `oyun_bitti` / `oturum_basladi` | %50+ | Olay | veri yok |
| Sahne bazlı düşüş | `sahne_tamamlandi`(n)/(n-1), n=2..5 | hedef konmadı | Olay | veri yok |
| Paylaşım | `skor_paylasildi` / `oyun_bitti` | %5+ | Olay | özellik yok |
| Geri dönüş | 7 gün içinde ikinci oturum | %15+ (Hafta 2'de ölçülür) | Çerezsiz ölçümde kişi tanınmaz; ölçülemeyebilir | ölçülemeyebilir |
| Dil dağılımı | `dil_degistirildi` ve `dil` özelliği | hedef konmadı | Olay | veri yok |
| `webgl_yok` sayısı | WebGL açılmayan oturum | 0'a yakın beklenir | Olay | olay yok (G3) |
| Kayıt / ödeme | Üründe yok | uygulanamaz | uygulanamaz | uygulanamaz |
| "Yeni sahneler" ilgisi | tıklama sayısı | hedef konmadı | Olay | özellik yok |
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
| sahne_tamamlandi (1) | __ | __ | | |
| oyun_bitti | __ | __ | | |
| skor_paylasildi | __ | __ | | |
| Aktivasyon oranı | __ | __ | %50+ | |
| Tamamlama oranı | __ | __ | %50+ | |

## 3. Kanal bazında
| Kanal (utm_source) | Ziyaret | oturum_basladi | sahne1 | oyun_bitti | Tamamlama oranı | Nakit harcama | TOBM |
| reddit | __ | __ | __ | __ | __ | 0 (organik) | hesaplanmaz |
| linkedin | __ | __ | __ | __ | __ | 0 (organik) | hesaplanmaz |
| shorts/reels | __ | __ | __ | __ | __ | 0 (organik) | hesaplanmaz |
| meta (ücretli) | __ | __ | __ | __ | __ | __ ₺ (panel) | __ ₺ |
| doğrudan / bilinmiyor | __ | __ | __ | __ | __ | 0 | hesaplanmaz |
TOBM = nakit harcama / kanalın oyun_bitti. Kanalda oyun_bitti < 10 ise karar için kullanılmaz.

## 4. Kreatif / gönderi kırılımı (utm_content)
| utm_content | Ziyaret | Tamamlama | Not |

## 5. Sahne bazlı düşüş
| Sahne | baslatildi | tamamlandi | Önceki sahneden oran | Ortalama yıldız kovası |

## 6. Ürün geri bildirimleri (Ürün Stüdyosu'na)
- Kaynak: elle toplanan yorum/mesaj (kaç kayıt: __), olay verisi (sahne düşüşü, webgl_yok).
- Takıldığı yer: __   İstenen özellik: __   Hata/uyumsuzluk: __
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
- sahne_tamamlandi (1): veri yok
- oyun_bitti: veri yok
- skor_paylasildi: veri yok (özellik de yok)
- Kanal bazında tüm satırlar: veri yok
- Nakit harcama: 0 ₺ (hiçbir kampanya kurulmadı, harcama onayı yok; V: `kampanya-plani.md` durumu "onay bekliyor")
- TOBM: hesaplanamaz (ücretli trafik ve ölçüm yok)

İlk gerçek rapor, ölçüm kurulup doğrulandıktan ve yumuşak lansman yapıldıktan sonra doldurulur.
