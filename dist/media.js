(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const urls = [];
  const edit = new URLSearchParams(location.search).get('edit') === '1';
  const editor = $('#media-editor');
  const videoPicker = $('#preview-videos');
  const photoPicker = $('#preview-photos');
  const lyricPicker = $('#preview-lyric-photos');
  const musicPicker = $('#preview-lyric-music');
  const musicStart = $('#preview-music-start');
  const pageSeconds = $('#preview-page-seconds');
  const status = $('#editor-status');

  if (!editor || !videoPicker || !photoPicker || !lyricPicker || !status) return;
  editor.hidden = !edit;
  if (musicStart) musicStart.value = window.SCRAPBOOK.lyricReel?.music?.startAt || 0;
  if (pageSeconds) pageSeconds.value = (window.SCRAPBOOK.lyricReel?.duration || 3800) / 1000;
  let songURL;

  const objectURL = file => {
    const url = URL.createObjectURL(file);
    urls.push(url);
    return url;
  };

  videoPicker.addEventListener('change', event => {
    const files = [...event.target.files].filter(file => file.type.startsWith('video/')).slice(0, 9);
    files.forEach((file, index) => {
      const clip = window.SCRAPBOOK.pages[Math.floor(index / 3)].videos[index % 3];
      clip.src = objectURL(file);
    });
    status.textContent = `${files.length} videos are ready and will autoplay silently in the book. These previews last until you reload this tab.`;
    window.dispatchEvent(new CustomEvent('scrapbook:videos-changed'));
    event.target.value = '';
  });

  photoPicker.addEventListener('change', event => {
    const files = [...event.target.files].filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    window.SCRAPBOOK.photos = files.map((file, index) => ({
      src: objectURL(file),
      alt: `Our photo ${index + 1}`,
      caption: `a moment to keep. ${String(index + 1).padStart(2, '0')}`
    }));
    status.textContent = `${files.length} photos are ready to preview. These previews last until you reload this tab.`;
    window.dispatchEvent(new CustomEvent('scrapbook:photos-changed'));
    event.target.value = '';
  });

  lyricPicker.addEventListener('change', event => {
    const files = [...event.target.files].filter(file => file.type.startsWith('image/')).slice(0, 3);
    if (!files.length) return;
    const defaults = [
      { src: 'assets/bouquet.png', alt: 'Our first lyric-reel photo', caption: 'She looks just like a dream' },
      { src: 'assets/cafe.png', alt: 'Our second lyric-reel photo', caption: "The prettiest girl I've ever seen" },
      { src: 'assets/sunset.png', alt: 'Our third lyric-reel photo', caption: 'From the cover of a magazine' }
    ];
    const reel = window.SCRAPBOOK.lyricReel || {};
    const frames = Array.from({ length: 3 }, (_, index) => ({ ...(defaults[index]), ...(reel.frames?.[index] || {}) }));
    files.forEach((file, index) => {
      frames[index] = { ...frames[index], src: objectURL(file), alt: `Lyric reel photo ${index + 1}` };
    });
    window.SCRAPBOOK.lyricReel = { ...reel, frames };
    status.textContent = `${files.length} lyric-reel photo${files.length === 1 ? ' is' : 's are'} ready to preview. These previews last until you reload this tab.`;
    window.dispatchEvent(new CustomEvent('scrapbook:lyric-photos-changed'));
    event.target.value = '';
  });

  musicPicker?.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const previousURL = songURL;
    songURL = objectURL(file);
    const reel = window.SCRAPBOOK.lyricReel;
    reel.music = { ...reel.music, src: songURL };
    window.dispatchEvent(new CustomEvent('scrapbook:lyric-music-changed'));
    if (previousURL) URL.revokeObjectURL(previousURL);
    status.textContent = `Your song is ready. Press Play on the enchanted book to hear it. This preview lasts until you refresh.`;
    event.target.value = '';
  });
  musicStart?.addEventListener('change', () => {
    const seconds = Math.max(0, Number(musicStart.value) || 0);
    musicStart.value = seconds;
    window.SCRAPBOOK.lyricReel.music.startAt = seconds;
    window.dispatchEvent(new CustomEvent('scrapbook:lyric-music-changed'));
  });
  pageSeconds?.addEventListener('change', () => {
    const seconds = Math.min(30, Math.max(1.8, Number(pageSeconds.value) || 3.8));
    pageSeconds.value = seconds;
    window.SCRAPBOOK.lyricReel.duration = seconds * 1000;
    window.dispatchEvent(new CustomEvent('scrapbook:lyric-music-changed'));
  });
  window.addEventListener('unload', () => urls.forEach(url => URL.revokeObjectURL(url)));
})();
