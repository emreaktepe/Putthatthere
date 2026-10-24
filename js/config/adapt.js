// adapt(config): doğrulanmış (sanitize edilmiş) JSON'u oyunun çalışma zamanı şekline çevirir.
//   "#a1b2c3" -> 0xa1b2c3, id'li nesne + sıra -> dizi/harita, silah/yetenek tuşları sıradan türetilir,
//   perk etkileri bildirimsel tanımdan ok(S)/apply(S) fonksiyonlarına derlenir.
// Saf fonksiyon: DOM ve Three.js'e dokunmaz (Node'da test edilir).
// Çıktı eski sabitlerle (tests/legacy-constants.js) eşdeğerdir; yalnızca belgelenmiş EK alanlar vardır.

import { ABILITY_KEYS } from "./registry.js";

const hexInt = (s) => parseInt(s.slice(1), 16);
const copy = (v) => JSON.parse(JSON.stringify(v));

export function adapt(cfg) {
  const themeIds = Object.keys(cfg.themes);
  const charName = (id) => (cfg.characters[id] ? cfg.characters[id].name : undefined);

  const line = (l) => {
    const out = { text: l.text };
    if (l.speaker && cfg.characters[l.speaker]) {
      out.speaker = charName(l.speaker);
      if (cfg.characters[l.speaker].color) out.color = cfg.characters[l.speaker].color;
    }
    return out;
  };

  const THEMES = themeIds.map((id, i) => {
    const t = cfg.themes[id];
    return { bg: hexInt(t.bg), floor: hexInt(t.floor), ring: hexInt(t.ring), hemi: hexInt(t.hemi), moon: hexInt(t.moon), fog: t.fog, floorKind: t.floorKind, scenery: t.scenery, seed: t.seed ?? i, id };
  });
  const VIS = themeIds.map((id) => {
    const t = cfg.themes[id], w = t.weather;
    return { w: { n: w.n, col: hexInt(w.col), vy: w.vy, dx: w.dx, size: w.size, add: w.add, op: w.op }, mist: t.mist };
  });
  const MUSIC = [], MUSIC_P3 = {};
  themeIds.forEach((id, i) => {
    const { phase3, ...m } = cfg.themes[id].music;
    MUSIC.push(copy(m));
    if (phase3) MUSIC_P3[i] = { ...copy(m), ...copy(phase3) };
  });

  const WEAPON_ORDER = [...cfg.weaponOrder];
  const WEAPONS = {};
  WEAPON_ORDER.forEach((id, i) => {
    const w = cfg.weapons[id];
    const o = { name: w.name, icon: w.icon, key: String(i + 1), color: hexInt(w.color), cd: w.cd, dmg: w.dmg };
    if (w.speed !== undefined) o.speed = w.speed;
    if (w.pierceable) o.pierceable = true;
    if (w.slow) o.slow = true;
    if (w.spread) o.spread = w.spread.n;
    if (w.chain) { o.chain = w.chain.n; o.range = w.chain.range; }
    if (w.cloud) o.cloud = { ...w.cloud };
    if (w.meteor) o.meteor = { ...w.meteor };
    if (w.nova) o.nova = { ...w.nova };
    WEAPONS[id] = o;
  });

  const ABILITY_ORDER = [...cfg.abilityOrder];
  const ABILITIES = {};
  ABILITY_ORDER.forEach((id, i) => {
    const a = cfg.abilities[id], [key, code] = ABILITY_KEYS[i] || ["", ""];
    ABILITIES[id] = { name: a.name, icon: a.icon, key, code, cd: a.cd, params: { ...a.params } };
  });

  const ENEMIES = {}, ENEMY_NAMES = {};
  for (const [id, e] of Object.entries(cfg.enemies)) {
    const o = { hp: e.hp, speed: e.speed, r: e.r, y: e.y ?? 0, score: e.score ?? 0, drop: e.drop ?? 0, color: hexInt(e.color), emissive: hexInt(e.emissive), dmg: e.dmg ?? 0, ai: e.ai };
    for (const f of ["zig", "spin", "noCap", "static"]) if (e[f]) o[f] = true;
    if (e.bob !== undefined) o.bob = e.bob;
    // EK alanlar (eski ENEMIES'te yoktu): name, shortName, scale, model, summon*, character
    o.name = e.name;
    if (e.shortName) o.shortName = e.shortName;
    o.scale = e.scale ?? 1;
    o.model = e.model || id;
    if (e.summon) o.summon = e.summon;
    if (e.summons1) o.summons1 = [...e.summons1];
    if (e.summons2) o.summons2 = [...e.summons2];
    if (e.character) o.character = e.character;
    ENEMIES[id] = o;
    ENEMY_NAMES[id] = e.name;
  }
  const TOTEM_ID = Object.keys(ENEMIES).find((k) => ENEMIES[k].ai === "static") || null;

  const maxHpCap = cfg.game.maxHpCap;
  const PERKS = cfg.perkOrder.map((id) => {
    const p = cfg.perks[id], { kind, stat, value } = p.effect;
    const maxStacks = p.maxStacks, minLevel = p.minLevel || 0;
    return {
      id, name: p.name, desc: p.desc,
      effect: { kind, stat, value }, maxStacks, // EK (yalnızca arayüz: simge/nadirlik); oyun mantığı kullanmaz
      ok: (S) => (maxStacks === undefined || ((S.perkCount && S.perkCount[id]) || 0) < maxStacks) && S.level >= minLevel,
      apply: (S) => {
        if (kind === "mul") S[stat] *= value;
        else if (kind === "add") {
          if (stat === "maxHp") { S.maxHp = Math.min(S.maxHp + value, maxHpCap); S.hp = Math.min(S.hp + value, S.maxHp); } else S[stat] += value;
        } else S[stat] = stat === "stoneLevels" ? value : true;
      },
    };
  });

  const LEVEL_IDS = [...cfg.campaign.order];
  const LEVELS = LEVEL_IDS.map((id) => {
    const L = cfg.levels[id];
    const o = { name: L.name, objective: L.objective, goal: L.goal, time: L.time, theme: themeIds.indexOf(L.theme) };
    if (L.crystals !== undefined) o.crystals = L.crystals;
    o.start = { ...L.start };
    o.spawn = L.spawn.map((w) => ({ ...w }));
    o.every = L.every; o.cap = L.cap;
    if (L.reward) o.reward = L.reward;
    if (L.ability) o.ability = L.ability;
    if (L.totems) o.totems = L.totems.map((t) => [...t]);
    o.intro = L.intro.map(line);
    o.outro = L.outro.map(line);
    o.id = id;
    if (L.map) o.map = { ...L.map };
    return o;
  });

  const s = cfg.strings;
  const STRINGS = { ...s, deathLines: s.deathLines.map(line) };

  const PLAYER = { ...cfg.player, name: charName(cfg.player.character), look: { ...cfg.player.look } };
  const GAME = { ...cfg.game };
  return {
    META: { ...cfg.meta }, GAME, PLAYER, STRINGS, CHARACTERS: cfg.characters,
    LEVELS, LEVEL_IDS, WEAPONS, WEAPON_ORDER, ABILITIES, ABILITY_ORDER, ENEMIES, ENEMY_NAMES, TOTEM_ID,
    PERKS, THEMES, VIS, MUSIC, MUSIC_P3, CAMPAIGN: cfg.campaign, MAP: cfg.map ? copy(cfg.map) : null,
  };
}
