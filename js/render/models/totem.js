// Köken: Emre'nin "Büyücünün Gecesi 3D Full12 Pro v2" 3B model paketi (js/render/models/totem.js), değiştirilmeden alındı (common.js v1 ile aynı).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js + enemyvis.js (düşmanlar).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Ritual obelisk / summoning totem, spinning hoops telegraph ghost spawn. */
export function createTotem({scale=1,color=0xff7a2a}={}){
 const r=createRig('Lanet_Totemi',{scale,color}),a=r.actor;
 const rock=r.mat('basalt obelisk',0x292433,{rough:.96}),lip=r.mat('shale facets',0x564452,{rough:.95}),gold=r.mat('aged gold ribs',0xb88a54,{metal:.62,rough:.5}),ash=r.mat('deep crevices',0x18121d,{rough:1});
 const glow=r.mat('cinder spell',color,{glow:1.30,rough:.28,tint:false}),hot=r.mat('molten rune',0xffd18b,{glow:2,tint:false});
 const root=r.grp(a),spinners=r.grp(root,0,1.74,0);
 // Four-point base, capstones and hammered metal brackets.
 for(let i=0;i<4;i++){
  const th=Math.PI*.5*i,x=Math.sin(th)*.50,z=Math.cos(th)*.50;
  const p=r.box(root,rock,x,.12,z,.38,.25,.39,true);p.rotation.y=th;
  r.oct(root,lip,x,.30,z,.19,.15,.18);
 }
 const foot=r.cyl(root,rock,0,.24,0,.52,.58,.36,8,true);foot.rotation.y=Math.PI/8;
 r.cyl(root,gold,0,.45,0,.41,.48,.072,8);
 r.cyl(root,lip,0,.95,0,.33,.43,1.07,8,true);
 r.cyl(root,rock,0,1.20,0,.28,.33,1.2,8,true);
 r.cyl(root,gold,0,1.59,0,.43,.42,.15,8);
 r.cyl(root,lip,0,1.67,0,.41,.40,.25,8);
 for(let i=0;i<4;i++){
  const theta=i*Math.PI/2,s=Math.sin(theta),c=Math.cos(theta);
  const p=r.oct(root,gold,s*.33,1.58,c*.33,.16,.22,.13);p.rotation.y=theta;
  r.link(root,glow,[s*.39,.54,c*.39],[s*.29,1.48,c*.29],.021,7);
  r.oct(root,hot,s*.385,.76,c*.385,.058,.09,.044);
  r.oct(root,glow,s*.36,1.12,c*.36,.07,.16,.04);
 }
 // Carved skull/face on front of menhir, surrounded by sharp glyph fractures.
 r.ell(root,ash,0,1.21,.326,.24,.29,.08,12);
 r.ell(root,lip,0,1.24,.39,.19,.21,.07,12);
 for(const s of [-1,1]){r.ell(root,ash,s*.086,1.29,.46,.07,.073,.02,10);r.oct(root,hot,s*.086,1.29,.49,.038,.04,.022);}
 r.cone(root,rock,0,1.17,.47,0,.06,.16,6).rotation.x=Math.PI/2;
 r.ell(root,ash,0,1.11,.45,.11,.036,.02,8);
 for(let i=0;i<4;i++)r.link(root,hot,[(-2+i)*.06,1.07,.475],[(-2+i)*.06+.024,.99,.43],.012,6);
 for(const seg of [[[-.26,.79,.40],[0,.89,.49],[.25,.74,.39]],[[0,1.53,.39],[-.16,1.39,.40],[-.23,1.24,.34]],[[0,.54,.47],[.12,.65,.41],[.19,.80,.36]]])r.path(root,hot,seg,.017,16);
 for(let i=0;i<5;i++){
  const th=i*2.399;xcrystal(th,i);
 }
 function xcrystal(th,i){const x=Math.sin(th)*.43,z=Math.cos(th)*.43;const p=r.oct(root,i%2?glow:hot,x,1.63+(i%3)*.1,z,.10,.19,.085);p.rotation.z=i*.43;}
 // Magic hoops rotate at different speeds. The UI/gameplay decides when to spawn ghosts.
 const ringA=r.torus(spinners,glow,0,0,0,.54,.036,8,48);ringA.rotation.x=Math.PI/2;
 const ringB=r.torus(spinners,gold,0,0,0,.73,.023,7,56);ringB.rotation.x=.65;
 const ringC=r.torus(spinners,hot,0,0,0,.39,.021,7,40);ringC.rotation.z=1.2;
 const crystal=r.oct(spinners,glow,0,.05,0,.20,.38,.20);
 r.ell(spinners,hot,0,.01,0,.08,.16,.08,10);
 const halo=r.sprite(spinners,0xff9d4d,0,0,-.10,1.7,.29);
 const base=r.grp(root);
 for(let j=0;j<6;j++){const th=j*Math.PI/3;
  r.oct(base,lip,.66*Math.cos(th),.13,.66*Math.sin(th),.19,.11,.15);
 }
 function update(t,dt=0,mode='idle'){
  const wind=mode==='windup',attack=mode==='attack',hurt=mode==='hurt',dead=mode==='dead';
  spinners.rotation.y=t*(wind?3.1:attack?5.2:.54);
  ringA.rotation.x=Math.PI/2+.10*Math.sin(t*2);
  ringB.rotation.z=t*(wind?3:.34);
  ringC.rotation.y=t*(wind?4.5:.8);
  crystal.rotation.y=t*.42;crystal.position.y=.07*Math.sin(t*2.2);
  spinners.scale.setScalar(dead?.02:wind?1.19+.05*Math.sin(t*9):1);
  root.scale.y=dead?.36:1;root.rotation.z=hurt?.12:0;
  halo.material.opacity=wind?.64:.29;
  glow.emissiveIntensity=wind?2.7:attack?3.7:1.3;
 }
 update(0);return finish(r,update,{root,spinners,ringA,ringB,ringC,crystal});
}
