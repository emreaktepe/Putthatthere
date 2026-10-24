// Bölüm akışı: açılış menüsü -> bölüm girişi -> savaş -> sonuç. (2. aşamada menü/harita ui/router.js'e taşınır.)
import { mus, sfx } from "../audio/engine.js";
import { ABILITIES, ENEMY_NAMES, GAME, LEVELS, PERKS, STRINGS, TOTEM_ID, WEAPONS } from "../core/data.js";
import { br, dialog, fmt, h, rich } from "../core/dom.js";
import { RT, S, newRun, resetAbilityCooldowns, restoreSnapshot, takeSnapshot } from "../core/state.js";
import { $ } from "../core/util.js";
import { clearWorld, spawnCrystal, spawnEnemy } from "./world.js";
import { applyTheme } from "../render/themes.js";
import { setWandColor, wizard } from "../render/wizard.js";
import { renderAbilities, renderHud, renderWeapons } from "../ui/hud.js";
import { screen } from "../ui/screens.js";

function objectiveText(L) {
  const O = STRINGS.objective;
  switch (L.objective) {
    case "crystal": return fmt(O.crystal, { goal: L.goal });
    case "survive": return fmt(O.survive, { goal: L.goal });
    case "totem": return fmt(O.totem, { goal: L.goal });
    case "miniboss": return O.miniboss;
    default: return O.boss;
  }
}

export function showMainMenu() {
  screen(STRINGS.title, [h("i", null, STRINGS.opening), br(), br(), rich(STRINGS.tagline, { levelCount: LEVELS.length }), br(), STRINGS.controlsHelp, br(), h("small", null, STRINGS.mobileHelp)], [
    { label: STRINGS.startButton, fn: introLevel },
  ]);
}

export function introLevel() {
  const L = LEVELS[S.level], T = STRINGS.level;
  takeSnapshot();
  clearWorld();
  applyTheme(L.theme);
  wizard.position.set(0, 0, 0);
  const types = new Set(Object.keys(L.start));
  L.spawn.forEach((w) => Object.keys(w).forEach((k) => types.add(k)));
  if (L.objective === "totem" && TOTEM_ID) types.add(TOTEM_ID);
  const foes = [...types].map((k) => ENEMY_NAMES[k]).join(", ");
  screen(fmt(T.title, { n: S.level + 1, name: L.name }), [
    h("i", null, ...dialog(L.intro)), br(), br(),
    objectiveText(L), br(),
    rich(T.foes, { foes }), br(),
    fmt(T.stats, { time: L.time, hp: Math.ceil(S.hp), maxHp: S.maxHp }), br(),
    h("small", null, T.hint),
  ], [
    { label: T.enter, fn: startLevel },
  ]);
  renderHud();
  renderWeapons();
  renderAbilities();
}

export function startLevel() {
  const L = LEVELS[S.level];
  clearWorld();
  RT.collected = 0; RT.totemsDown = 0; RT.timeLeft = L.time; RT.cooldown = 0; RT.invuln = 1; RT.spawnTimer = 0; RT.bossSummon = 5;
  resetAbilityCooldowns();
  RT.stoneReady = false;
  if (S.stoneLevels > 0) { S.stoneLevels--; RT.stoneReady = true; }
  wizard.position.set(0, 0, 0);
  const crystals = L.crystals !== undefined ? L.crystals : (L.objective === "crystal" ? 5 : 0);
  for (let i = 0; i < crystals; i++) spawnCrystal();
  for (const [type, n] of Object.entries(L.start)) for (let i = 0; i < n; i++) spawnEnemy(type);
  if (L.objective === "totem") for (const [x, z] of L.totems) spawnEnemy(TOTEM_ID, { x, z });
  setWandColor(WEAPONS[S.weapon].color);
  mus.set(L.objective === "boss" ? "boss" : "play", L.theme);
  $("msg").hidden = true;
  document.body.classList.add("playing");
  RT.running = true;
  renderHud();
  renderWeapons();
  renderAbilities();
}

export function gameOver() {
  if (!RT.running) return;
  RT.running = false;
  sfx("game_over");
  const line = STRINGS.deathLines[Math.floor(Math.random() * STRINGS.deathLines.length)], T = STRINGS.gameOver;
  screen(line.speaker ? line.speaker + ": " + line.text : line.text, fmt(T.stats, { n: S.level + 1, score: S.score }), [
    { label: T.retry, small: T.retryNote, fn: () => { restoreSnapshot(); S.hp = S.maxHp; introLevel(); } },
    { label: T.restart, fn: () => { newRun(); introLevel(); } },
  ]);
}

function pickPerks() {
  const pool = PERKS.filter((p) => p.id !== S.lastPerk && p.ok(S));
  return pool.sort(() => Math.random() - 0.5).slice(0, GAME.perkChoices);
}

export function levelClear() {
  if (!RT.running) return;
  const L = LEVELS[S.level], C = STRINGS.clear;
  RT.running = false;
  sfx("level_clear");
  const bonus = Math.ceil(RT.timeLeft) * GAME.scoreTimeMul;
  S.score += bonus + GAME.scoreLevelBonus * (S.level + 1);
  renderHud();
  if (S.level === LEVELS.length - 1) {
    screen(STRINGS.finalTitle, [h("i", null, ...dialog(L.outro)), br(), br(), STRINGS.finalLine, br(), rich(STRINGS.finalScore, { score: S.score })], [
      { label: STRINGS.replay, fn: () => { newRun(); introLevel(); } },
    ]);
    return;
  }
  const reward = [];
  if (L.reward && !S.unlocked.includes(L.reward)) {
    S.unlocked.push(L.reward);
    reward.push(br(), rich(C.newWeapon, { name: WEAPONS[L.reward].name, key: WEAPONS[L.reward].key }));
  }
  if (L.ability && !S.abilities.includes(L.ability)) {
    S.abilities.push(L.ability);
    reward.push(br(), rich(C.newAbility, { name: ABILITIES[L.ability].name, key: ABILITIES[L.ability].key }));
  }
  if (S.hp < S.maxHp) S.hp = Math.min(S.hp + GAME.clearHeal, S.maxHp);
  const choices = pickPerks();
  screen(fmt(C.title, { n: S.level + 1 }), [h("i", null, ...dialog(L.outro)), br(), br(), fmt(C.bonus, { bonus }), ...reward, br(), C.pickPerk], choices.map((p) => ({
    label: p.name,
    small: p.desc,
    fn: () => { p.apply(S); S.perkCount[p.id] = (S.perkCount[p.id] || 0) + 1; S.lastPerk = p.id; S.level++; introLevel(); },
  })));
}
