// Paylaşılan oyun durumu. S: koşu (run) durumu (kayıt/snapshot bunu serileştirir); RT: bölüm içi çalışma zamanı değerleri.
// DOM'a dokunmaz (Three.js yalnızca ortak vektörler için).
import * as THREE from "three";
import { ABILITY_ORDER, GAME, PLAYER, WEAPON_ORDER } from "./data.js";
import { DDA_NEUTRAL } from "../game/dda.js";

export const S = {};
let snapshot = null;
// yeni koşunun başlangıç durumu (kayıt doğrulayıcısı da tür/varsayılan kaynağı olarak bunu kullanır)
export function defaultRun() {
  const hp = PLAYER.startHp ?? GAME.startHp;
  return {
    level: 0, hp, maxHp: hp, speedMul: 1, dmgMul: 1, cdMul: 1, magnet: 0, unlocked: [WEAPON_ORDER[0]], weapon: WEAPON_ORDER[0], score: 0,
    abilities: [], kills: 0, echo: 0, rain: 0, pierce: false, vampire: false, piril: false, stoneLevels: 0, perkCount: {}, lastPerk: "",
  };
}
export function newRun() { Object.assign(S, defaultRun()); }
// S'yi bütünüyle verilen koşu nesnesiyle değiştirir (kayıttan devam / alıştırmadan dönüş)
export function setRun(run) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, JSON.parse(JSON.stringify(run)));
}
export const takeSnapshot = () => { snapshot = JSON.parse(JSON.stringify(S)); };
export const restoreSnapshot = () => { Object.assign(S, JSON.parse(JSON.stringify(snapshot))); };

// bölüm içi değerler (eskiden modül düzeyinde let değişkenleriydi)
export const RT = {
  running: false, cooldown: 0, invuln: 0, spawnTimer: 0, bossSummon: 0, bossRef: null, totemsDown: 0, collected: 0,
  timeLeft: 0, shieldT: 0, timeslowT: 0, stoneReady: false, shake: 0, paused: false, killBase: 0,
  // Aşama 1: bölüm süresi (sn), alınan vuruş sayısı, DDA yardım kademesi/çarpanları, DDA ek canı, ilk-giriş ipucu kuyruğu [{ at, text }]
  elapsed: 0, lastKill: 0, hits: 0, crystalQ: [], /* bekleyen kristal doğmaları (sn) */ dda: { ...DDA_NEUTRAL }, ddaHp: 0, hintQ: [],
};
export const abilCd = {};
export function resetAbilityCooldowns() { for (const id of ABILITY_ORDER) abilCd[id] = 0; }
export function initState() { newRun(); resetAbilityCooldowns(); }

// canlı nesne listeleri (sahne nesneleriyle birlikte yaşar)
export const pickups = []; // { mesh, type: "crystal" | "heart" | "light" }
export const enemies = [];
export const shots = [];
export const enemyShots = [];
export const bolts = [];
export const hazards = [];
export const clouds = [];
export const strikes = [];
export const fxs = [];
export const echoQ = [];

// nişan / hareket yönü (input.js yazar; weapons.js, abilities.js, loop.js okur)
export const aim = new THREE.Vector3(0, 0, -1);
export const aimPoint = new THREE.Vector3(0, 0, -6);
export const moveDir = new THREE.Vector3(0, 0, -1);
export const UP = new THREE.Vector3(0, 1, 0);

// girdi durumu (game/input.js yazar; loop.js ve ui/screens.js okur). joy: { id, x, y, dx, dy } | null
export const INPUT = { joy: null, fireHeld: false, mouseSeen: false };
