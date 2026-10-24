import * as THREE from "three";

const ROUND_SECONDS = 30;
const ARENA = 12;
const SPEED = 9;

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10131c);
scene.fog = new THREE.Fog(0x10131c, 25, 50);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 16, 14);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x20243a, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(6, 14, 8);
sun.castShadow = true;
sun.shadow.camera.left = sun.shadow.camera.bottom = -ARENA;
sun.shadow.camera.right = sun.shadow.camera.top = ARENA;
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA * 2, ARENA * 2),
  new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.GridHelper(ARENA * 2, ARENA * 2, 0x3a4a78, 0x2a3558));

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4cc9f0 })
);
player.position.y = 0.5;
player.castShadow = true;
scene.add(player);

const orbGeo = new THREE.SphereGeometry(0.45, 24, 16);
const orbMat = new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0x8a5a00, metalness: 0.4, roughness: 0.3 });
const hazGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
const hazMat = new THREE.MeshStandardMaterial({ color: 0xe63946 });

const rand = (r) => (Math.random() * 2 - 1) * r;
const orbs = [];
const hazards = [];

function spawnOrb() {
  const m = new THREE.Mesh(orbGeo, orbMat);
  m.position.set(rand(ARENA - 1), 0.6, rand(ARENA - 1));
  m.castShadow = true;
  scene.add(m);
  orbs.push(m);
}

function spawnHazard() {
  const m = new THREE.Mesh(hazGeo, hazMat);
  m.position.set(rand(ARENA - 1), 0.65, rand(ARENA - 1));
  m.userData.v = new THREE.Vector3(rand(1), 0, rand(1)).normalize().multiplyScalar(2.5 + Math.random() * 2);
  m.castShadow = true;
  scene.add(m);
  hazards.push(m);
}

const keys = new Set();
addEventListener("keydown", (e) => keys.add(e.code));
addEventListener("keyup", (e) => keys.delete(e.code));
let drag = null;
addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; });
addEventListener("pointermove", (e) => {
  if (!drag) return;
  drag.dx = e.clientX - drag.x;
  drag.dy = e.clientY - drag.y;
});
addEventListener("pointerup", () => { drag = null; });

let score = 0;
let timeLeft = 0;
let running = false;

function reset() {
  [...orbs, ...hazards].forEach((m) => scene.remove(m));
  orbs.length = hazards.length = 0;
  player.position.set(0, 0.5, 0);
  score = 0;
  timeLeft = ROUND_SECONDS;
  for (let i = 0; i < 6; i++) spawnOrb();
  for (let i = 0; i < 5; i++) spawnHazard();
}

function end(reason) {
  running = false;
  $("title").textContent = reason === "hit" ? "Çarptın!" : "Süre doldu!";
  $("sub").textContent = `Toplam puan: ${score}`;
  $("start").textContent = "Tekrar oyna";
  $("msg").hidden = false;
}

$("start").onclick = () => {
  reset();
  $("msg").hidden = true;
  running = true;
};

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  orbs.forEach((o, i) => { o.position.y = 0.6 + Math.sin(t * 3 + i) * 0.15; });

  if (running) {
    let dx = (keys.has("KeyD") || keys.has("ArrowRight")) - (keys.has("KeyA") || keys.has("ArrowLeft"));
    let dz = (keys.has("KeyS") || keys.has("ArrowDown")) - (keys.has("KeyW") || keys.has("ArrowUp"));
    if (drag && drag.dx !== undefined) { dx += THREE.MathUtils.clamp(drag.dx / 60, -1, 1); dz += THREE.MathUtils.clamp(drag.dy / 60, -1, 1); }
    const dir = new THREE.Vector3(dx, 0, dz);
    if (dir.lengthSq() > 1) dir.normalize();
    player.position.addScaledVector(dir, SPEED * dt);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -ARENA + 0.5, ARENA - 0.5);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -ARENA + 0.5, ARENA - 0.5);
    if (dir.lengthSq() > 0) player.rotation.y = Math.atan2(dir.x, dir.z);

    for (const h of hazards) {
      h.position.addScaledVector(h.userData.v, dt);
      if (Math.abs(h.position.x) > ARENA - 0.7) h.userData.v.x *= -1;
      if (Math.abs(h.position.z) > ARENA - 0.7) h.userData.v.z *= -1;
      h.rotation.y += dt;
      if (h.position.distanceTo(player.position) < 1.15) return end("hit");
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (orbs[i].position.distanceTo(player.position) < 1.05) {
        scene.remove(orbs[i]);
        orbs.splice(i, 1);
        score++;
        spawnOrb();
        if (score % 5 === 0) spawnHazard();
      }
    }
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; end("time"); }
    $("score").textContent = `Puan: ${score}`;
    $("time").textContent = `Süre: ${Math.ceil(timeLeft)}`;
  }
  renderer.render(scene, camera);
});
