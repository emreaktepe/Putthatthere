// Kart tabanlı bölüm ekranları: bölüm girişi, bölüm sonu (puan özeti, ödül kartı, perk kartları), yenilgi ve final.
// Konfigürasyon metinleri yalnızca h()/rich() ile (textContent) basılır.
import { ABILITIES, CHARACTERS, ENEMY_NAMES, LEVELS, STRINGS, TOTEM_ID, WEAPONS } from "../core/data.js";
import { fmt, h, rich, safeHex } from "../core/dom.js";
import { S } from "../core/state.js";
import { fillMedallion } from "./art.js";
import { icon } from "./icons.js";
import { RARITY_LABEL, countValue, enemyIcon, perkIcon, perkRarity, portraitOf } from "./models.js";
import { button, confirmButton, mount, reducedMotion, scope } from "./screens.js";
import { UI, objectiveText } from "./text.js";

// anlatı satırları -> konuşmacı portreli diyalog balonları
export function dialogView(lines) {
  return h("div", { class: "dlg" }, ...lines.map((l, i) => {
    const d = { "--d": (i * 0.14).toFixed(2) + "s" };
    if (!l.speaker) return h("div", { class: "bubble narr", style: d }, h("p", null, rich(l.text)));
    const p = portraitOf(CHARACTERS, l.speaker), c = safeHex(l.color) || safeHex(p.color);
    if (c) d["--c"] = c;
    return h("div", { class: "bubble", style: d },
      fillMedallion(h("div", { class: "avatar", "aria-hidden": p.portrait ? null : "true" }), p.portrait, l.speaker, document.createTextNode(p.icon)),
      h("div", { class: "bubble-body" }, h("b", { class: "who" }, l.speaker), h("p", null, rich(l.text))));
  }));
}

function foeIds(L) {
  const ids = new Set(Object.keys(L.start));
  L.spawn.forEach((w) => Object.keys(w).forEach((k) => ids.add(k)));
  if (L.objective === "totem" && TOTEM_ID) ids.add(TOTEM_ID);
  return [...ids].filter((k) => ENEMY_NAMES[k]);
}
export function foeChips(L) {
  return h("ul", { class: "chips", "aria-label": UI.map.foes }, ...foeIds(L).map((k) => h("li", { class: "chip", title: ENEMY_NAMES[k] }, h("span", { class: "chip-ic", "aria-hidden": "true" }, enemyIcon(k)), ENEMY_NAMES[k])));
}

// ---------- Bölüm girişi ----------
export function levelIntroScreen({ idx, practice, onEnter, onBack }) {
  const L = LEVELS[idx], T = STRINGS.level, sc = scope();
  const node = h("section", { class: "card screen-card intro-card", "aria-label": fmt(T.title, { n: idx + 1, name: L.name }) },
    h("header", { class: "card-head" },
      practice ? h("span", { class: "badge" }, UI.map.practice) : null,
      h("h2", null, fmt(T.title, { n: idx + 1, name: L.name }))),
    dialogView(L.intro),
    h("div", { class: "obj" }, icon("target"), h("span", null, objectiveText(L))),
    h("div", { class: "obj-foes" }, h("small", { class: "eyebrow" }, UI.map.foes), foeChips(L)),
    h("p", { class: "stat-line" }, fmt(T.stats, { time: L.time, hp: Math.ceil(S.hp), maxHp: S.maxHp })),
    h("p", { class: "hint" }, T.hint),
    h("div", { class: "btn-row" }, button(T.enter, onEnter, { ic: "play", autofocus: true }), button(UI.result.back, onBack, { kind: "ghost", ic: "back" })));
  mount(node, sc, { music: "menu", cls: "dim" });
}

// ---------- Sayı sayma animasyonu ----------
function countUp(sc, elNode, to, { from = 0, delay = 0, dur = 900, prefix = "" } = {}) {
  if (reducedMotion()) { elNode.textContent = prefix + to; return; }
  elNode.textContent = prefix + from;
  let t0 = 0;
  sc.raf((now) => {
    if (!t0) t0 = now + delay;
    if (now < t0) return true;
    const k = Math.min((now - t0) / dur, 1);
    elNode.textContent = prefix + countValue(from, to, k);
    return k < 1;
  });
}

function rewardCard(kind, id) {
  const isW = kind === "weapon", d = isW ? WEAPONS[id] : ABILITIES[id], C = STRINGS.clear;
  const stat = isW ? `${UI.result.damage} ${d.dmg} · ${UI.result.cooldown} ${d.cd} ${UI.map.sec}` : `${UI.result.cooldown} ${d.cd} ${UI.map.sec}`;
  const col = isW ? "#" + d.color.toString(16).padStart(6, "0") : "#9ad7ff";
  return h("div", { class: "reward-card", style: { "--rc": col } },
    h("div", { class: "reward-glow", "aria-hidden": "true" }),
    h("div", { class: "reward-ic", "aria-hidden": "true" }, d.icon),
    h("div", { class: "reward-txt" },
      h("small", { class: "eyebrow" }, isW ? UI.result.newSpell : UI.result.newAbility),
      h("b", { class: "reward-name" }, d.name),
      h("span", { class: "key-badge" }, `${UI.result.key}: ${d.key}`),
      h("p", { class: "reward-desc" }, rich(isW ? C.newWeapon : C.newAbility, { name: d.name, key: d.key })),
      h("small", { class: "reward-stat" }, stat)));
}

function perkCard(p, onPick, locked) {
  const rar = perkRarity(p.maxStacks);
  const b = h("button", { class: "perk-card r-" + rar, type: "button", "aria-label": `${p.name}: ${p.desc} (${RARITY_LABEL[rar]})` },
    h("span", { class: "perk-rar" }, RARITY_LABEL[rar]),
    h("span", { class: "perk-ic", "aria-hidden": "true" }, perkIcon(p.effect)),
    h("b", { class: "perk-name" }, p.name),
    h("span", { class: "perk-desc" }, p.desc));
  b.addEventListener("click", () => { if (locked.v) return; locked.v = true; b.classList.add("picked"); onPick(p); });
  return b;
}

// ---------- Bölüm sonu ----------
// rewards: [{ kind: "weapon" | "ability", id }]; choices: perk listesi; onPick(perk) | onBack (alıştırma)
export function levelClearScreen({ idx, bonus, levelBonus, total, prevTotal, rewards, practice, choices, onPick, onBack }) {
  const L = LEVELS[idx], C = STRINGS.clear, sc = scope(), locked = { v: false };
  const bonusNum = h("b", { class: "num" }), lvlNum = h("b", { class: "num" }), totalNum = h("b", { class: "num total" });
  const [pre, post = ""] = String(C.bonus).split("{bonus}");
  const summary = h("div", { class: "summary" },
    h("div", { class: "sum-row" }, h("span", null, pre.replace(/[:：]\s*\+?$/, "")), h("span", null, "+", bonusNum, post)),
    h("div", { class: "sum-row" }, h("span", null, UI.result.levelBonus), h("span", null, "+", lvlNum)),
    h("div", { class: "sum-row total-row" }, h("span", null, UI.result.total), h("span", null, icon("star"), totalNum)));
  const node = h("section", { class: "card screen-card clear-card", "aria-label": fmt(C.title, { n: idx + 1 }) },
    h("header", { class: "card-head" }, practice ? h("span", { class: "badge" }, UI.result.practiceDone) : null, h("h2", null, fmt(C.title, { n: idx + 1 }))),
    summary,
    ...rewards.map((r) => rewardCard(r.kind, r.id)),
    dialogView(L.outro),
    practice
      ? h("div", { class: "btn-row" }, button(UI.result.back, onBack, { ic: "back", autofocus: true }))
      : h("div", { class: "perk-box" }, h("h3", null, C.pickPerk), h("div", { class: "perks" }, ...choices.map((p) => perkCard(p, onPick, locked)))));
  countUp(sc, bonusNum, bonus, { delay: 250 });
  countUp(sc, lvlNum, levelBonus, { delay: 700 });
  countUp(sc, totalNum, total, { from: prevTotal, delay: 1150, dur: 1100 });
  mount(node, sc, { music: "menu", cls: "dim" });
}

// ---------- Yenilgi ----------
export function gameOverScreen({ line, idx, practice, onRetry, onMap, onRestart }) {
  const T = STRINGS.gameOver, sc = scope();
  const node = h("section", { class: "card screen-card over-card", "aria-label": "Yenilgi" },
    h("div", { class: "over-sigil", "aria-hidden": "true" }, "☠"),
    dialogView([line]),
    h("p", { class: "stat-line" }, fmt(T.stats, { n: idx + 1, score: S.score })),
    h("div", { class: "btn-row col" },
      button(T.retry, onRetry, { small: T.retryNote, autofocus: true }),
      button(UI.result.back, onMap, { kind: "ghost", ic: "back" }),
      practice ? null : confirmButton(T.restart, UI.result.confirm, onRestart, sc, { kind: "ghost" })));
  mount(node, sc, { music: "menu", cls: "dim dark" });
}

// ---------- Final ----------
export function finalScreen({ outro, score, onMap, onReplay }) {
  const sc = scope();
  const node = h("section", { class: "card screen-card final-card", "aria-label": STRINGS.finalTitle },
    h("div", { class: "sun", "aria-hidden": "true" }),
    h("h2", { class: "final-title" }, STRINGS.finalTitle),
    dialogView(outro),
    h("p", { class: "final-line" }, STRINGS.finalLine),
    h("p", { class: "final-score" }, rich(STRINGS.finalScore, { score })),
    h("div", { class: "btn-row" },
      button(UI.result.seeMap, onMap, { ic: "play", autofocus: true }),
      confirmButton(STRINGS.replay, UI.result.confirm, onReplay, sc, { kind: "ghost" })));
  mount(node, sc, { music: "menu", cls: "final" });
}
