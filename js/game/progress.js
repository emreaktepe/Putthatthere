// Harita/ilerleme mantığı (docs/mimari §7.2). Saf: DOM ve Three.js'e dokunmaz, Node'da test edilir.
// Bölüm durumu SAKLANMAZ, türetilir: completed (kayıttan) | available (başlangıç ya da giriş kenarının kaynağı tamam) | locked.

// Kenar listesi: config'te yoksa (ya da boşsa) bölüm sırasından doğrusal zincir üretilir.
export function effectiveEdges(order, edges) {
  if (Array.isArray(edges) && edges.length) return edges.map((e) => ({ from: e.from, to: e.to, via: Array.isArray(e.via) ? e.via : [], style: e.style || "dotted" }));
  return order.slice(1).map((to, i) => ({ from: order[i], to, via: [], style: "dotted" }));
}

export function levelStatuses(order, edges, start, completed) {
  const done = completed instanceof Set ? completed : new Set(completed);
  const st = {};
  const first = start || order[0];
  for (const id of order) {
    if (done.has(id)) st[id] = "completed";
    else if (id === first || edges.some((e) => e.to === id && done.has(e.from))) st[id] = "available";
    else st[id] = "locked";
  }
  return st;
}

// oynanacak sıradaki bölüm: tamamlanmamış ilk açık bölüm (hepsi tamamsa null)
export const currentLevelId = (order, statuses) => order.find((id) => statuses[id] === "available") || null;

// kenar görünümü: done (iki ucu tamam) | open (tamam bölümden açılan yola) | locked
export function edgeState(edge, statuses) {
  if (statuses[edge.from] === "completed") return statuses[edge.to] === "completed" ? "done" : "open";
  return "locked";
}

// Catmull-Rom -> kübik Bezier. pts: [[x,y], ...] (en az 2 nokta) -> SVG yol verisi
export function smoothPath(pts, tension = 0.5) {
  const r = (n) => Math.round(n * 10) / 10;
  if (pts.length < 2) return "";
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const k = tension / 3 * 2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2];
    d += ` C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}

// Dikey telefon için türetilmiş yerleşim (config'e bağlı değil): yukarıdan aşağıya yılan eğrisi, görünüm kutusu 400 x H.
// Bölüm 1 altta olsun diye (oyun yukarı doğru ilerler) sıra tersine dizilir.
export function portraitLayout(n, W = 400, step = 130, pad = 90) {
  const H = pad * 2 + step * Math.max(n - 1, 0);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    pts.push({ x: W / 2 + side * 95, y: H - pad - i * step });
  }
  return { W, H, pts };
}

// Config'te harita konumu olmayan bölümler için yatay yılan yerleşimi (3 satır)
export function serpentineLayout(n, W = 1000, H = 700, pad = 120) {
  const rows = 3, per = Math.ceil(n / rows), pts = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / per), col = i % per, dir = row % 2 === 0 ? col : per - 1 - col;
    pts.push({ x: pad + (per > 1 ? (dir * (W - pad * 2)) / (per - 1) : (W - pad * 2) / 2), y: H - pad - row * ((H - pad * 2) / (rows - 1)) });
  }
  return pts;
}

// Yön ipucu: kenar için varsayılan orta nokta (config'te via yoksa hafif kıvrım verir)
export function defaultVia(a, b, sign = 1) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  return [[mx - (dy / len) * 26 * sign, my + (dx / len) * 26 * sign]];
}

// Alıştırma donanımı (docs §7.3 "kit"): o bölümden ÖNCEKİ bölümlerin ödüllerinden türetilir; perk yok.
// levels: adapt çıktısı LEVELS (reward/ability alanları), index: alıştırılacak bölümün dizini.
export function practiceKit(levels, index, weaponOrder) {
  const unlocked = [weaponOrder[0]], abilities = [];
  for (let i = 0; i < index; i++) {
    const L = levels[i];
    if (L.reward && !unlocked.includes(L.reward)) unlocked.push(L.reward);
    if (L.ability && !abilities.includes(L.ability)) abilities.push(L.ability);
  }
  return { unlocked, abilities, weapon: unlocked[0] };
}

// En iyi sonucu günceller (yeni nesne döner). time: kalan saniye (yüksek = iyi), score: bölüm puanı
export function recordBest(best, id, { score, time }) {
  const prev = best.levels[id] || { score: 0, time: 0 };
  return { score: best.score, levels: { ...best.levels, [id]: { score: Math.max(prev.score, Math.floor(score)), time: Math.max(prev.time, Math.floor(time)) } } };
}
