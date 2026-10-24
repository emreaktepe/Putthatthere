// Şema sürüm yükseltme zinciri (n -> n+1). Saf fonksiyonlar, girdiyi değiştirmez.
// Kural: alan yeniden adlandırma / zorunlu alan ekleme = sürüm artışı + buraya migration + tests/fixtures/config.v<n>.json.
// Yeni İSTEĞE BAĞLI alan eklemek sürüm artışı gerektirmez.

import { CONFIG_SCHEMA_VERSION } from "./schema.js";

export const MIGRATIONS = {
  // 1: (cfg) => ({ ...cfg, meta: { ...cfg.meta, schemaVersion: 2 } }),   // örnek: v1 -> v2
};

const copy = (v) => JSON.parse(JSON.stringify(v));

// -> { config, from, to, error? }. Bilinmeyen/ileri sürümde config aynen döner; validate() E_VERSION üretir.
export function migrate(config, migrations = MIGRATIONS, target = CONFIG_SCHEMA_VERSION) {
  const from = config && config.meta && config.meta.schemaVersion;
  if (!Number.isInteger(from) || from >= target) return { config, from, to: from };
  let cur = copy(config), v = from;
  while (v < target) {
    const fn = migrations[v];
    if (!fn) return { config, from, to: v, error: `Şema ${v} -> ${v + 1} için migration yok` };
    cur = fn(cur);
    v++;
  }
  return { config: cur, from, to: v };
}
