// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/instancing.js); içerik değiştirilmeden kopyalandı.
/** InstancedMesh integration helper for scenery.js (does not alter gameplay collisions).
 * placements: [{x,y,z,rotation,scale}] in world coordinates, scale is multiplier.
 * All calls to createInstancedDecor share each variant's baked geometry and material.
 */
import * as THREE from 'three';
import {createDecor} from './index.js';
export function createInstancedDecor(id,placements=[],{variant=0,color=null}={}){
 const decor=createDecor(id,{variant});const group=new THREE.Group();group.name='decor:'+id;
 const transforms=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scl=new THREE.Vector3(),tint=color===null?null:new THREE.Color(color);
 for(const part of decor.parts){
  const mesh=new THREE.InstancedMesh(part.geometry,part.material,placements.length);
  mesh.name=`${id}:${part.key}`;mesh.castShadow=decor.castShadow&&part.key==='opaque';mesh.receiveShadow=true;
  mesh.frustumCulled=false;
  for(let i=0;i<placements.length;i++){
   const p=placements[i];pos.set(p.x??0,p.y??0,p.z??0);quat.setFromAxisAngle(new THREE.Vector3(0,1,0),p.rotation??0);
   scl.setScalar(p.scale??1);transforms.compose(pos,quat,scl);mesh.setMatrixAt(i,transforms);
   if(tint && part.key==='opaque')mesh.setColorAt(i,tint);
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  group.add(mesh);
 }
 let cleared=false;
 return {group,glow:decor.glow,height:decor.height,footprint:decor.footprint,
   dispose(){if(cleared)return;cleared=true;group.parent?.remove(group);for(const mesh of group.children)mesh.dispose();decor.dispose();}
 };
}
