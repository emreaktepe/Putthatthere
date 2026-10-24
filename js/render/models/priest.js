// Köken: Emre'nin "Büyücünün Gecesi 3D Full12 Pro v2" 3B model paketi (js/render/models/priest.js), değiştirilmeden alındı (common.js v1 ile aynı).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js + enemyvis.js (düşmanlar).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Floating dark priest: black face, violet gold regalia, green ward-casting ritual. */
export function createPriest({scale=1,color=0x4a2a6a}={}){
 const r=createRig('Karanlik_Rahip',{scale,color}),a=r.actor;
 const robe=r.mat('midnight-violet velvet',color,{rough:.96,side:THREE.DoubleSide}),unders=r.mat('black inner robe',0x211529,{rough:1,side:THREE.DoubleSide}),trim=r.mat('tarnished gold piping',0xbc9360,{rough:.52,metal:.55}),metal=r.mat('aged engraved brass',0x866d5d,{rough:.55,metal:.58});
 const hoodmat=r.mat('layered hood',0x37204e,{rough:.94}),inner=r.mat('faceless void',0x090e18,{rough:1,tint:false}),eye=r.mat('priest eyes',0x9affad,{glow:1.2,tint:false}),magic=r.mat('cursed ward',0x85e88c,{glow:.74,metal:.1,tint:false});
 const body=r.grp(a,0,0,0),arms=[],robeRoot=r.grp(body);
 r.ringDrape(robeRoot,robe,[[.14,.47,.82],[.27,.58,.91],[.55,.54,.93],[.90,.43,.91],[1.30,.34,1],[1.80,.40,1],[1.95,.44,1]],26,{waves:8,offset:.5});
 r.ringDrape(robeRoot,unders,[[.15,.25,.96],[.34,.37,.92],[.80,.30,.95],[1.26,.27,1],[1.74,.25,1]],18,{waves:6,offset:2.5});
 const xflap=r.panel(body,robe,[[-.22,.28,.39],[-.46,1.72,.38],[-.15,1.89,.39],[.17,1.78,.40],[.29,.25,.52]]);
 r.link(body,trim,[-.22,.28,.4],[-.46,1.72,.38],.025);
 r.link(body,trim,[.29,.25,.52],[.17,1.78,.4],.023);
 r.link(body,trim,[-.23,.24,.46],[.30,.24,.54],.022);
 r.cyl(body,metal,0,1.52,0,.43,.45,.13,15);
 r.oct(body,magic,0,1.51,.46,.1,.14,.065);
 for(const s of [-1,1]){
  const arm=r.grp(body,s*.44,1.81,0);arms.push(arm);
  r.ell(arm,hoodmat,s*.07,-.09,0,.23,.23,.31,13);
  const cuff=r.ringDrape(arm,robe,[[-.73,.20,1],[-.43,.27,1],[-.10,.19,.85]],12,{waves:5,offset:s});cuff.position.x=s*.19;
  r.ell(arm,inner,s*.21,-.73,.12,.14,.13,.13,9);
  r.torus(arm,trim,s*.17,-.49,.04,.225,.018,7,18).rotation.x=Math.PI/2;
  r.path(arm,trim,[[s*.05,-.14,.26],[s*.20,-.29,.28],[s*.28,-.51,.22]],.013,11);
 }
 const head=r.grp(body,0,2.08,0);
 r.ell(head,hoodmat,0,.06,-.02,.39,.46,.39,16);
 r.ell(head,inner,0,.02,.26,.29,.36,.13,15);
 r.ringDrape(head,hoodmat,[[-.22,.31,1],[-.05,.42,1],[.26,.37,.85],[.46,.20,.75]],21,{waves:5,offset:.4});
 const brow=r.path(head,trim,[[-.33,.20,.21],[-.16,.27,.36],[0,.3,.37],[.16,.27,.36],[.33,.20,.21]],.020);
 for(const s of [-1,1]){
   r.ell(head,eye,s*.115,.045,.387,.055,.031,.01,10);
   r.link(head,magic,[s*.11,.06,.38],[s*.03,-.12,.395],.010,7);
 }
 const jewel=r.oct(head,magic,0,.39,.17,.08,.13,.06);
 const collar=r.grp(body,0,1.93,0);r.ringDrape(collar,unders,[[0,.39,.9],[.11,.48,.91],[.35,.36,.96]],14,{waves:5,offset:.2});
 const staff=r.grp(arms[1],.24,-.56,.25);
 r.path(staff,metal,[[0,-.65,0],[.02,-.23,0],[-.04,.15,0],[.06,.57,0]],.039,26,7);
 r.oct(staff,magic,.06,.63,0,.16,.24,.15);
 r.torus(staff,trim,.06,.63,0,.235,.026,7,27).rotation.y=.36;
 r.link(staff,trim,[.05,.37,0],[.26,.65,0],.024);
 r.link(staff,trim,[.05,.37,0],[-.18,.65,0],.024);
 const ward=r.grp(body,0,1.58,0);
 const w0=r.torus(ward,magic,0,0,0,.79,.020,7,44);w0.rotation.x=Math.PI/2;
 const w1=r.torus(ward,trim,0,0,0,.61,.019,7,36);w1.rotation.x=1.25;
 for(let i=0;i<6;i++){
  const ang=i*Math.PI/3;r.oct(ward,magic,.79*Math.cos(ang),0,.79*Math.sin(ang),.052,.089,.052);
 }
 r.sprite(body,0x9be3a0,0,1.58,-.44,2.15,.20);
 function update(t,dt=0,mode='idle'){
  const wind=mode==='windup',attack=mode==='attack',walk=mode==='walk',hurt=mode==='hurt',dead=mode==='dead';
  body.position.y=.045*Math.sin(t*1.7)+(walk?.025*Math.sin(t*7):0)-(dead?.75:0);
  body.rotation.y=.065*Math.sin(t*.9);body.rotation.z=hurt?.14:0;
  head.rotation.y=.09*Math.sin(t*.6);head.rotation.x=wind?-.17:0;
  arms[0].rotation.z=wind?.9:attack?1.2:.10*Math.sin(t*1.4);
  arms[1].rotation.z=wind?-.9:attack?-1.2:-.10*Math.sin(t*1.4);
  arms[0].rotation.x=wind?-1.0:attack?-1.35:-.1;
  arms[1].rotation.x=wind?-1.0:attack?-1.35:-.1;
  ward.visible=!dead;ward.rotation.y=t*(wind?2.3:.43);
  ward.scale.setScalar(wind?1+.08*Math.sin(t*6):1);
  robeRoot.rotation.x=.025*Math.sin(t*1.6);
  magic.emissiveIntensity=wind?1.9:attack?2.3:.74;
  body.scale.y=dead?.42:1;
 }
 update(0);return finish(r,update,{body,head,arms,robeRoot,staff,ward,collar});
}
