// Yönetim sayfası: harita editörü. SVG üzerinde düğümleri (bölümler) ve yol ara noktalarını (via) Pointer Events ile sürükler;
// ok tuşlarıyla da taşınır (Shift = 1 birim, aksi 10). Yol çizgisine çift tıklayınca ara nokta eklenir.
import { svg, h } from "../core/dom.js";
import { edgeState, effectiveEdges, levelStatuses, smoothPath } from "../game/progress.js";
import { clone, ptr } from "./diff.js";

const clampN = (n, a, b) => Math.min(Math.max(n, a), b);
const round = (n) => Math.round(n);
const LABEL = { below: [0, 1.9, "middle"], above: [0, -1.75, "middle"], left: [-1.45, 0.1, "end"], right: [1.45, 0.1, "start"] };

function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? clampN(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2, 0, 1) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function mapEditor(ctx, { selected, onSelect }) {
  const cfg = () => ctx.cfg();
  let doneCount = 0, drag = null, moved = false;
  const box = h("div", { class: "mapedit" });
  const stage = h("div", { class: "map-stage-ed" });
  const info = h("p", { class: "fld-hint", "aria-live": "polite" });
  const slider = h("input", { type: "range", min: 0, max: 1, value: 0, "aria-label": "Önizleme: tamamlanan bölüm sayısı" });
  const sliderLabel = h("span", null, "Tamamlanan: 0");
  const unplaced = h("div", { class: "unplaced" });
  let root = null;

  const vb = () => { const v = cfg().map && cfg().map.viewBox; return Array.isArray(v) && v.length === 2 ? v : [1000, 700]; };
  const order = () => (cfg().campaign && Array.isArray(cfg().campaign.order) ? cfg().campaign.order.filter((id) => cfg().levels && cfg().levels[id]) : []);
  const pos = (id) => { const m = cfg().levels[id].map; return m && Number.isFinite(m.x) && Number.isFinite(m.y) ? [m.x, m.y] : null; };

  function capture(ev) { try { root.setPointerCapture(ev.pointerId); } catch (e) { /* yakalama yoksa da sürükleme çalışır */ } }
  function toSvg(e) {
    const pt = root.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(root.getScreenCTM().inverse());
    return [q.x, q.y];
  }
  function moveNode(id, x, y) {
    const [W, H] = vb();
    const old = cfg().levels[id].map || {};
    ctx.set(ptr(["levels", id, "map"]), { ...clone(old), x: round(clampN(x, 0, W)), y: round(clampN(y, 0, H)) });
  }
  function moveVia(i, j, x, y) {
    const [W, H] = vb();
    const via = clone(cfg().campaign.edges[i].via);
    via[j] = [round(clampN(x, 0, W)), round(clampN(y, 0, H))];
    ctx.set(ptr(["campaign", "edges", i, "via"]), via);
  }

  function draw() {
    const [W, H] = vb();
    const ids = order();
    const c = cfg();
    const rawEdges = c.campaign && Array.isArray(c.campaign.edges) ? c.campaign.edges : [];
    const edges = effectiveEdges(ids, rawEdges);
    const completed = new Set(ids.slice(0, doneCount));
    const st = levelStatuses(ids, edges, c.campaign && c.campaign.start, completed);
    const R = clampN((c.map && c.map.nodeRadius) || 38, 20, 48);
    const tint = /^#[0-9a-fA-F]{6}$/.test(c.map && c.map.background && c.map.background.tint) ? c.map.background.tint : "#1d1040";
    slider.max = String(ids.length);
    sliderLabel.textContent = `Tamamlanan: ${doneCount} / ${ids.length}`;

    const kids = [svg("rect", { x: 0, y: 0, width: W, height: H, fill: tint, rx: 18 })];
    const hasRaw = rawEdges.length > 0;
    edges.forEach((e, i) => {
      const a = c.levels[e.from] && pos(e.from), b = c.levels[e.to] && pos(e.to);
      if (!a || !b) return;
      const via = Array.isArray(e.via) ? e.via.filter((v) => Array.isArray(v) && v.length === 2) : [];
      const pts = [a, ...via, b];
      const state = edgeState(e, st);
      const path = svg("path", { d: via.length ? smoothPath(pts) : `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, class: "edge " + state + " " + (e.style || "dotted"), fill: "none" });
      kids.push(path);
      if (hasRaw) {
        const hit = svg("path", { d: path.getAttribute("d"), class: "edge-hit", fill: "none", "aria-hidden": "true" });
        hit.addEventListener("dblclick", (ev) => {
          const p = toSvg(ev);
          let k = 0, best = Infinity;
          for (let s = 0; s < pts.length - 1; s++) { const d = distSeg(p, pts[s], pts[s + 1]); if (d < best) { best = d; k = s; } }
          const nv = clone(rawEdges[i].via || []);
          nv.splice(k, 0, [round(p[0]), round(p[1])]);
          ctx.set(ptr(["campaign", "edges", i, "via"]), nv);
          ctx.structural();
        });
        kids.push(hit);
        (rawEdges[i].via || []).forEach((v, j) => {
          const hd = svg("circle", { cx: v[0], cy: v[1], r: 10, class: "via", tabindex: 0, role: "button", "aria-label": `Yol ${e.from} → ${e.to}, ara nokta ${j + 1}: ${v[0]}, ${v[1]}. Ok tuşlarıyla taşı, Delete ile sil` });
          hd.addEventListener("pointerdown", (ev) => { ev.preventDefault(); drag = { kind: "via", i, j }; moved = false; capture(ev); });
          hd.addEventListener("keydown", (ev) => {
            const s = ev.shiftKey ? 1 : 10, d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[ev.key];
            if (d) { ev.preventDefault(); moveVia(i, j, v[0] + d[0], v[1] + d[1]); draw(); root.querySelectorAll(".via")[viaIndex(i, j)]?.focus(); }
            if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); const nv = clone(rawEdges[i].via); nv.splice(j, 1); ctx.set(ptr(["campaign", "edges", i, "via"]), nv); ctx.structural(); }
          });
          kids.push(hd);
        });
      }
    });
    ids.forEach((id, n) => {
      const p = pos(id);
      if (!p) return;
      const L = c.levels[id];
      const status = st[id];
      const lp = LABEL[(L.map && L.map.label) || "below"] || LABEL.below;
      const g = svg("g", { class: "mnode " + status + (id === selected ? " sel" : ""), transform: `translate(${p[0]} ${p[1]})`, tabindex: 0, role: "button", "aria-label": `${n + 1}. ${L.name}: konum ${p[0]}, ${p[1]}. Seçmek için Enter, taşımak için ok tuşları`, "aria-pressed": id === selected ? "true" : "false", "data-id": id },
        svg("circle", { r: R, class: "disc" }),
        svg("text", { class: "ic", "text-anchor": "middle", "dominant-baseline": "central", "font-size": R * 0.9 }, (L.map && L.map.icon) || "●"),
        svg("circle", { class: "numbg", cx: -R * 0.72, cy: -R * 0.72, r: R * 0.38 }),
        svg("text", { class: "num", x: -R * 0.72, y: -R * 0.72, "text-anchor": "middle", "dominant-baseline": "central", "font-size": R * 0.42 }, String(n + 1)),
        svg("text", { class: "lbl", x: lp[0] * R, y: lp[1] * R, "text-anchor": lp[2], "font-size": 22 }, L.name));
      g.addEventListener("pointerdown", (ev) => { ev.preventDefault(); drag = { kind: "node", id, off: [ev.clientX, ev.clientY] }; moved = false; capture(ev); });
      g.addEventListener("keydown", (ev) => {
        const s = ev.shiftKey ? 1 : 10, d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[ev.key];
        if (d) { ev.preventDefault(); moveNode(id, p[0] + d[0], p[1] + d[1]); draw(); root.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus(); }
        else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(id); }
      });
      kids.push(g);
    });
    if (!root) {
      root = svg("svg", { class: "mapsvg", role: "group", "aria-label": "Harita editörü" });
      root.addEventListener("pointermove", (ev) => {
        if (!drag) return;
        const p = toSvg(ev);
        if (drag.kind === "node") { if (Math.hypot(ev.clientX - drag.off[0], ev.clientY - drag.off[1]) > 3) moved = true; if (moved) { moveNode(drag.id, p[0], p[1]); draw(); } } else { moved = true; moveVia(drag.i, drag.j, p[0], p[1]); draw(); }
      });
      const end = () => { const d = drag, m = moved; drag = null; moved = false; if (!d) return; if (d.kind === "node" && !m) onSelect(d.id); else if (m) ctx.structural(); };
      root.addEventListener("pointerup", end);
      root.addEventListener("pointercancel", end);
      stage.append(root);
    }
    root.setAttribute("viewBox", `0 0 ${W} ${H}`);
    root.replaceChildren(...kids);

    const missing = ids.filter((id) => !pos(id));
    unplaced.replaceChildren(...(missing.length ? [h("span", null, "Haritada konumu olmayanlar: "), ...missing.map((id) => h("button", { class: "mini", type: "button", onclick: () => { moveNode(id, W / 2, H / 2); ctx.structural(); } }, `${c.levels[id].name} → yerleştir`))] : []));
    info.textContent = `Düğümü sürükleyin (ya da odaklanıp ok tuşları). Yol çizgisine çift tıklayınca ara nokta eklenir; ara noktayı sürükleyin, Delete ile silin. Görünüm kutusu ${W}×${H}.`;
  }
  function viaIndex(i, j) { let k = 0; const raw = cfg().campaign.edges; for (let a = 0; a < i; a++) k += (raw[a].via || []).length; return k + j; }

  slider.addEventListener("input", () => { doneCount = Number(slider.value); draw(); });
  ctx.hooks.add(() => { if (!drag) draw(); });
  box.append(h("div", { class: "map-tools" }, h("label", null, sliderLabel, slider)), stage, info, unplaced);
  draw();
  return box;
}
