// Konfigürasyonun başvurabileceği, KODDA tanımlı adların tek listesi (enum kayıt defteri).
// Oyun koduna yeni davranış/model/dekor eklenince buraya da eklenir; admin formu seçenekleri buradan alır.
// DOM ve Three.js'e dokunmaz (Node'da çalışır).

export const ID_RE = /^[a-z][a-z0-9_]{1,23}$/;
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export const FORBIDDEN_KEYS = ["__proto__", "constructor", "prototype"];
export const MAX_CONFIG_BYTES = 1024 * 1024;
export const WEATHER_MAX = 240; // render/scene.js WMAX ile aynı
export const ARENA = 14; // geometriye bağlı; konfigürasyondan değişmez

// düşman yapay zekâ durum makineleri (js/game/ai.js)
export const AI_KINDS = ["chase", "ranged", "charge", "bomber", "support", "static", "knight", "boss"];
// düşman geometri üreticileri (js/render/enemies.js BUILD) ve ses etiketi (kill:<model>)
export const MODEL_KINDS = ["ghost", "bat", "golem", "archer", "wolf", "ember", "priest", "totem", "knight", "boss"];
// zemin doku türleri (js/render/themes.js drawFloor)
export const FLOOR_KINDS = ["grass", "wet", "flag", "dirt", "snow", "ash", "facet", "bone", "tile"];
// dekor üreticileri (js/render/scenery.js SCENERY)
export const SCENERY_KINDS = ["forest", "cave", "ruins", "graveyard", "ice", "village", "crystals", "tower", "castle"];
export const OBJECTIVES = ["crystal", "survive", "totem", "miniboss", "boss"];
export const ROLES = ["player", "ally", "villain", "npc"];
export const WAVES = ["sine", "triangle", "square", "sawtooth"];
export const LABEL_POS = ["below", "above", "left", "right"];
export const MAP_PRESETS = ["night"];

// görsel yolu: yalnızca assets/art/ altındaki .webp (harici URL, "..", data:, javascript: biçimleri eşleşmez)
export const ART_RE = /^assets\/art\/[a-z0-9-]+\.webp$/;

// arayüz ikonu geçersiz kılmaları (config ui.icons anahtarı -> beklenen görsel dosya adı gövdesi: assets/art/ui-<ad>.webp)
export const UI_ICON_FILES = { hourglass: "sure", crystal: "kristal", star: "puan", target: "hedef", lock: "kilit", check: "onay", heartFull: "kalp-dolu", heartEmpty: "kalp-bos", shield: "kalkan", sound: "ses-acik", mute: "ses-kapali", camera: "kamera", fire: "ates", admin: "yonetim" };
export const UI_ICON_KEYS = Object.keys(UI_ICON_FILES);

// yetenekler: kimlik = davranış (js/game/abilities.js). params: ad -> [min, max, varsayılan]
export const ABILITY_KINDS = {
  shield: { key: "Q", code: "KeyQ", params: { duration: [0.5, 60, 8] } },
  blink: { key: "E", code: "KeyE", params: { dist: [1, 15, 5], iframes: [0, 3, 0.4] } },
  timeslow: { key: "R", code: "KeyR", params: { duration: [0.5, 30, 3], factor: [0.1, 1, 0.4] } },
};
export const ABILITY_KEYS = [["Q", "KeyQ"], ["E", "KeyE"], ["R", "KeyR"]]; // abilityOrder sırasına göre

// perk etkileri (js/game/perks.js)
export const PERK_STATS = {
  add: ["maxHp", "magnet", "echo", "rain"],
  mul: ["speedMul", "dmgMul", "cdMul"],
  flag: ["vampire", "pierce", "piril", "stoneLevels"],
};

// silah tür blokları (en fazla biri); js/game/weapons.js
export const WEAPON_BLOCKS = ["spread", "chain", "cloud", "meteor", "nova"];

// iç içe enum listelerine ad ile erişim (schema.js `enm("AI_KINDS")`)
export const ENUMS = { AI_KINDS, MODEL_KINDS, FLOOR_KINDS, SCENERY_KINDS, OBJECTIVES, ROLES, WAVES, LABEL_POS, MAP_PRESETS };
