// Köken: Emre'nin "son 3" sahne figürleri paketi — Zerrin (baykuş mentor, createZerrin), değiştirilmeden alındı (yalnızca bu başlık eklendi).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/propsvis.js + props3d.js (sahne figürü; savaşa katılmaz).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Zerrin — mentor owl: layered feather silhouette, nocturnal gilded mantle, watchful eyes.
 * Branch is a presentation prop attached to actor; the model itself adds no lights.
 */
export function createZerrin({scale=1,color=0xad926f}={}){
 const r=createRig('Zerrin_Usta_Baykus',{scale,color}),a=r.actor;
 const plum=r.mat('ash-silver down',color,{rough:.99}),cream=r.mat('facial disks',0xe8d7b5,{rough:1}),edge=r.mat('feather tips',0x67516a,{rough:1}),dark=r.mat('ear shadow',0x392f45,{rough:1});
 const wingColor=r.mat('banded feather',0x9f8295,{rough:.98}),eyeWhite=r.mat('amber iris',0xe9a64c,{glow:.20,rough:.35,metal:.14,tint:false}),pupil=r.mat('pupil',0x0c0b15,{rough:.2,tint:false});
 const gold=r.mat('aged gold ornaments',0xe7b96b,{rough:.43,metal:.72,tint:false}),lilac=r.mat('deep violet mantle',0x40226c,{rough:.91}),moon=r.mat('embroidered glyphs',0xffcf85,{metal:.53,rough:.4,tint:false});
 const wood=r.mat('dark oak branch',0x594032,{rough:1});
 const body=r.grp(a,0,.9,0),head=r.grp(body,0,.47,.07),wings=[],feet=[];
 // A thick velvet mantle with sculpted shoulder feathers
 r.ell(body,plum,0,-.06,0,.43,.58,.37,16,true);
 r.ell(body,cream,0,-.07,.32,.32,.43,.10,14);
 const mantle=r.ringDrape(body,lilac,[[.27,.42,.91],[.04,.53,1],[-.25,.49,1],[-.42,.38,.92]],22,{waves:7,offset:.3});
 r.link(body,gold,[-.32,.26,.26],[0,.18,.38],.018);r.link(body,gold,[0,.18,.38],[.32,.26,.26],.018);
 r.oct(body,gold,0,.20,.41,.10,.12,.05);
 for(const s of [-1,1]){
  const w=r.grp(body,s*.35,.22,-.02);wings.push(w);
  r.ell(w,plum,s*.07,-.15,-.07,.27,.39,.20,12);
  for(let i=0;i<6;i++){
   const f=r.ell(w,i%2?wingColor:edge,s*(.10+i*.037),-.31-i*.065,-.015,.14,.22,.055,9);
   f.rotation.z=s*(-.16+i*.038);
  }
  for(let i=0;i<4;i++)r.ell(body,edge,s*(.07+i*.085),-.43,-.32,.077,.16,.057,8);
  const foot=r.grp(body,s*.20,-.52,.08);feet.push(foot);
  r.ell(foot,plum,0,0,0,.10,.15,.13,9);
  for(let i=-1;i<=1;i++){
   const tx=i*.075;r.link(foot,gold,[tx*.25,-.09,.035],[tx,-.22,.18],.020,6);
   r.cone(foot,pupil,tx,-.235,.18,0,.023,.076,6).rotation.x=.30;
  }
 }
 r.ell(head,plum,0,.15,0,.47,.47,.41,18,true);
 // Two distinct face disks set forward — legible from an elevated perspective
 for(const s of [-1,1]){
  r.ell(head,cream,s*.205,.17,.344,.24,.27,.105,16);
  r.ell(head,dark,s*.19,.13,.426,.15,.17,.048,16);
  r.ell(head,eyeWhite,s*.19,.13,.471,.125,.145,.025,16);
  r.ell(head,pupil,s*.183,.13,.496,.062,.083,.013,14);
  r.ell(head,cream,s*.15,.175,.50,.018,.028,.005,8);
  const horn=r.grp(head,s*.38,.48,-.075);
  r.cone(horn,plum,0,.13,0,0,.18,.42,10).rotation.z=-s*.28;
  r.cone(horn,edge,s*.02,.24,.025,0,.115,.28,9).rotation.z=-s*.35;
  for(let k=0;k<3;k++){
   const f=r.ell(head,k===0?edge:cream,s*(.1+.10*k),-.13-.046*k,.32,.087,.15,.05,8);f.rotation.z=-s*.4;
  }
 }
 const beak=r.cone(head,gold,0,.005,.51,0,.103,.20,8);beak.rotation.x=Math.PI;
 r.path(head,edge,[[-.38,.42,.24],[-.25,.46,.39],[0,.45,.43],[.25,.46,.39],[.38,.42,.24]],.028,22);
 const crescent=r.torus(head,gold,0,.54,.05,.20,.015,6,28);crescent.rotation.x=.18;
 r.oct(head,moon,0,.74,.025,.06,.08,.04);
 // Branch keeps sitting owl grounded; shadow mesh excluded from animation
 const branch=r.grp(a,0,.24,0);r.path(branch,wood,[[-.83,-.02,.17],[-.48,.03,.05],[-.14,0,.05],[.35,-.02,.09],[.78,.04,.20]],.085,26,7);
 r.path(branch,wood,[[.30,0,.10],[.48,.18,-.12],[.57,.25,-.18]],.035,14,6);
 for(let i=0;i<4;i++){const x=-.44+i*.29;r.ell(branch,edge,x,.08,-.01,.10,.025,.07,9);}
 function update(t,dt=0,mode='idle'){
  const flying=mode==='attack',wind=mode==='windup',walking=mode==='walk',hurt=mode==='hurt',dead=mode==='dead';
  body.position.y=.018*Math.sin(t*1.55)+(walking?.032*Math.sin(t*5):0)-(dead?.30:0);
  body.rotation.z=hurt?.17:walking?.03*Math.sin(t*4):0;
  head.rotation.y=.16*Math.sin(t*.8)+(wind?.35:0);
  head.rotation.x=wind?-.16:flying?-.15:0;
  wings[0].rotation.z=flying?-.95-.3*Math.sin(t*12):wind?-.36:.05*Math.sin(t*1.9);
  wings[1].rotation.z=-wings[0].rotation.z;
  feet[0].rotation.x=walking?.23*Math.sin(t*5):0;feet[1].rotation.x=-feet[0].rotation.x;
  mantle.rotation.y=.018*Math.sin(t*1.1);
  body.scale.setScalar(dead?.70:1);
 }
 update(0);return finish(r,update,{body,head,wings,feet,mantle,branch});
}
