// Yüklenmiş oyun verisi (data/game.config.json -> js/config/adapt.js çıktısı).
// `export let` canlı bağlamadır: diğer modüller `import { LEVELS } from "../core/data.js"` ile okur;
// main.js config'i yükleyince setData() ile doldurur. Oyun kodu sabit tablo tutmaz.

export let META = {}, GAME = {}, PLAYER = {}, STRINGS = {}, CHARACTERS = {};
export let LEVELS = [], LEVEL_IDS = [], WEAPONS = {}, WEAPON_ORDER = [], ABILITIES = {}, ABILITY_ORDER = [];
export let ENEMIES = {}, ENEMY_NAMES = {}, TOTEM_ID = null, PERKS = [], THEMES = [], VIS = [], MUSIC = [], MUSIC_P3 = {};
export let CAMPAIGN = {}, MAP = null;
export let CONFIG_INFO = { source: "", baseHash: "", notices: [], warnings: [] };

export function setData(d) {
  ({ META, GAME, PLAYER, STRINGS, CHARACTERS, LEVELS, LEVEL_IDS, WEAPONS, WEAPON_ORDER, ABILITIES, ABILITY_ORDER, ENEMIES, ENEMY_NAMES, TOTEM_ID, PERKS, THEMES, VIS, MUSIC, MUSIC_P3, CAMPAIGN, MAP } = d);
}
export function setConfigInfo(info) { CONFIG_INFO = info; }
