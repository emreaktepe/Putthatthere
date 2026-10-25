// Zemin ressamları (js/render/floors, Environment Complete v1 paketi): sahte 2B bağlamla deterministik, ölçekli, gri tonlamalı, Math.random'suz.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { FLOORS } from "../js/render/floors/index.js";
import { seededRandom } from "../js/render/floors/common.js";
import { FLOOR_KINDS } from "../js/config/registry.js";

// çağrıları kaydeden sahte 2B bağlam: renkler, sayısal argümanlar ve çağrı özeti
function fakeCtx() {
  const log = [], colors = [], nums = [], store = {};
  const note = (v) => { if (typeof v === "string") colors.push(v); };
  const grad = () => ({ addColorStop: (o, c) => { log.push("stop"); note(c); } });
  return new Proxy(store, {
    get(o, k) {
      if (k === "log") return log;
      if (k === "colors") return colors;
      if (k === "nums") return nums;
      if (k === "createRadialGradient" || k === "createLinearGradient") return (...a) => { log.push(k + a.map((x) => x.toFixed(3)).join(",")); nums.push(...a); return grad(); };
      if (k in o) return o[k];
      return (...a) => { log.push(String(k) + a.map((x) => (typeof x === "number" ? x.toFixed(3) : "")).join(",")); nums.push(...a.filter((x) => typeof x === "number")); };
    },
    set(o, k, v) { o[k] = v; note(v); return true; },
  });
}
const run = (kind, size, seed) => { const c = fakeCtx(); FLOORS[kind](c, size, seededRandom(seed)); return c; };
const KINDS = Object.keys(FLOORS);

test("9 zemin türü, config registry (FLOOR_KINDS) ile aynı liste", () => {
  assert.deepEqual([...KINDS].sort(), [...FLOOR_KINDS].sort());
  assert.equal(KINDS.length, 9);
});

test("deterministik: aynı seed aynı çizim, farklı seed farklı; Math.random çağrılmaz", () => {
  const orig = Math.random;
  Math.random = () => { throw new Error("Math.random kullanıldı"); };
  try {
    for (const k of KINDS) {
      const a = run(k, 512, 1234).log.join("|"), b = run(k, 512, 1234).log.join("|"), c = run(k, 512, 99).log.join("|");
      assert.equal(a, b, k); assert.notEqual(a, c, k); assert.ok(a.length > 100, k);
    }
  } finally { Math.random = orig; }
});

test("size 512 ve 1024: çizim aynı yapıda, koordinatlar boyuta göre ölçeklenir", () => {
  for (const k of KINDS) {
    const a = run(k, 512, 7), b = run(k, 1024, 7);
    assert.equal(a.log.length, b.log.length, k); // aynı sayıda çağrı
    const max = (c) => Math.max(...c.nums.map(Math.abs));
    assert.ok(max(a) < 512 * 2.5 && max(b) < 1024 * 2.5, k); // kenar elipsleri için makul taşma payı
    assert.ok(max(b) > max(a) * 1.5, `${k}: 1024 sürümü ölçeklenmedi`);
  }
});

test("gri tonlama: tüm renk dizgeleri R=G=B, değerler 90..255 aralığında", () => {
  for (const k of KINDS) {
    const c = run(k, 512, 5);
    assert.ok(c.colors.length > 10, k);
    for (const s of c.colors) {
      const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/.exec(s);
      assert.ok(m, `${k}: renk biçimi ${s}`);
      assert.ok(m[1] === m[2] && m[2] === m[3], `${k}: gri değil ${s}`);
      assert.ok(+m[1] >= 90 && +m[1] <= 255, `${k}: aralık dışı ${s}`);
    }
  }
});

test("seededRandom: [0,1) aralığı, seed başına tekrarlanabilir", () => {
  const r = seededRandom(42), r2 = seededRandom(42);
  for (let i = 0; i < 1000; i++) { const v = r(); assert.ok(v >= 0 && v < 1); assert.equal(v, r2()); }
});

test("zemin kaynakları: ağ/dinamik kod/Math.random yok", () => {
  for (const f of readdirSync(new URL("../js/render/floors/", import.meta.url))) {
    const src = readFileSync(new URL(`../js/render/floors/${f}`, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
    assert.ok(!/Math\.random|fetch\(|eval\(|new Function|import\(|innerHTML/.test(src), f);
  }
});
