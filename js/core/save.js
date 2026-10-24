// KAYIT MODÜLÜ İÇİN AYRILMIŞ YER (2. aşama: docs/mimari §7.3, Adım 7). Şimdilik davranış YOK: oyun ilerlemesi saklanmaz.
// Anahtar: buyucu_save (ses tercihi buyucu_ses ayrıdır). Şema v1: { v, configHash, updatedAt, completed[], currentLevel, run, best }.
// Bölümler dizin yerine kimlikle (LEVEL_IDS) adreslenecek; S.level dizini yüklemede currentLevel kimliğinden hesaplanır.

export const SAVE_KEY = "buyucu_save";
export const SAVE_SCHEMA_VERSION = 1;
export const loadSave = () => null;
export const writeSave = () => false;
export const clearSave = () => {};
