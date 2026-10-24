// Yönetim sayfası: canlı örnek kartlar (renk, simge, ad). Three.js yüklenmez; js/ui/models.js yardımcıları yeniden kullanılır.
// Renkler yalnızca doğrulanmış hex ise CSS değişkenine yazılır.
import { h, safeHex } from "../core/dom.js";
import { fillMedallion } from "../ui/art.js";
import { RARITY_LABEL, enemyIcon, perkIcon, perkRarity, portraitOf } from "../ui/models.js";

const col = (v, fb) => safeHex(v) || fb;
const chip = (t) => h("span", { class: "chip" }, t);

function card(kind, { icon, portrait, color, glow, title, sub, chips = [], text = "" }) {
  return h("article", { class: "pcard " + kind, style: { "--c": col(color, "#8e44ff"), "--e": col(glow, col(color, "#8e44ff")) }, "aria-label": "Önizleme: " + title },
    portrait ? fillMedallion(h("div", { class: "pcard-ic" }), portrait, title, document.createTextNode(icon)) : h("div", { class: "pcard-ic", "aria-hidden": "true" }, icon),
    h("div", { class: "pcard-body" }, h("strong", null, title), sub ? h("small", null, sub) : null, chips.length ? h("div", { class: "chips" }, ...chips.map(chip)) : null, text ? h("p", null, text) : null));
}

const ROLE = { player: "Oyuncu", ally: "Dost", villain: "Kötü", npc: "Yan karakter" };
const OBJ = { crystal: "Kristal", survive: "Hayatta kal", totem: "Totem", miniboss: "Yarı boss", boss: "Boss" };

export function previewCard(coll, id, item, cfg) {
  if (!item) return h("div", { class: "pcard empty" }, "Önizleme yok");
  switch (coll) {
    case "characters": {
      const p = portraitOf(cfg.characters, item.name);
      return card("char", { icon: item.icon || p.icon, portrait: item.portrait, color: item.color, title: String(item.name || id), sub: ROLE[item.role] || String(item.role || ""), text: String(item.bio || "") });
    }
    case "enemies":
      return card("enemy", { icon: enemyIcon(item.model || id), color: item.color, glow: item.emissive, title: String(item.name || id), sub: "yapay zekâ: " + item.ai, chips: [`can ${item.hp}`, `hız ${item.speed}`, `puan ${item.score ?? 0}`, ...(item.character && cfg.characters && cfg.characters[item.character] ? ["karakter: " + cfg.characters[item.character].name] : [])] });
    case "weapons":
      return card("weapon", { icon: String(item.icon || "✦"), color: item.color, title: String(item.name || id), sub: "tuş: " + (((cfg.weaponOrder || []).indexOf(id) + 1) || "—"), chips: [`bekleme ${item.cd} sn`, `hasar ${item.dmg}`] });
    case "abilities":
      return card("weapon", { icon: String(item.icon || "✦"), color: "#5ee7ff", title: String(item.name || id), sub: "yetenek", chips: [`bekleme ${item.cd} sn`] });
    case "perks": {
      const r = perkRarity(item.maxStacks);
      return card("perk r-" + r, { icon: perkIcon(item.effect), color: r === "epic" ? "#ffc857" : r === "rare" ? "#4fb0ff" : "#b4bfd8", title: String(item.name || id), sub: RARITY_LABEL[r], text: String(item.desc || "") });
    }
    case "themes":
      return h("article", { class: "pcard theme", "aria-label": "Önizleme: " + item.name },
        h("div", { class: "swatches", "aria-hidden": "true" }, ...["bg", "floor", "ring", "hemi", "moon"].map((k) => h("i", { style: { background: col(item[k], "#000000") }, title: k }))),
        h("div", { class: "pcard-body" }, h("strong", null, String(item.name || id)), h("small", null, `${item.floorKind} · ${item.scenery}`), item.music ? h("div", { class: "chips" }, chip(`${item.music.bpm} bpm`), chip(`kök ${item.music.root}`)) : null));
    case "levels":
      return card("level", { icon: (item.map && item.map.icon) || "🗺️", color: "#d9b3ff", title: String(item.name || id), sub: OBJ[item.objective] || String(item.objective), chips: [`hedef ${item.goal}`, `süre ${item.time} sn`, "tema: " + item.theme] });
    default: return h("div", { class: "pcard empty" }, "Önizleme yok");
  }
}

// oyuncu görünüm paleti şeridi
export function lookStrip(look) {
  const l = look || {};
  return h("div", { class: "swatches look", "aria-label": "Oyuncu paleti" }, ...["robeTop", "robeBottom", "skin", "gold", "hat", "beard", "eye", "wandGlow"].map((k) => h("i", { style: { background: col(l[k], "#000000") }, title: k })));
}
