// Köken: Emre'nin "son 3" sahne figürleri paketi — Veyis'in insan hali (createVeyisInsan), değiştirilmeden alındı (yalnızca bu başlık eklendi).
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/propsvis.js + props3d.js (sahne figürü; savaşa katılmaz).
import * as THREE from 'three';
import {createRig,finish} from './common.js';
/** Veyis before the curse — aged grieving monarch; sculpted, low-cost costume layers.
 * Not a villain stance: downturned shoulders, pale human face, empty hands.
 */
export function createVeyisInsan({scale=1,color=0x39243f}={}){
 const r=createRig('Veyis_Insan_Hali',{scale,color}),a=r.actor;
 const velvet=r.mat('royal mourning velvet',color,{rough:.91,side:THREE.DoubleSide}),under=r.mat('black silk',0x171625,{rough:.94,side:THREE.DoubleSide});
 const gold=r.mat('aged gold embroidery',0xc5a062,{rough:.38,metal:.72,tint:false}),goldDark=r.mat('dulled trim',0x8a6c48,{rough:.55,metal:.54,tint:false}),ruby=r.mat('cracked night heart relic',0x8c3457,{rough:.38,glow:.20,tint:false});
 const leather=r.mat('boots and belt',0x392b30,{rough:.84}),skin=r.mat('aged parchment skin',0xc8a492,{rough:.92}),skinShadow=r.mat('face shadows',0x9e736d,{rough:1});
 const hair=r.mat('ash silver hair',0xaaa6b9,{rough:.98}),hairDark=r.mat('shadowed silver strands',0x706f86,{rough:1}),eye=r.mat('brown tired pupils',0x32212a,{rough:.4,tint:false});
 const body=r.grp(a,0,0,0),torso=r.grp(body,0,0,0),head=r.grp(torso,0,2.86,.085),arms=[],legs=[];
 // Garments built in distinct sculptural shells with fitted neckline and broad hem
 r.ringDrape(torso,under,[[.13,.52,.85],[.50,.55,.95],[.96,.41,1],[1.64,.32,1],[2.18,.34,1]],25,{waves:9,offset:1.3});
 r.ringDrape(torso,velvet,[[.13,.75,.88],[.55,.69,1],[1.1,.48,1],[1.70,.43,1],[2.19,.47,.94]],25,{waves:8,offset:.8});
 const backCape=r.grp(torso,0,2.07,-.29);
 const cape=r.panel(backCape,velvet,[[-.46,0,0],[-.59,-.4,-.03],[-.82,-1.84,-.26],[-.27,-2.02,-.36],[.40,-2.02,-.36],[.82,-1.90,-.23],[.56,-.4,-.02],[.46,0,0]]);
 for(const s of [-1,1]){
  r.link(torso,gold,[s*.47,2.13,.23],[s*.53,.48,.48],.027);
  r.link(torso,gold,[s*.38,2.20,.30],[s*.43,.21,.55],.013);
  r.link(torso,gold,[s*.43,2.11,-.24],[s*.78,.24,-.44],.019);
  const leg=r.grp(body,s*.26,.8,-.05);legs.push(leg);
  r.box(leg,leather,0,-.33,.06,.25,.72,.31);r.box(leg,leather,0,-.66,.16,.28,.17,.44,true);
  const arm=r.grp(torso,s*.48,2.27,0);arms.push(arm);
  r.ell(arm,velvet,s*.03,-.13,0,.20,.25,.25,14);
  const sleeve=r.ringDrape(arm,velvet,[[-.75,.18,1],[-.47,.20,1],[-.08,.17,.90]],14,{waves:5,offset:s});sleeve.position.x=s*.04;
  r.torus(arm,gold,s*.04,-.65,0,.21,.023,6,22).rotation.x=Math.PI/2;
  r.ell(arm,skin,s*.07,-.79,.05,.11,.16,.10,10);
  for(let j=0;j<3;j++)r.link(arm,gold,[s*.11,-.14,.23],[s*.14,-.34-j*.073,.23],.012);
  r.oct(torso,goldDark,s*.44,2.15,.31,.12,.12,.055);
 }
 r.cyl(torso,leather,0,1.55,0,.47,.49,.13,18);
 r.box(torso,goldDark,0,1.55,.47,.18,.15,.047);r.oct(torso,ruby,0,1.57,.506,.075,.10,.04);
 // Layered shoulder mantle and chest chain
 const mantle=r.ringDrape(torso,under,[[1.97,.53,1],[2.13,.65,.82],[2.29,.46,.84]],25,{waves:9,offset:.4});
 for(const s of [-1,1]){r.path(torso,gold,[[s*.42,2.18,.26],[s*.17,2.05,.51],[0,1.89,.53]],.015,21,6);}
 r.oct(torso,gold,0,1.92,.54,.12,.16,.045);
 r.oct(torso,ruby,0,1.93,.58,.057,.10,.04);
 // Aged face with large brow ridge, visible nose and layered white-gray hair
 r.ell(head,skin,0,.12,.06,.32,.44,.31,23,true);
 r.ell(head,skinShadow,0,-.20,.18,.19,.11,.18,12);
 r.ell(head,skin,0,.045,.345,.090,.16,.12,12);
 r.ell(head,skinShadow,0,-.005,.461,.085,.045,.036,10);
 for(const s of [-1,1]){
  r.ell(head,skin,s*.29,.04,.025,.075,.12,.08,10);
  r.ell(head,under,s*.142,.165,.340,.075,.033,.02,12);
  r.ell(head,eye,s*.142,.16,.355,.035,.035,.015,10);
  r.ell(head,hairDark,s*.142,.245,.323,.111,.037,.025,10);
  r.path(head,hairDark,[[s*.06,-.19,.313],[s*.16,-.20,.31],[s*.235,-.18,.255]],.010);
  r.ell(head,hair,s*.24,-.18,-.02,.085,.25,.13,10);
 }
 r.ell(head,hair,0,.38,-.09,.31,.22,.26,16);
 for(let i=0;i<9;i++){
  const xx=-.26+i*.065;
  const lock=r.ell(head,i%3===0?hairDark:hair,xx,.32,.18,.054,.13,.055,9);lock.rotation.z=(i-4)*-.06;
 }
 const beard=r.grp(head,0,-.29,.21);
 r.cone(beard,hair,0,-.17,.08,0,.22,.48,15).rotation.z=Math.PI;
 for(const s of [-1,1]){
  r.cone(beard,hair,s*.13,-.17,.04,0,.105,.35,10).rotation.z=Math.PI+s*.12;
  r.ell(beard,hair,s*.095,.06,.12,.14,.075,.07,12).rotation.z=s*.17;
 }
 const crown=r.grp(head,0,.56,0);
 r.cyl(crown,goldDark,0,0,0,.32,.34,.12,20);r.torus(crown,gold,0,.07,0,.32,.025,6,24).rotation.x=Math.PI/2;
 for(let i=0;i<7;i++){
  const angle=i*Math.PI*2/7;x(crown,angle);
 }
 function x(parent,angle){
  const xx=.31*Math.sin(angle),zz=.31*Math.cos(angle);
  r.cone(parent,gold,xx,.13,zz,0,.055,.19,7);r.oct(parent,ruby,xx,.11,zz,.038,.063,.027);
 }
 r.oct(crown,ruby,0,.12,.335,.09,.105,.04);
 // Old king with no weapon; gestures read as sadness and acceptance
 function update(t,dt=0,mode='idle'){
  const walk=mode==='walk',wind=mode==='windup',attack=mode==='attack',hurt=mode==='hurt',dead=mode==='dead';
  torso.position.y=.013*Math.sin(t*1.5)+(walk?.025*Math.abs(Math.sin(t*5)):0)-(dead?.65:0);
  torso.rotation.z=hurt?.12:0;torso.rotation.x=wind?-.10:attack?-.12:.035;
  head.rotation.x=wind?-.22:attack?-.07:.10+.028*Math.sin(t*.71);
  head.rotation.y=.05*Math.sin(t*.55);
  legs[0].rotation.x=walk?.27*Math.sin(t*5):0;legs[1].rotation.x=-legs[0].rotation.x;
  arms[0].rotation.x=walk?.18*Math.sin(t*5):wind?-.2:attack?-.65:0;
  arms[1].rotation.x=walk?-.18*Math.sin(t*5):wind?-.20:attack?-.75:0;
  arms[0].rotation.z=wind?.22:attack?.34:.10;
  arms[1].rotation.z=wind?-.22:attack?-.34:-.10;
  backCape.rotation.x=.045*Math.sin(t*1.25)+(walk?.07:0);
  beard.rotation.x=.028*Math.sin(t*1.1);
  torso.scale.y=dead?.58:1;
 }
 update(0);return finish(r,update,{body,torso,head,arms,legs,crown,beard,backCape,mantle});
}
