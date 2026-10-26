import * as THREE from "three";
import { sfx } from "../audio/engine.js";
import { WEAPONS } from "../core/data.js";
import { RT, S, UP, aim, aimPoint, echoQ, enemies, shots, strikes } from "../core/state.js";
import { ARENA, flatDist } from "../core/util.js";
import { hurt } from "./combat.js";
import { chainFalloff, chainTargets } from "./chain.js";
import { dmgState, rollDamage } from "./damage.js";
import { addBolt, addFx, addHazard, burst, emit, makeShot, meteorGeo } from "../render/fx.js";
import { glowSprite } from "../render/gfx.js";
import { scene } from "../render/scene.js";
import { wiz, wizard } from "../render/wizard.js";

export function nearestEnemies(from, n, range) {
  return enemies
    .map((e) => ({ e, d: e.mesh.position.distanceTo(from) }))
    .filter((x) => x.d <= range)
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.e);
}

export const ECHO_SCALE = 0.5;
export function cast() {
  if (!RT.running || RT.cooldown > 0) return;
  const w = WEAPONS[S.weapon];
  RT.cooldown = w.cd * S.cdMul;
  fireSpell(S.weapon);
  // Yankı: zincir/Meteor/Ay Işığı gibi çok hedefli büyülerde ikinci atış %50 hasar (meta istif sınırı; tasarım §3.5/§3.6)
  if (S.echo > 0 && Math.random() < S.echo) echoQ.push({ t: 0.14, id: S.weapon, scale: w.chain || w.meteor || w.nova ? ECHO_SCALE : 1 });
}

export function fireSpell(id, scale = 1) {
  const w = WEAPONS[id];
  const origin = wizard.position.clone().setY(1.7);
  const dmg = rollDamage(w.dmg, S.dmgMul, dmgState) * scale;
  const el = w.element || null; // kesirli çarpan birikir: +%25 her 4. vuruşta +1 (plan B5)
  sfx("cast:" + id);
  wiz.kick = 0.18;
  emit(origin, w.color, 4, 2, 0.3);

  if (w.chain) {
    let prev = origin;
    // gerçek zincir: ilk hedef menzil içindeki en yakın, sonrakiler öncekine en çok w.hop birim (hop yoksa eski seçim: oyuncuya en yakın n)
    const list = w.hop
      ? chainTargets(wizard.position, enemies.map((e) => ({ e, x: e.mesh.position.x, z: e.mesh.position.z })), w.chain, w.range, w.hop).map((c) => c.e)
      : nearestEnemies(origin, w.chain, w.range);
    let k = 0;
    for (const e of list) {
      const to = e.mesh.position.clone();
      addBolt(prev, to, w.color);
      hurt(e, dmg * (w.hop ? chainFalloff(w.falloff, k) : 1), false, false, el);
      prev = to; k++;
    }
    if (prev === origin) addBolt(origin, origin.clone().addScaledVector(aim, 6), w.color); // hedef yoksa ileri doğru kısa şimşek
    return;
  }

  if (w.nova) {
    const p = wizard.position;
    addFx(p.x, p.z, w.color, 0.5, w.nova.r, 0.35, 0.15);
    burst(origin.clone().setY(1), w.color, 20);
    sfx("nova");
    for (const e of [...enemies]) {
      if (e.dead || flatDist(e.mesh.position, p) > w.nova.r + e.d.r * 0.5) continue;
      hurt(e, dmg, false, false, el);
      if (!e.dead && !e.d.static && e.d.ai !== "boss" && e.d.ai !== "knight") { // itme
        const dx = e.mesh.position.x - p.x, dz = e.mesh.position.z - p.z, l = Math.hypot(dx, dz) || 1;
        e.mesh.position.x = THREE.MathUtils.clamp(e.mesh.position.x + (dx / l) * w.nova.push, -ARENA - 1, ARENA + 1);
        e.mesh.position.z = THREE.MathUtils.clamp(e.mesh.position.z + (dz / l) * w.nova.push, -ARENA - 1, ARENA + 1);
      }
    }
    return;
  }

  if (w.meteor) {
    const x = THREE.MathUtils.clamp(aimPoint.x, -ARENA, ARENA), z = THREE.MathUtils.clamp(aimPoint.z, -ARENA, ARENA);
    const ball = new THREE.Mesh(meteorGeo, new THREE.MeshBasicMaterial({ color: w.color }));
    ball.add(glowSprite(w.color, 3.4, 0.8));
    ball.position.set(x, 14, z);
    scene.add(ball);
    addHazard(x, z, w.meteor.r, w.meteor.delay, 0, w.color, true);
    strikes.push({ x, z, t: w.meteor.delay, max: w.meteor.delay, r: w.meteor.r, dmg, ball, element: el });
    return;
  }

  const n = w.spread || 1;
  for (let i = 0; i < n; i++) {
    const ang = n === 1 ? 0 : (i - (n - 1) / 2) * 0.28;
    const v = aim.clone().applyAxisAngle(UP, ang).multiplyScalar(w.speed);
    const m = makeShot(w.color, id === "frost" ? "frost" : "");
    m.position.copy(origin);
    if (id === "frost") m.lookAt(origin.clone().add(v));
    scene.add(m);
    if (w.cloud) {
      m.scale.setScalar(1.6);
      shots.push({ mesh: m, v, life: w.cloud.dist / w.speed, cloud: { ...w.cloud, element: el }, dmg, hit: null, color: w.color });
    } else {
      shots.push({ mesh: m, v, life: w.life || 1.4, dmg, slow: w.slow ? { t: w.slowTime || 3, k: w.slowScale || 0.35 } : null, element: el, color: w.color, pierce: S.pierce && w.pierceable ? 1 : 0, hit: new Set() });
    }
  }
}
