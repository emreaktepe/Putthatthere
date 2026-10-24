# Büyücünün Gecesi — Veri-Odaklı Konfigürasyon, Harita ve Yönetim Sayfası Mimarisi

Durum: MİMARİ ÖNERİ. Kod yazılmadı, `index.html` değiştirilmedi. Hazırlayan: mimari odası.
Kapsam: Emre'nin 4 isteği: (1) şık menü/intro, (2) harita üzerinde bölüm düğümleri, (3) oyun içi konfigürasyon sayfası, (4) konfigürasyonun doğrulanıp Claude'a yönlendirme yapılabilmesi.

## 0. Okunan kaynaklar, doğruluk sınırı

Okudum: `index.html` (başı, `AUDIO/MUSIC`, `LEVELS`, `WEAPONS`, `ABILITIES`, `ENEMIES`, `ENEMY_NAMES`, `PERKS`, `S/newRun`, `THEMES`, `VIS`, `applyTheme`, `buildWizard` başı, `screen/introLevel/startLevel/gameOver/levelClear`), `docs/strateji/buyucu-oyunu-hikaye-ve-bolumler.md`, `README.md`. Var olan `.github/workflows/deploy-pages.yml`'in içeriğine bakmadım, yalnızca varlığını gördüm.

Okumadım / doğrulamadım: düşman AI `switch`'inin gövdesi (satır ~2436), boss faz mantığı, `SCENERY[]` fonksiyonları (satır 992–1228), `BUILD` geometri üreticilerinin tamamı, dokunmatik kontroller. Bu parçalar için "kodda kalır" kararı verdim; içlerindeki gömülü sayıların ve metinlerin tam listesi geliştirme odasının ilk işi olmalı (bkz. §12 Adım 2). Hiçbir şey çalıştırılmadı. Satır numaraları yaklaşıktır ve kaydıkça eskir.

Mevcut durumun mimariyi belirleyen gerçekleri:
- Tek dosya, tek `<script type="module">`; Three.js yerel (`vendor/`), `importmap` ile. Build yok. GitHub Pages'e yayınlanıyor.
- Veri zaten büyük ölçüde tablo halinde: `LEVELS` (9), `WEAPONS` (7), `ABILITIES` (3), `ENEMIES` (10), `PERKS` (11), `THEMES`/`VIS`/`MUSIC` (9'ar giriş, **dizin ile eşleşiyor**), `DEATH_LINES`, `OPENING`. Bu işi kolaylaştırıyor: "veriyi dışarı çıkar" çoğunlukla taşıma işidir, yeniden tasarım değil.
- Renkler `0xRRGGBB` tam sayı; JSON'da yok. Bölümler dizin (`S.level`) ile adreslenir; kimlik (id) yok.
- Gömülü metinler/sayılar var ve veriye çıkarılmalı: `say()` içindeki sabit konuşmacı adları (`Zerrin|Pırıl|Veyis|Taşkın|Aldemir`), `objectiveHtml` içindeki "Kemik Şövalye'yi yen!" / "Gölge Kral'ı yen!", HUD'daki "Şövalye"/"Kral", final ekranındaki "Gölge Kral yenildi. Lanet kalktı.", açılış ekranı metni (satır ~2790), boss bölümünde sabit `archer`/`bat` doğurma (~2382), totemin 12 sn'de `ghost` doğurması (~2488), `S.level === LEVELS.length - 1` ile "son bölüm" tespiti.

## 1. Temel kararlar (özet)

| # | Karar | Gerekçe |
|---|---|---|
| K1 | **Tek dosya `data/game.config.json`** (bölünmüş değil). | Tek fetch, tek sürüm, atomik dışa/içe aktarma, Claude'a "şu dosyayı ver/al" kolaylığı. Tahmini boyut 30–45 KB. Bölünmüş dosyada sürüm uyumsuzluğu ve kısmi yükleme sorunu doğar. |
| K2 | Koleksiyonlar **id'li nesne + açık sıra dizisi** (`levels: {forest: {...}}`, `campaign.order: [...]`), dizi-of-nesne değil. | Taslak yaması, diff, referans (bölüm → düşman/büyü), harita kenarları ve kayıt dosyası için kararlı kimlik gerekir; dizin kayınca her şey bozulur. |
| K3 | **Bağımlılıksız, elle yazılmış doğrulayıcı**; şema, JS içinde "alan tanımı" tablosu olarak durur. Aynı tablo hem doğrulama, hem varsayılan, hem form üretimi, hem Türkçe etiket kaynağıdır. | JSON Schema/ajv için paket ya da vendor kopyası gerekir; hata mesajları İngilizce ve çapraz referans kontrolleri (bölüm→düşman, harita erişilebilirliği) zaten kodla yazılacak. İsteğe bağlı: tablodan `game.config.schema.json` üretip editör tamamlaması için eklemek (MVP dışı). |
| K4 | Saklama: **repo JSON = tek gerçek kaynak**; tarayıcıda **seyrek yama (ops listesi) olarak taslak**; dışa/içe aktarma dosya ile; "Varsayılana sıfırla". Taslak tam belge kopyası DEĞİL. | Tam kopya, repo varsayılanı değişince sessizce onu maskeler. Yama + `baseHash` ile çakışma tespit edilebilir. |
| K5 | **Repoya yazma yok**; akış: düzenle → doğrula → dışa aktar → Claude'a ver/commit. | Statik site; sunucu/token yok. |
| K6 | Yönetim sayfası ayrı **`admin.html`** (oyun paketine girmez), form **hibrit**: şema tablosundan genel form + özel editörler. | Oyun yükü artmaz; üretimden hariç tutulabilir. |
| K7 | Davranış, AI, geometri üreticileri, ses sentezi, dekor üreticileri **kodda kalır**; konfigürasyon bunlara **id/enum ile referans** verir. | Davranışı JSON'a gömmek (script dili) fiilen yeni bir yorumlayıcı yazmaktır. Gereksiz ve güvenlik riski. |
| K8 | `index.html` kabuğa indirgenir, kod `js/` altında **ES modüllerine** bölünür; derleme adımı eklenmez. | Paralel geliştirme (tek 2800 satırlık dosyada çakışma kaçınılmaz) ve test edilebilir saf modüller (Node'da çalışan doğrulayıcı). |
| K9 | Üretim paketinden `admin.html` ve `js/admin/` hariç tutulur (varsayılan öneri); yönetim yerelde (`npx serve`) kullanılır. | Kimlik doğrulama imkânı yok; bkz. §8. |
| K10 | **Barındırma**: şimdilik ücretsiz oyun olduğu için GitHub Pages kalabilir. Ödeme/ticari kullanım gelirse Cloudflare Pages/Netlify/Vercel'e geçilmeli. Bu mimari barındırıcıdan bağımsızdır (göreli yollar, build yok). | Ürün Stüdyosu kuralı: ödeme alan ürün GitHub Pages'te durmaz. Şu an ödeme yok. |

## 2. Neyin JSON'a çıktığı, neyin kodda kaldığı

### 2.1 JSON'a çıkar (Emre değiştirebilmeli)

| Bölüm | İçerik | Mevcut kaynak |
|---|---|---|
| `meta` | `schemaVersion`, `name`, `notes` | yeni |
| `game` | başlangıç canı, taban hız, can üst sınırı, puan çarpanları, perk seçenek sayısı, bölüm sonu can yenileme | `START_HP`, `BASE_SPEED`, `levelClear` içi sabitler |
| `strings` | oyun adı, slogan, açılış metni, kontrol yardımı, final/ölüm başlıkları, hedef metin şablonları, ölüm replikleri | `OPENING`, `DEATH_LINES`, `screen(...)` metinleri |
| `characters` | oyuncu, yan karakterler, kötü karakter: ad, rol, ikon/emoji, ad rengi, kısa biyografi, isteğe bağlı portre | yeni (şimdi `say()` regex'inde) |
| `player` | karakter referansı, başlangıç can/hız, **görünüm paleti** (cüppe üst/alt, ten, altın, şapka, sakal, göz, asa parıltısı), ölçek | `buildWizard` içindeki renk sabitleri |
| `enemies` | ad, hp, hız, yarıçap, y, puan, drop, hasar, renk, emissive, ölçek, `ai` (enum), `model` (enum), bayraklar | `ENEMIES` + `ENEMY_NAMES` |
| `weapons` + `weaponOrder` | ad, ikon, renk, cd, hasar, hız, tür bloğu (`chain`/`cloud`/`meteor`/`nova`/`spread`/`slow`) | `WEAPONS`, `WEAPON_ORDER` |
| `abilities` + `abilityOrder` | ad, ikon, cd, `params` (süre, mesafe, yavaşlatma çarpanı) | `ABILITIES` (+ koda gömülü süreler) |
| `perks` + `perkOrder` | ad, açıklama, bildirimsel etki, azami yığın, asgari bölüm | `PERKS` (`ok`/`apply` kapanışları bildirimsele çevrilir) |
| `themes` | renkler, sis, hava parçacığı, zemin türü (`floorKind` enum), dekor (`scenery` enum), **müzik parametreleri** | `THEMES`, `VIS`, `MUSIC`, `FLOOR_KIND`, `SCENERY[]` seçimi |
| `levels` + `campaign` | ad, hedef türü/sayı, süre, tema, başlangıç/doğma tabloları, `every`, `cap`, ödül, totem konumları, giriş/çıkış anlatısı, **harita konumu** | `LEVELS` |
| `map` | görünüm kutusu, arka plan ön ayarı, kenarlar (yollar), başlangıç düğümü | yeni |

### 2.2 Kodda kalır

- Düşman AI durum makineleri (`chase/ranged/charge/bomber/support/static/knight/boss`), boss fazları, mermi/çarpışma, ses sentez motoru ve SFX tarifleri, `BUILD[...]` düşman geometrisi, `buildWizard` geometrisi, `SCENERY[i]` dekor üreticileri, zemin dokusu çizimi, kontroller, arena boyutu (`ARENA=14`; geometriye bağlı).
- Konfigürasyon bunlara yalnızca **adla** ulaşır: `ai: "ranged"`, `model: "archer"`, `scenery: "graveyard"`, `floorKind: "bone"`. Bilinmeyen ad = hata (E_ENUM). Enum listeleri kodda tek yerde (`js/config/registry.js`) tanımlanır; kod yeni davranış eklediğinde buraya da eklenir; admin formu seçenekleri oradan alır.
- İkinci dalga (MVP dışı, §12 son adımlar): AI içindeki sihirli sayılar (okçu mesafesi, atış aralığı, hücum süresi, boss faz eşikleri) `enemies.<id>.params` altına varsayılanlarıyla taşınır. İlk dalgada yalnızca `hp/hız/...` alanları ve bölüm tabloları taşınır; böylece "denge" ayarının %80'i çözülür, risk düşük kalır.

### 2.3 Dönüşüm kuralları (`js/config/adapt.js`)

`adapt(config)` doğrulanmış JSON'u **mevcut çalışma zamanı şekline** çevirir: `"#a1b2c3"` → `0xa1b2c3`, id'li nesne + sıra → dizi/harita (`LEVELS`, `WEAPONS`, `WEAPON_ORDER`...), `weapons[id].key` sıradan türetilir (`1..N`), yetenek tuşları sıradan (`Q/E/R`), anlatı satırları `{speaker,text}` → mevcut `say()` girdisi. Böylece oyun kodu neredeyse hiç değişmeden "sabit tablolar" yerine "yüklenen tablolar" kullanır; geçiş sırasında eski sabitlerle **eşdeğerlik testi** yapılabilir (§12 Adım 3).

## 3. Şema

### 3.1 Genel kurallar

- Kimlik (`id`): `^[a-z][a-z0-9_]{1,23}$`. `__proto__`, `constructor`, `prototype` yasak (prototip kirlenmesi).
- Renk: `^#[0-9a-fA-F]{6}$` (JSON'da). CSS'e/HTML'e yalnızca bu doğrulamadan geçen değer girer.
- Metin: düz metin (HTML yok, `**kalın**` yok). Konuşmacı adı ayrı alandır; koyu yazım kodla yapılır.
- Bilinmeyen alan: **uyarı** (W_UNKNOWN_FIELD), silinmez, dışa aktarmada korunur. İleri sürümden gelen alanları kaybetmemek için.
- Zorunlu alan eksik: hata. İsteğe bağlı alan eksik: şemadaki varsayılan kullanılır (ve `adapt` bunu uygular).

### 3.2 Alan tablosu (özet; tam tablo `schema.js` olacak)

Tür kısaltmaları: `int`, `num`, `str`, `hex`, `bool`, `enum`, `ref:<koleksiyon>`. Aralıklar mevcut değerlerin güvenli bir üst kümesidir; "denge testi" gereken sınırlar Emre'nin ayarlayabilmesi için geniştir, uyarı (W_BALANCE) ile desteklenir.

**meta**

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `schemaVersion` | int ≥1 | evet | Kod `CONFIG_SCHEMA_VERSION` ile karşılaştırılır |
| `name` | str 1–60 | hayır | |
| `notes` | str ≤2000 | hayır | Claude'a bırakılan serbest not |

**game**

| Alan | Tür | Varsayılan | Aralık |
|---|---|---|---|
| `startHp` | int | 3 | 1–10 |
| `maxHpCap` | int | 6 | startHp–12 |
| `baseSpeed` | num | 8 | 3–16 |
| `perkChoices` | int | 3 | 1–5 |
| `clearHeal` | num | 1 | 0–3 |
| `scoreLevelBonus` / `scoreTimeMul` | int | 100 / 2 | 0–10000 / 0–50 |

**characters.<id>**

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `name` | str 1–24 | evet | Diyalogda görünen ad |
| `role` | enum `player\|ally\|villain\|npc` | evet | |
| `icon` | str ≤4 karakter (emoji/harf) | hayır | Cihaza göre emoji farkı riski (§6) |
| `color` | hex | hayır | Ad etiketi rengi |
| `bio` | str ≤300 | hayır | Admin/Harita ipucu |
| `portrait` | asset | hayır | §6 |

**player**: `character` (ref:characters, role=player), `startHp?`, `speedMul` (num 0.5–2), `scale` (num 0.6–1.6), `look` { `robeTop, robeBottom, skin, gold, hat, beard, eye, wandGlow` : hex }.

**enemies.<id>**

| Alan | Tür | Zorunlu | Aralık / not |
|---|---|---|---|
| `name` | str 1–24 | evet | |
| `hp` | num | evet | 0.5–500 (boss 45, totem 10, knight 24) |
| `speed` | num | evet | 0–12 |
| `r` | num | evet | 0.2–4 (çarpışma yarıçapı) |
| `y` | num | hayır | 0–5 (yükseklik) |
| `scale` | num | hayır | 0.5–3, varsayılan 1 (yalnız görsel) |
| `score` | int | hayır | 0–10000 |
| `drop` | num | hayır | 0–1 |
| `dmg` | num | hayır | 0–5, 0.5 adım |
| `color`, `emissive` | hex | evet | |
| `ai` | enum (kod listesi) | evet | |
| `model` | enum (kod listesi) | hayır | Varsayılan = id |
| `character` | ref:characters | hayır | Boss/knight için ad/biyografi bağı |
| `zig, spin, noCap, static` | bool | hayır | |
| `bob` | num 0–0.3 | hayır | |

**weapons.<id>**: `name`, `icon`, `color` (hex), `cd` (0.1–10), `dmg` (0.5–20), `speed` (4–40, bulut/mermi için), `pierceable` (bool), tür bloğu **en fazla biri**: `spread` {n int 2–7}, `chain` {n 2–8, range 3–25}, `cloud` {dist, r, life}, `meteor` {r, delay}, `nova` {r, push}, `slow` bool (mermi ekleniyor). Ek kural: `weaponOrder` 1–9 öğe (tuş 1–9), tümü var olan id.

**abilities.<id>**: `name`, `icon`, `cd` (1–60), `params` (id'ye özgü sayılar; tür `registry.js`'te listelenir: shield {duration}, blink {dist, iframes}, timeslow {duration, factor}). Sıra `abilityOrder` (≤3; Q/E/R).

**perks.<id>**: `name`, `desc` (≤90), `maxStacks` (1–9, varsayılan 1), `minLevel` (int, varsayılan 0), `effect`: `{kind:"add", stat:"maxHp|magnet|echo|rain", value}` | `{kind:"mul", stat:"speedMul|dmgMul|cdMul", value 0.1–3}` | `{kind:"flag", flag:"vampire|pierce|piril|stoneLevels", value}`. Mevcut `ok()` kapanışları `maxStacks`/`minLevel` ile ifade edilir (`hp` 3 yığın; `echo` 3; `rain` 3; `piril` `minLevel:1`).

**themes.<id>**: `name`, `bg`, `floor`, `ring`, `hemi`, `moon` (hex), `fog` (0.01–0.08), `floorKind` (enum), `scenery` (enum), `weather` {n int 0–240, col hex, vy, dx, size, add bool, op 0–1}, `mist` (0–0.8), `music` {root int 24–72, scale int[] (0–11 artan, 3–9 öğe), bpm 40–160, chords int[], cut 200–4000, + isteğe bağlı: `arpP, arpWave, arpOct, arpDec, bellP, bellOct, wind, detune, padVol, drumThr, kick, tomLow, noHat, burst, motif, pad4, padAtt, chordBars, arpRepeat`}. Hava `n` üst sınırı `WMAX=240`'tan gelir.

**levels.<id>**

| Alan | Tür | Zorunlu | Not |
|---|---|---|---|
| `name` | str 1–40 | evet | |
| `objective` | enum `crystal\|survive\|totem\|miniboss\|boss` | evet | |
| `goal` | int | evet | crystal 1–60, survive 5–300, totem 1–6, miniboss/boss =1 |
| `time` | int | evet | 15–300 |
| `theme` | ref:themes | evet | |
| `crystals` | int | hayır | 0–10 |
| `start` | {enemyId: int 0–12} | evet | toplam ≤ 30 |
| `spawn` | dizi of {enemyId: int 1–4} | evet (boş olabilir) | |
| `every` | num 2–30 | evet | |
| `cap` | int 1–14 | evet | Mobil performans sınırı: >14 uyarı |
| `reward` | ref:weapons \| null | hayır | |
| `ability` | ref:abilities \| null | hayır | |
| `totems` | [[x,z]] (|x|,|z|≤12) | `objective=totem` ise evet, uzunluk ≥ goal | |
| `intro`, `outro` | dizi of {speaker?: ref:characters, text: str 1–240}, 1–4 satır | evet | |
| `map` | {x,y: num 0–viewBox, icon?: str ≤4, label: enum `below\|above\|left\|right`} | evet | §7 |

**campaign**: `order` (id dizisi, tüm `levels` tam bir kez), `edges` [{from,to,via?:[[x,y]...],style:"dotted\|solid"}], `start` (ref:levels, varsayılan `order[0]`).
**map**: `viewBox` [genişlik, yükseklik] (varsayılan [1000, 700]), `background` {preset enum, tint hex}, `nodeRadius` (num 20–48).
**strings**: `title`, `tagline`, `opening`, `controlsHelp`, `mobileHelp`, `finalTitle`, `finalLine`, `deathLines` [{speaker?,text}] (≥1), `objective.{crystal,survive,totem,miniboss,boss}` şablonları (`{goal}`, `{boss}` yer tutucuları; yalnızca bunlar).

### 3.3 Örnek parça

```json
{
  "meta": { "schemaVersion": 1, "name": "Büyücünün Gecesi varsayılan" },
  "characters": {
    "aldemir": { "name": "Aldemir", "role": "player", "icon": "🧙", "color": "#d9b3ff" },
    "zerrin":  { "name": "Zerrin",  "role": "ally",   "icon": "🦉", "color": "#ffe9a8" }
  },
  "enemies": {
    "ghost": { "name": "Ruh", "hp": 1, "speed": 2.2, "r": 0.7, "y": 1.2, "score": 20, "drop": 0.12,
               "color": "#c9ffd9", "emissive": "#2f9e5a", "dmg": 1, "ai": "chase" }
  },
  "levels": {
    "forest": { "name": "Fısıldayan Orman", "objective": "crystal", "goal": 6, "time": 50, "theme": "forest",
                "start": { "ghost": 3 }, "spawn": [{ "ghost": 1 }], "every": 8, "cap": 5, "reward": "frost",
                "intro": [{ "speaker": "zerrin", "text": "Kule sustu, orman konuşuyor. Kristalleri topla; mana olmadan büyü olmaz." }],
                "outro": [{ "speaker": "zerrin", "text": "Fena değil. Ormanın fısıltısı seni tanıdı." },
                          { "text": "Küçük bir ışık yolunu aydınlattı." }],
                "map": { "x": 140, "y": 540, "icon": "🌲", "label": "below" } }
  },
  "campaign": { "order": ["forest", "cave"], "edges": [{ "from": "forest", "to": "cave", "via": [[240, 470]], "style": "dotted" }] }
}
```

### 3.4 Sürümleme ve geriye dönük uyumluluk

- `meta.schemaVersion` tam sayı. Kodda `CONFIG_SCHEMA_VERSION` (ilk sürüm = 1).
- `js/config/migrate.js`: `MIGRATIONS = { 1: (cfg) => cfg2, 2: ... }` (n → n+1), **saf** fonksiyonlar, girdiyi değiştirmez. Yükleyici: sürüm < güncel ise zincirle yükseltir, > güncel ise **reddeder** ("bu konfigürasyon daha yeni bir oyun sürümü için; sayfayı yenile / oyunu güncelle").
- Migration her zaman: repo JSON'u (Claude eski bir dışa aktarmayı yapıştırmış olabilir), içe aktarılan dosya, taslak yaması (taslak `schemaVersion`'ı ayrı saklanır) ve kayıt dosyası için çalışır.
- Kural: şema değişikliği (alan yeniden adlandırma, zorunlu alan ekleme) = sürüm artışı + migration + eski sürüm sabit dosyası (`tests/fixtures/config.v1.json`) ile test. Yeni **isteğe bağlı** alan eklemek sürüm artışı gerektirmez.
- Repodaki `data/game.config.json` her zaman **güncel sürümde** tutulur; migration yalnızca dış kaynaklı girdiler için güvenlik ağıdır.

## 4. Doğrulama

### 4.1 Yaklaşım

Elle yazılmış, DOM'dan bağımsız (Node'da çalışır) doğrulayıcı: `validate(config, {mode}) → { ok, errors[], warnings[], sanitized }`. Üç aşama:
1. **Yapı/tür**: şema tablosu üzerinden her alan: tür, aralık, enum, uzunluk, regex, bilinmeyen alan.
2. **Referans bütünlüğü**: level→enemy/theme/weapon/ability, `weaponOrder`/`campaign.order` tam kapsama, `characters` bağları, harita kenarı uçları.
3. **Anlamsal/sağlık**: harita bir tek zincir mi (v1), son bölüm erişilebilir mi, her ödül tek mi, `goal` ile `time` makul mü (örn. crystal sayısı × tahmini 3 sn > süre ise W_BALANCE), `start` toplamı > `cap`×2, kullanılmayan düşman/büyü (W_UNUSED), `ability` ödülü iki kez veriliyor mu, boss bölümü yok/çok, metin kısalığı. Aşama 3 sonuçları çoğunlukla **uyarı**dır (öneri); çökertecek olanlar hata.

### 4.2 Hata biçimi

Makine ve insan okunur, Claude'a doğrudan yapıştırılabilir:

```json
{ "severity": "error", "code": "E_RANGE", "path": "/levels/cave/goal",
  "message": "goal 0 geçersiz: 1–60 arası tam sayı olmalı",
  "value": 0, "expect": "int 1..60", "hint": "Süre 55 sn iken 8 kristal makul" }
```

Metin gösterimi: `[HATA] Bölümler › Yarasa Mağarası › goal = 0 → 1–60 arası tam sayı olmalı (E_RANGE, /levels/cave/goal)`. `path` RFC 6901 JSON Pointer'dır (id'li nesne sayesinde dizin yok). Kodlar: `E_REQUIRED, E_TYPE, E_RANGE, E_ENUM, E_FORMAT, E_LENGTH, E_REF, E_DUP, E_ORDER, E_FORBIDDEN_KEY, E_VERSION`, uyarılar `W_UNKNOWN_FIELD, W_UNUSED, W_UNREACHABLE, W_BALANCE, W_ASSET_SIZE`.

### 4.3 Bozuk konfigürasyonda davranış

| Durum | Davranış |
|---|---|
| Repo JSON'u geçerli, taslak yok | Normal. |
| Taslak var ve **hatasız** (uyarı olabilir) | Yalnızca `?cfg=draft` ya da yönetimden "Taslakla oyna" ile uygulanır; menüde "TASLAK" rozeti. |
| Taslak var ama **hatalı** | Taslak **yok sayılır**, repo varsayılanı kullanılır, ekranda ve konsolda hata listesi ("Taslak hatalı, varsayılanla açıldı"). Oyun çökmez. |
| Küçük sapma (alan aralık dışı, bilinmeyen enum) | `sanitize`: alan varsayılana/sınıra çekilir, uyarı kaydı tutulur; yalnız **runtime lenient** modunda. Hata sayısı >0 ise taslak için yukarıdaki satır geçerli; lenient yalnızca repo JSON'unun küçük bozulmasına karşı son güvenlik ağı. |
| Repo JSON'u yüklenemedi (ağ) | `localStorage` "son iyi" önbelleği (`buyucu_cfg_lastgood`) varsa onunla açar ve uyarır; yoksa "Yapılandırma yüklenemedi" ekranı + "Yeniden dene" (oyun içi gömülü ikinci bir varsayılan **tutulmaz**; çifte kaynak kaymaya yol açar). |
| Repo JSON'u yapısal olarak bozuk | Aynı hata ekranı + hata listesi. Bunu üretimden uzak tutan **CI'dır**: doğrulayıcı `node --test` ile her push'ta repo JSON'unu **strict** modda doğrular, hata varsa deploy olmaz. |
| Şema sürümü kodun üstünde | Reddedilir (E_VERSION), kullanıcıya açık mesaj. |

"Strict" (CI/yönetim): her hata = başarısız. "Lenient" (oyun çalışma zamanı): sanitize + uyarı.

## 5. Saklama katmanları ve akış

```
 data/game.config.json  (repo, tek gerçek kaynak)  ──fetch──┐
                                                             ├─► migrate → validate → [taslak yamasını uygula] → adapt → oyun
 localStorage buyucu_cfg_draft (seyrek yama, yalnız bu tarayıcı)─┘
        ▲  │
 admin.html düzenler │ dışa aktar: tam JSON / yama / Claude paketi (dosya indirir)
        │            ▼
 içe aktar (dosya) → doğrula → farkı göster → taslağa uygula        Emre ► Claude ► repo (commit)
```

### 5.1 Katmanlar

1. **Repo varsayılanı**: `data/game.config.json`. Üretimdeki herkes bunu görür. Tek değiştirme yolu: commit.
2. **Taslak (localStorage)**: yalnızca Emre'nin tarayıcısı/origin'i. Anahtar `buyucu_cfg_draft`: 
   `{ v: 1, schemaVersion, baseHash, savedAt, active: bool, ops: [{op:"set"|"remove", path, value?}], notes: {path: "..."} }`.
   Çözümleme: `effective = applyOps(base, ops)`; sonra doğrulama. `ops` yol başına tek kayıt (sıkıştırılmış). Koleksiyon öğesi ekleme = `set /levels/yeni {…}` + `set /campaign/order [...]`.
3. **Dışa/içe aktarma**: dosya (aşağıda §5.3).
4. **Varsayılana sıfırla**: üç ayrı düğme: "Bu alanı geri al", "Bu bölümün/öğenin değişikliklerini geri al", "Tüm taslağı sil" (onay ister). Kayıt dosyasına dokunmaz.
5. **Son iyi önbelleği** `buyucu_cfg_lastgood`: yalnızca ağ hatası yedeği (§4.3). İsteğe bağlı.

### 5.2 Çakışma ve sürüm yönetimi

- `baseHash`: repo JSON'unun kanonik (anahtar sıralı) serileştirmesinin FNV-1a 32 bit özeti. Güvenlik değil, değişiklik algısı. Taslak yazılırken o anki repo özeti kaydedilir.
- Yükleme anında `draft.baseHash !== currentBaseHash` (Claude/Emre repoyu güncellemiş) ise: yönetimde bir bant: "Repo varsayılanı taslağını aldığından sonra değişti". Seçenekler: (a) taslağı yeni tabana **yeniden uygula** (yolu hâlâ var olan op'lar uygulanır, kaybolanlar "çakışma" listesinde gösterilir), (b) taslağı at, (c) farkı görüntüle. Oyunda: hash uyuşmazsa taslak **uygulanmaz** (yalnız yönetimde uzlaştırılır); aksi hâlde eskimiş yama sessizce yeni içeriği bozabilir.
- Çok sekme: `storage` olayı + `draft.rev` sayacı; başka sekmede değişirse yönetim "başka sekmede değişti, yenile" der. Son yazan kazanır; kayıp önlemek için her kayıtta eski değeri yedekleme **yapılmaz** (karmaşıklık); dışa aktarma önerilir.
- Kota: `QuotaExceededError` ve özel mod (`localStorage` yok) yakalanır; bellek içi taslak + "kaydedilemedi, dışa aktar" uyarısı (mevcut ses tercihi kodu da aynı kalıp). Taslak üst sınırı 200 KB, varlık (data URL) deposu 1.5 MB.
- Origin ayrımı: `localhost:8000` taslağı ile `github.io` taslağı **ayrıdır**. Kural: yönetim tek yerde (önerilen: yerel) yapılır; belgeye ve yönetim sayfasına bu uyarı yazılır.

### 5.3 Emre ► Claude ► repo akışı (net tanım)

Yönetim sayfasında üç dışa aktarma düğmesi:
1. **Tam konfigürasyonu indir** → `game.config.json` (`effective`, kanonik biçim, 2 boşluk girinti, id sırası sabit). Repoya konacak dosya budur.
2. **Değişiklik yamasını indir** → `degisiklikler.json` (ops listesi + baseHash).
3. **Claude paketini kopyala/indir** → `claude-yonlendirme-<tarih>.md`: Türkçe, şu bölümlerle: (a) özet (kaç alan değişti), (b) değişiklik tablosu (yol, eski → yeni, ilgili alanın notu), (c) doğrulama raporu (hata/uyarı, §4.2 biçimiyle), (d) Emre'nin **serbest notları** (alan başına 💬 ve genel not), (e) "Kod gerektiren istekler" (notlardan "kodla" işaretlenenler: yeni düşman davranışı, yeni model...), (f) ekli `game.config.json` (içine gömülü ya da ayrı dosya), (g) sürüm bilgisi (`schemaVersion`, `baseHash`).

Uygulama: Emre `game.config.json`'u `data/` altına koyar ya da Claude'a verir; Claude dosyayı **doğrulayıp** (aynı doğrulayıcı CLI: `node tools/validate-config.mjs data/game.config.json`) commit eder; "kod gerektiren istekler" geliştirme odasına iş olarak gider. Paket dosyalarının konacağı yer önerisi: `docs/yonlendirme/` (isteğe bağlı, commit edilebilir). Taslak, repo güncellenip `baseHash` değişince bant ile uzlaştırılır; Emre taslağı temizleyebilir.

İçe aktarma: dosya seç (`.json`) → boyut sınırı (≤1 MB) → `JSON.parse` (hata yakalanır) → yasak anahtar taraması → migrate → validate → **fark önizlemesi** (repo tabanına göre) → "taslağa uygula" (üzerine yazma onayı). İçe aktarılan, repoya değil taslağa gider.

## 6. Asset yönetimi

Oyundaki görseller kodla üretildiği için "asset" burada dört şeydir; hepsi JSON'da **veri**dir, dosya değildir:

1. **Renk paleti**: tema ve karakter renkleri (hex). Admin: renk seçici + canlı örnek kutusu.
2. **Parametrik model ayarları**: `player.look`, `enemies.<id>.scale/color/emissive/model`. Geometri üreticisi kodda; parametre veride. (Görsel çeşitlilik sınırı: yeni şekil = kod işi.)
3. **İkon/emoji**: silah, yetenek, düğüm, karakter. Risk: emoji cihaz/OS'e göre farklı görünür; eski cihazda kutu çıkar (strateji belgesi de uyarıyor). Doğrulama: ≤4 karakter. İsteğe bağlı sonraki adım: SVG ikon seti (kodda) ve `iconKey` enum.
4. **İsteğe bağlı kullanıcı görseli** (portre, harita arka planı, düğüm simgesi): bu bölümün asıl riskli kısmı.

Görsel yükleme kuralları (varsayılan **kapalı**, MVP'de en son adım):
- Yalnızca `png/webp/jpeg`; **SVG yasak** (içine betik gömülebilir). Dosya baştaki sihirli baytlarla doğrulanır, uzantıya güvenilmez.
- Yüklenince `<canvas>`'a çizilip **yeniden kodlanır** (webp), en uzun kenar ≤512 px (harita arka planı ≤1600 px); böylece EXIF/GPS gibi gizli veri atılır (KVKK), boyut küçülür.
- Boyut sınırı: tek dosya ≤96 KB (kodlama sonrası), toplam taslak varlıkları ≤1.5 MB. `W_ASSET_SIZE` uyarısı.
- Biçim: `{ "src": "assets/portraits/zerrin.webp" }` (repo yolu, regex `^assets/[a-z0-9/_-]+\.(png|webp|jpe?g)$`) **veya** taslakta `{ "src": "data:image/webp;base64,..." }`. **Harici URL (http/https) yasak**: gizlilik (üçüncü taraf istek/IP sızıntısı), karışık içerik, bağlantı ölümü, izleme.
- Repoya girerken: data URL config'e **gömülmez**. "Repoya gidecek paket" dışa aktarmada her data URL öneri bir dosya yoluna çevrilir (`assets/…`), görsel ayrı dosya olarak indirilir; config yalnız yolu içerir. Böylece JSON büyümez, git diff anlamlı kalır, Claude bağlamı şişmez.
- Yan etkiler: JSON boyutu ve fetch süresi artar (data URL %33 büyür); `localStorage` kotası (≈5 MB, UTF-16 yüzünden fiilen daha az); mobilde bellek; Pages artefakt boyutu; telif sorumluluğu Emre'dedir (kod bunu denetleyemez); Three.js dokusu olarak kullanılırsa aynı kökenli/`data:` olduğu için taint sorunu yok.
- Gösterim: yalnızca `<img>`/CSS `background-image` ile, `src` doğrulanmış kalıplardan biri; asla `innerHTML` ile ham string.

## 7. Harita ekranı verisi

### 7.1 Konfigürasyon

- Her bölümde `map: {x, y, icon, label}` koordinatları **harita görünüm kutusu** birimindedir (`map.viewBox`, varsayılan 1000×700). Yüzde değil, kutu birimi: kenar kıvrımları (`via`) ile aynı uzayda.
- Kenarlar `campaign.edges`: `{from, to, via?:[[x,y]…], style}`. Çizim: `from` düğümünden `via` noktalarından geçen yumuşak (Catmull-Rom → kübik Bezier) bir SVG `<path>`, `stroke-dasharray` noktalı çizgi; tamamlanan kenar dolu/parlak, açık kenar yarı parlak, kilitli kenar sönük.
- Düğüm: SVG `<circle>` + ikon + numara; erişilebilirlik için üstüne gerçek `<button>` (odak, Enter, etiket "Bölüm 3: Taş Bekçiler, kilitli").
- v1 kısıtı: **doğrusal zincir** (her düğümün en çok 1 çıkışı ve 1 girişi). Dallanma şemada yazılabilir ama doğrulayıcı `W_UNSUPPORTED_BRANCH` verir; çünkü oyuncu durumu (`S`) tek yönlü ilerleme varsayıyor. Dallanma ileri sürüm işidir.
- Harita arka planı: kodla üretilen `preset` (gece haritası: parşömen/koyu mavi gradyan + dağ/orman silüetleri SVG), `tint`; isteğe bağlı görsel (§6).
- Mobil: SVG `viewBox` + `preserveAspectRatio="xMidYMid meet"`; 360 px genişlikte ölçek ≈0,36, düğüm yarıçapı 34 birim ≈ 12 px yarıçap: dokunma hedefi için görünmez daha büyük `<button>` (≥44 px) şart. Dikey telefonda kutu yatay olduğu için üst/alt boşluk kalır; gerekirse `map.portraitViewBox` ikinci yerleşim (MVP dışı, şimdi tek yerleşim, 9 düğüm "S" eğrisi).

### 7.2 Durum (kilitli / açık / tamam)

Durum **saklanmaz, türetilir**: `completed` (kayıttan), `available` (başlangıç düğümü ya da bir giriş kenarının kaynağı tamam), `locked` (aksi), `current` (kayıttaki sıradaki). Kural tek fonksiyonda (`js/game/progress.js`), Node'da test edilir.

### 7.3 Kayıt (save) şeması

Anahtar `buyucu_save` (mevcut `buyucu_ses` ses tercihi ayrı kalır):

```json
{ "v": 1, "configHash": "…", "updatedAt": 1730000000000,
  "completed": ["forest", "cave"], "currentLevel": "golems",
  "run": { "...S nesnesinin serileştirilmiş hâli (level index yerine levelId)..." },
  "best": { "score": 0, "levels": { "forest": { "score": 0, "time": 0 } } } }
```

- `run`: mevcut `snapshot` zaten `JSON.parse(JSON.stringify(S))`; her `introLevel` başında yazılır → "Devam et" ölüm/yenileme sonrası da çalışır. `S.level` (dizin) yerine yüklemede `currentLevel` id'den hesaplanır.
- Sürüm: `v` tam sayı; `migrateSave` konfig migration'ı ile aynı desen. Bilinmeyen/silinmiş bölüm id'si: `completed`'tan atılır, uyarı; `run` geçersizse (silah/yetenek id'si artık yok) süzülür; kayıt tümden bozuksa yok sayılır (oyun çökmez), kullanıcıya "kayıt okunamadı, yeni oyun" der.
- `configHash`: kayıt hangi konfigürasyonla yazıldı. Farklıysa uyarı **vermez**, yalnızca id'ler doğrulanır (Emre sürekli ayar yapacak; her değişiklikte kayıt silinmemeli).
- Tamamlanan bölümü haritadan tekrar oynama: **"alıştırma"** olarak, o bölüme kadarki ödüllerden türetilen standart donanımla (`kit(levelId)`); `run`'ı ve `completed`'ı bozmaz, yalnızca `best` güncellenebilir. Bu karar, rastgele perk'li run durumuyla çelişmemek için alındı.
- Dev modunda "Bu bölümden başlat" aynı `kit(levelId)` yolunu kullanır (§9).

### 7.4 Akış

`Menü → (Devam et | Yeni oyun) → Harita → düğüme dokun → bölüm girişi (mevcut introLevel) → oyun → bölüm sonu + perk seçimi → Harita (yeni düğüm açılma animasyonu) → …`. Final bölümde harita yerine mevcut final ekranı; ardından harita "tüm düğümler tamam" durumunda açılır.

## 8. Konfigürasyon sayfası

### 8.1 Yer

**`admin.html`** (ayrı sayfa), `js/admin/` modülleri. Gerekçe: oyun paketi ve ilk yükleme küçük kalır; üretim paketinden dışlanabilir; iki sayfa aynı `js/config/*` ve `js/game/progress.js` modüllerini paylaşır. Alternatifler ve neden seçilmedi:
- `?admin` ile oyun içi ekran: oyunun yüklediği kod büyür, oyuncuya yönetim kodu iner, mobil oyun UI'ı ile form UI'ı çakışır.
- Tamamen oyun içi menü maddesi: oyuncuya gösterilmemeli.

Oyunla bağlantı: "Taslakla oyna" `index.html?cfg=draft` (yeni sekme); "Bu bölümden başlat" `index.html?cfg=draft&dev=1&level=<id>`; iframe yerine yeni sekme (Three.js bağlamı ve ses için basit, bellek yönetimi temiz).

### 8.2 Sekmeler

| Sekme | İçerik |
|---|---|
| **Genel** | `game.*`, `strings.*`, `meta`, dışa/içe aktarma, "Taslak: N değişiklik" durumu, sıfırla |
| **Karakterler** | `characters` + `player` (ad, rol, ikon, renk, bio, görünüm paleti) |
| **Düşmanlar** | `enemies` (tablo + ayrıntı formu; boss/knight dahil); canlı özet (toplam hp, tahmini baskı) |
| **Büyüler** | `weapons` + `abilities` + `perks` (sıra sürükle-bırak/yukarı-aşağı düğmesi) |
| **Bölümler & Harita** | bölüm listesi/sırası, bölüm formu (hedef, süre, doğma tabloları, ödül, totemler), **harita editörü** (düğümleri sürükle, kenarlara `via` noktası ekle, önizleme durumu: kilitli/açık/tamam anahtarı) |
| **Hikâye** | açılış, final, ölüm repliklerini ve her bölümün giriş/çıkış satırlarını (konuşmacı seçimli) tek akışta gösterir; karakter sayısı sayacı; ekranda nasıl görüneceği önizleme |
| **Ses** | tema başına müzik parametreleri (bpm, kök, gam ön ayarı, filtre...) + "Dinle" (ses motorunu içe aktarır, kullanıcı tıklamasıyla başlar) |
| **Görseller** | tema renk paletleri, hava; (opsiyonel) varlık yükleme ve boyut tablosu |
| **Sağlık** | doğrulama raporu (hata/uyarı, filtre, tıklayınca ilgili alana git), bölüm bazlı tahmini zorluk özeti, kullanılmayan öğeler, "Claude paketini oluştur" |

### 8.3 Form üretimi

Hibrit: `schema.js` alan tanımı (tür, aralık, etiket, yardım, grup) **genel form üreticisini** besler: sayı (kaydırıcı+kutu, aralığa kenetli), hex (renk seçici + metin), enum (select; seçenekler `registry.js`'ten), bool, metin/çok satırlı, `ref` (select; var olan öğelerden), emoji (kısa metin). Elle yazılan **özel editörler**: diyalog satırı listesi (konuşmacı + metin, ekle/sil/sırala), düşman→sayı haritası (başlangıç/doğma), harita editörü (SVG sürükleme, Pointer Events), müzik gamı ön ayarları, sıralama listeleri. Gerekçe: tamamen elle form = şema ile iki yerde bakım; tamamen otomatik form = harita/diyalog kullanılamaz. Satır içi doğrulama: her alanın yanında anlık hata/uyarı, `aria-invalid`, hata özeti `aria-live`.

### 8.4 Mobil uyum

Tek sütun, yatay kaydırmalı sekme çubuğu, yapışkan alt çubuk ("Taslak · N değişiklik | Oyna | Dışa aktar"), dokunma hedefi ≥44 px, sayı alanında `inputmode="decimal"`, harita editörü dokunma sürüklemesi (`touch-action: none` yalnızca harita tuvalinde). Not: yönetim masaüstünde kullanılması beklenen bir araçtır; telefonda "okuma ve küçük düzeltme" hedeflenir. Bu varsayım Emre ile teyit edilmeli.

### 8.5 Erişim ve risk

- Statik sitede **kimlik doğrulama yapılamaz**; parola kontrolü istemci tarafında olup güvenlik sağlamaz (yapılmamalı).
- Taslak yalnızca kendi tarayıcıdadır; başkası `admin.html`'i açsa bile **kimseye ait veriyi değiştiremez ve repoyu değiştiremez**, yalnızca kendi tarayıcısında taslak oluşturur. Gerçek riskler: spoiler/dahili belgelerin görünmesi (içerik zaten kaynakta açık), bozuk taslakla yanlış ilk izlenim (yalnızca kendi tarayıcısı), arama motoruna girmesi (`<meta name="robots" content="noindex">`), kullanıcıların ucuzca "hile" kurması (oyun istemci tarafı; skor tablosu yok, zararsız; bir sunucu skoru gelirse bu varsayım çöker).
- Karar: **üretim artefaktından `admin.html` ve `js/admin/` dışlanır** (Pages iş akışında kopyalama filtresi); yönetim `npx serve .` ile yerelde kullanılır. Oyun tarafındaki `?cfg=draft` ve `?dev=1` üretimde de çalışır ve yalnızca o tarayıcıyı etkiler; menüye bağlantı konmaz. Emre telefonda üretim sitesinden yönetmek isterse, bu karar tersine çevrilebilir (dışlama kaldırılır); riskler yukarıda.

## 9. Oyunun "içeriden okunması" ve Claude'a yönlendirme

- **Doğrulama/sağlık** (§4, Sağlık sekmesi) ve **tahmini zorluk özeti** bölüm başına: başlangıç düşman toplam hp'si, doğma hızı (düşman/sn), `cap`, süre, hedef için gereken tahmini süre. Etiket: "tahmin, denge testi yerine geçmez".
- **Dev modu** (`?dev=1` ya da yönetimden): küçük bir üst kenar şeridi: `config kaynağı (repo|taslak) · hash · bölüm id · fps · uyarı sayısı`; **"Bu bölümden başlat"** (`level=<id>`; `kit(levelId)` ile ödüller verilir, kayda yazılmaz); "bölümü hemen kazan/kaybet" (denetim akışlarını test etmek için); "Rapor kopyala".
- **Durum raporu** (Rapor kopyala): `{ configSource, baseHash, schemaVersion, levelId, S (özet), son 20 console.error/window.onerror kaydı, viewport/UA, fps }` metni. Emre bunu "şu bölümde şu oldu" notuyla Claude'a yapıştırır. Ağa **hiçbir şey gönderilmez**; analitik yok.
- **Önizleme**: yönetimde değişiklik → "Taslakla oyna" (yeni sekme) en güvenilir yol; yönetim sayfasında yalnız statik önizlemeler (renk kutusu, harita çizimi, diyalog düzeni). Canlı 3D model önizlemesi için `buildEnemy/buildWizard`'ın global sahneden ayrılması gerekir; bu **ikinci dalga** (§12 Adım 13), MVP'de yok.
- Claude paketi (§5.3) bu bilgileri taşır; böylece Claude "hangi alan, neden, hangi hata" bağlamıyla çalışır.

## 10. Güvenlik ve KVKK

### 10.1 XSS ve enjeksiyon

Konfigürasyondan (taslak, içe aktarma, hatta repodaki dosya) gelen her metin **güvenilmez** sayılır:
- Kural 1: metin yalnızca `textContent` ya da çıktısı kaçışlı şablonla basılır. Mevcut kod bu yönde (`esc`, `say`) ama `screen()` içindeki `innerHTML` ile birleştirilen yerler (`introLevel` içinde `foes`, `objectiveHtml`, `b.label`) config adlarını içerecek. Çözüm: `js/core/dom.js` içinde `h(tag, attrs, ...children)` DOM kurucusu ve etiketli şablon `html\`...\`` (değişkenleri otomatik kaçışlar); `innerHTML = ` ham string ataması **lint kuralı/test** ile yasaklanır (basit `grep` testi: `js/` altında `innerHTML` yalnız `dom.js`'te).
- Kural 2: biçim kısıtları doğrulayıcıda (hex, id regex, uzunluklar, ikon ≤4 karakter, yer tutucular yalnız `{goal}`/`{boss}`). Renkler CSS'e yazılmadan önce tekrar regex ile süzülür (CSS enjeksiyonu).
- Kural 3: prototip kirlenmesi: `JSON.parse` sonrası yasak anahtar taraması, birleştirme/yama uygulayıcısı `Object.create(null)`/`Object.hasOwn` ile.
- Kural 4: `data:` yalnızca `data:image/(png|webp|jpeg);base64,` kalıbı; `javascript:` vb. reddedilir.
- İsteğe bağlı sertleştirme: `<meta http-equiv="Content-Security-Policy">` (`default-src 'self'; img-src 'self' data:; script-src 'self' 'sha256-<importmap özeti>'; style-src 'self' 'unsafe-inline'`). Pages üstbilgi ekleyemez, meta CSP `frame-ancestors`'ı desteklemez. Satır içi stil ve importmap yüzünden dikkatli kurulmalı; Adım 12 sonrası ayrı iş.

### 10.2 localStorage ve KVKK

Saklananlar (anahtar → içerik): `buyucu_ses` (ses açık/kapalı), `buyucu_save` (oyun ilerlemesi, skor), `buyucu_cfg_draft` (taslak yama), `buyucu_cfg_lastgood` (config önbelleği). **Kişisel veri yoktur**: ad, e-posta, kimlik, konum yok; çerez yok, analitik/izleme yok, üçüncü taraf istek yok (Three.js ve fontlar yerel/sistem; harici font CDN'i eklenmemeli). Doğrulama notu: bu, kodu okuyarak edindiğim bilgidir; ağ trafiği araçla denetlenmedi. Gelecekte oyuncu adı, skor tablosu, hesap, analitik gelirse KVKK aydınlatma metni ve izin akışı gerekir (bu değişiklik gizli veri/yasal metin onay kapısına girer). Görsel yüklemede EXIF temizleme (§6). Bu belge hukuki görüş değildir.

## 11. Dosya yapısı

```
index.html                  kabuk: <meta>, importmap, <link css>, tek <script type="module" src="js/main.js">
admin.html                  yönetim kabuğu (üretimden hariç), noindex
css/ tokens.css  game.css  screens.css  map.css  admin.css
data/game.config.json
assets/                     (başlangıçta boş; §6 dosya varlıkları buraya)
vendor/                     Three.js (değişmez)
js/
  main.js                   açılış: config yükle → ses/sahne kur → menü
  config/ schema.js  registry.js  validate.js  migrate.js  patch.js  hash.js  adapt.js  load.js  storage.js  export.js
  core/   dom.js (h/html/esc)  util.js  state.js (S, newRun, snapshot, kit)  save.js (save şeması + migrate)
  game/   loop.js  spawn.js  ai.js  weapons.js  abilities.js  perks.js  objectives.js  progress.js (durum türetme)
  render/ scene.js  themes.js  scenery.js  wizard.js  enemies.js  fx.js
  audio/  engine.js (AUDIO)  sfx.js  music.js
  ui/     router.js  menu.js  intro.js  map.js  hud.js  result.js  settings.js
  dev/    devtools.js  report.js
  admin/  main.js  form.js  tabs/*.js  mapEditor.js  dialogEditor.js
tests/    config.validate.test.js  config.migrate.test.js  config.patch.test.js  progress.test.js  save.test.js  security.grep.test.js  fixtures/
tools/    validate-config.mjs  extract-defaults.mjs (tek seferlik)
package.json                "type":"module", scripts.test = "node --test tests/", bağımlılık YOK
```

Notlar:
- `package.json` yalnızca test çalıştırıcıdır; oyunun çalışma zamanı bağımlılığı eklenmez, build yoktur. (Mimari odasının varsayılan Node yığınından bilinçli sapma yok: Supabase/ödeme/hesap bu iş kapsamında yok; ileride gerekirse §13'e bakın.)
- `js/config/*`, `core/save.js`, `game/progress.js` **DOM ve Three.js'e dokunmaz** (Node'da test edilebilir). `render/*` ve `audio/*` DOM/Three'ye bağlıdır.
- `importmap` yalnızca `three` için; yerel modüller göreli `./x.js` (uzantılı). Admin.html kendi importmap'ine ihtiyaç duyarsa aynı satırı taşır (ses önizleme için Three gerekmez; render modüllerini import etmez).
- Pages **alt yol** (`/repo-adı/`) altında yayınlanır: kök-göreli `/js/..` YASAK; her yerde göreli. Config yolu `new URL("../data/game.config.json", import.meta.url)`, böylece hem `index.html` hem `admin.html` hem yerel hem Pages'te aynı kodla çözülür. `fetch(url, { cache: "no-cache" })` (etag ile yeniden doğrular, Pages'in `max-age=600` önbelleğine takılma azalır).
- **Önbellek tutarsızlığı riski**: modüller Pages'te 10 dk önbelleklenebilir; deploy sonrası bir kullanıcı eski ve yeni modül karışımı alabilir. Hafifletme: ana giriş `main.js` ve `data/` için `no-cache`, modül sayısı küçük tutulur, kırıcı sürüm değişikliğinde `CONFIG_SCHEMA_VERSION` uyumsuzluğu açık hata verir ("sayfayı yenile"). Tam çözüm (içerik hash'li dosya adı) build gerektirir; şimdilik kabul edilen risk.
- `file://`: ES modül ve `fetch` Chromium'da engellenir (zaten bugün de modül nedeniyle sunucu gerekiyor). `main.js` açılışında `location.protocol === "file:"` ise okunaklı ekran: "Bu oyun bir sunucudan açılmalı: `npx serve . -l 8000`". README zaten bunu söylüyor, ekran kuralı ekler.
- Mevcut CSS satır içi `<style>` (≈60 satır) `css/*.css`'e taşınır; `:root` tasarım belirteçleri (renk, boşluk, yazı ölçeği, gölge) `tokens.css`'te. Yazı tipi: sistem fontları (Georgia yığını). Özel font istenirse yerel `woff2` (lisansı kontrol edilerek), CDN yok.

### Menü/intro görsel yönü (mimariyi ilgilendiren kısmı)

- Mevcut tek `#msg` kaplaması `ui/router.js` ile gerçek **ekranlara** bölünür: `menu`, `map`, `intro` (bölüm girişi), `result` (kazan/kaybet/perk), `settings` (ses, titreşim, dil: yalnızca tr), `credits`. Eski `screen(title, html, buttons)` bir geçiş köprüsü olarak kalır (Adım 6 bitene dek) ve yeni router'a delege eder.
- Menü arka planı: zaten çalışan Three sahnesi (büyücü, ay, sis, hava) yavaş kamera yörüngesiyle **canlı arka plan**; üstte yarı saydam degrade + cam efektli panel. Ek varlık/asset gerekmez. Başlık için tipografik logo (CSS `text-shadow` + SVG süs çizgisi).
- Bölüm girişi ekranı: bölüm adı, harita ikonu, konuşmacı portresi (ikon/renk), diyalog "daktilo" animasyonu (kısaltılabilir), hedef kartı, düşman rozetleri (ad + renk), "Savaşa gir".
- Hareket azaltma (`prefers-reduced-motion`) saygı gösterilir; klavye odağı görünür; dokunma hedefleri ≥44 px; tam ekran düzen `dvh` ile (mevcut kod zaten kullanıyor).

## 12. Uygulama planı (sıralı, küçük adımlar)

Genel kural: her adım sonunda **oyun açılır, bölüm 1 oynanır, bölüm sonu/perk/ölüm akışı çalışır**; her adım ayrı commit/PR. Elle duman testi listesi (D): menüden başla → bölüm 1'i kazan → perk seç → bölüm 2 girişi → bir bölümde öl → "tekrar dene" → ses aç/kapat → mobil emülasyon (joystick/ateş) → konsolda hata yok. Otomatik: `npm test` (Node).

| # | Adım | Çıktı / neyi test et | Oyun durumu |
|---|---|---|---|
| 0 | **Test iskeleti**: `package.json` (bağımlılıksız), `tests/`, CI'da `npm test` adımı (mevcut `deploy-pages.yml` öncesi). Pages iş akışında `admin.html`/`js/admin/` dışlama filtresi (dosyalar gelince). | `npm test` boş testle yeşil | Etkisiz |
| 1 | **Şema + doğrulayıcı + migrate + patch + hash** (`js/config/*`, saf). `registry.js` (enum listeleri). Birim testleri: geçerli/geçersiz örnekler, her hata kodu, yasak anahtar, sınır değerleri, `migrate` zinciri (sahte v0→v1 fixture), `applyOps` (set/remove/ekleme), hash kararlılığı. | `npm test` | Etkisiz (oyuna bağlı değil) |
| 2 | **Gömülü sabit envanteri**: §0'daki gömülü metin/sayı listesini koddan çıkar (grep), `strings`/`levels` alanlarına eşle, eksikleri şemaya ekle. Çıktı: kısa liste (belge ya da PR açıklaması). | Gözden geçirme | Etkisiz |
| 3 | **`data/game.config.json` + `adapt.js` + eşdeğerlik testi.** Dosyayı mevcut sabitlerden `tools/extract-defaults.mjs` ile üret (hex dönüşümü dahil), elle gözden geçir. Test: `adapt(config)` çıktısı, koddaki `LEVELS/WEAPONS/ENEMIES/PERKS/THEMES/VIS/MUSIC` ile **derin eşit** (sabitler test için `tests/legacy-constants.js` olarak dondurulur). Perk `ok/apply` bildirimsel eşdeğerlik testi (S üzerinde). | `npm test` + D | Etkisiz (henüz oyun config okumuyor) |
| 4 | **Oyun config'i okur**: `load.js` (fetch + migrate + validate lenient + hata ekranı + `file://` ekranı); `index.html` içi sabit tablolar `adapt` sonucuyla değiştirilir; eski sabitler silinir. Parite için dev'de tek seferlik konsol karşılaştırması. `say()` konuşmacıları `characters`'tan, `OPENING/DEATH_LINES/objectiveHtml`/final metinleri `strings`'ten. XSS koruması: `core/dom.js` ve `innerHTML` taraması testi. | D + `npm test`; bozuk JSON ile hata ekranı elle denenir | Çalışır; kaynak artık JSON |
| 5 | **Mekanik bölme (davranışı değiştirmeden)**: `index.html` → `js/` modülleri; sırayla: `core/util,dom,state` → `config` → `audio/*` → `render/*` → `game/*` → `ui/*` → `main.js`; her modül ayrı küçük PR; en sonda `index.html` kabuk. Her PR'da D. Satır hizası: değişiklik yok; yalnızca `export/import`. | D (her PR) | Çalışır; kod modüler |
| 6 | **Router + tasarım belirteçleri**: `css/tokens.css`, `ui/router.js`; `screen()` köprüsü; menü/intro yeni görünüm (canlı 3D arka plan). İçerik aynı. | D + görsel inceleme (masaüstü + 360 px) | Çalışır |
| 7 | **Kayıt sistemi**: `core/save.js` (şema v1, migrate, bozuk kayıt dayanıklılığı), "Devam et / Yeni oyun", `introLevel` başında yazma. Birim test: save migrate, bilinmeyen id, bozuk JSON. | `npm test` + D (sayfayı yenile → devam) | Çalışır |
| 8 | **Harita ekranı**: `game/progress.js` (durum türetme, `kit`), `ui/map.js` (SVG, noktalı yol, düğüm `<button>`), akışa bağla: perk sonrası → harita. Test: `progress` birim testleri (kilitli/açık/tamam, son bölüm, tek zincir); elle: 360 px ve masaüstü, klavye gezintisi. Geçici varsayılan harita koordinatları JSON'a eklenir. | `npm test` + D | Çalışır; haritalı akış |
| 9 | **Yönetim v0 (salt okunur)**: `admin.html`, Sağlık sekmesi (doğrulama raporu), Genel sekmesi (dışa aktar tam JSON, içe aktar → doğrula → fark → taslak), `storage.js` taslak katmanı (ops, baseHash, çakışma bandı, sıfırla), oyun tarafında `?cfg=draft` + TASLAK rozeti + hatalıysa varsayılana düş. Testler: taslak uygula/çakışma/hatalı taslak yok sayma (Node, localStorage taklidiyle). | `npm test` + D + elle: taslak oluştur, repo değişince bant | Çalışır |
| 10 | **Yönetim formları**: önce Düşmanlar ve Büyüler (en çok ayar), sonra Bölümler, Karakterler, Hikâye, Ses/Görseller; hibrit form üreticisi + özel editörler. Her sekme ayrı PR. | Her sekme: alan değiştir → taslakla oyna → etkisini gör; hatalı değer → satır içi hata | Çalışır |
| 11 | **Harita editörü**: düğüm sürükle, `via` noktası, durum önizleme anahtarı; kenar/zincir doğrulama mesajları. | Elle (dokunma + fare); `progress` testleri | Çalışır |
| 12 | **Dev modu + Claude paketi**: `dev/devtools.js` ("bu bölümden başlat", rapor kopyala), `export.js` (Claude `.md` paketi: değişiklik tablosu + doğrulama + notlar), alan notu 💬. Test: paket üretimi (saf), `kit(levelId)` donanımı. | `npm test` + D | Çalışır |
| 13 | **İkinci dalga** (ayrı karar): AI parametreleri `params`'a, boss faz eşikleri; görsel yükleme (§6); canlı 3D model önizleme; meta CSP; dallanan harita. | | |

Paralellik: Adım 0–4 sıralı (tek kişi ya da iki kişi: A şema/doğrulayıcı, B inventer+JSON, 3'te birleşir). **Adım 5'ten sonra** üç iz paralel gidebilir: **İz A** (6→7→8: menü/harita/kayıt), **İz B** (9→10→11→12: yönetim; yalnızca `js/config/*` ve `js/admin/*` dosyalarına dokunur), **İz C** (oyun içeriği/denge: JSON ve `game/*` AI parametre taşıma, 13'ün ilk kısmı). Çakışma noktaları: `data/game.config.json` (şema değişikliği = sürüm artışı kuralı), `js/config/schema.js` (tek sahibi iz B), `ui/router.js` (iz A). İş paketi dökümü bu belgeden ayrıca çıkarılabilir (`docs/mimari/is-paketleri.md`'ye eklenmesi önerilir).

## 13. Riskler ve varsayımlar

Riskler:
1. **Gömülü sabitler**: AI ve boss kodunda henüz görmediğim sayı/metinler olabilir; Adım 2 bunu bulur. Config alanı "etkisiz" kalırsa (JSON'u değiştirip oyun değişmezse) Emre güvenini kaybeder: her config alanı için "oyuna etkisi" test edilmeli (yönetimde "Taslakla oyna" ile elle).
2. **Eşdeğerlik hatası**: sabitleri JSON'a taşırken yazım/dönüşüm hatası (renk, `perk.ok` mantığı). Adım 3'ün derin-eşitlik testi bu yüzden zorunlu.
3. **5. adımdaki mekanik bölme** en riskli adım: 2800 satırlık, tek kapsamlı (global `S`, `scene`, `enemies` dizileri) kodda modül sınırları döngüsel bağımlılık çıkarabilir. Önlem: önce `state.js` içinde paylaşılan durum, küçük PR'lar, her PR'da D; döngü çıkarsa "ortak durum modülü + olay çıkarıcı" ile kırılır. Bu adımın süresini tahmin edemiyorum.
4. **Önbellek tutarsızlığı** (modül parçaları, Pages `max-age=600`) §11'de; build'siz kabul edilen risk.
5. **Denge**: Emre sayıları kolayca bozabilir (bölüm imkânsız/anlamsız); doğrulayıcı yalnız "geçerli"yi ölçer, "eğlenceli"yi değil. W_BALANCE sezgileri yaklaşıktır; yanlış alarm/kaçırma olabilir.
6. **Taslak kaybı**: `localStorage` temizlenince/farklı origin'de taslak yok olur; dışa aktarma alışkanlığı gerekir. Yönetimde "son dışa aktarma: …" göstergesi önerilir.
7. **Mobil performans**: `cap` ve `weather.n` Emre tarafından artırılabilir; üst sınırlar şemada (cap≤14, n≤240) ve uyarı olarak var, gerçek cihazda ölçülmedi.
8. **Emoji tutarsızlığı** (cihaza göre) ve **telif** (kullanıcı görseli).
9. **Harita dikey telefonda** küçük görünebilir; ikinci yerleşim sonraya bırakıldı.
10. **Ödeme gelirse** GitHub Pages'ten çıkış gerekir; bu mimari buna engel değil ama hesap/ödeme/Supabase kararı bu belgenin kapsamı dışında, ayrıca `docs/mimari/mimari.md` konusu.

Varsayımlar (Emre/yönetici teyit etmeli):
- Oyun şimdilik tek oyunculu, hesapsız, ücretsiz; sunucu tarafı yok.
- Yönetim sayfasını esas olarak Emre masaüstünde ve yerel sunucuda kullanır.
- Haritada v1 için doğrusal ilerleme yeterli; dallanma yok.
- Türkçe tek dil (i18n altyapısı kurulmadı; metinler zaten veri olduğu için ileride dil dosyasına bölmek kolay).
- Düşman/büyü **davranışı** değiştirmek Emre için "Claude'a iş ver" kapsamıdır, yönetim sayfasından yapılmaz.
- Node 18+ yerelde mevcut (yalnızca test için).
- Okuma sırasında `index.html`'in güncel olduğu ve `deploy-pages.yml`'in yalnızca dosyaları yayınladığı (build adımı olmadığı) varsayıldı; doğrulanmadı.

## 14. Açık sorular (Emre'ye)

1. Yönetim üretim sitesinde de erişilebilir mi olsun (telefondan düzenleme), yoksa yalnızca yerel mi (öneri: yerel)?
2. Harita: doğrusal zincir yeterli mi, yoksa dallanma/bonus bölümler istiyor mu?
3. Tamamlanan bölümü tekrar oynama "alıştırma" modu (öneri) mu olsun, yoksa run'a dahil mi?
4. Kullanıcı görseli yükleme (portre/harita arka planı) gerçekten gerekli mi? Gerekli değilse §6 son kalemi hiç yapılmaz, risk sıfırlanır.
5. Gelecekte skor tablosu/hesap/ödeme planı var mı? Varsa barındırma ve KVKK kararı şimdiden `mimari.md`'ye işlenmeli.
