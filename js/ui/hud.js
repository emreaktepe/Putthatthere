// HUD: üst çubuk, büyü/yetenek çubukları, bildirim (toast), hasar parlaması. Tüm metinler DOM düğümü olarak basılır.
import { sfx } from "../audio/engine.js";
import { ABILITIES, ABILITY_ORDER, LEVELS, STRINGS, WEAPONS, WEAPON_ORDER } from "../core/data.js";
import { fmt, h } from "../core/dom.js";
import { RT, S, abilCd } from "../core/state.js";
import { $ } from "../core/util.js";
import { useAbility } from "../game/abilities.js";
import { setWandColor } from "../render/wizard.js";

const hurtEl = $("hurt");
export function flashHurt() { hurtEl.classList.remove("on"); void hurtEl.offsetWidth; hurtEl.classList.add("on"); }

export function selectWeapon(id) {
  if (!id || !S.unlocked.includes(id)) return;
  S.weapon = id;
  setWandColor(WEAPONS[id].color);
  renderWeapons();
}

export function renderWeapons() {
  const bar = $("weapons");
  bar.replaceChildren();
  let activeBtn = null;
  for (const id of WEAPON_ORDER) {
    const w = WEAPONS[id];
    const open = S.unlocked.includes(id);
    const b = h("button", { class: "wbtn" + (id === S.weapon ? " active" : "") + (open ? "" : " locked") },
      ...(open ? [w.icon, " ", h("span", { class: "k" }, w.key + " ·"), " ", h("span", { class: "wn" }, w.name)] : ["🔒"]));
    b.onclick = () => { selectWeapon(id); b.blur(); };
    bar.appendChild(b);
    if (id === S.weapon) activeBtn = b;
  }
  if (activeBtn) bar.scrollLeft = activeBtn.offsetLeft - bar.clientWidth / 2 + activeBtn.offsetWidth / 2;
}

const abilEls = {};
export function renderAbilities() {
  const box = $("abil");
  box.replaceChildren();
  for (const k of Object.keys(abilEls)) delete abilEls[k];
  for (const id of ABILITY_ORDER) {
    if (!S.abilities.includes(id)) continue;
    const a = ABILITIES[id];
    const b = h("button", { class: "abtn", "aria-label": a.name }, a.icon, h("span", { class: "ak" }, a.key), h("span", { class: "acd" }));
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); useAbility(id); });
    box.appendChild(b);
    abilEls[id] = { b, cd: b.querySelector(".acd"), last: -1 };
  }
}
export function updateAbilityUi() {
  for (const id of Object.keys(abilEls)) {
    const el = abilEls[id], c = Math.ceil(abilCd[id]);
    if (c !== el.last) { el.last = c; el.cd.textContent = c > 0 ? c : ""; el.b.classList.toggle("cd", c > 0); }
  }
}

let toastTimer = 0;
export function toast(text, ms = 3800) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
  sfx("toast");
}

// HUD öğeleri yalnızca içerik değişince yeniden yazılır
const textCache = new Map();
function setText(id, text) {
  if (textCache.get(id) === "t:" + text) return;
  textCache.set(id, "t:" + text);
  $(id).textContent = text;
}
function setHearts(full, frac, empty) {
  const key = `h:${full}|${frac}|${empty}`;
  if (textCache.get("hearts") === key) return;
  textCache.set("hearts", key);
  $("hearts").replaceChildren("♥".repeat(full), ...(frac ? [h("span", { class: "half" }, "♥")] : []), "♡".repeat(empty));
}

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
  setText("level", fmt(H.level, { n: S.level + 1, total: LEVELS.length }));
  setText("goal", goalText(L));
  const full = Math.max(Math.floor(S.hp + 1e-6), 0), frac = S.hp > 0 && S.hp - full > 1e-6 ? 1 : 0;
  setHearts(full, frac, Math.max(S.maxHp - full - frac, 0));
  setText("time", fmt(H.time, { n: Math.ceil(RT.timeLeft) }));
  setText("score", fmt(H.score, { n: S.score }));
  let b = "";
  if (RT.bossRef) {
    const name = RT.bossRef.d.shortName || RT.bossRef.d.name;
    b = `${name}: ${"█".repeat(Math.max(Math.ceil((RT.bossRef.hp / RT.bossRef.maxHp) * 15), 0))}${RT.bossRef.shielded ? " 🛡" : ""}`;
  }
  setText("boss", b);
}
