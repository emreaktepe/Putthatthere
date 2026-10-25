// 3B dekor modülleri (js/render/decor, Environment Complete v1 paketi) oyun sözleşmesi + bölüm dekor planı (sceneryplan.js) bütçeleri.
// Tarayıcıda importmap'ten gelen "three", Node'da vendor/ dosyasına yönlendirilir. scenery.js DOM ister: burada yüklenmez; plan saf veridir.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const vendor = pathToFileURL(new URL("../vendor/three.module.min.js", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")).href;
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s, c, n) { if (s === "three") return { url: ${JSON.stringify(vendor)}, shortCircuit: true }; return n(s, c); }`));
const noop = () => {};
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ createRadialGradient: () => ({ addColorStop: noop }), fillRect: noop, fillStyle: "" }) }) };

const THREE = await import("three");
const { DECOR_FACTORIES, createDecor } = await import("../js/render/decor/index.js");
const { createInstancedDecor } = await import("../js/render/decor/instancing.js");
const { getDecorStats } = await import("../js/render/decor/common.js");
const PLANM = await import("../js/render/sceneryplan.js");
const PV = await import("../js/render/propsvis.js");
const { SCENERY_KINDS } = await import("../js/config/registry.js");

// docs/icerik/3d-dekor-listesi.md §3 sınıf bütçeleri (tek örnek üçgen)
const CLASS = { small: 150, mid: 500, large: 1200, mono: 6000 };
const KIND_CLASS = {
  "grass-tuft": ["small", 40], "mushroom-glow": "small", puddle: "small", "grave-mound": "small", "snow-mound": "small", bonfire: "small", "charred-stump": "small", "crystal-shard": "small",
  pine: "mid", "dead-tree": "mid", rock: "mid", log: "mid", stalactite: "mid", "cave-crystal": "mid", rubble: "mid", "rune-banner": "mid", gravestone: "mid", "iron-fence": "mid", "ice-spike": "mid", "bone-pile": "mid", "rib-arch": "mid", "castle-banner": "mid", "castle-window": "mid", "taskin-statue": "mid",
  column: "large", arch: "large", "burnt-house": "large", "big-crystal": "large", "castle-pillar": "large", crypt: "large", "frozen-bridge": "large",
  well: "mono", "lamp-post": "mono", "crystal-pillar": "mono", "bone-tower": "mono", "shadow-heart": "mono", throne: "mono",
};
const budgetOf = (id) => { const c = KIND_CLASS[id]; return Array.isArray(c) ? c[1] : CLASS[c]; };
const IDS = Object.keys(DECOR_FACTORIES);
const tris = (d) => getDecorStats(d).triangles;

test("paket: 37 dekor türü, hepsinin sınıf bütçesi tanımlı", () => {
  assert.equal(IDS.length, 37);
  for (const id of IDS) assert.ok(budgetOf(id), id);
});

test("her tür x 3 varyant: parts boş değil, height/footprint > 0, <= 3 malzeme, üçgen bütçesi içinde, geçerli geometri", () => {
  for (const id of IDS) for (let v = 0; v < 3; v++) {
    const d = createDecor(id, { variant: v });
    assert.ok(d.parts.length >= 1 && d.parts.length <= 3, `${id}/${v} parts=${d.parts.length}`);
    assert.ok(d.height > 0 && d.footprint > 0, `${id}/${v} boyut`);
    assert.equal(typeof d.castShadow, "boolean");
    assert.ok(d.glow === null || (Number.isFinite(d.glow.color) && d.glow.y > 0 && d.glow.size > 0), `${id}/${v} glow`);
    for (const p of d.parts) {
      assert.ok(p.geometry.isBufferGeometry && p.material.isMaterial && typeof p.key === "string");
      const pos = p.geometry.attributes.position.array;
      assert.ok(pos.length > 0 && pos.every(Number.isFinite), `${id}/${v} NaN`);
    }
    assert.ok(tris(d) <= budgetOf(id), `${id}/${v}: ${tris(d)} > ${budgetOf(id)}`);
    d.dispose();
  }
});

test("varyantı tarife bağlı olmayan türlerde 3 varyant aynı biçim (plan tek varyantla kurar)", () => {
  for (const id of IDS) {
    if (PLANM.VARIANTS[id]) continue;
    const arrs = [0, 1, 2].map((v) => { const d = createDecor(id, { variant: v }); const a = d.parts.map((p) => Array.from(p.geometry.attributes.position.array).join(",")).join("|"); d.dispose(); return a; });
    assert.equal(arrs[0], arrs[1], id); assert.equal(arrs[1], arrs[2], id);
  }
});

test("ışık yok: kaynakta ışık sınıfı/ağ/dinamik kod yok, sahne ağacında isLight düğümü yok", () => {
  for (const dir of ["decor", "floors"]) for (const f of readdirSync(new URL(`../js/render/${dir}/`, import.meta.url))) {
    const src = readFileSync(new URL(`../js/render/${dir}/${f}`, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
    assert.ok(!/THREE\.\w*Light\b|Math\.random|\bfetch\(|XMLHttpRequest|\beval\(|new Function|import\(|innerHTML|WebSocket/.test(src), `${dir}/${f}`);
  }
  for (const id of IDS) {
    const inst = createInstancedDecor(id, [{ x: 1, z: 2 }, { x: -3, z: 4, scale: 1.5, rotation: 1 }], { variant: 1 });
    inst.group.traverse((o) => assert.ok(!o.isLight, id));
    inst.dispose();
  }
});

test("dispose iki kez güvenli; paylaşılan geometri son kullanıcıda bir kez, paylaşılan malzeme hiç serbest bırakılmaz", () => {
  const a = createDecor("pine", { variant: 0 }), b = createDecor("pine", { variant: 0 });
  assert.strictEqual(a.parts[0].geometry, b.parts[0].geometry); // paylaşım
  let geoN = 0, matN = 0;
  a.parts[0].geometry.addEventListener("dispose", () => geoN++);
  a.parts[0].material.addEventListener("dispose", () => matN++);
  a.dispose(); a.dispose();
  assert.equal(geoN, 0); // b hâlâ kullanıyor
  b.dispose(); b.dispose();
  assert.equal(geoN, 1);
  assert.equal(matN, 0);
  const inst = createInstancedDecor("pine", [{ x: 0, z: 0 }], { variant: 0 });
  const g2 = inst.group.children[0].geometry;
  let n2 = 0; g2.addEventListener("dispose", () => n2++);
  inst.dispose(); inst.dispose();
  assert.equal(n2, 1);
});

test("createInstancedDecor: malzeme başına bir InstancedMesh, örnek sayısı ve dönüşüm doğru", () => {
  const pl = Array.from({ length: 7 }, (_, i) => ({ x: i, y: 0, z: -i, rotation: i * 0.3, scale: 1 + i * 0.1 }));
  const inst = createInstancedDecor("mushroom-glow", pl);
  assert.equal(inst.group.children.length, createDecor("mushroom-glow").parts.length);
  for (const m of inst.group.children) { assert.ok(m.isInstancedMesh); assert.equal(m.count, 7); }
  const mat = new THREE.Matrix4(); inst.group.children[0].getMatrixAt(3, mat);
  assert.ok(Math.abs(mat.elements[12] - 3) < 1e-6 && Math.abs(mat.elements[14] + 3) < 1e-6);
  inst.dispose();
});

test("plan: kimlikler geçerli, bölüm adları registry ile aynı, sabit konumlar Zerrin/Taşkın alanı dışında, 37 türün hepsi kullanılıyor", () => {
  assert.deepEqual([...PLANM.PLAN_KINDS].sort(), [...SCENERY_KINDS].sort());
  for (const k of PLANM.PLAN_KINDS) for (const e of PLANM.PLAN[k].items) {
    assert.ok(DECOR_FACTORIES[e.id], `${k}:${e.id}`);
    assert.ok(e.n >= 1);
    assert.ok(e.ring || e.fixed || e.edge, `${k}:${e.id} yerleşim`);
    if (e.fixed) for (const [x, z] of e.fixed) if (PV.reservedHit(x, z)) assert.ok(e.id === "castle-banner", `${k}:${e.id} rezerve alanda (${x},${z})`); // banner: kurucu atlar
  }
  for (const id of IDS) assert.ok(Object.values(PLANM.PLAN).some((p) => p.items.some((e) => e.id === id)), `${id} hiçbir bölümde kullanılmıyor`);
});

test("kalite: süs dekor düşükte kurulmaz, çok örnekli sayılar yarıya iner, tekiller kalır", () => {
  for (const k of PLANM.PLAN_KINDS) {
    assert.equal(PLANM.planEntries(k, true).length, PLANM.PLAN[k].items.length);
    for (const e of PLANM.planEntries(k, false)) {
      assert.ok(!PLANM.ORNAMENTS.has(e.id), `${k}:${e.id} süs düşükte`);
      assert.ok(PLANM.scaledCount(e, false) <= PLANM.scaledCount(e, true));
      if (e.n === 1) assert.equal(PLANM.scaledCount(e, false), 1);
    }
  }
  const pine = PLANM.PLAN.forest.items.find((e) => e.id === "pine");
  assert.equal(PLANM.scaledCount(pine, true), 46);
  assert.equal(PLANM.scaledCount(pine, false), 23);
  assert.deepEqual([...PLANM.ORNAMENTS].sort(), ["charred-stump", "crystal-shard", "grass-tuft", "log", "mushroom-glow", "puddle", "rubble", "snow-mound"]);
});

// çizim çağrısı / üçgen tahmini: kullanılan varyant başına parça sayısı + parıltı sprite'ları + elle kurulan ekstralar
function estimate(kind, high) {
  let calls = PLANM.PLAN[kind].extra.calls, triangles = PLANM.PLAN[kind].extra.tris, glows = 0;
  for (const e of PLANM.planEntries(kind, high)) {
    const n = PLANM.scaledCount(e, high), nv = Math.min(PLANM.variantsOf(e.id), n);
    let tsum = 0;
    for (let v = 0; v < nv; v++) { const d = createDecor(e.id, { variant: v }); calls += d.parts.length; tsum += tris(d); d.dispose(); }
    triangles += Math.round((tsum / nv) * n);
    if (e.glow) glows += Math.min(e.glow.max, n);
  }
  return { calls: calls + glows, triangles };
}
test("bölüm başına dekor bütçesi: <= 60 çizim çağrısı, <= 80 bin üçgen (yüksek ve düşük kalite)", (t) => {
  for (const k of PLANM.PLAN_KINDS) for (const high of [true, false]) {
    const r = estimate(k, high);
    t.diagnostic(`${k} ${high ? "yüksek" : "düşük"}: ${r.calls} çağrı, ${r.triangles} üçgen`);
    assert.ok(r.calls <= 60, `${k}/${high}: ${r.calls} çağrı`);
    assert.ok(r.triangles <= 80000, `${k}/${high}: ${r.triangles} üçgen`);
  }
});

test("propsvis.taskinStatueVisible: heykel yalnız golems tamamlanmadan görünür", () => {
  assert.equal(PV.taskinStatueVisible([]), true);
  assert.equal(PV.taskinStatueVisible(new Set(["forest", "cave"])), true);
  assert.equal(PV.taskinStatueVisible(new Set(["golems"])), false);
  assert.equal(PV.taskinStatueVisible(["forest", "golems"]), false);
  assert.equal(PV.taskinStatueVisible(undefined), true);
});
