import * as THREE from "three";
import { sfx } from "../audio/engine.js";
import { LEVELS, STRINGS } from "../core/data.js";
import { RT, S, enemies, enemyShots, pickups } from "../core/state.js";
import { ARENA, flatDist, rand } from "../core/util.js";
import { damagePlayer, killEnemy } from "./combat.js";
import { liveCount, spawnEnemy, spawnLights } from "./world.js";
import { setIce, setShieldVis } from "../render/enemies.js";
import { addBolt, addHazard, burst, makeShot } from "../render/fx.js";
import { scene } from "../render/scene.js";
import { wizard } from "../render/wizard.js";
import { toast } from "../ui/hud.js";

export function enemyShoot(e, ux, uz) {
  const m = makeShot(0xbfd8ff, "");
  m.scale.setScalar(0.8);
  m.position.copy(e.mesh.position);
  scene.add(m);
  enemyShots.push({ mesh: m, vx: ux * 7, vz: uz * 7, life: 4 });
  sfx("enemy_shot");
}

export function priestSupport(e) {
  const near = enemies.filter((o) => o !== e && !o.dead && !o.d.static && o.d.ai !== "boss" && o.d.ai !== "knight")
    .sort((a, b) => flatDist(a.mesh.position, e.mesh.position) - flatDist(b.mesh.position, e.mesh.position)).slice(0, 3);
  let weakest = null;
  for (const o of near) {
    o.shield = 6;
    addBolt(e.mesh.position, o.mesh.position, 0x6bff9a);
    if (o.hp < o.maxHp && (!weakest || o.hp < weakest.hp)) weakest = o;
  }
  if (weakest) weakest.hp = Math.min(weakest.hp + 1, weakest.maxHp);
}

export function enterBossPhase(e, ph) {
  e.bp = ph;
  RT.timeLeft += 10;
  sfx("phase:" + ph);
  if (ph === 2) {
    e.waveT = 3; RT.bossSummon = 2;
    toast(STRINGS.toasts.bossPhase2);
  } else {
    e.shielded = true; e.vuln = 0;
    spawnLights();
    toast(STRINGS.toasts.bossPhase3, 5000);
  }
}

export function bossLogic(e, dt, es) {
  const ratio = e.hp / e.maxHp;
  const ph = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
  if (ph > e.bp) enterBossPhase(e, ph);
  const edt = dt * es;
  if (e.bp === 1) {
    RT.bossSummon -= edt;
    if (RT.bossSummon <= 0) { RT.bossSummon = 6; e.atkT = 0.5; for (const id of e.d.summons1 || []) spawnEnemy(id); }
  } else if (e.bp === 2) {
    RT.bossSummon -= edt;
    if (RT.bossSummon <= 0) {
      RT.bossSummon = 6; e.atkT = 0.5;
      for (const id of e.d.summons2 || []) if (liveCount() < LEVELS[S.level].cap) spawnEnemy(id);
    }
    e.waveT -= edt;
    if (e.waveT <= 0) {
      e.waveT = 8; e.windT = 1.2; // yer halkası uyarısı süresince model "windup", patlama anında "attack" (ai.js updateEnemies)
      addHazard(wizard.position.x, wizard.position.z, 2.6, 1.2, 1, 0xff3355);
      addHazard(THREE.MathUtils.clamp(wizard.position.x + rand(7), -ARENA, ARENA), THREE.MathUtils.clamp(wizard.position.z + rand(7), -ARENA, ARENA), 2.6, 1.2, 1, 0xff3355);
    }
  } else if (e.shielded) {
    if (!pickups.some((p) => p.type === "light")) { // 3 ışık toplandı: kalkan kırılır
      e.shielded = false; e.vuln = 6; e.spd *= 1.1;
      burst(e.mesh.position, 0xbfe0ff, 30);
      sfx("boss_shield_break");
      toast(STRINGS.toasts.shieldBreak, 2500);
    }
  } else {
    e.vuln -= dt;
    if (e.vuln <= 0) {
      e.shielded = true;
      spawnLights();
      sfx("boss_shield_up");
      toast(STRINGS.toasts.shieldUp, 2500);
    }
  }
}

export function applyLook(e) {
  const slowed = e.slow > 0, fl = e.flash > 0;
  { // 3B model: renk karışımı setTint ile (vuruş flaşı beyaz, yavaşlama buz mavisi); yalnız durum değişince
    const key = fl ? 2 : slowed ? 1 : 0;
    if (key !== e.tintKey) { e.tintKey = key; e.vis.setTint(key === 2 ? 0xffffff : 0x9fdcff, key === 2 ? 0.75 : key === 1 ? 0.5 : 0); }
  }
  const k = Math.min(e.age / 0.35, 1), gk = 1 - (1 - k) * (1 - k); // belirme: yumuşak büyüme
  e.mesh.scale.set(e.base.x * gk, e.base.y * gk, e.base.z * gk);
  const sh = e.shield > 0 || !!e.shielded;
  setShieldVis(e, sh && !(e.vis && e.vis.setPhase), e.shielded ? 0xbfe0ff : 0x6bff9a); // Gölge Kral modelin kendi faz-3 kalkanını çizer: çift görüntü yok
  setIce(e, slowed);
}
export const turnTo = (cur, target, k) => cur + ((((target - cur + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * Math.min(1, k);

export function updateEnemies(dt, t, es) {
  for (const e of [...enemies]) {
    if (e.dead) continue;
    const d = e.d, p = e.mesh.position;
    e.slow = Math.max(e.slow - dt, 0);
    e.age += dt;
    e.flash = Math.max(e.flash - dt, 0);
    e.hurtT = Math.max(e.hurtT - dt, 0);
    e.atkT = Math.max(e.atkT - dt, 0);
    if (e.windT > 0) { e.windT = Math.max(e.windT - dt, 0); if (e.windT === 0 && d.ai === "boss") e.atkT = 0.4; } // uyarı bitti = saldırı anı
    if (e.shield > 0) e.shield = Math.max(e.shield - dt, 0);
    e.ts = es * (e.slow > 0 ? 0.35 : 1); // model animasyon hız çarpanı
    const edt = dt * e.ts;
    const dx = wizard.position.x - p.x, dz = wizard.position.z - p.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    const ux = dx / dist, uz = dz / dist;
    let mx = 0, mz = 0; // hareket (birim/sn)

    switch (d.ai) {
      case "chase": {
        let cx = ux, cz = uz;
        if (d.zig) { const a = Math.sin(t * 5 + e.phase) * 0.9, c = Math.cos(a), s = Math.sin(a); cx = ux * c + uz * s; cz = -ux * s + uz * c; }
        mx = cx * e.spd; mz = cz * e.spd;
        break;
      }
      case "ranged": { // Kemik Okçu: 7-9 birim mesafe tutar, 2.5 sn'de bir atar
        const want = dist > 9 ? 1 : dist < 7 ? -1 : 0;
        mx = ux * e.spd * want; mz = uz * e.spd * want;
        e.cd -= edt;
        e.windT = e.cd > 0 && e.cd < 0.5 ? 0.1 : 0; // ateş öncesi son 0,5 sn: silah parlaması (model "windup")
        if (e.cd <= 0) { e.cd = 2.5; enemyShoot(e, ux, uz); e.atkT = 0.3; } // atış anı ("attack")
        break;
      }
      case "charge": { // Kurt Ruhu: yaklaş -> çömel -> hücum -> yorgun
        if (e.st === "approach") {
          mx = ux * e.spd; mz = uz * e.spd;
          if (dist < 6) { e.st = "crouch"; e.tm = 0.7; }
        } else if (e.st === "crouch") {
          e.tm -= edt; e.windT = 0.1; // çömelme 0,7 sn ("windup")
          if (e.tm <= 0) { e.st = "charge"; e.tm = 0.6; e.cx = ux; e.cz = uz; }
        } else if (e.st === "charge") {
          mx = e.cx * 10; mz = e.cz * 10;
          e.atkT = 0.1; // hücum süresince "attack"; sonra yorgunlukta yavaş yürüyüş
          e.tm -= edt;
          if (e.tm <= 0) { e.st = "tired"; e.tm = 1; }
        } else {
          mx = ux * e.spd * 0.3; mz = uz * e.spd * 0.3;
          e.tm -= edt;
          if (e.tm <= 0) e.st = "approach";
        }
        break;
      }
      case "bomber": { // Kor Hortlak: yaklaşınca 0.5 sn kızarıp patlar
        if (e.fuse > 0) {
          e.fuse -= edt; e.windT = 0.1; // patlama öncesi kızarma 0,5 sn ("windup"); patlama anında düşman ölür ("dead")
          if (e.fuse <= 0) { e.suicide = true; killEnemy(e); continue; }
        } else {
          mx = ux * e.spd; mz = uz * e.spd;
          if (dist < 1.5) { e.fuse = 0.5; sfx("telegraph"); }
        }
        break;
      }
      case "support": { // Karanlık Rahip: uzak durur, 4 sn'de bir kalkan + iyileştirme
        const want = dist < 8 ? -1 : dist > 12 ? 1 : 0;
        mx = ux * e.spd * want; mz = uz * e.spd * want;
        e.cd -= edt;
        e.windT = e.cd > 0 && e.cd < 0.5 ? 0.1 : 0; // kalkan/iyileştirme öncesi son 0,5 sn ("windup")
        if (e.cd <= 0) { e.cd = 4; priestSupport(e); e.atkT = 0.6; } // verme anı ("attack")
        break;
      }
      case "static": { // Lanet Totemi: 12 sn'de bir Ruh doğurur
        e.cd -= edt;
        e.windT = e.cd > 0 && e.cd < 1 ? 0.1 : 0; // doğurmadan önceki son 1 sn ("windup"); sonra "attack"
        if (e.cd <= 0) { e.cd = 12; e.atkT = 0.8; if (d.summon && liveCount() < LEVELS[S.level].cap + 3) spawnEnemy(d.summon, { x: p.x + rand(1.5), z: p.z + rand(1.5) }); }
        break;
      }
      case "knight": { // Kemik Şövalye: yürür, 5 sn'de bir yere vurur (yarıçap 4 şok), %50 hp'de hızlanır
        if (!e.enraged && e.hp <= e.maxHp * 0.5) { e.enraged = true; e.spd = 1.6; e.cd = 0; toast(STRINGS.toasts.knightEnrage, 2000); }
        if (e.wind > 0) {
          e.wind -= edt; e.windT = 0.1; // yere vurma hazırlığı 1 sn ("windup"); biterken şok dalgası patlar ("attack")
          if (e.wind <= 0) e.atkT = 0.4;
        } else {
          mx = ux * e.spd; mz = uz * e.spd;
          e.cd -= edt;
          if (e.cd <= 0) { e.cd = 5; e.wind = 1; addHazard(p.x, p.z, 4, 1, 2, 0xff5544); sfx("slam"); }
        }
        break;
      }
      case "boss": {
        bossLogic(e, dt, es);
        if (!e.shielded) { /* kalkan yokken de yürür */ }
        mx = ux * e.spd; mz = uz * e.spd;
        break;
      }
    }

    e.moving = mx * mx + mz * mz > 0.01;
    if (d.ai === "chase") e.windT = d.dmg > 0 && RT.invuln <= 0 && dist < d.r + 1.2 ? 0.1 : 0; // temas hasarından hemen önce uyarı pozu
    p.x = THREE.MathUtils.clamp(p.x + mx * edt + e.kx * dt, -ARENA - 1, ARENA + 1);
    p.z = THREE.MathUtils.clamp(p.z + mz * edt + e.kz * dt, -ARENA - 1, ARENA + 1);
    const kd = Math.exp(-dt * 10); // vuruş geri itmesi hızla söner
    e.kx *= kd; e.kz *= kd;
    p.y = d.y + Math.sin(t * 3 + e.phase) * (d.bob !== undefined ? d.bob : 0.3);
    if (d.ai !== "static") e.mesh.rotation.y = turnTo(e.mesh.rotation.y, Math.atan2(ux, uz), dt * 8); // düşman oyuncuya dönük
    applyLook(e);
    if (e.anim) e.anim(t, e);
    if (e.blob) e.blob.position.set(p.x, 0.04, p.z);

    if (d.dmg > 0 && RT.invuln <= 0 && dist < d.r + 0.5) {
      e.atkT = 0.4;
      damagePlayer(d.dmg);
      if (!RT.running) return;
    }
  }
}
