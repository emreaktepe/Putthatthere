// KÖKEN: Emre'nin kendi hazırladığı "Aldemir 3D Pro v02" paketinden (js/aldemir.js) kopyalandı; kodla üretilmiş prosedürel model,
// harici varlık/ağ yok, yalnızca 'three' (oyunun importmap'indeki r185, MIT) gerekir. Paket klasörü repoya girmez (.gitignore).
// Oyun içi değişiklikler: yok (ham kopya). Performans düzenlemesi ve entegrasyon js/render/aldemir-pro.js içindedir.
import * as THREE from 'three';

/**
 * ALDEMIR — Büyücünün Gecesi
 * Standalone procedural 3D character, no remote assets, no external geometry loader.
 * Units: y-up, forward +Z, ground at y=0. Character height ≈4.1.
 * API: const model=createAldemir(); scene.add(model.group); model.update(seconds,delta,mode);
 * Designed as a premium detailed procedural prototype, not a sculpted/rigged production GLB.
 */
export function createAldemir({ scale=1, spellColor=0xa456ff } = {}) {
  const P = {
    ink:0x130b25, midnight:0x211339, purple:0x38216c, royal:0x50308f, bright:0x6541a8,
    violet:0x8850db, gold:0xd9a95a, goldLight:0xffda88, antique:0x936536,
    cream:0xe4d7c9, hair:0xb9b1ba, hairLight:0xf0e7de, hairDark:0x807b88,
    skin:0xc88f72, skinLight:0xe3ab87, leather:0x51311f, leatherLite:0x82563b,
    wood:0x4f3029, metal:0x9c8b8b
  };
  const root=new THREE.Group(); root.name='Aldemir_Procedural_Pro'; root.scale.setScalar(scale);
  const actor=new THREE.Group(); root.add(actor);
  const moving=new THREE.Group(); actor.add(moving);
  const dynamic={}; const extra=[];

  const mat=(color,roughness=.76,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const clothTex = makeClothTexture();
  const robe = new THREE.MeshStandardMaterial({color:P.royal,map:clothTex,roughness:.96,side:THREE.DoubleSide});
  const robeBright = mat(P.bright,.92), robeDark=mat(P.midnight,.98), robeMid=mat(P.purple,.94);
  const lining=mat(P.ink,.99), gold=mat(P.gold,.36,.72), goldHi=mat(P.goldLight,.29,.70), oldGold=mat(P.antique,.45,.66);
  const skin=mat(P.skin,.83), skinLit=mat(P.skinLight,.84), lip=mat(0xa66b65,.93);
  const gray=mat(P.hair,.97), pale=mat(P.hairLight,.96), shadowHair=mat(P.hairDark,.98);
  const leather=mat(P.leather,.82), leatherLite=mat(P.leatherLite,.8), black=mat(0x100a13,.86);
  const wood=mat(P.wood,.9), woodLight=mat(0x815540,.89);
  const crystalMat=new THREE.MeshPhysicalMaterial({color:0xa775ff,metalness:.08,roughness:.16,emissive:spellColor,emissiveIntensity:.8,transparent:true,opacity:.96,clearcoat:1,clearcoatRoughness:.08,flatShading:true});
  const crystalCore=new THREE.MeshBasicMaterial({color:0xe5baff,transparent:true,opacity:.78});
  const sparkMat=new THREE.MeshBasicMaterial({color:0xb879ff,blending:THREE.AdditiveBlending,transparent:true,opacity:.82,depthWrite:false});
  const glowTexture=makeGlowTexture();
  const glowMat=new THREE.SpriteMaterial({map:glowTexture,color:spellColor,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.78});

  const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
  function mesh(parent,geo,material,x=0,y=0,z=0,shadow=true){
    const obj=new THREE.Mesh(geo,material);obj.position.set(x,y,z);obj.castShadow=shadow;obj.receiveShadow=shadow;
    parent.add(obj);return obj;
  }
  function group(parent,x=0,y=0,z=0){const obj=new THREE.Group();obj.position.set(x,y,z);parent.add(obj);return obj;}
  function ball(parent,r,material,x=0,y=0,z=0,seg=20){return mesh(parent,new THREE.SphereGeometry(r,seg,Math.max(10,seg>>1)),material,x,y,z);}
  function ellipsoid(parent,xyz,rad,material,seg=20){const b=ball(parent,1,material,...xyz,seg);b.scale.set(...rad);return b;}
  function cylinder(parent,rt,rb,h,material,x=0,y=0,z=0,n=24){return mesh(parent,new THREE.CylinderGeometry(rt,rb,h,n),material,x,y,z);}
  function torus(parent,rr,thick,material,x=0,y=0,z=0,tube=7,seg=48){return mesh(parent,new THREE.TorusGeometry(rr,thick,tube,seg),material,x,y,z);}
  function box(parent,wx,hy,dz,material,x=0,y=0,z=0){return mesh(parent,new THREE.BoxGeometry(wx,hy,dz),material,x,y,z);}
  function path(parent,pts,r,material,segments=36){
    const curve=new THREE.CatmullRomCurve3(pts.map(a=>Array.isArray(a)?v(...a):a));
    return mesh(parent,new THREE.TubeGeometry(curve,segments,r,6,false),material);
  }
  function taperedPath(parent,points,radii,material,steps=40,sides=9){
    const curve=new THREE.CatmullRomCurve3(points.map(q=>Array.isArray(q)?v(...q):q));
    const frames=curve.computeFrenetFrames(steps,false);const vertices=[],normals=[],uvs=[],idx=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,pt=curve.getPointAt(t);const u=t*(radii.length-1);const j=Math.min(radii.length-2,Math.floor(u));const lerp=u-j;
      const r=radii[j]*(1-lerp)+radii[j+1]*lerp;
      for(let k=0;k<=sides;k++){
        const th=k/sides*Math.PI*2, off=frames.normals[i].clone().multiplyScalar(Math.cos(th)).addScaledVector(frames.binormals[i],Math.sin(th));
        const p=pt.clone().addScaledVector(off,r);vertices.push(p.x,p.y,p.z);normals.push(off.x,off.y,off.z);uvs.push(k/sides,t);
      }
    }
    for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){
      const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,b,a+1,b,b+1,a+1);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(idx);
    return mesh(parent,geo,material);
  }
  function ribbon(parent, points, width, material){
    const vertex=[],ind=[],uv=[];const a=points.map(p=>v(...p));
    for(let i=0;i<a.length;i++){
      const tangent=a[Math.min(i+1,a.length-1)].clone().sub(a[Math.max(i-1,0)]).normalize();
      const side=v(0,0,1).cross(tangent).normalize().multiplyScalar(width*.5);
      const l=a[i].clone().add(side),r=a[i].clone().sub(side);
      vertex.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,i/(a.length-1),1,i/(a.length-1));
      if(i<a.length-1){const n=i*2;ind.push(n,n+2,n+1,n+1,n+2,n+3);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertex,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return mesh(parent,g,material);
  }
  function diamond(parent,r,material,x,y,z,rot=0){
    const m=mesh(parent,new THREE.OctahedronGeometry(r,0),material,x,y,z);m.rotation.z=rot;return m;
  }
  function star(parent,r,material,x,y,z,points=8){
    const s=new THREE.Shape();for(let i=0;i<points*2;i++){
      const ang=i*Math.PI/points-Math.PI/2,rr=i%2?r*.35:r;
      const px=Math.cos(ang)*rr,py=Math.sin(ang)*rr;if(!i)s.moveTo(px,py);else s.lineTo(px,py);
    }s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelThickness:.007,bevelSize:.006,bevelSegments:1,steps:1});return mesh(parent,g,material,x,y,z);
  }
  function band(parent,rr,y,material,r=.015,ellipse=1,rotation=0){
    const pts=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;pts.push([rr*Math.cos(a),y,rr*ellipse*Math.sin(a)]);}const m=path(parent,pts,r,material,80);m.rotation.y=rotation;return m;
  }

  // ---- BOOTS, TROUSERS & LOWER LAYER --------------------------------------
  const legs=[];
  for(const sign of [-1,1]){
    const leg=group(moving,sign*.265,.66,0);legs.push(leg);
    ellipsoid(leg,[0,-.19,.015],[.158,.45,.17],robeDark);
    cylinder(leg,.175,.208,.54,leather,0,-.31,.04,14);
    const boot=ellipsoid(leg,[0,-.545,.15],[.22,.156,.345],black,18);
    ellipsoid(leg,[0,-.555,.29],[.22,.12,.23],leather,18);
    for(let k=0;k<2;k++){
      const strap=torus(leg,.186,.017,oldGold,0,-.17-k*.105,.047);strap.rotation.x=Math.PI/2;
    }
    cylinder(leg,.224,.228,.053,black,0,-.638,.115,16);
  }

  // ---- ROBE: multi-ring sculpt with pleats and panel breaks --------------
  function garmentGeometry(rings,n=60,phase=0){
    const xyz=[],uv=[],indices=[];
    for(let i=0;i<rings.length;i++){
      const [h,rad]=rings[i];const w=Math.max(0,(1.98-h)/1.93);
      for(let j=0;j<=n;j++){
        const angle=j/n*Math.PI*2;
        const folds=(.025*Math.sin(10*angle+phase)+.016*Math.sin(19*angle+phase*.6))*(.4+w*.8);
        const rr=rad+folds;
        xyz.push(Math.cos(angle)*rr,h,Math.sin(angle)*rr*.89);uv.push(j/n,i/(rings.length-1)*2.3);
      }
    }
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){
      const a=i*(n+1)+j,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
  }
  mesh(moving,garmentGeometry([[.16,.66],[.2,.69],[.31,.69],[.52,.62],[.78,.53],[1.06,.44],[1.28,.39],[1.48,.41],[1.71,.46],[1.91,.40]],64,.7),robe);
  mesh(moving,garmentGeometry([[.105,.68],[.16,.73],[.235,.75],[.3,.71]],64,1.3),robeDark);
  // Wavy hem piping and multiple embroidered seams
  for(let i=0;i<2;i++){
    const pts=[];for(let j=0;j<=90;j++){const a=j/90*2*Math.PI;const rr=.72-(i*.047)+.012*Math.sin(a*10);pts.push([Math.cos(a)*rr,.187+i*.08+.009*Math.sin(a*10),Math.sin(a)*rr*.89]);}
    path(moving,pts,i?.0075:.014,i?oldGold:goldHi,100);
  }
  for(const theta of [-1.15,-.60,-.05,.52,1.02]){
    const pts=[];for(let i=0;i<=22;i++){const t=i/22,h=.28+t*.89,rad=.71*(1-t)+.435*t;
      pts.push([rad*Math.sin(theta+.035*Math.sin(t*4)),h,rad*Math.cos(theta+.035*Math.sin(t*4))*.89+.018]);
    }path(moving,pts,.0075,oldGold,25);
  }
  // Wide over-robe front panel with hanging pointed center, gold border
  const front=group(moving,0,0,0);
  const panelPts=[[-.36,1.48,.40],[-.35,1.0,.485],[-.325,.47,.66],[-.30,.22,.71],[0,.135,.725],[.30,.22,.71],[.325,.47,.66],[.35,1.0,.485],[.36,1.48,.4]];
  const verts=[],ind=[];panelPts.forEach(p=>verts.push(...p));verts.push(0,.90,.575);const ctr=panelPts.length;
  for(let i=0;i<panelPts.length-1;i++)ind.push(i,i+1,ctr);
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));pg.setIndex(ind);pg.computeVertexNormals();
  mesh(front,pg,robeMid);
  path(front,panelPts,.024,gold,64);
  for(const s of [-1,1])path(front,[[s*.20,.36,.724],[s*.22,.73,.65],[s*.19,1.1,.52],[s*.16,1.37,.46]],.008,oldGold,32);
  for(let i=0;i<4;i++){star(front,.047,i%2?gold:oldGold,0,.34+i*.24,.735-i*.067,8);}
  // embroidered little speckles and tiny stars on skirt
  for(let k=0;k<34;k++){
    const ang=(k/34)*Math.PI*2,rad=.675-(k%3)*.046;
    if(k%3===0){const dot=ball(moving,.012,gold,Math.sin(ang)*rad,.28+(k%5)*.10,Math.cos(ang)*rad*.89,8);dot.castShadow=false;}
  }

  // ---- TORSO and layered tunic --------------------------------------------
  const torso=ellipsoid(moving,[0,1.68,0],[.45,.46,.31],robeMid);
  cylinder(moving,.39,.38,.19,robeDark,0,1.42,0,24);
  // leather diagonal satchel strap across chest (visible front)
  path(moving,[[-.31,1.99,.30],[-.18,1.84,.38],[-.02,1.68,.39],[.16,1.52,.38],[.34,1.31,.24]],.045,leatherLite,45);
  path(moving,[[-.31,1.99,.34],[-.18,1.84,.418],[-.02,1.68,.43],[.16,1.52,.40],[.34,1.31,.28]],.008,gold,45);

  // ---- CAPE sculpted mesh behind the body ---------------------------------
  const capePivot=group(moving,0,2.01,-.25); dynamic.capePivot=capePivot;
  function capeGeometry(){
    const segX=28,segY=25,positions=[],uv=[],index=[];
    for(let y=0;y<=segY;y++){
      const t=y/segY;const W=.53+1.02*t;const drop=-1.83*t;
      for(let x=0;x<=segX;x++){
        const u=x/segX*2-1;const px=u*W*(1+.06*Math.sin(t*6));
        const py=drop+.032*Math.sin(u*Math.PI*6+t*3)*(t*t)+.10*Math.abs(u)*t;
        const pz=-.06-.18*t-.12*t*Math.pow(Math.abs(u),1.5)+.072*Math.cos(u*9+t*3)*t;
        positions.push(px,py,pz);uv.push(x/segX,t);
      }
    }
    for(let y=0;y<segY;y++)for(let x=0;x<segX;x++){
      const a=y*(segX+1)+x,b=a+segX+1;index.push(a,a+1,b,a+1,b+1,b);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
  }
  mesh(capePivot,capeGeometry(),robeDark);
  for(const s of [-1,1]){
    const edge=[];for(let i=0;i<=24;i++){
      const t=i/24,W=.53+1.02*t;
      edge.push([s*W*(1+.06*Math.sin(t*6)),-1.83*t+.10*t-.02,-.06-.18*t-.12*t-.04]);
    }path(capePivot,edge,.021,gold,40);
  }
  const capHem=[];for(let i=0;i<=30;i++){
    const u=i/30*2-1;
    capHem.push([u*1.55*(1+.06*Math.sin(6)), -1.83+.10*Math.abs(u)+.032*Math.sin(u*6*Math.PI+3),-.24-.12*Math.pow(Math.abs(u),1.5)+.072*Math.cos(u*9+3)]);
  }path(capePivot,capHem,.024,oldGold,60);
  // Embroidery on cape BACK: golden crescent, star and constellation trail
  const capLogo=group(capePivot,0,-1.05,-.385);
  const moonPts=[];for(let i=0;i<=22;i++){
    const a=(.25+i/22*1.6)*Math.PI;moonPts.push([.0+.19*Math.sin(a), .08+.23*Math.cos(a),-.005]);
  }
  const m1=path(capLogo,moonPts,.018,goldHi,35);
  star(capLogo,.105,goldHi,.06,-.08,-.02,8);
  for(const q of [[-.3,.35],[-.22,-.27],[.32,-.22],[.25,.3]])star(capLogo,.026,goldHi,q[0],q[1],-.004,4);

  // ---- SHOULDERS, SCARF, ARMS ----------------------------------------------
  const scarf=group(moving,0,1.95,0);
  ellipsoid(scarf,[0,0,.01],[.51,.17,.36],robeBright);
  ellipsoid(scarf,[0,-.11,.13],[.46,.13,.37],robeDark);
  for(const s of [-1,1]){
    const shoulder=ellipsoid(moving,[s*.44,1.91,-.02],[.32,.20,.28],robeBright);
    // shoulder trim and stitching
    const trim=path(moving,[[s*.39,2.08,.19],[s*.57,2.06,.17],[s*.69,1.97,.08],[s*.72,1.88,.04]],.023,gold,25);
  }
  // Brooch insignia, on left shoulder and center buckle
  const brooch=torus(moving,.115,.019,goldHi,-.43,2.05,.26,8,38);brooch.scale.y=1.03;
  star(moving,.075,goldHi,-.43,2.05,.28,8);
  ball(moving,.025,crystalMat,-.43,2.05,.297,12);

  const arms={};
  for(const s of [-1,1]){
    const ap=group(moving,s*.49,1.9,.015);arms[s===-1?'left':'right']=ap;
    ap.rotation.z=s*.11;
    const sleeve=cylinder(ap,.185,.26,.68,robe,0,-.37,0,20);
    ellipsoid(ap,[0,-.09,0],[.22,.19,.22],robeBright);
    // segmented cuff + golden ring
    cylinder(ap,.272,.264,.115,robeDark,0,-.686,0,24);
    band(ap,.268,-.705,gold,.016,1);
    band(ap,.26,-.634,oldGold,.013,1);
    const hand=ellipsoid(ap,[0,-.83,.04],[.127,.18,.122],s===1?leather:skin,16);
    for(let n=0;n<3;n++){
      taperedPath(ap,[[(-.055+n*.055),-.93,.10],[(-.08+n*.08),-1.02,.12]], [.034,.018],s===1?leather:skin,8,6);
    }
    // metal forearm ornaments
    for(let k=0;k<3;k++)star(ap,.023,goldHi, s*.18,-.27-k*.13,.15,4);
  }
  // Default spell hand will reach outward. Staff on character's right side (camera left-to-right).
  const right=arms.right;right.rotation.x=-.1;right.rotation.z=-.10;
  const left=arms.left;left.rotation.x=-.23;left.rotation.z=.32;

  // ---- SATCHEL, BELT, BUCKLE, LITTLE BOOK, POTION -------------------------
  const beltY=1.32;
  band(moving,.405,beltY,leather,.066,.78);
  band(moving,.405,beltY+.045,oldGold,.011,.78);
  band(moving,.405,beltY-.045,oldGold,.011,.78);
  const buckle=box(moving,.24,.20,.09,gold,0,beltY,.345);buckle.rotation.z=Math.PI/4;
  const darkCenter=box(moving,.142,.116,.10,leather,0,beltY,.395);darkCenter.rotation.z=Math.PI/4;
  star(moving,.066,goldHi,0,beltY,.468,8);
  const pouch=group(moving,-.435,1.16,.18);pouch.rotation.z=-.17;
  box(pouch,.31,.38,.17,leatherLite,0,0,.0);
  box(pouch,.315,.115,.20,leather,0,.145,.015);
  path(pouch,[[-.17,.12,.116],[0,.105,.12],[.17,.12,.116]],.014,oldGold,16);
  box(pouch,.057,.09,.03,goldHi,0,.11,.128);
  for(const s of [-1,1]){path(pouch,[[s*.13,-.07,.095],[s*.13,.06,.095]],.011,oldGold,10);}
  // spellbook on opposite waist
  const book=group(moving,.435,1.11,.06);book.rotation.z=.11;
  box(book,.23,.33,.11,leather,-.015,-.04,.035);
  box(book,.235,.34,.017,leatherLite,-.015,-.04,.095);
  box(book,.25,.32,.038,gold,0,-.045,-.029);
  box(book,.21,.315,.05,leather,-.025,-.039,-.068);
  star(book,.078,goldHi,-.015,-.016,.112,8);
  for(let k=-1;k<=1;k++)path(book,[[k*.05-.02,-.17,.112],[k*.05-.02,-.12,.113]],.004,oldGold,8);
  // tiny hanging potion
  const potion=group(moving,.54,.82,.32);
  ball(potion,.095,new THREE.MeshPhysicalMaterial({color:0x8c5eff,transparent:true,opacity:.81,roughness:.14,metalness:.05}),0,0,0,18);
  cylinder(potion,.036,.042,.1,oldGold,0,.124,0,14);
  band(potion,.058,.09,gold,.012,1);
  const chain=[];for(let i=0;i<8;i++)chain.push([.41+i*.017,1.14-i*.034,.34]);path(moving,chain,.012,gold,18);

  // ---- FACE: sculpted cartoon-realistic, eyelids, pupils, wrinkles --------
  const head=group(moving,0,2.245,.10); dynamic.head=head;
  ellipsoid(head,[0,.14,.00],[.316,.383,.286],skin,28);
  ellipsoid(head,[0,-.08,.115],[.276,.265,.256],skin,24);
  // ears
  for(const s of [-1,1]){
    ellipsoid(head,[s*.31,.038,.015],[.077,.12,.055],skin);
    ellipsoid(head,[s*.323,.035,.051],[.039,.071,.022],skinLit,16);
  }
  // prominent bridge + nose tip
  ellipsoid(head,[0,.072,.30],[.087,.155,.10],skin);
  ellipsoid(head,[0,-.042,.365],[.106,.073,.11],skinLit,18);
  for(const s of [-1,1])ellipsoid(head,[s*.069,-.086,.395],[.042,.031,.029],skin);
  // eyes, sclera, iris, pupils, catchlights, upper / lower lids and brows
  for(const s of [-1,1]){
    ellipsoid(head,[s*.144,.195,.264],[.102,.065,.049],mat(0xf3dfc5,.3),18);
    ellipsoid(head,[s*.144,.191,.314],[.046,.052,.019],mat(0x96734f,.33),20);
    ellipsoid(head,[s*.143,.19,.333],[.023,.036,.010],black,16);
    ball(head,.012,mat(0xffffff,.1),s*.128,.211,.343,12);
    path(head,[[s*.054,.218,.292],[s*.13,.257,.321],[s*.22,.236,.268]],.020,skinLit,20);
    path(head,[[s*.066,.137,.29],[s*.141,.118,.312],[s*.221,.148,.27]],.012,skin,20);
    path(head,[[s*.052,.334,.287],[s*.124,.354,.298],[s*.220,.314,.236]],.036,shadowHair,22);
    for(let t=0;t<2;t++)path(head,[[s*.24,.17-t*.05,.242],[s*.285,.15-t*.05,.207],[s*.313,.14-t*.048,.17]],.006,skinLit,12);
  }
  // facial folds, mouth under beard
  path(head,[[-.10,-.105,.336],[0,-.136,.360],[.10,-.105,.336]],.007,lip,20);
  for(const s of [-1,1]){
    path(head,[[s*.105,-.095,.349],[s*.17,-.14,.285],[s*.18,-.20,.26]],.008,mat(0xaf7765,.9),15);
    path(head,[[s*.085,.42,.233],[s*.15,.434,.215],[s*.22,.405,.17]],.008,skinLit,12);
  }
  // side swept hair volume, hair locks, high quality beard strands
  ellipsoid(head,[0,.42,-.1],[.317,.18,.252],shadowHair);
  for(const s of [-1,1]){
    ellipsoid(head,[s*.27,.15,-.06],[.15,.30,.19],gray,18);
    for(let i=0;i<7;i++){
      const x=s*(.225+i*.015),z=.02-i*.034;
      taperedPath(head,[[x,.41,z],[x+s*.055,.21,z+.02],[x+s*.052,-.01,z+.045],[x+s*.045,-.25-(i%3)*.032,z+.08]],
        [.034,.05,.042,.004],[shadowHair,gray,pale][i%3],27,7);
    }
  }
  // Beard underlying sculpted masses; many thick taper strands create natural layered geometry
  ellipsoid(head,[0,-.297,.165],[.275,.31,.227],gray,24);
  const beardRoot=group(head,0,0,0); dynamic.beardRoot=beardRoot;
  for(let row=0;row<3;row++)for(let k=-4;k<=4;k++){
    const x=k*.053+(row%2)*.016;
    const y=-.14-row*.095;
    const z=.294-row*.036-.17*Math.abs(x);
    const length=.26 + (1-Math.abs(k)/5)*.18 + row*.060;
    const shade=(k+row+12)%5;
    taperedPath(beardRoot,[[x,y,z],[x*.98,y-length*.28,z+.08],[x*.92+Math.sin(k*3+row)*.018,y-length*.68,z+.055],
      [x*.88+Math.sin(k*2+row)*.04,y-length,z+.02]],
      [.072-row*.007,.070-row*.004,.049,.002],shade===0?shadowHair:shade===1?pale:gray,21,7);
  }
  // Strong chin pointed main lock
  taperedPath(beardRoot,[[0,-.23,.34],[0,-.48,.40],[.01,-.69,.34],[-.018,-.87,.26]], [.12,.133,.087,.004],pale,30,11);
  // braided moustache and curls
  for(const s of [-1,1]){
    taperedPath(beardRoot,[[s*.008,-.095,.396],[s*.105,-.099,.398],[s*.18,-.137,.370],[s*.23,-.107,.342]],
      [.072,.071,.047,.002],pale,24,8);
    for(let i=0;i<3;i++){
      taperedPath(beardRoot,[[s*(.15+i*.04),-.30+i*.045,.32],[s*(.23+i*.028),-.41+i*.04,.29],
        [s*(.255+i*.024),-.54+i*.03,.25]], [.06,.046,.002],i===1?pale:gray,18,7);
    }
  }

  // ---- MULTI-STAGE CURVED WIZARD HAT --------------------------------------
  const hat=group(head,0,.505,-.015);dynamic.hat=hat;
  // brim: elliptical two-sided broad brim with rolled golden edge
  function brimGeo(){
    const pos=[],uv=[],ix=[],r=32;
    for(let ring=0;ring<=4;ring++)for(let j=0;j<=r;j++){
      const a=j/r*Math.PI*2,radius=.35+ring*.093;
      pos.push(radius*Math.cos(a),.03*Math.sin(a*3)+.027*Math.cos(a*5)+.025*ring/4,radius*.84*Math.sin(a));uv.push(j/r,ring/4);
    }
    for(let i=0;i<4;i++)for(let j=0;j<r;j++){
      const a=i*(r+1)+j,b=a+r+1;ix.push(a,a+1,b,a+1,b+1,b);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
  }
  mesh(hat,brimGeo(),robeDark);
  const brimEdge=[];for(let i=0;i<=80;i++){
    const a=i/80*2*Math.PI;
    brimEdge.push([.725*Math.cos(a),.03*Math.sin(a*3)+.027*Math.cos(a*5)+.025,.725*.84*Math.sin(a)]);
  }path(hat,brimEdge,.017,gold,80);
  // bent pointed hat with fluted sculpted silhouette
  function hatShape(){
    const rings=21,slices=28,p=[],uv=[],idx=[];
    for(let i=0;i<=rings;i++){
      const t=i/rings;const rr=.385*Math.pow(1-t,.83)+.015;
      const yy=.04+t*1.00;
      const xx=-.02-.10*t-.31*t*t+.05*Math.sin(t*4.1);
      const zz=-.01+.045*Math.sin(t*4);
      for(let j=0;j<=slices;j++){
        const a=j/slices*2*Math.PI;
        const folds=1+.048*Math.sin(a*7+t*6)+.02*Math.sin(a*13+t*2);
        p.push(xx+rr*folds*Math.cos(a),yy,zz+rr*.9*folds*Math.sin(a));uv.push(j/slices,t);
      }
    }
    for(let i=0;i<rings;i++)for(let j=0;j<slices;j++){
      const a=i*(slices+1)+j,b=a+slices+1;idx.push(a,b,a+1,b,b+1,a+1);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  mesh(hat,hatShape(),robe);
  band(hat,.39,.18,goldHi,.050,.87);
  band(hat,.395,.23,oldGold,.009,.87);
  // front embossed celestial hat medallion
  const hatBadge=group(hat,0,.195,.354);
  torus(hatBadge,.104,.020,goldHi,0,0,.012,8,34);
  star(hatBadge,.076,goldHi,0,0,.03,5);
  for(const s of [-1,1])star(hat,.026,gold,s*.23,.20,.25,4);
  // bent tip tassel
  path(hat,[[-.41,1.04,.005],[-.50,1.10,.015],[-.55,1.00,.065]],.017,gold,13);
  star(hat,.046,goldHi,-.55,.985,.078,4);

  // ---- ORNAMENTAL STAFF, BARK, CRYSTAL CAGE ------------------------------
  const staff=group(moving,.78,.16,.28);dynamic.staff=staff;
  staff.rotation.z=-.035;
  const staffPoints=[[0,0,0],[.02,.32,-.02],[-.03,.69,.02],[.06,1.04,-.025],[-.015,1.38,.015],
    [.055,1.70,-.018],[-.055,2.04,.02],[.06,2.36,-.02],[-.03,2.71,.01],[.025,3.09,0],[0,3.35,0]];
  taperedPath(staff,staffPoints,[.068,.075,.082,.07,.082,.09,.080,.087,.09,.103,.078],wood,85,12);
  // spiral grain wraps organically around wood shaft, and thin bark seams
  for(let s=0;s<3;s++){
    const pts=[];for(let i=0;i<=110;i++){
      const t=i/110,y=t*3.25;const a=t*Math.PI*11 + s*Math.PI*2/3;
      pts.push([.08*Math.cos(a)+Math.sin(y*6)*.012,y,.074*Math.sin(a)]);
    }path(staff,pts,s===0?.011:.007,s===0?woodLight:leather,105);
  }
  // lower ferrule
  cylinder(staff,.082,.075,.15,oldGold,0,.045,0,12);
  diamond(staff,.08,gold,0,-.04,0);
  // head fork claws holding magic gem
  for(let i=0;i<5;i++){
    const a=i/5*Math.PI*2;
    const r=.21;
    taperedPath(staff,[[.09*Math.cos(a),3.06,.09*Math.sin(a)],
      [.20*Math.cos(a),3.36,.20*Math.sin(a)],[r*Math.cos(a),3.63,r*Math.sin(a)],
      [.11*Math.cos(a),3.77,.11*Math.sin(a)]],[.065,.060,.034,.004],i%2?wood:woodLight,32,8);
    path(staff,[[.18*Math.cos(a),3.47,.18*Math.sin(a)],[.19*Math.cos(a),3.56,.19*Math.sin(a)]],.014,gold,10);
  }
  // big faceted violet crystal (double pyramidal prism)
  function gemGeometry(){
    const ns=8,r=.22,low=3.42,top=3.85,tip=4.06,p=[],idx=[];
    const topPt=[0,tip,0],bottomPt=[0,3.28,0];
    for(let i=0;i<ns;i++){
      const a=i/ns*2*Math.PI,an=(i+1)%ns/ns*2*Math.PI;
      const A=[r*Math.cos(a),top,r*Math.sin(a)],B=[r*Math.cos(an),top,r*Math.sin(an)];
      const D=[r*.8*Math.cos(a),low,r*.8*Math.sin(a)],E=[r*.8*Math.cos(an),low,r*.8*Math.sin(an)];
      // flat faceted triangles with separate normals
      for(const tri of [[topPt,A,B],[A,D,B],[B,D,E],[D,bottomPt,E]]){
        const base=p.length/3;for(const vert of tri)p.push(...vert);idx.push(base,base+1,base+2);
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const gem=mesh(staff,gemGeometry(),crystalMat);dynamic.crystal=gem;
  diamond(staff,.11,crystalCore,0,3.69,0).scale.set(.7,1.5,.7);
  const gemEdges=new THREE.LineSegments(new THREE.EdgesGeometry(gem.geometry,18),new THREE.LineBasicMaterial({color:0xffd6ff,transparent:true,opacity:.3}));staff.add(gemEdges);
  const staffGlow=new THREE.Sprite(glowMat);staffGlow.position.set(0,3.69,0);staffGlow.scale.set(1.18,1.18,1);staff.add(staffGlow);dynamic.glow=staffGlow;
  const staffLight=new THREE.PointLight(spellColor,2.9,3.7,2);staffLight.position.set(0,3.69,0);staff.add(staffLight);dynamic.staffLight=staffLight;
  // decorative sparks around the crystal orbit, only a dozen small objects
  const sparks=group(staff,0,3.68,0); dynamic.sparks=sparks;
  for(let i=0;i<16;i++){
    const p=diamond(sparks,.012+(i%4)*.007,sparkMat,0,0,0);p.castShadow=false;
    p.userData.theta=i*Math.PI*2/16;p.userData.height=(i%7-3)*.072;p.userData.radius=.27+(i%3)*.05;extra.push(p);
  }
  // interlocking knuckle silver wrap where Aldemir grips staff
  for(let i=0;i<3;i++)band(staff,.099,1.36+i*.095,oldGold,.013,1);

  // ---- GROUND SHADOW decal (optional) --------------------------------------
  const groundShadow=new THREE.Mesh(new THREE.CircleGeometry(.88,48),new THREE.MeshBasicMaterial({color:0x070415,transparent:true,opacity:.17,depthWrite:false}));
  groundShadow.rotation.x=-Math.PI/2;groundShadow.position.y=.016;groundShadow.castShadow=false;root.add(groundShadow);

  function setSpellColor(hex){
    const c=new THREE.Color(hex);crystalMat.emissive.copy(c);crystalMat.color.copy(c).lerp(new THREE.Color(0xffffff),.24);
    staffLight.color.copy(c);glowMat.color.copy(c);sparkMat.color.copy(c);
  }
  let lastCast=0;
  function update(time,delta=0,mode='idle'){
    const movingMode=mode==='walk',casting=mode==='cast',salute=mode==='salute';
    const wt=time*7.4,breath=Math.sin(time*1.55);
    moving.position.y=movingMode?Math.abs(Math.sin(wt))*.075:breath*.018;
    moving.rotation.y=movingMode?Math.sin(wt*.5)*.028:Math.sin(time*.36)*.022;
    moving.rotation.z=movingMode?Math.sin(wt)*.029:Math.sin(time*.58)*.006;
    legs[0].rotation.x=movingMode?Math.sin(wt)*.30:0;
    legs[1].rotation.x=movingMode?-Math.sin(wt)*.30:0;
    left.rotation.x=movingMode?Math.sin(wt)*.38:-.23;
    left.rotation.z=casting? .70:salute? .53:.32;
    right.rotation.x=casting?-.68+Math.sin(time*12)*.07:(movingMode?-Math.sin(wt)*.19:-.10);
    right.rotation.z=casting?-.18:-.10;
    capePivot.rotation.x=(movingMode?.17:.04)+Math.sin(time*2.2)*.044;
    capePivot.rotation.z=Math.sin(time*1.33)*.015;
    head.rotation.y=Math.sin(time*.55)*.035;head.rotation.x=casting?-.065:Math.sin(time*.9)*.018;
    beardRoot.rotation.x=breath*.019;
    hat.rotation.z=Math.sin(time*1.7)*.010;
    staff.rotation.x=casting?-.14+Math.sin(time*10)*.025:Math.sin(time*1.32)*.012;
    staff.rotation.z=casting?-.14:-.035;
    staffLight.intensity=2.7 + Math.sin(time*7.2)*.33 + (casting?1.4:0);
    crystalMat.emissiveIntensity=.88+Math.sin(time*3.4)*.23+(casting?.8:0);
    staffGlow.material.opacity=.66+Math.sin(time*3.3)*.08+(casting?.20:0);
    staffGlow.scale.setScalar((1.18+Math.sin(time*2.9)*.12+(casting?.28:0)));
    sparks.rotation.y=time*.55;
    extra.forEach((s,i)=>{
      const a=s.userData.theta+time*(i%2? .55:-.65),r=s.userData.radius;
      s.position.set(Math.cos(a)*r,s.userData.height+Math.sin(time*1.8+i)*.03,Math.sin(a)*r);
      s.rotation.set(time*(.6+i*.05),a,time*.4);
    });
  }
  update(0,0,'idle');
  root.userData.update=update;
  root.userData.setSpellColor=setSpellColor;
  root.userData.metadata={name:'Aldemir',type:'Procedural 3D',forward:'+Z',units:'meters (approximate)',height:4.2};
  return {group:root,update,setSpellColor,parts:{actor,moving,head,hat,beardRoot,capePivot,staff,crystal:gem,arms,legs}};
}

function makeClothTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d');ctx.fillStyle='#cbbde9';ctx.fillRect(0,0,256,256);
  let seed=13143;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const img=ctx.getImageData(0,0,256,256);for(let i=0;i<img.data.length;i+=4){
    const n=(rnd()-.5)*40;img.data[i]=Math.max(0,Math.min(255,img.data[i]+n));
    img.data[i+1]=Math.max(0,Math.min(255,img.data[i+1]+n));img.data[i+2]=Math.max(0,Math.min(255,img.data[i+2]+n));
  }ctx.putImageData(img,0,0);
  ctx.strokeStyle='rgba(68,42,91,.13)';ctx.lineWidth=.7;
  for(let x=0;x<256;x+=3){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,.11)';for(let y=0;y<256;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,2);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
function makeGlowTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
  const grad=ctx.createRadialGradient(64,64,0,64,64,64);
  grad.addColorStop(0,'rgba(255,255,255,.95)');grad.addColorStop(.16,'rgba(240,190,255,.63)');
  grad.addColorStop(.43,'rgba(180,95,255,.18)');grad.addColorStop(1,'rgba(115,45,255,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
