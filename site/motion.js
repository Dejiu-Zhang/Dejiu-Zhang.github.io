// Scroll choreography shares one clock with the disc scene.
const $ = s => document.querySelector(s);
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const ease = v => {v=clamp(v);return v*v*(3-2*v);};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
import {works, coverMarkup} from './works.js';
import {initializeTimeline} from './timeline.js?v=compact-20260922';
export function initializeMotion(reader){
 const timelineFrame=initializeTimeline();
 // A long editorial sentence emerges word by word, retaining natural line breaks.
 const about=$('#about .lead');about.classList.add('word-reveal');
 about.innerHTML=about.textContent.trim().split(/\s+/).map(w=>`<span>${w}</span>`).join(' ');
 $('#about .chapter-content').insertAdjacentHTML('beforeend','<figure class="campus-photo"><img src="./assets/memorial-glade.avif" alt="Doe Library and Memorial Glade at UC Berkeley" loading="lazy" width="1440" height="960"><figcaption>Berkeley, California</figcaption></figure>');
 $('#about').insertAdjacentHTML('beforeend','<a class="next-chapter" href="#research">Explore my research <span aria-hidden="true">↓</span></a>');
 const pubs=$('#publications');
 pubs.querySelector('.section-copy').remove();
 pubs.querySelector('.chapter-content').prepend(Object.assign(document.createElement('div'),{className:'orbit',id:'paper-orbit'}));
 const orbit=$('#paper-orbit');
 orbit.setAttribute('aria-label','Rotating publications and projects. Hover over a book to pause. Select a book to explore.');
 orbit.innerHTML=`<div class="orbit-cards">${Array.from({length:8},(_,i)=>{const p=works[i%works.length];return `<button class="paper-cover ${p.color}" data-work="${p.id}" aria-haspopup="dialog" aria-label="Explore ${p.title} — ${p.type}" ${i>=works.length?'aria-hidden="true" tabindex="-1"':''}>${coverMarkup(p)}</button>`;}).join('')}</div><div class="orbit-caption"><h2 id="title-publications">Publications & Projects</h2><p>Papers, ideas & tools</p></div>`;
 const oldTitle=pubs.querySelector('.chapter-content > h2');if(oldTitle)oldTitle.remove();
 orbit.insertAdjacentHTML('afterend','<div class="orbit-toolbar"><span>Hover over a book to pause · Select to explore</span><button id="pause-orbit" aria-pressed="false">Pause motion</button></div>');
 orbit.addEventListener('click',e=>{const card=e.target.closest('[data-work]');if(card)reader.open(card.dataset.work,card);});
 const contact=$('#contact');
 contact.querySelector('#title-contact').textContent='Let’s connect.';
 contact.querySelector('.chapter-content').classList.add('contact-message');
 contact.querySelector('.chapter-label').remove();
 const stage=document.createElement('div');stage.className='contact-stage';
 const message=contact.querySelector('.contact-message');stage.appendChild(message);contact.appendChild(stage);
 stage.insertAdjacentHTML('afterbegin','<div class="poster-wall" aria-hidden="true"></div><div class="contact-wash" aria-hidden="true"></div><div class="contact-prelude"><span>05 / CONTACT</span><p>Good questions start with a conversation.</p></div>');
 stage.insertAdjacentHTML('beforeend','<footer><span>Yueshan Zhang · Berkeley, CA</span><a href="./credits.html" target="_blank" rel="noopener">Photo credits</a><a href="#top" aria-label="Return to the disc gallery">Back to the discs ↑</a></footer>');
 // The wall is made from this portfolio’s own typographic research and project covers.
 const wall=$('.poster-wall');
 const wallDesigns=[
  ['citrus','Causal inference','The city, in motion.','NYC · Transportation · 2026'],
  ['blue','AI & public health','Human. Digital.','Adolescent digital twins · 2026'],
  ['olive','Research tools','Nova','A new way into research'],
  ['coral','Biostatistics','Better questions.','Yueshan Zhang · UC Berkeley'],
  ['cream','Mathematics','From ideas to evidence.','Causal inference · Public health'],
  ['portrait-poster','Yueshan Zhang','', 'Dejiu · Berkeley, CA']
 ];
 const campusPhotos=[['memorial-glade.avif','Memorial Glade'],['bay-from-tower.avif','The Bay from Berkeley'],['campanile-clock.avif','The Campanile'],['wheeler-hall.avif','Wheeler Hall'],['campanile-way.avif','Campanile Way']];
 for(let i=0;i<30;i++){const el=document.createElement('div');if(i%3!==2){const photo=campusPhotos[(i+Math.floor(i/6))%campusPhotos.length];el.className='wall-poster campus-poster';el.innerHTML=`<img src="./assets/${photo[0]}" alt="" loading="lazy"><span>${photo[1]}</span>`;}else{const d=wallDesigns[(i+Math.floor(i/6))%5];el.className=`wall-poster ${d[0]}`;el.innerHTML=`<span class="poster-topic">${d[1]}</span><strong>${d[2]}</strong><span class="poster-note">${d[3]}</span>`;}wall.appendChild(el);}

 const revealNodes=[...document.querySelectorAll('#about .body-copy,#about .profile-details,#about .inline-links,#research .entry,#research .lead')];
 revealNodes.forEach(n=>n.classList.add('scroll-reveal'));
 const words=[...about.querySelectorAll('span')],cards=[...orbit.querySelectorAll('.paper-cover')],posters=[...wall.children];
 const pause=$('#pause-orbit');let phase=-Math.PI/8,hover=false,manual=false,mouse=null,wallX=0,wallY=0,wallTargetX=0,wallTargetY=0,drag=null;
 const sizes={orbitW:0,orbitH:0,cardW:0,cardH:0};
 const measure=()=>{sizes.orbitW=orbit.clientWidth;sizes.orbitH=orbit.clientHeight;sizes.cardW=cards[0].offsetWidth;sizes.cardH=cards[0].offsetHeight;};new ResizeObserver(measure).observe(orbit);measure();
 document.addEventListener('pointermove',e=>{mouse=e.pointerType==='mouse'?{x:e.clientX,y:e.clientY}:null;},{passive:true});
 document.addEventListener('pointerout',e=>{if(!e.relatedTarget)mouse=null;},{passive:true});window.addEventListener('blur',()=>mouse=null);
 orbit.addEventListener('focusin',e=>{const i=cards.indexOf(e.target);if(i>=0&&e.target.matches(':focus-visible'))phase=-i*Math.PI*2/cards.length;});
 pause.onclick=()=>{manual=!manual;pause.textContent=manual?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(manual));};
 stage.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.target.closest('a,button,.contact-message'))return;drag={x:e.clientX,y:e.clientY,fromX:wallTargetX,fromY:wallTargetY};stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');});
 stage.addEventListener('pointermove',e=>{if(!drag)return;wallTargetX=clamp(drag.fromX+e.clientX-drag.x,-innerWidth*.16,innerWidth*.16);wallTargetY=clamp(drag.fromY+e.clientY-drag.y,-innerHeight*.18,innerHeight*.18);});
 const release=()=>{drag=null;stage.classList.remove('dragging');};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
 return function animate(now,dt){
  timelineFrame();
  const vh=innerHeight,view=about.getBoundingClientRect();
  words.forEach((w,i)=>{const p=reduced.matches?1:ease((vh*.85-view.top-i*vh*.012)/(vh*.35));w.style.opacity=.16+.84*p;w.style.transform=`translateY(${(1-p)*12}px)`;});
  const portrait=$('.portrait');const pp=clamp((vh-$('#about').getBoundingClientRect().top)/(vh+$('#about').offsetHeight));portrait.style.transform=reduced.matches?'none':`translateY(${(pp-.5)*-65}px) rotate(${(1-pp)*-3}deg)`;
  revealNodes.forEach(el=>{const r=el.getBoundingClientRect();const p=reduced.matches?1:ease((vh*.94-r.top)/(vh*.32));el.style.opacity=.12+.88*p;el.style.transform=`translate3d(0,${(1-p)*32}px,0)`;});
  const rect=orbit.getBoundingClientRect(),visible=rect.bottom>0&&rect.top<vh;
  const pointed=visible&&mouse?document.elementFromPoint(mouse.x,mouse.y)?.closest('.paper-cover'):null;
  hover=!!pointed&&orbit.contains(pointed)&&Number(pointed.style.opacity)>.6;
  const focus=cards.some(card=>card===document.activeElement&&card.matches(':focus-visible'));
  orbit.dataset.hoveredWork=hover?pointed.dataset.work:'';
  const paused=hover||focus||manual||reduced.matches||reader.isOpen;orbit.dataset.paused=String(paused);orbit.dataset.phase=phase.toFixed(4);
  if(visible&&!paused)phase=(phase+dt*Math.PI*2/80)%(Math.PI*2);
  if(visible&&!reduced.matches&&!reader.isOpen){const {orbitW:w,orbitH:h,cardW:cw,cardH:ch}=sizes;cards.forEach((card,i)=>{const a=phase+i*Math.PI*2/cards.length,cos=Math.cos(a),front=clamp(cos);let normalized=Math.atan2(Math.sin(a),cos);const x=w/2+w*(w<600?.63:.42)*Math.sin(a)-cw/2,y=h*.84-h*.52*cos-ch/2;const opacity=clamp((cos+.45)/.95);card.style.transform=`translate3d(${x}px,${y}px,0) rotate(${normalized*180/Math.PI*.65}deg) scale(${.86+front*.14})`;card.style.opacity=opacity;card.style.zIndex=Math.round(cos*20)+20;card.style.filter=`saturate(${.4+.6*front}) brightness(${.94+.06*front})`;card.style.pointerEvents=opacity>.6?'auto':'none';});}
  const cr=contact.getBoundingClientRect(),travel=contact.offsetHeight-vh;
  const progress=reduced.matches?1:clamp(-cr.top/Math.max(1,travel));contact.dataset.progress=progress.toFixed(3);
  const reveal=ease((progress-.36)/.48),prelude=1-ease((progress-.08)/.22);
  $('.contact-prelude').style.opacity=prelude;$('.contact-prelude').style.transform=`translateY(${-60*(1-prelude)}px)`;
  message.style.opacity=reveal;message.style.transform=`translateY(${(1-reveal)*35}px)`;message.style.filter=`blur(${(1-reveal)*6}px)`;message.inert=reveal<.8;
  $('.contact-wash').style.opacity=reveal*.90;
  stage.querySelector('footer').style.opacity=reveal;
  wallX+=(wallTargetX-wallX)*(1-Math.exp(-dt*7));wallY+=(wallTargetY-wallY)*(1-Math.exp(-dt*7));
  wall.style.transform=`translate3d(${wallX}px,${wallY}px,0) rotate(-7deg)`;
  if(cr.top<vh&&cr.bottom>0)posters.forEach((el,i)=>{const p=reduced.matches?1:ease((progress-i*.005)/.5),direction=i%6<3?-1:1;el.style.transform=`perspective(900px) translate3d(${direction*(1-p)*(360+i%5*70)}px,${(1-p)*(90+i%4*50)}px,0) rotate(${(1-p)*(i%2?22:-22)}deg) rotateY(${direction*(1-p)*40}deg) scale(${.8+.2*p})`;el.style.opacity=p;});
 };
}
