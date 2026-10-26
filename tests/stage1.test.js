// Aşama 1: DDA, hasar yuvarlama, doğma mesafesi, ayarlar, telemetri, denge modeli, W_BALANCE, denge botu (seed).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DDA_TIERS, DDA_Z_FLOOR, approxZMul, ddaFor, recordDeath, resetLevel, scaledEvery, scaledStart } from "../js/game/dda.js";
import { rollDamage } from "../js/game/damage.js";
import { SPAWN_MIN_DIST, effectiveCap, pickSpawnPoint } from "../js/game/spawnmath.js";
import { DEFAULT_SETTINGS, SETTINGS_KEY, readSettings, writeSettings } from "../js/core/settings.js";
import { MAX_ATTEMPTS, MAX_BYTES, TELEMETRY_KEY, emptyTelemetry, loadTelemetry, recordAttempt, sanitizeTelemetry, saveTelemetry, summarize } from "../js/core/telemetry.js";
import { balanceIssues, campaignBalance, enemyTP, passProb, zForProb } from "../js/config/balance.js";
import { validate } from "../js/config/validate.js";
import { PROFILES, loadConfig, runMany, simulate } from "../tools/balance/sim.mjs";
import { TARGET_P } from "../tools/balance/targets.mjs";

const cfg = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test("DDA: kademeler, sıfırlama, kapalıyken yardım yok, zemin", () => {
  assert.equal(ddaFor(0).tier, 0); assert.equal(ddaFor(1).tier, 0);
  assert.equal(ddaFor(2).spawnMul, 0.9); assert.equal(ddaFor(3).bonusHp, 1); assert.equal(ddaFor(3).tier, 2);
  const t4 = ddaFor(9); assert.equal(t4.tier, 3); assert.ok(t4.startShield); assert.equal(t4.timeMul, 1.2);
  assert.equal(ddaFor(5, false).tier, 0, "anahtar kapalı");
  let c = recordDeath(recordDeath({}, "a"), "a"); assert.equal(c.a, 2); c = resetLevel(c, "a"); assert.equal(c.a, undefined);
  for (const t of DDA_TIERS) assert.ok(approxZMul(t) >= DDA_Z_FLOOR, "zorluk zemini");
  assert.equal(scaledEvery(6, 0.8), 7.5);
  assert.deepEqual(scaledStart({ ghost: 4, knight: 1, bat: 1 }, 0.65, (k) => k === "knight"), { ghost: 3, knight: 1, bat: 1 });
});

test("hasar yuvarlama: +%25 her 4. vuruşta +1; tamsayı çarpan ve ondalık taban etkilenmez", () => {
  const st = { carry: 0 }; const seq = Array.from({ length: 8 }, () => rollDamage(1, 1.25, st));
  assert.deepEqual(seq, [1, 1, 1, 2, 1, 1, 1, 2]);
  assert.equal(seq.reduce((a, b) => a + b), 10);
  assert.equal(rollDamage(1, 1, { carry: 0 }), 1); assert.equal(rollDamage(0.5, 2, { carry: 0 }), 1);
});

test("doğma noktası: oyuncudan >= 8 birim, halka üzerinde; durgunluk baskısı yalnız kristal bölümünde", () => {
  let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (const p of [{ x: 0, z: 0 }, { x: 13.5, z: 0 }, { x: -13.5, z: 13.5 }, { x: 0, z: -13.5 }]) {
    for (let i = 0; i < 500; i++) { const q = pickSpawnPoint(p, rnd, 14); assert.ok(Math.hypot(q.x - p.x, q.z - p.z) >= SPAWN_MIN_DIST - 1e-9); assert.ok(Math.abs(Math.hypot(q.x, q.z) - 14) < 1e-9); }
  }
  assert.ok(Math.abs(pickSpawnPoint({ x: 13.5, z: 0 }, () => 0, 14).x - 13.5) >= 8, "yedek yol");
  assert.equal(effectiveCap(6, "crystal", 17), 8); assert.equal(effectiveCap(6, "crystal", 999), 10); assert.equal(effectiveCap(6, "totem", 99), 6);
});

test("ayarlar: varsayılan yardım açık; yaz/oku; bozuk değer varsayılana döner", () => {
  const st = mem();
  assert.deepEqual(readSettings(st), DEFAULT_SETTINGS);
  writeSettings(st, { dda: false }); assert.equal(readSettings(st).dda, false);
  st.setItem(SETTINGS_KEY, "{bozuk"); assert.equal(readSettings(st).dda, true);
  assert.equal(readSettings(null).dda, true);
});

test("telemetri: kayıt, özet, 20 deneme sınırı, boyut < 50 KB, bozuk girdi, depolama hatası sessiz", () => {
  let t = emptyTelemetry();
  t = recordAttempt(t, "forest", { r: "d", sec: 20, hits: 3, first: true, timeout: true });
  t = recordAttempt(t, "forest", { r: "w", sec: 60, hits: 1 });
  t = recordAttempt(t, "forest", { r: "q", sec: 5, hits: 0 });
  const row = summarize(t, ["forest", "cave"]);
  assert.equal(row[0].attempts, 3); assert.equal(row[0].passRate, 0.5); assert.equal(row[0].avgWinSec, 60); assert.equal(row[0].timeouts, 1); assert.equal(row[0].firstTryRate, 0);
  assert.equal(row[1].attempts, 0); assert.equal(row[1].passRate, null);
  for (let i = 0; i < 100; i++) t = recordAttempt(t, "cave", { r: i % 2 ? "w" : "d", sec: 30, hits: 2 });
  assert.equal(t.levels.cave.recent.length, MAX_ATTEMPTS); assert.equal(t.levels.cave.att, 100);
  for (let l = 0; l < 40; l++) for (let i = 0; i < 30; i++) t = recordAttempt(t, "b" + String(l).padStart(2, "0"), { r: "w", sec: 99, hits: 9, dda: 3 });
  assert.ok(JSON.stringify(t).length < MAX_BYTES);
  assert.equal(sanitizeTelemetry({ v: 1, levels: { "X!": {}, ok: { att: "9", recent: [{ r: "z" }] } } }).levels.ok.att, 0);
  assert.equal(sanitizeTelemetry({ v: 1, levels: { "X!": {} } }).levels["X!"], undefined);
  const st = mem(); assert.ok(saveTelemetry(t, st)); assert.equal(loadTelemetry(st).levels.forest.win, 1); assert.ok(st.getItem(TELEMETRY_KEY));
  assert.equal(saveTelemetry(t, { setItem() { throw new Error("kota"); } }), false);
  assert.deepEqual(loadTelemetry({ getItem() { throw new Error("x"); } }), emptyTelemetry());
});

test("denge modeli: TP değerleri plan tablosuyla, p(Z) tersinir", () => {
  assert.equal(enemyTP(cfg.enemies.bat), 1.7); assert.equal(enemyTP(cfg.enemies.golem), 1.5); assert.equal(enemyTP(cfg.enemies.knight), 8.4);
  assert.ok(Math.abs(passProb(zForProb(0.7)) - 0.7) < 1e-9);
});

test("Aşama 1 dengesi: Z tırmanışı düzgün (monoton, sıçrama <= x1.35, sınav hariç), final zirve, model p hedefe +-10 puan", () => {
  const rows = campaignBalance(cfg); assert.equal(rows.length, 9);
  const NEFES = new Set(); // bu 9 bölümlü kampanyada nefes bölümü yok; w?-01/06 nefesleri yeni bölümlerle gelecek (plan §4.6)
  for (let i = 1; i < rows.length; i++) {
    if (NEFES.has(rows[i].id)) continue;
    assert.ok(rows[i].Z >= rows[i - 1].Z, `${rows[i].id} Z düşmemeli`);
    if (!["miniboss", "boss"].includes(rows[i].objective)) assert.ok(rows[i].Z / rows[i - 1].Z <= 1.35, `${rows[i].id} sıçrama`);
  }
  assert.equal(Math.max(...rows.map((r) => r.Z)), rows[8].Z, "final boss zirve");
  assert.ok(rows[1].Z / rows[0].Z < 1.3, "eski x2.3 sıçrama giderildi");
  for (const r of rows) { assert.ok(Math.abs(r.p - TARGET_P[r.id]) <= 0.1, `${r.id} model p ${r.p} hedef ${TARGET_P[r.id]}`); assert.ok(r.p >= 0.3); }
  assert.deepEqual(balanceIssues(cfg), []);
});

test("W_BALANCE kuralları: süre payı, mobil cap, başlangıç yoğunluğu, sıçrama, perk sınırı", () => {
  const w = (mut) => { const c = JSON.parse(JSON.stringify(cfg)); mut(c); return validate(c).warnings.filter((x) => x.code === "W_BALANCE"); };
  assert.ok(w((c) => { c.levels.forest.time = 40; }).some((x) => x.path === "/levels/forest/goal"), "süre baskısı fazla");
  assert.ok(w((c) => { c.levels.forest.time = 300; }).some((x) => x.path === "/levels/forest/goal"), "gevşek");
  assert.ok(w((c) => { c.levels.forest.cap = 13; }).some((x) => x.path === "/levels/forest/cap"));
  assert.ok(w((c) => { c.levels.forest.start = { ghost: 10 }; }).some((x) => x.path === "/levels/forest/start"));
  assert.ok(w((c) => { c.levels.cave.start = { ghost: 4, bat: 4, golem: 3 }; c.levels.cave.cap = 12; }).some((x) => /sıçraması/.test(x.message)));
  assert.ok(w((c) => { delete c.perks.power.maxStacks; }).some((x) => x.path === "/perks/power/maxStacks"));
});

test("config: 5 stat perk'inde maxStacks var; bölüm ipuçları en çok 2 satır; DDA metinleri var", () => {
  for (const [id, n] of Object.entries({ speed: 3, power: 5, haste: 4, magnet: 2, stone: 3 })) assert.equal(cfg.perks[id].maxStacks, n);
  for (const L of Object.values(cfg.levels)) assert.ok(!L.hint || (L.hint.length <= 2 && L.hint.every((t) => t.length <= 100)));
  for (const k of ["notice2", "notice3", "notice4"]) assert.ok(cfg.strings.dda[k].length > 20);
});

test("denge botu: aynı seed aynı sonuç; yürüyen bot ateş etmez (totem/boss kazanılamaz)", () => {
  const A = loadConfig();
  assert.deepEqual(runMany(A, 1, PROFILES.orta, 20, 5), runMany(A, 1, PROFILES.orta, 20, 5));
  assert.deepEqual(simulate(A, 3, PROFILES.iyi, 99), simulate(A, 3, PROFILES.iyi, 99));
  assert.equal(runMany(A, 5, PROFILES.yuruyen, 10, 1).winRate, 0, "totem: ateşsiz kazanılmaz");
  assert.equal(runMany(A, 8, PROFILES.yuruyen, 10, 1).winRate, 0, "boss");
  assert.ok(runMany(A, 0, PROFILES.orta, 20, 1).winRate > 0.5);
});
