const SVG_NS = "http://www.w3.org/2000/svg";
const ROTATE_STEP = 5;
const ROTATE_STEP_SHIFT = 15;

function makeGroup(markup, extraClass) {
  const g = document.createElementNS(SVG_NS, "g");
  if (extraClass) g.setAttribute("class", extraClass);
  for (const child of markup.children) {
    g.appendChild(child.cloneNode(true));
  }
  return g;
}

function setTransform(el, cx, cy, rotationDeg, w, h) {
  el.setAttribute(
    "transform",
    `translate(${cx} ${cy}) rotate(${rotationDeg}) translate(${-w / 2} ${-h / 2})`
  );
}

export class PointerController {
  /**
   * @param {SVGSVGElement} svg
   * @param {{ghostLayer: SVGGElement, placedLayer: SVGGElement, trayEl: HTMLElement, trayIcon: SVGSVGElement}} els
   * @param {{onConfirmReady: (ready: boolean) => void, onRotateHintVisible: (v: boolean) => void}} callbacks
   */
  constructor(svg, els, callbacks) {
    this.svg = svg;
    this.els = els;
    this.callbacks = callbacks;
    this.state = "IDLE";
    this.scene = null;
    this.objectMarkup = null;
    this.ghostEl = null;
    this.rotationDeg = 0;
    this.point = null;

    this._onTrayDown = this._onTrayDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onCanvasClick = this._onCanvasClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this.els.trayEl.addEventListener("pointerdown", this._onTrayDown);
    this.svg.addEventListener("pointermove", this._onPointerMove);
    this.svg.addEventListener("click", this._onCanvasClick);
    window.addEventListener("keydown", this._onKeyDown);
  }

  loadScene(scene, objectMarkup) {
    this.scene = scene;
    this.objectMarkup = objectMarkup;
    this.rotationDeg = scene.missingObject.defaultRotationDeg;
    this._clearGhost();
    this.els.placedLayer.replaceChildren();
    this.els.trayEl.classList.remove("selected", "empty");
    this.els.trayIcon.setAttribute("viewBox", objectMarkup.viewBox);
    this.els.trayIcon.replaceChildren(...objectMarkup.children.map((c) => c.cloneNode(true)));
    this._setState("IDLE");
  }

  _setState(state) {
    this.state = state;
    this.callbacks.onConfirmReady(state === "DESTINATION_CONFIRMED");
    this.callbacks.onRotateHintVisible(
      state === "DESTINATION_CONFIRMED" && this.scene.target.rotationRequired
    );
  }

  _clearGhost() {
    this.els.ghostLayer.replaceChildren();
    this.ghostEl = null;
    this.point = null;
  }

  _toSvgPoint(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  _onTrayDown(e) {
    if (this.state === "LOCKED") return;
    e.preventDefault();
    if (this.state === "IDLE") {
      this.els.trayEl.classList.add("selected");
      this._setState("OBJECT_SELECTED");
    } else {
      // re-clicking tray while selected/hovered/confirmed cancels back to idle
      this.els.trayEl.classList.remove("selected");
      this.els.trayEl.classList.remove("empty");
      this._clearGhost();
      this._setState("IDLE");
    }
  }

  _onPointerMove(e) {
    if (this.state !== "OBJECT_SELECTED" && this.state !== "DESTINATION_HOVERED") return;
    const { x, y } = this._toSvgPoint(e.clientX, e.clientY);
    const { width: w, height: h } = this.scene.missingObject;

    if (!this.ghostEl) {
      this.ghostEl = makeGroup(this.objectMarkup, "ghost-preview");
      this.els.ghostLayer.appendChild(this.ghostEl);
    }
    setTransform(this.ghostEl, x, y, this.rotationDeg, w, h);
    this.point = { x, y };
    if (this.state === "OBJECT_SELECTED") this._setState("DESTINATION_HOVERED");
  }

  _onCanvasClick(e) {
    if (this.state === "DESTINATION_HOVERED") {
      // lock the hover point in as the confirmed destination
      this.ghostEl.classList.remove("ghost-preview");
      this.ghostEl.classList.add("ghost-confirmed");
      this._setState("DESTINATION_CONFIRMED");
    } else if (this.state === "DESTINATION_CONFIRMED") {
      // re-position: move confirmed point, keep rotation
      const { x, y } = this._toSvgPoint(e.clientX, e.clientY);
      const { width: w, height: h } = this.scene.missingObject;
      setTransform(this.ghostEl, x, y, this.rotationDeg, w, h);
      this.point = { x, y };
    }
  }

  _onKeyDown(e) {
    if (e.key === "Escape") {
      if (this.state !== "IDLE" && this.state !== "LOCKED") {
        this.els.trayEl.classList.remove("selected");
        this._clearGhost();
        this._setState("IDLE");
      }
      return;
    }
    if (this.state !== "DESTINATION_CONFIRMED") return;
    if (!this.scene.target.rotationRequired) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.shiftKey ? ROTATE_STEP_SHIFT : ROTATE_STEP;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    this.rotationDeg = (this.rotationDeg + dir * step + 360) % 360;
    const { width: w, height: h } = this.scene.missingObject;
    setTransform(this.ghostEl, this.point.x, this.point.y, this.rotationDeg, w, h);
  }

  /** Locks the current placement, freezes it into the placed layer, returns {x,y,rotationDeg}. */
  lock() {
    if (this.state !== "DESTINATION_CONFIRMED" || !this.point) return null;
    const placement = { x: this.point.x, y: this.point.y, rotationDeg: this.rotationDeg };
    const placed = makeGroup(this.objectMarkup, "placed-object");
    const { width: w, height: h } = this.scene.missingObject;
    setTransform(placed, placement.x, placement.y, placement.rotationDeg, w, h);
    this.els.placedLayer.appendChild(placed);
    this._clearGhost();
    this.els.trayEl.classList.add("empty");
    this._setState("LOCKED");
    return placement;
  }

  destroy() {
    this.els.trayEl.removeEventListener("pointerdown", this._onTrayDown);
    this.svg.removeEventListener("pointermove", this._onPointerMove);
    this.svg.removeEventListener("click", this._onCanvasClick);
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
