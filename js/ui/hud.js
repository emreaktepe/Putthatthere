// HUD: üst şerit (bölüm, süre halkası, puan), can kalpleri, hedef çubuğu, boss çubuğu; alt büyü slotları ve yetenek düğmeleri;
// bildirim (toast) ve hasar parlaması. Tüm metinler DOM düğümü olarak basılır; sık çağrılan güncellemeler önbellekle yalnız değişince yazar.
import { sfx } from "../audio/engine.js";
import { ABILITIES, ABILITY_ORDER, LEVELS, STRINGS, WEAPONS, WEAPON_ORDER } from "../core/data.js";
import { fmt, h, svg } from "../core/dom.js";
import { RT, S, abilCd } from "../core/state.js";
import { $ } from "../core/util.js";
import { useAbility } from "../game/abilities.js";
import { cyclePreset, setCamListener } from "../render/camera.js";
import { setWandColor } from "../render/wizard.js";
import { icon } from "./icons.js";
import { cooldownFrac, goalFrac, heartStates, timerModel } from "./models.js";
import { UI } from "./text.js";

const hurtEl = $("hurt");
export function flashHurt() {
  hurtEl.classList.remove("on"); void hurtEl.offsetWidth; hurtEl.classList.add("on");
  const hearts = $("hearts");
  if (hearts) { hearts.classList.remove("hit"); void hearts.offsetWidth; hearts.classList.add("hit"); }
}

// ---------- Üst HUD ----------
const RING = 2 * Math.PI * 17;
const el = {};
function buildHud() {
  const hud = $("hud");
  el.lvNum = h("small", { class: "lv-num" });
  el.lvName = h("b", { class: "lv-name" });
  el.timeNum = h("span", { class: "time-num" });
  el.ring = svg("circle", { cx: 20, cy: 20, r: 17, class: "ring-fg" });
  el.ring.style.strokeDasharray = String(RING);
  el.ringSvg = svg("svg", { viewBox: "0 0 40 40", class: "ring", "aria-hidden": "true" }, svg("circle", { cx: 20, cy: 20, r: 17, class: "ring-bg" }), el.ring);
  el.timer = h("div", { class: "hud-timer ok", role: "timer", "aria-label": "Kalan süre" }, el.ringSvg, el.timeNum);
  el.score = h("b", { class: "score-num" });
  el.hearts = h("div", { id: "hearts", class: "hearts", role: "img" });
  el.goalFill = h("i", { class: "bar-fill" });
  el.goalText = h("span", { class: "goal-text" });
  el.goalIc = h("span", { class: "goal-ic" });
  el.goal = h("div", { class: "hud-goal" }, el.goalIc, h("div", { class: "goal-body" }, el.goalText, h("div", { class: "bar" }, el.goalFill)));
  el.bossName = h("b", { class: "boss-name" });
  el.bossFill = h("i", { class: "bar-fill" });
  el.bossShield = h("span", { class: "boss-shield", hidden: true }, icon("shield"));
  el.boss = h("div", { class: "hud-boss", hidden: true }, el.bossName, h("div", { class: "bar boss-bar" }, el.bossFill), el.bossShield);
  hud.replaceChildren(
    h("div", { class: "hud-strip glass" },
      h("div", { class: "hud-level" }, el.lvNum, el.lvName), el.timer,
      h("div", { class: "hud-score" }, icon("star"), h("div", null, h("small", null, UI.hud.score), el.score))),
    h("div", { class: "hud-row" }, el.hearts, el.goal),
    el.boss);
}
buildHud();

// önbellek: değer değişmedikçe DOM'a dokunma
const cache = {};
const changed = (k, v) => (cache[k] === v ? false : ((cache[k] = v), true));

function goalText(L) {
  const H = STRINGS.hud;
  switch (L.objective) {
    case "crystal": return fmt(H.goalCrystal, { n: RT.collected, goal: L.goal });
    case "survive": return H.goalSurvive;
    case "totem": return fmt(H.goalTotem, { n: RT.totemsDown, goal: L.goal });
    case "miniboss": return H.goalMiniboss;
    default: return H.goalBoss + (RT.bossRef && RT.bossRef.bp ? fmt(H.goalPhase, { phase: RT.bossRef.bp }) : "");
  }
}

export function renderHud() {
  const L = LEVELS[S.level], H = STRINGS.hud;
  if (!L) return;
  if (changed("lv", S.level)) {
    el.lvNum.textContent = fmt(H.level, { n: S.level + 1, total: LEVELS.length });
    el.lvName.textContent = L.name;
    const ic = L.objective === "crystal" ? icon("crystal") : L.objective === "survive" ? icon("hourglass") : icon("target");
    el.goalIc.replaceChildren(ic);
  }
  // can
  const states = heartStates(S.hp, S.maxHp), key = states.join(",");
  if (changed("hearts", key)) {
    el.hearts.replaceChildren(...states.map((st) => h("span", { class: "heart " + st }, icon("heart", "bg"), icon("heart", "fg"))));
    el.hearts.setAttribute("aria-label", `Can: ${Math.max(S.hp, 0)} / ${S.maxHp}`);
    el.hearts.classList.toggle("low", S.hp > 0 && S.hp <= 1);
  }
  // süre
  const tm = timerModel(RT.timeLeft, L.time);
  if (changed("secs", tm.secs)) el.timeNum.textContent = String(tm.secs);
  if (changed("tone", tm.tone)) el.timer.className = "hud-timer " + tm.tone;
  const off = Math.round((1 - tm.frac) * RING * 10) / 10;
  if (changed("ring", off)) el.ring.style.strokeDashoffset = String(off);
  if (changed("score", S.score)) el.score.textContent = String(S.score);
  // hedef
  const gt = goalText(L);
  if (changed("goalText", gt)) el.goalText.textContent = gt;
  const bossFrac = RT.bossRef ? RT.bossRef.hp / RT.bossRef.maxHp : null;
  const gf = Math.round(goalFrac(L.objective, { collected: RT.collected, totemsDown: RT.totemsDown, goal: L.goal, timeLeft: RT.timeLeft, time: L.time, bossFrac }) * 100);
  if (changed("goalFill", gf)) el.goalFill.style.width = gf + "%";
  // boss
  if (changed("boss", RT.bossRef ? 1 : 0)) el.boss.hidden = !RT.bossRef;
  if (RT.bossRef) {
    const d = RT.bossRef.d;
    if (changed("bossName", d.shortName || d.name)) el.bossName.textContent = d.shortName || d.name;
    const bf = Math.round(Math.max(bossFrac, 0) * 1000) / 10;
    if (changed("bossFill", bf)) el.bossFill.style.width = bf + "%";
    if (changed("bossShield", !!RT.bossRef.shielded)) { el.bossShield.hidden = !RT.bossRef.shielded; el.boss.classList.toggle("shielded", !!RT.bossRef.shielded); }
  }
}
// bölüm başında önbelleği sıfırlar (yeni bölümde tüm alanlar yeniden yazılsın)
export function resetHud() { for (const k of Object.keys(cache)) delete cache[k]; }

// ---------- Büyü slotları ----------
export function selectWeapon(id) {
  if (!id || !S.unlocked.includes(id)) return;
  S.weapon = id;
  setWandColor(WEAPONS[id].color);
  renderWeapons();
}

const weaponEls = {};
export function renderWeapons() {
  const bar = $("weapons");
  bar.replaceChildren();
  for (const k of Object.keys(weaponEls)) delete weaponEls[k];
  let activeBtn = null;
  for (const id of WEAPON_ORDER) {
    const w = WEAPONS[id], open = S.unlocked.includes(id), active = id === S.weapon;
    const cd = h("span", { class: "slot-cd" });
    const b = h("button", {
      class: "slot" + (active ? " active" : "") + (open ? "" : " locked"), type: "button",
      style: { "--c": "#" + w.color.toString(16).padStart(6, "0") },
      "aria-label": open ? `${w.name} (${w.key})` : `Büyü ${w.key}: kilitli`, "aria-pressed": open ? String(active) : null, "aria-disabled": open ? null : "true",
    }, h("span", { class: "slot-ic" + (open ? "" : " sil") }, w.icon), h("span", { class: "slot-key" }, w.key), open ? h("span", { class: "slot-name" }, w.name) : icon("lock", "slot-lock"), cd);
    b.addEventListener("click", () => { selectWeapon(id); b.blur(); });
    bar.appendChild(b);
    weaponEls[id] = { b, cd, last: -1 };
    if (active) activeBtn = b;
  }
  if (activeBtn) bar.scrollLeft = activeBtn.offsetLeft - bar.clientWidth / 2 + activeBtn.offsetWidth / 2;
}

// ---------- Yetenek düğmeleri ----------
const abilEls = {};
export function renderAbilities() {
  const box = $("abil");
  box.replaceChildren();
  for (const k of Object.keys(abilEls)) delete abilEls[k];
  for (const id of ABILITY_ORDER) {
    if (!S.abilities.includes(id)) continue;
    const a = ABILITIES[id];
    const cd = h("span", { class: "slot-cd" }), num = h("span", { class: "acd" });
    const b = h("button", { class: "slot aslot", type: "button", "aria-label": `${a.name} (${a.key})` }, h("span", { class: "slot-ic" }, a.icon), h("span", { class: "slot-key" }, a.key), cd, num);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); useAbility(id); });
    box.appendChild(b);
    abilEls[id] = { b, cd, num, last: -1, f: -1 };
  }
}

// her karede çağrılır: bekleme örtüleri (yalnız değişince yazılır)
export function updateAbilityUi() {
  for (const id of Object.keys(abilEls)) {
    const e = abilEls[id], a = ABILITIES[id], c = Math.ceil(abilCd[id]), f = Math.round(cooldownFrac(abilCd[id], a.cd) * 100) / 100;
    if (f !== e.f) { e.f = f; e.cd.style.setProperty("--cd", String(f)); }
    if (c !== e.last) { e.last = c; e.num.textContent = c > 0 ? String(c) : ""; e.b.classList.toggle("cd", c > 0); }
  }
  const act = weaponEls[S.weapon];
  if (act) {
    const f = Math.round(cooldownFrac(RT.cooldown, WEAPONS[S.weapon].cd * S.cdMul) * 50) / 50;
    if (f !== act.last) { act.last = f; act.cd.style.setProperty("--cd", String(f)); }
  }
}

// ---------- Bildirim ----------
let toastTimer = 0;
export function toast(text, ms = 3800, silent = false) {
  const t = $("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  if (!silent) sfx("toast");
}

// kamera düğmesi: açıları sırayla değiştirir; ad kısa bildirimle gösterilir
$("cam").addEventListener("click", (e) => { cyclePreset(); e.currentTarget.blur(); });
setCamListener((p) => toast(`${UI.hud.cam}: ${p.name}`, 1400, true));
