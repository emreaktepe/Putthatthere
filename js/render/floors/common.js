// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/floors/common.js); içerik değiştirilmeden kopyalandı.
// Deterministic grayscale art direction for nine 28x28-m arena floor kinds.
// No Math.random or network. ctx canvas dims = size x size. Center remains calm.
function gray(g,a=1){const n=Math.max(90,Math.min(255,Math.round(g)));return `rgba(${n},${n},${n},${a})`;}
function stroke(ctx,color,w,a,b,c,d){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();}
export function paintFloorKind(kind,ctx,size,rand){
 const s=size/512; const W=size;const R=rand;
 ctx.fillStyle=gray(188);ctx.fillRect(0,0,W,W);
 // Broad, subtle mottling all across the stage.
 for(let i=0;i<540;i++){
  const x=R()*W,y=R()*W,edge=Math.min(1,Math.hypot(x-W/2,y-W/2)/(W*.63));
  const rr=(2+R()*25)*s, val=141+R()*89, opacity=(.05+.14*edge)*R();
  ctx.fillStyle=gray(val,opacity);ctx.beginPath();ctx.ellipse(x,y,rr*(.6+R()),rr*(.25+R()),R()*6.28,0,6.283);ctx.fill();
 }
 const coord=()=>[R()*W,R()*W];
 if(kind==='grass'||kind==='dirt'){
  for(let i=0;i<(kind==='grass'?1250:450);i++){
    const [x,y]=coord();const fade=.2+.8*Math.min(1,Math.hypot(x-W/2,y-W/2)/(W*.65));
    const len=(1.4+R()*5)*s;stroke(ctx,gray(R()>.6?218:116,.15*fade),.9*s,x,y,x+(R()-.5)*2*s,y-len);
  }
  if(kind==='grass')for(let i=0;i<58;i++){const [x,y]=coord();ctx.fillStyle=gray(128,.14);ctx.beginPath();ctx.ellipse(x,y,(9+R()*27)*s,(4+R()*12)*s,R()*6.28,0,6.283);ctx.fill();}
 }
 if(kind==='wet'||kind==='flag'||kind==='tile'){
  const tiles=kind==='tile'?8:kind==='flag'?13:11, step=W/tiles;
  ctx.lineWidth=(kind==='wet'?1:1.5)*s;ctx.strokeStyle=gray(kind==='tile'?130:117,.27);
  for(let y=0;y<tiles;y++)for(let x=0;x<tiles;x++){
    const jitter=kind==='tile'?0:step*.10;
    ctx.strokeRect(x*step+(R()-.5)*jitter,y*step+(R()-.5)*jitter,step-1.5*s,step-1.5*s);
    if(kind==='wet'&&R()<.26){ctx.fillStyle=gray(226,.14);ctx.beginPath();ctx.ellipse((x+.5)*step,(y+.6)*step,step*.38,step*.10,-.2,0,6.283);ctx.fill();}
  }
  if(kind==='tile')for(let y=0;y<tiles;y++)for(let x=0;x<tiles;x++)if((x+y)%2){ctx.fillStyle=gray(124,.09);ctx.fillRect(x*step,y*step,step,step);}
 }
 if(kind==='snow')for(let i=0;i<105;i++){
   const [x,y]=coord();stroke(ctx,gray(R()>.5?246:139,.18),(1+R()*2)*s,x,y,x+W*.06*(.25+R()),y-W*.004);
 }
 if(kind==='ash'||kind==='bone'||kind==='dirt'||kind==='wet'){
  for(let i=0;i<(kind==='ash'?190:95);i++){
    const [x,y]=coord();const L=(3+R()*21)*s;
    stroke(ctx,gray(kind==='ash'?108:122,(.10+.16*R())),(0.6+R()*.8)*s,x,y,x+L,y+(R()-.5)*L*.65);
    if(kind==='ash'&&i%9===0)stroke(ctx,gray(239,.26),1*s,x,y,x+L*.7,y+2*s);
  }
 }
 if(kind==='facet')for(let i=0;i<300;i++){
  const [x,y]=coord();const r=(7+R()*20)*s;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*(.6+R()*.3),y+r*.3);ctx.lineTo(x-r*.8,y+r*.8);ctx.closePath();ctx.fillStyle=gray(R()>.5?215:147,.11);ctx.fill();ctx.strokeStyle=gray(218,.16);ctx.lineWidth=.8*s;ctx.stroke();
 }
 // Soft center vignette over busy features, preserve neutral average luminance.
 const grad=ctx.createRadialGradient(W/2,W/2,W*.10,W/2,W/2,W*.72);
 grad.addColorStop(0,gray(189,.15));grad.addColorStop(.6,gray(189,.075));grad.addColorStop(1,gray(189,0));
 ctx.fillStyle=grad;ctx.fillRect(0,0,W,W);
}
export function seededRandom(seed=12345){let x=seed>>>0;return function(){x+=0x6D2B79F5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
