import {undergraduateNotes} from './memory-notes.js';

// Add future memories here; photo paths and dates stay separate from the motion.
const memories = [
 {id:'berkeley-spring',year:'2025',date:'January — May',datetime:'2025-01',place:'BERKELEY, CALIFORNIA',title:'A spring in Berkeley.',description:'My first stay at UC Berkeley, visiting for research from January to May.',image:'berkeley-2026.jpg',width:1279,height:1706,alt:'The Campanile above the trees and green lawns at UC Berkeley',caption:'UC Berkeley · Spring 2025',shape:'portrait'},
 {id:'nankai-graduation',year:'2026',date:'June',datetime:'2026-06',place:'NANKAI UNIVERSITY · TIANJIN',title:'The undergraduate chapter.',description:'Graduating from the School of Mathematical Sciences at Nankai University. A photograph, and the notes I kept along the way.',image:'nankai-graduation-2026.jpg',width:2000,height:1333,alt:'Yueshan celebrating graduation at Nankai University, holding her degree certificates',caption:'Graduation day · June 2026',shape:'landscape',notes:true},
 {id:'berkeley-return',year:'2026',date:'August',datetime:'2026-08',place:'BERKELEY, CALIFORNIA',title:'Back in Berkeley.',description:'Returning to Berkeley to begin my PhD in Biostatistics. A familiar place, a new chapter.',image:'bay-from-tower.avif',width:1440,height:1000,alt:'Berkeley and San Francisco Bay seen from the Campanile',caption:'Berkeley · A new chapter',shape:'landscape'}
];

export function initializeTimeline(){
 const section=document.querySelector('#memory'),content=section.querySelector('.chapter-content');
 content.querySelector('.section-copy').remove();
 content.insertAdjacentHTML('beforeend','<p class="memory-deck">A few moments, kept along the way.</p>');
 section.insertAdjacentHTML('beforeend',`<ol class="memory-timeline" aria-label="Personal timeline"><li class="timeline-rail" aria-hidden="true" role="presentation"><span></span></li>${memories.map(m=>`<li class="memory-moment" id="memory-${m.id}"><div class="moment-date"><time datetime="${m.datetime}"><span>${m.year}</span><small>${m.date}</small></time></div><span class="moment-dot" aria-hidden="true"></span><article class="moment-story"><div class="moment-copy"><p class="moment-place">${m.place}</p><h3>${m.title}</h3><p class="moment-description">${m.description}</p></div><figure class="moment-photo ${m.shape}"><div class="photo-window"><img src="./assets/${m.image}" alt="${m.alt}" width="${m.width}" height="${m.height}" loading="lazy" decoding="async"></div><figcaption><span>${m.caption}</span><span aria-hidden="true">${m.datetime.replace('-',' / ')}</span></figcaption></figure>${m.notes?`<details class="undergraduate-archive"><summary><span><span class="archive-label">FROM THESE YEARS</span><strong>Undergraduate notebooks</strong><small>Probability, statistics, analysis & algebra · 14 notes</small></span><span class="archive-toggle" aria-hidden="true">+</span></summary><div class="archive-content">${undergraduateNotes}</div></details>`:''}</article></li>`).join('')}</ol>`);
 const timeline=section.querySelector('.memory-timeline'),rail=timeline.querySelector('.timeline-rail'),fill=rail.firstElementChild,rows=[...timeline.querySelectorAll('.memory-moment')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let total=0;
 const measure=()=>{const first=rows[0].offsetTop+20,last=rows.at(-1).offsetTop+20;rail.style.top=first+'px';total=Math.max(1,last-first);rail.style.height=total+'px';};
 new ResizeObserver(measure).observe(timeline);measure();
 return ()=>{
  const vh=innerHeight,rect=timeline.getBoundingClientRect();
  if(rect.top>vh+100||rect.bottom< -100)return;
  const clamp=v=>Math.min(1,Math.max(0,v));
  const p=clamp((vh*.5-rect.top-parseFloat(rail.style.top))/total);
  fill.style.transform=`scaleY(${reduced.matches?1:p})`;
  rows.forEach(row=>{
   const r=row.getBoundingClientRect(),active=r.top<vh*.55&&r.bottom>vh*.3;
   row.classList.toggle('is-current',active);row.classList.toggle('is-past',r.bottom<=vh*.3);
   const t=reduced.matches?1:clamp((vh*.95-r.top)/(vh*.48)),e=1-Math.pow(1-t,3);
   row.querySelector('.moment-story').style.opacity=.28+.72*e;
   row.querySelector('.moment-story').style.transform=`translate3d(0,${(1-e)*18}px,0)`;
   const figure=row.querySelector('.moment-photo'),fr=figure.getBoundingClientRect();
   const imageP=clamp((vh-fr.top)/(vh+fr.height));
   figure.querySelector('img').style.transform=reduced.matches?'none':`scale(${1.035-.035*imageP})`;
  });
 };
}
