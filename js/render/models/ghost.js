// Köken: Emre'nin "Büyücünün Gecesi Core6 Pro v1" 3B model paketi (js/render/models/ghost.js), değiştirilmeden alındı.
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js (düşmanlar), js/render/wizard.js (Pırıl).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** 0.7-radius ethereal ghost. Translucency uses depthWrite=false; silhouette-first. */
export function createGhost({scale=1,color=0xc9ffd9}={}){
 const r=createRig('Ghost_FisildayanRuh',{scale,color}),a=r.actor;
 const mist=r.mat('body',color,{rough:.96,alpha:.67,glow:.22,side:THREE.DoubleSide});
 const folds=r.mat('mist shades',0x5baa91,{rough:1,alpha:.49,glow:.15,side:THREE.DoubleSide});
 const ink=r.mat('empty eye sockets',0x081d27,{rough:.94,basic:true,tint:false});
 const soul=r.mat('cold pupils',0x9affda,{glow:.95,tint:false});
 const chains=r.mat('soul chain',0xb8e6b4,{metal:.43,rough:.46,alpha:.80});
 const crown=r.mat('forehead rune',0xf2ffdb,{glow:.66});
 const torso=r.grp(a,0,0,0);
 r.ringDrape(torso,mist,[[.30,.06,.65],[.46,.36,.8],[.7,.43,.88],[1.02,.38,.96],[1.29,.30,1],[1.52,.19,1]],24,{waves:7,offset:.3});
 r.ringDrape(torso,folds,[[.31,.30,.75],[.55,.38,.84],[.9,.32,.92],[1.19,.23,.93]],18,{waves:9,offset:2.2});
 r.ell(torso,mist,0,1.45,0,.315,.39,.30,18);
 // Two recessed eye wells and glowing pupils, placed at +Z face
 for(const s of [-1,1]){
  r.ell(torso,ink,s*.135,1.46,.285,.095,.14,.042,12);
  r.ell(torso,soul,s*.135,1.46,.327,.032,.066,.015,9);
  r.path(torso,chains,[[s*.085,1.78,.24],[s*.18,1.76,.28],[s*.27,1.71,.20]],.013,10);
 }
 r.oct(torso,crown,0,1.79,.26,.04,.095,.024);
 const arms=[],hands=[];
 for(const s of [-1,1]){
  const arm=r.grp(torso,s*.29,1.28,0);arms.push(arm);
  r.link(arm,mist,[0,0,0],[s*.31,-.17,.06],.11);r.link(arm,mist,[s*.31,-.17,.06],[s*.42,-.48,.13],.072);
  r.ell(arm,mist,s*.42,-.48,.13,.10,.14,.12);
  for(let j=0;j<3;j++)r.link(arm,folds,[s*(.40+j*.02),-.49,.15],[s*(.42+j*.05),-.67-(j%2)*.05,.23],.014);
 }
 for(let i=0;i<4;i++)r.link(torso,chains,[(-.21+i*.13),1.05,.38],[(-.16+i*.11),.88,.35],.01);
 const halo=r.sprite(torso,0x75ffc4,0,1.07,-.12,2.3,.25);
 const sparksPosition=new Float32Array(6*3),sparkGeo=r.own(new THREE.BufferGeometry());
 sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparksPosition,3));
 const sparkMat=new THREE.PointsMaterial({color:0xb9ffde,size:.065,transparent:true,opacity:.84,blending:THREE.AdditiveBlending,depthWrite:false});
 a.add(new THREE.Points(sparkGeo,sparkMat));
 function update(t,d=0,mode='idle'){
  const walk=mode==='walk',charge=mode==='windup',hit=mode==='hurt',attack=mode==='attack',dead=mode==='dead';
  torso.position.y=Math.sin(t*2.5)*.065+(walk?.04:0)-(dead?.7:0);
  torso.rotation.y=.09*Math.sin(t*.9);torso.rotation.x=charge?-.24:attack?-.36:0;
  torso.scale.x=charge?1.07:hit?.9:1;torso.scale.y=dead?.63:1;
  arms[0].rotation.z=Math.sin(t*2)*.12+(charge?.45:0);arms[1].rotation.z=-Math.sin(t*2)*.12-(charge?.45:0);
  halo.material.opacity=charge?.48:.27;
  for(let i=0;i<6;i++){const ang=i*2.4+t*.75,rad=.45+(i%3)*.07;sparksPosition[i*3]=Math.sin(ang)*rad;sparksPosition[i*3+1]=.60+Math.sin(t*1.7+i)*.21;sparksPosition[i*3+2]=Math.cos(ang)*rad;}sparkGeo.attributes.position.needsUpdate=true;
 }
 update(0);const baseDispose=r.dispose;r.dispose=()=>{sparkMat.dispose();baseDispose();};return finish(r,update,{torso,arms});
}
