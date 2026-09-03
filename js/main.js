import { initI18n, setLang, getLang, t } from "./i18n.js";
import { loadScenes, loadBackgroundMarkup, loadObjectMarkup } from "./sceneLoader.js";
import { scorePlacement, rankForPercent } from "./scoring.js";
import { PointerController } from "./input-pointer.js";
import { renderHintOutline, clearHintOutline, renderResultModal, hideResultModal, renderFinalSummary } from "./ui-results.js";

const dom = {
  screenIntro: document.getElementById("screen-intro"),
  screenGame: document.getElementById("screen-game"),
  screenFinal: document.getElementById("screen-final"),
  introTitle: document.getElementById("intro-title"),
  introBody: document.getElementById("intro-body"),
  btnStart: document.getElementById("btn-start"),
  sceneCounter: document.getElementById("scene-counter"),
  scoreLabel: document.getElementById("score-label"),
  btnLang: document.getElementById("btn-lang"),
  canvas: document.getElementById("scene-canvas"),
  bgLayer: document.getElementById("bg-layer"),
  hintLayer: document.getElementById("hint-layer"),
  ghostLayer: document.getElementById("ghost-layer"),
  placedLayer: document.getElementById("placed-layer"),
  pickUpHint: document.getElementById("pick-up-hint"),
  rotateHint: document.getElementById("rotate-hint"),
  tray: document.getElementById("tray"),
  trayIcon: document.getElementById("tray-icon"),
  btnConfirm: document.getElementById("btn-confirm"),
  modal: document.getElementById("result-modal"),
  resultStars: document.getElementById("result-stars"),
  resultMessage: document.getElementById("result-message"),
  resultExplanation: document.getElementById("result-explanation"),
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
  pointerController: null,
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

function applyStaticStrings() {
  document.title = t("appTitle");
  dom.introTitle.textContent = t("introTitle");
  dom.introBody.textContent = t("introBody");
  dom.btnStart.textContent = t("startButton");
  dom.btnLang.textContent = t("languageToggle");
  dom.pickUpHint.textContent = t("pickUpHint");
  dom.rotateHint.textContent = t("rotateHint");
  dom.btnConfirm.textContent = t("putThatThereButton");
  dom.btnNextScene.textContent = game.index >= game.scenes.length - 1 ? t("finishButton") : t("nextSceneButton");
  dom.btnPlayAgain.textContent = t("playAgainButton");
}

function updateTopbar() {
  dom.sceneCounter.textContent = t("sceneCounter", { current: game.index + 1, total: game.scenes.length });
  dom.scoreLabel.textContent = t("scoreLabel", { score: game.totalScore, max: game.scenes.length * MAX_SCORE_PER_SCENE });
}

async function loadCurrentScene() {
  const scene = game.scenes[game.index];
  clearHintOutline(dom.hintLayer);
  hideResultModal(dom);
  dom.btnConfirm.classList.remove("pulse");
  dom.rotateHint.hidden = true;

  const [bgMarkup, objMarkup] = await Promise.all([
    loadBackgroundMarkup(scene),
    loadObjectMarkup(scene),
  ]);

  dom.canvas.setAttribute("viewBox", "0 0 800 600");
  dom.bgLayer.replaceChildren();
  for (const child of bgMarkup.children) {
    dom.bgLayer.appendChild(child.cloneNode(true));
  }

  game.pointerController.loadScene(scene, objMarkup);
  updateTopbar();
  dom.btnNextScene.textContent = game.index >= game.scenes.length - 1 ? t("finishButton") : t("nextSceneButton");
}

function onConfirmReady(ready) {
  dom.btnConfirm.disabled = !ready;
  dom.btnConfirm.classList.toggle("pulse", ready);
}

function onRotateHintVisible(visible) {
  dom.rotateHint.hidden = !visible;
}

function onConfirmClick() {
  const placement = game.pointerController.lock();
  if (!placement) return;
  const scene = game.scenes[game.index];
  const result = scorePlacement(scene, placement);

  game.totalScore += result.score;
  game.totalStars += result.stars;

  if (result.revealHint) {
    renderHintOutline(dom.hintLayer, scene);
  }

  const maxSoFar = (game.index + 1) * MAX_SCORE_PER_SCENE;
  game.lastResult = result;
  game.lastMaxSoFar = maxSoFar;
  renderResultModal(dom, scene, result, game.totalScore, maxSoFar);
  updateTopbar();
}

async function onNextSceneClick() {
  hideResultModal(dom);
  game.index += 1;
  if (game.index >= game.scenes.length) {
    showFinalSummary();
    return;
  }
  await loadCurrentScene();
}

function showFinalSummary() {
  const maxScore = game.scenes.length * MAX_SCORE_PER_SCENE;
  const maxStars = game.scenes.length * MAX_STARS_PER_SCENE;
  const percent = Math.round((game.totalScore / maxScore) * 100);
  const rankKey = rankForPercent(percent);
  renderFinalSummary(dom, game.totalScore, maxScore, game.totalStars, maxStars, rankKey);
  showScreen(dom.screenFinal);
}

async function startGame() {
  game.index = 0;
  game.totalScore = 0;
  game.totalStars = 0;
  showScreen(dom.screenGame);
  await loadCurrentScene();
}

async function onLangToggle() {
  const next = getLang() === "tr" ? "en" : "tr";
  await setLang(next);
  applyStaticStrings();
  updateTopbar();
  if (!dom.modal.hidden && game.lastResult) {
    const scene = game.scenes[game.index];
    renderResultModal(dom, scene, game.lastResult, game.totalScore, game.lastMaxSoFar);
  }
}

async function init() {
  try {
    await initI18n();
    game.scenes = await loadScenes();
    applyStaticStrings();

    game.pointerController = new PointerController(
      dom.canvas,
      { ghostLayer: dom.ghostLayer, placedLayer: dom.placedLayer, trayEl: dom.tray, trayIcon: dom.trayIcon },
      { onConfirmReady, onRotateHintVisible }
    );

    dom.btnStart.addEventListener("click", startGame);
    dom.btnConfirm.addEventListener("click", onConfirmClick);
    dom.btnNextScene.addEventListener("click", onNextSceneClick);
    dom.btnPlayAgain.addEventListener("click", () => {
      showScreen(dom.screenIntro);
    });
    dom.btnLang.addEventListener("click", onLangToggle);

    showScreen(dom.screenIntro);
  } catch (err) {
    console.error(err);
    showError(t("errorGeneric") || "Something went wrong.");
  }
}

init();
