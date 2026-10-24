// Köken: Emre'nin "Büyücünün Gecesi 3D Full12 Pro v2" 3B model paketi (js/render/models/wolf.js), değiştirilmeden alındı (common.js v1 ile aynı).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js + enemyvis.js (düşmanlar).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Four-legged spectral ice wolf; bone-tipped mane and telegraphed forward lunge. */
export function createWolf({scale=1,color=0xbfe9ff}={}){
 const r=createRig('Kurt_Ruhu',{scale,color}),a=r.actor;
 const fur=r.mat('spectral arctic coat',color,{alpha:.82,glow:.16,rough:.93}),shaded=r.mat('indigo shadow coat',0x627fa9,{alpha:.75,rough:.92}),bright=r.mat('ice white mane',0xe4fcff,{alpha:.87,rough:.82,glow:.22});
 const voidMat=r.mat('shadow maw',0x10152f,{rough:1,tint:false}),eye=r.mat('ice eye',0x7afaff,{glow:1.5,tint:false}),ice=r.mat('glacial crest',0x85d5ff,{metal:.12,glow:.66,tint:false});
 const body=r.grp(a,0,0,0),legs=[],tail=r.grp(body,0,.78,-.58);
 r.ell(body,shaded,0,.68,-.16,.32,.40,.67,14,true);
 r.ell(body,fur,0,.72,-.11,.33,.37,.61,15);
 r.ell(body,bright,0,.81,.29,.36,.39,.31,13);
 for(let i=0;i<9;i++){
  const theta=i/9*Math.PI*2;
  const x=Math.cos(theta)*.29,y=.80+Math.sin(theta)*.26;
  const w=r.cone(body,i%2?bright:shaded,x,y,.30,0,.095,.27,6);w.rotation.z=Math.cos(theta)*.36;w.rotation.x=-.48;
 }
 for(const s of [-1,1])for(const front of [false,true]){
  const x=s*.24,z=front?.25:-.49;
  const leg=r.grp(body,x,.65,z);legs.push(leg);
  r.ell(leg,fur,0,-.18,.01,.115,.22,.14,10);
  r.link(leg,fur,[0,-.25,0],[0,-.49,.05],.069);
  r.ell(leg,fur,0,-.49,.14,.11,.092,.20,9);
  for(let j=-1;j<=1;j++)r.cone(leg,ice,j*.054,-.53,.29,0,.021,.09,5).rotation.x=Math.PI/2;
 }
 const head=r.grp(body,0,.92,.39);
 r.ell(head,fur,0,.075,.13,.27,.24,.30,15);
 r.ell(head,bright,0,-.07,.36,.18,.125,.28,12);
 r.ell(head,voidMat,0,-.115,.56,.17,.046,.10,9);
 r.ell(head,voidMat,0,-.002,.61,.115,.074,.094,9);
 for(const s of [-1,1]){
  const ear=r.cone(head,shaded,s*.20,.37,.09,0,.11,.33,8);ear.rotation.z=-s*.16;
  const ie=r.cone(head,bright,s*.20,.38,.16,0,.062,.20,7);ie.rotation.z=-s*.14;
  r.ell(head,voidMat,s*.13,.14,.377,.097,.07,.030,9);
  r.ell(head,eye,s*.13,.14,.399,.038,.039,.022,9);
  r.link(head,shaded,[s*.15,-.08,.37],[s*.24,-.16,.13],.02);
 }
 // Articulated multi-segment tail; chunky fluffy triangles preserve silhouette from above.
 for(let j=0;j<5;j++){
  const sz=.12+(j%3)*.035;
  const section=r.ell(tail,j%2?bright:fur,0,.04+j*.035,-j*.14,sz,sz*.89,.18,9);
  section.rotation.x=-j*.14;
 }
 r.cone(tail,bright,0,.17,-.77,0,.15,.32,8).rotation.x=Math.PI/2;
 const aura=r.sprite(body,0x73c9ff,0,.65,-.28,2.2,.27);
 for(let i=0;i<7;i++){
  const x=Math.sin(i*2.7)*.23,z=-.53+(i%4)*.22;
  r.oct(body,ice,x,1.06+Math.sin(i*3)*.065,z,.045,.08,.049);
 }
 function update(t,dt=0,mode='idle'){
  const walk=mode==='walk',wind=mode==='windup',attack=mode==='attack',hurt=mode==='hurt',dead=mode==='dead';
  body.position.y=walk?.05*Math.abs(Math.sin(t*9)):.014*Math.sin(t*2);
  body.position.z=attack?.28:0;body.rotation.x=wind?.17:attack?-.20:0;body.rotation.z=hurt?.12:0;
  legs.forEach((l,i)=>{l.rotation.x=walk?Math.sin(t*9+(i===0||i===3?0:Math.PI))*.5:wind?.13:attack?-.42:0;});
  tail.rotation.y=Math.sin(t*4)*.2;tail.rotation.x=wind?-.18:Math.sin(t*2)*.07;
  head.rotation.x=wind?-.27:attack?.17:0;head.rotation.y=.055*Math.sin(t*1.5);
  eye.emissiveIntensity=wind?3:1.5;
  body.scale.set(wind?1.06:attack?1.17:1,dead?.35:wind?.80:1,attack?1.11:1);
  aura.material.opacity=wind?.39:.26;
 }
 update(0);return finish(r,update,{body,head,legs,tail});
}
