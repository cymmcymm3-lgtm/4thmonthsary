(() => {
  'use strict';
  const root = document.querySelector('#lyric-reel');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const frames = [...root.querySelectorAll('[data-lyric-frame]')];
  const dots = [...root.querySelectorAll('[data-lyric-dot]')];
  const play = $('#lyric-reel-play'), cover = $('#book-cover'), audio = $('#lyric-music');
  const mute = $('#lyric-mute'), status = $('#lyric-reel-status'), finale = $('.flower-finale');
  const turn = $('.book-page-turn');
  const turnLeaf = $('.page-turn-leaf'), turnFront = $('.page-turn-front'), turnBack = $('.page-turn-back');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lyrics = ['She looks just like a dream', "The prettiest girl I've ever seen", 'From the cover of a magazine'];
  const clamp = (v, lo, hi, fallback) => Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : fallback;
  let elapsed = 0, running = false, raf = 0, anchor = 0, active = -1, phase = 'closed';
  let source = '', offset = 0, volume = .65, audioClock = false, generation = 0, audioFailed = false;
  let timing;
  function config() { return window.SCRAPBOOK.lyricReel || {}; }
  function configure() {
    const cfg = config();
    timing = {open:clamp(cfg.openingDuration,500,6000,1600),page:clamp(cfg.duration,1800,30000,3800),finale:clamp(cfg.finaleDuration,2000,15000,4500)};
    timing.end = timing.open + timing.page * 3 + timing.finale;
    root.style.setProperty('--opening-duration', `${timing.open}ms`);
    root.style.setProperty('--page-duration', `${timing.page}ms`);
    source = cfg.music?.src || '';
    offset = Math.max(0, Number(cfg.music?.startAt) || 0);
    volume = clamp(cfg.music?.volume,0,1,.65);
    if (source) audio.src = source;
    else { audio.removeAttribute('src'); audio.load(); }
    audio.volume = volume; mute.hidden = !source;
    frames.forEach((frame, index) => {
      const item = cfg.frames?.[index] || {};
      frame.style.setProperty('--photo-position', item.position || '50% 42%');
      frame.setAttribute('aria-label', lyrics[index]);
      frame.querySelectorAll('[data-lyric-image]').forEach(image => {
        image.onerror = () => { image.onerror = null; image.src = frame.dataset.fallbackSrc; };
        image.src = item.src || frame.dataset.fallbackSrc;
        image.alt = image.classList.contains('lyric-photo') ? (item.alt || 'A photo of you') : '';
      });
    });
  }
  function announce(text) { status.textContent = text; }
  function controls() {
    root.dataset.state = running ? phase : (phase === 'closed' || phase === 'ended' ? phase : 'paused');
    root.dataset.phase = phase; root.dataset.playing = String(running);
    play.setAttribute('aria-pressed', String(running));
    const label = running ? 'Pause' : phase === 'ended' ? 'Replay' : phase === 'closed' ? 'Play' : 'Resume';
    $('[data-lyric-play-label]').textContent = label;
    $('.lyric-play-glyph').textContent = running ? 'Ⅱ' : phase === 'ended' ? '↻' : '▶';
    play.setAttribute('aria-label', `${label} our enchanted story`);
    cover.setAttribute('aria-expanded', String(phase !== 'closed')); cover.tabIndex = phase === 'closed' ? 0 : -1;
    cover.setAttribute('aria-hidden', String(phase !== 'closed'));
    finale.setAttribute('aria-hidden', String(phase !== 'finale' && phase !== 'ended'));
  }
  function pageClone(index) {
    const clone = frames[index].cloneNode(true);
    clone.classList.add('turn-clone', 'is-active');
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    return clone;
  }
  function clearTurn() {
    root.classList.remove('is-turning');
    root.removeAttribute('data-turning');
    turnFront.replaceChildren(); turnBack.replaceChildren();
  }
  function stageTurn(from, to) {
    clearTurn();
    turnFront.append(pageClone(from));
    turnBack.append(pageClone(to));
    void turnLeaf.offsetWidth;
    root.dataset.turning = 'true';
    root.classList.add('is-turning');
  }
  function showPage(index, animate = true) {
    if (active === index) return;
    if (animate && active >= 0 && !reduced.matches) {
      stageTurn(active, index);
    }
    active = index; root.dataset.page = String(index);
    frames.forEach((frame, i) => { frame.classList.toggle('is-active', i === index); frame.setAttribute('aria-hidden', String(i !== index || phase !== 'playing')); });
    dots.forEach((dot, i) => { dot.classList.toggle('is-active', i === index); dot.setAttribute('aria-current', String(i === index)); });
    announce(`Page ${index + 1} of 3. ${lyrics[index]}`);
  }
  function render() {
    const next = elapsed >= timing.end ? 'ended' : elapsed >= timing.open + timing.page * 3 ? 'finale' : elapsed >= timing.open ? 'playing' : 'opening';
    if (next !== phase) {
      phase = next;
      if (phase === 'finale' || phase === 'ended') {
        clearTurn(); frames.forEach(frame => frame.setAttribute('aria-hidden', 'true'));
        if (phase === 'finale') announce('iloveyouuu princess steph. These flowers are for you.');
      }
      controls();
    }
    if (phase === 'playing') showPage(Math.min(2, Math.floor((elapsed - timing.open) / timing.page)));
    if (source) audio.volume = volume * (phase === 'finale' ? Math.min(1, Math.max(0, (timing.end - elapsed) / 850)) : 1);
  }
  function nowElapsed(now = performance.now()) { return audioClock && !audio.paused && !audio.ended ? Math.max(0, (audio.currentTime - offset) * 1000) : now - anchor; }
  function tick(now) {
    if (!running) return;
    elapsed = nowElapsed(now); render();
    if (phase === 'ended') {
      running = false; audioClock = false; audio.pause(); generation++;
      controls(); announce('iloveyouuu princess steph. Replay our story whenever you like.'); return;
    }
    raf = requestAnimationFrame(tick);
  }
  function pause() {
    if (!running) return;
    elapsed = nowElapsed(); running = false; generation++; cancelAnimationFrame(raf);
    audioClock = false; audio.pause(); controls();
  }
  function reset() {
    pause(); generation++; audio.pause(); audioClock = false; audioFailed = false;
    elapsed = 0; active = -1; phase = 'closed'; root.classList.remove('is-book-open', 'skip-book-opening'); clearTurn();
    frames.forEach((frame, i) => { frame.classList.toggle('is-active', i === 0); frame.setAttribute('aria-hidden', 'true'); });
    dots.forEach(dot => { dot.classList.remove('is-active'); dot.setAttribute('aria-current', 'false'); });
    audio.volume = volume; controls();
  }
  function startAudio() {
    if (!source || audioFailed) return;
    const token = generation;
    try { audio.currentTime = offset + elapsed / 1000; } catch { /* Metadata applies the seek. */ }
    const attempt = audio.play();
    if (attempt) attempt.then(() => {
      if (token !== generation || !running) { if (!running) audio.pause(); return; }
      audioClock = true;
    }).catch(error => {
      if (token !== generation || !running || error.name === 'AbortError') return;
      audioFailed = true; audioClock = false; anchor = performance.now() - elapsed;
      announce('The song could not play. The story will continue silently; check the selected audio file.');
    });
  }
  function start() {
    if (running) { pause(); return; }
    if (phase === 'ended') { reset(); void cover.offsetWidth; }
    if (phase === 'closed') { phase = 'opening'; root.classList.add('is-book-open'); announce('Opening your enchanted little story.'); }
    if (document.activeElement === cover) play.focus({preventScroll:true});
    running = true; generation++; anchor = performance.now() - elapsed;
    controls(); startAudio(); raf = requestAnimationFrame(tick);
  }
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration) && offset >= audio.duration) { offset = 0; announce('The song starting point was past the end; playing from the beginning.'); }
    try { audio.currentTime = Math.min(offset + elapsed / 1000, Math.max(0, audio.duration - .05)); } catch {}
  });
  audio.addEventListener('ended', () => { audioClock = false; anchor = performance.now() - elapsed; });
  audio.addEventListener('error', () => {
    if (!source) return;
    audioFailed = true; audioClock = false; anchor = performance.now() - elapsed;
    announce('The song could not load. You can still play the story silently.');
  });
  play.addEventListener('click', start); cover.addEventListener('click', start);
  turnLeaf.addEventListener('animationend', event => {
    if (event.animationName === 'realistic-page-turn') clearTurn();
  });
  mute.addEventListener('click', () => {
    audio.muted = !audio.muted; mute.setAttribute('aria-pressed', String(audio.muted));
    mute.setAttribute('aria-label', audio.muted ? 'Unmute story music' : 'Mute story music'); mute.textContent = audio.muted ? '♪ ×' : '♫';
  });
  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    pause(); clearTurn(); elapsed = timing.open + index * timing.page;
    phase = 'playing'; active = -1; root.classList.add('is-book-open', 'skip-book-opening'); showPage(index, false); controls();
    if (source) { try { audio.currentTime = offset + elapsed / 1000; } catch {} }
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); }); observer.observe(root);
  }
  ['scrapbook:lyric-photos-changed','scrapbook:lyric-music-changed'].forEach(event => window.addEventListener(event, () => { reset(); configure(); announce('Your enchanted story is ready. Press Play to begin.'); }));
  configure(); reset();
})();
