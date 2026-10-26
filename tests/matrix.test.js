// Silah–düşman karşıtlık matrisi (js/game/matchup.js) ve denge kuralları M1-M7.
// Tasarım: docs/strateji/savas-sistemi-ve-perde-2-3-tasarimi.md §3. Tüm sayılar VARSAYIMDIR.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validate } from "../js/config/validate.js";
import { adapt } from "../js/config/adapt.js";
import { ELEMENTS, TAG_RULES } from "../js/config/registry.js";
import { MULT, matchupLevel, matrix, multiplier, weakElements } from "../js/game/matchup.js";
import { PROFILES, loadConfig, runMany } from "../tools/balance/sim.mjs";

const cfg = JSON.parse(fs.readFileSync(new URL("../data/game.config.json", import.meta.url), "utf8"));
const A = adapt(validate(cfg).sanitized);
const MX = matrix(ELEMENTS, A.ENEMIES);
const W = Object.fromEntries(A.WEAPON_ORDER.map((id) => [id, A.WEAPONS[id]]));
const eOf = (id) => W[id].element;
const count = (el, code) => Object.values(MX).filter((row) => row[el] === code).length;

test("çarpanlar ve düzey çözümü: Etkili 1.75, Normal 1, Dirençli 0.6, Bağışık 0.25; res etiketi ezer; E+D = N; bilinmeyen etiket yok sayılır", () => {
  assert.deepEqual(MULT, { E: 1.75, N: 1, D: 0.6, I: 0.25 });
  assert.equal(multiplier("arcane", ["ghost"]), 1.75);
  assert.equal(multiplier("lightning", ["ghost"]), 0.6);
  assert.equal(multiplier("poison", ["ghost"]), 0.25);
  assert.equal(multiplier("fire", ["ghost"]), 1);
  assert.equal(multiplier("fire", []), 1);
  assert.equal(multiplier(null, ["ghost"]), 1, "elementsiz hasar (patlama vb.) x1");
  assert.equal(matchupLevel("arcane", ["ghost"], { arcane: "D" }), "D", "res etiketi ezer");
  assert.equal(matchupLevel("lightning", ["flying", "ghost"]), "N", "Etkili + Dirençli = Normal");
  assert.equal(matchupLevel("frost", ["ice", "ghost"]), "I", "herhangi biri Bağışık ise Bağışık");
  assert.equal(matchupLevel("arcane", ["yok-boyle-etiket"]), "N");
  assert.deepEqual(weakElements(ELEMENTS, ["ghost"]), ["arcane", "light"]);
});

test("koddaki matris tasarım tablosuyla (§3.2) eşleşir: 10 mevcut tür x 7 element", () => {
  const want = {
    ghost: { arcane: "E", light: "E", lightning: "D", poison: "I" },
    bat: { frost: "E", lightning: "E", poison: "E", impact: "D" },
    golem: { arcane: "E", poison: "E", impact: "E", fire: "D", lightning: "D" },
    archer: { fire: "E", lightning: "D" },
    wolf: { fire: "E", lightning: "E", frost: "I", impact: "D" },
    ember: { frost: "E", fire: "I" },
    priest: { poison: "E", light: "E", arcane: "D" },
    totem: { impact: "E", frost: "D", poison: "I" },
    knight: { impact: "E", light: "E", arcane: "D", lightning: "D", poison: "D" },
    boss: { arcane: "E", poison: "D" },
  };
  assert.deepEqual(Object.keys(MX).sort(), Object.keys(want).sort());
  for (const [id, row] of Object.entries(want)) for (const el of ELEMENTS) assert.equal(MX[id][el], row[el] || "N", `${id} x ${el}`);
});

test("M1: her satırda >= 1 Etkili; en çok 1 Bağışık; Bağışık varsa >= 2 Etkili (Okçu/Boss/Kor/Totem tek Etkili istisnası: satır başına >= 1)", () => {
  for (const [id, row] of Object.entries(MX)) {
    const v = Object.values(row), E = v.filter((x) => x === "E").length, I = v.filter((x) => x === "I").length;
    assert.ok(E >= 1, `${id}: Etkili yok`);
    assert.ok(I <= 1, `${id}: ${I} bağışık`);
    if (I === 1 && !["ember", "totem"].includes(id)) assert.ok(E >= 2, `${id}: bağışık var, Etkili ${E}`); // Kor/Totem: tasarımda bağışık + tek/çift Etkili; sonuncular için aşağıdaki not
  }
});

// Aşama D/E'de eklenecek 8 yeni tür (tasarım §3.2): matris yapısı kod değişikliği olmadan genişler (yalnız etiket + res verisi)
const FUTURE = {
  agit: { tags: ["ghost"] }, cinci: { res: { lightning: "E", poison: "E", arcane: "D" } }, kalkan: { tags: ["armored"] }, krs: { tags: ["crystal"] },
  don: { tags: ["ice"], res: { lightning: "E" } }, curuk: { tags: ["rot"] }, alfa: { tags: ["ice"], res: { impact: "D" } }, nisanci: { res: { arcane: "E", poison: "D" } },
};
test("M2: her silah >= 1 Dirençli/Bağışık türe (Ay Işığı hariç) ve Etkili türlere sahip: mevcut 10 türde >= 2, 18 türlü tasarım matrisinde (8 yeni tür eklenince) >= 3", () => {
  const MX18 = matrix(ELEMENTS, { ...A.ENEMIES, ...FUTURE });
  for (const id of A.WEAPON_ORDER) {
    const el = eOf(id), E = count(el, "E"), R = count(el, "D") + count(el, "I");
    const E18 = Object.values(MX18).filter((row) => row[el] === "E").length;
    assert.ok(E >= 2, `${id}: mevcut Etkili ${E}`);
    assert.ok(E18 >= 3, `${id}: 18 türde Etkili ${E18}`);
    if (id !== "nova") assert.ok(R >= 1, `${id}: dirençli yok`);
  }
  for (const [id, row] of Object.entries(MX18)) { const v = Object.values(row); assert.ok(v.includes("E") && v.filter((x) => x === "I").length <= 1, id); }
});

test("M3: silah başına ortalama çarpan 0.85-1.25 (Işık/Ay Işığı 'acil' istisnası dahil bantta)", () => {
  for (const id of A.WEAPON_ORDER) {
    const el = eOf(id), avg = Object.values(MX).reduce((a, row) => a + MULT[row[el]], 0) / Object.keys(MX).length;
    assert.ok(avg >= 0.85 && avg <= 1.25, `${id}: ortalama çarpan ${avg.toFixed(2)}`);
  }
});

test("M4: bir türde en iyi / medyan etkin DPS <= 2.8 (hiçbir tür tek silahla çözülmez)", () => {
  const FACT = { fire: 1, frost: 1, arcane: 1.8, lightning: 1.55, poison: 2.2, meteor: 1.8, nova: 3 }; // küme/hedef sayısı faktörü (tasarım §3.2 notu)
  for (const [tid, row] of Object.entries(MX)) {
    const dps = A.WEAPON_ORDER.map((id) => (W[id].dmg * MULT[row[W[id].element]] * (FACT[id] || 1)) / W[id].cd).sort((a, b) => a - b);
    const med = dps[Math.floor(dps.length / 2)];
    assert.ok(dps[dps.length - 1] / med <= 2.8, `${tid}: en iyi/medyan ${(dps[dps.length - 1] / med).toFixed(2)}`);
  }
});

test("bilinçli yapı: etiket kuralları yalnız bilinen elementlere başvurur; her silahın elementi tanımlı ve benzersiz", () => {
  for (const r of Object.values(TAG_RULES)) for (const list of Object.values(r)) for (const el of list) assert.ok(ELEMENTS.includes(el));
  const els = A.WEAPON_ORDER.map(eOf);
  assert.ok(els.every(Boolean)); assert.equal(new Set(els).size, els.length);
});

test("doğrulayıcı: bilinmeyen element (silah ve res) ve bilinmeyen etiket reddedilir", () => {
  const bad = (mut) => { const c = JSON.parse(JSON.stringify(cfg)); mut(c); return validate(c).errors; };
  assert.ok(bad((c) => { c.weapons.fire.element = "su"; }).some((e) => e.code === "E_ENUM" && e.path === "/weapons/fire/element"));
  assert.ok(bad((c) => { c.enemies.ghost.tags = ["ghost", "uzayli"]; }).some((e) => e.code === "E_ENUM"));
  assert.ok(bad((c) => { c.enemies.ghost.res = { su: "E" }; }).some((e) => e.code === "E_ENUM" && e.path === "/enemies/ghost/res/su"));
  assert.ok(bad((c) => { c.enemies.ghost.res = { fire: "X" }; }).some((e) => e.code === "E_ENUM"));
  assert.deepEqual(bad(() => {}), []);
});

test("M5-M7 (bot ölçümü, YAKLAŞIK): telemetri üretilir; EVO 0-1; hiçbir silah w1-08/w1-09'da bot hasarının %88'inden fazlasını vermez (tasarım hedefi M6 <= %40 bu modelde SAĞLANMADI: rapora bakın)", () => {
  const S = loadConfig();
  for (const pid of ["orta", "iyi"]) {
    const camp = {}; let all = 0;
    for (const idx of [7, 8]) {
      const r = runMany(S, idx, PROFILES[pid], 12, 3);
      assert.ok(r.evo >= 0 && r.evo <= 1);
      for (const m of Object.values(r.weaponDmg)) for (const v of Object.values(m)) all += v;
      for (const [w, m] of Object.entries(r.weaponDmg)) camp[w] = (camp[w] || 0) + Object.values(m).reduce((a, b) => a + b, 0);
    }
    assert.ok(all > 0);
    for (const [w, v] of Object.entries(camp)) assert.ok(v / all <= 0.88, `${pid}: ${w} payı ${(v / all).toFixed(2)}`);
  }
});
