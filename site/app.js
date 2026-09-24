import * as THREE from 'three';
import Lenis from './vendor/lenis.mjs';
import { RectAreaLightUniformsLib } from './vendor/RectAreaLightUniformsLib.js';

const $ = (s) => document.querySelector(s);
const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
import { profile, items, discArt } from './profile.js?v=disc-20260924';
import { initializeMotion } from './motion.js?v=motion-20260922';
import { createBookReader } from './book-reader.js';
import { works } from './works.js';
const root=$('#gallery');
let entered=!document.body.classList.contains('is-loading');
const opening={progress:0,phase:entered?'ready':'loading',start:0,resolve:null};
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
let galleryMouse=null;
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch(err){$('#error').hidden=false;throw err;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
$('#scene').appendChild(renderer.domElement);
RectAreaLightUniformsLib.init();
const scene=new THREE.Scene();
scene.fog=new THREE.Fog('#ffffff',7,14);
const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.z=4.4;
const gallery=new THREE.Group();gallery.rotation.set(-Math.PI/6,-Math.PI/6,0);gallery.scale.setScalar(1.08);scene.add(gallery);
scene.add(new THREE.AmbientLight('#ffffff',.45));
const key=new THREE.DirectionalLight('#fff9e8',1.4);key.position.set(3.5,-8,6);scene.add(key);
const fill=new THREE.DirectionalLight('#ffffff',.5);fill.position.set(-5,-2,4);scene.add(fill);
const rim=new THREE.DirectionalLight('#499ff5',.75);rim.position.set(0,3,-6);scene.add(rim);
const strip=new THREE.RectAreaLight('#ffffff',2,6,.4);strip.position.set(0,3.2,3);strip.lookAt(0,0,0);scene.add(strip);
function texture(canvas,color=true){const t=new THREE.CanvasTexture(canvas);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function canvas(size=1024){const c=document.createElement('canvas');c.width=c.height=size;return c;}
const env=canvas();env.height=512;const ec=env.getContext('2d');ec.fillStyle='#282b33';ec.fillRect(0,0,1024,512);
for(const [y,width,strength] of [[.14,.07,1],[.4,.05,.6],[.26,.08,.85],[.62,.035,.35]]){const g=ec.createLinearGradient(0,(y-width)*512,0,(y+width)*512);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${strength*.85})`);g.addColorStop(1,'rgba(255,255,255,0)');ec.fillStyle=g;ec.fillRect(0,(y-width)*512,1024,width*1024);}
const et=texture(env);et.mapping=THREE.EquirectangularReflectionMapping;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(et).texture;et.dispose();pmrem.dispose();

// A printed, lived-in face: faint ink mottling, fine grain and a few hairline scratches.
// Seeded per disc, so each one wears the same way on every visit.
function wear(ctx,seed){
  let s=(seed+1)*48271%2147483647;const rnd=()=>(s=s*16807%2147483647)/2147483647;
  const m=canvas(24),mc=m.getContext('2d'),md=mc.createImageData(24,24);
  for(let i=0;i<md.data.length;i+=4){md.data[i]=md.data[i+1]=md.data[i+2]=128+(rnd()-.5)*120;md.data[i+3]=255;}
  mc.putImageData(md,0,0);ctx.save();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.35;ctx.drawImage(m,0,0,1024,1024);ctx.restore();
  const d=ctx.getImageData(0,0,1024,1024),p=d.data;
  for(let i=0;i<p.length;i+=4){const g=(rnd()-.5)*26;p[i]+=g;p[i+1]+=g;p[i+2]+=g;}
  ctx.putImageData(d,0,0);
  ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
  for(let k=0;k<46;k++){
   const r=150+rnd()*340,a=rnd()*Math.PI*2;ctx.strokeStyle=`rgba(255,255,255,${.04+rnd()*.09})`;ctx.lineWidth=.6+rnd()*.9;ctx.beginPath();
   if(rnd()<.7)ctx.arc(512,512,r,a,a+.05+rnd()*.35);
   else{const x=512+Math.cos(a)*r,y=512+Math.sin(a)*r,b=rnd()*Math.PI,l=20+rnd()*90;ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(b)*l,y+Math.sin(b)*l);}
   ctx.stroke();}
  ctx.restore();
}
function labelTexture(item,index){
  const c=canvas(),ctx=c.getContext('2d'),t=texture(c),art=discArt[item.id];
  const plain=()=>{ctx.fillStyle=item.color;ctx.fillRect(0,0,1024,1024);
  ctx.fillStyle=item.ink;ctx.textAlign='center';ctx.font='15px Arial';ctx.letterSpacing='4px';ctx.fillText('P E R S O N A L   /   A R C H I V E',512,88);
  ctx.letterSpacing='0px';ctx.font=`${index===0?'italic ':''}${item.fontSize||120}px "Times New Roman"`;
  ctx.fillText(item.words[0],512,item.words.length>1?270:326,780);
  if(item.words.length>1){ctx.font='88px "Times New Roman"';ctx.fillText(item.words[1],512,365,720);}
  ctx.font='240px "Times New Roman"';ctx.globalAlpha=.8;ctx.fillText(String(index+1).padStart(2,'0'),512,823);ctx.globalAlpha=1;
  ctx.font='15px Arial';ctx.fillText(item.subtitle.toUpperCase()+'  /  0'+(index+1),512,917);};
  plain();
  if(!art)return t;
  // Once the still arrives the face is redrawn: cover-fit, the preview's crop, an edge shade, then white type.
  const img=new Image();img.decoding='async';
  img.onload=()=>{
   const f={pos:[.5,.5],scale:1,tx:0,ty:0,...art.frame},k=Math.max(1024/img.naturalWidth,1024/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;
   const x=512+f.scale*((1024-w)*f.pos[0]+f.tx*1024-512),y=512+f.scale*((1024-h)*f.pos[1]+f.ty*1024-512);
   ctx.clearRect(0,0,1024,1024);ctx.filter='saturate(.9) contrast(.97) sepia(.07)';ctx.drawImage(img,x,y,w*f.scale,h*f.scale);ctx.filter='none';
   const shade=ctx.createRadialGradient(512,512,0,512,512,498);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(.3,'rgba(0,0,0,0)');shade.addColorStop(.7,'rgba(0,0,0,.15)');shade.addColorStop(1,'rgba(0,0,0,.35)');
   ctx.fillStyle=shade;ctx.fillRect(0,0,1024,1024);
   ctx.fillStyle='#fff';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.62)';ctx.shadowBlur=26;ctx.shadowOffsetY=3;
   ctx.font='15px Arial';ctx.letterSpacing='4px';ctx.fillText('P E R S O N A L   /   A R C H I V E',512,88);ctx.letterSpacing='0px';
   ctx.font='italic 124px "Times New Roman"';ctx.fillText(item.words[0],512,250,800);
   ctx.font='198px "Times New Roman"';ctx.fillText(String(index+1).padStart(2,'0'),512,862);
   ctx.font='15px Arial';ctx.letterSpacing='3px';ctx.fillText(art.title.toUpperCase()+'  /  0'+(index+1),512,935);
   ctx.shadowColor='transparent';wear(ctx,index);
   t.needsUpdate=true;};
  img.src=art.src;
  return t;
}
const roughCanvas=canvas(512),rc=roughCanvas.getContext('2d'),rd=rc.createImageData(512,512);
for(let i=0;i<rd.data.length;i+=4){const n=215+Math.random()*32;rd.data[i]=rd.data[i+1]=rd.data[i+2]=n;rd.data[i+3]=255;}rc.putImageData(rd,0,0);rc.lineCap='round';for(let k=0;k<70;k++){const r=40+Math.random()*215,a=Math.random()*Math.PI*2;rc.strokeStyle=`rgba(255,255,255,${.25+Math.random()*.35})`;rc.lineWidth=.5+Math.random()*.6;rc.beginPath();rc.arc(256,256,r,a,a+.05+Math.random()*.4);rc.stroke();}const roughMap=texture(roughCanvas,false);
const radial=canvas(1024),rad=radial.getContext('2d');rad.fillStyle='#b5b5b5';rad.fillRect(0,0,1024,1024);
for(let r=75;r<512;r+=.85){rad.strokeStyle=`rgba(${Math.random()>.5?'255,255,255':'0,0,0'},.13)`;rad.lineWidth=.6;rad.beginPath();rad.arc(512,512,r,0,Math.PI*2);rad.stroke();}const radialMap=texture(radial,false);
const faceGeo=new THREE.RingGeometry(.24,.974,192);const pos=faceGeo.attributes.position,uv=faceGeo.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)*.5+.5,pos.getY(i)*.5+.5);
const edgeGeo=new THREE.LatheGeometry([new THREE.Vector2(.974,.005),new THREE.Vector2(.996,.005),new THREE.Vector2(1,.001),new THREE.Vector2(1,-.001),new THREE.Vector2(.996,-.005),new THREE.Vector2(.974,-.005)],192);edgeGeo.rotateX(Math.PI/2);
const silver=new THREE.MeshPhysicalMaterial({color:'#dae0e5',metalness:.7,roughness:.19,clearcoat:1,side:THREE.DoubleSide});
const backMat=new THREE.MeshPhysicalMaterial({color:'#333943',metalness:1,roughness:.23,roughnessMap:radialMap,bumpMap:radialMap,bumpScale:.006,clearcoat:.34,iridescence:1,iridescenceIOR:1.86,iridescenceThicknessRange:[140,900]});
const discs=items.map((item,index)=>{
 const group=new THREE.Group(),spin=new THREE.Group();group.scale.setScalar(0);group.add(spin);gallery.add(group);
 const material=new THREE.MeshPhysicalMaterial({map:labelTexture(item,index),metalness:.36,roughness:.42,roughnessMap:roughMap,bumpMap:roughMap,bumpScale:.002,clearcoat:.8,clearcoatRoughness:.15});
 const front=new THREE.Mesh(faceGeo,material);front.position.z=.0056;spin.add(front);
 const back=new THREE.Mesh(faceGeo,backMat);back.rotation.y=Math.PI;back.position.z=-.0056;spin.add(back);
 spin.add(new THREE.Mesh(edgeGeo,silver));
 for(const [a,b,c] of [[.14,.174,'#e0e3e4'],[.174,.212,'#a8afb9'],[.212,.24,'#c5cbd0']]){
  const ring=new THREE.Mesh(new THREE.RingGeometry(a,b,128),new THREE.MeshPhysicalMaterial({color:c,metalness:.3,roughness:.24,clearcoat:1,side:THREE.DoubleSide}));ring.position.z=.006;spin.add(ring);
 }
 const pick=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));pick.userData.index=index;spin.add(pick);
 const contour=new THREE.Group();group.add(contour);for(let j=0;j<3;j++){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(129*3),3));const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#171916',transparent:true,opacity:0,depthWrite:false}));line.frustumCulled=false;contour.add(line);}
 return {group,spin,front,material,pick,contour,index,target:new THREE.Vector3(),spinX:0,spinY:0,flip:0,hover:0,pushX:0,pushY:0,pushVX:0,pushVY:0,pushRX:0,pushRY:0,reset:null};
});

// Five chapters share a continuous scroll; direct selection takes a separate flight.
const total=items.length,span=total+.7,intro=$('#intro');
let width=0,height=0,mobile=false,position=0,current=0,hover=-1,lastTime=performance.now(),lastPosition=0,flow=0,down=null;
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster(),inverseGallery=gallery.quaternion.clone().invert();
const smooth=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
$('#chapters').innerHTML=items.map(item=>`<section id="${item.id}" class="chapter ${item.id}" aria-labelledby="title-${item.id}"><div class="chapter-label">${item.kicker}</div><div class="chapter-content"><h2 id="title-${item.id}" tabindex="-1">${item.heading}</h2><div class="section-copy">${item.body}</div></div></section>`).join('');
$('#about .chapter-content').insertAdjacentHTML('afterbegin','<figure class="portrait"><img src="./assets/portrait.png" alt="Olivia Zhang traveling in Yunnan" width="600" height="750"><figcaption>Traveling in Yunnan · Photo by my friend Leyao</figcaption></figure>');
let smoothScroll=reduced.matches?null:new Lenis({lerp:.09,smoothWheel:true,syncTouch:false,autoRaf:false});
const reader=createBookReader({stopScroll:()=>smoothScroll?.stop(),startScroll:()=>smoothScroll?.start(),reduced});
const motionFrame=initializeMotion(reader);
if(!entered)smoothScroll?.stop();
reduced.addEventListener('change',()=>{smoothScroll?.destroy();smoothScroll=reduced.matches?null:new Lenis({lerp:.09,smoothWheel:true,syncTouch:false,autoRaf:false});if(reader.isOpen||!entered)smoothScroll?.stop();});
const dock=new THREE.Group(),dockSpin=discs[0].spin.clone();dock.add(dockSpin);scene.add(dock);
let displayed=0,dockAngle=0,swap=null,flight=null,flightTimer=0;
const dockReturn=$('#dock-return'),dockLabel=$('#dock-label');
function setDock(index){displayed=index;dockSpin.children[0].material=discs[index].material;dockLabel.textContent=items[index].title;dockReturn.setAttribute('aria-label',items[index].title+'. Click the disc to return to the collection.');dockReturn.dataset.section=items[index].id;}
setDock(0);
function dockPose(){const halfH=Math.tan(THREE.MathUtils.degToRad(20))*4.4,unit=2*halfH/height,cx=mobile?36:width*.04+20,cy=mobile?30:34,radius=18;return {p:new THREE.Vector3((cx-width/2)*unit,(height/2-cy)*unit,0),q:new THREE.Quaternion().setFromEuler(new THREE.Euler(.12,-.18,0)),scale:radius*unit,cx,cy,radius};}
function resize(){width=document.documentElement.clientWidth;height=innerHeight;mobile=width<768;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();const projection=Math.tan(THREE.MathUtils.degToRad(20))*width/height;gallery.scale.setScalar(mobile?clamp(4.4*projection/(2.2-.5*projection),.3,.64):1.08);const d=dockPose(),hitRadius=Math.max(22,d.radius);dockReturn.style.cssText=`left:${d.cx-hitRadius}px;top:${d.cy-hitRadius}px;width:${hitRadius*2}px;height:${hitRadius*2}px;`;}
new ResizeObserver(resize).observe(document.documentElement);window.addEventListener('resize',resize);resize();
function scrollToY(y,immediate=false,duration=1.35){if(smoothScroll)smoothScroll.scrollTo(y,{duration,lerp:undefined,immediate});else window.scrollTo({top:y,behavior:'instant'});}
function navigate(index){scrollToY(intro.offsetTop+index/span*(intro.offsetHeight-height));}
function sectionY(index){const s=document.getElementById(items[index].id);return s.offsetTop+(items[index].id==='contact'?s.offsetHeight-height: -95);}
function clearFlight(){if(flight){scene.remove(flight.group);flight=null;}clearTimeout(flightTimer);dockReturn.disabled=false;document.body.classList.remove('disc-flying');}
function beginFlight(index,kind='open'){
 clearFlight();if(reduced.matches){setDock(index);return;}
 scene.updateMatrixWorld();const original=discs[index],g=new THREE.Group(),spin=original.spin.clone();spin.rotation.copy(original.spin.rotation);g.add(spin);scene.add(g);
 const startP=new THREE.Vector3(),startQ=new THREE.Quaternion(),startS=new THREE.Vector3();original.group.matrixWorld.decompose(startP,startQ,startS);
 if(kind==='return'){const pose=dockPose();startP.copy(pose.p);startQ.copy(pose.q);startS.setScalar(pose.scale);spin.rotation.set(0,0,dockAngle);}
 flight={index,kind,group:g,spin,fromP:startP,fromQ:startQ,fromScale:startS.x,fromSpin:spin.rotation.clone(),start:performance.now(),p:0,duration:1400};
 dockReturn.disabled=true;document.body.classList.add('disc-flying');
}
function openSection(index,push=true){
 if(!entered)return;
 reader.close(true);if(scrollY<intro.offsetHeight-height*.35){beginFlight(index);flightTimer=setTimeout(()=>scrollToY(sectionY(index)),reduced.matches?0:220);}else scrollToY(sectionY(index));
 if(push)history.pushState(null,'','#'+items[index].id);
}
function returnToIntro(index=0){if(!entered)return;reader.close(true);const wasReading=scrollY>intro.offsetHeight-height*.3;if(wasReading)beginFlight(index,'return');else clearFlight();navigate(index);history.pushState(null,'',location.pathname+location.search);}
dockReturn.onclick=()=>returnToIntro(displayed);
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const i=items.findIndex(d=>'#'+d.id===a.getAttribute('href'));if(i>=0){e.preventDefault();openSection(i);}else if(a.getAttribute('href')==='#top'){e.preventDefault();returnToIntro();}});
function hit(e){pointer.set(e.clientX/width*2-1,-e.clientY/height*2+1);scene.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(discs.filter(d=>d.group.visible).map(d=>d.pick),false)[0]?.object.userData.index??-1;}
root.addEventListener('pointermove',e=>{if(e.target.closest('a,button')||flight)return;galleryMouse={clientX:e.clientX,clientY:e.clientY};hover=hit(e);root.style.cursor=hover>=0?'pointer':'default';if(down&&e.pointerType==='mouse'){const d=discs[down.i];if(d){d.spinY=(e.clientX-down.x)*.005;d.spinX=(e.clientY-down.y)*.005;}}});
root.addEventListener('pointerdown',e=>{if(e.button!==0||flight||e.target.closest('a,button'))return;down={x:e.clientX,y:e.clientY,i:hit(e)};});
root.addEventListener('pointerup',e=>{const press=down;down=null;if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<7&&press.i>=0)openSection(press.i);});
root.addEventListener('pointercancel',()=>down=null);root.addEventListener('pointerleave',()=>{hover=-1;down=null;galleryMouse=null;});
root.addEventListener('keydown',e=>{if(e.target!==root)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();navigate(clamp(current+(e.key==='ArrowRight'?1:-1),0,total-1));}else if(e.key==='Enter'){e.preventDefault();openSection(current);}});
// The gallery scrolls freely, then settles like a detent: once movement stops it always comes to rest on a disc,
// leaning toward the direction of travel. Past the last disc it settles into About instead of halfway.
const inGallery=()=>entered&&!reader.isOpen&&!flight&&scrollY<intro.offsetTop+intro.offsetHeight-height;
const discStep=()=>(intro.offsetHeight-height)/span;
const discAt=()=>(scrollY-intro.offsetTop)/discStep();
let lastInput=0,travel=0,lastY=scrollY,swipe=null,snapTimer=0,snapping=0;
function settleTo(dir){
 if(!inGallery()||swipe)return;
 const at=discAt();let target=dir>0?Math.floor(at+.85):dir<0?Math.ceil(at-.85):Math.round(at);
 if(dir<0)target=Math.min(target,total-1);
 if(target>total-1){snapping=performance.now();scrollToY(sectionY(0),false,1);return;}
 target=clamp(target,0,total-1);
 if(Math.abs(at-target)<.01)return;
 snapping=performance.now();scrollToY(intro.offsetTop+target*discStep(),false,.55);
}
function queueSettle(){clearTimeout(snapTimer);snapTimer=setTimeout(()=>{if(performance.now()-lastInput>=150&&(!smoothScroll||Math.abs(smoothScroll.velocity||0)<.5))settleTo(travel);else queueSettle();},160);}
// Sideways wheel and trackpad swipes scroll the gallery too (swipe left to advance), only while it is on screen.
addEventListener('wheel',e=>{
 const sideways=!e.ctrlKey&&Math.abs(e.deltaX)>Math.abs(e.deltaY)&&inGallery();
 if(inGallery()){lastInput=performance.now();queueSettle();}
 if(smoothScroll){smoothScroll.options.gestureOrientation=sideways?'both':'vertical';return;}
 if(sideways){e.preventDefault();window.scrollBy(0,e.deltaMode===1?e.deltaX*16:e.deltaX);}
},{passive:false,capture:true});
addEventListener('scroll',()=>{
 const y=scrollY;if(y!==lastY&&performance.now()-snapping>700)travel=Math.sign(y-lastY);lastY=y;
 if(inGallery()&&performance.now()-snapping>700)queueSettle();
},{passive:true});
// Touch: vertical swipes keep the phone's own momentum and settle afterwards; sideways swipes follow the finger
// and a quick flick carries on past several discs before settling.
root.addEventListener('touchstart',e=>{if(e.touches.length!==1||!inGallery()){swipe=null;return;}const t=e.touches[0];swipe={x:t.clientX,y:t.clientY,d:0,axis:null,from:scrollY,t:performance.now(),v:0,lx:t.clientX,lt:performance.now()};},{passive:true});
root.addEventListener('touchmove',e=>{
 if(!swipe)return;const t=e.touches[0],dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;
 if(!swipe.axis){if(Math.hypot(dx,dy)<8)return;swipe.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';}
 if(swipe.axis!=='x')return;
 e.preventDefault();const now=performance.now();swipe.v=(t.clientX-swipe.lx)/Math.max(1,now-swipe.lt);swipe.lx=t.clientX;swipe.lt=now;swipe.d=dx;
 window.scrollTo(0,swipe.from-dx*1.6);
},{passive:false});
function endSwipe(){
 const s=swipe;swipe=null;if(!s)return;lastInput=performance.now();
 if(s.axis!=='x'){queueSettle();return;}
 const at=discAt(),carry=-s.v*1.6*260/discStep(),dir=Math.sign(-s.d)||0;
 let target=dir>0?Math.floor(at+carry+.85):dir<0?Math.ceil(at+carry-.85):Math.round(at);
 if(dir<0)target=Math.min(target,total-1);
 snapping=performance.now();
 if(target>total-1)scrollToY(sectionY(0),false,1);else scrollToY(intro.offsetTop+clamp(target,0,total-1)*discStep(),false,.6);
}
root.addEventListener('touchend',endSwipe);root.addEventListener('touchcancel',endSwipe);
function render(now){
 requestAnimationFrame(render);smoothScroll?.raf(now);if(document.hidden){lastTime=now;return;}const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
 const rect=root.getBoundingClientRect(),target=entered?clamp(scrollY/(intro.offsetHeight-height)*span,0,span):0;position+=(target-position)*(reduced.matches?1:1-Math.exp(-dt*9));current=clamp(Math.round(position),0,total-1);root.dataset.activeIndex=current;root.dataset.position=position.toFixed(3);
 const speed=(position-lastPosition)/Math.max(dt,.001);lastPosition=position;flow+=(speed-flow)*(1-Math.exp(-dt*7));const lean=reduced.matches?0:clamp(flow*.04,-.3,.3);
 gallery.visible=(!entered||rect.bottom>Math.max(110,height*.2))&&!reader.isOpen;gallery.position.y=(!entered?0:-rect.top/height)*(2*Math.tan(THREE.MathUtils.degToRad(20))*4.4);
 discs.forEach(d=>{const offset=d.index-position,distance=Math.abs(offset),angle=offset*.35;let x=Math.sin(angle)*5.52,y=0,z=2.4-2.4*Math.cos(angle),scale=1-Math.min(distance,2)*.09;if(mobile){const v=new THREE.Vector3(offset*2.3,-Math.min(distance,2.5),-Math.min(distance,2.5)*.5).applyQuaternion(inverseGallery);x=v.x;y=v.y;z=v.z;scale=1.5-Math.min(distance,2.5)*.32;}
  d.group.visible=!(flight&&flight.index===d.index);if(flight){const retreat=flight.kind==='open'?smooth(flight.p):1-smooth(flight.p);x+=(d.index<flight.index?-1:1)*retreat*7;scale*=1-retreat*.85;}
  const fan=opening.phase==='unfolding'?(reduced.matches?1:smooth((now-opening.start)/1150)):(entered?1:0);
  const rise=reduced.matches?1:1-Math.pow(1-clamp(opening.progress,0,1),3);
  const turn=reduced.matches?1:1-Math.pow(1-clamp(opening.progress/.8,0,1),2.4);
  if(!entered){
   if(d.index===0){
    // Keep this very same disc on screen from the first frame through the handoff.
    const lift=new THREE.Vector3(0,-.7*(1-rise),-.5*(1-rise)).applyQuaternion(inverseGallery).divideScalar(gallery.scale.x);
    x+=lift.x;y+=lift.y;z+=lift.z;
    scale*=reduced.matches?1:(.32+.48*(1-Math.pow(1-clamp(rise/.5,0,1),2))+.2*fan);
   }else{
    const spread=opening.phase==='unfolding'?(reduced.matches?1:smooth((now-opening.start-d.index*45)/950)):0;
    d.group.visible=spread>0;x*=spread;y*=spread;z=z*spread-.12*(1-spread);
    scale*=spread;
   }
  }
  d.group.position.set(x,y,z);d.group.scale.setScalar(scale);
  d.hover+=((entered&&d.index===hover?1:0)-d.hover)*(1-Math.exp(-dt*10));
  d.group.rotation.set(d.hover*.17*pointer.y,(!entered?fan:1)*(mobile?clamp(-offset,0,1)*Math.PI/3:-angle)+lean+d.hover*.17*pointer.x,-lean*.2);
  if(!down||down.i!==d.index){d.spinX*=Math.exp(-dt*5);d.spinY*=Math.exp(-dt*5);}
  d.spin.rotation.set(d.spinX,d.spinY+(!entered&&d.index===0?-Math.PI/2*(1-turn):0),!entered&&d.index===0?1.1*(1-turn)**2:0);
  const ink=Math.max(entered&&finePointer.matches?d.hover:0,!entered&&d.index===0?1-fan:0);
  d.contour.rotation.copy(d.spin.rotation);d.contour.visible=ink>.005&&!flight;
  if(d.contour.visible)d.contour.children.forEach((line,j)=>{
   line.material.opacity=ink*.78;line.rotation.z=(reduced.matches?0:now*.00018)+j*1.9;
   const a=line.geometry.attributes.position,tick=reduced.matches?0:Math.floor(now/100);
   for(let k=0;k<a.count;k++){const angle=k/(a.count-1)*Math.PI*(1.64+j*.08),r=1.055+j*.025+.012*Math.sin(angle*5+tick*.65+j)+.005*Math.sin(angle*11+tick+j);a.setXYZ(k,Math.cos(angle)*r,Math.sin(angle)*r,.014);}a.needsUpdate=true;
  });
 });
 if(opening.phase==='unfolding'&&(reduced.matches||now-opening.start>=1150)){
  opening.phase='ready';entered=true;smoothScroll?.start();opening.resolve?.();opening.resolve=null;
  if(location.hash)restoreHash();
 }
 root.dataset.introPhase=opening.phase;root.dataset.introProgress=opening.progress.toFixed(3);
 const active=items.map((item,i)=>({i,top:document.getElementById(item.id).getBoundingClientRect().top})).filter(s=>s.top<height*.53).at(-1)?.i;
 const wanted=active??current,pose=dockPose();if(!flight&&!swap&&wanted!==displayed)swap={to:wanted,start:now};
 let turn=0;if(swap){const p=clamp((now-swap.start)/(reduced.matches?1:850),0,1);turn=smooth(p)*Math.PI*2;if(p>=.5&&displayed!==swap.to)setDock(swap.to);if(p===1){swap=null;turn=0;}}
 if(!reduced.matches)dockAngle+=dt*.25;dock.visible=entered||opening.phase==='unfolding';dock.position.copy(pose.p);dock.quaternion.copy(pose.q);dock.scale.setScalar(pose.scale);dockSpin.rotation.set(0,turn,dockAngle);
 if(flight){const f=flight,t=clamp((now-f.start)/f.duration,0,1),p=smooth(t);f.p=p;let destP=pose.p,destQ=pose.q,destScale=pose.scale;
  if(f.kind==='return'){destP=new THREE.Vector3(0,0,0);destQ=gallery.quaternion.clone();destScale=gallery.scale.x*(mobile?1.5:1);}
  f.group.position.copy(f.fromP).lerp(destP,p);f.group.position.y+=Math.sin(p*Math.PI)*.35;f.group.quaternion.copy(f.fromQ).slerp(destQ,p);f.group.scale.setScalar(f.fromScale+(destScale-f.fromScale)*p);
  f.spin.rotation.set(f.fromSpin.x*(1-p),f.fromSpin.y+(Math.PI*2-f.fromSpin.y)*p,f.fromSpin.z+((f.kind==='open'?dockAngle:0)-f.fromSpin.z)*p);
  if(t===1){setDock(f.index);swap=null;scene.remove(f.group);flight=null;dock.visible=true;dockReturn.disabled=false;document.body.classList.remove('disc-flying');}
 }
 root.dataset.flight=flight?.kind??'none';dockReturn.dataset.rotation=dockAngle.toFixed(3);
 $('#intro-caption').style.opacity=1-smooth((position-(total-.6))/.6);if(root.dataset.announcedIndex!==String(current)){root.dataset.announcedIndex=current;root.setAttribute('aria-label',items[current].title+', disc '+(current+1)+' of '+total+'. Use left and right arrow keys to browse, or Enter to open.');}
 if(galleryMouse&&gallery.visible&&!flight){hover=hit(galleryMouse);root.style.cursor=hover>=0?'pointer':'default';}else if(!gallery.visible)hover=-1;
 root.dataset.hoveredDisc=hover>=0?items[hover].id:'';
 document.body.classList.toggle('reading',active!==undefined);motionFrame(now,dt);reader.update(now);renderer.render(scene,camera);
}
requestAnimationFrame(render);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;});
const readState=()=>({view:reader.isOpen?'work-detail':scrollY<intro.offsetHeight-height*.6?'gallery':'page',current:(scrollY<intro.offsetHeight-height*.6?current:displayed)+1,total,dockedSection:items[displayed].id,discPosition:Number(position.toFixed(3)),flight:flight?.kind??null,selectedWork:reader.selected,publicationsPaused:$('#paper-orbit').dataset.paused==='true',sections:items.map(d=>d.id),works:works.map(w=>({id:w.id,title:w.title,type:w.type}))});
const settle=()=>new Promise(resolve=>{let prior=scrollY,stable=0,start=performance.now();function check(){stable=Math.abs(scrollY-prior)<1&&!flight?stable+1:0;prior=scrollY;if(stable>12||performance.now()-start>6000)resolve(readState());else requestAnimationFrame(check);}requestAnimationFrame(check);});
if(document.modelContext?.registerTool){const tools=[
 {name:'get_disc_state',title:'Read homepage state',description:'Read the current chapter, persistent corner disc, and selected publication or project.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>readState()},
 {name:'browse_disc',title:'Browse discs',description:'Scroll the opening to one of five chapter discs.',inputSchema:{type:'object',properties:{number:{type:'integer',minimum:1,maximum:5}},required:['number'],additionalProperties:false},execute:async({number})=>{if(!Number.isInteger(number)||number<1||number>total)throw Error('Choose disc 1 through 5.');reader.close(true);navigate(number-1);return settle();}},
 {name:'open_section',title:'Read a chapter',description:'Select a chapter; from the collection its disc flips and flies into the upper-left corner.',inputSchema:{type:'object',properties:{section:{type:'string',enum:items.map(d=>d.id)}},required:['section'],additionalProperties:false},execute:async({section})=>{const i=items.findIndex(d=>d.id===section);if(i<0)throw Error('Unknown chapter.');openSection(i);return settle();}},
 {name:'close_section',title:'Return to the discs',description:'Close a selected work, if any, and return to the five-disc collection.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:async()=>{returnToIntro(displayed);return settle();}},
 {name:'open_work',title:'Explore a publication or project',description:'Select a book in the visible collection to flip and enlarge it beside its description.',inputSchema:{type:'object',properties:{work:{type:'string',enum:works.map(w=>w.id)}},required:['work'],additionalProperties:false},execute:async({work})=>{if(reader.isOpen)throw Error('Close the selected book first.');const card=[...document.querySelectorAll('[data-work]')].find(c=>c.dataset.work===work&&Number(c.style.opacity)>.6);if(!card)throw Error('Wait for that book to rotate into view.');reader.open(work,card);return readState();}},
 {name:'close_work',title:'Close selected work',description:'Fold the selected book back into the rotating collection.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>{reader.close();return readState();}}
 ];for(const tool of tools)try{document.modelContext.registerTool(tool);}catch{}}
function restoreHash(){let hash=location.hash;if(hash==='#projects')hash='#publications';if(hash==='#resources'){hash='#memory';document.querySelector('.undergraduate-archive').open=true;}const i=items.findIndex(d=>'#'+d.id===hash);if(i>=0){clearFlight();reader.close(true);scrollToY(sectionY(i),true);setDock(i);}}
window.addEventListener('popstate',()=>{if(location.hash)restoreHash();});
if(location.hash&&entered)requestAnimationFrame(restoreHash);

export async function prepareScene(){
 gallery.visible=true;scene.updateMatrixWorld();
 if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
 renderer.render(scene,camera);
}
// Loading choreography is driven by decoded assets and a short minimum animation duration.
export function setLoadingProgress(progress){opening.progress=clamp(progress,0,1);}
export function loadingAnchor(){
 scene.updateMatrixWorld();
 const disc=discs[0],center=disc.group.localToWorld(new THREE.Vector3()).project(camera);
 const cx=(center.x+1)*width/2,cy=(1-center.y)*height/2;
 let rx=0,ry=0;
 for(let i=0;i<32;i++){
  const a=i/32*Math.PI*2,p=disc.spin.localToWorld(new THREE.Vector3(Math.cos(a)*1.12,Math.sin(a)*1.12,0)).project(camera);
  rx=Math.max(rx,Math.abs((p.x+1)*width/2-cx));ry=Math.max(ry,Math.abs((1-p.y)*height/2-cy));
 }
 return {x:cx,y:cy,rx,ry};
}
export function revealExperience(){
 opening.progress=1;opening.phase='unfolding';opening.start=performance.now();
 return new Promise(resolve=>{opening.resolve=resolve;});
}
