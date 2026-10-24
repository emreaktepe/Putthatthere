// Sahne figürleri (Zerrin, Taşkın, Veyis-insan): arenanın kenarında duran, savaşa katılmayan 3B figürler. Mantık: propsvis.js.
// Her figür ilk gerektiğinde bir kez kurulur, sonra yalnız gizlenir/gösterilir (bölüm geçişinde yeniden kurulum yok); disposeProps() hepsini bırakır.
// Çarpışma/hedef/düşman sayacı yok (enemies/pickups dizilerine girmez), ışık yok, gerçek gölge yok (yumuşak "blob" gölge: +1 çizim).
import * as THREE from "three";
import { readQuality, resolveQuality, detectEnv } from "../core/quality.js";
import { ARENA } from "../core/util.js";
import { BLOB_GEO, BLOB_MAT } from "./enemies.js";
import { drawCalls } from "./enemyvis.js";
import { NOD_ANGLE, PROP_SPECS, liftProp, ZERRIN_AWAY, angleDiff, damp, faceYaw, nodAmount, veyisGrow, visibleProps, zerrinMode, zerrinYawTarget } from "./propsvis.js";
import { scene } from "./scene.js";
import { wizard } from "./wizard.js";

const propsGroup = new THREE.Group();
propsGroup.name = "sahne_figurleri";
scene.add(propsGroup);
const built = {}; // id -> { root, vis, blob, yaw, base, shownAt }
let cur = { phase: "none", ids: [] }, clock = 0;

function build(id) {
  const spec = PROP_SPECS[id];
  const vis = spec.create({ scale: spec.scale });
  vis.update(0, 0, "idle");
  liftProp(vis, spec);
  vis.group.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  const root = new THREE.Group();
  root.add(vis.group);
  const blob = new THREE.Mesh(BLOB_GEO, BLOB_MAT);
  blob.position.y = 0.03;
  blob.scale.setScalar(spec.shadow * 2);
  root.add(blob);
  root.visible = false;
  propsGroup.add(root);
  const p = { id, root, vis, blob, yaw: 0, base: 0, shownAt: 0 };
  if (spec.at) {
    root.position.set(spec.at[0], 0, spec.at[1]);
    p.base = p.yaw = faceYaw(spec.at[0], spec.at[1], spec.face[0], spec.face[1]);
    if (id === "zerrin") p.yaw = p.base + ZERRIN_AWAY;
    root.rotation.y = p.yaw;
  }
  built[id] = p;
  return p;
}

// Oyun akışı bildirimi: şu an hangi aşamadayız. Görünmesi gerekenler gösterilir, diğerleri gizlenir.
export function setPropsPhase({ phase, levelId, levelIds, completed }) {
  const quality = resolveQuality(readQuality(globalThis.localStorage), detectEnv());
  const want = visibleProps({ phase, levelId, levelIds, completed, quality });
  for (const id of Object.keys(built)) if (!want.includes(id)) built[id].root.visible = false;
  for (const id of want) {
    const p = built[id] || build(id);
    if (!p.root.visible) {
      p.root.visible = true;
      p.shownAt = clock;
      if (id === "veyis") { // Aldemir'in karşısında, ona dönük
        const wx = wizard.position.x, wz = wizard.position.z, x = THREE.MathUtils.clamp(wx, -ARENA + 2, ARENA - 2), z = THREE.MathUtils.clamp(wz - 3.4, -ARENA + 2, ARENA - 2);
        p.root.position.set(x, 0, z);
        p.root.rotation.y = faceYaw(x, z, wx, wz);
        p.root.scale.setScalar(0.001);
      }
    }
  }
  cur = { phase, ids: want };
}

export function tickProps(t, dt) {
  clock = t;
  for (const id of cur.ids) {
    const p = built[id];
    if (!p) continue;
    if (id === "zerrin") {
      const err = angleDiff(p.yaw, zerrinYawTarget(p.base, cur.phase));
      p.yaw += err * (1 - Math.exp(-3 * dt));
      p.root.rotation.y = p.yaw;
      p.vis.update(t, dt, zerrinMode(err));
      liftProp(p.vis, PROP_SPECS.zerrin);
    } else if (id === "taskin") {
      p.vis.update(t, dt, "idle");
      p.vis.parts.head.rotation.x = NOD_ANGLE * nodAmount(t); // ara sıra kafasını eğer
    } else {
      p.vis.update(t, dt, "idle");
      p.root.scale.setScalar(Math.max(veyisGrow(t - p.shownAt), 0.001));
    }
  }
}

// ölçüm/rapor: görünür figürlerin üçgen ve çizim çağrısı toplamı
export function propsStats() {
  let triangles = 0, calls = 0;
  for (const id of cur.ids) { const p = built[id]; if (p) { triangles += p.vis.stats.triangles; calls += drawCalls(p.root); } }
  return { visible: [...cur.ids], triangles, drawCalls: calls };
}

export function disposeProps() {
  for (const id of Object.keys(built)) { built[id].vis.dispose(); propsGroup.remove(built[id].root); delete built[id]; }
  cur = { phase: "none", ids: [] };
}
