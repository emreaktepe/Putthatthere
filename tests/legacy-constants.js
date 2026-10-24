// DONDURULMUŞ eski sabitler: index.html'in tek dosyalı sürümünden (data-driven öncesi) birebir kopya.
// Yalnızca eşdeğerlik testi (tests/config.equivalence.test.js) kullanır; oyun kodu bunu import ETMEZ.
// Düzenleme: bu dosya değişmemeli; oyun içeriği artık data/game.config.json içindedir.

export const START_HP = 3;
export const BASE_SPEED = 8;

const MUSIC = [
  { root: 50, scale: [0, 2, 3, 5, 7, 9, 10], bpm: 66, chords: [0, 3, 0, 6], cut: 700, arpP: 0.5, arpWave: "triangle", bellP: 0.45, wind: 0.5, motif: true },
  { root: 52, scale: [0, 1, 3, 5, 7, 8, 10], bpm: 60, chords: [0, 1, 0, 6], cut: 520, arpP: 0.3, arpWave: "sine", arpDec: 0.5, bellP: 0.6, wind: 0.3, padVol: 0.08 },
  { root: 48, scale: [0, 3, 5, 7, 10], bpm: 72, chords: [0, 0, 2, 4], cut: 640, arpP: 0.15, arpWave: "triangle", bellP: 0.4, wind: 0.35, drumThr: 0.3, kick: [0, 10], tomLow: true, noHat: true },
  { root: 45, scale: [0, 2, 3, 5, 7, 8, 11], bpm: 76, chords: [0, 3, 4, 0], cut: 650, arpP: 0.28, arpWave: "triangle", arpOct: 12, bellP: 0.55, wind: 0.4, detune: 13 },
  { root: 52, scale: [0, 2, 4, 6, 7, 9, 11], bpm: 84, chords: [0, 1, 4, 1], cut: 1400, arpP: 0.8, arpWave: "triangle", arpOct: 12, arpDec: 0.18, bellP: 0.75, bellOct: 36, wind: 0.9 },
  { root: 50, scale: [0, 1, 4, 5, 7, 8, 10], bpm: 96, chords: [0, 1, 0, 6], cut: 900, arpP: 0.7, arpWave: "square", arpVol: 0.07, bellP: 0.3, wind: 0.4, drumThr: 0.1, kick: [0, 6, 8, 12], burst: true },
  { root: 55, scale: [0, 2, 4, 6, 7, 9, 11], bpm: 88, chords: [0, 1, 4, 0], cut: 1800, arpP: 0.8, arpWave: "triangle", arpOct: 12, bellP: 0.85, wind: 0.3, detune: 10, padVol: 0.1 },
  { root: 49, scale: [0, 2, 3, 5, 6, 8, 9, 11], bpm: 80, chords: [0, 3, 6, 4], cut: 600, arpP: 0.25, arpWave: "triangle", arpRepeat: true, bellP: 0.35, wind: 0.5, detune: 18, drumThr: 0.35, kick: [0, 10], tomLow: true, noHat: true },
  { root: 50, scale: [0, 2, 3, 5, 7, 8, 11], bpm: 108, chords: [0, 5, 0, 4], chordBars: 1, cut: 2200, arpP: 0.6, arpWave: "square", arpVol: 0.07, bellP: 0.2, wind: 0.3, pad4: true, padAtt: 0.25, kick: [0, 4, 8, 12], detune: 9 },
];
const P3 = { ...MUSIC[8], scale: [0, 2, 4, 7, 9], chords: [3, 0, 1, 3], cut: 1200, padAtt: 1.2, pad4: false, chordBars: 1 };
export { MUSIC, P3 };

const LEVELS = [
  { name: "Fısıldayan Orman", objective: "crystal", goal: 6, time: 50, theme: 0, start: { ghost: 3 }, spawn: [{ ghost: 1 }], every: 8, cap: 5, reward: "frost",
    intro: ["Zerrin: Kule sustu, orman konuşuyor. Kristalleri topla; mana olmadan büyü olmaz."],
    outro: ["Zerrin: Fena değil. Ormanın fısıltısı seni tanıdı.", "Küçük bir ışık yolunu aydınlattı."] },
  { name: "Yarasa Mağarası", objective: "crystal", goal: 8, time: 55, theme: 1, start: { ghost: 2, bat: 3 }, spawn: [{ bat: 1, ghost: 1 }], every: 7, cap: 7, reward: "arcane",
    intro: ["Pırıl: Vızıltıyı duyuyor musun? Mağara canlı."],
    outro: ["Zerrin: Yarasalar korkudan değil, lanetten çıldırıyor. Üçlü büyü bunu halleder."] },
  { name: "Taş Bekçiler", objective: "crystal", goal: 10, time: 60, theme: 2, start: { ghost: 2, bat: 2, golem: 2 }, spawn: [{ golem: 1, bat: 1 }], every: 7, cap: 8, reward: "lightning",
    intro: ["Bu harabe bir zamanlar kralın nöbetçilerinin evi. Şimdi lanet, onları taşa gömdü."],
    outro: ["Taşkın taşlaşmış kabuğunu çatlattı: 'Ben… yürüyebiliyorum. Peşindeyim.' Yıldırım çarptığında lanet bir an titredi."] },
  { name: "Hortlak Mezarlığı", objective: "crystal", goal: 12, time: 65, theme: 3, start: { ghost: 3, bat: 2, golem: 2, archer: 2 }, spawn: [{ ghost: 1, archer: 1 }], every: 6, cap: 10, ability: "shield",
    intro: ["Mezarlar açık, mezarcı yok. Kemik Okçuları menzilden vurur; hareket etmeyi bırakma."],
    outro: ["Zerrin: Kralın askerleri bile huzur bulamıyor. Gece Kalbi'nin çatlağı büyüyor."] },
  { name: "Donmuş Geçit", objective: "survive", goal: 45, time: 45, theme: 4, crystals: 2, start: { ghost: 3, bat: 3, wolf: 2 }, spawn: [{ wolf: 2, bat: 1 }], every: 5, cap: 9, ability: "blink",
    intro: ["Rüzgâr kemiğe işliyor. Kurt ruhları sürü halinde geliyor; sadece ayakta kal."],
    outro: ["Şafağa daha çok var, ama Pırıl'ın ışığı ilk kez gerçek bir sıcaklık gibi hissettirdi."] },
  { name: "Yanık Köy", objective: "totem", goal: 3, time: 75, theme: 5, crystals: 3, start: { ghost: 3, golem: 2, ember: 3 }, spawn: [{ ember: 1, ghost: 1 }], every: 6, cap: 10, reward: "poison",
    totems: [[-9, -8], [9, -8], [0, 9]],
    intro: ["Köy yanmadı, lanet onu hatırlatıyor. Totemleri yık; kor hortlaklar yakınında patlıyor."],
    outro: ["Totem parçalanınca Pırıl titredi: 'Bu ses… babamın sesi.' Zerrin sustu."] },
  { name: "Kristal Yatağı", objective: "crystal", goal: 14, time: 80, theme: 6, start: { ghost: 3, bat: 3, golem: 2, archer: 2, priest: 2 }, spawn: [{ priest: 1, bat: 1 }, { archer: 1, bat: 1 }], every: 6, cap: 11, reward: "meteor",
    intro: ["Gece Kalbi'nin kırıkları burada parlıyor. Rahipler düşmanları iyileştirir; önce onları bul."],
    outro: ["Zerrin: Kalbin son kırığı kalede. Dikkat et Aldemir, o kısım artık Veyis'in kendisi."] },
  { name: "Kemik Kule", objective: "miniboss", goal: 1, time: 85, theme: 7, start: { knight: 1, archer: 2, wolf: 2 }, spawn: [{ archer: 1, ghost: 1 }], every: 6, cap: 9, reward: "nova", ability: "timeslow",
    intro: ["Kralın baş nöbetçisi kuleyi bırakmadı. Şövalye ağır ama bir vuruşu seni gönderir."],
    outro: ["Şövalye toza döndü. Kale kapısı açıldı ve yukarıdan bir ses duyuldu: 'Kızım… neredesin?'"] },
  { name: "Gölge Kalesi", objective: "boss", goal: 1, time: 100, theme: 8, start: { boss: 1 }, spawn: [], every: 6, cap: 8,
    intro: ["Veyis: Kızımı geri verin. Şafak gelirse onu bir daha göremem.", "Zerrin: Aldemir, ona acıma ama unutma da."],
    outro: ["Gölge dağıldı. Pırıl babasının elini tuttu ve ilk şafak sökerken ikisi de ışığa karıştı. Vadi uyandı. Aldemir ilk kez rahat uyudu."] },
];
const OPENING = "Şafak yüzyıldır doğmadı. Gece Kalbi çatladı. Bunu düzeltebilecek tek kişi, o gece uyuyakalan büyücü: sensin.";
const DEATH_LINES = [
  "Karanlık kazandı… bu gece.",
  "Zerrin: Kalk. Bir yanlış daha yap, ama başka bir yanlış.",
  "Pırıl solgunlaştı. Tekrar dene.",
];
const WEAPONS = {
  fire: { name: "Ateş Topu", icon: "🔥", key: "1", color: 0xffa03a, cd: 0.35, dmg: 1, speed: 16, pierceable: true },
  frost: { name: "Buz Oku", icon: "❄️", key: "2", color: 0x7fd6ff, cd: 0.5, dmg: 1, speed: 15, slow: true, pierceable: true },
  arcane: { name: "Üçlü Büyü", icon: "✨", key: "3", color: 0xd27bff, cd: 0.65, dmg: 1, speed: 15, spread: 3, pierceable: true },
  lightning: { name: "Yıldırım", icon: "⚡", key: "4", color: 0xfff27a, cd: 0.9, dmg: 2, chain: 3, range: 13 },
  poison: { name: "Zehir Bulutu", icon: "🧪", key: "5", color: 0x6bff6b, cd: 1.4, dmg: 1, speed: 12, cloud: { dist: 8, r: 2.2, life: 4 } },
  meteor: { name: "Meteor", icon: "☄️", key: "6", color: 0xff7a2a, cd: 2.8, dmg: 3, meteor: { r: 3, delay: 0.8 } },
  nova: { name: "Ay Işığı Halkası", icon: "🌙", key: "7", color: 0xcfe4ff, cd: 4.5, dmg: 1, nova: { r: 4, push: 2 } },
};
const WEAPON_ORDER = ["fire", "frost", "arcane", "lightning", "poison", "meteor", "nova"];

const ABILITIES = {
  shield: { name: "Mana Kalkanı", icon: "🛡️", key: "Q", code: "KeyQ", cd: 14 },
  blink: { name: "Işınlan", icon: "💨", key: "E", code: "KeyE", cd: 5 },
  timeslow: { name: "Zaman Çatlağı", icon: "⏳", key: "R", code: "KeyR", cd: 18 },
};
const ABILITY_ORDER = ["shield", "blink", "timeslow"];
const ENEMIES = {
  ghost: { hp: 1, speed: 2.2, r: 0.7, y: 1.2, score: 20, drop: 0.12, color: 0xc9ffd9, emissive: 0x2f9e5a, dmg: 1, ai: "chase" },
  bat: { hp: 1, speed: 4.6, r: 0.5, y: 1.6, score: 25, drop: 0.12, color: 0xb98bff, emissive: 0x5a2fa0, dmg: 1, zig: true, ai: "chase" },
  golem: { hp: 4, speed: 1.3, r: 1.2, y: 1.2, score: 60, drop: 0.4, color: 0x8a8a96, emissive: 0x2a2a35, dmg: 1, ai: "chase", spin: true },
  archer: { hp: 2, speed: 1.6, r: 0.6, y: 1.0, score: 40, drop: 0.2, color: 0xe8e4d0, emissive: 0x1a2744, dmg: 1, ai: "ranged", bob: 0.05 },
  wolf: { hp: 2, speed: 2.4, r: 0.7, y: 0.7, score: 45, drop: 0.15, color: 0xbfe9ff, emissive: 0x3a7aa8, dmg: 1, ai: "charge", bob: 0.05 },
  ember: { hp: 2, speed: 3.2, r: 0.7, y: 1.0, score: 50, drop: 0.1, color: 0xff8a3a, emissive: 0xc04a00, dmg: 0, ai: "bomber" },
  priest: { hp: 5, speed: 1.2, r: 0.9, y: 1.0, score: 80, drop: 0.5, color: 0x4a2a6a, emissive: 0x2a8a4a, dmg: 0, ai: "support", bob: 0.1 },
  totem: { hp: 10, speed: 0, r: 1.0, y: 1.6, score: 150, drop: 0.5, color: 0xff7a2a, emissive: 0xa03000, dmg: 0, ai: "static", static: true, noCap: true, bob: 0 },
  knight: { hp: 24, speed: 1.1, r: 1.5, y: 1.2, score: 300, drop: 0, color: 0xcfd0dc, emissive: 0x303050, dmg: 2, ai: "knight", spin: true, noCap: true, bob: 0.05 },
  boss: { hp: 45, speed: 1.5, r: 2.2, y: 2.4, score: 500, drop: 0, color: 0x7a2038, emissive: 0x3a0614, dmg: 2, ai: "boss", spin: true, noCap: true },
};
const ENEMY_NAMES = { ghost: "Ruh", bat: "Yarasa", golem: "Taş Bekçi", archer: "Kemik Okçu", wolf: "Kurt Ruhu", ember: "Kor Hortlak", priest: "Karanlık Rahip", totem: "Lanet Totemi", knight: "Kemik Şövalye", boss: "Gölge Kral" };
const FLOOR_KIND = ["grass", "wet", "flag", "dirt", "snow", "ash", "facet", "bone", "tile"];
const THEMES = [
  { bg: 0x0a0714, floor: 0x1a1030, ring: 0x8e44ff, hemi: 0x6a5acd, moon: 0xb9c7ff, fog: 0.035 },
  { bg: 0x08101a, floor: 0x14202e, ring: 0x44a0ff, hemi: 0x4a7acd, moon: 0xa9c7ff, fog: 0.035 },
  { bg: 0x140c08, floor: 0x2a1c14, ring: 0xffa044, hemi: 0xcd8a5a, moon: 0xffd9a9, fog: 0.035 },
  { bg: 0x0a1410, floor: 0x142a20, ring: 0x44ff9a, hemi: 0x5acd8a, moon: 0xb9ffd0, fog: 0.04 },
  { bg: 0x0b1a28, floor: 0x1a2a3a, ring: 0x9ee8ff, hemi: 0x8ab8ff, moon: 0xd0ecff, fog: 0.03 },
  { bg: 0x1a0a08, floor: 0x2e1810, ring: 0xff7a2a, hemi: 0xcd6a3a, moon: 0xffb98a, fog: 0.04 },
  { bg: 0x100c2a, floor: 0x1b1838, ring: 0xc58cff, hemi: 0x9a6aff, moon: 0xe0c0ff, fog: 0.03 },
  { bg: 0x0c0c12, floor: 0x1a1a22, ring: 0xd8d8ff, hemi: 0x8a8aa8, moon: 0xd0d0ff, fog: 0.04 },
  { bg: 0x1a0508, floor: 0x2e1018, ring: 0xff4466, hemi: 0xcd4a6a, moon: 0xffa0b0, fog: 0.035 },
];
const VIS = [
  { w: { n: 70, col: 0xc8ff9a, vy: 0.15, dx: 0.1, size: 0.22, add: true, op: 0.8 }, mist: 0.2 },
  { w: { n: 50, col: 0x9ad0ff, vy: -0.1, dx: 0, size: 0.18, add: true, op: 0.6 }, mist: 0.25 },
  { w: { n: 90, col: 0xe0b070, vy: 0.05, dx: 0.3, size: 0.2, add: false, op: 0.5 }, mist: 0.15 },
  { w: { n: 40, col: 0xaaffcc, vy: 0.25, dx: 0.05, size: 0.5, add: true, op: 0.25 }, mist: 0.5 },
  { w: { n: 200, col: 0xffffff, vy: -1.6, dx: -0.6, size: 0.22, add: false, op: 0.9 }, mist: 0.15 },
  { w: { n: 140, col: 0xff8a3a, vy: 1.3, dx: 0.4, size: 0.2, add: true, op: 0.9 }, mist: 0.3 },
  { w: { n: 110, col: 0xe8c0ff, vy: 0.12, dx: 0.1, size: 0.24, add: true, op: 0.8 }, mist: 0.1 },
  { w: { n: 90, col: 0xcfcfe0, vy: -0.35, dx: 0.2, size: 0.2, add: false, op: 0.5 }, mist: 0.5 },
  { w: { n: 120, col: 0xff5a70, vy: 0.35, dx: 0.15, size: 0.2, add: true, op: 0.7 }, mist: 0.2 },
];

// PERKS: kapanışlar S'yi dışarıdan alır (test, kendi S kopyası üzerinde çalıştırır).
export const makePerks = (S) => [
  { id: "hp", name: "Yaşam Özü", desc: "Azami can +1 ve 1 can yenilenir", ok: () => (S.perkCount.hp || 0) < 3, apply: () => { S.maxHp++; S.hp = Math.min(S.hp + 1, S.maxHp); } },
  { id: "speed", name: "Rüzgâr Ayakkabıları", desc: "Hareket hızı +15%", apply: () => { S.speedMul *= 1.15; } },
  { id: "power", name: "Güç Tılsımı", desc: "Tüm büyülerin hasarı +25%", apply: () => { S.dmgMul *= 1.25; } },
  { id: "haste", name: "Hızlı Parmaklar", desc: "Büyü bekleme süresi -20%", apply: () => { S.cdMul *= 0.8; } },
  { id: "magnet", name: "Mana Mıknatısı", desc: "Kristaller ve kalpler sana çekilir", apply: () => { S.magnet += 3.5; } },
  { id: "vampire", name: "Vampir Dokunuş", desc: "Her 12 öldürmede 1 can", ok: () => !S.vampire, apply: () => { S.vampire = true; } },
  { id: "pierce", name: "Delici Büyü", desc: "Ateş, Buz ve Üçlü mermiler 1 düşmanı delip geçer", ok: () => !S.pierce, apply: () => { S.pierce = true; } },
  { id: "echo", name: "Yankı", desc: "%20 ihtimalle büyü iki kez atılır", ok: () => S.echo < 0.59, apply: () => { S.echo += 0.2; } },
  { id: "piril", name: "Pırıl'ın Işığı", desc: "Pırıl en yakın kristali gösterir, toplama yarıçapı +0.5", ok: () => !S.piril && S.level >= 1, apply: () => { S.piril = true; } },
  { id: "stone", name: "Taş Deri", desc: "Sonraki 2 bölümde alınan ilk hasar %50 azalır", apply: () => { S.stoneLevels = 2; } },
  { id: "rain", name: "Mana Yağmuru", desc: "Kristal toplayınca %10 ihtimalle ekstra 1 kristal", ok: () => S.rain < 0.29, apply: () => { S.rain += 0.1; } },
];
export { LEVELS, OPENING, DEATH_LINES, WEAPONS, WEAPON_ORDER, ABILITIES, ABILITY_ORDER, ENEMIES, ENEMY_NAMES, FLOOR_KIND, THEMES, VIS };
