// Köken: Emre'nin "Büyücünün Gecesi Core6 Pro v1" 3B model paketi (js/render/models/boss.js), değiştirilmeden alındı.
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js (düşmanlar), js/render/wizard.js (Pırıl).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** VEYIS: tragic corrupted king; crown shards, engraved armor and living heart cracks. */
export function createBoss({scale=1,color=0x7a2038}={}){
 const r=createRig('Veyis_ShadowKing_GeceKalbi',{scale,color}),a=r.actor;
 const obs=r.mat('void silk',0x180d23,{rough:.9}),aub=r.mat('shadow velvet',color,{rough:.91}),
 robe=r.mat('purplish undercloak',0x321b3e,{rough:.93,side:THREE.DoubleSide}),capeMat=r.mat('ragged cape',0x35152e,{rough:.94,side:THREE.DoubleSide}),
 metal=r.mat('tarnished gold',0x94724c,{rough:.45,metal:.67}),gold=r.mat('bright edge',0xe5aa68,{rough:.36,metal:.66}),
 mail=r.mat('black armor',0x261b2e,{metal:.43,rough:.62}),skin=r.mat('pale weary face',0xa58d93,{rough:.95}),
 voidEye=r.mat('dark eyes',0x1b0b1d,{rough:1}),eye=r.mat('weep scarlet',0xff487f,{glow:1.25,tint:false}),
 crack=r.mat('glowing nightheart fracture',0xff456e,{glow:.9,rough:.35,tint:false}),
 deep=r.mat('crimson shadow',0x682040,{glow:.18,rough:.92}),
 heart=r.mat('broken core',0xff7390,{glow:1.15,rough:.21,metal:.12,tint:false});
 const body=r.grp(a),feet=[],arms=[];
 for(const s of [-1,1]){
  const leg=r.grp(body,s*.31,.79,-.015);feet.push(leg);
  r.ell(leg,mail,0,-.15,.05,.20,.44,.26,12);
  r.box(leg,mail,0,-.57,.15,.36,.22,.61,true);
  r.box(leg,metal,s*.06,-.46,.39,.25,.045,.09);
 }
 const skirt=r.ringDrape(body,robe,[[.11,.77,.78],[.25,.83,.82],[.56,.74,.91],[.88,.59,.95],[1.26,.47,1],[1.67,.57,1],[1.96,.53,1]],32,{waves:9,offset:.7});
 r.ringDrape(body,aub,[[.15,.77,.77],[.28,.80,.85],[.72,.66,.87],[1.16,.45,.94],[1.83,.51,.92]],22,{waves:6,offset:1.4});
 const cape=r.grp(body,0,2.01,-.10);
 r.ringDrape(cape,capeMat,[[-.01,.66,.84],[-.46,.78,.84],[-1.28,1.07,.78],[-1.93,1.17,.87]],24,{waves:11,offset:2.1});
 const torso=r.ell(body,mail,0,2.02,0,.70,.72,.52,18,true);
 r.ell(body,obs,0,2.08,.45,.45,.57,.13,16);
 // Breastplate sculpt and glowing fractured-heart, with broken crack branches
 r.ell(body,mail,0,2.04,.54,.53,.63,.14,17);
 for(const [x1,y1,x2,y2] of [[-.32,2.31,-.05,2.13],[.30,2.30,.05,2.10],[0,2.50,.05,2.24],[-.07,2.14,-.24,1.91],[.07,2.13,.25,1.89]])
  r.link(body,metal,[x1,y1,.68],[x2,y2,.68],.024);
 r.ico(body,heart,0,2.13,.74,.19,.29,.11);
 r.oct(body,crack,0,2.13,.87,.10,.22,.07);
 r.path(body,crack,[[0,2.25,.85],[-.20,2.43,.74],[-.40,2.49,.56]],.025);
 r.path(body,crack,[[0,2.14,.85],[.19,1.99,.72],[.32,1.83,.55]],.026);
 r.path(body,crack,[[0,2.04,.84],[-.08,1.77,.67],[-.3,1.51,.51]],.023);
 const collar=r.grp(body,0,2.45,0);
 r.ringDrape(collar,obs,[[0,.46,1],[.13,.54,1],[.38,.48,1]],20,{waves:6,offset:.4});
 // Head: old king, grief visible through dark face, crowned with asymmetrical thorns
 const head=r.grp(body,0,2.86,.10);
 r.ell(head,skin,0,.08,.03,.38,.42,.34,17);
 r.ell(head,obs,0,.34,-.02,.43,.24,.33,13);
 r.ell(head,obs,0,-.20,.075,.29,.17,.29,13);
 for(const s of [-1,1]){
  r.ell(head,voidEye,s*.155,.12,.311,.116,.090,.037,12);
  r.ell(head,eye,s*.155,.12,.346,.037,.046,.012,9);
  r.link(head,deep,[s*.09,.23,.34],[s*.25,.26,.27],.023);
 }
 r.ell(head,skin,0,-.03,.36,.085,.12,.09,11);
 r.link(head,crack,[0,.32,.324],[.09,.39,.32],.019,7);
 const circ=r.cyl(head,metal,0,.46,0,.45,.41,.17,10);
 r.torus(head,gold,0,.53,0,.405,.026,7,26).rotation.x=Math.PI/2;
 const spikes=[-.42,-.24,-.07,.11,.32];
 for(let i=0;i<spikes.length;i++){
  const ang=-Math.PI*.5+(i/(spikes.length-1))*Math.PI;
  const s=spikes[i],ht=i===2?.51:(i===0||i===4?.31:.40);
  const piece=r.cone(head,i%2?gold:metal,Math.sin(ang)*.36,.65+ht*.42,Math.cos(ang)*.33,0,.075,ht,7);
  piece.rotation.z=.11*Math.sin(ang);
 }
 const armRunes=[];
 for(const s of [-1,1]){
  const arm=r.grp(body,s*.76,2.43,-.02);arms.push(arm);
  const pad=r.ell(arm,mail,s*.13,-.06,0,.37,.27,.44,14,true);pad.rotation.z=s*.17;
  r.box(arm,metal,s*.22,-.14,.36,.35,.07,.14);
  const upper=r.ell(arm,aub,s*.22,-.43,0,.25,.39,.29,13);upper.rotation.z=s*.13;
  const gauntlet=r.ell(arm,mail,s*.29,-.78,.02,.22,.29,.27,13);
  r.ell(arm,skin,s*.30,-1.04,.09,.15,.17,.16,10);
  const runePiece=r.oct(arm,crack,s*.2,-.12,.43,.07,.08,.035);armRunes.push(runePiece);
  r.path(arm,metal,[[s*.06,-.05,.38],[s*.2,-.12,.44],[s*.36,-.03,.37]],.018);
 }
 // Waist belt and ceremonial hanging pauldrons
 r.cyl(body,metal,0,1.43,0,.55,.57,.15,18);
 r.box(body,gold,0,1.42,.52,.26,.20,.07);
 r.oct(body,crack,0,1.42,.59,.072,.097,.045);
 for(const s of [-1,1])r.link(body,gold,[s*.24,1.42,.5],[s*.34,.72,.65],.021);
 const backAura=r.sprite(body,0xba285a,0,2.05,-.23,3.65,.24);
 const heartGlow=r.sprite(body,0xff4277,0,2.13,.86,.92,.55);
 // Phase 3 shield: additive bands and transparent magical sphere, hidden by default.
 const shieldRoot=r.grp(body,0,2.02,0);
 const shieldMat=r.mat('shield shell',0x9e8aff,{alpha:.16,glow:.32,rough:.26,side:THREE.DoubleSide,tint:false});
 const shell=r.sph(shieldRoot,shieldMat,0,0,0,1,18);shell.scale.set(1.42,2.05,1.40);
 const shieldBand=r.torus(shieldRoot,gold,0,0,0,1.38,.023,8,45);shieldBand.rotation.x=1.0;
 const shieldBand2=r.torus(shieldRoot,crack,0,0,0,1.39,.021,8,45);shieldBand2.rotation.x=2.2;
 shieldRoot.visible=false;
 let phase=1;
 function setPhase(v){phase=Math.max(1,Math.min(3,Math.round(v)));shieldRoot.visible=phase===3;}
 function update(t,d=0,mode='idle'){
  const w=mode==='walk',wind=mode==='windup',at=mode==='attack',hurt=mode==='hurt';
  body.position.y=Math.sin(t*1.1)*.018+(w?Math.abs(Math.sin(t*4))*.035:0);
  body.rotation.z=w?.018*Math.sin(t*3):hurt?-.10:Math.sin(t*.4)*.008;
  feet[0].rotation.x=w?.21*Math.sin(t*4):0;feet[1].rotation.x=-feet[0].rotation.x;
  arms[0].rotation.x=wind?-.67:at?-1.25:w?Math.sin(t*4)*.15:-.12;
  arms[1].rotation.x=wind?-.67:at?-1.25:w?-Math.sin(t*4)*.15:-.12;
  arms[0].rotation.z=wind?-.35:-.07;arms[1].rotation.z=wind?.35:.07;
  head.rotation.y=Math.sin(t*.42)*.07;cape.rotation.x=.035+Math.sin(t*1.25)*.04;
  backAura.material.opacity=phase===2?.42:.26;heartGlow.material.opacity=phase===3?.85:.55;
  heart.emissiveIntensity=phase===3?1.6:wind?1.5:1.15;
  shieldRoot.rotation.y=t*.23;shieldRoot.rotation.z=.04*Math.sin(t*.8);
  shieldRoot.scale.setScalar(phase===3?1+.04*Math.sin(t*3):1);
  body.scale.y=mode==='dead'?.45:1;
 }
 update(0);return {...finish(r,update,{body,head,arms,feet,cape,shield:shieldRoot}),setPhase,getPhase:()=>phase};
}
