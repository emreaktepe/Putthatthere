// Savaş sistemi Aşama B (docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §4.1, §8): düşman becerileri (saf mantık), config kapıları, öğretim sırası,
// doğrulayıcı, denge botu. Sayılar VARSAYIMDIR.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SKILLS, SKILL_IDS, SKILL_BY_MODEL, WARN_SKILLS, MAX_WARN_MARKS, auraMul, canTrigger, emberChainVictims, initSkill, isOpen, isReviveCandidate, newSkills, onWindupEnd, pickReviveTarget, reviveAllowed, skillDamageMul, skillFor, skillSteps, tickCd, veilBlocks, veilStep, volleyPoints, warnBudgetOk } from "../js/game/skills.js";
import { SKILL_IDS as REG_IDS } from "../js/config/registry.js";
import { validate } from "../js/config/validate.js";
import { adapt } from "../js/config/adapt.js";
import { balanceIssues } from "../js/config/balance.js";
import { PROFILES, loadConfig, runMany } from "../tools/balance/sim.mjs";

const raw = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));
const idle = (id, cd = 0) => ({ ...initSkill(id, () => 0), cd });

test("beceri tablosu: 9 beceri, kayıt defteriyle aynı, her biri bir modele bağlı; uyarılı olanlar >= 0.6 sn", () => {
  assert.deepEqual([...SKILL_IDS].sort(), [...REG_IDS].sort());
  assert.equal(new Set(Object.values(SKILLS).map((s) => s.model)).size, 9, "model başına tek beceri");
  for (const id of WARN_SKILLS) assert.ok(SKILLS[id].warn >= 0.6, id + " uyarı süresi haksız kısa");
  assert.deepEqual(WARN_SKILLS.sort(), ["batDive", "howl", "leap", "quake", "revive", "volley"].sort());
  for (const m of Object.keys(SKILL_BY_MODEL)) assert.ok(raw.enemies[m], "config'te model var: " + m);
  // belge sayıları (§4.1)
  assert.equal(SKILLS.quake.warn, 1.0); assert.equal(SKILLS.quake.r, 3.2); assert.equal(SKILLS.quake.trigger, 4.5); assert.equal(SKILLS.quake.cd, 7);
  assert.equal(SKILLS.volley.warn, 1.2); assert.equal(SKILLS.volley.cd, 9); assert.equal(SKILLS.volley.r, 1.5); assert.equal(SKILLS.volley.count, 3);
  assert.equal(SKILLS.batDive.warn, 0.6); assert.equal(SKILLS.batDive.cd, 7); assert.equal(SKILLS.howl.warn, 0.9); assert.equal(SKILLS.howl.cd, 12);
  assert.equal(SKILLS.revive.warn, 1.5); assert.equal(SKILLS.revive.max, 2); assert.equal(SKILLS.aura.mul, 0.6); assert.equal(SKILLS.aura.r, 6);
  assert.equal(SKILLS.leap.dmg, 2); assert.equal(SKILLS.leap.warn, 0.9); assert.equal(SKILLS.leap.tiredMul, 1.5); assert.equal(SKILLS.leap.openMul, 1.3);
});

test("kapı: yalnızca bölümde listelenen beceri çalışır (skillFor)", () => {
  const ghost = { model: "ghost" };
  assert.equal(skillFor(ghost, ["veil"]), "veil");
  assert.equal(skillFor(ghost, ["quake"]), null);
  assert.equal(skillFor(ghost, undefined), null);
  assert.equal(skillFor({ model: "ember" }, ["veil", "emberChain"]), "emberChain");
  assert.equal(isOpen(["a"], "a"), true); assert.equal(isOpen(undefined, "a"), false);
});

test("tetikleyiciler: batDive (>=2 yarasa, 12 birim, Buz yavaşlatmışsa dalmaz), quake (<4.5), volley, howl, leap", () => {
  assert.equal(canTrigger("batDive", idle("batDive"), { dist: 8, allies: 2 }), true);
  assert.equal(canTrigger("batDive", idle("batDive"), { dist: 8, allies: 1 }), false, "tek yarasa dalmaz");
  assert.equal(canTrigger("batDive", idle("batDive"), { dist: 13, allies: 3 }), false, "12 birimden uzak");
  assert.equal(canTrigger("batDive", idle("batDive"), { dist: 8, allies: 3, slowed: true }), false, "Buz: yavaş yarasa dalamaz");
  assert.equal(canTrigger("quake", idle("quake"), { dist: 4.4 }), true);
  assert.equal(canTrigger("quake", idle("quake"), { dist: 4.6 }), false);
  assert.equal(canTrigger("volley", idle("volley"), { dist: 10 }), true);
  assert.equal(canTrigger("volley", idle("volley"), { dist: 10, slowed: true }), false, "Buz: yavaş okçu yağdırmaz");
  assert.equal(canTrigger("howl", idle("howl"), { dist: 5, allies: 2 }), true, ">= 2 kurt");
  assert.equal(canTrigger("howl", idle("howl"), { dist: 5, allies: 1, hpRatio: 0.4 }), true, "hp < %50");
  assert.equal(canTrigger("howl", idle("howl"), { dist: 5, allies: 1, hpRatio: 0.6 }), false);
  assert.equal(canTrigger("leap", idle("leap"), { dist: 6, hpRatio: 0.7 }), true);
  assert.equal(canTrigger("leap", idle("leap"), { dist: 6, hpRatio: 0.8 }), false, "hp < %75");
  assert.equal(canTrigger("leap", idle("leap"), { dist: 6, hpRatio: 0.5, wind: 0.5 }), false, "yere vurma hazırlığı sürerken zıplamaz");
  assert.equal(canTrigger("leap", idle("leap"), { dist: 6, hpRatio: 0.5, slamCd: 0.5 }), false, "şok hemen gelecekse zıplamaz");
  assert.equal(canTrigger("veil", idle("veil"), { dist: 5 }), false, "veil zamanlayıcı beceri değil");
});

test("bekleme: tetiklenmeden önce cd bitmeli; tickCd sıfırın altına inmez; durum idle değilse tetiklenmez", () => {
  const st = idle("quake", 7);
  assert.equal(canTrigger("quake", st, { dist: 3 }), false);
  tickCd(st, 6.9); assert.equal(canTrigger("quake", st, { dist: 3 }), false);
  tickCd(st, 0.2); assert.equal(st.cd, 0); assert.equal(canTrigger("quake", st, { dist: 3 }), true);
  st.state = "warn"; assert.equal(canTrigger("quake", st, { dist: 3 }), false);
  const a = initSkill("volley", () => 0), b = initSkill("volley", () => 1);
  assert.equal(a.cd, SKILLS.volley.cdInit[0]); assert.equal(b.cd, SKILLS.volley.cdInit[1]);
});

test("aynı anda en çok 3 uyarı işareti: volley 3 slot ister", () => {
  assert.equal(MAX_WARN_MARKS, 3);
  assert.equal(warnBudgetOk(0, 3), true); assert.equal(warnBudgetOk(1, 3), false); assert.equal(warnBudgetOk(2, 1), true); assert.equal(warnBudgetOk(3, 1), false);
  assert.equal(canTrigger("volley", idle("volley"), { dist: 9, active: 1 }), false);
  assert.equal(canTrigger("quake", idle("quake"), { dist: 3, active: 3 }), false);
  assert.equal(canTrigger("quake", idle("quake"), { dist: 3, active: 2 }), true);
});

test("uyarı bitince iptal kuralları: sahip öldüyse hiçbiri; howl vurulunca; batDive yavaşlatılmışsa; diğerleri vurulmaya rağmen sürer", () => {
  for (const id of SKILL_IDS) assert.equal(onWindupEnd(id, { ownerAlive: false, hit: false, slowed: false }).fire, false, id + ": ölü sahip");
  assert.equal(onWindupEnd("howl", { ownerAlive: true, hit: true }).fire, false);
  assert.equal(onWindupEnd("howl", { ownerAlive: true, hit: false }).fire, true);
  assert.equal(onWindupEnd("batDive", { ownerAlive: true, slowed: true }).fire, false);
  assert.equal(onWindupEnd("batDive", { ownerAlive: true, slowed: false }).fire, true);
  for (const id of ["quake", "volley", "leap", "revive"]) assert.equal(onWindupEnd(id, { ownerAlive: true, hit: true }).fire, true, id + ": vurmak iptal etmez");
});

test("Sis Perdesi: >7 birimde perdeli, yaklaşınca 0.15 sn katılaşır, uzaklaşınca hemen geri gelir; Arcane/Ay Işığı deler", () => {
  let r = veilStep(9, 0, 0.1); assert.equal(r.veiled, true); assert.equal(r.solidT, 0);
  r = veilStep(6, 0, 0.1); assert.equal(r.veiled, true, "0.1 sn: henüz katılaşmadı");
  r = veilStep(6, r.solidT, 0.1); assert.equal(r.veiled, false, "0.2 sn: katı");
  r = veilStep(8, r.solidT, 0.016); assert.equal(r.veiled, true, "uzaklaşınca anında perde");
  assert.equal(veilBlocks(true, "fire"), true); assert.equal(veilBlocks(true, "lightning"), true); assert.equal(veilBlocks(true, null), true, "Kor patlaması gibi elementsiz hasar geçemez");
  assert.equal(veilBlocks(true, "arcane"), false); assert.equal(veilBlocks(true, "light"), false); assert.equal(veilBlocks(false, "fire"), false);
});

test("Zincir Patlama: 3.5 birimdeki fitili yanmamış Kor'lar seçilir; kendisi, ölüler, fitili yanmışlar ve uzaktakiler değil", () => {
  const src = { x: 0, z: 0 }, a = { x: 3, z: 0, fuse: 0 }, b = { x: 3.6, z: 0, fuse: 0 }, c = { x: 1, z: 1, fuse: 0.3 }, d = { x: 1, z: 0, fuse: 0, dead: true };
  assert.deepEqual(emberChainVictims([src, a, b, c, d], 0, 0, src), [a]);
  assert.equal(SKILLS.emberChain.delay, 0.25); assert.equal(SKILLS.emberChain.patchR, 1.6); assert.equal(SKILLS.emberChain.patchLife, 3);
});

test("Diriltme: 7 birim, son 4 sn, rahip başına en çok 2, kullanılmış kayıt yok, cap'e saygı, yalnız küçük müttefik", () => {
  const pos = { x: 0, z: 0 }, dead = [{ type: "ghost", x: 5, z: 0, t: 10, used: false }, { type: "bat", x: 6, z: 0, t: 11, used: false }, { type: "wolf", x: 9, z: 0, t: 11, used: false }];
  assert.equal(pickReviveTarget(dead, pos, 12).type, "bat", "en yeni uygun kayıt (kurt 7 birimden uzak)");
  assert.equal(pickReviveTarget(dead, pos, 15.5), null, "4 sn geçti");
  dead[1].used = true; assert.equal(pickReviveTarget(dead, pos, 12).type, "ghost");
  const ctx = { dist: 9, dead: [{ type: "ghost", x: 3, z: 0, t: 5, used: false }], pos, now: 6, live: 5, cap: 10 };
  const st = idle("revive");
  assert.equal(canTrigger("revive", st, ctx), true);
  assert.equal(canTrigger("revive", st, { ...ctx, live: 10 }), false, "cap dolu: diriltme yok");
  assert.equal(reviveAllowed(9, 10), true); assert.equal(reviveAllowed(10, 10), false);
  st.count = 2; assert.equal(canTrigger("revive", st, ctx), false, "rahip başına en çok 2");
  assert.equal(isReviveCandidate({ hp: 1, ai: "chase" }, false), true);
  assert.equal(isReviveCandidate({ hp: 1, ai: "chase" }, true), false, "diriltilen tekrar diriltilmez");
  assert.equal(isReviveCandidate({ hp: 2, ai: "bomber" }, false), false);
  assert.equal(isReviveCandidate({ hp: 4, ai: "chase" }, false), false, "Taş Bekçi küçük değil");
  assert.equal(isReviveCandidate({ hp: 10, ai: "static", static: true }, false), false);
});

test("Lanet Alanı ve Şövalye pencereleri: alandaki düşman x0.6; totemin kendisi etkilenmez; yorgun x1.5, açık an x1.3", () => {
  const t = { ref: "T", x: 0, z: 0 };
  assert.equal(auraMul([t], 5.9, 0, "X"), 0.6); assert.equal(auraMul([t], 6.1, 0, "X"), 1); assert.equal(auraMul([t], 1, 0, "T"), 1);
  assert.equal(auraMul([], 1, 0, "X"), 1);
  const sk = initSkill("leap", () => 0);
  assert.equal(skillDamageMul(sk, 1), 1);
  sk.vulnT = 1.2; sk.vulnMul = SKILLS.leap.tiredMul; assert.equal(skillDamageMul(sk, 1), 1.5);
  sk.vulnMul = SKILLS.leap.openMul; assert.equal(skillDamageMul(sk, 0.6), 1.3 * 0.6);
  sk.vulnT = 0; assert.equal(skillDamageMul(sk, 1), 1);
  assert.equal(skillDamageMul(undefined, 0.6), 0.6);
});

test("Ok Yağmuru: merkez hareket yönünün 1.2 birim önünde, 3 işaret, arena içinde", () => {
  const pts = volleyPoints(0, 0, 1, 0, 14);
  assert.equal(pts.length, 3);
  assert.ok(Math.abs(pts[0].x - 1.2) < 1e-9 && Math.abs(pts[0].z) < 1e-9);
  assert.ok(pts[1].z !== pts[2].z, "yanlara açılır");
  const edge = volleyPoints(13.5, 0, 1, 0, 14);
  for (const p of edge) assert.ok(Math.abs(p.x) <= 14 && Math.abs(p.z) <= 14);
});

test("DDA ve alıştırma beceri sıklığını değiştirmez: skills.js dda'ya bağlı değil, cd/uyarı sabit", () => {
  const src = fs.readFileSync(new URL("../js/game/skills.js", import.meta.url), "utf8");
  assert.equal(/dda|practice|alıştırma/i.test(src.replace(/\/\/.*$/gm, "")), false, "kod gövdesinde DDA/alıştırma referansı yok");
  const run = fs.readFileSync(new URL("../js/game/skillrun.js", import.meta.url), "utf8");
  assert.equal(/\bdda\b|RT\.dda/i.test(run.replace(/\/\/.*$/gm, "")), false);
  assert.equal(initSkill("quake", () => 0.5).cd, initSkill("quake", () => 0.5).cd);
  assert.ok(!("cap" in SKILLS.quake), "beceri cap'i değiştirmez; revive cap'e saygılıdır (yukarıda)");
});

test("config: bölümlerde skills alanı geçerli; bilinmeyen kimlik reddedilir; adapt aktarır; ipucu metinleri var", () => {
  const ok = validate(clone(raw));
  assert.deepEqual(ok.errors, []); assert.deepEqual(ok.warnings, []);
  const bad = clone(raw); bad.levels["w1-01"].skills = ["veil", "meteorYagmuru"];
  const r = validate(bad);
  assert.ok(r.errors.some((e) => e.code === "E_ENUM" && e.path.startsWith("/levels/w1-01/skills")), "bilinmeyen beceri reddedildi");
  const A = adapt(ok.sanitized);
  assert.deepEqual(A.LEVELS[0].skills, ["veil"]);
  assert.deepEqual(A.LEVELS[A.LEVEL_IDS.indexOf("w1-09")].skills.slice(0, 2), ["veil", "batDive"]);
  const noSk = clone(raw); delete noSk.levels["w1-01"].skills;
  assert.equal(adapt(validate(noSk).sanitized).LEVELS[0].skills, undefined, "isteğe bağlı alan: eski bölüm davranışı");
  const used = new Set(Object.values(raw.levels).flatMap((l) => l.skills || []));
  for (const id of used) assert.ok(raw.strings.skills[id] && raw.strings.skills[id].length <= 100, "ipucu: " + id);
  for (const id of SKILL_IDS) assert.ok(raw.strings.skills[id], "tüm beceriler için metin");
});

test("öğretim sırası: bölüm başına en çok 1 yeni beceri; küme önceki bölümlerin üst kümesi; Perde II becerileri (howl, revive) hiçbir bölümde yok", () => {
  const steps = skillSteps(raw.levels, raw.campaign.order);
  assert.ok(steps.length >= 9);
  for (const st of steps) { assert.ok(st.added.length <= 1, st.id + " birden çok yeni beceri: " + st.added); assert.deepEqual(st.dropped, [], st.id + " beceri kaybı"); }
  const first = Object.fromEntries(steps.filter((s) => s.added.length).map((s) => [s.added[0], s.id]));
  assert.deepEqual(first, { veil: "w1-01", batDive: "w1-02", quake: "w1-03", volley: "w1-05", aura: "w1-06", emberChain: "w1-08", leap: "w1-09" });
  const all = new Set(Object.values(raw.levels).flatMap((l) => l.skills || []));
  assert.equal(all.has("howl"), false); assert.equal(all.has("revive"), false);
  assert.deepEqual(newSkills(["a", "b"], ["a"]), ["b"]); assert.deepEqual(newSkills(undefined, ["a"]), []);
});

test("doğrulayıcı: bir bölümde 2 yeni beceri açılırsa ve beceri kapanırsa W_BALANCE uyarısı", () => {
  assert.deepEqual(balanceIssues(raw), []);
  const two = clone(raw); two.levels["w1-02"].skills = ["veil", "batDive", "quake"];
  assert.ok(balanceIssues(two).some((x) => /ilk kez açılıyor/.test(x.message) && x.path[1] === "w1-02"));
  const drop = clone(raw); drop.levels["w1-04"].skills = ["veil"];
  assert.ok(balanceIssues(drop).some((x) => /kapanıyor/.test(x.message) && x.path[1] === "w1-04"));
  assert.ok(validate(two).warnings.some((w) => w.code === "W_BALANCE" && /ilk kez/.test(w.message)));
});

test("denge botu: beceriler açıkken aynı seed deterministik; w1-09'da orta bot becerisiz bölümden zor; perdeli Ruh Arcane yokken vurulmaz", () => {
  const A = loadConfig(), idx = A.LEVEL_IDS.indexOf("w1-09");
  const a = runMany(A, idx, PROFILES.orta, 30, 3), b = runMany(A, idx, PROFILES.orta, 30, 3);
  assert.deepEqual(a, b);
  const Z = clone(raw); for (const l of Object.values(Z.levels)) delete l.skills;
  const A0 = adapt(validate(Z).sanitized);
  const base = runMany(A0, idx, PROFILES.orta, 40, 3), skilled = runMany(A, idx, PROFILES.orta, 40, 3);
  assert.ok(skilled.winRate <= base.winRate - 0.05, `beceriler zorluğu artırmalı (${skilled.winRate} <= ${base.winRate} - 0.05)`);
  // w1-01'de yalnız Ateş var: perdeli Ruh'a boşa ateş yok, bölüm yine de geçilebilir (orta bot)
  const i1 = A.LEVEL_IDS.indexOf("w1-01");
  assert.ok(runMany(A, i1, PROFILES.orta, 30, 3).winRate >= 0.6);
  assert.equal(runMany(A, i1, PROFILES.yuruyen, 20, 3).winRate, 0, "yürüyen bot kristal bölümünü hâlâ geçemez");
});
