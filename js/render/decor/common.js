// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/common.js); içerik değiştirilmeden kopyalandı.
// Büyücünün Gecesi Environment v1 — own merge utility, THREE r185 only.
// Coordinate convention: Y up; +Z front; base center at (0,0,0).
import * as THREE from 'three';
import { buildRecipe } from './recipes.js';
const shared = new Map();
const RAD = Math.PI/180;
const PALETTE = {
 bark:['#543d4f',.95],wood:['#62424a',.9],barkDark:['#342836',.98],twigs:['#614d60',.95],
 pine:['#34445f',1],pineLight:['#476976',.98],pineDark:['#263746',1],moss:['#465d52',.94],mossLight:['#65816b',.94],
 stone:['#87849d',.95],stoneLight:['#ada4b3',.95],stoneDark:['#56566b',.98],rock:['#787787',.98], rockLight:['#9895a6',.98],
 rune:['#e3a65b',.46,'#ffb75f'],runeCyan:['#7bc7e6',.42,'#59bfea'],runeGreen:['#89e2a6',.35,'#41df8b'],
 iron:['#464355',.72],ironLight:['#898296',.68],gold:['#c99b62',.55],goldLight:['#ffdb95',.43,'#b97b38'],
 bone:['#d2cabb',.92],boneDark:['#a39a99',.97],boneLight:['#f1e4d2',.88],
 crystal:['#815ac7',.3,'#6435b6'],crystalLight:['#c4a0ff',.2,'#b88eff'],
 crystalBlue:['#6aaada',.32,'#428eea'],crystalIce:['#a5e4f6',.25,'#599fc7'],
 ice:['#aed9ec',.31],iceShadow:['#6c93ae',.44],snow:['#d4dcf1',.94],snowDark:['#9eb7c9',.98],
 mushroom:['#58a278',.7,'#358a5d'], mushroomLight:['#b1f6bd',.35,'#69d7a1'],
 ember:['#f8994c',.2,'#fb591c'],emberBright:['#ffd085',.3,'#ff912e'],charcoal:['#322a2c',.99],ash:['#60575c',.99],
 crimson:['#75304b',.91],crimsonLight:['#b8546d',.87],runeRed:['#fc657c',.32,'#ff345d'],
 glass:['#6c4a98',.42,'#3c2479'],glassGold:['#d9a255',.36,'#8e6c3b'],
 water:['#678caa',.35],dirt:['#74645c',.97],dirtLight:['#8d7c72',.98],grass:['#667b68',.91]
};
// One draw call for opaque base colours, one for emissive accents, one for water.
// Per-part material hues are baked as vertex colours before merging geometries.
const sharedMats={
 opaque:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.87,metalness:.04,flatShading:true}),
 emission:new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:false,toneMapped:false}),
 water:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.22,metalness:.16,transparent:true,opacity:.76,depthWrite:false,side:THREE.DoubleSide})
};
function material(key){return sharedMats[key];}
function surfaceType(key){return key==='water'?'water':PALETTE[key]?.[2]?'emission':'opaque';}
function bakeColor(geometry,key){const color=new THREE.Color(PALETTE[key]?.[0]??'#888888');
 const c=new Float32Array(geometry.attributes.position.count*3);
 for(let i=0;i<c.length;i+=3){c[i]=color.r;c[i+1]=color.g;c[i+2]=color.b;}
 geometry.setAttribute('color',new THREE.BufferAttribute(c,3));return geometry;}
function mergeGeos(geometries){
 const pos=[],nor=[],uv=[],colors=[]; let vertexOffset=0;
 for(const g of geometries){ const un=g.index?g.toNonIndexed():g;
 const p=un.attributes.position,n=un.attributes.normal,t=un.attributes.uv,c=un.attributes.color;
 for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n?n.getX(i):0,n?n.getY(i):1,n?n.getZ(i):0);uv.push(t?t.getX(i):0,t?t.getY(i):0);colors.push(c?c.getX(i):1,c?c.getY(i):1,c?c.getZ(i):1);}
 vertexOffset+=p.count;
 if(un!==g)un.dispose();g.dispose();
 }
 const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));result.computeBoundingSphere();return result;
}
function builder(){
 const pieces=new Map();let maxHeight=0,footprint=0;
 const push=(key,geometry,at=[0,0,0],rot=[0,0,0],scale=[1,1,1])=>{
  geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale)));
  geometry.computeVertexNormals();if(!pieces.has(key))pieces.set(key,[]);pieces.get(key).push(geometry);
  const box=geometry.boundingBox??(geometry.computeBoundingBox(),geometry.boundingBox);maxHeight=Math.max(maxHeight,box.max.y);footprint=Math.max(footprint,Math.hypot(Math.max(Math.abs(box.max.x),Math.abs(box.min.x)),Math.max(Math.abs(box.max.z),Math.abs(box.min.z))));
 };
 const api={
  box:(key,x,y,z,w,h,d,rot=0)=>push(key,new THREE.BoxGeometry(w,h,d),[x,y,z],[0,rot,0]),
  cone:(key,x,y,z,r,h,n=6,rot=0)=>push(key,new THREE.ConeGeometry(r,h,n,1),[x,y,z],[0,rot,0]),
  cyl:(key,x,y,z,r1,r2,h,n=7,rot=0)=>push(key,new THREE.CylinderGeometry(r1,r2,h,n,1),[x,y,z],[0,rot,0]),
  sphere:(key,x,y,z,rx,ry,rz,n=8,m=5)=>push(key,new THREE.SphereGeometry(1,n,m),[x,y,z],[0,0,0],[rx,ry,rz]),
  ico:(key,x,y,z,rx,ry,rz,detail=0)=>push(key,new THREE.IcosahedronGeometry(1,detail),[x,y,z],[0,0,0],[rx,ry,rz]),
  plane:(key,x,y,z,w,h,rot=0)=>push(key,new THREE.PlaneGeometry(w,h),[x,y,z],[0,rot,0]),
  ring:(key,x,y,z,outer,inner,n=12,rx=Math.PI/2)=>push(key,new THREE.RingGeometry(inner,outer,n),[x,y,z],[rx,0,0]),
  segment:(key,a,b,r1=.08,r2=r1,n=6)=>{
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(vb,va);
    const g=new THREE.CylinderGeometry(r2,r1,d.length(),n,1);
    const mid=va.clone().add(vb).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(mid,q,new THREE.Vector3(1,1,1)));g.computeVertexNormals();if(!pieces.has(key))pieces.set(key,[]);pieces.get(key).push(g);
    maxHeight=Math.max(maxHeight,a[1],b[1]);footprint=Math.max(footprint,Math.hypot(a[0],a[2])+r1,Math.hypot(b[0],b[2])+r2);
  },
  shard:(key,x,y,z,r,h,sides=5,tilt=0)=>{ // elegant pointed faceted growth from Y=0
    push(key,new THREE.CylinderGeometry(0,r,h,sides,1),[x,y+h/2,z],[tilt,0,tilt/2]);
  },
  polygon:(key,verts)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts.flat(),3));g.computeVertexNormals();push(key,g);},
  get(){return {pieces,maxHeight,footprint};}
 };return api;
}
export function createDecorFromRecipe(kind,{variant=0}={}){
 variant=Math.max(0,Math.min(2,Math.floor(Number(variant)||0)));
 const cacheKey=kind+':'+variant;
 let entry=shared.get(cacheKey);
 if(!entry){
  const b=builder();const info=buildRecipe(kind,variant,b);
  const built=b.get();const parts=[];
  const grouped=new Map();
  for(const [key, geos] of built.pieces){const grp=surfaceType(key);if(!grouped.has(grp))grouped.set(grp,[]);for(const g of geos)grouped.get(grp).push(bakeColor(g,key));}
  for(const [key,geos] of grouped)parts.push({geometry:mergeGeos(geos),material:material(key),key});
  entry={parts,height:info.height??built.maxHeight,footprint:info.footprint??built.footprint,castShadow:info.castShadow??true,glow:info.glow??null,users:0};shared.set(cacheKey,entry);
 }
 entry.users++;
 let disposed=false;
 return { parts:entry.parts, height:entry.height,footprint:entry.footprint,castShadow:entry.castShadow,glow:entry.glow,
  dispose(){if(disposed)return;disposed=true;entry.users--;if(entry.users===0){for(const p of entry.parts)p.geometry.dispose();shared.delete(cacheKey);}}
 };
}
export function getDecorStats(obj){return {triangles:obj.parts.reduce((a,p)=>a+p.geometry.attributes.position.count/3,0),materials:obj.parts.length,height:obj.height,footprint:obj.footprint};}
