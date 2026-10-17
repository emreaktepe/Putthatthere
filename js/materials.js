import * as THREE from "three";

const cache = new Map();

function canvas2d(size = 256, height = size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = height;
  return { c, ctx: c.getContext("2d") };
}

function finishTexture(canvas, repeat = [1, 1]) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  return tex;
}

/** Fine-grained noise, the base of every believable surface. */
function grain(ctx, size, amount, alpha) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    d[i + 3] = alpha ?? d[i + 3];
  }
  ctx.putImageData(img, 0, 0);
}

function asphaltTexture() {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#3a3d42";
  ctx.fillRect(0, 0, 256, 256);
  // scattered aggregate
  for (let i = 0; i < 2600; i++) {
    const v = 40 + Math.random() * 70;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + Math.random() * 0.4})`;
    const r = Math.random() * 1.9;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, 256, 26);
  return finishTexture(c, [10, 10]);
}

function concreteTexture() {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#8d8f8c";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const v = 120 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v},${v - 4},${0.15 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, 256, 16);
  return finishTexture(c, [6, 6]);
}

/** Platform paving: concrete with slab joints. */
function pavingTexture() {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#9a9c97";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = 130 + Math.random() * 55;
    ctx.fillStyle = `rgba(${v},${v},${v - 6},${0.12 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(70,72,70,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();
  grain(ctx, 256, 14);
  return finishTexture(c, [8, 12]);
}

/** Indoor floor: light polished tiles with grout lines. */
function hallwayFloorTexture() {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#c9c6bf";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(120,118,112,0.7)";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 256, 256);
  grain(ctx, 256, 12);
  return finishTexture(c, [8, 22]);
}

/** Yellow tactile warning strip with truncated domes. */
function tactileTexture() {
  const { c, ctx } = canvas2d(128);
  ctx.fillStyle = "#e0b13a";
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const cx = 16 + x * 32;
      const cy = 16 + y * 32;
      const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 11);
      g.addColorStop(0, "#f6d47a");
      g.addColorStop(1, "#b8862b");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  grain(ctx, 128, 10);
  return finishTexture(c, [1, 20]);
}

/** International Symbol of Accessibility, painted on tarmac. */
function accessibleSymbolTexture() {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#1f4f9c";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";

  // head
  ctx.beginPath();
  ctx.arc(104, 60, 21, 0, Math.PI * 2);
  ctx.fill();
  // torso / back
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(112, 90);
  ctx.lineTo(126, 140);
  ctx.stroke();
  // wheel
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.arc(132, 165, 56, 0, Math.PI * 2);
  ctx.stroke();
  // thigh + lower leg
  ctx.lineWidth = 19;
  ctx.beginPath();
  ctx.moveTo(126, 140);
  ctx.lineTo(186, 148);
  ctx.lineTo(196, 200);
  ctx.stroke();
  // arm pushing the rim
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(118, 108);
  ctx.lineTo(178, 118);
  ctx.stroke();

  return finishTexture(c, [1, 1]);
}

function exitSignTexture(label) {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#1c7a45";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 118);
  // arrow
  ctx.beginPath();
  ctx.moveTo(70, 178);
  ctx.lineTo(160, 178);
  ctx.lineTo(160, 160);
  ctx.lineTo(196, 190);
  ctx.lineTo(160, 220);
  ctx.lineTo(160, 200);
  ctx.lineTo(70, 200);
  ctx.closePath();
  ctx.fill();
  return finishTexture(c, [1, 1]);
}

function stationSignTexture(label) {
  const { c, ctx } = canvas2d(256);
  ctx.fillStyle = "#0f2f6b";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 128);
  return finishTexture(c, [1, 1]);
}

/** Dark speckled granite slabs, 1 m per slab (canvas = 2 x 2 slabs). */
function graniteTexture() {
  const { c, ctx } = canvas2d(512);
  ctx.fillStyle = "#6b6d70";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const v = 70 + Math.random() * 110;
    ctx.fillStyle = `rgba(${v},${v},${v + 3},${0.2 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // slab tone variation
  for (const [x, y] of [[0, 0], [256, 0], [0, 256], [256, 256]]) {
    const t = Math.random() * 0.1;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${t})` : `rgba(0,0,0,${t})`;
    ctx.fillRect(x, y, 256, 256);
  }
  ctx.strokeStyle = "rgba(25,26,28,0.85)";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();
  grain(ctx, 512, 14);
  return finishTexture(c, [1, 1]);
}

/** Glazed wall tiles, 0.25 x 0.125 m, canvas covers 1 x 1 m. */
function wallTileTexture() {
  const { c, ctx } = canvas2d(512);
  ctx.fillStyle = "#cfd3d4";
  ctx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const v = 196 + Math.random() * 18;
      ctx.fillStyle = `rgb(${v},${v + 3},${v + 4})`;
      ctx.fillRect(col * 128 + 2, row * 64 + 2, 124, 60);
      const g = ctx.createLinearGradient(0, row * 64, 0, row * 64 + 64);
      g.addColorStop(0, "rgba(255,255,255,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = g;
      ctx.fillRect(col * 128 + 2, row * 64 + 2, 124, 60);
    }
  }
  grain(ctx, 512, 8);
  return finishTexture(c, [1, 1]);
}

/** Wide station name board: M2 badge plus the station name. */
function stationNameTexture() {
  const { c, ctx } = canvas2d(1024, 256);
  const w = 1024;
  const h = 256;
  ctx.fillStyle = "#f4f4f1";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#0f2f6b";
  ctx.fillRect(0, 0, w, 22);
  ctx.fillRect(0, h - 22, w, 22);
  ctx.fillStyle = "#1c9a57";
  ctx.beginPath();
  ctx.arc(150, 128, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 84px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M2", 150, 132);
  ctx.fillStyle = "#14233f";
  ctx.font = "bold 120px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TAKSİM", 290, 118);
  ctx.font = "34px sans-serif";
  ctx.fillStyle = "#4a5568";
  ctx.fillText("Hacıosman  ·  Yenikapı", 294, 200);
  return finishTexture(c, [1, 1]);
}

/** Direction board with arrows for both ends of the line. */
function directionSignTexture() {
  const { c, ctx } = canvas2d(1024, 256);
  const w = 1024;
  const h = 256;
  ctx.fillStyle = "#0f2f6b";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1c9a57";
  ctx.beginPath();
  ctx.arc(110, 128, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 66px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M2", 110, 132);
  ctx.font = "bold 62px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("←  Yenikapı", 220, 84);
  ctx.fillText("Hacıosman  →", 220, 176);
  return finishTexture(c, [1, 1]);
}

/** Schematic line map board. */
function lineMapTexture() {
  const { c, ctx } = canvas2d(512);
  ctx.fillStyle = "#f4f4f1";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#0f2f6b";
  ctx.fillRect(0, 0, 512, 70);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M2 HAT HARİTASI", 256, 36);
  ctx.strokeStyle = "#1c9a57";
  ctx.lineWidth = 14;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(50, 400);
  ctx.lineTo(170, 400);
  ctx.lineTo(250, 300);
  ctx.lineTo(250, 190);
  ctx.lineTo(460, 190);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#14233f";
  ctx.lineWidth = 5;
  for (const [x, y] of [[50, 400], [170, 400], [250, 300], [250, 190], [360, 190], [460, 190]]) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(250, 300, 7, 0, Math.PI * 2);
  ctx.fill();
  grain(ctx, 512, 6);
  return finishTexture(c, [1, 1]);
}

/** Backlit advertising poster: abstract colour blocks, no real brands. */
function adPosterTexture() {
  const { c, ctx } = canvas2d(256);
  const g = ctx.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, "#e8a33d");
  g.addColorStop(1, "#c0562f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(128, 100, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("YAZ GELDİ", 128, 214);
  return finishTexture(c, [1, 1]);
}

const TEXTURE_FACTORIES = {
  asphalt: asphaltTexture,
  concrete: concreteTexture,
  paving: pavingTexture,
  hallwayFloor: hallwayFloorTexture,
  tactile: tactileTexture,
  accessibleSymbol: accessibleSymbolTexture,
  exitSign: () => exitSignTexture("ÇIKIŞ"),
  stationSign: () => stationSignTexture("M2"),
  granite: graniteTexture,
  wallTile: wallTileTexture,
  stationName: stationNameTexture,
  directionSign: directionSignTexture,
  lineMap: lineMapTexture,
  adPoster: adPosterTexture,
};

export function texture(name) {
  const key = `tex:${name}`;
  if (!cache.has(key)) cache.set(key, TEXTURE_FACTORIES[name]());
  return cache.get(key);
}

/** Shared PBR materials. Cached so repeated scene loads stay cheap. */
export function material(name) {
  const key = `mat:${name}`;
  if (cache.has(key)) return cache.get(key);

  let mat;
  switch (name) {
    case "asphalt":
      mat = new THREE.MeshStandardMaterial({ map: texture("asphalt"), roughness: 0.96, metalness: 0 });
      break;
    case "concrete":
      mat = new THREE.MeshStandardMaterial({ map: texture("concrete"), roughness: 0.92, metalness: 0 });
      break;
    case "paving":
      mat = new THREE.MeshStandardMaterial({ map: texture("paving"), roughness: 0.9, metalness: 0 });
      break;
    case "hallwayFloor":
      mat = new THREE.MeshStandardMaterial({ map: texture("hallwayFloor"), roughness: 0.45, metalness: 0.02 });
      break;
    case "tactile":
      mat = new THREE.MeshStandardMaterial({ map: texture("tactile"), roughness: 0.72, metalness: 0 });
      break;
    case "accessibleSymbol":
      mat = new THREE.MeshStandardMaterial({ map: texture("accessibleSymbol"), roughness: 0.8, metalness: 0 });
      break;
    case "exitSign":
      mat = new THREE.MeshStandardMaterial({
        map: texture("exitSign"),
        emissive: new THREE.Color("#2fa262"),
        emissiveMap: texture("exitSign"),
        emissiveIntensity: 0.7,
        roughness: 0.6,
      });
      break;
    case "stationSign":
      mat = new THREE.MeshStandardMaterial({
        map: texture("stationSign"),
        emissive: new THREE.Color("#264f96"),
        emissiveMap: texture("stationSign"),
        emissiveIntensity: 0.4,
        roughness: 0.6,
      });
      break;
    case "paint":
      mat = new THREE.MeshStandardMaterial({ color: "#e8e9e6", roughness: 0.78, metalness: 0 });
      break;
    case "paintWorn":
      mat = new THREE.MeshStandardMaterial({ color: "#cdd0ca", roughness: 0.85, metalness: 0 });
      break;
    case "curb":
      mat = new THREE.MeshStandardMaterial({ color: "#a3a49f", roughness: 0.9, metalness: 0 });
      break;
    case "wallPaint":
      mat = new THREE.MeshStandardMaterial({ color: "#dfdcd4", roughness: 0.85, metalness: 0 });
      break;
    case "wallTiled":
      mat = new THREE.MeshStandardMaterial({ color: "#b9bcbd", roughness: 0.55, metalness: 0.05 });
      break;
    case "ceiling":
      mat = new THREE.MeshStandardMaterial({ color: "#eceae4", roughness: 0.9, metalness: 0 });
      break;
    case "darkMetal":
      mat = new THREE.MeshStandardMaterial({ color: "#4a4e55", roughness: 0.5, metalness: 0.6 });
      break;
    case "steel":
      mat = new THREE.MeshStandardMaterial({ color: "#9aa0a6", roughness: 0.35, metalness: 0.8 });
      break;
    case "rail":
      mat = new THREE.MeshStandardMaterial({ color: "#7d7f83", roughness: 0.3, metalness: 0.9 });
      break;
    case "ballast":
      mat = new THREE.MeshStandardMaterial({ color: "#2b2d30", roughness: 1, metalness: 0 });
      break;
    case "extinguisherRed":
      mat = new THREE.MeshStandardMaterial({ color: "#b8231f", roughness: 0.35, metalness: 0.25 });
      break;
    case "glass":
      mat = new THREE.MeshStandardMaterial({
        color: "#8fb8cc",
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.45,
      });
      break;
    case "lampLit":
      mat = new THREE.MeshStandardMaterial({
        color: "#fffaf0",
        emissive: new THREE.Color("#fff4dc"),
        emissiveIntensity: 1.4,
        roughness: 0.4,
      });
      break;
    case "wood":
      mat = new THREE.MeshStandardMaterial({ color: "#8a6540", roughness: 0.8, metalness: 0 });
      break;
    case "granite":
      mat = new THREE.MeshStandardMaterial({ map: texture("granite"), roughness: 0.45, metalness: 0.05 });
      break;
    case "wallTile":
      mat = new THREE.MeshStandardMaterial({ map: texture("wallTile"), roughness: 0.35, metalness: 0.05 });
      break;
    case "paintYellow":
      mat = new THREE.MeshStandardMaterial({ color: "#f2c200", roughness: 0.7, metalness: 0 });
      break;
    case "m2Green":
      mat = new THREE.MeshStandardMaterial({ color: "#1c9a57", roughness: 0.5, metalness: 0 });
      break;
    case "tunnel":
      mat = new THREE.MeshStandardMaterial({ color: "#1b1d20", roughness: 1, metalness: 0 });
      break;
    case "tunnelVoid":
      mat = new THREE.MeshBasicMaterial({ color: "#000000" });
      break;
    case "signalRed":
      mat = new THREE.MeshStandardMaterial({ color: "#d42a22", emissive: new THREE.Color("#ff2a1f"), emissiveIntensity: 1.2, roughness: 0.4 });
      break;
    case "signalGreen":
      mat = new THREE.MeshStandardMaterial({ color: "#22c55e", emissive: new THREE.Color("#22c55e"), emissiveIntensity: 1.2, roughness: 0.4 });
      break;
    case "railCover":
      mat = new THREE.MeshStandardMaterial({ color: "#e0b400", roughness: 0.6, metalness: 0 });
      break;
    case "panelLit":
      mat = new THREE.MeshStandardMaterial({ color: "#fffaf0", emissive: new THREE.Color("#fff4dc"), emissiveIntensity: 1.6, roughness: 0.4 });
      break;
    case "binGreen":
      mat = new THREE.MeshStandardMaterial({ color: "#2f5d3a", roughness: 0.6, metalness: 0.2 });
      break;
    case "stationName":
    case "directionSign":
    case "adPoster":
      mat = new THREE.MeshStandardMaterial({
        map: texture(name),
        emissive: new THREE.Color("#ffffff"),
        emissiveMap: texture(name),
        emissiveIntensity: name === "adPoster" ? 0.45 : 0.28,
        roughness: 0.6,
      });
      break;
    case "lineMap":
      mat = new THREE.MeshStandardMaterial({ map: texture("lineMap"), roughness: 0.5, metalness: 0 });
      break;
    case "foliage":
      mat = new THREE.MeshStandardMaterial({ color: "#4f7a43", roughness: 1, metalness: 0 });
      break;
    default:
      mat = new THREE.MeshStandardMaterial({ color: "#9aa0a6", roughness: 0.8 });
  }
  cache.set(key, mat);
  return mat;
}

/** Solid coloured car paint, one cached material per colour. */
export function carPaint(color) {
  const key = `car:${color}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.55 }));
  }
  return cache.get(key);
}
