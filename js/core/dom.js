// Güvenli DOM yardımcıları. Konfigürasyondan gelen HER metin güvenilmez sayılır (docs/mimari §10.1):
//  - metin yalnızca textContent/createTextNode ile basılır; `innerHTML` bu projede KULLANILMAZ (tests/security.test.js denetler),
//  - kalın vurgu için tek güvenli işaretleme: **kalın**. Yer tutucular {ad} belirteçlendikten SONRA metin olarak doldurulur,
//    yani değişken değerleri işaretleme olarak yorumlanamaz. Satır sonu \n -> <br>. Başka hiçbir işaretleme yok.
// Düğüm kuran işlevler çağrıldıkları anda `document` kullanır (modülü içe aktarmak DOM gerektirmez; Node'da parseRich/fmt test edilir).


const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const HEX = /^#[0-9a-fA-F]{6}$/;
export const safeHex = (s) => (typeof s === "string" && HEX.test(s) ? s : null);

// "{n}" yer tutucularını düz metin olarak doldurur (işaretleme çözümlemez)
export function fmt(tpl, vars = {}) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (own(vars, k) ? String(vars[k]) : m));
}

// -> [{ k: "text"|"b"|"br", v? }]
export function parseRich(tpl, vars = {}) {
  const out = [];
  String(tpl).split("\n").forEach((line, li) => {
    if (li) out.push({ k: "br" });
    let last = 0;
    for (const m of line.matchAll(/\*\*([^*]+?)\*\*/g)) {
      if (m.index > last) out.push({ k: "text", v: fmt(line.slice(last, m.index), vars) });
      out.push({ k: "b", v: fmt(m[1], vars) });
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push({ k: "text", v: fmt(line.slice(last), vars) });
  });
  return out;
}

export function append(parent, children) {
  for (const c of [children].flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    parent.append(typeof c === "object" && "nodeType" in c ? c : document.createTextNode(String(c)));
  }
  return parent;
}

// h("button", { class: "gbtn", onclick: fn, style: { color: "#fff" } }, "Metin", altDüğüm)
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") { for (const [p, x] of Object.entries(v)) el.style.setProperty(p, String(x)); }
      else if (k.startsWith("on")) { if (typeof v === "function") el.addEventListener(k.slice(2), v); }
      else el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  return append(el, children);
}

// SVG düğümü kurucusu (h ile aynı kalıp; öznitelikler setAttribute ile, metin textContent ile — ham işaretleme yok)
const SVG_NS = "http://www.w3.org/2000/svg";
export function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith("on")) { if (typeof v === "function") el.addEventListener(k.slice(2), v); } else el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  return append(el, children);
}

export const br = () => document.createElement("br");

// güvenli işaretlemeli metin -> DocumentFragment
export function rich(tpl, vars) {
  const f = document.createDocumentFragment();
  for (const t of parseRich(tpl, vars)) {
    if (t.k === "br") f.append(br());
    else if (t.k === "b") f.append(h("b", null, t.v));
    else f.append(document.createTextNode(t.v));
  }
  return f;
}

// anlatı satırları [{speaker?, color?, text}] -> düğümler (satır arası <br>). Konuşmacı adı kalın, rengi doğrulanmış hex.
export function dialog(lines) {
  const out = [];
  lines.forEach((l, i) => {
    if (i) out.push(br());
    if (l.speaker) {
      const c = safeHex(l.color);
      out.push(h("b", c ? { style: { color: c } } : null, l.speaker + ":"), " ");
    }
    out.push(rich(l.text));
  });
  return out;
}

export const clear = (el) => el.replaceChildren();
