(() => {
  'use strict';
  // Only the love letter remains; bouquet and scratch-ticket interactions are removed.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const container = document.querySelector('.letter-specks');
  if (container && !reduced.matches) {
    for (let index = 0; index < 15; index++) {
      const star = document.createElement('span');
      star.className = 'letter-speck';
      star.textContent = index % 3 === 0 ? '\u2727' : '\u00b7';
      const variables = {
        x: `${5 + Math.random() * 90}%`, y: `${6 + Math.random() * 85}%`,
        size: `${11 + Math.random() * 11}px`, duration: `${3 + Math.random() * 4}s`,
        delay: `${-Math.random() * 6}s`
      };
      Object.entries(variables).forEach(([name,value]) => star.style.setProperty('--'+name,value));
      container.append(star);
    }
  }
  document.querySelectorAll('#letter-body p').forEach((paragraph,index) => paragraph.style.setProperty('--line',index));
})();
