import { sfx } from "../audio/engine.js";
import { LEVELS, WEAPONS } from "../core/data.js";
import { RT, S, enemies } from "../core/state.js";
import { flatDist } from "../core/util.js";
import { gameOver, levelClear } from "./flow.js";
import { MULT, matchupLevel } from "./matchup.js";
import { crystalGoalMet } from "./spawnmath.js";
import { damageMul, onEmberBlast, onEnemyHurt, onEnemyKilled } from "./skillrun.js";
import { veilBlocks } from "./skills.js";
import { popTag } from "../ui/dmgtags.js";
import { placePickup } from "./world.js";
import { retireEnemy } from "../render/enemies.js";
import { addFx, burst } from "../render/fx.js";
import { scene } from "../render/scene.js";
import { wizard } from "../render/wizard.js";
import { flashHurt, renderHud } from "../ui/hud.js";

const KILL_EPS = 0.05; // kesirli hasarın kalan canı <= 0.05 ölüm sayılır ("0.1 canlı hayalet" kötü hissi çıkmasın)
let elementColor = null;
const colorOf = (el) => {
  if (!elementColor) { elementColor = {}; for (const w of Object.values(WEAPONS)) if (w.element && elementColor[w.element] === undefined) elementColor[w.element] = w.color; }
  return elementColor[el] ?? 0xffffff;
};

// element: silahın elementi (karşıtlık çarpanı için; yoksa x1). slow: null | { t, k } (süre sn, zaman ölçeği)
export function hurt(e, dmg, slow, bypassShield = false, element = null) {
  if (e.dead) return;
  if (e.shielded) { burst(e.mesh.position, 0xbfe0ff, 4); sfx("shield_block"); return; } // Gölge Kral Faz 3 kalkanı
  if (e.shield > 0 && !bypassShield) { e.shield = 0; burst(e.mesh.position, 0x6bff9a, 6); sfx("shield_block"); return; }
  if (veilBlocks(e.veiled, element)) { burst(e.mesh.position, 0xbfd8ff, 3); return; } // Sis Perdesi: Arcane/Ay Işığı dışında vurulamaz
  const lvl = matchupLevel(element, e.d.tags, e.d.res);
  dmg *= MULT[lvl] * damageMul(e);
  if (lvl !== "N") popTag(e, lvl, colorOf(element));
  e.hp -= dmg;
  onEnemyHurt(e);
  if (e.d.ai === "boss" && e.bp < 3) e.hp = Math.max(e.hp, e.maxHp * (e.bp === 1 ? 0.66 : 0.33) - 0.001); // faz atlanmasın
  if (slow) { e.slow = (slow && slow.t) || 3; e.slowK = (slow && slow.k) || 0.35; }
  burst(e.mesh.position, e.d.emissive === 0 ? 0xffffff : e.d.color, 5);
  e.hurtT = 0.28; // 3B model "hurt" modu
  e.flash = 0.1; // vuruş geri bildirimi: beyaz parlama + hafif geri itme
  if (!e.d.static && e.d.ai !== "boss" && e.d.ai !== "knight") {
    const dx = e.mesh.position.x - wizard.position.x, dz = e.mesh.position.z - wizard.position.z, l = Math.hypot(dx, dz) || 1;
    e.kx = (dx / l) * 3; e.kz = (dz / l) * 3;
  }
  sfx("hit");
  if (e.hp <= KILL_EPS) killEnemy(e);
}

export function explodeEmber(e) {
  e.exploded = true;
  const p = e.mesh.position;
  addFx(p.x, p.z, 0xff7a2a, 0.4, 2.5, 0.35);
  burst(p, 0xff9a3a, 24);
  sfx("explode");
  RT.shake = Math.max(RT.shake, 0.25);
  if (RT.invuln <= 0 && flatDist(p, wizard.position) < 2.5) damagePlayer(1);
  for (const o of [...enemies]) if (o !== e && !o.dead && flatDist(o.mesh.position, p) < 2.5) hurt(o, 1, false);
  onEmberBlast(e); // Zincir Patlama + ateş lekesi (yalnız emberChain açıkken)
}

export function killEnemy(e) {
  if (e.dead) return;
  const i = enemies.indexOf(e);
  if (i < 0) return;
  e.dead = true;
  RT.lastKill = RT.elapsed;
  enemies.splice(i, 1);
  if (e.blob) scene.remove(e.blob);
  onEnemyKilled(e);
  retireEnemy(e); // 3B modeller ~0.35 sn "dead" animasyonu oynar; oynanış (hedefleme, çarpışma, puan, drop) yukarıda/aşağıda anında işlenir
  burst(e.mesh.position, e.d.color, 14);
  if (e.d.ai === "boss" || e.d.ai === "knight") { RT.shake = Math.max(RT.shake, 0.6); burst(e.mesh.position, 0xffffff, 30); }
  sfx("kill:" + e.d.model);
  if (e.d.ai === "bomber" && !e.exploded) explodeEmber(e);
  if (e.d.ai === "support") for (const o of enemies) if (flatDist(o.mesh.position, e.mesh.position) < 8) o.shield = 0;
  if (!e.suicide && !e.revived) { // diriltilen düşman puan/öldürme/düşme vermez (Diriltme sömürüsü yok)
    S.score += e.d.score;
    if (!e.d.static) {
      S.kills++;
      if (S.vampire && S.kills % 12 === 0 && S.hp < S.maxHp) { S.hp = Math.min(S.hp + 1, S.maxHp); burst(wizard.position.clone().setY(1.5), 0xff3b5c, 8); }
    }
    if (Math.random() < e.d.drop * RT.dda.heartMul) placePickup("heart", e.mesh.position.clone().setY(0.9));
  }
  if (e.d.ai === "static") {
    RT.totemsDown++;
    burst(e.mesh.position, 0xa8ffe8, 24); // Pırıl'a ışık patlaması
    sfx("totem_down");
    if (RT.totemsDown >= LEVELS[S.level].goal) levelClear();
  }
  if (e.d.ai === "boss" || e.d.ai === "knight") { RT.bossRef = null; levelClear(); }
  // minKills (K4): kristal hedefi tamam ve öldürme sayısı yeter -> bu öldürme bölümü bitirir
  { const L = LEVELS[S.level]; if (!e.d.static && !e.suicide && L && L.objective === "crystal" && RT.running && crystalGoalMet(L, RT.collected, S.kills - RT.killBase)) levelClear(); }
}

export function damagePlayer(n) {
  if (!RT.running) return;
  if (RT.shieldT > 0) {
    RT.shieldT = 0;
    RT.invuln = 0.6;
    burst(wizard.position.clone().setY(1.2), 0x5ab4ff, 16);
    sfx("shield_break");
    RT.shake = Math.max(RT.shake, 0.2);
    return;
  }
  if (RT.stoneReady) { n *= 0.5; RT.stoneReady = false; }
  S.hp -= n;
  RT.hits++;
  RT.invuln = 1.5;
  burst(wizard.position.clone().setY(1.2), 0xff4d6d);
  sfx("hurt");
  RT.shake = Math.max(RT.shake, 0.45);
  flashHurt();
  if (S.hp <= 0) { renderHud(); gameOver(); }
}
