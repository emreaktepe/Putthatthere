// Köken: Emre'nin "Büyücünün Gecesi Core6 Pro v1" 3B model paketi (js/render/models/piril.js), değiştirilmeden alındı.
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js (düşmanlar), js/render/wizard.js (Pırıl).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Companion: warm golden-white spirit with faint human silhouette. No lights, 12 trail particles. */
export function createPiril({scale=1,color=0xffd98c}={}){
 const r=createRig('Piril_GeceKalbi_DostRuh',{scale,color}),p=r.actor;
 const gold=r.mat('warm core',0xffe1a3,{glow:.9,rough:.38});
 const opal=r.mat('pearl',0xfff1d4,{glow:.20,rough:.22,alpha:.83});
 const pale=r.mat('translucent body',0xffe9d8,{glow:.4,alpha:.55});
 const violet=r.mat('iris',0xa78cf4,{glow:.7}),antique=r.mat('gold trim',0xc6a163,{metal:.55,rough:.32});
 const glass=r.mat('shell',0xffe8b3,{glow:.44,alpha:.16,side:THREE.DoubleSide});
 const core=r.ico(p,gold,0,1.18,0,.17,.22,.17,1);
 r.ell(p,glass,0,1.15,0,.46,.58,.42,20);
 const little=r.grp(p,0,1.08,0);
 r.ell(little,pale,0,-.04,0,.085,.18,.073,16);
 r.sph(little,opal,0,.21,0,.119,15);
 r.ell(little,violet,-.044,.226,.103,.014,.018,.011,10);r.ell(little,violet,.044,.226,.103,.014,.018,.011,10);
 for(const s of [-1,1]){r.link(little,pale,[s*.067,.01,0],[s*.16,-.105,0],.021);r.link(little,pale,[s*.038,-.17,0],[s*.076,-.34,0],.025);}
 for(let i=0;i<7;i++){const a=i*2*Math.PI/7,rr=.32+(i%2)*.08;r.oct(p,antique,Math.cos(a)*rr,1.11+Math.sin(a*2)*.14,Math.sin(a)*rr,.018,.042,.018);}
 const glow1=r.sprite(p,0xffdf98,0,1.19,0,1.5,.55),glow2=r.sprite(p,0xb491ff,0,1.2,0,2.1,.18);
 const trail=r.grp(p),sparkPositions=new Float32Array(12*3);
 const sparkGeo=r.own(new THREE.BufferGeometry());sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));
 const sparkMat=new THREE.PointsMaterial({color:0xffdd9f,size:.060,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
 const sparks=new THREE.Points(sparkGeo,sparkMat);trail.add(sparks);
 function update(t,dt=0,mode='idle'){
  const energetic=mode==='attack'||mode==='windup',hurt=mode==='hurt',dead=mode==='dead';
  p.position.y=Math.sin(t*2.3)*.10+(energetic?.18:0)-(dead?.58:0);
  p.position.x=Math.sin(t*.78)*.06;p.rotation.y=Math.sin(t*.9)*.19;
  little.rotation.z=Math.sin(t*1.7)*.085;little.rotation.x=energetic?-.13:0;
  core.rotation.y=t*.9;core.rotation.z=.1*Math.sin(t*2);
  glow1.material.opacity=(hurt?.85:.50)+Math.sin(t*3.3)*.07;glow1.scale.setScalar(energetic?1.9:1.5);
  glow2.material.opacity=dead?.03:.19;
  for(let i=0;i<12;i++){
   const a=t*.7+i*2.399,radius=.38+(i%4)*.065;
   sparkPositions[i*3]=Math.cos(a)*radius;
   sparkPositions[i*3+1]=1.19+Math.sin(t*2+i*.9)*.19+(i%4-2)*.09;
   sparkPositions[i*3+2]=Math.sin(a)*radius;
  }
  sparkGeo.attributes.position.needsUpdate=true;
 }
 update(0);const baseDispose=r.dispose;r.dispose=()=>{sparkMat.dispose();baseDispose();};return finish(r,update,{core,spirit:little,glow:glow1});
}
