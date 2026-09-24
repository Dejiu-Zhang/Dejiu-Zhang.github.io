// The first disc is the loader. It remains in the scene as the other chapters unfold.
const loader=document.querySelector('#site-loader');
const counter=loader.querySelector('.load-counter');
const cells=[...counter.querySelectorAll('.load-cell')];
const error=loader.querySelector('.load-error');
const main=document.querySelector('main'),header=document.querySelector('.masthead'),dock=document.querySelector('#dock-return');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
main.inert=header.inert=true;dock.disabled=true;
// Start the opening at its actual origin, including when reloading a chapter URL.
history.scrollRestoration='manual';window.scrollTo(0,0);
let target=.01,shown=.01,complete=false,failed=false,app=null,frame,last=performance.now(),sceneAt=0,leaving=false;
let visibleValue=1;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function roll(value){
 if(value===visibleValue)return;
 const old=String(visibleValue).padStart(3,'0'),next=String(value).padStart(3,'0');visibleValue=value;
 cells[0].classList.toggle('is-visible',value===100);
 cells.forEach((cell,i)=>{
  if(old[i]===next[i])return;
  const drum=cell.querySelector('.load-drum');
  drum.replaceChildren(...[old[i],next[i]].map(d=>{const span=document.createElement('span');span.textContent=d;return span;}));
  drum.getAnimations().forEach(a=>a.cancel());
  drum.animate([{transform:'translateY(0)'},{transform:'translateY(-1em)'}],{duration:reduced.matches?0:550,delay:reduced.matches?0:(2-i)*35,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
 });
}
function paint(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;
 // A resource can hold the pose, but never make the progress run backwards.
 const elapsed=sceneAt?(now-sceneAt)/(reduced.matches?1:2850):0;
 const destination=Math.min(complete?1:Math.min(.985,target),Math.max(.01,elapsed));
 shown+=(destination-shown)*(1-Math.exp(-dt*14));
 if(complete&&elapsed>=1&&shown>.995)shown=1;
 const value=Math.floor(shown*100);
 loader.dataset.progress=value;counter.setAttribute('aria-valuenow',value);
 if(!leaving){
  roll(value===100?100:value>=76?76:value>=48?48:value>=24?24:1);
  app?.setLoadingProgress(shown);
 }
 if(app){
  const anchor=app.loadingAnchor(),size=parseFloat(getComputedStyle(counter).fontSize),theta=reduced.matches?Math.PI:shown*Math.PI;
  const margin=size*.65,w=counter.offsetWidth/2;
  const x=anchor.x-Math.sin(theta)*(anchor.rx+w+margin);
  const y=anchor.y+Math.cos(theta)*(anchor.ry+size*.8);
  counter.style.left=`${Math.max(18+w,Math.min(innerWidth-18-w,x))}px`;
  counter.style.top=`${Math.max(90,Math.min(innerHeight-size*.65-15,y))}px`;
 }
 if(!failed&&!leaving&&complete&&value===100){leaving=true;finish();}
 if(!failed)frame=requestAnimationFrame(paint);
}
function deadline(promise,ms,label){
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(label)),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},e=>{clearTimeout(timer);reject(e);});});
}
async function loadPhotos(){
 const groups=new Map();
 for(const img of document.querySelectorAll('main img')){img.loading='eager';const src=img.currentSrc||img.src;if(!groups.has(src))groups.set(src,[]);groups.get(src).push(img);}
 const total=groups.size+2;let ready=0;
 const mark=()=>{ready++;target=.18+.82*ready/total;loader.dataset.ready=ready;};
 loader.dataset.total=total;
 const jobs=[...groups.entries()].map(async([url,images])=>{
  const image=new Image();image.decoding='async';image.src=url;
  await deadline(image.decode(),25000,'photo');
  await Promise.all(images.map(img=>deadline(img.decode(),25000,'photo')));
  mark();
 });
 jobs.push(deadline(document.fonts.ready,6000,'font').catch(()=>{}).then(mark));
 jobs.push(deadline(app.prepareScene(),15000,'scene').then(mark));
 await Promise.all(jobs);
}
async function finish(){
 await wait(reduced.matches?0:650);
 loader.dataset.state='leaving';loader.classList.add('is-finished');document.body.classList.add('intro-unfolding');
 await app.revealExperience();
 cancelAnimationFrame(frame);loader.hidden=true;loader.dataset.state='ready';
 document.body.classList.remove('is-loading','intro-unfolding');
 main.inert=header.inert=false;dock.disabled=false;document.body.setAttribute('aria-busy','false');
 document.querySelector('#status').textContent='Ready to explore.';
}
loader.querySelector('.load-retry').onclick=()=>location.reload();
frame=requestAnimationFrame(paint);
try{
 app=await deadline(import('./app.js?v=detent-20260924d'),25000,'site');
 sceneAt=performance.now();target=.18;
 await loadPhotos();complete=true;loader.dataset.state='loaded';
}catch(e){
 failed=true;cancelAnimationFrame(frame);loader.dataset.state='error';error.hidden=false;
 loader.setAttribute('aria-label','Unable to finish loading');document.body.setAttribute('aria-busy','false');
}
