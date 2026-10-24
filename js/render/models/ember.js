// Köken: Emre'nin "Büyücünün Gecesi 3D Full12 Pro v2" 3B model paketi (js/render/models/ember.js), değiştirilmeden alındı (common.js v1 ile aynı).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js + enemyvis.js (düşmanlar).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Molten-cored ember wraith; pale hot fissures glow before self-detonation. */
export function createEmber({scale=1,color=0xff8a3a}={}){
 const r=createRig('Kor_Hortlak',{scale,color}),a=r.actor;
 const basalt=r.mat('cracked black basalt',0x211923,{rough:.99}),stone=r.mat('igneous plates',0x443039,{rough:.94}),char=r.mat('warm charcoal',0x694036,{rough:.88});
 const lava=r.mat('orange molten interior',color,{glow:1.15,rough:.37,tint:false}),core=r.mat('whitehot inferno',0xffd481,{glow:2.2,rough:.24,tint:false}),flame=r.mat('purple flame edges',0x762e70,{glow:.32,rough:.7});
 const body=r.grp(a,0,0,0),arms=[];
 r.ico(body,lava,0,.76,0,.42,.61,.37,1);
 r.ico(body,basalt,0,.78,-.02,.46,.57,.42,0);
 r.oct(body,core,0,.80,.43,.17,.22,.06);r.ell(body,lava,0,.80,.39,.25,.33,.055,13);
 for(let i=0;i<14;i++){
  const angle=i*2.399;const x=Math.sin(angle)*(.30+(i%3)*.039),y=.48+(i%5)*.19,z=Math.cos(angle)*(.32+(i%2)*.05);
  const p=r.ico(body,i%4?stone:char,x,y,z,.16+(i%3)*.035,.13+(i%4)*.035,.10+(i%3)*.03);
  p.rotation.set(i*.42,i*.23,i*.32);
 }
 // Front-facing irregular luminous fractures and expressive coal face.
 for(const pts of [ [[-.24,1.15,.36],[-.05,1.02,.45],[-.12,.82,.48],[.02,.66,.46]], [[.20,1.17,.32],[.08,.97,.45],[.25,.75,.40]], [[-.29,.72,.34],[-.20,.56,.39],[-.29,.41,.30]],[[.06,.65,.45],[.15,.51,.43],[.09,.35,.34]] ])r.path(body,core,pts,.023,20,6);
 for(const s of [-1,1]){
  r.ell(body,basalt,s*.15,1.0,.43,.12,.105,.05,9);
  r.oct(body,core,s*.15,1.0,.49,.055,.053,.022);
  const arm=r.grp(body,s*.39,.96,0);arms.push(arm);
  r.ico(arm,stone,s*.06,-.17,0,.17,.26,.21);
  r.link(arm,basalt,[s*.08,-.20,0],[s*.22,-.42,.11],.115);
  r.ico(arm,basalt,s*.23,-.47,.11,.20,.19,.19);
  for(let j=0;j<3;j++)r.cone(arm,lava,s*(.13+j*.09),-.65,.20,0,.037,.19,6).rotation.z=Math.PI;
 }
 const crown=r.grp(body,0,1.24,0);
 for(let i=0;i<7;i++){
  const angle=i*2.399,rad=.19+(i%2)*.08;
  const f=r.cone(crown,i%3?lava:flame,Math.cos(angle)*rad,(i%4)*.09,Math.sin(angle)*rad,0,.055,.30+(i%3)*.11,7);
  f.rotation.z=.20*Math.sin(angle);
 }
 const orbit=r.grp(body,0,.77,0);for(let i=0;i<6;i++){const th=i*Math.PI*2/6,rad=.54;
  r.oct(orbit,i%2?lava:char,Math.sin(th)*rad,.26*Math.sin(i*2),Math.cos(th)*rad,.055,.08,.052);
 }
 const aura=r.sprite(body,0xff6d22,0,.72,-.10,1.65,.32);
 const ash=new Float32Array(9*3),pointsG=r.own(new THREE.BufferGeometry());pointsG.setAttribute('position',new THREE.BufferAttribute(ash,3));
 const pm=new THREE.PointsMaterial({color:0xffad59,size:.07,transparent:true,opacity:.83,blending:THREE.AdditiveBlending,depthWrite:false});
 const pts=new THREE.Points(pointsG,pm);body.add(pts);
 const rawDispose=r.dispose;
 function update(t,dt=0,mode='idle'){
  const wind=mode==='windup',attack=mode==='attack',walk=mode==='walk',hurt=mode==='hurt',dead=mode==='dead';
  body.position.y=(walk?.065*Math.abs(Math.sin(t*10)):.030*Math.sin(t*3))-(dead?.45:0);
  body.rotation.z=hurt?.18:.08*Math.sin(t*1.6);
  const s=dead?.37:wind?1.17+.055*Math.sin(t*20):attack?1.31:1;
  body.scale.set(s,s,s);crown.rotation.y=t*.56;
  orbit.rotation.y=t*(wind?4.2:.9);arms[0].rotation.z=wind?-.55:-.12*Math.sin(t*2);
  arms[1].rotation.z=wind?.55:.12*Math.sin(t*2);
  arms.forEach(arm=>arm.rotation.x=attack?-1.1:wind?-.52:0);
  lava.emissiveIntensity=wind?2.8:attack?4:1.15;
  core.emissiveIntensity=wind?3.5:attack?5:2.2;aura.material.opacity=wind?.65:.33;
  for(let i=0;i<9;i++){
    let angle=i*2.4+t*(i%2?.7:-.42);
    ash[i*3]=Math.sin(angle)*(.29+(i%3)*.1);
    ash[i*3+1]=.25+((t*.35+i*.123)%1.1);
    ash[i*3+2]=Math.cos(angle)*(.29+(i%2)*.1);
  }pointsG.attributes.position.needsUpdate=true;
 }
 update(0);const result=finish(r,update,{body,crown,arms,orbit});const disp=result.dispose;
 result.dispose=()=>{pm.dispose();disp();};return result;
}
