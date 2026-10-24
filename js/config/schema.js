// Konfigürasyon şeması: tek "alan tanımı" tablosu. Aynı tablo doğrulamayı, varsayılanları ve
// (sonraki aşamada) yönetim formunu besler. DOM ve Three.js'e dokunmaz.
//
// Alan tanımı: { t: tür, req?: zorunlu, def?: varsayılan, label?: Türkçe etiket, ... türe özgü sınırlar }
// Türler: int, num, str, hex, bool, enum, ref, arr, obj, map (id'li nesne), rec (ref anahtarlı nesne)

import { ART_RE, ENUMS, ID_RE, UI_ICON_KEYS, WEATHER_MAX } from "./registry.js";

export const CONFIG_SCHEMA_VERSION = 1;

const o = (x) => x || {};
export const int = (min, max, x) => ({ t: "int", min, max, ...o(x) });
export const num = (min, max, x) => ({ t: "num", min, max, ...o(x) });
export const str = (min, max, x) => ({ t: "str", min, max, ph: [], ...o(x) }); // ph: izinli {yer_tutucu} adları
export const hex = (x) => ({ t: "hex", ...o(x) });
export const bool = (x) => ({ t: "bool", ...o(x) });
export const enm = (list, x) => ({ t: "enum", list, ...o(x) }); // list: ENUMS anahtarı ya da dizi
export const ref = (coll, x) => ({ t: "ref", coll, ...o(x) }); // coll: kök koleksiyon adı
export const arr = (item, min, max, x) => ({ t: "arr", item, min, max, ...o(x) });
export const obj = (fields, x) => ({ t: "obj", fields, ...o(x) });
export const map = (item, min, max, x) => ({ t: "map", item, min, max, ...o(x) }); // anahtar = yeni id (ID_RE)
export const rec = (coll, item, x) => ({ t: "rec", coll, item, ...o(x) }); // anahtar = var olan id

// görsel yolu: assets/art/<ad>.webp (kalıp doğrulayıcıda zorlanır; ihlal = E_FORMAT)
export const art = (x) => ({ t: "str", min: 1, max: 80, ph: [], pattern: ART_RE, patHint: "assets/art/ad.webp", ...o(x) });

export const R = (spec) => ({ ...spec, req: true });

// ---- ortak parçalar ----
const dialogLine = obj({
  speaker: ref("characters", { label: "Konuşmacı" }),
  text: str(1, 240, { req: true, label: "Metin" }),
}, { label: "Diyalog satırı" });

const musicFields = (req) => {
  const r = req ? { req: true } : {};
  return {
    root: int(24, 72, { ...r, label: "Kök nota (MIDI)" }),
    scale: arr(int(0, 11), 3, 9, { ...r, increasing: true, label: "Gam (yarım tonlar)" }),
    bpm: int(40, 160, { ...r, label: "Tempo (bpm)" }),
    chords: arr(int(0, 14), 1, 8, { ...r, label: "Akor dereceleri" }),
    cut: int(200, 4000, { ...r, label: "Pad filtresi (Hz)" }),
    arpP: num(0, 1, { label: "Arp olasılığı" }),
    arpWave: enm("WAVES", { label: "Arp dalga" }),
    arpOct: int(0, 24, { label: "Arp oktav kaydırma" }),
    arpDec: num(0.05, 2, { label: "Arp sönüm (sn)" }),
    arpVol: num(0, 0.4, { label: "Arp ses" }),
    bellP: num(0, 1, { label: "Çan olasılığı" }),
    bellOct: int(0, 48, { label: "Çan oktav kaydırma" }),
    wind: num(0, 1.5, { label: "Rüzgâr" }),
    detune: num(0, 40, { label: "Pad detune" }),
    padVol: num(0, 0.3, { label: "Pad ses" }),
    drumThr: num(0, 1, { label: "Davul eşiği" }),
    kick: arr(int(0, 15), 0, 16, { label: "Kick adımları" }),
    tomLow: bool({ label: "Alçak tom" }),
    noHat: bool({ label: "Hi-hat yok" }),
    burst: bool({ label: "Gürültü patlamaları" }),
    motif: bool({ label: "Pırıl motifi" }),
    pad4: bool({ label: "Dört sesli pad" }),
    padAtt: num(0.05, 4, { label: "Pad atak (sn)" }),
    chordBars: int(1, 4, { label: "Akor başına ölçü" }),
    arpRepeat: bool({ label: "Arp tekrar" }),
    fifth: bool({ label: "Drone'a beşli ekle" }),
  };
};

const lookFields = {};
for (const [k, label] of [["robeTop", "Cüppe üst"], ["robeBottom", "Cüppe alt"], ["skin", "Ten"], ["gold", "Altın"], ["hat", "Şapka"], ["beard", "Sakal/kaş"], ["eye", "Göz"], ["wandGlow", "Asa parıltısı"]]) lookFields[k] = hex({ req: true, label });

// ---- şema ----
export const SCHEMA = obj({
  meta: R(obj({
    schemaVersion: int(1, 999, { req: true, label: "Şema sürümü" }),
    name: str(1, 60, { label: "Ad" }),
    notes: str(0, 2000, { label: "Notlar" }),
  }, { label: "Üst bilgi" })),

  game: obj({
    startHp: int(1, 10, { def: 3, label: "Başlangıç canı" }),
    maxHpCap: int(1, 12, { def: 6, label: "Can üst sınırı" }),
    baseSpeed: num(3, 16, { def: 8, label: "Taban hız" }),
    perkChoices: int(1, 5, { def: 3, label: "Perk seçenek sayısı" }),
    clearHeal: num(0, 3, { def: 1, label: "Bölüm sonu can yenileme" }),
    scoreLevelBonus: int(0, 10000, { def: 100, label: "Bölüm puanı (bölüm no ile çarpılır)" }),
    scoreTimeMul: int(0, 50, { def: 2, label: "Kalan saniye puanı" }),
    menuBackground: art({ label: "Ana menü arka plan görseli" }),
  }, { fill: true, label: "Oyun" }),

  strings: R(obj({
    title: str(1, 60, { req: true, label: "Oyun adı" }),
    opening: str(1, 400, { req: true, label: "Açılış metni" }),
    tagline: str(1, 400, { req: true, ph: ["levelCount"], label: "Slogan / tanıtım" }),
    controlsHelp: str(1, 400, { req: true, label: "Kontrol yardımı" }),
    mobileHelp: str(1, 600, { req: true, label: "Mobil yardım" }),
    startButton: str(1, 40, { req: true, label: "Başlat düğmesi" }),
    finalTitle: str(1, 60, { req: true, label: "Final başlığı" }),
    finalLine: str(1, 200, { req: true, label: "Final satırı" }),
    finalScore: str(1, 100, { req: true, ph: ["score"], label: "Final puanı" }),
    replay: str(1, 40, { req: true, label: "Yeniden oyna düğmesi" }),
    deathLines: arr(dialogLine, 1, 12, { req: true, label: "Ölüm repliği" }),
    objective: R(obj({
      crystal: str(1, 100, { req: true, ph: ["goal"], label: "Hedef: kristal" }),
      survive: str(1, 100, { req: true, ph: ["goal"], label: "Hedef: hayatta kal" }),
      totem: str(1, 100, { req: true, ph: ["goal"], label: "Hedef: totem" }),
      miniboss: str(1, 100, { req: true, label: "Hedef: yarı boss" }),
      boss: str(1, 100, { req: true, label: "Hedef: boss" }),
    }, { label: "Hedef şablonları" })),
    hud: R(obj({
      level: str(1, 60, { req: true, ph: ["n", "total"], label: "Bölüm sayacı" }),
      goalCrystal: str(1, 60, { req: true, ph: ["n", "goal"], label: "Kristal sayacı" }),
      goalSurvive: str(1, 60, { req: true, label: "Hayatta kal" }),
      goalTotem: str(1, 60, { req: true, ph: ["n", "goal"], label: "Totem sayacı" }),
      goalMiniboss: str(1, 60, { req: true, label: "Yarı boss hedefi" }),
      goalBoss: str(1, 60, { req: true, label: "Boss hedefi" }),
      goalPhase: str(1, 40, { req: true, ph: ["phase"], label: "Boss faz eki" }),
      time: str(1, 40, { req: true, ph: ["n"], label: "Süre" }),
      score: str(1, 40, { req: true, ph: ["n"], label: "Puan" }),
    }, { label: "Üst çubuk" })),
    level: R(obj({
      title: str(1, 80, { req: true, ph: ["n", "name"], label: "Bölüm girişi başlığı" }),
      foes: str(1, 80, { req: true, ph: ["foes"], label: "Düşman listesi" }),
      stats: str(1, 80, { req: true, ph: ["time", "hp", "maxHp"], label: "Süre/can" }),
      hint: str(1, 200, { req: true, label: "İpucu" }),
      enter: str(1, 40, { req: true, label: "Savaşa gir" }),
    }, { label: "Bölüm girişi" })),
    gameOver: R(obj({
      stats: str(1, 80, { req: true, ph: ["n", "score"], label: "Ölüm özeti" }),
      retry: str(1, 60, { req: true, label: "Tekrar dene" }),
      retryNote: str(1, 100, { req: true, label: "Tekrar dene notu" }),
      restart: str(1, 60, { req: true, label: "Baştan başla" }),
    }, { label: "Ölüm ekranı" })),
    clear: R(obj({
      title: str(1, 60, { req: true, ph: ["n"], label: "Bölüm tamam başlığı" }),
      bonus: str(1, 60, { req: true, ph: ["bonus"], label: "Süre bonusu" }),
      newWeapon: str(1, 100, { req: true, ph: ["name", "key"], label: "Yeni büyü" }),
      newAbility: str(1, 100, { req: true, ph: ["name", "key"], label: "Yeni yetenek" }),
      pickPerk: str(1, 60, { req: true, label: "Perk seç" }),
    }, { label: "Bölüm sonu" })),
    toasts: R(obj({
      bossPhase2: str(1, 200, { req: true, label: "Boss faz 2" }),
      bossPhase3: str(1, 200, { req: true, label: "Boss faz 3" }),
      shieldBreak: str(1, 120, { req: true, label: "Kalkan kırıldı" }),
      shieldUp: str(1, 160, { req: true, label: "Kalkan geri döndü" }),
      knightEnrage: str(1, 120, { req: true, label: "Şövalye öfkelendi" }),
    }, { label: "Bildirimler" })),
  }, { label: "Metinler" })),

  characters: R(map(obj({
    name: str(1, 24, { req: true, label: "Ad" }),
    role: enm("ROLES", { req: true, label: "Rol" }),
    icon: str(1, 4, { label: "Simge" }),
    color: hex({ label: "Ad rengi" }),
    bio: str(1, 300, { label: "Kısa biyografi" }),
    portrait: art({ label: "Portre görseli" }),
  }, { label: "Karakter" }), 1, 24, { label: "Karakterler" })),

  player: R(obj({
    character: ref("characters", { req: true, label: "Karakter" }),
    startHp: int(1, 10, { label: "Başlangıç canı (oyun ayarını ezer)" }),
    speedMul: num(0.5, 2, { def: 1, label: "Hız çarpanı" }),
    scale: num(0.6, 1.6, { def: 1, label: "Ölçek" }),
    look: R(obj(lookFields, { label: "Görünüm paleti" })),
  }, { label: "Oyuncu" })),

  enemies: R(map(obj({
    name: str(1, 24, { req: true, label: "Ad" }),
    shortName: str(1, 24, { label: "Boss çubuğu adı" }),
    hp: num(0.5, 500, { req: true, label: "Can" }),
    speed: num(0, 12, { req: true, label: "Hız" }),
    r: num(0.2, 4, { req: true, label: "Çarpışma yarıçapı" }),
    y: num(0, 5, { def: 0, label: "Yükseklik" }),
    scale: num(0.5, 3, { def: 1, label: "Görsel ölçek" }),
    score: int(0, 10000, { def: 0, label: "Puan" }),
    drop: num(0, 1, { def: 0, label: "Kalp düşürme olasılığı" }),
    dmg: num(0, 5, { def: 0, label: "Hasar" }),
    color: hex({ req: true, label: "Renk" }),
    emissive: hex({ req: true, label: "Parıltı rengi" }),
    ai: enm("AI_KINDS", { req: true, label: "Yapay zekâ" }),
    model: enm("MODEL_KINDS", { label: "Model (varsayılan: kimlik)" }),
    character: ref("characters", { label: "Karakter bağı" }),
    zig: bool({ label: "Zikzak" }),
    spin: bool({ label: "Dönerek bak" }),
    noCap: bool({ label: "Doğma sınırına sayılmaz" }),
    static: bool({ label: "Hareketsiz" }),
    bob: num(0, 0.3, { label: "Süzülme" }),
    summon: ref("enemies", { label: "Doğurduğu düşman (totem)" }),
    summons1: arr(ref("enemies"), 0, 4, { label: "Boss faz 1 çağrısı" }),
    summons2: arr(ref("enemies"), 0, 4, { label: "Boss faz 2 çağrısı" }),
    image: art({ label: "Düşman görseli (rozet, boss çubuğu)" }),
  }, { label: "Düşman" }), 1, 40, { label: "Düşmanlar" })),

  weapons: R(map(obj({
    name: str(1, 24, { req: true, label: "Ad" }),
    icon: str(1, 4, { req: true, label: "Simge" }),
    image: art({ label: "İkon görseli" }),
    imageSmall: art({ label: "Küçük ikon görseli (slot, 128 px)" }),
    color: hex({ req: true, label: "Renk" }),
    cd: num(0.1, 10, { req: true, label: "Bekleme (sn)" }),
    dmg: num(0.5, 20, { req: true, label: "Hasar" }),
    speed: num(4, 40, { label: "Mermi hızı" }),
    pierceable: bool({ label: "Delici perk uygulanır" }),
    slow: bool({ label: "Yavaşlatır" }),
    spread: obj({ n: int(2, 7, { req: true }) }, { label: "Yelpaze" }),
    chain: obj({ n: int(2, 8, { req: true }), range: num(3, 25, { req: true }) }, { label: "Zincir" }),
    cloud: obj({ dist: num(1, 20, { req: true }), r: num(0.5, 8, { req: true }), life: num(0.5, 15, { req: true }) }, { label: "Bulut" }),
    meteor: obj({ r: num(0.5, 8, { req: true }), delay: num(0.2, 4, { req: true }) }, { label: "Meteor" }),
    nova: obj({ r: num(0.5, 12, { req: true }), push: num(0, 8, { req: true }) }, { label: "Halka" }),
  }, { label: "Büyü" }), 1, 9, { label: "Büyüler" })),
  weaponOrder: R(arr(ref("weapons"), 1, 9, { label: "Büyü sırası (tuş 1..N)" })),

  abilities: R(map(obj({
    name: str(1, 24, { req: true, label: "Ad" }),
    icon: str(1, 4, { req: true, label: "Simge" }),
    image: art({ label: "İkon görseli" }),
    imageSmall: art({ label: "Küçük ikon görseli (slot, 128 px)" }),
    cd: num(1, 60, { req: true, label: "Bekleme (sn)" }),
    params: obj({
      duration: num(0.5, 60, { label: "Süre" }),
      dist: num(1, 15, { label: "Mesafe" }),
      iframes: num(0, 3, { label: "Dokunulmazlık (sn)" }),
      factor: num(0.1, 1, { label: "Yavaşlatma çarpanı" }),
    }, { label: "Parametreler" }),
  }, { label: "Yetenek" }), 0, 3, { label: "Yetenekler" })),
  abilityOrder: R(arr(ref("abilities"), 0, 3, { label: "Yetenek sırası (Q/E/R)" })),

  perks: R(map(obj({
    name: str(1, 30, { req: true, label: "Ad" }),
    desc: str(1, 90, { req: true, label: "Açıklama" }),
    image: art({ label: "İkon görseli" }),
    maxStacks: int(1, 9, { label: "Azami yığın (boş = sınırsız)" }),
    minLevel: int(0, 20, { def: 0, label: "Asgari bölüm (0 tabanlı)" }),
    effect: R(obj({
      kind: enm(["add", "mul", "flag"], { req: true, label: "Tür" }),
      stat: str(1, 24, { req: true, label: "Alan" }),
      value: num(-100, 100, { req: true, label: "Değer" }),
    }, { label: "Etki" })),
  }, { label: "Perk" }), 1, 30, { label: "Perkler" })),
  perkOrder: R(arr(ref("perks"), 1, 30, { label: "Perk sırası" })),

  themes: R(map(obj({
    name: str(1, 40, { req: true, label: "Ad" }),
    bg: hex({ req: true, label: "Arka plan" }),
    floor: hex({ req: true, label: "Zemin" }),
    ring: hex({ req: true, label: "Halka / çerçeve" }),
    hemi: hex({ req: true, label: "Ortam ışığı" }),
    moon: hex({ req: true, label: "Ay ışığı" }),
    fog: num(0.01, 0.08, { req: true, label: "Sis yoğunluğu" }),
    floorKind: enm("FLOOR_KINDS", { req: true, label: "Zemin türü" }),
    scenery: enm("SCENERY_KINDS", { req: true, label: "Dekor" }),
    seed: int(0, 9999, { label: "Zemin deseni tohumu (varsayılan: sıra)" }),
    weather: R(obj({
      n: int(0, WEATHER_MAX, { req: true, label: "Parçacık sayısı" }),
      col: hex({ req: true, label: "Renk" }),
      vy: num(-5, 5, { req: true, label: "Dikey hız" }),
      dx: num(-5, 5, { req: true, label: "Yatay hız" }),
      size: num(0.05, 2, { req: true, label: "Boyut" }),
      add: bool({ req: true, label: "Işık gibi toplanır" }),
      op: num(0, 1, { req: true, label: "Opaklık" }),
    }, { label: "Hava" })),
    mist: num(0, 0.8, { req: true, label: "Alçak sis" }),
    music: R(obj({ ...musicFields(true), phase3: obj(musicFields(false), { label: "Boss faz 3 farkı" }) }, { label: "Müzik" })),
  }, { label: "Tema" }), 1, 24, { label: "Temalar" })),

  levels: R(map(obj({
    name: str(1, 40, { req: true, label: "Ad" }),
    objective: enm("OBJECTIVES", { req: true, label: "Hedef türü" }),
    goal: int(1, 300, { req: true, label: "Hedef sayısı" }),
    time: int(15, 300, { req: true, label: "Süre (sn)" }),
    theme: ref("themes", { req: true, label: "Tema" }),
    crystals: int(0, 10, { label: "Aynı anda kristal" }),
    start: rec("enemies", int(0, 12), { req: true, label: "Başlangıç düşmanları" }),
    spawn: arr(rec("enemies", int(1, 4)), 0, 8, { req: true, label: "Doğma dalgaları" }),
    every: num(2, 30, { req: true, label: "Doğma aralığı (sn)" }),
    cap: int(1, 30, { req: true, label: "Eşzamanlı düşman sınırı" }),
    reward: ref("weapons", { label: "Ödül büyü" }),
    ability: ref("abilities", { label: "Ödül yetenek" }),
    totems: arr(arr(num(-12, 12), 2, 2), 1, 6, { label: "Totem konumları [x,z]" }),
    image: art({ label: "Bölüm kapak görseli (3:2)" }),
    nodeImage: art({ label: "Harita düğümü madalyonu (kare)" }),
    intro: arr(dialogLine, 1, 4, { req: true, label: "Giriş anlatısı" }),
    outro: arr(dialogLine, 1, 4, { req: true, label: "Çıkış anlatısı" }),
    // 2. aşama (harita) için ayrılmış; şimdilik isteğe bağlı
    map: obj({
      x: num(0, 5000, { req: true }), y: num(0, 5000, { req: true }),
      icon: str(1, 4), label: enm("LABEL_POS"),
    }, { label: "Harita konumu" }),
  }, { label: "Bölüm" }), 1, 30, { label: "Bölümler" })),

  campaign: R(obj({
    order: arr(ref("levels"), 1, 30, { req: true, label: "Bölüm sırası" }),
    start: ref("levels", { label: "Başlangıç bölümü" }),
    edges: arr(obj({
      from: ref("levels", { req: true }), to: ref("levels", { req: true }),
      via: arr(arr(num(0, 5000), 2, 2), 0, 12), style: enm(["dotted", "solid"]),
    }), 0, 60, { label: "Harita yolları" }),
  }, { label: "Kampanya" })),

  ui: obj({
    icons: obj(Object.fromEntries(UI_ICON_KEYS.map((k) => [k, art({ label: "İkon: " + k })])), { label: "Arayüz ikonları (görsel geçersiz kılma)" }),
  }, { label: "Arayüz" }),

  map: obj({
    viewBox: arr(num(100, 5000), 2, 2, { label: "Görünüm kutusu" }),
    background: obj({ preset: enm("MAP_PRESETS"), tint: hex(), image: art({ label: "Harita arka plan görseli" }) }),
    nodeRadius: num(20, 48, { label: "Düğüm yarıçapı" }),
  }, { label: "Harita" }),
}, { label: "Konfigürasyon" });

export function enumList(spec) {
  return Array.isArray(spec.list) ? spec.list : ENUMS[spec.list];
}
export { ID_RE };
