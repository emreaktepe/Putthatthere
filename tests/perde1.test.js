// Perde I: kayıt göçü (v1 -> v2, eski bölüm kimlikleri -> w1-xx), telemetri göçü, yıldız mantığı ve kampanya zinciri.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SAVE_KEY, BACKUP_KEY, SAVE_SCHEMA_VERSION, loadSave, writeSave } from "../js/core/save.js";
import { LEGACY_LEVEL_IDS, mapIdKeys, mapIdList, newLevelId } from "../js/core/legacyids.js";
import { TELEMETRY_KEY, loadTelemetry, recordAttempt, emptyTelemetry, saveTelemetry } from "../js/core/telemetry.js";
import { starsFor, displayStars, starText, star2Hits } from "../js/game/stars.js";
import { recordBest, effectiveEdges, levelStatuses } from "../js/game/progress.js";
import { validate } from "../js/config/validate.js";
import { adapt } from "../js/config/adapt.js";

const cfg = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const A = adapt(validate(cfg).sanitized);
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const defaults = { level: 0, hp: 3, maxHp: 3, speedMul: 1, dmgMul: 1, cdMul: 1, magnet: 0, unlocked: ["fire"], weapon: "fire", score: 0, abilities: [], kills: 0, echo: 0, rain: 0, pierce: false, vampire: false, piril: false, stoneLevels: 0, perkCount: {}, lastPerk: "" };
const ctx = { levelIds: A.LEVEL_IDS, weaponIds: A.WEAPON_ORDER, abilityIds: A.ABILITY_ORDER, defaults };
const OLD = ["forest", "cave", "golems", "graveyard", "pass", "village", "crystals", "tower", "castle"];
// eski (v1) kayıt şekli: bölüm kimlikleri eski, bölüm dizini run.level
const v1 = (completed, current, extra = {}) => ({ v: 1, configHash: "abc", updatedAt: 5, completed, currentLevel: current,
  run: { ...defaults, level: OLD.indexOf(current), score: 1234, hp: 2, maxHp: 4, unlocked: ["fire", "frost", "arcane"], weapon: "arcane", abilities: ["shield"], perkCount: { hp: 1, speed: 2 }, lastPerk: "speed", ...extra },
  best: { score: 1500, levels: Object.fromEntries(completed.map((id, i) => [id, { score: 100 + i, time: 10 + i }])) } });

test("kimlik haritası: 9 eski kimlik -> yeni kimlik; yeni kimlikler değişmez (idempotent)", () => {
  assert.deepEqual(Object.keys(LEGACY_LEVEL_IDS).sort(), [...OLD].sort());
  for (const o of OLD) assert.ok(A.LEVEL_IDS.includes(LEGACY_LEVEL_IDS[o]), o);
  assert.equal(new Set(Object.values(LEGACY_LEVEL_IDS)).size, 9);
  assert.equal(newLevelId("w1-01"), "w1-01"); assert.equal(newLevelId("yok"), "yok"); assert.equal(newLevelId(5), 5);
  assert.deepEqual(mapIdList(mapIdList(OLD)), mapIdList(OLD));
  assert.deepEqual(mapIdList(["forest", "w1-01", "cave"]), ["w1-01", "w1-02"], "yinelenen atılır");
  assert.deepEqual(Object.keys(mapIdKeys({ forest: 1, tower: 2 })), ["w1-01", "w1-09"]);
});

test("göç: kayıt yok -> none; yedek yazılmaz", () => {
  const st = mem();
  assert.equal(loadSave(ctx, st).status, "none");
  assert.equal(st.getItem(BACKUP_KEY), null);
});

test("göç: kısmi v1 kaydı (3 bölüm) -> yeni kimlikler, tüm alanlar korunur, v2 yazılır, yedek alınır", () => {
  const st = mem(), raw = v1(["forest", "cave", "golems"], "graveyard");
  st.setItem(SAVE_KEY, JSON.stringify(raw));
  const r = loadSave(ctx, st);
  assert.equal(r.status, "ok");
  assert.deepEqual(r.save.completed, ["w1-01", "w1-02", "w1-03"]);
  assert.equal(r.save.currentLevel, "w1-05");
  assert.equal(r.save.run.level, A.LEVEL_IDS.indexOf("w1-05"), "bölüm dizini kimlikten yeniden hesaplanır");
  for (const k of ["score", "hp", "maxHp", "weapon", "lastPerk"]) assert.equal(r.save.run[k], raw.run[k], k);
  assert.deepEqual(r.save.run.unlocked, ["fire", "frost", "arcane"]); assert.deepEqual(r.save.run.abilities, ["shield"]); assert.deepEqual(r.save.run.perkCount, { hp: 1, speed: 2 });
  assert.deepEqual(Object.keys(r.save.best.levels), ["w1-01", "w1-02", "w1-03"]); assert.equal(r.save.best.score, 1500); assert.deepEqual(r.save.best.levels["w1-02"], { score: 101, time: 11 });
  const disk = JSON.parse(st.getItem(SAVE_KEY));
  assert.equal(disk.v, SAVE_SCHEMA_VERSION); assert.deepEqual(disk.completed, r.save.completed);
  assert.equal(st.getItem(BACKUP_KEY), JSON.stringify(raw), "eski ham kayıt yedeklendi");
});

test("göç: 9 bölümü tamamlanmış tam kayıt -> ilerleme kaybolmaz; yeni bölümler (w1-04, w1-06) açık ve tamamlanmamış", () => {
  const st = mem(), raw = v1(OLD, "castle");
  st.setItem(SAVE_KEY, JSON.stringify(raw));
  const r = loadSave(ctx, st);
  assert.equal(r.status, "ok");
  assert.equal(r.save.completed.length, 9);
  for (const o of OLD) assert.ok(r.save.completed.includes(LEGACY_LEVEL_IDS[o]), o);
  assert.equal(Object.keys(r.save.best.levels).length, 9);
  const stt = levelStatuses(A.LEVEL_IDS, effectiveEdges(A.LEVEL_IDS, A.CAMPAIGN.edges), A.CAMPAIGN.start, r.save.completed);
  assert.equal(stt["w1-04"], "available"); assert.equal(stt["w1-06"], "available"); assert.equal(stt["w3-09"], "completed");
  assert.equal(r.save.currentLevel, "w1-04", "sıradaki tamamlanmamış bölüm");
});

test("göç: idempotent (ikinci okuma aynı sonuç, yedek ezilmez)", () => {
  const st = mem(), raw = v1(["forest", "cave"], "golems");
  st.setItem(SAVE_KEY, JSON.stringify(raw));
  const a = loadSave(ctx, st), backup = st.getItem(BACKUP_KEY);
  const b = loadSave(ctx, st);
  assert.deepEqual(b.save, a.save);
  assert.equal(st.getItem(BACKUP_KEY), backup);
  assert.deepEqual(b.notices.filter((n) => /göç/.test(n)), [], "ikinci okumada göç yok");
  st.setItem(SAVE_KEY, JSON.stringify(v1(["forest"], "cave")));
  loadSave(ctx, st);
  assert.equal(st.getItem(BACKUP_KEY), backup, "yedek ilk eski kaydı korur");
});

test("göç: bozuk JSON / eksik alan / yanlış tür -> çökmez; ham metin yedeklenir", () => {
  for (const bad of ["{bozuk", "null", "[]", JSON.stringify({ v: 1 }), JSON.stringify({ v: 1, run: 5 }), JSON.stringify({ v: "1", run: {} }), "xxxxxxxxxx"]) {
    const st = mem(); st.setItem(SAVE_KEY, bad);
    const r = loadSave(ctx, st);
    assert.equal(r.status, "corrupt", bad.slice(0, 20));
  }
  const st = mem(); st.setItem(SAVE_KEY, "{bozuk"); loadSave(ctx, st);
  assert.equal(st.getItem(BACKUP_KEY), "{bozuk");
  // v1 ama içi çöp: completed dizi değil, bölüm kimliği sayı, best.levels dizi
  const st2 = mem(); st2.setItem(SAVE_KEY, JSON.stringify({ v: 1, completed: "forest", currentLevel: 7, run: { ...defaults }, best: { levels: [1, 2] } }));
  const r2 = loadSave(ctx, st2);
  assert.equal(r2.status, "ok"); assert.deepEqual(r2.save.completed, []); assert.equal(r2.save.currentLevel, "w1-01");
  // depolama yazma hatası (kota): göç bellekte yine başarılı
  const q = mem(); q.setItem(SAVE_KEY, JSON.stringify(v1(["forest"], "cave")));
  const quota = { getItem: q.getItem, setItem() { throw new Error("kota"); }, removeItem: q.removeItem };
  assert.equal(loadSave(ctx, quota).status, "ok");
});

test("göç: eski + yeni kimlik aynı kayıtta -> en iyi puan ve süre birleşir", () => {
  const st = mem(), raw = v1(["forest"], "cave");
  raw.best.levels["w1-01"] = { score: 999, time: 3 };
  st.setItem(SAVE_KEY, JSON.stringify(raw));
  const r = loadSave(ctx, st);
  assert.deepEqual(r.save.best.levels["w1-01"], { score: 999, time: 10 });
});

test("telemetri göçü: eski bölüm kimlikleri yeni kimliğe taşınır, sayaçlar kaybolmaz, idempotent", () => {
  const st = mem();
  let t = emptyTelemetry();
  t = recordAttempt(t, "forest", { r: "w", sec: 30, hits: 1, first: true });
  t = recordAttempt(t, "tower", { r: "d", sec: 20, hits: 3 });
  assert.ok(saveTelemetry(t, st));
  const a = loadTelemetry(st);
  assert.deepEqual(Object.keys(a.levels).sort(), ["w1-01", "w1-09"]);
  assert.equal(a.levels["w1-01"].win, 1); assert.equal(a.levels["w1-09"].die, 1);
  assert.ok(saveTelemetry(a, st));
  assert.deepEqual(loadTelemetry(st), a);
  assert.ok(st.getItem(TELEMETRY_KEY));
});

test("yıldız mantığı: ★1 bitir, ★2 en çok 2 vuruş (boss/mini-boss 3), ★3 hasarsız; alıştırmada 0", () => {
  assert.equal(starsFor({ objective: "crystal", hits: 0 }), 3);
  assert.equal(starsFor({ objective: "crystal", hits: 1 }), 2); assert.equal(starsFor({ objective: "crystal", hits: 2 }), 2);
  assert.equal(starsFor({ objective: "crystal", hits: 3 }), 1); assert.equal(starsFor({ objective: "survive", hits: 40 }), 1);
  assert.equal(starsFor({ objective: "miniboss", hits: 3 }), 2); assert.equal(starsFor({ objective: "boss", hits: 4 }), 1);
  assert.equal(star2Hits("totem"), 2); assert.equal(star2Hits("boss"), 3);
  assert.equal(starsFor({ objective: "crystal", hits: 0, practice: true }), 0);
  assert.equal(starsFor({ hits: -5 }), 3); assert.equal(starsFor({ hits: NaN }), 3); assert.equal(starsFor(), 3);
  assert.equal(displayStars(undefined, true), 1, "eski kayıtta tamamlanmış bölüm en az ★1"); assert.equal(displayStars({ stars: 2 }, true), 2);
  assert.equal(displayStars(undefined, false), 0); assert.equal(displayStars({ stars: 9 }, true), 3);
  assert.equal(starText(2), "★★☆"); assert.equal(starText(0), "☆☆☆"); assert.equal(starText(7), "★★★");
});

test("yıldız kaydı: en iyi yıldız yalnız artar; verilmezse dokunulmaz; kayıt gidiş-dönüşü ve bozuk değer süzülür", () => {
  let b = { score: 0, levels: {} };
  b = recordBest(b, "w1-01", { score: 100, time: 10, stars: 2 });
  b = recordBest(b, "w1-01", { score: 50, time: 5, stars: 1 });
  assert.equal(b.levels["w1-01"].stars, 2);
  b = recordBest(b, "w1-01", { score: 50, time: 5 });
  assert.equal(b.levels["w1-01"].stars, 2, "alıştırma (stars verilmez) yıldızı değiştirmez");
  b = recordBest(b, "w1-01", { score: 50, time: 5, stars: 3 });
  assert.equal(b.levels["w1-01"].stars, 3);
  assert.equal(recordBest({ score: 0, levels: {} }, "w1-02", { score: 1, time: 1, stars: 0 }).levels["w1-02"].stars, undefined, "0 yıldız alanı yazılmaz");
  const st = mem();
  assert.ok(writeSave({ v: 2, configHash: "", updatedAt: 1, completed: ["w1-01"], currentLevel: "w1-02", run: { ...defaults }, best: { score: 10, levels: { "w1-01": { score: 5, time: 5, stars: 3 }, "w1-02": { score: 1, time: 1, stars: 99 }, "w1-03": { score: 1, time: 1, stars: "x" } } } }, st));
  const r = loadSave(ctx, st);
  assert.equal(r.save.best.levels["w1-01"].stars, 3); assert.equal(r.save.best.levels["w1-02"].stars, 3); assert.equal(r.save.best.levels["w1-03"].stars, undefined);
});

test("kampanya zinciri: Perde I tam (w1-01..09) ardından geçici köprü; final boss son ve ulaşılabilir; sırayla açılır", () => {
  assert.deepEqual(A.LEVEL_IDS.slice(0, 9), ["w1-01", "w1-02", "w1-03", "w1-04", "w1-05", "w1-06", "w1-07", "w1-08", "w1-09"]);
  assert.equal(A.LEVEL_IDS[A.LEVEL_IDS.length - 1], "w3-09"); assert.equal(A.LEVELS[A.LEVELS.length - 1].objective, "boss");
  const edges = effectiveEdges(A.LEVEL_IDS, A.CAMPAIGN.edges);
  let done = []; for (const id of A.LEVEL_IDS) { const s = levelStatuses(A.LEVEL_IDS, edges, A.CAMPAIGN.start, done); assert.equal(s[id], "available", id + " sırayla açılır"); done = [...done, id]; }
  assert.ok(A.LEVELS.every((L) => L.map && L.map.x > 0 && L.map.y > 0));
  for (let i = 0; i < A.LEVELS.length; i++) for (let j = i + 1; j < A.LEVELS.length; j++) assert.ok(Math.hypot(A.LEVELS[i].map.x - A.LEVELS[j].map.x, A.LEVELS[i].map.y - A.LEVELS[j].map.y) > 90, `${A.LEVEL_IDS[i]}-${A.LEVEL_IDS[j]} düğümleri binmiyor`);
  // her büyü/yetenek ödül olarak final bosa kadar kazanılır
  const got = new Set(["fire"]), ab = new Set(); for (const L of A.LEVELS) { if (L.reward) got.add(L.reward); if (L.ability) ab.add(L.ability); }
  assert.deepEqual([...got].sort(), [...A.WEAPON_ORDER].sort()); assert.deepEqual([...ab].sort(), [...A.ABILITY_ORDER].sort());
});

test("Perde I metinleri: kanca <= 120, hedef metni <= 60, Mira adı geçmez, her bölümde perde adı/kanca/intro/outro var", () => {
  const p1 = A.LEVELS.slice(0, 9);
  for (const L of p1) {
    assert.ok(L.hook && L.hook.length <= 120, L.id + " hook"); assert.equal(L.world, "Perde I · Uyanış", L.id + " world");
    assert.ok(L.intro.length >= 1 && L.outro.length >= 1);
    for (const l of [...L.intro, ...L.outro]) assert.ok(l.text.length <= 240);
    if (L.objectiveText) assert.ok(L.objectiveText.length <= 60);
  }
  const all = JSON.stringify([p1, A.STRINGS.deathLines, A.STRINGS.tagline, A.CHARACTERS]);
  assert.ok(!/Mira/.test(all), "Mira kanonu: w2-06 öncesi geçmez");
  assert.ok(A.STRINGS.deathLines.length >= 12);
  assert.ok(/\{levelCount\}/.test(A.STRINGS.tagline));
});
