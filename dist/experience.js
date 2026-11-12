(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const intro = $('#gift-intro');
  let opening = false, giftOpener;
  function showGift() {
    giftOpener = document.activeElement;
    intro.classList.remove('leaving', 'unsealed');
    intro.showModal(); document.body.classList.add('dialog-open');
  }
  async function openGift() {
    if (opening) return;
    opening = true;
    intro.classList.add('unsealed');
    await new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : 700));
    intro.classList.add('leaving');
    await new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : 600));
    intro.close(); opening = false;
    try { sessionStorage.setItem('monthsary-opened', 'yes'); } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('.hero-copy .button').focus({ preventScroll: true });
  }
  $('#open-gift').addEventListener('click', openGift);
  intro.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (!opening) giftOpener?.focus({ preventScroll: true }); });
  intro.addEventListener('cancel', event => { event.preventDefault(); openGift(); });
  let alreadyOpened = false;
  try { alreadyOpened = sessionStorage.getItem('monthsary-opened') === 'yes'; } catch {}
  if (!alreadyOpened && !location.hash) showGift();

  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        chapterLinks.forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-15% 0px -50% 0px' });
    chapterLinks.forEach(link => observer.observe($(link.hash)));
  }
})();
