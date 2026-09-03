import { t, field } from "./i18n.js";

function starString(stars) {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}

/** Human-friendly distance: centimetres up close, metres once it is a real miss. */
function formatDistance(metres) {
  return metres < 1 ? `${Math.round(metres * 100)} cm` : `${metres.toFixed(1)} m`;
}

export function renderResultModal(els, scene, result, runningTotal, maxSoFar) {
  els.resultStars.textContent = starString(result.stars);
  els.resultMessage.textContent = t(`starRating_${result.stars}`);
  els.resultExplanation.textContent = field(scene, "explanation");
  els.resultError.textContent = t("errorDistanceLabel", {
    distance: formatDistance(result.positionError),
  });
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
    stars: "★".repeat(Math.min(totalStars, maxStars)),
    maxStars,
  });
  els.finalRank.textContent = t("finalSummaryRankLabel", { rank: t(rankKey) });
}
