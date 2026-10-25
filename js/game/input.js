import * as THREE from "three";
import { ABILITIES, ABILITY_ORDER, WEAPON_ORDER } from "../core/data.js";
import { INPUT, RT } from "../core/state.js";
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
  if (RT.paused) return; // duraklatmada oyun tuşları çalışmaz (Esc/P ui/pause.js'te)
  keys.add(e.code);
  if (e.code === "Space") { e.preventDefault(); cast(); }
  const m = /^Digit([1-7])$/.exec(e.code);
  if (m) selectWeapon(WEAPON_ORDER[+m[1] - 1]);
  const ab = ABILITY_ORDER.find((id) => ABILITIES[id].code === e.code);
  if (ab && !e.repeat) useAbility(ab);
});
addEventListener("keyup", (e) => keys.delete(e.code));
// joystick: boştayken sol altta sabit hayalet halka (.idle); dokununca parmağın yerinde belirir
const joyKnob = () => joyEl.firstElementChild;
function joyIdle() {
  joyEl.classList.add("idle");
  joyEl.style.left = ""; joyEl.style.top = "";
  joyKnob().style.transform = "";
}
addEventListener("pointermove", (e) => {
  if (e.pointerType !== "touch") mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (INPUT.joy && e.pointerId === INPUT.joy.id) {
    const R = Math.max(36, Math.round(joyEl.offsetWidth * 0.34));
    let dx = e.clientX - INPUT.joy.x, dy = e.clientY - INPUT.joy.y;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    INPUT.joy.dx = dx / R; INPUT.joy.dy = dy / R;
    joyKnob().style.transform = `translate(${dx}px, ${dy}px)`;
  }
});
addEventListener("pointerdown", (e) => {
  if (RT.paused || e.target.closest("button") || e.target.closest("#dock")) return;
  if (e.pointerType === "touch") {
    document.body.classList.add("touch");
    if (!INPUT.joy) {
      INPUT.joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      joyEl.classList.remove("idle");
      joyEl.classList.add("held");
      joyEl.style.left = e.clientX + "px";
      joyEl.style.top = e.clientY + "px";
      joyKnob().style.transform = "";
    }
  } else if (e.button === 0) cast(); // sağ tuş kamera döndürme içindir
});
export function endPointer(e) {
  if (INPUT.joy && e.pointerId === INPUT.joy.id) { INPUT.joy = null; joyEl.classList.remove("held"); joyIdle(); }
}
addEventListener("pointerup", endPointer);
addEventListener("pointercancel", endPointer);
fireEl.addEventListener("pointerdown", (e) => { if (RT.paused) return; e.preventDefault(); INPUT.fireHeld = true; fireEl.setPointerCapture(e.pointerId); cast(); });
export const stopFire = () => { INPUT.fireHeld = false; };
fireEl.addEventListener("pointerup", stopFire);
fireEl.addEventListener("pointercancel", stopFire);
addEventListener("mousemove", () => { INPUT.mouseSeen = true; });
// duraklatma/ekran değişimi: basılı tuş, joystick ve ateş durumu bırakılır (devam edince takılı hareket kalmaz)
export function releaseInput() {
  keys.clear();
  INPUT.fireHeld = false;
  INPUT.joy = null;
  joyEl.classList.remove("held");
  joyIdle();
}
joyIdle();
