(() => {
  'use strict';
  // Track movement on window; capture the surface before replacing a dragged card.
  window.bindScrapbookSwipe = (surface, handlers) => {
    let drag = null, suppressUntil = 0, wheelSum = 0, wheelAt = 0, wheelLocked = 0;
    const release = active => {
      try { if (surface.hasPointerCapture(active.id)) surface.releasePointerCapture(active.id); } catch {}
    };
    const cancel = () => {
      const active = drag; drag = null;
      if (!active) return;
      release(active);
      if (active.started) handlers.cancel?.();
    };
    surface.addEventListener('pointerdown', event => {
      if (drag || event.isPrimary === false || event.button > 0 || event.target.closest('video,input,select,textarea,[data-no-swipe]')) return;
      drag = {id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,started:false,at:performance.now(),lastX:event.clientX,lastAt:performance.now(),velocity:0};
    });
    window.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
      if (!drag.started) {
        if (Math.max(Math.abs(dx),Math.abs(dy)) < 7) return;
        if (Math.abs(dy) > Math.abs(dx)*1.15) { cancel(); return; }
        if (Math.abs(dx) < Math.abs(dy)*1.12) return;
        try { surface.setPointerCapture(event.pointerId); } catch {}
        if (handlers.start?.(dx < 0 ? 1 : -1) === false) { cancel(); return; }
        drag.started = true;
      }
      event.preventDefault();
      const now = performance.now();
      drag.velocity = (event.clientX-drag.lastX)/Math.max(8,now-drag.lastAt);
      drag.lastX = event.clientX; drag.lastAt = now; drag.dx = dx;
      handlers.move?.(dx);
    },{passive:false});
    window.addEventListener('pointerup', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const active = drag; drag = null;
      release(active);
      if (!active.started) return;
      suppressUntil = performance.now()+450;
      const dx = event.clientX-active.x;
      const velocity = performance.now()-active.lastAt > 120 ? 0 : active.velocity;
      handlers.end?.(dx,velocity);
    });
    window.addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) cancel(); });
    surface.addEventListener('lostpointercapture',event => { if (event.target===surface && drag?.id === event.pointerId) cancel(); });
    surface.addEventListener('click',event => {
      if (performance.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
    },true);
    surface.addEventListener('dragstart',event => event.preventDefault());
    surface.addEventListener('wheel',event => {
      const horizontal = event.shiftKey && Math.abs(event.deltaX)<1 ? event.deltaY : event.deltaX;
      if (!horizontal || (!event.shiftKey && Math.abs(horizontal)<=Math.abs(event.deltaY)*1.2)) return;
      event.preventDefault();
      const now = performance.now();
      if (now < wheelLocked || drag) return;
      if (now-wheelAt>160 || Math.sign(horizontal)!==Math.sign(wheelSum)) wheelSum=0;
      wheelAt=now;wheelSum+=horizontal;
      if (Math.abs(wheelSum)>42) { handlers.wheel?.(wheelSum>0?1:-1);wheelSum=0;wheelLocked=now+1100; }
    },{passive:false});
    window.addEventListener('blur',cancel);
    return {cancel};
  };
})();
