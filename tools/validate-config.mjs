// Komut satırı doğrulayıcı: node tools/validate-config.mjs [data/game.config.json] [--lenient]
// Çıkış kodu: hata varsa 1 (CI'da deploy öncesi kullanılır), yalnız uyarı varsa 0.
import fs from "node:fs";
import { validate, formatIssue } from "../js/config/validate.js";
import { migrate } from "../js/config/migrate.js";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) || "data/game.config.json";
let raw;
try { raw = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error(`[HATA] ${file} okunamadı: ${e.message}`); process.exit(1); }
const m = migrate(raw);
if (m.error) { console.error("[HATA] " + m.error); process.exit(1); }
const r = validate(m.config, { mode: args.includes("--lenient") ? "lenient" : "strict" });
for (const i of [...r.errors, ...r.warnings]) console.log(formatIssue(i, m.config));
console.log(`${file}: ${r.errors.length} hata, ${r.warnings.length} uyarı`);
process.exit(r.errors.length ? 1 : 0);
