import { initI18n, setLang, getLang, t, field } from "./i18n.js";
import { scorePlacement, rankForPercent } from "./scoring.js";
import { ThreeApp } from "./three-app.js";
import { PlacementController } from "./input-raycast.js";
import { TrayPreview } from "./tray-preview.js";
import { renderResultModal, hideResultModal, renderFinalSummary } from "./ui-results.js";

const dom = {
  screenIntro: document.getElementById("screen-intro"),
  screenGame: document.getElementById("screen-game"),
  screenFinal: document.getElementById("screen-final"),
  introTitle: document.getElementById("intro-title"),
  introBody: document.getElementById("intro-body"),
  btnStart: document.getElementById("btn-start"),
  sceneCounter: document.getElementById("scene-counter"),
  sceneTitle: document.getElementById("scene-title"),
  scoreLabel: document.getElementById("score-label"),
  btnLang: document.getElementById("btn-lang"),
  canvas: document.getElementById("scene-canvas"),
  trayCanvas: document.getElementById("tray-canvas"),
  pickUpHint: document.getElementById("pick-up-hint"),
  orbitHint: document.getElementById("orbit-hint"),
  rotateHint: document.getElementById("rotate-hint"),
  tray: document.getElementById("tray"),
  btnConfirm: document.getElementById("btn-confirm"),
  modal: document.getElementById("result-modal"),
  resultStars: document.getElementById("result-stars"),
  resultMessage: document.getElementById("result-message"),
  resultExplanation: document.getElementById("result-explanation"),
  resultError: document.getElementById("result-error"),
  resultPlacementScore: document.getElementById("result-placement-score"),
  resultRunningTotal: document.getElementById("result-running-total"),
  btnNextScene: document.getElementById("btn-next-scene"),
  finalTitle: document.getElementById("final-title"),
  finalScore: document.getElementById("final-score"),
  finalStars: document.getElementById("final-stars"),
  finalRank: document.getElementById("final-rank"),
  btnPlayAgain: document.getElementById("btn-play-again"),
  errorBanner: document.getElementById("error-banner"),
};

const MAX_SCORE_PER_SCENE = 100;
const MAX_STARS_PER_SCENE = 3;

const game = {
  scenes: [],
  index: 0,
  totalScore: 0,
  totalStars: 0,
  app: null,
  controller: null,
  trayPreview: null,
  lastResult: null,
  lastMaxSoFar: 0,
};

function showScreen(screen) {
  for (const s of [dom.screenIntro, dom.screenGame, dom.screenFinal]) {
    s.hidden = s !== screen;
  }
}

function showError(message) {
  dom.errorBanner.textContent = message;
  dom.errorBanner.hidden = false;
}

async function loadScenes() {
  const res = await fetch("data/scenes.json");
  if (!res.ok) throw new Error("Failed to load scenes.json");
  const scenes = await res.json();
  return scenes.slice().sort((a, b) => a.difficulty - b.difficulty);
}

function applyStaticStrings() {
  document.title = t("appTitle");
  dom.introTitle.textContent = t("introTitle");
  dom.introBody.textContent = t("introBody");
  dom.btnStart.textContent = t("startButton");
  dom.btnLang.textContent = t("languageToggle");
  dom.pickUpHint.textContent = t("pickUpHint");
  dom.orbitHint.textContent = t("orbitHint");
  dom.rotateHint.textContent = t("rotateHint");
  dom.btnConfirm.textContent = t("putThatThereButton");
  dom.btnPlayAgain.textContent = t("playAgainButton");
  dom.btnNextScene.textContent =
    game.index >= game.scenes.length - 1 ? t("finishButton") : t("nextSceneButton");
}

function updateTopbar() {
  const scene = game.scenes[game.index];
  dom.sceneCounter.textContent = t("sceneCounter", {
    current: game.index + 1,
    total: game.scenes.length,
  });
  dom.sceneTitle.textContent = scene ? field(scene, "title") : "";
  dom.scoreLabel.textContent = t("scoreLabel", {
    score: game.totalScore,
    max: game.scenes.length * MAX_SCORE_PER_SCENE,
  });
}

function loadCurrentScene() {
  const scene = game.scenes[game.index];
  hideResultModal(dom);
  dom.btnConfirm.classList.remove("pulse");
  dom.rotateHint.hidden = true;

  game.app.loadScene(scene);
  game.controller.loadScene(scene);
  game.trayPreview.show(scene.missingObject.builder);

  updateTopbar();
  dom.btnNextScene.textContent =
    game.index >= game.scenes.length - 1 ? t("finishButton") : t("nextSceneButton");
}

function onConfirmReady(ready) {
  dom.btnConfirm.disabled = !ready;
  dom.btnConfirm.classList.toggle("pulse", ready);
}

function onRotateHintVisible(visible) {
  dom.rotateHint.hidden = !visible;
}

function onConfirmClick() {
  const placement = game.controller.lock();
  if (!placement) return;
  const scene = game.scenes[game.index];
  const result = scorePlacement(scene, placement);

  game.totalScore += result.score;
  game.totalStars += result.stars;

  if (result.revealHint) game.app.showTargetMarker(scene);

  const maxSoFar = (game.index + 1) * MAX_SCORE_PER_SCENE;
  game.lastResult = result;
  game.lastMaxSoFar = maxSoFar;
  renderResultModal(dom, scene, result, game.totalScore, maxSoFar);
  updateTopbar();
}

function onNextSceneClick() {
  hideResultModal(dom);
  game.index += 1;
  if (game.index >= game.scenes.length) {
    showFinalSummary();
    return;
  }
  loadCurrentScene();
}

function showFinalSummary() {
  const maxScore = game.scenes.length * MAX_SCORE_PER_SCENE;
  const maxStars = game.scenes.length * MAX_STARS_PER_SCENE;
  const percent = Math.round((game.totalScore / maxScore) * 100);
  renderFinalSummary(dom, game.totalScore, maxScore, game.totalStars, maxStars, rankForPercent(percent));
  showScreen(dom.screenFinal);
}

function startGame() {
  game.index = 0;
  game.totalScore = 0;
  game.totalStars = 0;
  showScreen(dom.screenGame);
  loadCurrentScene();
}

async function onLangToggle() {
  await setLang(getLang() === "tr" ? "en" : "tr");
  applyStaticStrings();
  updateTopbar();
  if (!dom.modal.hidden && game.lastResult) {
    renderResultModal(dom, game.scenes[game.index], game.lastResult, game.totalScore, game.lastMaxSoFar);
  }
}

async function init() {
  try {
    await initI18n();
    game.scenes = await loadScenes();
    applyStaticStrings();

    game.app = new ThreeApp(dom.canvas);
    game.trayPreview = new TrayPreview(dom.trayCanvas);
    game.controller = new PlacementController(
      game.app,
      { canvas: dom.canvas, trayEl: dom.tray },
      { onConfirmReady, onRotateHintVisible }
    );

    dom.btnStart.addEventListener("click", startGame);
    dom.btnConfirm.addEventListener("click", onConfirmClick);
    dom.btnNextScene.addEventListener("click", onNextSceneClick);
    dom.btnPlayAgain.addEventListener("click", () => showScreen(dom.screenIntro));
    dom.btnLang.addEventListener("click", onLangToggle);

    showScreen(dom.screenIntro);
  } catch (err) {
    console.error(err);
    showError(t("errorGeneric") || "Something went wrong.");
  }
}

init();
