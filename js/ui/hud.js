// HUD: sol üstte marka, üst orta cam şerit (bölüm, süre halkası, puan) + kalpler + hedef çubuğu + boss çubuğu, solda görevler paneli;
// altta büyü slotları ve yetenek düğmeleri; bildirim (toast) ve hasar parlaması. Düğmeler (durdur, kamera, ses, harita) index.html + ui/pause.js'te.
// Tüm metinler DOM düğümü olarak basılır; sık çağrılan güncellemeler önbellekle yalnız değişince yazar.
import { sfx } from "../audio/engine.js";
import { ABILITIES, ABILITY_ORDER, CHARACTERS, LEVELS, STRINGS, WEAPONS, WEAPON_ORDER } from "../core/data.js";
import { fmt, h, svg } from "../core/dom.js";
import { RT, S, abilCd } from "../core/state.js";
import { $ } from "../core/util.js";
import { useAbility } from "../game/abilities.js";
import { cyclePreset, setCamListener } from "../render/camera.js";
import { setWandColor } from "../render/wizard.js";
import { artOr, fillMedallion, pickArt } from "./art.js";
import { heartCell, icon } from "./icons.js";
import { cooldownFrac, goalFrac, heartStates, questRows, slotModel, timerModel } from "./models.js";
import { UI, objectiveText } from "./text.js";

const hurtEl = $("hurt");
export function flashHurt() {
  hurtEl.classList.remove("on"); void hurtEl.offsetWidth; hurtEl.classList.add("on");
  const hearts = $("hearts");
  if (hearts) { hearts.classList.remove("hit"); void hearts.offsetWidth; hearts.classList.add("hit"); }
}

// ---------- Üst HUD ----------
const RING = 2 * Math.PI * 17;
const el = {};
const BRAND_IMG = "./assets/favicon/web/icon-192.webp"; // mevcut hafif amblem (15 KB); HUD'da 44 px gösterilir
const hexOf = (n) => "#" + n.toString(16).padStart(6, "0");
function buildHud() {
  const hud = $("hud");
  const T = UI.hud;
  el.lvNum = h("small", { class: "lv-num" });
  el.lvName = h("b", { class: "lv-name" });
  el.timeNum = h("span", { class: "time-num" });
  el.ring = svg("circle", { cx: 20, cy: 20, r: 17, class: "ring-fg" });
  el.ring.style.strokeDasharray = String(RING);
  el.ringSvg = svg("svg", { viewBox: "0 0 40 40", class: "ring", "aria-hidden": "true" }, svg("circle", { cx: 20, cy: 20, r: 17, class: "ring-bg" }), el.ring);
  el.timer = h("div", { class: "hud-timer ok", role: "timer", "aria-label": "Kalan süre" }, el.ringSvg, el.timeNum);
  el.score = h("b", { class: "score-num" });
  el.hearts = h("div", { id: "hearts", class: "hearts panel", role: "img" });
  el.goalFill = h("i", { class: "bar-fill" });
  el.goalText = h("span", { class: "goal-text" });
  el.goalIc = h("span", { class: "goal-ic" });
  el.goal = h("div", { class: "hud-goal panel" }, el.goalIc, h("div", { class: "goal-body" }, el.goalText, h("div", { class: "bar" }, el.goalFill)));
  el.bossMed = h("div", { class: "boss-medal", hidden: true });
  el.bossName = h("b", { class: "boss-name" });
  el.bossFill = h("i", { class: "bar-fill" });
  el.bossShield = h("span", { class: "boss-shield", hidden: true }, icon("shield"));
  el.boss = h("div", { class: "hud-boss panel", hidden: true }, el.bossMed, el.bossName, h("div", { class: "bar boss-bar" }, el.bossFill), el.bossShield);
  // marka amblemi: yüklenemezse düğümden kalkar, yazı kalır
  const logo = h("img", { class: "brand-img", src: BRAND_IMG, alt: "", width: 44, height: 44, decoding: "async", draggable: "false", "aria-hidden": "true" });
  logo.addEventListener("error", () => logo.remove());
  // görevler paneli: en çok 2 satır (bölüm hedefi + bu bölümde yenilen düşman); satır değerleri değişince yazılır
  el.qGoalIc = h("span", { class: "q-ic" });
  el.qGoalLabel = h("span", { class: "q-label" });
  el.qGoalVal = h("b", { class: "q-val" });
  el.qKillVal = h("b", { class: "q-val" });
  el.qGoalRow = h("li", { class: "q-row" }, el.qGoalIc, el.qGoalLabel, el.qGoalVal);
  el.quests = h("section", { class: "hud-quests panel gold-frame", "aria-label": T.quests },
    h("h3", { class: "q-head" }, icon("target"), T.quests),
    h("ul", { class: "q-list" }, el.qGoalRow, h("li", { class: "q-row" }, h("span", { class: "q-ic" }, icon("skull")), h("span", { class: "q-label" }, T.kills), el.qKillVal)));
  hud.replaceChildren(
    h("div", { class: "hud-brand" }, logo, h("span", { class: "brand-name" }, T.brand)),
    el.quests,
    h("div", { class: "hud-top" },
      h("div", { class: "hud-strip panel gold-frame" },
        h("div", { class: "hud-level" }, el.lvNum, el.lvName), el.timer,
        h("div", { class: "hud-score" }, icon("star"), h("div", null, h("small", null, T.score), el.score))),
      h("div", { class: "hud-row" }, el.hearts, el.goal),
      el.boss));
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
    const name = L.objective === "crystal" ? "crystal" : L.objective === "survive" ? "hourglass" : "target";
    el.goalIc.replaceChildren(icon(name));
    el.qGoalIc.replaceChildren(icon(name));
    el.qGoalLabel.textContent = objectiveText(L);
  }
  { // görevler: yalnız değişen değer yazılır
    const q = questRows(L, RT, S.kills - RT.killBase);
    if (changed("qGoal", q[0].value)) el.qGoalVal.textContent = q[0].value;
    if (changed("qDone", q[0].done)) el.qGoalRow.classList.toggle("done", q[0].done);
    if (changed("qKills", q[1].value)) el.qKillVal.textContent = q[1].value;
  }
  // can
  const states = heartStates(S.hp, S.maxHp), key = states.join(",");
  if (changed("hearts", key)) {
    el.hearts.replaceChildren(...states.map(heartCell));
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
    const bp = d.image || (d.character && CHARACTERS[d.character] ? CHARACTERS[d.character].portrait : null);
    if (changed("bossPortrait", bp || "")) { el.bossMed.hidden = !bp; if (bp) fillMedallion(el.bossMed, bp, d.name, document.createTextNode("")); }
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

// slot kartı: tuş rozeti (sol üst), ikon, ad (masaüstünde), kilitliyse kilit + silüet, bekleme örtüsü
function slotButton({ item, m, key, color, art, size, extra = "" }) {
  const cd = h("span", { class: "slot-cd" });
  const b = h("button", {
    class: "slot" + extra + (m.active ? " active" : "") + (m.open ? "" : " locked"), type: "button",
    style: { "--c": color }, "aria-label": m.label, "aria-disabled": m.open ? null : "true",
  },
  h("span", { class: "slot-ic" + (m.open ? "" : " sil") }, artOr(pickArt(item, true), document.createTextNode(item.icon), { cls: "slot-img", size, lazy: false })),
  h("span", { class: "slot-key", "aria-hidden": "true" }, key),
  m.open ? h("span", { class: "slot-name" }, item.name) : icon("lock", "slot-lock"), cd);
  return { b, cd };
}

const weaponEls = {};
export function renderWeapons() {
  const bar = $("weapons");
  bar.replaceChildren();
  for (const k of Object.keys(weaponEls)) delete weaponEls[k];
  let activeBtn = null;
  for (const id of WEAPON_ORDER) {
    const w = WEAPONS[id], open = S.unlocked.includes(id);
    const m = slotModel({ name: w.name, key: w.key, unlocked: open, selected: id === S.weapon });
    const { b, cd } = slotButton({ item: w, m, key: w.key, color: hexOf(w.color), size: 48 });
    if (open) b.setAttribute("aria-pressed", String(m.active));
    b.addEventListener("click", () => { if (RT.paused) return; selectWeapon(id); b.blur(); });
    bar.appendChild(b);
    weaponEls[id] = { b, cd, last: -1 };
    if (m.active) activeBtn = b;
  }
  if (WEAPONS[S.weapon]) $("fire").style.setProperty("--wc", hexOf(WEAPONS[S.weapon].color)); // ateş düğmesi halkası aktif büyünün rengi
  if (activeBtn) bar.scrollLeft = activeBtn.offsetLeft - bar.clientWidth / 2 + activeBtn.offsetWidth / 2;
}

// ---------- Yetenek düğmeleri (kilitli olanlar kilit + silüet olarak görünür) ----------
const abilEls = {};
export function renderAbilities() {
  const box = $("abil");
  box.replaceChildren();
  for (const k of Object.keys(abilEls)) delete abilEls[k];
  for (const id of ABILITY_ORDER) {
    const a = ABILITIES[id], open = S.abilities.includes(id);
    const m = slotModel({ name: a.name, key: a.key, unlocked: open, kind: "ability" });
    const { b, cd } = slotButton({ item: a, m, key: a.key, color: "#7ec8ff", size: 44, extra: " aslot" });
    const num = h("span", { class: "acd" });
    b.appendChild(num);
    if (open) b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!RT.paused) useAbility(id); });
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
