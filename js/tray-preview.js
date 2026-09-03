import * as THREE from "three";
import { buildObject } from "./scene-builders.js";

/** Small spinning 3D thumbnail of the object waiting in the tray. */
export class TrayPreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);

    this.scene.add(new THREE.HemisphereLight(0xdce8f5, 0x40444a, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 4, 3);
    this.scene.add(key);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this.content = null;

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(canvas);

    this.renderer.setAnimationLoop(() => {
      this.pivot.rotation.y += 0.006;
      this.renderer.render(this.scene, this.camera);
    });
  }

  show(builderName) {
    if (this.content) {
      this.pivot.remove(this.content);
      this.content = null;
    }
    const { group } = buildObject(builderName);

    // recentre the object on the pivot so it spins around itself
    const bounds = new THREE.Box3().setFromObject(group);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    group.position.sub(center);
    this.pivot.add(group);
    this.content = group;
    this.pivot.rotation.y = 0.6;

    // frame it, but keep very long objects from shrinking to a hairline
    const extent = Math.min(Math.max(size.x, size.y, size.z), 4 * Math.max(size.x, size.y));
    const dist = Math.max(0.55, extent * 1.1);
    // a low three-quarter view so flat objects still read as solid shapes
    this.camera.position.set(dist * 0.75, dist * 0.42, dist * 0.75);
    this.camera.lookAt(0, 0, 0);
    this._resize();
  }

  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this._resizeObserver.disconnect();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}
