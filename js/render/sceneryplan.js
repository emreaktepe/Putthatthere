// Bölüm dekor planı (SAF VERİ + saf yardımcılar; Three.js/DOM yok, Node'da testlenir).
// Kaynak: docs/icerik/3d-dekor-listesi.md. Yapıcılar (scenery.js) bu planı okuyup js/render/decor/ modüllerinden InstancedMesh kurar.
// Alanlar (her satır = bir dekor türü, birden çok örnek):
//   id     decor/index.js türü          n      yüksek kalitede örnek sayısı (edge için üst sınır: kenar yuvası)
//   ring   [rmin, rmax] -> ringPos()    fixed  [[x, z, yaw, ölçek, y?], ...] sabit konum (tekil anıtlar)
//   edge   {step, off, skip} arena kenarında dizi (çit)   s [min, maks] ölçek aralığı
//   tint   null | hex | [hex...] örnek rengi çarpanı (dekor kendi renklerini taşır)   gain: çarpan parlaklığı
//   tj     parlaklık oynaması            glow   {max: parıltı sprite sayısı, k: boyut çarpanı}   spin: örnekler yavaş döner
//   face   true: yön arena merkezine bakar
// extra: dekor dışı elle kurulan parçaların tahmini {calls, tris} (duvar, ateş konileri, zemin parıltısı...).
export const A = 14; // ARENA (core/util.js ile aynı; burada Three/DOM'a bağımlı olmamak için tekrar)

// Süs dekorlar: yalnız yüksek kalitede kurulur (docs/icerik/3d-dekor-listesi.md §10 kararı 2).
export const ORNAMENTS = new Set(["grass-tuft", "mushroom-glow", "puddle", "snow-mound", "charred-stump", "crystal-shard", "log", "rubble"]);
// Tarifi varyanta gerçekten bağlı türlerin farklı biçim sayısı; paketin diğer türlerinde 3 varyant aynı biçimdir (yalnız ölçek/renk),
// bu yüzden tek varyantla kurulur (varyant başına ayrı InstancedMesh = ek çizim çağrısı).
export const VARIANTS = { pine: 3, "dead-tree": 3, rock: 3, stalactite: 3, "cave-crystal": 3, puddle: 3, column: 3, arch: 2, gravestone: 3, "ice-spike": 3, "burnt-house": 3, "big-crystal": 3, "crystal-shard": 3, "castle-pillar": 3 };
export const variantsOf = (id) => VARIANTS[id] || 1;

// Düşük kalite: çok örnekli (n >= 6) dekorun yarısı; tekil/az örnekli anıtlar aynen; süsler hiç.
export const LOW_FACTOR = 0.5;
export function scaledCount(entry, high) {
  if (high) return entry.n;
  if (ORNAMENTS.has(entry.id)) return 0;
  return entry.n >= 6 && !entry.fixed ? Math.ceil(entry.n * LOW_FACTOR) : entry.n; // sabit konumlu diziler (kale sütunları) simetri için olduğu gibi kalır
}
export const planEntries = (kind, high) => (PLAN[kind]?.items || []).filter((e) => scaledCount(e, high) > 0);

const ring = (a, b) => [a, b];
const PAL = [0xffffff, 0xffa0d8, 0xa0b0ff, 0x90ecff]; // kristal renk çarpanları (mor, pembe, mavi, camgöbeği)
const ZS = [-16, -8, 0, 8, 16];
export const PLAN = {
  // 0 · Fısıldayan Orman
  forest: {
    items: [
      { id: "pine", n: 46, ring: ring(A + 1, A + 9), s: [0.95, 1.6], tint: 0x9fd0a8, gain: 1.6, tj: 0.14 },
      { id: "mushroom-glow", n: 16, ring: ring(10.5, A + 3), s: [1, 1.6], glow: { max: 3, k: 1 } },
      { id: "log", n: 6, ring: ring(12, A + 6), s: [1, 1.5] },
      { id: "grass-tuft", n: 70, ring: ring(8, A + 8), s: [1.1, 2], tint: 0xb8e0a0, tj: 0.15 },
    ],
    extra: { calls: 0, tris: 0 },
  },
  // 1 · Yarasa Mağarası
  cave: {
    items: [
      { id: "stalactite", n: 30, ring: ring(A + 0.5, A + 9), s: [0.7, 1.3], tint: 0x9fb4d0, tj: 0.1 },
      { id: "cave-crystal", n: 14, ring: ring(A + 0.5, A + 8), s: [0.8, 1.6], glow: { max: 6, k: 1.1 } },
      { id: "rock", n: 10, ring: ring(A + 0.5, A + 9), s: [0.8, 1.7], tint: 0x8aa0c0 },
      { id: "puddle", n: 7, ring: ring(8.5, A - 0.5), s: [0.9, 1.8] },
    ],
    extra: { calls: 0, tris: 0 },
  },
  // 2 · Taş Bekçiler (harabe)
  ruins: {
    items: [
      { id: "column", n: 14, ring: ring(A + 1, A + 9), s: [0.9, 1.5], tint: 0xe8c8a0 },
      { id: "arch", n: 3, ring: ring(A + 3, A + 8), s: [1, 1.3], tint: 0xe8c8a0 },
      { id: "rubble", n: 10, ring: ring(A + 1, A + 9), s: [0.9, 1.6], tint: 0xe8c8a0 },
      { id: "rock", n: 6, ring: ring(A + 1, A + 9), s: [1, 1.8], tint: 0xd8b890 },
      { id: "rune-banner", n: 6, ring: ring(A + 1, A + 6), s: [1, 1.4], glow: { max: 4, k: 1 } },
      // Taşkın heykeli: arena dışında; golems tamamlanınca (canlı Taşkın figürü çıkınca) gizlenir (scenery.js setTaskinStatue)
      { id: "taskin-statue", n: 1, fixed: [[-17, 9.5, 2.5, 1.1, -0.2]], statue: true },
    ],
    extra: { calls: 0, tris: 0 },
  },
  // 3 · Hortlak Mezarlığı
  graveyard: {
    items: [
      { id: "gravestone", n: 34, ring: ring(9.5, A + 9), s: [0.85, 1.25], tint: 0xc8d0c0, tj: 0.1 },
      { id: "grave-mound", n: 12, ring: ring(10, A + 8), s: [0.9, 1.4], tint: 0xc0b0a0 },
      { id: "iron-fence", n: 28, edge: { step: 4, off: 0.9, skip: 0.3 }, s: [0.85, 0.85] },
      { id: "dead-tree", n: 12, ring: ring(A + 1, A + 9), s: [0.9, 1.4], tint: 0xc0c0c0 },
      { id: "lamp-post", n: 1, fixed: [[-15.8, -12, 0.6, 0.9]], glow: { max: 1, k: 1 }, lamp: true },
      { id: "crypt", n: 1, fixed: [[10, -19.5, 0, 1.1]], face: true },
    ],
    extra: { calls: 0, tris: 0 },
  },
  // 4 · Donmuş Geçit
  ice: {
    items: [
      { id: "pine", n: 14, ring: ring(A + 1, A + 9), s: [0.95, 1.5], tint: 0xe8f4ff, gain: 4, tj: 0.1 },
      { id: "ice-spike", n: 28, ring: ring(A + 0.5, A + 9), s: [0.7, 1.4], tint: 0xcfe8ff, gain: 1.4, tj: 0.1 },
      { id: "ice-spike", n: 6, ring: ring(11, A), s: [0.5, 0.8], tint: 0xcfe8ff, gain: 1.4, tj: 0.1 },
      { id: "snow-mound", n: 16, ring: ring(11.5, A + 9), s: [0.9, 1.7], tint: 0xe8f0ff, gain: 1.2 },
      { id: "rock", n: 8, ring: ring(A + 1, A + 9), s: [0.9, 1.6], tint: 0xc8d8f0, gain: 1.3 },
      { id: "frozen-bridge", n: 1, fixed: [[0, -19.5, 0, 1.4]], face: true, gain: 1.2, tint: 0xe0f0ff },
    ],
    extra: { calls: 0, tris: 0 },
  },
  // 5 · Yanık Köy
  village: {
    items: [
      { id: "burnt-house", n: 5, ring: ring(A + 1.5, A + 8), s: [1, 1.3], tint: 0xd0c0b8 },
      { id: "well", n: 1, fixed: [[16.5, 6, 0.8, 1]] },
      { id: "bonfire", n: 3, ring: ring(A + 1, A + 6), s: [1, 1.3], glow: { max: 3, k: 1.2 }, fire: true },
      { id: "charred-stump", n: 10, ring: ring(A + 0.5, A + 8), s: [0.9, 1.4] },
    ],
    // 3 ateş × 2 koni + kor lekeleri 1 çizim (sprite'lar plana dahil); koni ~16 üçgen
    extra: { calls: 7, tris: 3 * 28 + 30 * 6 },
  },
  // 6 · Kristal Yatağı
  crystals: {
    items: [
      { id: "big-crystal", n: 14, ring: ring(A + 0.5, A + 9), s: [0.8, 1.5], tint: PAL, spin: true, glow: { max: 6, k: 1 } },
      { id: "crystal-shard", n: 24, ring: ring(10.5, A + 8), s: [0.8, 1.4], tint: PAL },
      { id: "rock", n: 8, ring: ring(A + 1, A + 9), s: [0.9, 1.6], tint: 0x9a90c8 },
      { id: "crystal-pillar", n: 1, fixed: [[0, -17, 0, 1.3]], glow: { max: 1, k: 1 } },
    ],
    extra: { calls: 1, tris: 2 * 14 }, // zemin parıltısı (additive dörtgenler, tek çizim)
  },
  // 7 · Kemik Kule
  tower: {
    items: [
      { id: "bone-pile", n: 12, ring: ring(10, A + 8), s: [1, 1.6], tj: 0.08 },
      { id: "rib-arch", n: 3, ring: ring(A + 2, A + 8), s: [1, 1.3] },
      { id: "dead-tree", n: 10, ring: ring(A + 1, A + 9), s: [0.9, 1.4], tint: 0xb0a8c0 },
      { id: "bone-tower", n: 1, fixed: [[-19, -18, 0, 1.5]], glow: { max: 1, k: 1 }, face: true },
    ],
    extra: { calls: 1, tris: 24 }, // zemin kırmızı rün şeritleri (tek çizim)
  },
  // 8 · Gölge Kalesi
  castle: {
    items: [
      { id: "castle-pillar", n: 10, fixed: ZS.flatMap((z) => [[-19.5, z, 0, 1.7], [19.5, z, 0, 1.7]]) },
      { id: "castle-banner", n: 10, fixed: ZS.flatMap((z) => [[-18.4, z + 4, Math.PI / 2, 1.9, 1.2], [18.4, z + 4, -Math.PI / 2, 1.9, 1.2]]) },
      { id: "castle-window", n: 5, fixed: [-12, -6, 0, 6, 12].map((x) => [x, -22.5, 0, 1.5, 0.6]) },
      { id: "throne", n: 1, fixed: [[0, -21.6, 0, 1.1]] },
      { id: "shadow-heart", n: 1, fixed: [[0, -19.5, 0, 1.3, 2.8]], heart: true, glow: { max: 1, k: 1 } },
    ],
    extra: { calls: 1, tris: 12 }, // arka duvar (tek kutu)
  },
};
export const PLAN_KINDS = Object.keys(PLAN);
