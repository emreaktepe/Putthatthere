// Denge botu (YAKLAŞIK model; gerçek oyunun yerini tutmaz): node tools/balance-sim.mjs [--n=200] [--seed=1] [--dda=N] [--config=yol]
import { PROFILES, loadConfig, runMany } from "./balance/sim.mjs";
import { BAND, TARGET_P } from "./balance/targets.mjs";
import { campaignBalance } from "../js/config/balance.js";
import fs from "node:fs";

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const N = +arg("n", 200), seed = +arg("seed", 1), dda = +arg("dda", 0), cfgPath = arg("config", "data/game.config.json");
const A = loadConfig(cfgPath);
const model = Object.fromEntries(campaignBalance(JSON.parse(fs.readFileSync(cfgPath, "utf8"))).map((r) => [r.id, r]));
const pct = (x) => (x * 100).toFixed(0).padStart(3) + "%";
console.log(`YAKLAŞIK denge simülasyonu · N=${N} koşu/bot/bölüm · seed=${seed}${dda ? ` · DDA ${dda}. ölüm kademesi` : ""}`);
console.log("Uyarı: basitleştirilmiş 2B model; botlar insan değildir, kalibre edilmemiştir. Yalnızca sıralama/fark okunmalı.\n");
console.log("bölüm       hedef  model | yürüyen  orta   iyi | orta: ort.sn  ort.hasar  süre-aşımı | orta hedef bandında?");
const rows = A.LEVELS.map((L, i) => {
  const r = Object.fromEntries(Object.values(PROFILES).map((p) => [p.id, runMany(A, i, p, N, seed, { dda })]));
  const t = TARGET_P[L.id], ok = t === undefined ? "-" : Math.abs(r.orta.winRate - t) <= BAND ? "evet" : r.orta.winRate > t ? "kolay" : "zor";
  console.log(`${L.id.padEnd(11)} ${t === undefined ? "  - " : pct(t)}  ${model[L.id] ? pct(model[L.id].p) : "  -"} |  ${pct(r.yuruyen.winRate)}   ${pct(r.orta.winRate)}  ${pct(r.iyi.winRate)} |  ${r.orta.avgSec.toFixed(0).padStart(7)} ${r.orta.avgDmg.toFixed(1).padStart(10)} ${pct(r.orta.timeoutRate).padStart(11)} | ${ok}`);
  return { id: L.id, ...r };
});
if (process.argv.includes("--json")) console.log(JSON.stringify(rows));
