import * as THREE from "three";

const cache = new Map();

function canvas2d(size = 256) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
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

const TEXTURE_FACTORIES = {
  asphalt: asphaltTexture,
  concrete: concreteTexture,
  paving: pavingTexture,
  hallwayFloor: hallwayFloorTexture,
  tactile: tactileTexture,
  accessibleSymbol: accessibleSymbolTexture,
  exitSign: () => exitSignTexture("ÇIKIŞ"),
  stationSign: () => stationSignTexture("M2"),
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
