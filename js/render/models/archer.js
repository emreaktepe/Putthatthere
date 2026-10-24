// Köken: Emre'nin "Büyücünün Gecesi 3D Full12 Pro v2" 3B model paketi (js/render/models/archer.js), değiştirilmeden alındı (common.js v1 ile aynı).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js + enemyvis.js (düşmanlar).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Archer — layered skeletal anatomy, curved bow + string, arrow windup. Y-up, faces +Z. */
export function createArcher({scale=1,color=0xe8e4d0}={}){
 const r=createRig('Kemik_Okcu',{scale,color}),a=r.actor;
 const bone=r.mat('porous aged bone',color,{rough:.96}),ivory=r.mat('highlighted bone',0xfff1d9,{rough:.94}),oldBone=r.mat('old shadow bone',0x8f8a83,{rough:.98});
 const cloth=r.mat('royal plum rags',0x432858,{rough:.95,side:THREE.DoubleSide}),black=r.mat('void',0x171221,{rough:1,tint:false});
 const bronze=r.mat('antique bronze',0xb68a53,{metal:.65,rough:.5}),leather=r.mat('dark leather',0x38262a,{rough:1}),glow=r.mat('azure soul fire',0x9ceaff,{glow:1.35,tint:false}),cord=r.mat('bow string',0xdbd6ca,{rough:.9});
 const torso=r.grp(a,0,0,0),legs=[],arms=[];
 const loin=r.ringDrape(torso,cloth,[[.48,.28,1],[.74,.27,1],[1.06,.21,.8]],16,{waves:7,offset:.9});
 r.cyl(torso,bone,0,1.16,0,.105,.115,.48,9);r.ell(torso,oldBone,0,1.18,0,.13,.37,.14,11);
 for(const s of [-1,1]){
  for(let i=0;i<4;i++){
   const y=1.01+i*.145,w=.30-.042*i;
   r.link(torso,bone,[s*.08,y,-.025],[s*w,y-.055,.095],.043);
   r.link(torso,ivory,[s*w,y-.055,.095],[s*.04,y-.13,.19],.028);
  }
  const hip=r.grp(torso,s*.17,.89,0);legs.push(hip);
  r.ell(hip,bone,0,-.06,0,.13,.17,.13,11);
  r.link(hip,bone,[0,-.17,0],[s*.035,-.43,.05],.07);r.ell(hip,ivory,s*.035,-.43,.05,.085,.1,.08,9);
  r.link(hip,bone,[s*.035,-.46,.05],[s*.02,-.76,.07],.059);
  r.box(hip,leather,s*.02,-.78,.19,.17,.13,.30);r.box(hip,leather,s*.02,-.66,.14,.145,.09,.06);
  r.oct(torso,bone,s*.23,.91,0,.16,.12,.15);
 }
 r.ell(torso,leather,0,.98,.17,.30,.065,.21,10);r.box(torso,bronze,0,.99,.27,.18,.13,.06);
 r.link(torso,bronze,[-.24,1.44,.05],[.27,1.04,.18],.024);
 const hood=r.grp(torso,0,1.72,0);
 r.ell(hood,oldBone,0,.06,-.1,.36,.38,.32,15);
 r.ell(hood,bone,0,.05,.095,.287,.325,.265,16);
 r.box(hood,bone,0,-.19,.25,.34,.135,.26);
 for(const s of [-1,1]){
  r.ell(hood,black,s*.125,.10,.324,.084,.075,.027,10);r.ell(hood,glow,s*.125,.10,.351,.034,.046,.017,9);
  r.link(hood,oldBone,[s*.24,-.08,.25],[s*.09,-.18,.35],.027);
  r.cone(hood,ivory,s*.145,-.17,.36,0,.025,.085,6);
 }
 r.ell(hood,black,0,-.035,.34,.08,.075,.021,9);
 r.cone(hood,ivory,0,-.02,.38,0,.06,.115,8).rotation.x=Math.PI/2;
 for(let i=0;i<5;i++)r.box(hood,oldBone,(-2+i)*.058,-.245,.38,.036,.049,.05);
 r.ringDrape(hood,cloth,[[-.18,.32,1],[-.05,.36,1],[.22,.31,.94],[.42,.18,.82]],18,{waves:5,offset:.3});
 const bowArm=r.grp(torso,-.27,1.46,0),drawArm=r.grp(torso,.27,1.46,0);arms.push(bowArm,drawArm);
 for(const [s,arm] of [[-1,bowArm],[1,drawArm]]){
  r.ell(arm,leather,s*.07,-.13,0,.16,.18,.19,12);
  r.link(arm,bone,[s*.08,-.19,0],[s*.13,-.43,.13],.071);
  r.ell(arm,bone,s*.13,-.43,.13,.086,.10,.09,10);
  r.link(arm,bone,[s*.13,-.44,.13],[s*.11,-.67,.30],.058);
  r.ell(arm,bone,s*.11,-.72,.34,.10,.10,.09,9);
  r.box(arm,leather,s*.12,-.52,.27,.15,.105,.16);
 }
 // Bow rises beside left forearm; elegant recurve with visible taut bowstring.
 const bow=r.grp(bowArm,-.25,-.55,.45);
 r.path(bow,bronze,[[0,-.73,0],[-.20,-.52,0],[-.25,-.21,0],[-.11,0,0],[.06,.18,0],[.16,.45,0],[.05,.74,0]],.047,42,7);
 r.path(bow,bronze,[[0,-.73,.02],[-.13,-.48,.02],[-.17,-.2,.02],[.02,.15,.02],[.11,.44,.02],[.05,.74,.02]],.017,40,6);
 r.link(bow,cord,[0,-.73,.005],[.05,.74,.005],.009,5);
 r.oct(bow,glow,.05,.74,0,.08,.11,.09);r.oct(bow,bronze,0,-.73,0,.085,.095,.08);
 const arrow=r.grp(drawArm,.02,-.67,.32);
 r.link(arrow,oldBone,[0,0,-.15],[0,0,.93],.015,6);r.cone(arrow,glow,0,0,.95,0,.078,.21,7).rotation.x=Math.PI/2;
 for(const s of [-1,1])r.panel(arrow,ivory,[[0,0,-.15],[s*.08,.05,-.25],[s*.04,0,.05]]);
 const quiver=r.grp(torso,.38,1.38,-.31);r.cyl(quiver,leather,0,0,0,.12,.11,.48,9);quiver.rotation.z=-.28;
 for(let i=0;i<3;i++){r.link(quiver,oldBone,[(-1+i)*.07,-.14,-.01],[(-1+i)*.07,.48,-.01],.012,5);r.panel(quiver,ivory,[[(-1+i)*.07,.45,-.01],[(-1+i)*.07+.06,.58,0],[(-1+i)*.07,.55,.02]]);}
 r.sprite(torso,0x8bccff,0,1.75,-.13,1.20,.14);
 function update(t,dt=0,mode='idle'){
  const w=mode==='walk',wind=mode==='windup',attack=mode==='attack',hurt=mode==='hurt',dead=mode==='dead';
  torso.position.y=(w?.06*Math.abs(Math.sin(t*7)):.013*Math.sin(t*1.7))-(dead?.63:0);
  torso.rotation.x=wind?-.12:attack?-.19:0;torso.rotation.z=hurt?-.18:dead?-.4:0;
  legs[0].rotation.x=w?.41*Math.sin(t*7):0;legs[1].rotation.x=-legs[0].rotation.x;
  bowArm.rotation.x=wind||attack?-.60:w?.14*Math.sin(t*7):-0.17;
  drawArm.rotation.x=wind?-.85:attack?-1.10:w?-.14*Math.sin(t*7):-.18;
  drawArm.rotation.y=wind?-.50:attack?-.24:0;
  arrow.visible=!dead;arrow.position.z=wind?-.30:attack?.10:0;
  glow.emissiveIntensity=wind?2.5:1.35;
  torso.scale.y=dead?.50:1;
 }
 update(0);return finish(r,update,{torso,legs,arms,arrow});
}
