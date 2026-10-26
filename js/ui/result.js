// Kart tabanlı bölüm ekranları: bölüm girişi, bölüm sonu (puan özeti, ödül kartı, perk kartları), yenilgi ve final.
// Konfigürasyon metinleri yalnızca h()/rich() ile (textContent) basılır.
import { ABILITIES, CHARACTERS, ENEMIES, ENEMY_NAMES, LEVELS, STRINGS, TOTEM_ID, WEAPONS } from "../core/data.js";
import { fmt, h, rich, safeHex } from "../core/dom.js";
import { S } from "../core/state.js";
import { artOr, fillMedallion, pickArt } from "./art.js";
import { icon } from "./icons.js";
import { RARITY_LABEL, countValue, enemyIcon, foeIdsOf, perkIcon, perkRarity, portraitOf, rewardStat, scoreRows } from "./models.js";
import { button, confirmButton, divider, mount, ornaments, reducedMotion, scope } from "./screens.js";
import { UI, objectiveText } from "./text.js";
import { BRAND } from "./brandmodel.js";

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

// düşman rozeti: enemies.<id>.image varsa küçük yuvarlak görsel, yoksa emoji simgesi
export function foeBadge(k) {
  const fb = document.createTextNode(enemyIcon(k));
  const e = ENEMIES[k], im = e && artOr(e.image, null, { cls: "chip-img", size: 22 });
  return h("span", { class: "chip-ic", "aria-hidden": "true" }, im || fb);
}
export function foeChips(L) {
  return h("ul", { class: "chips", "aria-label": UI.map.foes }, ...foeIdsOf(L, ENEMY_NAMES, TOTEM_ID).map((k) => h("li", { class: "chip", title: ENEMY_NAMES[k] }, foeBadge(k), ENEMY_NAMES[k])));
}

// bölüm kapak görseli (levels.<id>.image); yoksa/yüklenemezse hiçbir şey eklenmez
export function coverImg(L) {
  const im = artOr(L.image, null, { cls: "cover-img", lazy: false });
  return im ? h("div", { class: "cover" }, im) : null;
}

// DDA bilgi satırı: yardım kademesi varsa ne değiştiğini söyler (şeffaflık; metin config strings.dda). Kademe 1+ için kademe-1 anahtarı: notice<tier+1>
export function ddaNote(dda) {
  const t = dda && dda.tier > 0 && STRINGS.dda ? STRINGS.dda["notice" + (dda.tier + 1)] : "";
  return t ? h("p", { class: "dda-note", role: "status" }, icon("shield"), h("span", null, t)) : null;
}

// ---------- Bölüm girişi ----------
export function levelIntroScreen({ idx, practice, onEnter, onBack, dda = null }) {
  const L = LEVELS[idx], T = STRINGS.level, sc = scope();
  const title = fmt(T.title, { n: idx + 1, name: L.name });
  const node = h("section", { class: "card screen-card intro-card gold-frame", "aria-label": title },
    ornaments(),
    h("header", { class: "card-head" },
      practice ? h("span", { class: "badge practice-chip" }, icon("refresh"), UI.map.practice) : null,
      h("h2", null, title), divider()),
    h("div", { class: "ic-grid" },
      coverImg(L),
      h("div", { class: "ic-info" },
        dialogView(L.intro),
        h("div", { class: "obj" }, icon("target"), h("span", null, objectiveText(L))),
        h("div", { class: "obj-foes" }, h("small", { class: "eyebrow" }, UI.map.foes), foeChips(L)),
        h("p", { class: "stat-line" }, icon("hourglass"), h("span", null, `${UI.map.time}: `, h("b", null, `${L.time} ${UI.map.sec}`)), h("i", { class: "dot", "aria-hidden": "true" }), icon("heart"), h("span", null, `${UI.result.hp}: `, h("b", null, `${Math.ceil(S.hp)}/${S.maxHp}`))),
        ddaNote(dda),
        h("p", { class: "hint" }, T.hint))),
    h("div", { class: "btn-row" }, button(T.enter, onEnter, { ic: "play", autofocus: true }), button(UI.result.back, onBack, { kind: "ghost", ic: "back" })));
  mount(node, sc, { music: "menu", cls: "dim card-stage" });
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

function rewardIcon(d) {
  const im = artOr(pickArt(d), null, { cls: "reward-img", size: 96, lazy: false });
  if (!im) return h("div", { class: "reward-ic", "aria-hidden": "true" }, d.icon);
  const box = h("div", { class: "reward-ic has-art", "aria-hidden": "true" }, im);
  im.addEventListener("error", () => { box.classList.remove("has-art"); box.textContent = d.icon; });
  return box;
}

function rewardCard(kind, id) {
  const isW = kind === "weapon", d = isW ? WEAPONS[id] : ABILITIES[id], C = STRINGS.clear;
  const stat = rewardStat(kind, d, { damage: UI.result.damage, cooldown: UI.result.cooldown, sec: UI.map.sec });
  const col = isW ? "#" + d.color.toString(16).padStart(6, "0") : "#9ad7ff";
  return h("div", { class: "reward-card", style: { "--rc": col } },
    ornaments(),
    h("div", { class: "reward-glow", "aria-hidden": "true" }),
    rewardIcon(d),
    h("div", { class: "reward-txt" },
      h("small", { class: "eyebrow" }, isW ? UI.result.newSpell : UI.result.newAbility),
      h("b", { class: "reward-name" }, d.name),
      h("span", { class: "key-badge" }, `${UI.result.key}: ${d.key}`),
      h("p", { class: "reward-desc" }, rich(isW ? C.newWeapon : C.newAbility, { name: d.name, key: d.key })),
      h("small", { class: "reward-stat" }, stat)));
}

function perkIconNode(p) {
  const im = artOr(pickArt(p), null, { cls: "perk-img", size: 64, lazy: false });
  if (!im) return h("span", { class: "perk-ic", "aria-hidden": "true" }, perkIcon(p.effect));
  const box = h("span", { class: "perk-ic has-art", "aria-hidden": "true" }, im);
  im.addEventListener("error", () => { box.classList.remove("has-art"); box.textContent = perkIcon(p.effect); });
  return box;
}

function perkCard(p, onPick, locked) {
  const rar = perkRarity(p.maxStacks);
  const b = h("button", { class: "perk-card r-" + rar, type: "button", "aria-label": `${p.name}: ${p.desc} (${RARITY_LABEL[rar]})` },
    h("span", { class: "perk-rar" }, RARITY_LABEL[rar]),
    perkIconNode(p),
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
  const [pre] = String(C.bonus).split("{bonus}");
  const rows = Object.fromEntries(scoreRows({ bonus, levelBonus, total, prevTotal }).map((r) => [r.id, r]));
  const summary = h("div", { class: "summary" },
    h("div", { class: "sum-row" }, h("span", null, icon("hourglass"), pre.replace(/[:：]\s*\+?$/, "") || UI.result.timeBonus), h("span", null, "+", bonusNum)),
    h("div", { class: "sum-row" }, h("span", null, icon("star"), UI.result.levelBonus), h("span", null, "+", lvlNum)),
    h("div", { class: "sum-row total-row" }, h("span", null, UI.result.total), h("span", null, icon("star"), totalNum)));
  const node = h("section", { class: "card screen-card clear-card gold-frame", "aria-label": fmt(C.title, { n: idx + 1 }) },
    ornaments(),
    h("header", { class: "card-head" }, practice ? h("span", { class: "badge" }, UI.result.practiceDone) : null, h("h2", null, fmt(C.title, { n: idx + 1 }))),
    h("div", { class: "cl-grid" },
      h("div", { class: "cl-left" }, summary, ...rewards.map((r) => rewardCard(r.kind, r.id))),
      h("div", { class: "cl-right" }, dialogView(L.outro))),
    practice
      ? h("div", { class: "btn-row" }, button(UI.result.back, onBack, { ic: "back", autofocus: true }))
      : h("div", { class: "perk-box" }, h("h3", { class: "perk-head" }, C.pickPerk, divider()), h("div", { class: "perks" }, ...choices.map((p) => perkCard(p, onPick, locked)))));
  countUp(sc, bonusNum, rows.time.value, { delay: 250 });
  countUp(sc, lvlNum, rows.level.value, { delay: 700 });
  countUp(sc, totalNum, rows.total.value, { from: rows.total.from, delay: 1150, dur: 1100 });
  mount(node, sc, { music: "menu", cls: "dim card-stage" });
}

// ---------- Yenilgi ----------
export function gameOverScreen({ line, idx, practice, onRetry, onMap, onRestart, dda = null, tip = "" }) {
  const T = STRINGS.gameOver, sc = scope();
  const node = h("section", { class: "card screen-card over-card gold-frame", "aria-label": "Yenilgi" },
    ornaments(),
    h("div", { class: "over-sigil", "aria-hidden": "true" }, "☠"),
    dialogView([line]),
    h("p", { class: "stat-line" }, fmt(T.stats, { n: idx + 1, score: S.score })),
    ddaNote(dda),
    tip ? h("p", { class: "tip-line" }, h("b", null, UI.result.tip + ": "), tip) : null,
    h("div", { class: "btn-row col" },
      button(T.retry, onRetry, { small: T.retryNote, autofocus: true }),
      button(UI.result.back, onMap, { kind: "ghost", ic: "back" }),
      practice ? null : confirmButton(T.restart, UI.result.confirm, onRestart, sc, { kind: "ghost" })));
  mount(node, sc, { music: "menu", cls: "dim dark card-stage" });
}

// ---------- Final ----------
export function finalScreen({ outro, score, onMap, onReplay }) {
  const sc = scope();
  const node = h("section", { class: "card screen-card final-card gold-frame", "aria-label": STRINGS.finalTitle },
    ornaments(),
    h("div", { class: "sun", "aria-hidden": "true" }),
    h("h2", { class: "final-title" }, STRINGS.finalTitle),
    dialogView(outro),
    h("p", { class: "final-line" }, STRINGS.finalLine),
    h("p", { class: "final-score" }, rich(STRINGS.finalScore, { score })),
    h("div", { class: "btn-row" },
      button(UI.result.seeMap, onMap, { ic: "play", autofocus: true }),
      confirmButton(STRINGS.replay, UI.result.confirm, onReplay, sc, { kind: "ghost" })),
    h("p", { class: "final-sign" }, BRAND.full));
  mount(node, sc, { music: "menu", cls: "final card-stage" });
}
