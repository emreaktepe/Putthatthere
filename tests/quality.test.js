// Grafik kalitesi seçimi: saf mantık (auto kararı, geçersiz değer, depolama güvenliği).
import test from "node:test";
import assert from "node:assert/strict";
import { QUALITY_KEY, detectEnv, nextQuality, normalizeQuality, readQuality, resolveQuality, writeQuality } from "../js/core/quality.js";

test("geçersiz değer auto'ya düşer", () => {
  for (const v of [undefined, null, "", "ultra", "HIGH", 3, {}, "pro", "__proto__"]) assert.equal(normalizeQuality(v), "auto");
  for (const v of ["auto", "high", "low"]) assert.equal(normalizeQuality(v), v);
});

test("high=pro, low=basic; ortam yok sayılır", () => {
  assert.equal(resolveQuality("high", { coarse: true, cores: 2, memory: 1 }), "pro");
  assert.equal(resolveQuality("low", { cores: 32, memory: 32 }), "basic");
});

test("auto: güçlü masaüstü pro, zayıf cihaz basic", () => {
  assert.equal(resolveQuality("auto", { coarse: false, cores: 8, memory: 8 }), "pro");
  assert.equal(resolveQuality("auto", {}), "pro"); // ipucu yoksa zayıf sayılmaz
  assert.equal(resolveQuality("auto", { coarse: true, cores: 8, memory: 8 }), "basic");
  assert.equal(resolveQuality("auto", { cores: 4 }), "basic");
  assert.equal(resolveQuality("auto", { cores: 5 }), "pro");
  assert.equal(resolveQuality("auto", { memory: 4 }), "basic");
  assert.equal(resolveQuality("auto", { memory: 8 }), "pro");
  assert.equal(resolveQuality("auto", { cores: NaN, memory: 0 }), "pro");
  assert.equal(resolveQuality("bozuk", { coarse: true }), "basic"); // geçersiz tercih = auto
});

test("detectEnv: matchMedia/navigator eksik ya da hatalıysa çökmez", () => {
  assert.deepEqual(detectEnv({}), { coarse: false, cores: undefined, memory: undefined });
  const g = { matchMedia: () => ({ matches: true }), navigator: { hardwareConcurrency: 4, deviceMemory: 2 } };
  assert.deepEqual(detectEnv(g), { coarse: true, cores: 4, memory: 2 });
  assert.equal(detectEnv({ matchMedia: () => { throw new Error("x"); } }).coarse, false);
});

test("depolama: okuma/yazma güvenli, özel moddaki hata yutulur", () => {
  const mem = new Map();
  const st = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  assert.equal(readQuality(st), "auto");
  assert.equal(writeQuality(st, "high"), true);
  assert.equal(mem.get(QUALITY_KEY), "high");
  mem.set(QUALITY_KEY, "<script>");
  assert.equal(readQuality(st), "auto");
  assert.equal(writeQuality(st, "zzz"), true);
  assert.equal(mem.get(QUALITY_KEY), "auto");
  const bad = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  assert.equal(readQuality(bad), "auto");
  assert.equal(writeQuality(bad, "low"), false);
  assert.equal(readQuality(undefined), "auto");
});

test("nextQuality: auto -> high -> low -> auto", () => {
  assert.equal(nextQuality("auto"), "high");
  assert.equal(nextQuality("high"), "low");
  assert.equal(nextQuality("low"), "auto");
  assert.equal(nextQuality("bozuk"), "high");
});
