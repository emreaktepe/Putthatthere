// Aşama C: çevre tehlikeleri, savaş gösterisi düzeyi, doğma uyarısı. Sayılar VARSAYIMDIR.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { HAZARDS, HAZARD_IDS, MIN_PLAYER_DIST, FIRST_MIN, GLOBAL_MAX, EV_END, EV_START, EV_STRIKE, EV_TICK, ddaDef, entryTick, globalMax, hazardDefs, hazardSteps, inZone, newActive, newEntry, pickHazardPoint, slideVel, stepActive } from "../js/game/hazards.js";
import { HAZARD_IDS as REG } from "../js/config/registry.js";
import { fxProfile, hitSparks, hitStopFor, HITSTOP } from "../js/core/fxlevel.js";
import { SPAWN_WARN, drainSpawnQueue, pickWarnedSpawnPoint } from "../js/game/spawnmath.js";
import { mulberry } from "../js/core/util.js";
import { validate } from "../js/config/validate.js";
import { adapt } from "../js/config/adapt.js";
import { balanceIssues } from "../js/config/balance.js";

const raw = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));

test("tablo: 4 tür, kayıt defteriyle aynı; uyarı >= 1.0 sn; ikisine de etki", () => {
  assert.deepEqual([...HAZARD_IDS].sort(), [...REG].sort());
  for (const id of HAZARD_IDS) { assert.ok(HAZARDS[id].warn >= 1.0, id); assert.ok(HAZARDS[id].player && HAZARDS[id].enemy, id); }
  assert.ok(GLOBAL_MAX <= 3); assert.equal(globalMax(true), 2);
});

test("hazardDefs: bilinmeyen/yinelenen tür atılır, en çok 2 tür, every/maxActive sınırlanır", () => {
  const d = hazardDefs([{ kind: "x" }, { kind: "fall", every: 1, maxActive: 9 }, { kind: "fall" }, { kind: "poison" }, { kind: "fire" }]);
  assert.deepEqual(d.map((x) => x.kind), ["fall", "poison"]);
  assert.equal(d[0].every, 4); assert.equal(d[0].maxActive, 3);
  assert.deepEqual(hazardDefs(undefined), []);
});

test("adil yerleşim: hasarlı tehlike oyuncudan >= 1.5, arena içinde, çakışmaz (1000 deneme, hareketli ve duran)", () => {
  const rnd = mulberry(7);
  for (const kind of ["poison", "fall", "fire"]) {
    const def = HAZARDS[kind];
    for (let i = 0; i < 1000; i++) {
      const pl = { x: (rnd() * 2 - 1) * 12, z: (rnd() * 2 - 1) * 12 }, ang = rnd() * 6.28, moving = i % 2 === 0;
      const p = pickHazardPoint({ kind, ...def }, pl, { x: Math.cos(ang), z: Math.sin(ang) }, moving, rnd, 14, [{ x: 0, z: 0, r: 2 }]);
      if (!p) continue;
      assert.ok(Math.hypot(p.x - pl.x, p.z - pl.z) >= MIN_PLAYER_DIST, kind + " oyuncunun üstüne düştü");
      assert.ok(Math.abs(p.x) <= 12.5 && Math.abs(p.z) <= 12.5);
      assert.ok(Math.hypot(p.x, p.z) >= def.r + 1.6 - 1e-9, "var olan tehlikeyle çakıştı");
    }
  }
});

test("durum makinesi: uyarı süresince hasar yok; çarpma (fall) tek olay; zehir/ateş tick; buz hasarsız", () => {
  const f = newActive({ kind: "fall", ...HAZARDS.fall }, 5, 5);
  let ev = 0, t = 0;
  while (!(ev & EV_STRIKE)) { ev = stepActive(f, 0.1); t += 0.1; assert.ok(t < 3); }
  assert.ok(t >= HAZARDS.fall.warn - 1e-6, "uyarı süresi dolmadan çarptı");
  let end = false;
  for (let i = 0; i < 20; i++) { const e2 = stepActive(f, 0.1); assert.equal(e2 & EV_STRIKE, 0); if (e2 & EV_END) end = true; }
  assert.ok(end);
  for (const k of ["poison", "fire"]) {
    const a = newActive({ kind: k, ...HAZARDS[k] }, 0, 0);
    let ticks = 0, started = false, tt = 0;
    for (let i = 0; i < 80; i++) {
      const e = stepActive(a, 0.1); tt += 0.1;
      if (e & EV_START) { started = true; assert.ok(tt >= HAZARDS[k].warn - 1e-6); }
      if (e & EV_TICK) { assert.ok(started); ticks++; }
    }
    assert.ok(started); assert.ok(ticks >= 1 && ticks <= Math.ceil(HAZARDS[k].life / HAZARDS[k].tick) + 1, k + " tick " + ticks);
  }
  const ice = newActive({ kind: "ice", ...HAZARDS.ice }, 0, 0);
  for (let i = 0; i < 100; i++) assert.equal(stepActive(ice, 0.1) & EV_TICK, 0);
});

test("iki yöne etki: bölge testi oyuncu ve düşman için aynı yarıçap", () => {
  const a = newActive({ kind: "fire", ...HAZARDS.fire }, 3, 3);
  assert.ok(inZone(a, 3.5, 3)); assert.ok(!inZone(a, 6, 3));
  assert.ok(HAZARDS.fire.dmgP > 0 && HAZARDS.fire.dmgE > 0 && HAZARDS.poison.dmgE > 0 && HAZARDS.fall.dmgE >= HAZARDS.fall.dmgP);
});

test("zamanlayıcı: ilk tehlike >= 8 sn sonra; dolu iken 0.5 sn sonra yeniden dener", () => {
  const rnd = mulberry(3), en = newEntry({ kind: "fall", ...HAZARDS.fall });
  let t = 0;
  while (!entryTick(en, 0.1, true, rnd)) t += 0.1;
  assert.ok(t >= FIRST_MIN - 0.2, "ilk tehlike erken: " + t);
  const en2 = newEntry({ kind: "fall", ...HAZARDS.fall }); en2.t = 0;
  assert.equal(entryTick(en2, 0.1, false, rnd), false); assert.ok(Math.abs(en2.t - 0.5) < 1e-9);
});

test("DDA: kademe seyreltir; kademe 0 değişmez", () => {
  const d = { kind: "fall", ...HAZARDS.fall, dmgP: 2 };
  assert.equal(ddaDef(d, 0).every, d.every);
  assert.ok(ddaDef(d, 1).every > d.every); assert.equal(ddaDef(d, 2).maxActive, d.maxActive - 1); assert.equal(ddaDef(d, 3).dmgP, 1);
  assert.equal(ddaDef({ ...d, maxActive: 1 }, 3).maxActive, 1);
});

test("buz kayması: buz dışında anında, buzda kademeli yaklaşır", () => {
  const v = { x: 5, z: 0 };
  slideVel(v, 0, 5, 0.1, false); assert.deepEqual([v.x, v.z], [0, 5]);
  v.x = 5; v.z = 0; slideVel(v, 0, 5, 0.1, true);
  assert.ok(v.x > 3.5 && v.x < 5 && v.z > 0 && v.z < 2);
});

test("config: bölümde en çok 1 yeni tür; doğrulayıcı 0 hata; bilinmeyen tür / 3 tür / maxActive 4 reddedilir; fazla yeni tür uyarılır", () => {
  const steps = hazardSteps(raw.levels, raw.campaign.order);
  assert.ok(steps.length >= 5);
  for (const s of steps) assert.ok(s.added.length <= 1, s.id);
  assert.equal(validate(raw).errors.length, 0);
  const bad = clone(raw); bad.levels["w1-02"].hazards = [{ kind: "lava" }];
  assert.ok(validate(bad).errors.length > 0);
  const many = clone(raw); many.levels["w1-02"].hazards = [{ kind: "fall" }, { kind: "fire" }, { kind: "ice" }];
  assert.ok(validate(many).errors.length > 0, "en çok 2 tür");
  const mx = clone(raw); mx.levels["w1-02"].hazards = [{ kind: "fall", maxActive: 4 }];
  assert.ok(validate(mx).errors.length > 0, "maxActive <= 3");
  const two = clone(raw); two.levels["w1-01"].hazards = [{ kind: "fall" }, { kind: "ice" }];
  assert.ok(balanceIssues(two).some((w) => /çevre tehlikesi/.test(w.message)), "2 yeni tür uyarısı");
  assert.deepEqual(adapt(validate(raw).sanitized).LEVELS.find((l) => l.id === "w1-07").hazards, [{ kind: "ice" }]);
});

test("savaş gösterisi düzeyi: Düşük kalite ve reduced-motion kapatır/yarıya indirir", () => {
  const hi = fxProfile(), lo = fxProfile({ low: true }), rm = fxProfile({ reduced: true });
  assert.ok(hi.hitStop && !lo.hitStop && !rm.hitStop);
  assert.equal(rm.shake, 0); assert.equal(lo.shake, 0.5); assert.ok(!rm.sweep && hi.sweep);
  assert.ok(lo.hazardMax <= hi.hazardMax && hi.hazardMax <= 3);
  assert.equal(hitSparks(hi, "E"), 10); assert.equal(hitSparks(hi, "N"), 5); assert.equal(hitSparks(lo, "N"), 3);
});

test("hit-stop: yalnız ağır öldürme / Etkili öldürme; 40-60 ms; art arda sınırlı", () => {
  const p = fxProfile();
  assert.equal(hitStopFor({ profile: p, kill: true, heavy: true, now: 10 }), 0.06);
  assert.equal(hitStopFor({ profile: p, kill: true, effective: true, now: 10 }), 0.04);
  assert.equal(hitStopFor({ profile: p, kill: true, now: 10 }), 0, "sıradan öldürme donmaz");
  assert.equal(hitStopFor({ profile: p, kill: false, heavy: true, now: 10 }), 0, "vuruş donmaz");
  assert.equal(hitStopFor({ profile: p, kill: true, heavy: true, now: 10, last: 10 - HITSTOP.cooldown / 2 }), 0);
  assert.equal(hitStopFor({ profile: fxProfile({ low: true }), kill: true, heavy: true, now: 10 }), 0);
});

test("doğma uyarısı: 0.5 sn; nokta oyuncudan uzak; kuyruk süresi dolunca boşalır", () => {
  assert.equal(SPAWN_WARN, 0.5);
  const rnd = mulberry(5);
  for (let i = 0; i < 500; i++) {
    const pl = { x: (rnd() * 2 - 1) * 10, z: (rnd() * 2 - 1) * 10 }, p = pickWarnedSpawnPoint(pl, rnd, 14);
    assert.ok(Math.hypot(p.x - pl.x, p.z - pl.z) >= 6.5, "çok yakın");
  }
  const q = [{ type: "a", t: 0.5 }, { type: "b", t: 0.2 }], out = [];
  assert.equal(drainSpawnQueue(q, 0.3, out), 1); assert.equal(out[0].type, "b"); assert.equal(q.length, 1);
  assert.equal(drainSpawnQueue(q, 0.3, out), 1); assert.equal(q.length, 0);
});
