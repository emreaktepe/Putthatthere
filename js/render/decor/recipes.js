// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/recipes.js); içerik değiştirilmeden kopyalandı.
// 37 purpose-designed stylized-fantasy geometry recipes. No scene lights or network assets.
// Geometry originates at the ground; palette grouped into one merged geometry per material.
export function buildRecipe(id,v,b){
 const k=(a)=>a, f=[.83,1,1.18][v];
 const branch=(key,a,z,r)=>b.segment(key,a,z,r,r*.62,5);
 const pillar=(x,z,h=.8,r=.22,mat='stone')=>{b.cyl(mat,x,h/2,z,r*.85,r,h,7);b.box('stoneDark',x,.09,z,r*2.6,.18,r*2.6)};
 const broken=(x,y,z,w=.4)=>b.ico('stone',x,y,z,w,w*.64,w*.92);
 switch(id){
 case 'pine': {
  let H=[4.8,4.0,5.65][v];b.cyl('bark',0,H*.31,0,.13,.23,H*.62,7);b.cyl('barkDark',0,.21,0,.29,.36,.4,7);
  for(let i=0;i<4;i++){let r=(1.45-i*.23)*f;let yy=1.3+i*.80;b.cone(i%2?'pineLight':'pine',Math.sin(i)*.08,yy,Math.cos(i)*.07,r,1.78,7,i*.16)}
  for(let j=0;j<3;j++){const a=j*2.1;b.segment('twigs',[0,.25,0],[Math.cos(a)*.43,.12,Math.sin(a)*.43],.07,.04)}
  return {height:H,footprint:1.75*f};}
 case 'dead-tree':{
  const h=[4.3,3.4,4.9][v];b.segment('barkDark',[0,.08,0],[.08,h*.68,.04],.32,.2,7);
  b.segment('wood',[.08,h*.68,.04],[.28,h,.10],.18,.06,6);
  for(let i=0;i<5;i++){let a=i*2.399+v,h0=h*(.35+(i%3)*.13);let p=[.08,h0,.03], q=[Math.cos(a)*(1.0+(.15*i)),h0+.37+(.11*(i%2)),Math.sin(a)*(.85+i*.07)];
   branch('bark',p,q,.12);branch('twigs',q,[q[0]*1.25,q[1]+.45,q[2]*1.13],.065)}
  b.sphere('moss',-.22,.32,.12,.31,.13,.25,7,4);return {height:h,footprint:1.9};}
 case 'rock':{
  for(let i=0;i<4;i++){let x=(i%2-.5)*.75,z=(Math.floor(i/2)-.5)*.65,r=(.43+i*.07)*f;b.ico(i%3?'rock':'rockLight',x,r*.55,z,r,r*.81,r*.9)}
  return {height:1.12*f,footprint:1.35*f};}
 case 'grass-tuft':{
  for(let i=0;i<5;i++){let a=i*1.23;let x=Math.cos(a)*.13,z=Math.sin(a)*.13;b.cone(i%2?'grass':'mossLight',x,.23+(i%2)*.07,z,.1,.50+i*.06,3,a)}
  return {height:.68,footprint:.4,castShadow:false};}
 case 'mushroom-glow':{
  for(let i=0;i<2;i++){let x=(i-1)*.34,z=(i%2)*.16,H=.3+i*.18;b.cyl('bone',x,H/2,z,.055,.075,H,6);b.sphere('mushroom',x,H+.07,z,.26,.125,.25,6,3);
    b.ico('mushroomLight',x-.07,H+.15,z+.075,.055,.024,.05)}
  return {height:.7,footprint:.7,glow:{color:0x2fe08a,y:.58,size:1.35},castShadow:false};}
 case 'log':{
  b.segment('bark',[-1,.25,0],[1,.34,.05],.33,.35,8);b.cyl('wood',-1,.25,0,.30,.3,.055,8,Math.PI/2);
  b.segment('barkDark',[-.45,.34,0],[-.17,.85,-.55],.14,.07,6);
  b.sphere('moss',.5,.56,.03,.48,.11,.18,8,4);return {height:.9,footprint:1.4};}
 case 'stalactite':{
  for(let i=0;i<3;i++){let x=(i-1)*.55,z=(i%2)*.24,H=[2,2.8,3.5][v]*(1-i*.14);b.cone(i===1?'stoneLight':'stone',x,H/2,z,.34+i*.08,H,6,.18*i)}
  return {height:[2,2.8,3.5][v],footprint:1.05};}
 case 'cave-crystal':{
  b.ico('rock',0,.15,0,.85,.24,.64);
  for(let i=0;i<5;i++){let a=i*2.4,R=.28+(i%2)*.18,H=[1.2,1.6,2.0][v]*(.60+((i*7)%5)*.12);
   b.shard(i%2?'crystalBlue':'runeCyan',Math.cos(a)*R,.17,Math.sin(a)*R,.20+i*.022,H,5,(i-2)*.09)}
  return {height:2.35,footprint:1.12,glow:{color:0x66b8ff,y:1.05,size:2.6}};}
 case 'puddle':{
  b.sphere('water',0,.035,0,1.15*f,.027,.77*f,12,4);
  b.ring('runeCyan',.35,.055,-.12,.30,.27,14);
  return {height:.09,footprint:1.32*f,castShadow:false};}
 case 'column':{
  let H=[3.9,2.6,4.45][v];b.box('stoneDark',0,.19,0,1.18,.38,1.18);
  b.cyl('stone',0,H/2,0,.47,.51,H-.55,10);
  for(let j=0;j<7;j++){let a=j*Math.PI*2/7, x=Math.cos(a)*.45,z=Math.sin(a)*.45;
   b.segment('stoneLight',[x,.45,z],[x*.98,H-.28,z*.98],.049,.049,4)}
  b.box('stoneLight',0,H-.21,0,1.24,.31,1.24);b.box('stoneDark',0,H-.42,0,1.02,.13,1.02);
  return {height:H,footprint:.92};}
 case 'arch':{
  const H=4.25, W=3.4;
  for(let sign of [-1,1]){let x=sign*W/2;b.box('stoneDark',x,.12,0,.75,.24,.96);
    b.box('stone',x,1.5,0,.64,2.85,.72);b.box('stoneLight',x,2.95,0,.92,.28,.90)}
  for(let i=0;i<7;i++){let theta=Math.PI-i*Math.PI/6;let x=Math.cos(theta)*1.52,y=2.8+Math.sin(theta)*1.15;
   b.box(i%2?'stone':'stoneLight',x,y,0,.76,.50,.86,theta-Math.PI/2)}
  if(v===1)b.box('stoneDark',.7,3.7,.27,.52,.17,.55,-.38);
  return {height:H,footprint:2.3};}
 case 'rubble':{
  for(let i=0;i<6;i++){let a=i*2.399,rad=(i%3)*.29+.2;
    b.ico(i%2?'stone':'stoneDark',Math.cos(a)*rad,.13+i*.035,Math.sin(a)*rad,.23+i*.028,.2+i*.03,.26+i*.024)}
  return {height:.56,footprint:1.05};}
 case 'rune-banner':{
  b.box('stoneDark',0,.12,0,1.22,.25,.54);b.box('stone',0,1.15,0,.89,2.14,.4);
  b.box('stoneLight',0,2.33,0,1.0,.22,.48);
  for(let j=0;j<4;j++)b.box('rune',0,1.63-j*.36,.215,j%2?.48:.17,.047,.035,j%2?.18:-.29);
  return {height:2.45,footprint:.72,glow:{color:0xffa044,y:1.55,size:1.3}};}
 case 'gravestone':{
  let H=[1.55,1.75,1.94][v];b.box('stoneDark',0,.095,0,.89,.19,.45);
  if(v===1){b.box('stone',0,.75,0,.7,1.3,.29);b.sphere('stoneLight',0,1.39,0,.35,.31,.18,10,6)}
  else if(v===2){b.box('stone',0,.82,0,.32,1.48,.29);b.box('stoneLight',0,1.32,0,.78,.31,.30)}
  else{b.box('stone',0,.80,0,.83,1.37,.32);b.box('stoneLight',0,1.53,0,.70,.15,.31)}
  b.box('stoneDark',-.12,.80,.18,.35,.045,.027);
  b.sphere('moss',.22,.22,.14,.18,.045,.14,6,3);return {height:H,footprint:.56};}
 case 'grave-mound':{
  b.sphere('dirt',0,.17,0,1.1,.3,.65,10,4);
  for(let i=0;i<4;i++){let x=(i-1.5)*.46,z=(i%2)*.2;b.ico('rock',x,.28,z,.15,.13,.12)}
  return {height:.45,footprint:1.12,castShadow:false};}
 case 'iron-fence':{
  for(let i=0;i<5;i++){let x=(i-2)*.85;
    b.cyl('iron',x,.97,0,.053,.07,1.93,5);b.cone('ironLight',x,2.0,0,.09,.30,5)}
  for(let y of [.54,1.34])b.box('iron',0,y,0,4.05,.075,.10);
  b.box('stoneDark',-1.8,.2,0,.35,.38,.35);b.box('stoneDark',1.8,.2,0,.35,.38,.35);
  return {height:2.25,footprint:2.12};}
 case 'lamp-post':{
  b.cyl('iron',0,1.7,0,.065,.095,3.4,7);b.box('ironLight',0,3.4,0,.53,.13,.53);
  for(let x of [-.21,.21])for(let z of [-.21,.21])b.segment('iron',[x,3.42,z],[x*.72,4.09,z*.72],.025,.025,4);
  b.cone('iron',0,4.14,0,.36,.32,5);b.sphere('goldLight',0,3.75,0,.23,.25,.23,8,5);
  return {height:4.3,footprint:.5,glow:{color:0xffcc77,y:3.75,size:2.6}};}
 case 'crypt':{
  b.box('stoneDark',0,.2,0,3.1,.42,2.5);
  b.box('stone',0,1.7,0,2.75,2.64,2.22);
  b.box('stoneDark',0,1.48,1.12,.92,1.8,.06);
  b.box('iron',0,1.35,1.17,.67,1.45,.04);
  b.cone('stoneLight',0,3.53,0,2.2,1.58,4,Math.PI/4);
  for(let x of [-1.05,1.05])b.cyl('stoneLight',x,1.53,1.19,.13,.14,2.5,6);
  return {height:4.35,footprint:2.25};}
 case 'ice-spike':{
  for(let i=0;i<5;i++){let a=i*2.4,R=(i%2?.32:.55),H=([2.1,2.7,3.6][v])*(i===0?1:.48+.07*(i%3));
   b.shard(i%2?'iceShadow':'ice',Math.cos(a)*R,.02,Math.sin(a)*R,.26+i*.03,H,5,(i-2)*.11)}
  return {height:[2.1,2.7,3.6][v],footprint:1.04,glow:{color:0x9ee8ff,y:1.25,size:2.2}};}
 case 'snow-mound':{
  for(let i=0;i<4;i++)b.sphere(i%2?'snowDark':'snow',(i%2-.5)*.72,.18+(.06*i),((i>>1)-.5)*.45,.60,.32,.45,6,3);
  return {height:.48,footprint:1.36,castShadow:false};}
 case 'frozen-bridge':{
  const H=2.4;for(let x of [-1.55,1.55]){b.box('iceShadow',x,1.0,0,.4,2,.5);b.box('stoneDark',x,.2,0,.73,.4,.75)}
  for(let i=0;i<5;i++){let x=-1.4+i*.7,y=1.55+Math.sin(i*Math.PI/4)*.55;b.box(i%2?'ice':'stoneLight',x,y,0,.78,.37,.80,i*.15-.30)}
  b.box('ice',0,1.46,-.31,3.5,.10,.15);
  return {height:H,footprint:2.25};}
 case 'burnt-house':{
  const w=[3.4,2.9,3.8][v],h=[3,2.5,3.4][v];
  for(let x of [-w/2,w/2])for(let z of [-w/2,w/2])b.box('charcoal',x,h*.51,z,.23,h,.23);
  for(let z of [-w/2,w/2]){branch('wood',[-w/2,h,z],[0,h*1.32,z],.14);branch('wood',[0,h*1.32,z],[w/2,h,z],.14)}
  for(let j=0;j<3;j++){let z=-w/2+j*w/2,bend=(j-1)*.3;b.box('charcoal',-w/2,.48,z,.17,.8,w*.45);b.box('ash',w/2,.38,z,.18,.56,w*.38)}
  b.box('wood',0,.15,-w/2,.86,.25,.25);b.box('ember',.8,.09,.9,.10,.04,.12);
  return {height:h*1.33,footprint:w};}
 case 'well':{
  for(let i=0;i<10;i++){let a=i*Math.PI/5;b.box(i%2?'stoneDark':'stone',Math.cos(a)*.85,.45,Math.sin(a)*.85,.56,.82,.36,a)}
  for(let x of [-.88,.88])b.segment('wood',[x,.7,0],[x,2.5,0],.1,.09,6);
  b.segment('wood',[-1,2.43,0],[1,2.43,0],.12,.12,6);
  b.cyl('wood',0,2.30,0,.15,.15,.40,8,Math.PI/2);
  return {height:2.66,footprint:1.4};}
 case 'bonfire':{
  for(let i=0;i<5;i++){let a=i*Math.PI*2/5;b.segment('wood',[Math.cos(a)*.72,.16,Math.sin(a)*.7],[-Math.cos(a)*.35,.34,-Math.sin(a)*.4],.17,.14,4)}
  for(let i=0;i<3;i++)b.ico(i%2?'ember':'charcoal',(i-1)*.26,.3,.06,.24,.20,.21);
  return {height:.62,footprint:1.07,glow:{color:0xff7a2a,y:.7,size:2.1},castShadow:false};}
 case 'charred-stump':{
  b.cyl('charcoal',0,.52,0,.46,.58,1.04,7);b.cyl('ash',0,1.04,0,.38,.39,.09,7);
  for(let i=0;i<4;i++){let a=i*Math.PI/2;b.segment('ember',[Math.cos(a)*.28,.08,Math.sin(a)*.28],[Math.cos(a)*.32,.78,Math.sin(a)*.32],.025,.02,4)}
  return {height:1.13,footprint:.62};}
 case 'big-crystal':{
  b.ico('stoneDark',0,.15,0,1.05,.22,.98);
  for(let i=0;i<7;i++){let a=i*2.4,R=.25+.11*(i%3),h=[2.6,3.4,4.1][v]*(i===0?1:.35+.10*(i%5));
    b.shard(i%3?'crystal':'crystalLight',Math.cos(a)*R,.17,Math.sin(a)*R,.18+(i%3)*.055,h,5,(i-3)*.08)}
  return {height:[2.6,3.4,4.1][v],footprint:1.6,glow:{color:0xc58cff,y:1.8,size:3.6}};}
 case 'crystal-shard':{
  b.shard('crystalLight',0,.06,0,.27,[.9,1.2,1.6][v],5,.1);b.ico('crystal',.19,.1,.09,.22,.23,.21);
  return {height:1.66,footprint:.5,glow:{color:0xb993ee,y:.8,size:1.7}};}
 case 'crystal-pillar':{
  b.ico('stoneDark',0,.17,0,1.2,.28,1.18);
  b.shard('crystal',0,.20,0,.66,5.8,6,.02);
  for(let i=0;i<5;i++){let a=i*Math.PI*2/5;b.shard('crystalLight',Math.cos(a)*.7,.17,Math.sin(a)*.7,.21,2.6,5,i*.08)}
  b.ring('rune',0,2.35,0,1.25,1.20,16);return {height:6.0,footprint:1.54,glow:{color:0xb18aff,y:4,size:5}};}
 case 'bone-pile':{
  b.sphere('boneDark',0,.15,0,.7,.22,.6,8,5);
  for(let i=0;i<4;i++){let a=i*2.4;b.segment('bone',[Math.cos(a)*.65,.25,Math.sin(a)*.65],[-Math.cos(a)*.55,.38,-Math.sin(a)*.50],.09,.1,6)}
  b.sphere('boneLight',-.1,.47,.10,.32,.3,.32,8,5);b.box('bone',-.1,.29,.36,.39,.18,.24);
  for(let x of [-.23,.03])b.sphere('boneDark',x,.50,.37,.075,.075,.04,6,4);
  return {height:.80,footprint:1.08};}
 case 'rib-arch':{
  for(let side of [-1,1]){
   for(let i=0;i<5;i++){let a=i*Math.PI/8,h=.4+i*.65;b.segment(i%2?'bone':'boneDark',[side*(2.05-i*.22),h,0],[side*(1.4-i*.25),h+.5,0],.12,.085,6)}
   b.segment('boneLight',[side*2.06,.1,0],[side*.25,3.95,0],.15,.13,7);
  }
  b.ico('boneDark',0,4.1,0,.36,.35,.30);return {height:4.5,footprint:2.4};}
 case 'bone-tower':{
  b.cyl('stoneDark',0,.24,0,1.65,1.8,.48,10);
  b.cyl('boneDark',0,3.3,0,1.05,1.3,6.1,10);
  for(let y=1.0;y<=6.0;y+=.9)for(let j=0;j<8;j++){let a=j*Math.PI/4,x=Math.cos(a)*1.15,z=Math.sin(a)*1.15;
   b.segment('bone',[x,y,z],[Math.cos(a+.23)*1.2,y+.60,Math.sin(a+.23)*1.20],.11,.09,5)}
  for(let j=0;j<7;j++){let a=j*Math.PI*2/7;b.cone('boneLight',Math.cos(a)*1.08,6.8,Math.sin(a)*1.08,.21,1.3,5)}
  b.cone('stoneDark',0,7.6,0,1.3,2.2,8);
  b.ico('runeRed',0,5.75,1.03,.29,.44,.10);
  return {height:8.72,footprint:2.0,glow:{color:0xff3b3b,y:5.8,size:4.4}};}
 case 'castle-pillar':{
  let H=[4.7,3.7,5.2][v];b.box('stoneDark',0,.22,0,1.40,.44,1.40);
  b.box('stone',0,H*.47,0,.86,H-.9,.86);
  for(let a=0;a<4;a++){let x=Math.cos(a*Math.PI/2)*.51,z=Math.sin(a*Math.PI/2)*.51;
   b.segment('stoneLight',[x,.5,z],[x*.9,H-.4,z*.9],.085,.085,4)}
  b.box('stoneLight',0,H-.3,0,1.22,.38,1.22);
  b.cone('stoneDark',0,H+.2,0,.69,.8,4,Math.PI/4);
  return {height:H+.58,footprint:1.12};}
 case 'castle-banner':{
  b.box('gold',0,3.6,0,1.65,.13,.10);
  for(let i=0;i<5;i++){let x=(i-2)*.31,bottom= i%2?1.0:.80;
   b.box('crimson',x,2.13+(bottom-1)*.5,.02,.31,2.7+(1-bottom),.048)}
  b.box('crimsonLight',0,3.44,.08,1.58,.14,.045);
  b.box('gold',0,2.25,.07,.15,1.12,.06);
  return {height:3.75,footprint:.95,castShadow:false};}
 case 'castle-window':{
  b.box('stoneDark',0,1.8,-.15,1.65,3.5,.30);
  b.box('glass',0,1.8,.035,1.20,2.67,.045);
  b.cone('glassGold',0,3.36,.04,.79,1.2,3,Math.PI/2);
  b.box('gold',0,1.73,.09,.065,2.98,.055);
  for(let y of [1.1,1.75,2.4])b.box('iron',0,y,.085,1.33,.053,.07);
  b.cone('stone',0,3.90,-.08,1.1,1.2,3,Math.PI/2);
  return {height:4.48,footprint:1.1,castShadow:false,glow:{color:0xa064d3,y:2.3,size:2.8}};}
 case 'shadow-heart':{
  b.ico('charcoal',0,1.85,0,.91,1.35,.83,1);
  b.ico('runeRed',0,1.83,.70,.30,.72,.11);
  for(let i=0;i<6;i++){let a=i*Math.PI/3;b.segment('runeRed',[Math.cos(a)*.3,1.5+Math.sin(a)*.5,.7],[Math.cos(a+.7)*.62,1.6+Math.sin(a+.9)*.75,.56],.035,.025,4)}
  b.ring('gold',0,.15,0,1.12,1.07,14);return {height:3.3,footprint:1.2,castShadow:false,glow:{color:0xff3a5a,y:2.0,size:4.2}};}
 case 'throne':{
  b.box('stoneDark',0,.18,0,3.35,.36,2.3);
  b.box('crimson',0,.78,0,1.65,.36,1.29);b.box('stone',0,2.32,-.51,2.12,3.5,.48);
  for(let x of [-1.03,1.03]){b.box('stoneDark',x,1.36,0,.45,2.1,.58);b.cone('gold',x,3.65,-.51,.22,.83,5)}
  b.cone('stone',0,4.32,-.51,.69,1.25,5);
  b.box('gold',0,1.79,-.245,.07,2.28,.035);
  return {height:4.97,footprint:2.1};}
 case 'taskin-statue':{
  b.box('stoneDark',0,.17,0,1.6,.34,1.3);
  b.box('stone',0,.85,0,1.15,1.22,.78);
  b.box('stoneLight',0,1.73,.02,.91,.62,.70);
  for(let x of [-.73,.73])b.box('stone',x,.83,.02,.50,.84,.53);
  b.ico('rune',0,1.73,.39,.10,.14,.06);b.sphere('moss',-.24,1.5,.37,.30,.10,.15,7,4);
  return {height:2.12,footprint:1.28};}
 default:throw Error('Unknown decor recipe: '+id);
 }
}
