import * as THREE from "three";
import { mus, sfx } from "../audio/engine.js";
import { ABILITY_ORDER, GAME, LEVELS, PLAYER, STRINGS } from "../core/data.js";
import { INPUT, RT, S, abilCd, aim, aimPoint, bolts, clouds, echoQ, enemies, enemyShots, fxs, hazards, moveDir, pickups, shots, strikes } from "../core/state.js";
import { ARENA, flatDist, rand } from "../core/util.js";
import { timeFactor } from "./abilities.js";
import { updateEnemies } from "./ai.js";
import { damagePlayer, hurt } from "./combat.js";
import { gameOver, levelClear } from "./flow.js";
import { scaledEvery } from "./dda.js";
import { crystalGoalMet, effectiveCap } from "./spawnmath.js";
import { isTouch, keys, mouse, ray } from "./input.js";
import { cast, fireSpell, nearestEnemies } from "./weapons.js";
import { updateSkills } from "./skillrun.js";
import { playerVel, updateHazards } from "./hazardrun.js";
import { FX } from "./fxsettings.js";
import { pendingSpawns, queueSpawn, tickSpawns } from "./spawnwarn.js";
import { tickCombatFx } from "../render/combatfx.js";
import { veilBlocks } from "./skills.js";
import { liveCount, placePickup, spawnCrystal, spawnEnemy } from "./world.js";
import { tickDying } from "../render/enemies.js";
import { addCloud, addFx, burst, dropHazard, emit, removeObj, updateSparks } from "../render/fx.js";
import { borderMat, camera, renderer, ring, scene, updateWeather, wand } from "../render/scene.js";
import { rig, updateCamera } from "../render/camera.js";
import { rotateMove } from "./cameramath.js";
import { sceneryTick } from "../render/scenery.js";
import { tickProps } from "../render/props3d.js";
import { animatePiril, animateWizard, guide, guideGeo, orbTip, piril, shieldBall, wizard } from "../render/wizard.js";
import { renderHud, toast, updateAbilityUi } from "../ui/hud.js";
import { stepDt } from "../ui/models.js";

export let trailTick = 0; // iz kıvılcımı sayacı
export const _tip = new THREE.Vector3();
export const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const hit = new THREE.Vector3();
export const clock = new THREE.Clock();

export function update(dt, t) {
  RT.elapsed += dt;
  while (RT.hintQ.length && RT.hintQ[0].at <= RT.elapsed) toast(RT.hintQ.shift().text, 3000, true); // ilk giriş ipuçları (oyun saatiyle: duraklatınca bekler)
  RT.cooldown -= dt;
  RT.invuln -= dt;
  for (const id of ABILITY_ORDER) abilCd[id] = Math.max(abilCd[id] - dt, 0);
  RT.shieldT = Math.max(RT.shieldT - dt, 0);
  RT.timeslowT = Math.max(RT.timeslowT - dt, 0);
  const es = timeFactor(); // düşman/mermi zaman ölçeği (Zaman Çatlağı)
  document.body.classList.toggle("slowtime", RT.timeslowT > 0);
  trailTick++;
  { // müzik yoğunluğu: düşman doluluğu, az can, süre sonu
    const cap = Math.max(LEVELS[S.level].cap, 1);
    let inten = Math.min(liveCount() / cap, 1) * 0.9;
    if (S.hp <= 1) inten += 0.2;
    if (RT.timeLeft < 10) inten += 0.2;
    mus.intensity(Math.min(inten, 1));
  }

  for (let i = echoQ.length - 1; i >= 0; i--) {
    echoQ[i].t -= dt;
    if (echoQ[i].t <= 0) { const { id, scale } = echoQ[i]; echoQ.splice(i, 1); fireSpell(id, scale || 1); }
  }

  // Hareket
  let dx = (keys.has("KeyD") || keys.has("ArrowRight")) - (keys.has("KeyA") || keys.has("ArrowLeft"));
  let dz = (keys.has("KeyS") || keys.has("ArrowDown")) - (keys.has("KeyW") || keys.has("ArrowUp"));
  if (INPUT.joy) { dx += INPUT.joy.dx; dz += INPUT.joy.dy; }
  const dir = new THREE.Vector3(dx, 0, dz);
  if (dir.lengthSq() > 1) dir.normalize();
  { const m = rotateMove(dir.x, dir.z, rig.yaw); dir.set(m.x, 0, m.z); } // yürüme kamera-göreli: W/joystick yukarı = ekranda yukarı
  if (dir.lengthSq() > 0.01) moveDir.copy(dir).normalize();
  { const v = playerVel(dir.x, dir.z, GAME.baseSpeed * PLAYER.speedMul * S.speedMul, dt); wizard.position.x += v.x * dt; wizard.position.z += v.z * dt; } // buz yamasında kayar
  wizard.position.x = THREE.MathUtils.clamp(wizard.position.x, -ARENA + 0.5, ARENA - 0.5);
  wizard.position.z = THREE.MathUtils.clamp(wizard.position.z, -ARENA + 0.5, ARENA - 0.5);

  // Nişan: fare yerde nereyi gösteriyorsa; dokunmatikte en yakın düşman / yürüme yönü
  ray.setFromCamera(mouse, camera);
  if (INPUT.joy || (isTouch && !INPUT.mouseSeen)) {
    const near = nearestEnemies(wizard.position, 1, 18)[0];
    if (near) { aim.copy(near.mesh.position).sub(wizard.position).setY(0).normalize(); aimPoint.copy(near.mesh.position).setY(0); }
    else {
      if (dir.lengthSq() > 0) aim.copy(dir).normalize();
      aimPoint.copy(wizard.position).addScaledVector(aim, 7);
    }
  } else if (ray.ray.intersectPlane(groundPlane, hit)) {
    aimPoint.copy(hit);
    const d = hit.clone().sub(wizard.position).setY(0);
    if (d.lengthSq() > 0.01) aim.copy(d.normalize());
  }
  if (INPUT.fireHeld) cast();
  wizard.rotation.y = Math.atan2(aim.x, aim.z);
  wand.position.set(wizard.position.x, 2.2, wizard.position.z);
  wizard.visible = RT.invuln <= 0 || Math.floor(t * 12) % 2 === 0;
  shieldBall.visible = RT.shieldT > 0;
  if (RT.shieldT > 0) shieldBall.position.set(wizard.position.x, 1.2, wizard.position.z);

  updateEnemies(dt, t, es);
  if (!RT.running) return;
  updateSkills(dt, t);
  if (!RT.running) return;
  updateHazards(dt, t); // çevre tehlikeleri (levels.<id>.hazards)
  if (!RT.running) return;
  tickSpawns(dt); // doğma uyarı halkası süresi dolan düşmanlar çıkar

  // Oyuncu mermileri
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.mesh.position.addScaledVector(s.v, dt);
    if ((trailTick + i) % FX.trailEvery === 0) emit(s.mesh.position, s.color, 1, 0.5, 0.25); // iz bırakan kıvılcım
    s.life -= dt;
    let gone = s.life <= 0;
    if (s.cloud) {
      if (gone) addCloud(THREE.MathUtils.clamp(s.mesh.position.x, -ARENA, ARENA), THREE.MathUtils.clamp(s.mesh.position.z, -ARENA, ARENA), s.dmg, s.cloud);
    } else if (!gone) {
      let target = null;
      for (const e of enemies) {
        if (s.hit.has(e) || veilBlocks(e.veiled, s.element)) continue; // perdeli Ruh: mermi içinden geçer
        if (flatDist(s.mesh.position, e.mesh.position) < e.d.r + 0.3) { target = e; break; }
      }
      if (target) {
        s.hit.add(target);
        hurt(target, s.dmg, s.slow, false, s.element);
        if (s.pierce > 0 && !target.d.static) s.pierce--; else gone = true;
      }
    }
    if (gone) { scene.remove(s.mesh); shots.splice(i, 1); }
    if (!RT.running) return;
  }

  // Düşman mermileri
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const s = enemyShots[i];
    s.mesh.position.x += s.vx * dt * es;
    s.mesh.position.z += s.vz * dt * es;
    s.life -= dt * es;
    let gone = s.life <= 0 || Math.abs(s.mesh.position.x) > ARENA + 2 || Math.abs(s.mesh.position.z) > ARENA + 2;
    if (!gone && RT.invuln <= 0 && flatDist(s.mesh.position, wizard.position) < 0.8) { gone = true; damagePlayer(1); }
    if (gone) { scene.remove(s.mesh); enemyShots.splice(i, 1); }
    if (!RT.running) return;
  }

  // Zehir bulutları
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.life -= dt; c.tick -= dt;
    c.m.material.opacity = 0.28 * Math.min(1, c.life);
    c.m.scale.set(c.r * (1 + Math.sin(t * 3) * 0.04), 0.9, c.r * (1 + Math.sin(t * 3) * 0.04));
    if (c.tick <= 0) {
      c.tick = 0.5;
      for (const e of [...enemies]) if (!e.dead && flatDist(e.mesh.position, c) < c.r + e.d.r * 0.5) hurt(e, c.dmg * 0.5, false, true, c.element); // saniyede 1*dmg
      burst(new THREE.Vector3(c.x + rand(c.r * 0.7), 0.8, c.z + rand(c.r * 0.7)), 0x6bff6b, 2);
    }
    if (c.life <= 0) { scene.remove(c.m); c.m.material.dispose(); clouds.splice(i, 1); }
    if (!RT.running) return;
  }

  // Meteorlar
  for (let i = strikes.length - 1; i >= 0; i--) {
    const s = strikes[i];
    s.t -= dt;
    s.ball.position.y = 0.7 + 13.3 * Math.max(s.t / s.max, 0);
    emit(s.ball.position, 0xffa03a, 2, 1.5, 0.35);
    if (s.t <= 0) {
      scene.remove(s.ball); s.ball.material.dispose(); strikes.splice(i, 1);
      addFx(s.x, s.z, 0xffa03a, 0.5, s.r, 0.3);
      burst(new THREE.Vector3(s.x, 0.8, s.z), 0xffa03a, 30);
      sfx("meteor_hit");
      RT.shake = Math.max(RT.shake, 0.3);
      for (const e of [...enemies]) if (!e.dead && flatDist(e.mesh.position, s) < s.r + e.d.r * 0.5) hurt(e, s.dmg, false, false, s.element);
      if (!RT.running) return;
    }
  }

  // Yer işaretleri (boss dalgası, şövalye şoku, meteor işareti)
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.t -= dt * (h.real ? 1 : es);
    h.fill.scale.setScalar(Math.max(h.r * (1 - h.t / h.dur), 0.01));
    if (h.t <= 0) {
      hazards.splice(i, 1);
      if (h.dmg > 0) {
        burst(new THREE.Vector3(h.x, 0.5, h.z), 0xff5566, 18);
        RT.shake = Math.max(RT.shake, 0.25);
        if (RT.invuln <= 0 && flatDist(wizard.position, h) < h.r) damagePlayer(h.dmg);
      }
      dropHazard(h);
      if (!RT.running) return;
    }
  }

  // Toplananlar
  const pr = 1.2 + (S.piril ? 0.5 : 0);
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    const flat = wizard.position.clone().setY(p.mesh.position.y);
    const dist = p.mesh.position.distanceTo(flat);
    if (S.magnet && dist < S.magnet) p.mesh.position.addScaledVector(flat.sub(p.mesh.position).normalize(), 9 * dt);
    if (dist < pr) {
      scene.remove(p.mesh);
      pickups.splice(i, 1);
      sfx("pickup:" + p.type);
      if (p.type === "heart") {
        S.hp = Math.min(S.hp + 1, S.maxHp);
        burst(p.mesh.position, 0xff3b5c, 14);
      } else if (p.type === "light") {
        S.score += 25;
        burst(p.mesh.position, 0xfff6c8, 18);
      } else {
        const L = LEVELS[S.level];
        S.score += 10;
        burst(p.mesh.position, 0x5ee7ff);
        const want = L.crystals !== undefined ? L.crystals : (L.objective === "crystal" ? 5 : 0);
        if (L.objective === "crystal") {
          RT.collected++;
          if (S.rain && Math.random() < S.rain) RT.collected++; // Mana Yağmuru
          if (crystalGoalMet(L, RT.collected, S.kills - RT.killBase)) { levelClear(); return; }
          if (RT.collected >= L.goal && !RT.needKillsShown) { RT.needKillsShown = true; toast((STRINGS.matchup && STRINGS.matchup.needKills) || "Kristaller tamam. Kalan düşmanları da yen!", 3000, true); } // minKills bekleniyor
        }
        // yeniden doğma (K2): crystalDelay sn sonra (yoksa anında); hedef sayısı dolduysa (öldürme bekleniyor) yenisi çıkmaz
        if (!(L.objective === "crystal" && RT.collected >= L.goal) && pickups.filter((q) => q.type === "crystal").length + RT.crystalQ.length < want) {
          if (L.crystalDelay > 0) RT.crystalQ.push(L.crystalDelay); else spawnCrystal(L.crystalLure);
        }
        if (L.objective !== "crystal" && Math.random() < 0.35 * RT.dda.heartMul) placePickup("heart", p.mesh.position.clone().setY(0.9)); // diğer hedeflerde kristal kalp/mana ödülüdür
      }
    }
  }

  // Bekleyen kristaller (K2 crystalDelay)
  for (let i = RT.crystalQ.length - 1; i >= 0; i--) {
    RT.crystalQ[i] -= dt;
    if (RT.crystalQ[i] <= 0) { RT.crystalQ.splice(i, 1); spawnCrystal(LEVELS[S.level].crystalLure); }
  }

  // Yeni düşman doğurma
  const L = LEVELS[S.level];
  if (L.spawn.length) {
    RT.spawnTimer += dt;
    const capNow = effectiveCap(L.cap, L.objective, RT.elapsed - RT.lastKill);
    if (RT.spawnTimer > scaledEvery(L.every, RT.dda.spawnMul) && liveCount() + pendingSpawns() < capNow) {
      RT.spawnTimer = 0;
      const wave = L.spawn[Math.floor(Math.random() * L.spawn.length)];
      for (const [type, n] of Object.entries(wave)) for (let k = 0; k < n; k++) if (liveCount() + pendingSpawns() < capNow) queueSpawn(type);
    }
  }

  RT.timeLeft -= dt;
  if (RT.timeLeft <= 0) {
    RT.timeLeft = 0;
    renderHud();
    if (L.objective === "survive") levelClear(); else gameOver("timeout");
    return;
  }
  renderHud();
}

export function startLoop() {
  renderer.setAnimationLoop(() => {
  let dt = stepDt(Math.min(clock.getDelta(), 0.05), RT.paused);
  if (RT.paused) { renderer.render(scene, camera); return; } // duraklatma: oyun saati, zamanlayıcılar ve girdi donar; yalnızca son kare çizilir
  if (RT.hitStop > 0) { RT.hitStop -= dt; dt = 0; } // hit-stop: oyun saati donar (görüntü, kamera ve ses sürer)
  const t = clock.elapsedTime;
  ring.rotation.z += dt * 0.3;
  if (FX.borderGlow) borderMat.opacity = 0.38 + 0.12 * Math.sin(t * 1.6); // sınır çerçevesi nabzı
  const focus = wizard.position.clone().multiplyScalar(0.6);
  RT.shake = Math.max(RT.shake - dt * 2.5, 0);
  updateCamera(dt, focus.x, focus.z, (k) => rand(RT.shake * k * FX.shake));
  animateWizard(dt, t);
  updateWeather(dt, t, wizard.position.x, wizard.position.z);
  sceneryTick(dt, t);
  tickProps(t, dt);
  wand.intensity = 30 + Math.sin(t * 13) * 3 + Math.random() * 2; // asa ışığı titremesi
  pickups.forEach((p, i) => { p.mesh.position.y = 0.9 + Math.sin(t * 2.5 + i) * 0.2; p.mesh.rotation.y += dt * 1.5; });
  updateSparks(dt);
  tickCombatFx(dt);
  for (let i = bolts.length - 1; i >= 0; i--) {
    bolts[i].userData.life -= dt;
    bolts[i].material.opacity = Math.max(bolts[i].userData.life / 0.18, 0);
    if (bolts[i].userData.life <= 0) { removeObj(bolts[i]); bolts.splice(i, 1); }
  }
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i];
    f.t -= dt;
    const k = 1 - Math.max(f.t, 0) / f.life;
    f.m.scale.setScalar(f.r0 + (f.r1 - f.r0) * k);
    f.m.material.opacity = 0.8 * (1 - k);
    if (f.t <= 0) { scene.remove(f.m); f.m.material.dispose(); fxs.splice(i, 1); }
  }

  // Pırıl: ilk bölüm bittikten sonra büyücüyü çevreler
  piril.visible = S.level >= 1;
  animatePiril(dt, t);
  tickDying(dt, t); // ölen 3B model düşmanların ~0.35 sn'lik görsel ölümü (oynanış ölümü çoktan işlendi)

  if (RT.running) {
    if (dt > 0) update(dt, t);
    // Pırıl'ın Işığı: en yakın kristale çizgi
    let g = false;
    if (RT.running && S.piril) {
      let best = null, bd = 1e9;
      for (const p of pickups) if (p.type === "crystal") { const d = flatDist(p.mesh.position, wizard.position); if (d < bd) { bd = d; best = p; } }
      if (best) {
        const a = guideGeo.attributes.position.array;
        a[0] = wizard.position.x; a[1] = 0.3; a[2] = wizard.position.z; a[3] = best.mesh.position.x; a[4] = 0.3; a[5] = best.mesh.position.z;
        guideGeo.attributes.position.needsUpdate = true;
        g = true;
      }
    }
    guide.visible = g;
    updateAbilityUi();
  } else guide.visible = false;
  orbTip.getWorldPosition(_tip); // asa ışığı ve kıvılcımlar asanın ucunda
  wand.position.copy(_tip); wand.position.y += 0.25;
  if (Math.random() < 0.15) emit(_tip, orbTip.material.color.getHex(), 1, 0.8, 0.5);
  renderer.render(scene, camera);
  });
}
