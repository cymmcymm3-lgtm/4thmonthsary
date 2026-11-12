(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .08 });
    $$('.reveal').forEach(element => observer.observe(element));
  }

  let queued = false;
  function progress() {
    const range = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress').style.width = (range > 0 ? scrollY / range * 100 : 0) + '%';
    queued = false;
  }
  window.addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(progress);
    }
  }, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  const dialog = $('#photo-dialog');
  const dialogImage = $('#viewer-image');
  const dialogCaption = $('#viewer-caption');
  const dialogNumber = $('#viewer-number');
  const viewer = dialog?.querySelector('.viewer-polaroid');
  const closeButton = dialog?.querySelector('.dialog-close');
  let index = 0;
  let opener;
  let cycling = false;
  let closeTimer = 0;
  let dragValue = 0;
  let stackLayers = [];

  const photos = () => Array.isArray(window.SCRAPBOOK?.photos) ? window.SCRAPBOOK.photos : [];
  const wrap = value => {
    const list = photos();
    return list.length ? (value % list.length + list.length) % list.length : 0;
  };
  const photoAt = value => photos()[wrap(value)];

  function imageFor(element, photo, alt = '') {
    if (!element || !photo) return;
    element.src = photo.src;
    element.alt = alt || '';
  }

  function addViewerStack() {
    if (!dialog || !viewer || viewer.parentElement.classList.contains('viewer-stack-stage')) return;
    const stage = document.createElement('div');
    stage.className = 'viewer-stack-stage';
    const farther = document.createElement('div');
    farther.className = 'viewer-stack-layer viewer-stack-far';
    farther.setAttribute('aria-hidden', 'true');
    const fartherImage = document.createElement('img');
    fartherImage.decoding = 'async';
    farther.append(fartherImage);
    const next = document.createElement('div');
    next.className = 'viewer-stack-layer viewer-stack-next';
    next.setAttribute('aria-hidden', 'true');
    const nextImage = document.createElement('img');
    nextImage.decoding = 'async';
    next.append(nextImage);
    viewer.parentElement.insertBefore(stage, viewer);
    stage.append(farther, next, viewer);
    stackLayers = [nextImage, fartherImage];
  }

  function render() {
    const list = photos();
    const photo = photoAt(index);
    if (!photo || !dialogImage) return;
    index = wrap(index);
    imageFor(dialogImage, photo, photo.alt || 'A photo of us');
    dialogCaption.textContent = photo.caption || '';
    dialogNumber.textContent = `${index + 1} / ${list.length}`;
    imageFor(stackLayers[0], photoAt(index + 1));
    imageFor(stackLayers[1], photoAt(index + 2));
  }

  function setLaunchOrigin(source) {
    if (!dialog) return;
    const rect = source?.getBoundingClientRect?.();
    if (!rect) {
      dialog.style.setProperty('--launch-x', '0px');
      dialog.style.setProperty('--launch-y', '26px');
      return;
    }
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    dialog.style.setProperty('--launch-x', `${Math.max(-260, Math.min(260, centerX - innerWidth / 2))}px`);
    dialog.style.setProperty('--launch-y', `${Math.max(-230, Math.min(260, centerY - innerHeight / 2))}px`);
  }

  function openPhoto(next, source = document.activeElement) {
    if (!dialog || !photos().length) return;
    window.clearTimeout(closeTimer);
    index = wrap(Number(next) || 0);
    opener = source;
    setLaunchOrigin(source);
    render();
    dialog.classList.remove('is-closing');
    dialog.classList.add('is-opening');
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
    requestAnimationFrame(() => {
      dialog.classList.add('is-visible');
      closeTimer = window.setTimeout(() => dialog.classList.remove('is-opening'), reduced.matches ? 0 : 560);
    });
  }

  function finishClose() {
    if (!dialog?.open) return;
    dialog.classList.remove('is-closing', 'is-opening', 'is-visible');
    dialog.close();
  }

  function requestClose() {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    window.clearTimeout(closeTimer);
    if (reduced.matches) {
      finishClose();
      return;
    }
    dialog.classList.add('is-closing');
    closeTimer = window.setTimeout(finishClose, 300);
  }

  function resetDrag() {
    if (!viewer) return;
    viewer.style.transform = '';
    viewer.style.opacity = '';
    dragValue = 0;
  }

  function easeBack() {
    if (!viewer || reduced.matches) {
      resetDrag();
      return;
    }
    const from = viewer.style.transform || 'translate3d(0, 0, 0) rotate(-2deg)';
    const animation = viewer.animate([
      { transform: from, opacity: viewer.style.opacity || 1 },
      { transform: 'translate3d(0, 0, 0) rotate(-2deg)', opacity: 1 }
    ], { duration: 220, easing: 'cubic-bezier(.2,.8,.28,1)' });
    animation.finished.catch(() => {}).finally(resetDrag);
  }

  function animateCycle(step) {
    if (cycling || photos().length < 2) return;
    cycling = true;
    const finish = () => {
      index = wrap(index + step);
      render();
      resetDrag();
      cycling = false;
    };
    if (reduced.matches || !viewer || !dialog?.open) {
      finish();
      return;
    }
    const outgoing = dragValue || 0;
    const direction = step > 0 ? -1 : 1;
    const leave = viewer.animate([
      { transform: viewer.style.transform || `translate3d(${outgoing}px, ${-Math.abs(outgoing) * .05}px, 0) rotate(${-2 + outgoing / 32}deg)`, opacity: viewer.style.opacity || 1 },
      { transform: `translate3d(${direction * 118}%, -3%, 0) rotate(${direction * 13}deg)`, opacity: 0 }
    ], { duration: 220, easing: 'cubic-bezier(.5,0,.75,.2)', fill: 'forwards' });
    leave.finished.catch(() => {}).finally(() => {
      index = wrap(index + step);
      render();
      const enter = viewer.animate([
        { transform: `translate3d(${direction * -24}%, 2%, 0) rotate(${direction * -8}deg)`, opacity: 0 },
        { transform: 'translate3d(0, 0, 0) rotate(-2deg)', opacity: 1 }
      ], { duration: 280, easing: 'cubic-bezier(.17,.84,.35,1)', fill: 'both' });
      enter.finished.catch(() => {}).finally(() => {
        resetDrag();
        cycling = false;
      });
    });
  }

  function syncStaticPhotos() {
    const list = photos();
    if (!list.length) return;
    $$('[data-photo]:not(.hanging-photo)').forEach(button => {
      const next = wrap(Number(button.dataset.photo));
      const photo = list[next];
      const image = button.querySelector('img');
      if (image) imageFor(image, photo, photo.alt || 'A photo of us');
      button.setAttribute('aria-label', `Open ${photo.alt || 'our photo'}`);
    });
  }

  function createHangingCard(photoIndex, slot, duplicate) {
    const photo = photoAt(photoIndex);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hanging-photo';
    button.dataset.photo = String(photoIndex);
    button.style.setProperty('--hanger-index', String(slot));
    button.style.setProperty('--hanger-tilt', `${[-3, 2, -1, 4, -4, 1, 3, -2, 4, -3][slot % 10]}deg`);
    button.setAttribute('aria-label', `Open photo ${photoIndex + 1} of ${photos().length}`);
    if (duplicate) {
      button.tabIndex = -1;
      button.setAttribute('aria-hidden', 'true');
    }
    const clip = document.createElement('span');
    clip.className = 'clip';
    clip.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = duplicate ? '' : (photo.alt || 'A photo of us');
    image.loading = slot > 3 ? 'lazy' : 'eager';
    image.decoding = 'async';
    const caption = document.createElement('span');
    caption.className = 'photo-caption';
    caption.textContent = photo.caption || 'a little moment ♡';
    button.append(clip, image, caption);
    return button;
  }

  function buildHangingTrain() {
    const track = $('#hanging-photo-train');
    const list = photos();
    if (!track || !list.length) return;
    const count = Math.max(10, list.length);
    const fragment = document.createDocumentFragment();
    [false, true].forEach(duplicate => {
      const sequence = document.createElement('div');
      sequence.className = 'hanging-gallery-sequence';
      if (duplicate) {
        sequence.setAttribute('aria-hidden', 'true');
        sequence.inert = true;
      }
      for (let slot = 0; slot < count; slot += 1) sequence.append(createHangingCard(slot % list.length, slot, duplicate));
      fragment.append(sequence);
    });
    track.replaceChildren(fragment);
  }

  function showFromButton(button) {
    const requested = Number(button.dataset.photo);
    if (!Number.isFinite(requested) || button.getAttribute('aria-hidden') === 'true') return;
    openPhoto(requested, button);
  }

  addViewerStack();
  syncStaticPhotos();
  buildHangingTrain();
  render();

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-photo]');
    if (button) showFromButton(button);
  });
  closeButton?.addEventListener('click', requestClose);
  dialog?.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
  dialog?.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    resetDrag();
    cycling = false;
    opener?.focus?.({ preventScroll: true });
  });
  dialog?.addEventListener('click', event => { if (event.target === dialog) requestClose(); });
  $('#viewer-prev')?.addEventListener('click', () => animateCycle(-1));
  $('#viewer-next')?.addEventListener('click', () => animateCycle(1));
  dialog?.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    animateCycle(event.key === 'ArrowLeft' ? -1 : 1);
  });

  if (viewer && typeof window.bindScrapbookSwipe === 'function') {
    bindScrapbookSwipe(viewer, {
      start: () => Boolean(dialog?.open) && !cycling && photos().length > 1,
      move: value => {
        if (cycling) return;
        dragValue = value * .82;
        const amount = Math.min(1, Math.abs(dragValue) / Math.max(1, viewer.clientWidth));
        viewer.style.transform = `translate3d(${dragValue}px, ${-Math.abs(dragValue) * .045}px, 0) rotate(${-2 + dragValue / 30}deg)`;
        viewer.style.opacity = String(1 - amount * .25);
      },
      end: (value, velocity) => {
        if (cycling) return;
        if (Math.abs(value) > 52 || Math.abs(velocity) > .42) animateCycle(value < 0 ? 1 : -1);
        else easeBack();
      },
      cancel: easeBack
    });
  }

  window.openScrapbookPhoto = (next, source) => openPhoto(next, source || document.activeElement);
  window.addEventListener('scrapbook:photos-changed', () => {
    index = wrap(index);
    syncStaticPhotos();
    buildHangingTrain();
    render();
  });
})();
