// Oyuncu ayarları (localStorage "buyucu_ayar", JSON { v:1, dda:boolean }). Saf: depolama parametre olarak verilir; Node'da test edilir.
// buyucu_ses ve buyucu_kalite ayrı anahtarlardır; bu anahtar yalnızca yeni ayarlar içindir. Bozuk/eksik değer -> varsayılan (yardım AÇIK).
export const SETTINGS_KEY = "buyucu_ayar";
export const DEFAULT_SETTINGS = { v: 1, dda: true };

export function normalizeSettings(raw) {
  const ok = raw !== null && typeof raw === "object" && !Array.isArray(raw);
  return { v: 1, dda: ok && typeof raw.dda === "boolean" ? raw.dda : DEFAULT_SETTINGS.dda };
}
export function readSettings(storage) {
  try {
    const t = storage && storage.getItem(SETTINGS_KEY);
    if (!t || t.length > 2000) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(t));
  } catch (e) { return { ...DEFAULT_SETTINGS }; }
}
export function writeSettings(storage, s) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(s))); return true; } catch (e) { return false; } // özel mod / kota
}
