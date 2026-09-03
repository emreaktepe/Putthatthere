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

function metroPlatform() {
  const g = new THREE.Group();

  // platform slab: top surface at y = 0, edge at x = +3
  g.add(box(7, 1.1, 30, material("paving"), -0.5, -0.55, 0));
  // yellow painted edge line right at the drop-off
  g.add(marking(0.1, 30, material("paintWorn"), 2.94, 0, 0.008));

  // track bed and rails
  g.add(box(6.4, 0.5, 30, material("ballast"), 6.2, -1.35, 0));
  for (const rx of [4.7, 6.15]) {
    g.add(box(0.09, 0.14, 30, material("rail"), rx, -1.03, 0));
  }
  for (let z = -14; z <= 14; z += 1.4) {
    g.add(box(2.2, 0.11, 0.24, material("wood"), 5.42, -1.15, z));
  }

  // enclosing structure
  g.add(box(0.3, 4.4, 30, material("wallTiled"), -4.15, 2.2, 0));
  g.add(box(0.3, 5.2, 30, material("wallTiled"), 9.55, 1.5, 0));
  g.add(box(14.2, 0.3, 30, material("ceiling"), 2.7, 4.45, 0));

  // columns down the platform
  for (const z of [-9, -3, 3, 9]) {
    g.add(box(0.42, 4.3, 0.42, material("concrete"), -2.6, 2.15, z));
  }

  // benches against the back wall
  for (const z of [-6, 6]) {
    const bench = new THREE.Group();
    bench.add(box(0.5, 0.08, 1.8, material("wood"), 0, 0.45, 0));
    bench.add(box(0.44, 0.42, 0.1, material("steel"), 0, 0.22, -0.75));
    bench.add(box(0.44, 0.42, 0.1, material("steel"), 0, 0.22, 0.75));
    bench.position.set(-3.4, 0, z);
    g.add(bench);
  }

  // station signage on the back wall
  for (const z of [-7, 4]) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.7),
      new THREE.MeshStandardMaterial({ map: texture("stationSign"), roughness: 0.6 })
    );
    sign.rotation.y = 90 * DEG;
    sign.position.set(-3.98, 2.3, z);
    g.add(sign);
  }

  // ceiling light strips — emissive panels plus the lights that actually carry the room
  const lights = [new THREE.HemisphereLight(0xc3d6e8, 0x33302c, 0.9)];
  for (let z = -12; z <= 12; z += 4) {
    const strip = box(1.6, 0.08, 1.2, material("lampLit"), 0.5, 4.24, z);
    strip.castShadow = false;
    g.add(strip);
    const lamp = new THREE.PointLight(0xffeccd, 9, 18, 2);
    lamp.position.set(0.5, 4.05, z);
    g.add(lamp);
  }

  // passengers waiting, standing well back from the edge and clear of the sightline
  g.add(person("#3d5a80", 0.1, -3.5, 100 * DEG));
  g.add(person("#7a4b52", -1.4, -7.5, 80 * DEG));
  g.add(person("#4d6b4a", 0.8, -11, 95 * DEG));

  const fill = new THREE.DirectionalLight(0xfff0d8, 1.1);
  fill.position.set(-5, 8, 9);
  fill.castShadow = true;
  lights.push(fill);

  return {
    group: g,
    lights,
    background: new THREE.Color("#0d1116"),
    fog: new THREE.Fog(0x0d1116, 22, 48),
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
