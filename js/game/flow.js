// Oyun akışı: menü -> (giriş) -> harita -> bölüm girişi -> savaş -> bölüm sonu (ödül + perk) -> harita.
// Kayıt/ilerleme mantığı campaign.js'te, ekranlar ui/*.js'te; burada yalnızca akış sırası ve oyun durumu geçişleri vardır.
import { mus, sfx } from "../audio/engine.js";
import { ABILITIES, ENEMIES, GAME, LEVELS, LEVEL_IDS, META, PERKS, STRINGS, TOTEM_ID, WEAPONS } from "../core/data.js";
import { fmt } from "../core/dom.js";
import { RT, S, resetAbilityCooldowns, restoreSnapshot, takeSnapshot } from "../core/state.js";
import { setPropsPhase } from "../render/props3d.js";
import { applyTheme } from "../render/themes.js";
import { setWandColor, wizard } from "../render/wizard.js";
import { renderAbilities, renderHud, renderWeapons } from "../ui/hud.js";
import { dmgState } from "./damage.js";
import { scaledStart } from "./dda.js";
import { currentDda, nextDda, noteClear, noteDeath, resetSession, trackAttempt } from "./track.js";
import { showMenu, showIntro } from "../ui/menu.js";
import { showMap } from "../ui/map.js";
import { finalScreen, gameOverScreen, levelClearScreen, levelIntroScreen } from "../ui/result.js";
import { unmount } from "../ui/screens.js";
import { UI } from "../ui/text.js";
import { starsFor } from "./stars.js";
import { camp, continueGame, endPractice, hasSave, inPractice, initCampaign, newGame, persist, recordResult, startPractice, statuses } from "./campaign.js";
import { clearWorld, spawnCrystal, spawnEnemy } from "./world.js";

let levelStartScore = 0;

// sahne figürleri (Zerrin/Taşkın/Veyis): akış aşamasını bildirir; görünürlük kuralı render/propsvis.js'te
function props(phase) {
  setPropsPhase({ phase, levelId: LEVEL_IDS[S.level], levelIds: LEVEL_IDS, completed: camp.completed });
}

// ---------- Menü ve harita ----------
export function showMainMenu() {
  endPractice();
  props("none");
  if (!camp.booted) { camp.booted = true; initCampaign(); }
  const sv = camp.pending;
  const notice = camp.status === "corrupt" ? UI.menu.noSave : camp.status === "newer" ? UI.menu.newer : "";
  const idx = sv ? Math.min(LEVEL_IDS.indexOf(sv.currentLevel) + 1, LEVELS.length) : 0;
  showMenu({
    hasSave: hasSave(),
    save: sv,
    saveName: sv && LEVELS[Math.max(idx, 1) - 1] ? LEVELS[Math.max(idx, 1) - 1].name : "",
    saveInfo: sv ? `${fmt(STRINGS.hud.level, { n: Math.max(idx, 1), total: LEVELS.length })} · ${sv.run.score}` : "",
    notice,
    onContinue: () => { if (continueGame()) openMap(); },
    onNew: () => showIntro(() => { newGame(); resetSession(); openMap(); }),
    onMap: () => { if (continueGame()) openMap(); },
  });
  applyTheme(0);
}

// focusId: haritada ön seçili düğüm; freshId: yeni açılan düğüm (animasyon)
export function openMap(focusId = null, freshId = null) {
  endPractice();
  props("none");
  const st = statuses();
  const focus = focusId || LEVEL_IDS.find((id) => st[id] === "available") || LEVEL_IDS[LEVEL_IDS.length - 1];
  showMap({
    statuses: st, best: camp.best, focusId: focus, freshId,
    onPlay: (id, practice) => playLevel(id, practice),
    onBack: () => showMainMenu(),
  });
}

// ?dev=1&level=<id>: seçilen bölümü, önceki bölümlerin ödülleriyle (alıştırma donanımı) kayda yazmadan açar. Geçersiz kimlikte false.
export function devStart(levelId) {
  if (!camp.booted) { camp.booted = true; initCampaign(); }
  if (!LEVEL_IDS.includes(levelId)) return false;
  camp.noSave = true;
  if (hasSave()) continueGame();
  playLevel(levelId, true);
  return true;
}

function playLevel(id, practice) {
  const idx = LEVEL_IDS.indexOf(id);
  if (practice) startPractice(idx); else { endPractice(); S.level = idx; }
  introLevel();
}

// ---------- Bölüm girişi ----------
// quick: yeniden denemede giriş kartı atlanır, savaş tek dokunuşla başlar (kart yalnızca ilk girişte; plan B6)
export function introLevel({ quick = false } = {}) {
  const L = LEVELS[S.level];
  takeSnapshot();
  clearWorld();
  applyTheme(L.theme);
  wizard.position.set(0, 0, 0);
  props("intro");
  if (!inPractice()) persist(); // "Devam et" ölüm/yenileme sonrası da çalışsın
  renderHud();
  renderWeapons();
  renderAbilities();
  if (quick) { startLevel(); return; }
  levelIntroScreen({ idx: S.level, practice: inPractice(), onEnter: startLevel, onBack: () => openMap(LEVEL_IDS[S.level]), dda: currentDda(LEVEL_IDS[S.level], inPractice()) });
}

export function startLevel() {
  const L = LEVELS[S.level];
  clearWorld();
  const id = LEVEL_IDS[S.level], practice = inPractice(), dda = currentDda(id, practice); // yardım kademesi (alıştırmada yok)
  RT.dda = dda; RT.elapsed = 0; RT.lastKill = 0; RT.hits = 0; RT.hintQ = []; RT.ddaHp = 0; dmgState.carry = 0;
  RT.collected = 0; RT.totemsDown = 0; RT.timeLeft = L.objective === "survive" ? L.time : L.time * dda.timeMul; RT.cooldown = 0; RT.invuln = 1; RT.spawnTimer = 0; RT.bossSummon = 5;
  resetAbilityCooldowns();
  RT.stoneReady = false;
  RT.paused = false; RT.killBase = S.kills || 0; // görev paneli: bu bölümde yenilen düşman = S.kills - killBase
  if (S.stoneLevels > 0) { S.stoneLevels--; RT.stoneReady = true; }
  wizard.position.set(0, 0, 0);
  const crystals = L.crystals !== undefined ? L.crystals : (L.objective === "crystal" ? 5 : 0);
  for (let i = 0; i < crystals; i++) spawnCrystal();
  const fixed = (k) => ["boss", "knight", "static"].includes(ENEMIES[k] && ENEMIES[k].ai); // set-piece düşmanlar yardımla azalmaz
  for (const [type, n] of Object.entries(scaledStart(L.start, dda.startMul, fixed))) for (let i = 0; i < n; i++) spawnEnemy(type);
  if (L.objective === "totem") for (const [x, z] of L.totems) spawnEnemy(TOTEM_ID, { x, z });
  setWandColor(WEAPONS[S.weapon].color);
  mus.set(L.objective === "boss" ? "boss" : "play", L.theme);
  levelStartScore = S.score;
  props("play");
  unmount();
  document.body.classList.add("playing");
  RT.running = true;
  if (dda.bonusHp) { RT.ddaHp = dda.bonusHp; S.maxHp += dda.bonusHp; S.hp += dda.bonusHp; } // bölüm bitince söner (levelClear)
  if (dda.startShield) RT.shieldT = (ABILITIES.shield && ABILITIES.shield.params && ABILITIES.shield.params.duration) || 8;
  if (dda.tier > 0 && STRINGS.dda && STRINGS.dda["notice" + (dda.tier + 1)]) RT.hintQ.push({ at: 0.4, text: STRINGS.dda["notice" + (dda.tier + 1)] });
  else if (!practice && L.hint) L.hint.forEach((text, i) => RT.hintQ.push({ at: 0.8 + i * 3.4, text })); // yeni öğe ipuçları: yalnızca ilk girişte, en çok 2 satır, 3 sn
  renderHud();
  renderWeapons();
  renderAbilities();
}

// geliştirici başlatması kayda ve ölçüme dokunmaz
const tracked = () => !inPractice() && !camp.noSave;
function endAttempt(r, ctx = {}) {
  const id = LEVEL_IDS[S.level];
  trackAttempt(id, r, { sec: RT.elapsed, hits: RT.hits, dda: RT.dda.tier, practice: inPractice(), off: !tracked(), ...ctx });
}

// Savaştan haritaya dönüş (duraklatma kartından). Ölümdeki "Haritaya dön" ile aynı kural: bölüm başındaki durum geri yüklenir,
// bölümün ilerlemesi/puanı kaydedilmez (kayıt zaten bölüm girişinde yazılmıştı).
export function quitToMap() {
  if (!RT.running) return;
  const id = LEVEL_IDS[S.level];
  endAttempt("q");
  RT.running = false; RT.paused = false;
  restoreSnapshot(); S.hp = S.maxHp;
  openMap(id);
}

// ---------- Yenilgi ----------
export function gameOver(cause = "dead") {
  if (!RT.running) return;
  endAttempt("d", { timeout: cause === "timeout" });
  RT.running = false;
  sfx("game_over");
  const line = STRINGS.deathLines[Math.floor(Math.random() * STRINGS.deathLines.length)];
  const idx = S.level, practice = inPractice(), id = LEVEL_IDS[idx];
  if (!practice) noteDeath(id);
  const next = practice ? null : nextDda(id), L = LEVELS[idx];
  gameOverScreen({
    line, idx, practice, dda: next, tip: L.hint && L.hint[0] ? L.hint[0] : "",
    onRetry: () => { restoreSnapshot(); S.hp = S.maxHp; introLevel({ quick: true }); }, // tek dokunuş: kart yok, doğrudan savaş
    onMap: () => { restoreSnapshot(); S.hp = S.maxHp; openMap(id); },
    onRestart: () => { newGame(); resetSession(); openMap(); },
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
  endAttempt("w");
  RT.running = false;
  if (RT.ddaHp) { S.maxHp -= RT.ddaHp; S.hp = Math.min(S.hp, S.maxHp); RT.ddaHp = 0; } // yardım canı bölümle söner
  if (!practice) noteClear(id);
  sfx("level_clear");
  const prevTotal = S.score;
  const bonus = Math.ceil(RT.timeLeft) * GAME.scoreTimeMul, levelBonus = GAME.scoreLevelBonus * (idx + 1);
  S.score += bonus + levelBonus;
  const stars = practice ? 0 : starsFor({ objective: L.objective, hits: RT.hits });
  recordResult(id, S.score - levelStartScore, RT.timeLeft, stars);
  renderHud();

  if (practice) { // alıştırma: ilerleme ve donanım değişmez, yalnızca en iyi sonuç kaydedilir
    persist();
    levelClearScreen({ idx, bonus, levelBonus, total: S.score, prevTotal, rewards: [], practice: true, choices: [], onBack: () => openMap(id) });
    return;
  }

  if (idx === LEVELS.length - 1) {
    camp.completed.add(id);
    persist();
    props("final");
    finalScreen({ outro: L.outro, stars, score: S.score, onMap: () => openMap(id), onReplay: () => { newGame(); resetSession(); openMap(); } });
    return;
  }
  const rewards = [];
  if (L.reward && !S.unlocked.includes(L.reward)) { S.unlocked.push(L.reward); rewards.push({ kind: "weapon", id: L.reward }); }
  if (L.ability && !S.abilities.includes(L.ability) && ABILITIES[L.ability]) { S.abilities.push(L.ability); rewards.push({ kind: "ability", id: L.ability }); }
  if (S.hp < S.maxHp) S.hp = Math.min(S.hp + GAME.clearHeal, S.maxHp);
  props("clear");
  levelClearScreen({
    idx, bonus, levelBonus, total: S.score, prevTotal, rewards, practice: false, choices: pickPerks(), stars,
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
