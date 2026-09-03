import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildEnvironment, buildObject } from "./scene-builders.js";

const DEG = Math.PI / 180;
const WALL_STANDOFF = 0.11;

/** Translucent copy of a group, used for the "there" preview. */
function makeGhost(group) {
  const ghost = group.clone(true);
  ghost.traverse((node) => {
    if (!node.isMesh) return;
    const src = Array.isArray(node.material) ? node.material[0] : node.material;
    const mat = src.clone();
    mat.transparent = true;
    mat.opacity = 0.55;
    mat.depthWrite = false;
    node.material = mat;
    node.castShadow = false;
    node.receiveShadow = false;
  });
  return ghost;
}

function tintClone(group, color, opacity) {
  const copy = group.clone(true);
  copy.traverse((node) => {
    if (!node.isMesh) return;
    node.material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    node.castShadow = false;
    node.receiveShadow = false;
  });
  return copy;
}

function disposeTree(root) {
  root.traverse((node) => {
    if (node.isMesh) {
      node.geometry?.dispose();
      // shared cached materials are reused across scenes; only clones are disposed
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const m of mats) if (m?.userData?.disposable) m.dispose();
    }
  });
}

export class ThreeApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.environmentRoot = null;
    this.surfaceMeshes = [];
    this.ghost = null;
    this.placed = null;
    this.marker = null;
    this.objectMeta = null;

    this._resize();
    this._onResize = () => this._resize();
    window.addEventListener("resize", this._onResize);
    // the canvas starts inside a hidden screen with zero size, so watch it rather
    // than trusting the window resize event alone
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(canvas);

    this._animate = this._animate.bind(this);
    this.renderer.setAnimationLoop(this._animate);
  }

  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    for (const child of [...this.scene.children]) {
      this.scene.remove(child);
      disposeTree(child);
    }
    this.environmentRoot = null;
    this.surfaceMeshes = [];
    this.ghost = null;
    this.placed = null;
    this.marker = null;
  }

  loadScene(sceneData) {
    this.clear();
    this._resize();

    const env = buildEnvironment(sceneData.builder);
    this.scene.add(env.group);
    this.environmentRoot = env.group;
    this.scene.background = env.background;
    this.scene.fog = env.fog;

    for (const light of env.lights) {
      if (light.castShadow) {
        light.shadow.mapSize.set(2048, 2048);
        const cam = light.shadow.camera;
        cam.near = 0.5;
        cam.far = 60;
        cam.left = -20;
        cam.right = 20;
        cam.top = 20;
        cam.bottom = -20;
        cam.updateProjectionMatrix();
        light.shadow.bias = -0.0006;
        light.shadow.normalBias = 0.02;
      }
      this.scene.add(light);
    }

    // invisible planes the pointer can land on
    for (const surface of sceneData.placementSurfaces) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(surface.size[0], surface.size[1]),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      mesh.material.userData.disposable = true;
      if (surface.type === "floor") {
        mesh.rotation.x = -90 * DEG;
        mesh.userData.normal = new THREE.Vector3(0, 1, 0);
      } else {
        const normal = new THREE.Vector3(
          surface.facing === "-x" ? -1 : surface.facing === "+x" ? 1 : 0,
          0,
          surface.facing === "-z" ? -1 : surface.facing === "+z" ? 1 : 0
        );
        mesh.lookAt(normal);
        mesh.userData.normal = normal;
      }
      mesh.position.fromArray(surface.center);
      mesh.userData.surfaceType = surface.type;
      this.scene.add(mesh);
      this.surfaceMeshes.push(mesh);
    }

    const built = buildObject(sceneData.missingObject.builder);
    this.objectMeta = built;
    this.solidTemplate = built.group;
    this.ghost = makeGhost(built.group);
    this.ghost.visible = false;
    this.scene.add(this.ghost);

    this._applyCamera(sceneData.camera);
  }

  _applyCamera(cfg) {
    this.camera.position.fromArray(cfg.position);
    this.controls.target.fromArray(cfg.lookAt);
    this.controls.minDistance = cfg.minDistance;
    this.controls.maxDistance = cfg.maxDistance;
    this.controls.minPolarAngle = cfg.minPolarDeg * DEG;
    this.controls.maxPolarAngle = cfg.maxPolarDeg * DEG;
    this.controls.update();

    // clamp azimuth to a window around the framing the scene was authored with
    const azimuth = this.controls.getAzimuthalAngle();
    const range = (cfg.azimuthRangeDeg ?? 40) * DEG;
    this.controls.minAzimuthAngle = azimuth - range;
    this.controls.maxAzimuthAngle = azimuth + range;
    this.controls.update();
  }

  /** Where is the pointer touching the scene? Returns world point + surface, or null. */
  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.surfaceMeshes, false);
    if (!hits.length) return null;
    const hit = hits[0];
    return {
      point: hit.point.clone(),
      normal: hit.object.userData.normal.clone(),
      surfaceType: hit.object.userData.surfaceType,
    };
  }

  /** Places a group as if the player aimed at `point` on `surface`. */
  _applyTransform(group, point, normal, surfaceType, rotationDeg) {
    const { anchor, height } = this.objectMeta;
    if (surfaceType === "wall") {
      group.position.copy(point).addScaledVector(normal, WALL_STANDOFF);
      if (anchor === "base") group.position.y = point.y;
      group.rotation.y = Math.atan2(-normal.z, normal.x);
    } else {
      group.position.copy(point);
      if (anchor === "center") group.position.y = point.y + height / 2;
      group.rotation.y = rotationDeg * DEG;
    }
  }

  showGhost(pick, rotationDeg) {
    this._applyTransform(this.ghost, pick.point, pick.normal, pick.surfaceType, rotationDeg);
    this.ghost.visible = true;
  }

  hideGhost() {
    if (this.ghost) this.ghost.visible = false;
  }

  /** Freezes the preview into a solid object and returns its placement. */
  lockPlacement(pick, rotationDeg) {
    this.hideGhost();
    const solid = this.solidTemplate.clone(true);
    this._applyTransform(solid, pick.point, pick.normal, pick.surfaceType, rotationDeg);
    this.scene.add(solid);
    this.placed = solid;
    return { point: pick.point.clone(), rotationDeg, surfaceType: pick.surfaceType };
  }

  /** Shows where the object actually belonged, for a missed placement. */
  showTargetMarker(sceneData) {
    if (this.marker) return;
    const target = sceneData.target;
    const point = new THREE.Vector3().fromArray(target.position);
    const surface = sceneData.placementSurfaces.find(
      (s) => s.type === (target.position[1] > 0.5 ? "wall" : "floor")
    ) ?? sceneData.placementSurfaces[0];
    const normal =
      surface.type === "wall"
        ? new THREE.Vector3(surface.facing === "-x" ? -1 : 1, 0, 0)
        : new THREE.Vector3(0, 1, 0);

    const marker = new THREE.Group();
    const correct = tintClone(this.solidTemplate, 0x4ade80, 0.5);
    this._applyTransform(correct, point, normal, surface.type, target.rotationDeg);
    marker.add(correct);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(target.toleranceMeters * 0.92, target.toleranceMeters, 48),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.copy(point).addScaledVector(normal, 0.03);
    if (surface.type === "wall") ring.lookAt(ring.position.clone().add(normal));
    else ring.rotation.x = -90 * DEG;
    marker.add(ring);

    this.marker = marker;
    this.scene.add(marker);
  }

  dispose() {
    window.removeEventListener("resize", this._onResize);
    this._resizeObserver.disconnect();
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.clear();
    this.renderer.dispose();
  }
}
