import {works, coverMarkup} from './works.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
export function createBookReader({stopScroll,startScroll,reduced}){
 const overlay=document.createElement('section');overlay.id='work-detail';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','work-heading');overlay.setAttribute('data-lenis-prevent','');
 overlay.innerHTML='<div class="work-veil"></div><button class="close-work" aria-label="Close selected work">Close <span aria-hidden="true">×</span></button><div class="work-layout"><div class="book-slot" aria-hidden="true"></div><article class="work-copy" tabindex="-1"></article></div><button class="book-flight" aria-label="Close this book and return to the collection"><span class="book-body" aria-hidden="true"><span class="book-face book-front"></span><span class="book-face book-back"></span><span class="book-spine"></span><span class="book-pages"></span></span></button>';
 document.body.appendChild(overlay);
 const book=overlay.querySelector('.book-flight'),front=overlay.querySelector('.book-front'),back=overlay.querySelector('.book-back'),copy=overlay.querySelector('.work-copy'),slot=overlay.querySelector('.book-slot');
 let state=null,progress=0,tween=null,lastFocus=null,returnRect=null;
 const clear=()=>{const old=state;state=null;progress=0;tween=null;overlay.hidden=true;document.documentElement.classList.remove('work-open');document.querySelector('main').inert=false;document.querySelector('.masthead').inert=false;if(old?.card)old.card.style.visibility='';startScroll();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});};
 function open(id,card){
  if(state)return;const work=works.find(w=>w.id===id);if(!work)return;
  const r=card.getBoundingClientRect(),matrix=new DOMMatrixReadOnly(getComputedStyle(card).transform),scale=Math.hypot(matrix.a,matrix.b);
  lastFocus=card;returnRect={x:r.left+r.width/2,y:r.top+r.height/2,scale:card.offsetWidth*scale/320,angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI};
  state={id,work,card};progress=0;tween={from:0,to:1,start:performance.now(),duration:reduced.matches?1:1650};
  front.className=`book-face book-front ${work.color}`;front.innerHTML=coverMarkup(work);back.className=`book-face book-back ${work.color}`;back.innerHTML=`<span>${work.type.toUpperCase()} / ${work.number}</span><strong>${work.title}</strong><span>Yueshan Zhang<br>${work.status}</span>`;
  book.dataset.work=id;overlay.dataset.phase='opening';overlay.hidden=false;copy.innerHTML=`<p class="work-kicker">${work.type} / ${work.number} <span>${work.status}</span></p><h2 id="work-heading">${work.title}</h2><p class="work-venue">${work.venue}</p>${work.description.map(p=>`<p>${p}</p>`).join('')}${work.credit?`<p class="work-credit"><a href="${work.creditUrl}" target="_blank" rel="noopener noreferrer">${work.credit}</a></p>`:''}${work.tech?`<p class="work-tech">${work.tech}</p>`:''}<div class="work-links">${work.links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} <span aria-hidden="true">↗</span></a>`).join('')}</div>`;
  copy.scrollTop=0;card.style.visibility='hidden';stopScroll();document.documentElement.classList.add('work-open');document.querySelector('main').inert=true;document.querySelector('.masthead').inert=true;overlay.querySelector('.close-work').focus({preventScroll:true});
 }
 function close(immediate=false){if(!state)return;if(immediate||reduced.matches){clear();return;}if(tween?.to===0)return;const r=state.card.getBoundingClientRect();returnRect.x=r.left+r.width/2;returnRect.y=r.top+r.height/2;tween={from:progress,to:0,start:performance.now(),duration:750};overlay.dataset.phase='closing';}
 book.onclick=()=>close();overlay.querySelector('.close-work').onclick=()=>close();
 document.addEventListener('keydown',e=>{if(!state)return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const elements=[...overlay.querySelectorAll('button,a[href]'),document.querySelector('#dock-return')].filter(el=>!el.hidden&&!el.disabled&&!el.closest('[inert]'));const first=elements[0],last=elements.at(-1);if(e.shiftKey&&(document.activeElement===first||!elements.includes(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 window.addEventListener('popstate',()=>close());
 return {open,close,get isOpen(){return !!state;},get selected(){return state?.id??null;},update(now){
  if(!state)return;
  if(tween){const t=clamp((now-tween.start)/tween.duration);progress=tween.from+(tween.to-tween.from)*ease(t);if(t===1){const destination=tween.to;tween=null;if(destination===0){clear();return;}overlay.dataset.phase='open';}}
  const rect=slot.getBoundingClientRect(),p=progress,target={x:rect.left+rect.width/2,y:rect.top+rect.height/2,scale:rect.width/320};
  const x=returnRect.x+(target.x-returnRect.x)*p,y=returnRect.y+(target.y-returnRect.y)*p-Math.sin(Math.PI*p)*Math.min(100,innerHeight*.12),scale=returnRect.scale+(target.scale-returnRect.scale)*p,z=returnRect.angle+(-5-returnRect.angle)*p;
  const spin=reduced.matches?0:720*p-12*p;
  book.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) perspective(1100px) rotateZ(${z}deg) rotateY(${spin}deg) scale(${scale})`;
  overlay.style.setProperty('--book-progress',String(p));overlay.querySelector('.work-veil').style.opacity=ease(p/.65);
  const text=ease((p-.58)/.42);copy.style.opacity=text;copy.style.transform=`translate3d(${(1-text)*38}px,0,0)`;copy.inert=p<.98;overlay.querySelector('.close-work').style.opacity=ease(p/.3);overlay.dataset.progress=p.toFixed(3);
 }};
}
