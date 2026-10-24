import * as THREE from "three";
import { ABILITIES, ABILITY_ORDER, WEAPON_ORDER } from "../core/data.js";
import { INPUT } from "../core/state.js";
import { $ } from "../core/util.js";
import { useAbility } from "./abilities.js";
import { cast } from "./weapons.js";
import { selectWeapon } from "../ui/hud.js";

export const keys = new Set();
export const ray = new THREE.Raycaster();
export const mouse = new THREE.Vector2();
export const joyEl = $("joy"), fireEl = $("fire");
export const isTouch = matchMedia("(pointer: coarse)").matches;
if (isTouch) document.body.classList.add("touch");
addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Space") { e.preventDefault(); cast(); }
  const m = /^Digit([1-7])$/.exec(e.code);
  if (m) selectWeapon(WEAPON_ORDER[+m[1] - 1]);
  const ab = ABILITY_ORDER.find((id) => ABILITIES[id].code === e.code);
  if (ab && !e.repeat) useAbility(ab);
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "touch") mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (INPUT.joy && e.pointerId === INPUT.joy.id) {
    const R = 50;
    let dx = e.clientX - INPUT.joy.x, dy = e.clientY - INPUT.joy.y;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    INPUT.joy.dx = dx / R; INPUT.joy.dy = dy / R;
    joyEl.firstElementChild.style.transform = `translate(${dx}px, ${dy}px)`;
  }
});
addEventListener("pointerdown", (e) => {
  if (e.target.closest("button") || e.target.closest("#weapons")) return;
  if (e.pointerType === "touch") {
    document.body.classList.add("touch");
    if (!INPUT.joy) {
      INPUT.joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      joyEl.style.left = e.clientX + "px";
      joyEl.style.top = e.clientY + "px";
      joyEl.style.display = "block";
      joyEl.firstElementChild.style.transform = "";
    }
  } else if (e.button === 0) cast(); // sağ tuş kamera döndürme içindir
});
export function endPointer(e) {
  if (INPUT.joy && e.pointerId === INPUT.joy.id) { INPUT.joy = null; joyEl.style.display = "none"; }
}
addEventListener("pointerup", endPointer);
addEventListener("pointercancel", endPointer);
fireEl.addEventListener("pointerdown", (e) => { e.preventDefault(); INPUT.fireHeld = true; fireEl.setPointerCapture(e.pointerId); cast(); });
export const stopFire = () => { INPUT.fireHeld = false; };
fireEl.addEventListener("pointerup", stopFire);
fireEl.addEventListener("pointercancel", stopFire);
addEventListener("mousemove", () => { INPUT.mouseSeen = true; });
