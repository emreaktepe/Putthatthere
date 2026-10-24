// Yetenekler: kimlik = davranış; süre/mesafe/çarpan değerleri data/game.config.json -> abilities.<id>.params.
import * as THREE from "three";
import { sfx } from "../audio/engine.js";
import { ABILITIES } from "../core/data.js";
import { RT, S, abilCd, moveDir } from "../core/state.js";
import { ARENA } from "../core/util.js";
import { burst } from "../render/fx.js";
import { wizard } from "../render/wizard.js";

export function useAbility(id) {
  if (!RT.running || !S.abilities.includes(id) || abilCd[id] > 0) return;
  const a = ABILITIES[id], p = a.params;
  abilCd[id] = a.cd;
  sfx("ability:" + id);
  if (id === "shield") {
    RT.shieldT = p.duration;
  } else if (id === "blink") {
    const d = moveDir.clone().setY(0).normalize();
    const from = wizard.position.clone();
    for (let i = 0; i <= 6; i++) burst(from.clone().addScaledVector(d, (p.dist * i) / 6).setY(1), 0x9ad7ff, 3);
    wizard.position.addScaledVector(d, p.dist);
    wizard.position.x = THREE.MathUtils.clamp(wizard.position.x, -ARENA + 0.5, ARENA - 0.5);
    wizard.position.z = THREE.MathUtils.clamp(wizard.position.z, -ARENA + 0.5, ARENA - 0.5);
    RT.invuln = Math.max(RT.invuln, p.iframes);
  } else if (id === "timeslow") {
    RT.timeslowT = p.duration;
  }
}

// düşman/mermi zaman ölçeği (Zaman Çatlağı etkinken yavaşlatma çarpanı)
export function timeFactor() {
  return RT.timeslowT > 0 && ABILITIES.timeslow ? ABILITIES.timeslow.params.factor : 1;
}
