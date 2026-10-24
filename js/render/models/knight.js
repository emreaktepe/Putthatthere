// Köken: Emre'nin "Büyücünün Gecesi 3D Full12 Pro v2" 3B model paketi (js/render/models/knight.js), değiştirilmeden alındı (common.js v1 ile aynı).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js + enemyvis.js (düşmanlar).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Bone Knight: engraved plate armor, antler crown, broken cloak and huge execution sword. */
export function createKnight({scale=1,color=0xcfd0dc}={}){
 const r=createRig('Kemik_Sovalye',{scale,color}),a=r.actor;
 const ivory=r.mat('ivory bone plates',color,{rough:.90,metal:.03}),bone=r.mat('warm ancient bone',0xaba0a0,{rough:.93}),shadow=r.mat('deep sockets',0x1a1520,{rough:1,tint:false});
 const mail=r.mat('shadow chainmail',0x38313d,{metal:.44,rough:.74}),gold=r.mat('mourning gold',0xa57c52,{metal:.65,rough:.44});
 const purple=r.mat('ragged heraldic fabric',0x472550,{rough:.96,side:THREE.DoubleSide}),blue=r.mat('dead soul glow',0xb2caff,{glow:1.0,tint:false});
 const root=r.grp(a),legs=[],arms=[],skirt=r.grp(root,0,1.14,0);
 r.ringDrape(skirt,purple,[[-.91,.58,.85],[-.67,.66,.89],[-.22,.42,.97],[.14,.38,.96]],21,{waves:8,offset:1.4});
 const torso=r.grp(root,0,1.8,0);
 r.ell(torso,mail,0,.03,0,.55,.60,.34,17,true);
 r.ell(torso,ivory,0,.03,.27,.54,.54,.18,16,true);
 for(const s of [-1,1]){
  const side=r.ell(torso,bone,s*.38,.01,.14,.24,.51,.21,12);side.rotation.z=s*.25;
  r.link(torso,gold,[s*.42,.40,.30],[s*.30,-.42,.39],.045);
  for(let i=0;i<5;i++)r.link(torso,bone,[s*.10,.18-i*.125,.43],[s*.37,.11-i*.13,.33],.033,6);
 }
 r.link(torso,gold,[-.41,.31,.39],[.41,.31,.39],.032);
 r.ell(torso,shadow,0,.07,.448,.20,.30,.07,10);
 r.oct(torso,blue,0,.08,.50,.13,.22,.085);
 r.link(torso,gold,[-.29,.24,.46],[.30,-.18,.46],.02);r.link(torso,gold,[.25,.28,.44],[-.22,-.26,.44],.02);
 r.cyl(root,gold,0,1.32,0,.53,.57,.16,17);
 r.oct(root,blue,0,1.30,.52,.15,.125,.068);
 const cloak=r.grp(torso,0,.35,-.11);
 r.ringDrape(cloak,purple,[[-1.90,.84,.78],[-1.48,.86,.82],[-.94,.74,.9],[-.21,.60,.88],[.11,.60,.89]],24,{waves:9,offset:.28});
 for(let i=0;i<8;i++){
  const th=i*2*Math.PI/8;xCape(th,i);
 }
 function xCape(th,i){if(Math.sin(th)>.3)return;const x=Math.cos(th)*.70,z=Math.sin(th)*.73;
  r.cone(cloak,i%2?purple:shadow,x,-1.88,z,0,.10,.21,5).rotation.z=.18*x;
 }
 for(const s of [-1,1]){
  const thigh=r.grp(root,s*.30,1.13,0);legs.push(thigh);
  r.ell(thigh,mail,0,-.13,0,.23,.31,.24,12);
  r.ell(thigh,ivory,0,-.19,.16,.205,.26,.13,13);
  r.box(thigh,gold,0,-.35,.17,.20,.07,.20);
  r.ell(thigh,bone,0,-.46,.01,.19,.19,.20,11);
  r.link(thigh,ivory,[0,-.49,.01],[0,-.87,.07],.127);
  r.box(thigh,mail,0,-.82,.08,.26,.30,.32,true);
  r.box(thigh,ivory,0,-1.03,.23,.34,.19,.54,true);
  for(let i=-1;i<=1;i++)r.cone(thigh,bone,i*.105,-1.09,.48,0,.050,.16,6).rotation.x=Math.PI/2;
 }
 const skull=r.grp(torso,0,.75,.04);
 r.ell(skull,bone,0,.10,.09,.29,.32,.30,16);
 r.box(skull,bone,0,-.16,.23,.36,.19,.30);
 r.box(skull,shadow,0,-.17,.39,.26,.082,.042);
 for(const s of [-1,1]){
   r.ell(skull,shadow,s*.12,.12,.35,.09,.095,.032,11);
   r.ell(skull,blue,s*.12,.12,.379,.040,.049,.02,9);
   r.link(skull,gold,[s*.12,.30,.30],[s*.27,.41,.20],.027);
   for(let i=0;i<3;i++)r.cone(skull,ivory,s*(.10+i*.08),-.24,.37,0,.032,.115,6).rotation.x=Math.PI;
 }
 r.ell(skull,shadow,0,-.06,.36,.09,.07,.03,9);
 r.cone(skull,ivory,0,-.01,.41,0,.045,.13,7).rotation.x=Math.PI/2;
 const crest=r.grp(skull,0,.33,0);
 r.cyl(crest,gold,0,.025,0,.31,.31,.12,10);
 for(let i=0;i<7;i++){
  const th=(i/6-.5)*Math.PI,rad=.26;const h=i===3?.45:.22+(i%3)*.05;
  const sp=r.cone(crest,i%2?ivory:gold,Math.sin(th)*rad,.14+h*.45,Math.cos(th)*rad,0,.060,h,7);
  sp.rotation.z=-Math.sin(th)*.30;
 }
 for(const s of [-1,1]){
  const arm=r.grp(torso,s*.64,.35,-.03);arms.push(arm);
  r.ell(arm,mail,s*.04,-.16,0,.22,.25,.24,12);
  const pad=r.ell(arm,ivory,s*.14,-.10,.06,.35,.22,.40,13,true);pad.rotation.z=s*.25;
  for(let i=0;i<3;i++){
   const plate=r.ell(arm,bone,s*.20,-.25-i*.13,.14,.24-i*.022,.065,.28,9);
   plate.rotation.z=s*.21;
  }
  r.link(arm,ivory,[s*.19,-.29,0],[s*.24,-.61,.10],.14);
  r.ell(arm,mail,s*.25,-.57,.12,.17,.18,.19,11);
  r.box(arm,ivory,s*.26,-.80,.19,.29,.31,.29);
  for(let i=0;i<3;i++)r.cone(arm,bone,s*(.15+i*.10),-1.0,.32,0,.046,.16,6).rotation.x=Math.PI;
  r.oct(arm,blue,s*.14,-.08,.45,.075,.11,.034);
  r.path(arm,gold,[[s*.04,-.22,.35],[s*.16,-.08,.45],[s*.35,-.20,.34]],.018);
 }
 const sword=r.grp(arms[1],.27,-.77,.32);
 r.link(sword,mail,[0,-.27,0],[0,.41,0],.052,9);
 r.cyl(sword,gold,0,.40,0,.14,.14,.13,8);
 r.link(sword,gold,[-.28,.48,0],[.28,.48,0],.055,7);
 r.oct(sword,blue,0,.48,.08,.08,.10,.06);
 const blade=r.grp(sword,0,.54,0);
 r.panel(blade,ivory,[[0,1.50,0],[.19,1.14,.08],[.17,.02,.09],[-.17,.02,.09],[-.19,1.14,.08]]);
 r.panel(blade,bone,[[0,1.50,0],[-.19,1.14,-.055],[-.18,.02,-.05],[.18,.02,-.05],[.19,1.14,-.055]]);
 r.link(blade,gold,[0,.03,.1],[0,1.37,.09],.023);
 for(let j=0;j<4;j++)r.oct(blade,blue,0,.19+j*.28,.14,.032,.085,.026);
 const shield=r.grp(arms[0],-.29,-.52,.20);
 r.ell(shield,mail,0,-.07,.22,.37,.50,.13,14);
 r.ell(shield,ivory,0,-.07,.36,.32,.45,.105,14);
 r.oct(shield,blue,0,-.02,.47,.11,.17,.07);
 r.link(shield,gold,[-.23,.10,.43],[.24,.10,.43],.028);
 r.link(shield,gold,[0,.34,.41],[0,-.37,.42],.027);
 const rage=r.sprite(torso,0x9b8fff,0,.04,-.34,2.4,.17);
 let enraged=false;
 function setEnraged(v){enraged=Boolean(v);}
 function update(t,dt=0,mode='idle'){
  const wind=mode==='windup',attack=mode==='attack',walk=mode==='walk',hurt=mode==='hurt',dead=mode==='dead';
  root.position.y=walk?.04*Math.abs(Math.sin(t*5)):.017*Math.sin(t*1.1);
  torso.rotation.y=walk?.035*Math.sin(t*4):0;torso.rotation.z=hurt?-.11:0;
  legs[0].rotation.x=walk?.28*Math.sin(t*5):0;legs[1].rotation.x=-legs[0].rotation.x;
  arms[1].rotation.x=wind?-1.8:attack?.75:walk?Math.sin(t*5)*.15:-.22;
  arms[1].rotation.z=wind?-.27:attack?-.07:.07;
  arms[0].rotation.x=wind?-.72:attack?-.56:0;
  cloak.rotation.x=Math.sin(t*1.3)*.039+(wind?-.10:0);
  skull.rotation.y=Math.sin(t*.75)*.044;rage.material.opacity=enraged?.5:.16;
  blue.emissiveIntensity=enraged?2.3:wind?1.7:1;
  root.rotation.x=dead?1.0:attack?-.18:0;
  root.scale.y=dead?.55:1;
 }
 update(0);return {...finish(r,update,{root,torso,legs,arms,skull,cloak}),setEnraged,getEnraged:()=>enraged};
}
