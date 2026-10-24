// Oyun akışı: menü -> (giriş) -> harita -> bölüm girişi -> savaş -> bölüm sonu (ödül + perk) -> harita.
// Kayıt/ilerleme mantığı campaign.js'te, ekranlar ui/*.js'te; burada yalnızca akış sırası ve oyun durumu geçişleri vardır.
import { mus, sfx } from "../audio/engine.js";
import { ABILITIES, GAME, LEVELS, LEVEL_IDS, META, PERKS, STRINGS, TOTEM_ID, WEAPONS } from "../core/data.js";
import { fmt } from "../core/dom.js";
import { RT, S, resetAbilityCooldowns, restoreSnapshot, takeSnapshot } from "../core/state.js";
import { applyTheme } from "../render/themes.js";
import { setWandColor, wizard } from "../render/wizard.js";
import { renderAbilities, renderHud, renderWeapons } from "../ui/hud.js";
import { showMenu, showIntro } from "../ui/menu.js";
import { showMap } from "../ui/map.js";
import { finalScreen, gameOverScreen, levelClearScreen, levelIntroScreen } from "../ui/result.js";
import { unmount } from "../ui/screens.js";
import { UI } from "../ui/text.js";
import { camp, continueGame, endPractice, hasSave, inPractice, initCampaign, newGame, persist, recordResult, startPractice, statuses } from "./campaign.js";
import { clearWorld, spawnCrystal, spawnEnemy } from "./world.js";

let levelStartScore = 0;

// ---------- Menü ve harita ----------
export function showMainMenu() {
  endPractice();
  if (!camp.booted) { camp.booted = true; initCampaign(); }
  const sv = camp.pending;
  const notice = camp.status === "corrupt" ? UI.menu.noSave : camp.status === "newer" ? UI.menu.newer : "";
  const idx = sv ? Math.min(LEVEL_IDS.indexOf(sv.currentLevel) + 1, LEVELS.length) : 0;
  showMenu({
    hasSave: hasSave(),
    saveInfo: sv ? `${fmt(STRINGS.hud.level, { n: Math.max(idx, 1), total: LEVELS.length })} · ${sv.run.score}` : "",
    notice,
    onContinue: () => { if (continueGame()) openMap(); },
    onNew: () => showIntro(() => { newGame(); openMap(); }),
  });
  applyTheme(0);
}

// focusId: haritada ön seçili düğüm; freshId: yeni açılan düğüm (animasyon)
export function openMap(focusId = null, freshId = null) {
  endPractice();
  const st = statuses();
  const focus = focusId || LEVEL_IDS.find((id) => st[id] === "available") || LEVEL_IDS[LEVEL_IDS.length - 1];
  showMap({
    statuses: st, best: camp.best, focusId: focus, freshId,
    onPlay: (id, practice) => playLevel(id, practice),
    onBack: () => showMainMenu(),
  });
}

function playLevel(id, practice) {
  const idx = LEVEL_IDS.indexOf(id);
  if (practice) startPractice(idx); else { endPractice(); S.level = idx; }
  introLevel();
}

// ---------- Bölüm girişi ----------
export function introLevel() {
  const L = LEVELS[S.level];
  takeSnapshot();
  clearWorld();
  applyTheme(L.theme);
  wizard.position.set(0, 0, 0);
  if (!inPractice()) persist(); // "Devam et" ölüm/yenileme sonrası da çalışsın
  renderHud();
  renderWeapons();
  renderAbilities();
  levelIntroScreen({ idx: S.level, practice: inPractice(), onEnter: startLevel, onBack: () => openMap(LEVEL_IDS[S.level]) });
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
  levelStartScore = S.score;
  unmount();
  document.body.classList.add("playing");
  RT.running = true;
  renderHud();
  renderWeapons();
  renderAbilities();
}

// ---------- Yenilgi ----------
export function gameOver() {
  if (!RT.running) return;
  RT.running = false;
  sfx("game_over");
  const line = STRINGS.deathLines[Math.floor(Math.random() * STRINGS.deathLines.length)];
  const idx = S.level, practice = inPractice(), id = LEVEL_IDS[idx];
  gameOverScreen({
    line, idx, practice,
    onRetry: () => { restoreSnapshot(); S.hp = S.maxHp; introLevel(); },
    onMap: () => { restoreSnapshot(); S.hp = S.maxHp; openMap(id); },
    onRestart: () => { newGame(); openMap(); },
  });
}

function pickPerks() {
  const pool = PERKS.filter((p) => p.id !== S.lastPerk && p.ok(S));
  return pool.sort(() => Math.random() - 0.5).slice(0, GAME.perkChoices);
}

// ---------- Bölüm sonu ----------
export function levelClear() {
  if (!RT.running) return;
  const idx = S.level, L = LEVELS[idx], id = LEVEL_IDS[idx], practice = inPractice();
  RT.running = false;
  sfx("level_clear");
  const prevTotal = S.score;
  const bonus = Math.ceil(RT.timeLeft) * GAME.scoreTimeMul, levelBonus = GAME.scoreLevelBonus * (idx + 1);
  S.score += bonus + levelBonus;
  recordResult(id, S.score - levelStartScore, RT.timeLeft);
  renderHud();

  if (practice) { // alıştırma: ilerleme ve donanım değişmez, yalnızca en iyi sonuç kaydedilir
    persist();
    levelClearScreen({ idx, bonus, levelBonus, total: S.score, prevTotal, rewards: [], practice: true, choices: [], onBack: () => openMap(id) });
    return;
  }

  if (idx === LEVELS.length - 1) {
    camp.completed.add(id);
    persist();
    finalScreen({ outro: L.outro, score: S.score, onMap: () => openMap(id), onReplay: () => { newGame(); openMap(); } });
    return;
  }
  const rewards = [];
  if (L.reward && !S.unlocked.includes(L.reward)) { S.unlocked.push(L.reward); rewards.push({ kind: "weapon", id: L.reward }); }
  if (L.ability && !S.abilities.includes(L.ability) && ABILITIES[L.ability]) { S.abilities.push(L.ability); rewards.push({ kind: "ability", id: L.ability }); }
  if (S.hp < S.maxHp) S.hp = Math.min(S.hp + GAME.clearHeal, S.maxHp);
  levelClearScreen({
    idx, bonus, levelBonus, total: S.score, prevTotal, rewards, practice: false, choices: pickPerks(),
    onPick: (p) => {
      p.apply(S);
      S.perkCount[p.id] = (S.perkCount[p.id] || 0) + 1;
      S.lastPerk = p.id;
      S.level++;
      camp.completed.add(id);
      persist();
      openMap(LEVEL_IDS[S.level], LEVEL_IDS[S.level]);
    },
  });
}
