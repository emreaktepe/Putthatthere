// Köken: Emre'nin "Büyücünün Gecesi Core6 Pro v1" 3B model paketi (js/render/models/common.js), değiştirilmeden alındı.
// Sözleşme: docs/icerik/3d-model-listesi.md. Oyuna bağlanma: js/render/enemies.js (düşmanlar), js/render/wizard.js (Pırıl).
import * as THREE from 'three';

// Procedural geometry catalog. Primitive geometries are shared among character instances.
// Scene / material resources are owned by the respective model instance.
const shapes = new Map();
const geometry = (key,make)=>{ if(!shapes.has(key))shapes.set(key,make());return shapes.get(key);};
const v3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const axial = new THREE.Vector3(0,1,0);
const TMP_COLOR = new THREE.Color();
let glowTexture;
export function glowMap(){
  if(glowTexture)return glowTexture;
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,1,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.19,'rgba(255,255,255,.72)');g.addColorStop(.54,'rgba(255,255,255,.17)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);glowTexture=new THREE.CanvasTexture(c);return glowTexture;
}
export function createRig(name, {scale=1,color=null}={}){
  const group=new THREE.Group();group.name=name;group.scale.setScalar(scale);
  const actor=new THREE.Group();group.add(actor);
  const ownMaterials=new Set(),ownGeometry=new Set(),tintMats=[];
  const materials={};
  function mat(name,hex, {rough=.78,metal=0,glow=0,alpha=1,side=THREE.FrontSide, basic=false, tint=true}={}){
    let m;
    if(basic)m=new THREE.MeshBasicMaterial({color:hex,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1,side});
    else m=new THREE.MeshStandardMaterial({color:hex,roughness:rough,metalness:metal,emissive:glow?hex:0x000000,emissiveIntensity:glow,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1,side,flatShading:false});
    ownMaterials.add(m);materials[name]=m;
    if(tint){ tintMats.push([m,m.color.clone()]); }
    return m;
  }
  function mesh(parent,g,m,x=0,y=0,z=0,shadow=false){
    const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=shadow;parent.add(o);return o;
  }
  function grp(parent=actor,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function sph(p,m,x,y,z,s=.2,segments=12,shadow=false){return mesh(p,geometry(`sphere_${segments}`,()=>new THREE.SphereGeometry(1,segments,Math.max(7,Math.floor(segments*.65)))),m,x,y,z,shadow).scale.setScalar(s),p.children[p.children.length-1];}
  function ell(p,m,x,y,z,rx,ry,rz,segments=12,shadow=false){const o=sph(p,m,x,y,z,1,segments,shadow);o.scale.set(rx,ry,rz);return o;}
  function box(p,m,x,y,z,w,h,d,shadow=false){return mesh(p,geometry('cube',()=>new THREE.BoxGeometry(1,1,1)),m,x,y,z,shadow).scale.set(w,h,d),p.children[p.children.length-1];}
  function cone(p,m,x,y,z,top,bottom,height,n=9,shadow=false){return mesh(p,geometry(`cone${n}`,()=>new THREE.CylinderGeometry(0,1,1,n,1)),m,x,y,z,shadow).scale.set(bottom,height,bottom),p.children[p.children.length-1];}
  function cyl(p,m,x,y,z,top,bottom,height,n=12,shadow=false){return mesh(p,geometry(`cyl_${n}_${top}_${bottom}`,()=>new THREE.CylinderGeometry(top,bottom,1,n)),m,x,y,z,shadow).scale.y=height,p.children[p.children.length-1];}
  function oct(p,m,x,y,z,rx,ry=rx,rz=rx){const o=mesh(p,geometry('oct',()=>new THREE.OctahedronGeometry(1,0)),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
  function ico(p,m,x,y,z,rx,ry=rx,rz=rx,detail=0){const o=mesh(p,geometry(`ico_${detail}`,()=>new THREE.IcosahedronGeometry(1,detail)),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
  function torus(p,m,x,y,z,r=.3,th=.025,n=9,nt=40){return mesh(p,geometry(`torus_${r}_${th}_${n}_${nt}`,()=>new THREE.TorusGeometry(r,th,n,nt)),m,x,y,z);}
  function link(p,m,a,b,thickness=.035,n=8){const start=v3(...a),end=v3(...b),mid=start.clone().add(end).multiplyScalar(.5);const dir=end.sub(start);const o=cyl(p,m,mid.x,mid.y,mid.z,1,1,dir.length(),n);o.scale.x=o.scale.z=thickness;o.quaternion.setFromUnitVectors(axial,dir.normalize());return o;}
  function path(p,m,pts,r=.03,segments=18,tubular=5){const key='tube-'+pts.map(pt=>pt.map(a=>Number(a).toFixed(3)).join(',')).join(';')+`-${r}-${segments}-${tubular}`;
    const g=geometry(key,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>v3(...v))),segments,r,tubular,false));return mesh(p,g,m);
  }
  function ringDrape(p,m,rings,sides=20,{waves=7,offset=0,front=1}={}){
    const key='drape-'+JSON.stringify(rings)+'-'+sides+'-'+waves+'-'+offset+'-'+front;
    const g=geometry(key,()=>{
      const pts=[],uv=[],ix=[];
      for(let i=0;i<rings.length;i++){
        const [y,radius,depth=1]=rings[i];for(let j=0;j<=sides;j++){
          const a=j/sides*Math.PI*2;
          const f=1+(i/(rings.length-1))*.065*Math.cos(a*waves+offset);
          pts.push(Math.cos(a)*radius*f,y+Math.sin(a*waves+offset)*.02*(i/(rings.length-1)),Math.sin(a)*radius*depth*f*front);
          uv.push(j/sides,i/(rings.length-1));
        }
      }
      for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ix.push(a,a+1,b,a+1,b+1,b);}
      const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));gg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));gg.setIndex(ix);gg.computeVertexNormals();return gg;
    });return mesh(p,g,m,0,0,0,true);
  }
  function panel(p,m,pts){const key='panel-'+pts.map(q=>q.join(',')).join('|');return mesh(p,geometry(key,()=>{const vs=[],ids=[];for(const q of pts)vs.push(...q);for(let i=1;i<pts.length-1;i++)ids.push(0,i,i+1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(ids);g.computeVertexNormals();return g;}),m);}
  function sprite(p,color,x,y,z,size=1,opacity=.55){const sm=new THREE.SpriteMaterial({map:glowMap(),color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});ownMaterials.add(sm);const s=new THREE.Sprite(sm);s.position.set(x,y,z);s.scale.set(size,size,1);p.add(s);return s;}
  function own(g){ownGeometry.add(g);return g;}
  function setTint(hex,amount=1){TMP_COLOR.set(hex);const t=Math.max(0,Math.min(1,amount));for(const [m,initial] of tintMats){m.color.copy(initial).lerp(TMP_COLOR,t);}}
  function optimize(parts={}){
    // Bake static mesh transforms into material-batched geometries while keeping
    // articulated nodes intact for procedural animation. No addon dependency.
    const protectedNodes=new Set();
    const collectPart=v=>{if(Array.isArray(v)){v.forEach(collectPart);return;}if(v?.isObject3D)protectedNodes.add(v);};
    Object.values(parts).forEach(collectPart);
    const targets=[actor,...[...protectedNodes].filter(x=>x.isGroup&&x!==actor)];
    const position=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3();
    for(const root of targets){
      const byMat=new Map(),removals=[];
      function gather(node,transform){
        for(const ch of node.children.slice()){
          if(protectedNodes.has(ch)&&ch!==root)continue;
          ch.updateMatrix();const m=transform.clone().multiply(ch.matrix);
          if(ch.isMesh){
            if(!ch.geometry?.attributes?.position)continue;
            if(!byMat.has(ch.material))byMat.set(ch.material,[]);
            byMat.get(ch.material).push({obj:ch,transform:m});removals.push(ch);
          }else if(ch.isGroup)gather(ch,m);
        }
      }
      gather(root,new THREE.Matrix4());
      for(const obj of removals)obj.parent.remove(obj);
      for(const [material,arr] of byMat){
        let count=0,anyShadow=false;
        for(const {obj} of arr){const geo=obj.geometry;count+=geo.index?geo.index.count:geo.attributes.position.count;anyShadow||=obj.castShadow;}
        const xyz=new Float32Array(count*3),nrm=new Float32Array(count*3),uv=new Float32Array(count*2);
        let cursor=0;
        for(const {obj,transform} of arr){
          const geo=obj.geometry,positions=geo.attributes.position,normals=geo.attributes.normal,uvs=geo.attributes.uv,indices=geo.index;
          nm.getNormalMatrix(transform);
          const num=indices?indices.count:positions.count;
          for(let i=0;i<num;i++){
            const idx=indices?indices.getX(i):i;
            position.fromBufferAttribute(positions,idx).applyMatrix4(transform);
            xyz.set([position.x,position.y,position.z],cursor*3);
            if(normals){normal.fromBufferAttribute(normals,idx).applyMatrix3(nm).normalize();nrm.set([normal.x,normal.y,normal.z],cursor*3);}
            else nrm.set([0,1,0],cursor*3);
            if(uvs)uv.set([uvs.getX(idx),uvs.getY(idx)],cursor*2);
            cursor++;
          }
        }
        const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(xyz,3));geo.setAttribute('normal',new THREE.BufferAttribute(nrm,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
        const newMesh=new THREE.Mesh(geo,material);newMesh.castShadow=anyShadow;newMesh.receiveShadow=true;root.add(newMesh);
      }
    }
  }
  function dispose(){group.parent?.remove(group);for(const m of ownMaterials)m.dispose();for(const g of ownGeometry)g.dispose();}
  function stats(){let triangles=0,meshes=0;group.traverse(o=>{if(o.isMesh){meshes++;const geo=o.geometry;triangles+=geo.index?Math.floor(geo.index.count/3):Math.floor(geo.attributes.position.count/3);}});return {triangles,meshes};}
  return {group,actor,materials,mat,mesh,grp,sph,ell,box,cone,cyl,oct,ico,torus,link,path,ringDrape,panel,sprite,own,setTint,optimize,dispose,stats};
}
export function finish(r,update,parts={}){
  r.optimize(parts);const stats=r.stats();r.group.userData.modelStats=stats;
  return {group:r.group,update,setTint:r.setTint,dispose:r.dispose,parts,stats};
}
