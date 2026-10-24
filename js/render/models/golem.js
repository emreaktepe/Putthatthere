// Köken: Emre'nin "Büyücünün Gecesi Core6 Pro v1" 3B model paketi (js/render/models/golem.js), değiştirilmeden alındı.
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js (düşmanlar), js/render/wizard.js (Pırıl).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Moss-covered stone sentinel with distinct amber monolithic rune eye. */
export function createGolem({scale=1,color=0x8a8a96}={}){
 const r=createRig('Golem_TasBekci',{scale,color}),a=r.actor;
 const rock=r.mat('quartzite slabs',color,{rough:.96}),shadow=r.mat('stone shadow',0x494454,{rough:.99}),stoneLite=r.mat('weathered ridges',0xafa7a8,{rough:.91}),
 moss=r.mat('lichen',0x526c44,{rough:1}),moss2=r.mat('golden moss',0x8e8e55,{rough:.98}),rune=r.mat('golden cracks',0xffae53,{glow:.91,metal:.1,rough:.4,tint:false}),
 eye=r.mat('ember iris',0xffda77,{glow:1.2,tint:false}),voidMat=r.mat('carved socket',0x1e1822,{rough:1});
 const body=r.grp(a,0,0,0), legs=[],arms=[];
 for(const s of [-1,1]){
  const leg=r.grp(body,s*.37,.68,0);legs.push(leg);
  const shin=r.box(leg,rock,0,-.17,.02,.38,.64,.39,true);shin.rotation.z=s*.08;
  const cuff=r.box(leg,stoneLite,0,-.45,.17,.50,.23,.57);cuff.rotation.y=s*.12;
  r.box(leg,moss,s*.06,.12,-.19,.24,.08,.12);
 }
 const chest=r.box(body,rock,0,1.34,0,1.17,.93,.65,true);
 const stern=r.box(body,stoneLite,0,1.43,.35,.67,.62,.10);stern.rotation.z=.06;
 r.box(body,shadow,0,.97,.07,.95,.18,.68);
 const head=r.grp(body,0,1.99,.12);
 r.box(head,rock,0,.1,0,.78,.57,.62,true);
 r.box(head,stoneLite,0,.35,.14,.67,.18,.60);
 r.box(head,voidMat,0,.13,.32,.34,.25,.069);
 r.oct(head,eye,0,.13,.395,.12,.145,.060);
 r.sprite(head,0xff8c33,0,.14,.41,.60,.38);
 // Glowing celestial glyph, carved through face & chest
 r.path(body,rune,[[0,1.84,.42],[.12,1.67,.415],[0,1.49,.417],[-.11,1.40,.414],[0,1.23,.412],[.08,1.09,.42]],.021,18);
 r.path(body,rune,[[-.27,1.58,.43],[0,1.49,.43],[.26,1.61,.43]],.016,14);
 for(const s of [-1,1]){
  const arm=r.grp(body,s*.76,1.64,0);arms.push(arm);
  const shoulder=r.box(arm,rock,s*.11,-.12,0,.57,.47,.60,true);shoulder.rotation.z=-s*.20;
  const upper=r.box(arm,shadow,s*.23,-.48,.04,.38,.50,.36);upper.rotation.z=s*.10;
  const gauntlet=r.box(arm,rock,s*.26,-.82,.09,.52,.43,.56,true);gauntlet.rotation.y=s*.17;
  for(let i=0;i<3;i++)r.box(arm,stoneLite,s*(.11+i*.15),-1.02,.35,.115,.16,.17);
  r.path(arm,rune,[[s*.05,-.24,.311],[s*.24,-.39,.301],[s*.24,-.56,.255]],.018,10);
 }
 // moss bunches and creeping tendrils
 for(const [x,y,z,s] of [[-.36,1.85,-.15,.13],[.46,1.83,.02,.12],[-.54,1.18,.25,.12],[.29,1.53,.38,.095],[-.26,2.32,.18,.09]]){
  r.ico(body,moss,x,y,z,s,s*.65,s,0);r.ico(body,moss2,x+.07,y+.045,z,s*.36,s*.47,s*.32);
 }
 for(let i=0;i<6;i++){
  const x=-.57+i*.18;r.link(body,i%2?moss:moss2,[x,2.04,.20],[x+.09,1.75+(i%3)*.07,.36],.014);
 }
 // Carved chipped stone slabs are asymmetric to feel handmade.
 for(let i=0;i<8;i++){
  const ang=i*2.4,x=Math.sin(ang)*.48,y=1.06+(i%4)*.20;
  const piece=r.box(body,i%3===0?stoneLite:shadow,x,y,Math.cos(ang)*.34,.13,.18,.10);
  piece.rotation.set(i*.18,i*.34,i*.3);
 }
 function update(t,d=0,mode='idle'){
  const walk=mode==='walk',attack=mode==='attack',charge=mode==='windup',hurt=mode==='hurt';
  body.position.y=walk?.035*Math.abs(Math.sin(t*4)):.014*Math.sin(t*1.2);
  body.rotation.z=walk?.024*Math.sin(t*4):hurt?.11:0;
  legs[0].rotation.x=walk?.26*Math.sin(t*4):0;legs[1].rotation.x=-legs[0].rotation.x;
  arms[0].rotation.x=walk?.23*Math.sin(t*4):charge?-.4:attack?-1.0:0;
  arms[1].rotation.x=walk?-.23*Math.sin(t*4):charge?-.4:attack?-1.0:0;
  head.rotation.y=Math.sin(t*.66)*.07;body.scale.y=mode==='dead'?.5:charge?1.05:1;
  eye.emissiveIntensity=charge?2:1.25;
 }
 update(0);return finish(r,update,{body,head,arms,legs,eye});
}
