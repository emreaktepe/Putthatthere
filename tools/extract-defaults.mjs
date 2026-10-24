// TEK SEFERLİK araç: eski gömülü sabitlerden (tests/legacy-constants.js) data/game.config.json üretir.
// Kullanım: node tools/extract-defaults.mjs [çıktı-yolu]
// Dosya üretildikten sonra elle düzenlenir; bu araç yalnızca başlangıç içeriğini oluşturur ve
// eşdeğerlik testi (tests/config.equivalence.test.js) ile birlikte "taşıma hatası yok" kanıtıdır.

import fs from "node:fs";
import * as L from "../tests/legacy-constants.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");
const ids = ["forest", "cave", "golems", "graveyard", "pass", "village", "crystals", "tower", "castle"];
const sceneryNames = ["forest", "cave", "ruins", "graveyard", "ice", "village", "crystals", "tower", "castle"];
const SPEAKERS = { Zerrin: "zerrin", "Pırıl": "piril", Veyis: "veyis", "Taşkın": "taskin", Aldemir: "aldemir" };
const line = (s) => {
  const m = /^(Zerrin|Pırıl|Veyis|Taşkın|Aldemir):\s*(.*)$/.exec(s);
  return m ? { speaker: SPEAKERS[m[1]], text: m[2] } : { text: s };
};

const config = {};
config.meta = { schemaVersion: 1, name: "Büyücünün Gecesi varsayılan", notes: "" };
config.game = { startHp: L.START_HP, maxHpCap: 6, baseSpeed: L.BASE_SPEED, perkChoices: 3, clearHeal: 1, scoreLevelBonus: 100, scoreTimeMul: 2 };

config.strings = {
  title: "Büyücünün Gecesi",
  opening: L.OPENING,
  tagline: "{levelCount} lanetli bölümden geç. Mana kristallerini topla, totemleri yık, düşmanları büyüyle durdur, yeni büyüler ve yetenekler kazan.",
  controlsHelp: "WASD / ok tuşları: yürü · Fare: nişan · Boşluk / tık: büyü · 1-7: büyü seç · Q / E / R: yetenekler",
  mobileHelp: "Mobilde: ekranda parmağını sürükleyerek yürü, sağ alttaki ✦ butonuna basılı tutarak ateş et (nişan otomatik). Alttaki çubuğu kaydırarak büyü değiştir; yetenek düğmeleri ✦'nın üstünde belirir.",
  startButton: "Büyüyü Başlat",
  finalTitle: "Şafak doğdu!",
  finalLine: "Gölge Kral yenildi. Lanet kalktı.",
  finalScore: "Toplam puan: **{score}**",
  replay: "Yeniden oyna",
  deathLines: L.DEATH_LINES.map(line),
  objective: {
    crystal: "{goal} mana kristali topla.",
    survive: "{goal} saniye hayatta kal.",
    totem: "{goal} Lanet Totemi'ni yık.",
    miniboss: "Kemik Şövalye'yi yen!",
    boss: "Gölge Kral'ı yen!",
  },
  hud: {
    level: "Bölüm {n}/{total}",
    goalCrystal: "Mana: {n}/{goal}",
    goalSurvive: "Hedef: Hayatta kal",
    goalTotem: "Totem: {n}/{goal}",
    goalMiniboss: "Hedef: Kemik Şövalye",
    goalBoss: "Hedef: Gölge Kral",
    goalPhase: " · Faz {phase}",
    time: "Süre: {n}",
    score: "Puan: {n}",
  },
  level: {
    title: "Bölüm {n}: {name}",
    foes: "Düşmanlar: **{foes}**",
    stats: "Süre: {time} sn · Can: {hp}/{maxHp}",
    hint: "Düşenlerden kalp çıkabilir. Yeni büyü ve yetenekler bölüm sonunda açılır.",
    enter: "Savaşa gir",
  },
  gameOver: {
    stats: "Bölüm {n} · Puan: {score}",
    retry: "Bu bölümü tekrar dene",
    retryNote: "Açılan büyüler ve yetenekler korunur",
    restart: "Baştan başla",
  },
  clear: {
    title: "Bölüm {n} tamam!",
    bonus: "Süre bonusu: +{bonus}",
    newWeapon: "Yeni büyü: **{name}** ({key} tuşu)",
    newAbility: "Yeni yetenek: **{name}** ({key} tuşu / düğme)",
    pickPerk: "Bir yetenek seç:",
  },
  toasts: {
    bossPhase2: "Faz 2 · Gölge Dalgası — yerdeki kırmızı halkalardan kaç! (+10 sn)",
    bossPhase3: "Faz 3 · Kızın Işığı — Pırıl'ın 3 ışık kristalini topla; kalkan kırılınca vur! (+10 sn)",
    shieldBreak: "Kalkan kırıldı! Şimdi vur!",
    shieldUp: "Kalkan geri döndü — Pırıl yeni ışık kristalleri bıraktı.",
    knightEnrage: "Şövalye öfkelendi!",
  },
};

config.characters = {
  aldemir: { name: "Aldemir", role: "player", icon: "🧙", color: "#d9b3ff", bio: "O gece uyuyakalan büyücü; Gece Kalbi'ni onarabilecek tek kişi." },
  zerrin: { name: "Zerrin", role: "ally", icon: "🦉", color: "#ffe9a8", bio: "Kulenin yaşlı baş büyücüsü; baykuşa dönüşmüş mentor." },
  piril: { name: "Pırıl", role: "ally", icon: "✨", color: "#ffe9a8", bio: "Gün ışığına varamayan küçük bir ışık; Aldemir'in yoldaşı." },
  veyis: { name: "Veyis", role: "villain", icon: "👑", color: "#ffe9a8", bio: "Vadinin son kralı; kızını geri isteyen Gölge Kral." },
  taskin: { name: "Taşkın", role: "npc", icon: "🗿", color: "#ffe9a8", bio: "Lanetten kurtulan tek Taş Bekçi; az konuşur." },
};

config.player = {
  character: "aldemir",
  speedMul: 1,
  scale: 1,
  look: { robeTop: "#6a40d0", robeBottom: "#30166a", skin: "#f2c9a0", gold: "#c8a24a", hat: "#2a1566", beard: "#e8e4f2", eye: "#ffe9a8", wandGlow: "#e0b3ff" },
};

config.enemies = {};
const extra = {
  knight: { shortName: "Şövalye" },
  boss: { shortName: "Kral", summons1: ["ghost", "ghost"], summons2: ["archer", "bat"] },
  totem: { summon: "ghost" },
};
for (const [id, d] of Object.entries(L.ENEMIES)) {
  const e = { name: L.ENEMY_NAMES[id], ...(extra[id]?.shortName ? { shortName: extra[id].shortName } : {}) };
  Object.assign(e, { hp: d.hp, speed: d.speed, r: d.r, y: d.y });
  if (d.bob !== undefined) e.bob = d.bob;
  Object.assign(e, { score: d.score, drop: d.drop, dmg: d.dmg, color: hex(d.color), emissive: hex(d.emissive), ai: d.ai });
  for (const f of ["zig", "spin", "noCap", "static"]) if (d[f]) e[f] = true;
  if (extra[id]?.summon) e.summon = extra[id].summon;
  if (extra[id]?.summons1) e.summons1 = extra[id].summons1;
  if (extra[id]?.summons2) e.summons2 = extra[id].summons2;
  config.enemies[id] = e;
}

config.weapons = {};
for (const [id, w] of Object.entries(L.WEAPONS)) {
  const o = { name: w.name, icon: w.icon, color: hex(w.color), cd: w.cd, dmg: w.dmg };
  if (w.speed !== undefined) o.speed = w.speed;
  if (w.pierceable) o.pierceable = true;
  if (w.slow) o.slow = true;
  if (w.spread) o.spread = { n: w.spread };
  if (w.chain) o.chain = { n: w.chain, range: w.range };
  if (w.cloud) o.cloud = { ...w.cloud };
  if (w.meteor) o.meteor = { ...w.meteor };
  if (w.nova) o.nova = { ...w.nova };
  config.weapons[id] = o;
}
config.weaponOrder = [...L.WEAPON_ORDER];

const params = { shield: { duration: 8 }, blink: { dist: 5, iframes: 0.4 }, timeslow: { duration: 3, factor: 0.4 } };
config.abilities = {};
for (const [id, a] of Object.entries(L.ABILITIES)) config.abilities[id] = { name: a.name, icon: a.icon, cd: a.cd, params: params[id] };
config.abilityOrder = [...L.ABILITY_ORDER];

// perk kapanışlarının bildirimsel karşılığı (eşdeğerlik testi bunu legacy ok/apply ile karşılaştırır)
const perkDecl = {
  hp: { maxStacks: 3, effect: { kind: "add", stat: "maxHp", value: 1 } },
  speed: { effect: { kind: "mul", stat: "speedMul", value: 1.15 } },
  power: { effect: { kind: "mul", stat: "dmgMul", value: 1.25 } },
  haste: { effect: { kind: "mul", stat: "cdMul", value: 0.8 } },
  magnet: { effect: { kind: "add", stat: "magnet", value: 3.5 } },
  vampire: { maxStacks: 1, effect: { kind: "flag", stat: "vampire", value: 1 } },
  pierce: { maxStacks: 1, effect: { kind: "flag", stat: "pierce", value: 1 } },
  echo: { maxStacks: 3, effect: { kind: "add", stat: "echo", value: 0.2 } },
  piril: { maxStacks: 1, minLevel: 1, effect: { kind: "flag", stat: "piril", value: 1 } },
  stone: { effect: { kind: "flag", stat: "stoneLevels", value: 2 } },
  rain: { maxStacks: 3, effect: { kind: "add", stat: "rain", value: 0.1 } },
};
config.perks = {};
for (const p of L.makePerks({})) {
  const d = perkDecl[p.id];
  config.perks[p.id] = { name: p.name, desc: p.desc, ...(d.maxStacks ? { maxStacks: d.maxStacks } : {}), ...(d.minLevel ? { minLevel: d.minLevel } : {}), effect: d.effect };
}
config.perkOrder = L.makePerks({}).map((p) => p.id);

config.themes = {};
L.THEMES.forEach((t, i) => {
  const v = L.VIS[i].w;
  const { phase3, ...music } = ((m) => (i === 8 ? { ...m, phase3: { scale: L.P3.scale, chords: L.P3.chords, cut: L.P3.cut, padAtt: L.P3.padAtt, pad4: L.P3.pad4, chordBars: L.P3.chordBars } } : m))(L.MUSIC[i]);
  config.themes[ids[i]] = {
    name: L.LEVELS[i].name,
    bg: hex(t.bg), floor: hex(t.floor), ring: hex(t.ring), hemi: hex(t.hemi), moon: hex(t.moon), fog: t.fog,
    floorKind: L.FLOOR_KIND[i], scenery: sceneryNames[i], seed: i,
    weather: { n: v.n, col: hex(v.col), vy: v.vy, dx: v.dx, size: v.size, add: v.add, op: v.op },
    mist: L.VIS[i].mist,
    music: { ...music, ...(i === 2 ? { fifth: true } : {}), ...(phase3 ? { phase3 } : {}) },
  };
});

config.levels = {};
L.LEVELS.forEach((lv, i) => {
  const o = { name: lv.name, objective: lv.objective, goal: lv.goal, time: lv.time, theme: ids[lv.theme] };
  if (lv.crystals !== undefined) o.crystals = lv.crystals;
  Object.assign(o, { start: lv.start, spawn: lv.spawn, every: lv.every, cap: lv.cap });
  if (lv.reward) o.reward = lv.reward;
  if (lv.ability) o.ability = lv.ability;
  if (lv.totems) o.totems = lv.totems;
  o.intro = lv.intro.map(line);
  o.outro = lv.outro.map(line);
  config.levels[ids[i]] = o;
});
config.campaign = { order: [...ids], start: ids[0] };

// ---- biçimlendirme: kısa dizi/nesneler tek satır, gerisi 2 boşluk girintili ----
const inline = (v) => (Array.isArray(v) ? "[" + v.map(inline).join(", ") + "]" : v && typeof v === "object" ? (Object.keys(v).length ? "{ " + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + inline(x)).join(", ") + " }" : "{}") : JSON.stringify(v));
function fmt(v, ind = 0) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  const pad = "  ".repeat(ind);
  const one = inline(v);
  if (one.length <= 100 - ind * 2 && !(Array.isArray(v) && v.some((x) => x && typeof x === "object" && inline(x).length > 60))) return one;
  if (Array.isArray(v)) return "[\n" + v.map((x) => pad + "  " + fmt(x, ind + 1)).join(",\n") + "\n" + pad + "]";
  return "{\n" + Object.entries(v).map(([k, x]) => pad + "  " + JSON.stringify(k) + ": " + fmt(x, ind + 1)).join(",\n") + "\n" + pad + "}";
}
const out = process.argv[2] || "data/game.config.json";
fs.mkdirSync(out.replace(/[\\/][^\\/]*$/, ""), { recursive: true });
fs.writeFileSync(out, fmt(config) + "\n");
console.log("yazıldı:", out);
