(() => {
  'use strict';
  const $=s=>document.querySelector(s),stack=$('#photo-stack'),front=$('#stack-front'),behind=$('#stack-next'),last=$('#stack-last');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let current=0,busy=false,direction=1,dx=0,raf=0;
  const photos=()=>window.SCRAPBOOK.photos,index=n=>(n+photos().length)%photos().length;
  function fill(card,i){const photo=photos()[index(i)];card.querySelector('img').src=photo.src;card.querySelector('img').alt=card===front?(photo.alt||'A photo of us'):'';card.querySelector('.stack-caption').textContent=photo.caption||''}
  function resetStyles(){front.style.transform='';front.style.opacity='';behind.style.transform='';}
  function render(){current=index(current);fill(front,current);fill(behind,current+1);fill(last,current+2);$('#photo-count').textContent=`${String(current+1).padStart(2,'0')} / ${String(photos().length).padStart(2,'0')}`;front.setAttribute('aria-label',`Open photo ${current+1} of ${photos().length}`);resetStyles();}
  function paint(value){dx=value;const amount=Math.min(1,Math.abs(value)/Math.max(1,stack.clientWidth));front.style.transform=`translate3d(${value}px,${-Math.abs(value)*.045}px,0) rotate(${value/22}deg)`;front.style.opacity=String(1-amount*.3);behind.style.transform=`translateY(${12*(1-amount)}px) rotate(${-4*(1-amount)}deg) scale(${.96+.04*amount})`;}
  function finish(done){cancelAnimationFrame(raf);if(done)current=index(current+direction);busy=false;dx=0;render();stack.setAttribute('aria-busy','false');}
  function settle(done){
    if(reduced.matches){finish(done);return}
    const start=performance.now(),from=dx,to=done?-direction*(stack.clientWidth+110):0,duration=done?440:300;
    const tick=now=>{if(!busy)return;const t=Math.min(1,(now-start)/duration);paint(from+(to-from)*(1-Math.pow(1-t,3)));if(t<1)raf=requestAnimationFrame(tick);else finish(done)};raf=requestAnimationFrame(tick);
  }
  function start(step){if(busy||photos().length<2)return false;busy=true;direction=step;dx=0;fill(behind,current+step);fill(last,current+step*2);stack.setAttribute('aria-busy','true');return true}
  function go(step){if(start(step))settle(true)}
  const gesture=bindScrapbookSwipe(stack,{start,move:value=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>paint(value*.88))},end:(value,velocity)=>settle(-value*direction>0&&(Math.abs(value)>58||(-velocity*direction>.35&&Math.abs(value)>25))),cancel:()=>settle(false),wheel:go});
  front.addEventListener('click',()=>{if(!busy)window.openScrapbookPhoto(current)});
  $('#photo-prev').addEventListener('click',()=>go(-1));$('#photo-next').addEventListener('click',()=>go(1));
  stack.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();go(event.key==='ArrowLeft'?-1:1)}});
  window.addEventListener('scrapbook:photos-changed',()=>{gesture.cancel();finish(false)});
  window.addEventListener('resize',()=>{gesture.cancel();finish(false)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){gesture.cancel();finish(false)}});
  reduced.addEventListener('change',()=>{gesture.cancel();finish(false)});
  render();
})();
