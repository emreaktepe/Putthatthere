const STORAGE_KEY = "ptt-lang";
const SUPPORTED = ["tr", "en"];
const DEFAULT_LANG = "tr";

let currentLang = DEFAULT_LANG;
let strings = {};

function readStoredLang() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredLang(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* localStorage unavailable, ignore */
  }
}

async function loadStrings(lang) {
  const res = await fetch(`data/strings.${lang}.json`);
  if (!res.ok) throw new Error(`Failed to load strings.${lang}.json`);
  return res.json();
}

export async function initI18n() {
  currentLang = readStoredLang() || DEFAULT_LANG;
  strings = await loadStrings(currentLang);
  return currentLang;
}

export async function setLang(lang) {
  if (!SUPPORTED.includes(lang) || lang === currentLang) return currentLang;
  strings = await loadStrings(lang);
  currentLang = lang;
  writeStoredLang(lang);
  return currentLang;
}

export function getLang() {
  return currentLang;
}

export function t(key, vars) {
  let str = strings[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}

export function field(scene, baseKey) {
  return scene[`${baseKey}_${currentLang}`] ?? scene[`${baseKey}_${DEFAULT_LANG}`] ?? "";
}
