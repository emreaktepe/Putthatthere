// Köken: Emre'nin "son 3" sahne figürleri paketi — Taşkın (lanetten kurtulan taş bekçi, createTaskin), değiştirilmeden alındı (yalnızca bu başlık eklendi).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/propsvis.js + props3d.js (sahne figürü; savaşa katılmaz).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Taşkın — friendly rescued golem, broken runes, lichen, repaired shoulder plates.
 * Contrast to aggressive Golem: hunched silhouette, single warm eye, gentle movements.
 */
export function createTaskin({scale=1,color=0x77747a}={}){
 const r=createRig('Taskin_Ozgur_TasBekci',{scale,color}),a=r.actor;
 const stone=r.mat('weathered fieldstone',color,{rough:.97}),light=r.mat('pale chipped granite',0xb3a69d,{rough:.95}),shadow=r.mat('old fracture',0x413d49,{rough:1}),moss=r.mat('forest moss',0x526c48,{rough:1}),leaf=r.mat('young leaves',0x82a16b,{rough:1});
 const ember=r.mat('free rune warmth',0xffae58,{glow:.83,metal:.05,rough:.48,tint:false}),gold=r.mat('recovered relic inlay',0xb28c51,{metal:.61,rough:.53,tint:false}),socket=r.mat('deep eye socket',0x171722,{rough:1,tint:false});
 const body=r.grp(a,0,.02,0),head=r.grp(body,0,1.67,.18),arms=[],legs=[];
 r.box(body,stone,0,1.21,0,1.13,.83,.69,true).rotation.z=.035;
 r.box(body,light,0,1.21,.37,.60,.58,.11).rotation.z=-.06;
 r.box(body,shadow,-.33,1.00,.37,.34,.31,.083).rotation.z=-.16;
 r.box(body,shadow,0,.68,.03,.68,.30,.61);
 r.path(body,ember,[[-.38,1.48,.38],[-.14,1.38,.432],[.02,1.18,.432],[-.09,1.03,.433],[-.02,.85,.36]],.022);
 r.path(body,ember,[[.12,1.18,.427],[.25,1.29,.435],[.34,1.25,.435]],.017);
 r.oct(body,ember,-.13,1.35,.47,.105,.13,.06);
 const sash=r.panel(body,moss,[[-.4,.73,.37],[-.14,1.62,.38],[.20,1.55,.35],[.43,.65,.37]]);
 for(const s of [-1,1]){
  const leg=r.grp(body,s*.36,.66,0);legs.push(leg);
  r.box(leg,stone,s*.03,-.18,0,.39,.50,.39,true).rotation.z=s*.07;
  r.box(leg,light,s*.06,-.46,.13,.47,.23,.53,true);
  const arm=r.grp(body,s*.74,1.50,-.03);arms.push(arm);
  r.box(arm,s<0?light:stone,s*.10,-.16,0,.54,.48,.54,true).rotation.z=s*.16;
  r.box(arm,shadow,s*.17,-.46,.04,.31,.28,.33);
  r.box(arm,stone,s*.19,-.66,.11,.45,.37,.46,true).rotation.z=-s*.08;
  for(let k=0;k<3;k++)r.box(arm,light,s*(.03+k*.14),-.83,.34,.10,.09,.12);
  if(s===-1){
   r.path(arm,ember,[[-.06,-.16,.29],[-.24,-.29,.25],[-.22,-.48,.22]],.012);
  }
 }
 // Warm, shy single-eyed face — deliberately unlike the hostile sentinel
 r.box(head,stone,0,.08,0,.72,.54,.59,true).rotation.z=-.055;
 r.box(head,light,-.06,.28,.14,.54,.17,.48).rotation.z=.09;
 r.box(head,socket,0,.10,.31,.28,.27,.07);
 r.oct(head,ember,0,.10,.38,.128,.147,.07);
 r.path(head,shadow,[[-.28,-.11,.30],[-.09,-.19,.34],[.13,-.17,.34],[.29,-.10,.29]],.018);
 // Shrub shoulders and leafy eyebrows, leaf tips arranged asymmetrically
 for(const [x,y,z,s] of [[-.44,1.60,.08,.15],[.49,1.68,-.1,.13],[-.13,2.12,-.11,.11],[.25,1.30,.38,.095],[-.50,.99,.31,.09],[-.35,1.83,.26,.085]]){
  r.ico(body,moss,x,y,z,s,s*.48,s,0);r.ico(body,leaf,x+s*.40,y+.05,z+.03,s*.36,s*.26,s*.38);
 }
 for(let i=0;i<4;i++){
  const x=-.40+i*.25;r.path(body,i%2?moss:leaf,[[x,1.64,.19],[x-.07,1.42,.40],[x+.035,1.28,.41]],.013,13,5);
 }
 for(let k=0;k<5;k++){
  const x=-.22+k*.11,y=.96+k*.07;
  const a=r.box(body,k%2?light:shadow,x,y,-.36,.13,.16,.08);a.rotation.z=k*.23;
 }
 // Small flower on shoulder; communicates peaceful recovered nature
 r.ico(body,leaf,-.48,1.91,.02,.10,.033,.07);
 for(let i=0;i<5;i++){const theta=i*Math.PI*2/5;r.ell(body,light,-.48+.065*Math.cos(theta),1.93+.06*Math.sin(theta),.065,.039,.058,.020,8);}
 r.oct(body,ember,-.48,1.94,.094,.025,.03,.021);
 function update(t,dt=0,mode='idle'){
  const walk=mode==='walk',wind=mode==='windup',attack=mode==='attack',hurt=mode==='hurt',dead=mode==='dead';
  body.position.y=.012*Math.sin(t*1.2)+(walk?.033*Math.abs(Math.sin(t*4.1)):0)-(dead?.55:0);
  body.rotation.z=hurt?.12:walk?.025*Math.sin(t*4.1):-.030;
  head.rotation.y=.1*Math.sin(t*.68);head.rotation.x=wind?-.13:attack?-.18:0;
  legs[0].rotation.x=walk?.24*Math.sin(t*4.1):0;legs[1].rotation.x=-legs[0].rotation.x;
  arms[0].rotation.x=walk?.17*Math.sin(t*4):wind?-.28:attack?-.48:0;
  arms[1].rotation.x=walk?-.17*Math.sin(t*4):wind?-.35:attack?-.65:0;
  body.scale.y=dead?.55:1;
  ember.emissiveIntensity=wind?1.5:attack?1.7:.83;
 }
 update(0);return finish(r,update,{body,head,arms,legs,eye:ember,sash});
}
