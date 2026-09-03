const ROTATE_STEP = 5;
const ROTATE_STEP_SHIFT = 15;
/** A pointer that travels further than this between down and up was an orbit drag, not a click. */
const CLICK_SLOP_PX = 6;

export class PlacementController {
  /**
   * @param {import("./three-app.js").ThreeApp} app
   * @param {{canvas: HTMLElement, trayEl: HTMLElement}} els
   * @param {{onConfirmReady: (ready: boolean) => void, onRotateHintVisible: (v: boolean) => void}} callbacks
   */
  constructor(app, els, callbacks) {
    this.app = app;
    this.els = els;
    this.callbacks = callbacks;
    this.state = "IDLE";
    this.scene = null;
    this.rotationDeg = 0;
    this.pick = null;
    this._downAt = null;

    this._onTrayDown = this._onTrayDown.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this.els.trayEl.addEventListener("pointerdown", this._onTrayDown);
    this.els.canvas.addEventListener("pointerdown", this._onPointerDown);
    this.els.canvas.addEventListener("pointermove", this._onPointerMove);
    this.els.canvas.addEventListener("pointerup", this._onPointerUp);
    window.addEventListener("keydown", this._onKeyDown);
  }

  loadScene(scene) {
    this.scene = scene;
    this.rotationDeg = scene.missingObject.defaultRotationDeg;
    this.pick = null;
    this.app.hideGhost();
    this.els.trayEl.classList.remove("selected", "empty");
    this._setState("IDLE");
  }

  _setState(state) {
    this.state = state;
    this.callbacks.onConfirmReady(state === "DESTINATION_CONFIRMED");
    this.callbacks.onRotateHintVisible(
      state === "DESTINATION_CONFIRMED" && this.scene.target.rotationRequired
    );
  }

  _cancel() {
    this.els.trayEl.classList.remove("selected");
    this.app.hideGhost();
    this.pick = null;
    this._setState("IDLE");
  }

  _onTrayDown(e) {
    if (this.state === "LOCKED") return;
    e.preventDefault();
    if (this.state === "IDLE") {
      this.els.trayEl.classList.add("selected");
      this._setState("OBJECT_SELECTED");
    } else {
      this._cancel();
    }
  }

  _onPointerDown(e) {
    this._downAt = { x: e.clientX, y: e.clientY };
  }

  _onPointerMove(e) {
    if (this.state !== "OBJECT_SELECTED" && this.state !== "DESTINATION_HOVERED") return;
    const pick = this.app.pick(e.clientX, e.clientY);
    if (!pick) return;
    this.pick = pick;
    this.app.showGhost(pick, this.rotationDeg);
    if (this.state === "OBJECT_SELECTED") this._setState("DESTINATION_HOVERED");
  }

  _onPointerUp(e) {
    const down = this._downAt;
    this._downAt = null;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved > CLICK_SLOP_PX) return; // the player was orbiting the camera

    if (this.state === "DESTINATION_HOVERED") {
      this._setState("DESTINATION_CONFIRMED");
    } else if (this.state === "DESTINATION_CONFIRMED") {
      const pick = this.app.pick(e.clientX, e.clientY);
      if (!pick) return;
      this.pick = pick;
      this.app.showGhost(pick, this.rotationDeg);
    }
  }

  _onKeyDown(e) {
    if (e.key === "Escape") {
      if (this.state !== "IDLE" && this.state !== "LOCKED") this._cancel();
      return;
    }
    if (this.state !== "DESTINATION_CONFIRMED") return;
    if (!this.scene.target.rotationRequired) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.shiftKey ? ROTATE_STEP_SHIFT : ROTATE_STEP;
    this.rotationDeg = (this.rotationDeg + (e.key === "ArrowRight" ? step : -step) + 360) % 360;
    this.app.showGhost(this.pick, this.rotationDeg);
  }

  /** Commits the placement. Returns {point, rotationDeg, surfaceType} or null. */
  lock() {
    if (this.state !== "DESTINATION_CONFIRMED" || !this.pick) return null;
    const placement = this.app.lockPlacement(this.pick, this.rotationDeg);
    this.els.trayEl.classList.add("empty");
    this._setState("LOCKED");
    return placement;
  }

  destroy() {
    this.els.trayEl.removeEventListener("pointerdown", this._onTrayDown);
    this.els.canvas.removeEventListener("pointerdown", this._onPointerDown);
    this.els.canvas.removeEventListener("pointermove", this._onPointerMove);
    this.els.canvas.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
