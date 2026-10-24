// Köken: Emre'nin "Büyücünün Gecesi Core6 Pro v1" 3B model paketi (js/render/models/bat.js), değiştirilmeden alındı.
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js (düşmanlar), js/render/wizard.js (Pırıl).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Animated membrane wings and jewel eyes. Radius 0.5, flying center y~1.6. */
export function createBat({scale=1,color=0xb98bff}={}){
 const r=createRig('Bat_YarasaMagarasi',{scale,color}),a=r.actor;
 const fur=r.mat('violet fur',0x503369,{rough:.89}),furHi=r.mat('light fur',color,{rough:.87}),membrane=r.mat('wings',0x563275,{rough:.95,alpha:.92,side:THREE.DoubleSide}),
 rib=r.mat('bone ribs',0x9b75bb,{rough:.67}),eyes=r.mat('garnet eyes',0xff3d80,{glow:1,tint:false}),gold=r.mat('ear jewels',0xffbb79,{metal:.55,rough:.37});
 const body=r.grp(a,0,1.58,0);
 r.ell(body,fur,0,0,0,.18,.28,.185,18,true);r.ell(body,furHi,0,-.045,.155,.12,.20,.056,13);
 r.sph(body,fur,0,.19,.05,.20,17);
 for(const s of [-1,1]){
  const ear=r.cone(body,fur,s*.13,.415,.065,0,.09,.33,8);ear.rotation.z=-s*.28;
  const inner=r.ell(body,furHi,s*.135,.39,.115,.048,.09,.02);
  r.ell(body,eyes,s*.082,.213,.218,.049,.067,.020,12);
  r.ell(body,gold,s*.095,.225,.240,.016,.024,.007,9);
  r.link(body,furHi,[s*.13,-.21,.08],[s*.18,-.36,.18],.02);
  for(let i=0;i<2;i++)r.link(body,fur,[s*.14,-.34,.18],[s*(.14+i*.07),-.42,.26],.014);
 }
 const wings=[];
 for(const s of [-1,1]){
  const wing=r.grp(body,s*.175,.12,-.02);wings.push(wing);
  // Wide wing with three curved 'fingers', silhouette distinct even at a distance.
  const vertices=[ [0,0,0],[s*.25,.19,0],[s*.57,.31,-.04],[s*.94,.24,-.03],[s*1.09,.08,-.08],[s*.84,-.04,.03],[s*.75,-.22,.03],[s*.48,-.06,.08],[s*.35,-.28,.09],[s*.19,-.10,.08] ];
  const tris=[[0,1,9],[1,2,7],[1,7,9],[2,3,5],[2,5,7],[3,4,5],[5,6,7],[7,8,9]];
  const positions=[];for(const tri of tris)for(const idx of (s===1?tri:tri.slice().reverse()))positions.push(...vertices[idx]);
  const geo=r.own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();r.mesh(wing,geo,membrane);
  for(const j of [2,3,4,6,8])r.link(wing,rib,vertices[0],vertices[j],.014,6);
  for(const j of [3,4,6,8])r.sph(wing,furHi,...vertices[j],.024,8);
 }
 const tail=r.cone(body,furHi,0,-.25,-.15,0,.075,.25,7);tail.rotation.x=Math.PI;
 const aura=r.sprite(body,0x9358e4,0,.1,-.07,1.0,.22);
 function update(t,d=0,mode='idle'){
  const attacking=mode==='windup'||mode==='attack',walk=mode==='walk',hurt=mode==='hurt';
  body.position.y=Math.sin(t*5.2)*.065+(attacking?-.10:0);
  body.rotation.z=.07*Math.sin(t*3.5);body.rotation.x=attacking?-.30:0;
  wings[0].rotation.z=(.25+.56*Math.sin(t*(walk?17:13)))*(attacking?1.36:1);
  wings[1].rotation.z=-wings[0].rotation.z;
  wings[0].rotation.y=Math.sin(t*8)*.10;wings[1].rotation.y=-wings[0].rotation.y;
  body.scale.setScalar(hurt?.89:mode==='dead'?.38:1);
  aura.material.opacity=attacking?.38:.17;
 }
 update(0);return finish(r,update,{body,wings,eyes});
}
