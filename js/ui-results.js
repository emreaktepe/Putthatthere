import { t, field } from "./i18n.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function starString(stars) {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}

export function renderHintOutline(hintLayer, scene) {
  hintLayer.replaceChildren();
  const target = scene.target;
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("class", "hint-outline");
  rect.setAttribute("x", target.x);
  rect.setAttribute("y", target.y);
  rect.setAttribute("width", target.width);
  rect.setAttribute("height", target.height);
  const cx = target.x + target.width / 2;
  const cy = target.y + target.height / 2;
  rect.setAttribute("transform", `rotate(${target.rotationDeg} ${cx} ${cy})`);
  hintLayer.appendChild(rect);
}

export function clearHintOutline(hintLayer) {
  hintLayer.replaceChildren();
}

export function renderResultModal(els, scene, result, runningTotal, maxSoFar) {
  els.resultStars.textContent = starString(result.stars);
  els.resultMessage.textContent = t(`starRating_${result.stars}`);
  els.resultExplanation.textContent = field(scene, "explanation");
  els.resultPlacementScore.textContent = t("scorePlacementLabel", { score: result.score });
  els.resultRunningTotal.textContent = t("runningTotalLabel", { total: runningTotal, max: maxSoFar });
  els.modal.hidden = false;
}

export function hideResultModal(els) {
  els.modal.hidden = true;
}

export function renderFinalSummary(els, totalScore, maxScore, totalStars, maxStars, rankKey) {
  const percent = Math.round((totalScore / maxScore) * 100);
  els.finalTitle.textContent = t("finalSummaryTitle");
  els.finalScore.textContent = t("finalSummaryScoreLabel", { total: totalScore, max: maxScore, percent });
  els.finalStars.textContent = t("finalSummaryStarsLabel", {
    stars: "★".repeat(totalStars > maxStars ? maxStars : totalStars),
    maxStars,
  });
  els.finalRank.textContent = t("finalSummaryRankLabel", { rank: t(rankKey) });
}
