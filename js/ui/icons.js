// Tek tip satır içi SVG ikon kümesi (harici dosya yok). Hepsi 24x24 görünüm kutusunda; renk CSS'ten (currentColor) gelir.
import { svg } from "../core/dom.js";

const FILL = { fill: "currentColor" };
const LINE = { fill: "none", stroke: "currentColor", "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" };
const ICONS = {
  heart: [FILL, "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2.1 0 3.8 1.2 5.6 3.3 1.8-2.1 3.5-3.3 5.6-3.3 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z"],
  crystal: [FILL, "M12 1.5l6.2 7L12 22.5 5.8 8.5z", "M5.8 8.5h12.4M12 1.5v21"],
  hourglass: [FILL, "M6 2h12v4.5L13.2 12l4.8 5.5V22H6v-4.5l4.8-5.5L6 6.5z"],
  star: [FILL, "M12 2l3.1 6.4 7 1-5.1 4.9 1.2 7L12 17.9 5.8 21.3 7 14.3 1.9 9.4l7-1z"],
  lock: [FILL, "M7 10.5V7.5a5 5 0 0110 0v3h1.5V22h-13V10.5zm2.2 0h5.6V7.5a2.8 2.8 0 00-5.6 0z"],
  check: [LINE, "M4.5 12.5l5 5L19.5 6.5"],
  shield: [FILL, "M12 2l8.2 3v6.2c0 5.2-3.5 9.3-8.2 10.8-4.7-1.5-8.2-5.6-8.2-10.8V5z"],
  target: [LINE, "M12 3a9 9 0 100 18 9 9 0 000-18zm0 5a4 4 0 100 8 4 4 0 000-8z"],
  back: [LINE, "M15 5l-7 7 7 7"],
  sound: [LINE, "M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"],
  play: [FILL, "M7 4.5v15l12.5-7.5z"],
  skip: [LINE, "M5 5l9 7-9 7zM18 5v14"],
};
export function icon(name, cls = "") {
  const [attrs, ...paths] = ICONS[name] || ICONS.star;
  return svg("svg", { viewBox: "0 0 24 24", class: "ic ic-" + name + (cls ? " " + cls : ""), "aria-hidden": "true", focusable: "false" }, ...paths.map((d) => svg("path", { d, ...attrs })));
}
export const ICON_PATHS = ICONS;
