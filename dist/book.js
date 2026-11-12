(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const book = $('#memory-book');
  const leaf = $('#book-leaf');
  const shadow = $('#book-turn-shadow');
  const pages = window.SCRAPBOOK.pages;
  const motion = window.BookMotion;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 700px)');
  const pageThemes = ['meadow', 'postcard', 'starlight'];
  const pageDetails = [
    { stamp: 'picked for us', doodle: '♡' },
    { stamp: 'love mail', doodle: '✦' },
    { stamp: 'keep this forever', doodle: '∞' }
  ];

  let current = 0;
  let turn = null;
  let raf = 0;
  let viewWidth = innerWidth;
  let mobileView = small.matches;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function decorations(index, side) {
    const detail = pageDetails[index % pageDetails.length];
    const decor = el('div', `page-decor page-decor-${side}`);
    decor.setAttribute('aria-hidden', 'true');
    decor.append(
      el('span', 'page-glow'),
      el('span', 'page-floral'),
      el('span', 'page-bloom'),
      el('span', 'page-corner'),
      el('span', 'page-stamp', detail.stamp),
      el('span', 'page-doodle', detail.doodle)
    );
    ['a', 'b', 'c'].forEach(name => decor.append(el('span', `page-sparkle sparkle-${name}`, '✦')));
    return decor;
  }

  function inlineVideo(clip) {
    const video = document.createElement('video');
    video.className = 'film-video';
    video.src = clip.src;
    video.autoplay = true;
    video.defaultMuted = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.tabIndex = -1;
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    if (clip.poster) video.poster = clip.poster;
    video.addEventListener('loadeddata', () => video.play().catch(() => {}), { once: true });
    return video;
  }

  function card(page, slot) {
    const clip = pages[page].videos[slot];
    const card = el('figure', `film-card film-card-${slot}${slot === 0 ? ' film-featured' : ''}`);
    const frame = el('div', 'film-image');
    card.dataset.video = `${page}:${slot}`;
    card.setAttribute('aria-label', `${clip.title}. ${clip.src ? 'This video plays automatically without sound.' : 'A space saved for another little memory.'}`);

    if (clip.src) {
      frame.append(inlineVideo(clip), el('span', 'film-live-label', 'playing softly'));
    } else {
      frame.classList.add('film-empty');
      frame.append(
        el('span', 'film-slot-number', String(slot + 1).padStart(2, '0')),
        el('span', 'film-empty-note', clip.emptyNote || 'more memories, soon ♡')
      );
    }

    const caption = el('figcaption', 'film-card-caption');
    caption.append(
      el('span', 'film-caption-number', String(slot + 1).padStart(2, '0')),
      el('span', 'film-caption-title', clip.title)
    );
    card.append(frame, caption);
    return card;
  }

  function page(index, side) {
    const theme = pageThemes[index % pageThemes.length];
    const node = el('div', `book-page book-page-${side} page-theme-${theme}`);
    const top = el('div', 'page-topline');
    node.dataset.page = String(index + 1);
    node.dataset.side = side;
    top.append(
      el('span', '', side === 'left' ? 'OUR LITTLE FILMS' : 'A FEW MORE MOMENTS'),
      el('span', '', String(index + 1).padStart(2, '0'))
    );
    node.append(top);

    if (side === 'left') {
      node.append(
        el('h3', 'page-title', pages[index].title),
        card(index, 0),
        el('p', 'handwritten page-note', pages[index].caption)
      );
      const tape = el('span', 'film-tape');
      tape.setAttribute('aria-hidden', 'true');
      node.append(tape);
    } else {
      const pair = el('div', 'film-pair');
      pair.append(card(index, 1), card(index, 2));
      const footer = el('div', 'page-footnote');
      footer.append(el('span', '', 'three little memories'), el('span', 'handwritten', '♡'));
      node.append(pair, footer);
    }

    node.append(decorations(index, side));
    return node;
  }

  function visibleVideos() {
    return book.querySelectorAll('.book-half .film-video');
  }

  function pauseVideos() {
    visibleVideos().forEach(video => video.pause());
  }

  function playVisibleVideos() {
    requestAnimationFrame(() => {
      visibleVideos().forEach(video => {
        video.defaultMuted = true;
        video.muted = true;
        video.play().catch(() => {});
      });
    });
  }

  function render(index) {
    pauseVideos();
    const left = $('#book-left');
    const right = $('#book-right');
    const mobile = small.matches;

    book.classList.toggle('is-mobile-layout', mobile);
    if (mobile) {
      left.replaceChildren(mobilePage(index));
      right.replaceChildren();
    } else {
      left.replaceChildren(page(index, 'left'));
      right.replaceChildren(page(index, 'right'));
    }
    playVisibleVideos();
  }

  function controls() {
    $('#prev-page').disabled = Boolean(turn) || current === 0;
    $('#next-page').disabled = Boolean(turn) || current === pages.length - 1;
    $('#page-number').textContent = `${String(current + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
    book.dataset.currentPage = String(current);
    book.setAttribute('aria-busy', String(Boolean(turn)));
  }

  function mobilePage(index) {
    const theme = pageThemes[index % pageThemes.length];
    const sheet = el('div', `book-page book-page-mobile page-theme-${theme}`);
    const top = el('div', 'page-topline');
    const pair = el('div', 'mobile-film-pair');
    const footer = el('div', 'page-footnote');

    sheet.dataset.page = String(index + 1);
    sheet.dataset.side = 'mobile';
    top.append(
      el('span', '', 'OUR LITTLE FILMS'),
      el('span', '', String(index + 1).padStart(2, '0'))
    );
    pair.append(card(index, 1), card(index, 2));
    footer.append(el('span', '', 'three little memories'), el('span', 'handwritten', '♡'));

    sheet.append(
      top,
      el('h3', 'page-title', pages[index].title),
      card(index, 0),
      el('p', 'handwritten page-note', pages[index].caption),
      pair,
      footer,
      decorations(index, 'mobile')
    );
    return sheet;
  }

  function buildLeaf(front, back, width, height, direction) {
    leaf.replaceChildren();
    const count = small.matches ? 8 : 10;
    const step = width / count;
    const slices = [];
    leaf.style.width = `${width}px`;
    leaf.style.height = `${height}px`;
    leaf.style.left = small.matches ? '0px' : (direction === 1 ? `${width}px` : '0px');

    for (let i = 0; i < count; i += 1) {
      const slice = el('div', 'paper-slice');
      slice.style.width = `${step + 0.35}px`;
      slice.style.transformOrigin = direction === 1 ? 'left center' : 'right center';
      ['front', 'back'].forEach(side => {
        const face = el('div', `paper-face paper-${side}`);
        const content = el('div', 'paper-content');
        content.style.width = `${width}px`;
        content.style.height = `${height}px`;
        const crop = side === 'front' ? (direction === 1 ? i : count - 1 - i) : (direction === 1 ? count - 1 - i : i);
        content.style.left = `${-crop * step}px`;
        content.append((side === 'front' ? front : back).cloneNode(true));
        face.append(content);
        slice.append(face);
      });
      leaf.append(slice);
      slices.push(slice);
    }
    return slices;
  }

  function paint(progress) {
    if (!turn) return;
    turn.progress = motion.clamp(progress, 0, 1);
    motion.paper(turn.progress, turn.direction, turn.width, turn.slices.length).forEach((pose, i) => {
      turn.slices[i].style.transform = `translate3d(${pose.x.toFixed(3)}px,0,${pose.z.toFixed(3)}px) rotateY(${pose.angle.toFixed(3)}deg)`;
      turn.slices[i].style.setProperty('--paper-shade', pose.shade.toFixed(3));
    });
    shadow.style.opacity = String(Math.sin(Math.PI * turn.progress) * 0.65);
  }

  function prepare(next) {
    if (turn || next === current || next < 0 || next >= pages.length) return false;
    pauseVideos();
    const rect = book.getBoundingClientRect();
    const direction = next > current ? 1 : -1;
    const width = small.matches ? rect.width : rect.width / 2;
    let front;
    let back;

    if (small.matches) {
      front = mobilePage(current);
      back = el('div', 'paper-reverse');
      back.append(el('span', 'handwritten', 'our little memories ♡'));
      render(next);
    } else if (direction === 1) {
      front = page(current, 'right');
      back = page(next, 'left');
      $('#book-right').replaceChildren(page(next, 'right'));
    } else {
      front = page(current, 'left');
      back = page(next, 'right');
      $('#book-left').replaceChildren(page(next, 'left'));
    }

    book.style.height = `${rect.height}px`;
    turn = { from: current, to: next, direction, width, progress: 0, slices: buildLeaf(front, back, width, rect.height, direction) };
    leaf.hidden = false;
    book.classList.add('is-turning');
    paint(0);
    controls();
    return true;
  }

  function finish(done) {
    if (!turn) return;
    cancelAnimationFrame(raf);
    current = done ? turn.to : turn.from;
    turn = null;
    render(current);
    leaf.hidden = true;
    leaf.replaceChildren();
    shadow.style.opacity = '0';
    book.classList.remove('is-turning', 'is-dragging');
    book.style.height = '';
    controls();
  }

  function settle(done) {
    if (!turn) return;
    cancelAnimationFrame(raf);
    book.classList.remove('is-dragging');
    if (reduced.matches) {
      finish(done);
      return;
    }

    const active = turn;
    const from = turn.progress;
    const to = done ? 1 : 0;
    const start = performance.now();
    const duration = Math.max(230, Math.abs(to - from) * 980);
    const tick = now => {
      if (turn !== active) return;
      const progress = motion.clamp((now - start) / duration, 0, 1);
      const ease = from === 0 ? (0.5 - 0.5 * Math.cos(Math.PI * progress)) : 1 - Math.pow(1 - progress, 3);
      paint(from + (to - from) * ease);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else finish(done);
    };
    raf = requestAnimationFrame(tick);
  }

  function go(next) {
    if (turn || next < 0 || next >= pages.length || next === current) return;
    if (reduced.matches) {
      current = next;
      render(current);
      controls();
      return;
    }
    if (prepare(next)) settle(true);
  }

  const gesture = bindScrapbookSwipe(book, {
    start: direction => {
      if (!prepare(current + direction)) return false;
      book.classList.add('is-dragging');
      return true;
    },
    move: dx => {
      if (turn) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          if (turn) paint(motion.progress(dx, turn.direction, turn.width));
        });
      }
    },
    end: (dx, velocity) => {
      if (turn) {
        paint(motion.progress(dx, turn.direction, turn.width));
        settle(motion.commit(dx, turn.direction, turn.width, velocity));
      }
    },
    cancel: () => settle(false),
    wheel: direction => go(current + direction)
  });

  $('#prev-page').addEventListener('click', () => go(current - 1));
  $('#next-page').addEventListener('click', () => go(current + 1));
  book.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      go(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  function reset() {
    gesture.cancel();
    cancelAnimationFrame(raf);
    if (turn) finish(false);
    else {
      render(current);
      controls();
    }
  }

  window.addEventListener('resize', () => {
    const modeChanged = small.matches !== mobileView;
    if (innerWidth !== viewWidth || modeChanged) {
      viewWidth = innerWidth;
      mobileView = small.matches;
      reset();
    }
  });
  const syncBreakpoint = event => {
    if (event.matches === mobileView) return;
    mobileView = event.matches;
    viewWidth = innerWidth;
    reset();
  };
  if (small.addEventListener) small.addEventListener('change', syncBreakpoint);
  else small.addListener(syncBreakpoint);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseVideos();
    else playVisibleVideos();
  });
  reduced.addEventListener('change', reset);
  window.addEventListener('scrapbook:videos-changed', () => {
    reset();
  });

  render(current);
  controls();
})();
