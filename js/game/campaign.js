// Kampanya oturumu: kayıt okuma/yazma, tamamlanan bölümler, en iyi sonuçlar ve "alıştırma" (tamamlanmış bölümü tekrar oynama).
// DOM'a dokunmaz. Alıştırmada gerçek koşu (S) camp.practice.real içinde saklanır; S geçici olarak ödül donanımıyla değiştirilir,
// kayıt her zaman gerçek koşudan yazılır, böylece alıştırma ilerlemeyi ve tamamlananları bozmaz, yalnızca en iyi sonucu günceller.
import { ABILITY_ORDER, CAMPAIGN, CONFIG_INFO, LEVELS, LEVEL_IDS, WEAPON_ORDER } from "../core/data.js";
import { buildSave, clearSave, emptyBest, loadSave, writeSave } from "../core/save.js";
import { S, defaultRun, newRun, setRun } from "../core/state.js";
import { effectiveEdges, levelStatuses, practiceKit, recordBest } from "./progress.js";

export const camp = { completed: new Set(), best: emptyBest(), practice: null, pending: null, status: "none", notices: [] };

const ctx = () => ({ levelIds: LEVEL_IDS, weaponIds: WEAPON_ORDER, abilityIds: ABILITY_ORDER, defaults: defaultRun() });
const clone = (o) => JSON.parse(JSON.stringify(o));

// açılışta bir kez: kayıt var mı bak (bozuksa/daha yeniyse yok say, durumu menüye bildir)
export function initCampaign() {
  const r = loadSave(ctx());
  camp.status = r.status;
  camp.notices = r.notices;
  camp.pending = r.status === "ok" ? r.save : null;
  return camp.pending;
}
export const hasSave = () => !!camp.pending;

export function continueGame() {
  const sv = camp.pending;
  if (!sv) return false;
  camp.practice = null;
  setRun(sv.run);
  camp.completed = new Set(sv.completed);
  camp.best = clone(sv.best);
  return true;
}

// yeni koşu: tamamlananlar sıfırlanır, en iyi sonuçlar korunur
export function newGame() {
  const keepBest = camp.pending ? camp.pending.best : camp.best;
  camp.practice = null;
  camp.best = clone(keepBest || emptyBest());
  camp.completed = new Set();
  newRun();
  persist();
}

export function persist() {
  const run = camp.practice ? camp.practice.real : S;
  const save = buildSave({ levelIds: LEVEL_IDS, completed: camp.completed, level: run.level, run, best: camp.best, configHash: CONFIG_INFO.baseHash });
  if (writeSave(save)) camp.pending = save;
  return save;
}
export function wipeSave() { clearSave(); camp.pending = null; camp.status = "none"; }

export const edges = () => effectiveEdges(LEVEL_IDS, CAMPAIGN.edges);
export const statuses = () => levelStatuses(LEVEL_IDS, edges(), CAMPAIGN.start, camp.completed);

export function startPractice(index) {
  if (!camp.practice) camp.practice = { real: clone(S) };
  setRun({ ...defaultRun(), ...practiceKit(LEVELS, index, WEAPON_ORDER), level: index });
}
export function endPractice() {
  if (!camp.practice) return;
  setRun(camp.practice.real);
  camp.practice = null;
}
export const inPractice = () => !!camp.practice;

// bölüm sonucunu en iyilere işler (puan: bölümde kazanılan, süre: kalan saniye) ve kaydı yazar
export function recordResult(id, score, time) {
  camp.best = recordBest(camp.best, id, { score, time });
  camp.best.score = Math.max(camp.best.score, Math.floor((camp.practice ? 0 : S.score)));
}
