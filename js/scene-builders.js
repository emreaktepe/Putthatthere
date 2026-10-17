import * as THREE from "three";
import { material, texture, carPaint } from "./materials.js";

const DEG = Math.PI / 180;

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function ground(w, d, mat, y = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -90 * DEG;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(r, h, mat, x = 0, y = 0, z = 0, segments = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Flat painted marking that sits just above a surface without z-fighting. */
function marking(w, d, mat, x, z, y = 0.006) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -90 * DEG;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

function person(color, x, z, facing = 0) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: "#b98d6f", roughness: 0.9 });
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 10), material("darkMetal"));
  legs.position.y = 0.45;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 12), bodyMat);
  torso.position.y = 1.06;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), skinMat);
  head.position.y = 1.47;
  for (const m of [legs, torso, head]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  g.position.set(x, 0, z);
  g.rotation.y = facing;
  return g;
}

function car(color, x, z, facing = 0) {
  const g = new THREE.Group();
  const paint = carPaint(color);
  const body = box(1.82, 0.62, 4.3, paint, 0, 0.62, 0);
  const cabin = box(1.66, 0.55, 2.2, paint, 0, 1.16, -0.15);
  const glass = box(1.68, 0.4, 2.0, material("glass"), 0, 1.2, -0.15);
  g.add(body, cabin, glass);
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16);
  for (const [wx, wz] of [[0.86, 1.4], [-0.86, 1.4], [0.86, -1.4], [-0.86, -1.4]]) {
    const wheel = new THREE.Mesh(wheelGeo, material("ballast"));
    wheel.rotation.z = 90 * DEG;
    wheel.position.set(wx, 0.33, wz);
    wheel.castShadow = true;
    g.add(wheel);
  }
  g.position.set(x, 0, z);
  g.rotation.y = facing;
  return g;
}

function lampPost(x, z, height = 4.5) {
  const g = new THREE.Group();
  g.add(cylinder(0.07, height, material("darkMetal"), 0, height / 2, 0, 10));
  const head = box(0.5, 0.14, 0.28, material("lampLit"), 0, height, 0.2);
  g.add(head);
  const light = new THREE.PointLight(0xffe9c4, 6, 14, 2);
  light.position.set(0, height - 0.2, 0.2);
  g.add(light);
  g.position.set(x, 0, z);
  return g;
}

function signOnPost(x, z, texName, height, signW, signH) {
  const g = new THREE.Group();
  g.add(cylinder(0.04, height, material("steel"), 0, height / 2, 0, 10));
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(signW, signH),
    new THREE.MeshStandardMaterial({ map: texture(texName), roughness: 0.6, side: THREE.DoubleSide })
  );
  plate.position.set(0, height, 0.03);
  plate.castShadow = true;
  g.add(plate);
  g.position.set(x, 0, z);
  return g;
}

/* ------------------------------------------------------------------ */
/* Environments                                                        */
/* ------------------------------------------------------------------ */

/* Station volume (metres): platform x -6..3 (edge at +3), tracks to x 9.4,
   hall z -11..11, floor y 0, track bed y -1.1, ceiling y 4.8. */
const STATION = { xBack: -6, xFar: 9.4, zHalf: 11, yBed: -1.1, yTop: 4.8 };

/** Inward-facing flat wall; UVs are scaled so one texture tile covers `tile` metres. */
function wallPlane(w, h, mat, tile = 1) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function put(mesh, x, y, z, ry = 0, rx = 0) {
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, 0);
  return mesh;
}

/** Static scenery that should not cast shadows (structure, track, fixtures). */
function still(mesh) {
  mesh.castShadow = false;
  return mesh;
}

function bench(x, z) {
  const b = new THREE.Group();
  b.add(box(0.5, 0.08, 1.8, material("wood"), 0, 0.45, 0));
  b.add(box(0.06, 0.4, 1.8, material("wood"), -0.22, 0.72, 0));
  b.add(box(0.44, 0.42, 0.1, material("steel"), 0, 0.22, -0.75));
  b.add(box(0.44, 0.42, 0.1, material("steel"), 0, 0.22, 0.75));
  b.position.set(x, 0, z);
  return b;
}

function trashBin(x, z) {
  const b = new THREE.Group();
  b.add(cylinder(0.22, 0.8, material("binGreen"), 0, 0.4, 0, 16));
  b.add(cylinder(0.24, 0.06, material("darkMetal"), 0, 0.83, 0, 16));
  b.position.set(x, 0, z);
  return b;
}

/** Framed board mounted on a wall facing +x (ry = 90deg) or -x (ry = -90deg). */
function wallBoard(x, y, z, w, h, matName, ry) {
  const g = new THREE.Group();
  const dir = ry > 0 ? 1 : -1;
  g.add(still(put(box(0.05, h + 0.1, w + 0.1, material("darkMetal")), x + dir * 0.025, y, z)));
  g.add(put(new THREE.Mesh(new THREE.PlaneGeometry(w, h), material(matName)), x + dir * 0.055, y, z, ry));
  return g;
}

function metroPlatform() {
  const g = new THREE.Group();
  const { xBack, xFar, zHalf, yBed, yTop } = STATION;
  const hallH = yTop - yBed;
  const hallMidY = (yTop + yBed) / 2;
  const tunnelZ = 16.3; // tunnel stub depth beyond the end walls
  const trackLen = tunnelZ * 2;

  /* platform: granite floor over a concrete slab, edge at x = +3 */
  g.add(still(box(9, 1.096, zHalf * 2, material("concrete"), -1.5, -0.552, 0)));
  g.add(put(wallPlane(9, zHalf * 2, material("granite"), 2), -1.5, 0, 0, 0, -90 * DEG));
  g.add(marking(0.1, zHalf * 2, material("paintYellow"), 2.94, 0, 0.008));

  /* track bed, sleepers, running rails, third rail */
  g.add(still(box(6.4, 0.5, trackLen, material("ballast"), 6.2, yBed - 0.25, 0)));
  const sleeperCount = Math.floor(trackLen / 0.65);
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.16, 0.26), material("concrete"), sleeperCount);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < sleeperCount; i++) {
    m4.setPosition(5.42, yBed + 0.08, -trackLen / 2 + 0.4 + i * 0.65);
    sleepers.setMatrixAt(i, m4);
  }
  sleepers.receiveShadow = true;
  g.add(sleepers);
  for (const rx of [4.7, 6.135]) g.add(still(box(0.07, 0.17, trackLen, material("rail"), rx, yBed + 0.245, 0)));
  // third rail with its protective cover band
  g.add(still(box(0.1, 0.1, trackLen, material("rail"), 7.0, yBed + 0.35, 0)));
  g.add(still(box(0.16, 0.025, trackLen, material("railCover"), 7.0, yBed + 0.412, 0)));
  // cable tray along the far wall
  g.add(still(box(0.2, 0.12, zHalf * 2, material("darkMetal"), xFar - 0.12, -0.3, 0)));

  /* enclosure: back wall, far wall, ceiling */
  const tiles = material("wallTile");
  g.add(put(wallPlane(zHalf * 2, hallH, tiles), xBack, hallMidY, 0, 90 * DEG));
  g.add(put(wallPlane(zHalf * 2, hallH, tiles), xFar, hallMidY, 0, -90 * DEG));
  g.add(put(wallPlane(xFar - xBack, zHalf * 2, material("ceiling"), 2), (xFar + xBack) / 2, yTop, 0, 0, 90 * DEG));
  // green M2 line stripe on both long walls
  g.add(still(box(0.03, 0.22, zHalf * 2, material("m2Green"), xBack + 0.015, 1.3, 0)));
  g.add(still(box(0.03, 0.22, zHalf * 2, material("m2Green"), xFar - 0.015, 1.3, 0)));

  /* end walls with a tunnel mouth over the tracks (x 3.5..7.4, up to y 3.2) */
  const mouthL = 3.5;
  const mouthR = 7.4;
  const mouthTop = 3.2;
  const voidMat = material("tunnelVoid");
  voidMat.side = THREE.DoubleSide;
  for (const s of [-1, 1]) {
    const ry = s < 0 ? 0 : 180 * DEG;
    const wz = s * zHalf;
    g.add(put(wallPlane(mouthL - xBack, hallH, tiles), (xBack + mouthL) / 2, hallMidY, wz, ry));
    g.add(put(wallPlane(mouthR - mouthL, yTop - mouthTop, tiles), (mouthL + mouthR) / 2, (yTop + mouthTop) / 2, wz, ry));
    g.add(put(wallPlane(xFar - mouthR, hallH, tiles), (mouthR + xFar) / 2, hallMidY, wz, ry));
    // dark tunnel stub: liner, roof and a black end cap so nothing outside is ever visible
    const stubLen = tunnelZ - zHalf;
    const mid = s * (zHalf + stubLen / 2);
    const stubH = mouthTop - yBed;
    g.add(still(box(0.2, stubH, stubLen, material("tunnel"), mouthL - 0.1, yBed + stubH / 2, mid)));
    g.add(still(box(0.2, stubH, stubLen, material("tunnel"), mouthR + 0.1, yBed + stubH / 2, mid)));
    g.add(still(box(mouthR - mouthL + 0.4, 0.2, stubLen, material("tunnel"), (mouthL + mouthR) / 2, mouthTop + 0.1, mid)));
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(mouthR - mouthL + 0.4, stubH + 0.4), voidMat);
    g.add(put(cap, (mouthL + mouthR) / 2, yBed + stubH / 2, s * tunnelZ));
    // steel frame around the mouth
    const fz = s * (zHalf - 0.04);
    g.add(still(box(mouthR - mouthL + 0.2, 0.14, 0.1, material("darkMetal"), (mouthL + mouthR) / 2, mouthTop, fz)));
    g.add(still(box(0.14, stubH, 0.1, material("darkMetal"), mouthL, yBed + stubH / 2, fz)));
    g.add(still(box(0.14, stubH, 0.1, material("darkMetal"), mouthR, yBed + stubH / 2, fz)));
    // signal head beside the mouth
    const sz = s * (zHalf - 0.1);
    g.add(still(box(0.25, 0.7, 0.12, material("darkMetal"), 8.4, 2.4, sz)));
    const lensRed = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), material("signalRed"));
    const lensDim = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), material("darkMetal"));
    g.add(put(lensRed, 8.4, 2.6, sz - s * 0.07));
    g.add(put(lensDim, 8.4, 2.35, sz - s * 0.07));
  }

  /* ceiling: beams plus emissive light panels (instanced) */
  for (let z = -10; z <= 10; z += 4) {
    g.add(still(box(xFar - xBack, 0.2, 0.3, material("ceiling"), (xFar + xBack) / 2, yTop - 0.1, z)));
  }
  const panelXs = [-3.8, 0.2, 5.4];
  const panelZs = [-8, -4, 0, 4, 8];
  const panels = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.2, 0.05, 2.4),
    material("panelLit"),
    panelXs.length * panelZs.length
  );
  let pi = 0;
  for (const px of panelXs) {
    for (const pz of panelZs) {
      m4.setPosition(px, yTop - 0.03, pz);
      panels.setMatrixAt(pi++, m4);
    }
  }
  g.add(panels);

  /* columns along the platform */
  const colGeo = new THREE.BoxGeometry(0.45, yTop, 0.45);
  const baseGeo = new THREE.BoxGeometry(0.5, 0.15, 0.5);
  for (const z of [-8, -4, 0, 8]) {
    const col = new THREE.Mesh(colGeo, material("concrete"));
    col.castShadow = true;
    col.receiveShadow = true;
    g.add(put(col, -2.4, yTop / 2, z));
    g.add(put(new THREE.Mesh(baseGeo, material("darkMetal")), -2.4, 0.075, z));
  }

  /* back wall: benches, bin, signage, map and ad panels */
  g.add(bench(-5.55, -7));
  g.add(bench(-5.55, -0.5));
  g.add(trashBin(-5.5, 7.6));
  const nameMat = material("stationName");
  const nameGeo = new THREE.PlaneGeometry(2.4, 0.6);
  for (const z of [-8.5, 0, 8.5]) g.add(put(new THREE.Mesh(nameGeo, nameMat), xBack + 0.03, 2.9, z, 90 * DEG));
  for (const z of [-6, 6]) g.add(put(new THREE.Mesh(nameGeo, nameMat), xFar - 0.03, 2.9, z, -90 * DEG));
  const dirGeo = new THREE.PlaneGeometry(2.0, 0.5);
  for (const z of [-4, 4]) g.add(put(new THREE.Mesh(dirGeo, material("directionSign")), xBack + 0.03, 3.8, z, 90 * DEG));
  g.add(wallBoard(xBack, 1.6, -3.2, 0.9, 0.9, "lineMap", 90 * DEG));
  for (const z of [0.8, 2.4]) g.add(wallBoard(xBack, 1.5, z, 1.0, 1.5, "adPoster", 90 * DEG));
  for (const z of [-9, -2.5, 2.5, 9]) g.add(wallBoard(xFar, 1.7, z, 1.0, 1.5, "adPoster", -90 * DEG));

  /* passengers: clear of the strip zone (x ~2.25) and of the main sightline */
  g.add(person("#3d5a80", -1.2, -5.5, 100 * DEG));
  g.add(person("#7a4b52", -3.0, -9.0, 80 * DEG));
  g.add(person("#4d6b4a", -1.0, -9.6, 95 * DEG));
  g.add(person("#8a7a3a", -4.6, -8.2, 70 * DEG));
  g.add(person("#5b4a7a", -3.4, 9.4, 120 * DEG));

  /* lighting: hemisphere + 3 point lights + one shadow-casting directional */
  const lights = [new THREE.HemisphereLight(0xc9d8e6, 0x3a3733, 1.1)];
  for (const z of [-7, 0, 7]) {
    const lamp = new THREE.PointLight(0xffeccd, 14, 20, 2);
    lamp.position.set(-1.5, yTop - 0.6, z);
    lights.push(lamp);
  }
  const fill = new THREE.DirectionalLight(0xfff0d8, 1.2);
  fill.position.set(-5, 8, 9);
  fill.castShadow = true;
  lights.push(fill);

  return {
    group: g,
    lights,
    background: new THREE.Color("#05070a"),
    fog: new THREE.Fog(0x0b0e12, 20, 50),
  };
}

function parkingLot() {
  const g = new THREE.Group();
  g.add(ground(70, 70, material("asphalt")));

  // stall lines: target stall spans x -1.35..1.35, access aisle 1.35..3.0
  for (const lx of [-6.75, -4.05, -1.35, 1.35, 3.0, 5.7, 8.4]) {
    g.add(marking(0.12, 5.4, material("paint"), lx, 0));
  }
  // hatched access aisle: 45° stripes spanning exactly corner to corner of the 1.65 m aisle
  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 2.3), material("paint"));
    stripe.rotation.x = -90 * DEG;
    stripe.rotation.z = 45 * DEG;
    stripe.position.set(2.175, 0.006, -1.8 + i * 0.72);
    g.add(stripe);
  }

  // kerb at the head of the row, plus wheel stops
  g.add(box(24, 0.14, 0.3, material("curb"), 1, 0.07, -3.05));
  for (const cx of [-2.7, 4.35, 7.05]) {
    g.add(box(1.7, 0.11, 0.16, material("curb"), cx, 0.055, -2.2));
  }

  // the accessible bay is signed, but the ground marking is missing
  g.add(signOnPost(0, -3.5, "accessibleSymbol", 2.1, 0.5, 0.62));

  g.add(car("#8c3a32", -2.7, -0.4, 180 * DEG));
  g.add(car("#37506e", 4.35, -0.3, 180 * DEG));
  g.add(car("#5d6169", 7.05, -0.5, 180 * DEG));
  g.add(car("#7c7f74", -6.75, -0.4, 180 * DEG));

  g.add(lampPost(-8.5, -3.2, 5.5));
  g.add(lampPost(9.5, -3.2, 5.5));

  // low building behind the row
  g.add(box(26, 4.2, 0.4, material("concrete"), 1, 2.1, -9));

  const sun = new THREE.DirectionalLight(0xfff4e2, 2.6);
  sun.position.set(-9, 14, 7);
  sun.castShadow = true;

  return {
    group: g,
    lights: [new THREE.HemisphereLight(0xbcd8ff, 0x6b6455, 0.85), sun],
    background: new THREE.Color("#9fbdd8"),
    fog: new THREE.Fog(0x9fbdd8, 40, 90),
  };
}

function sidewalkCorner() {
  const g = new THREE.Group();
  g.add(ground(60, 60, material("asphalt")));

  // raised sidewalk from z = -10 to z = -4, top at y = 0.15
  g.add(box(34, 0.15, 6, material("paving"), 0, 0.075, -7));
  g.add(box(34, 0.16, 0.16, material("curb"), 0, 0.08, -4.05));
  // sidewalk across the street
  g.add(box(34, 0.15, 6, material("paving"), 0, 0.075, 7));
  g.add(box(34, 0.16, 0.16, material("curb"), 0, 0.08, 4.05));

  // crosswalk bars leading straight to the missing ramp
  for (const bx of [-1.65, -0.55, 0.55, 1.65]) {
    g.add(marking(0.55, 7.2, material("paint"), bx, 0.2));
  }

  // buildings behind the sidewalk
  g.add(box(14, 7, 0.4, material("concrete"), -8, 3.5, -10.2));
  g.add(box(12, 5.5, 0.4, material("wallTiled"), 7, 2.75, -10.2));

  g.add(lampPost(-4.5, -5.6));
  // street tree
  const tree = new THREE.Group();
  tree.add(cylinder(0.16, 2.6, material("wood"), 0, 1.3, 0, 10));
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.25, 18, 14), material("foliage"));
  crown.position.y = 3.3;
  crown.castShadow = true;
  tree.add(crown);
  tree.position.set(5.2, 0, -5.8);
  g.add(tree);

  g.add(car("#3f5d78", -6.5, 1.6, 90 * DEG));
  g.add(person("#5b4a6b", -2.4, -6.2, 10 * DEG));

  const sun = new THREE.DirectionalLight(0xfff2df, 2.5);
  sun.position.set(8, 13, 5);
  sun.castShadow = true;

  return {
    group: g,
    lights: [new THREE.HemisphereLight(0xc2dcff, 0x6f6858, 0.8), sun],
    background: new THREE.Color("#a8c4dc"),
    fog: new THREE.Fog(0xa8c4dc, 38, 85),
  };
}

function streetCrosswalk() {
  const g = new THREE.Group();
  g.add(ground(60, 60, material("asphalt")));

  // sidewalks either side of a two-lane road (road spans x -5 .. +5)
  g.add(box(6, 0.15, 40, material("paving"), -8, 0.075, 0));
  g.add(box(6, 0.15, 40, material("paving"), 8, 0.075, 0));
  g.add(box(0.16, 0.16, 40, material("curb"), -5.05, 0.08, 0));
  g.add(box(0.16, 0.16, 40, material("curb"), 5.05, 0.08, 0));

  // lane divider, interrupted by the crossing
  for (let z = 2.6; z < 20; z += 2.6) g.add(marking(0.14, 1.4, material("paintWorn"), 0, z));
  for (let z = -2.6; z > -20; z -= 2.6) g.add(marking(0.14, 1.4, material("paintWorn"), 0, z));

  // continental crosswalk bars across both lanes, centred on z = 0
  for (const bx of [-3.9, -2.6, -1.3, 1.3, 2.6, 3.9]) {
    g.add(marking(0.55, 3, material("paint"), bx, 0));
  }

  // traffic signal facing the approaching lane
  const pole = new THREE.Group();
  pole.add(cylinder(0.08, 3.6, material("darkMetal"), 0, 1.8, 0, 12));
  pole.add(box(0.3, 0.85, 0.26, material("darkMetal"), 0, 3.3, -0.2));
  const red = cylinder(0.08, 0.05, material("extinguisherRed"), 0, 3.58, -0.34, 12);
  red.rotation.x = 90 * DEG;
  pole.add(red);
  pole.position.set(5.7, 0, 3.4);
  g.add(pole);

  g.add(car("#2f4f74", 2.5, 9.5, 180 * DEG));
  g.add(car("#6d6f75", -2.5, -8.5, 0));

  g.add(box(16, 8, 0.5, material("concrete"), -12, 4, -12));
  g.add(box(14, 6.5, 0.5, material("wallTiled"), 12, 3.25, -12));
  g.add(person("#4a6b78", -8.2, 2.4, 0));

  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sun.position.set(-10, 15, 8);
  sun.castShadow = true;

  return {
    group: g,
    lights: [new THREE.HemisphereLight(0xbdd8f5, 0x6a6355, 0.8), sun],
    background: new THREE.Color("#a2c0da"),
    fog: new THREE.Fog(0xa2c0da, 40, 90),
  };
}

function buildingHallway() {
  const g = new THREE.Group();

  // corridor: floor y = 0, inner wall faces at x = -2 and x = +2, ceiling at y = 3
  g.add(box(4, 0.1, 22, material("hallwayFloor"), 0, -0.05, -4));
  g.add(box(0.2, 3, 22, material("wallPaint"), -2.1, 1.5, -4));
  g.add(box(0.2, 3, 22, material("wallPaint"), 2.1, 1.5, -4));
  g.add(box(4.4, 0.2, 22, material("ceiling"), 0, 3.1, -4));
  // end wall
  g.add(box(4.4, 3, 0.2, material("wallPaint"), 0, 1.5, -14.9));
  // skirting
  g.add(box(0.06, 0.12, 22, material("darkMetal"), -1.98, 0.06, -4));
  g.add(box(0.06, 0.12, 22, material("darkMetal"), 1.98, 0.06, -4));

  // doors down both walls
  for (const z of [-1.5, -7.5, -12]) {
    const door = box(0.08, 2.1, 0.95, material("wood"), -1.97, 1.05, z);
    g.add(door);
    g.add(cylinder(0.03, 0.1, material("steel"), -1.9, 1.05, z + 0.36, 8));
  }
  for (const z of [-6.0, -11]) {
    const door = box(0.08, 2.1, 0.95, material("wood"), 1.97, 1.05, z);
    g.add(door);
  }

  // exit door and illuminated sign at the end of the egress route
  g.add(box(0.08, 2.1, 1.05, material("steel"), 1.97, 1.05, -4.2));
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), material("exitSign"));
  exitSign.rotation.y = -90 * DEG;
  exitSign.position.set(1.95, 2.45, -4.2);
  g.add(exitSign);

  // ceiling light panels
  for (let z = 1; z >= -13; z -= 3) {
    const panel = box(1.1, 0.06, 0.45, material("lampLit"), 0, 2.98, z);
    panel.castShadow = false;
    g.add(panel);
    const l = new THREE.PointLight(0xfff3e0, 3.4, 8, 2);
    l.position.set(0, 2.85, z);
    g.add(l);
  }

  const lights = [
    new THREE.HemisphereLight(0xe8eef5, 0x9a958c, 0.7),
    (() => {
      const d = new THREE.DirectionalLight(0xffffff, 0.7);
      d.position.set(-2, 6, 6);
      d.castShadow = true;
      return d;
    })(),
  ];

  return { group: g, lights, background: new THREE.Color("#1a1d21"), fog: null };
}

/* ------------------------------------------------------------------ */
/* Placeable objects                                                   */
/* ------------------------------------------------------------------ */

function safetyStrip() {
  const g = new THREE.Group();
  const strip = box(0.6, 0.025, 12, material("tactile"), 0, 0.012, 0);
  g.add(strip);
  return { group: g, anchor: "base", height: 0.025 };
}

function accessibleSymbol() {
  const g = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), material("accessibleSymbol"));
  plane.rotation.x = -90 * DEG;
  plane.position.y = 0.008;
  plane.receiveShadow = true;
  g.add(plane);
  return { group: g, anchor: "base", height: 0.01 };
}

function curbRamp() {
  const g = new THREE.Group();
  // triangular profile in the ZY plane: flat on the road, rising to kerb height
  const shape = new THREE.Shape();
  shape.moveTo(0.75, 0);
  shape.lineTo(-0.75, 0);
  shape.lineTo(-0.75, 0.16);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false });
  geo.rotateY(90 * DEG);
  geo.translate(0.8, 0, 0);
  const ramp = new THREE.Mesh(geo, material("concrete"));
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  g.add(ramp);

  // tactile warning surface at the bottom of the slope
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), material("tactile"));
  pad.rotation.x = -90 * DEG;
  pad.position.set(0, 0.012, 0.5);
  g.add(pad);

  return { group: g, anchor: "base", height: 0.16 };
}

function stopLine() {
  const g = new THREE.Group();
  g.add(box(4.6, 0.016, 0.3, material("paint"), 0, 0.008, 0));
  return { group: g, anchor: "base", height: 0.016 };
}

function fireExtinguisher() {
  const g = new THREE.Group();
  // origin sits at the centre of the cylinder body, so the aimed point is the unit's middle
  const body = cylinder(0.082, 0.44, material("extinguisherRed"), 0, 0, 0, 20);
  g.add(body);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), material("extinguisherRed"));
  top.position.y = 0.22;
  top.castShadow = true;
  g.add(top);
  g.add(cylinder(0.026, 0.08, material("darkMetal"), 0, 0.32, 0, 12));
  g.add(box(0.03, 0.025, 0.16, material("darkMetal"), 0, 0.35, 0.05));
  // hose curling round the body
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 20, Math.PI * 1.3), material("ballast"));
  hose.rotation.x = 90 * DEG;
  hose.position.y = 0.05;
  g.add(hose);
  // label band
  const band = cylinder(0.084, 0.12, new THREE.MeshStandardMaterial({ color: "#efe6d8", roughness: 0.7 }), 0, -0.02, 0, 20);
  g.add(band);
  // wall bracket
  g.add(box(0.06, 0.1, 0.2, material("darkMetal"), -0.1, -0.02, 0));
  return { group: g, anchor: "center", height: 0.52 };
}

/* ------------------------------------------------------------------ */

const ENVIRONMENTS = {
  metroPlatform,
  parkingLot,
  sidewalkCorner,
  streetCrosswalk,
  buildingHallway,
};

const OBJECTS = {
  safetyStrip,
  accessibleSymbol,
  curbRamp,
  stopLine,
  fireExtinguisher,
};

export function buildEnvironment(name) {
  const factory = ENVIRONMENTS[name];
  if (!factory) throw new Error(`Unknown environment builder: ${name}`);
  return factory();
}

export function buildObject(name) {
  const factory = OBJECTS[name];
  if (!factory) throw new Error(`Unknown object builder: ${name}`);
  return factory();
}
