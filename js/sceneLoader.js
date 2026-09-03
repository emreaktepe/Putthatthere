export async function loadScenes() {
  const res = await fetch("data/scenes.json");
  if (!res.ok) throw new Error("Failed to load scenes.json");
  const scenes = await res.json();
  return scenes.slice().sort((a, b) => a.difficulty - b.difficulty);
}

const svgTextCache = new Map();

async function fetchSvgMarkup(path) {
  if (svgTextCache.has(path)) return svgTextCache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const text = await res.text();
  svgTextCache.set(path, text);
  return text;
}

function parseSvgInnerContent(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "svg") {
    throw new Error("Invalid SVG document");
  }
  return { viewBox: root.getAttribute("viewBox"), children: Array.from(root.children) };
}

export async function loadBackgroundMarkup(scene) {
  const text = await fetchSvgMarkup(scene.background);
  return parseSvgInnerContent(text);
}

export async function loadObjectMarkup(scene) {
  const text = await fetchSvgMarkup(scene.missingObject.art);
  return parseSvgInnerContent(text);
}
