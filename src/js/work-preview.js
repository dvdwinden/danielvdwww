// Trema rows borrow the Library's .book-item/.book-cover hover, which is pure
// CSS on pointer devices. Touch devices need the same scroll-driven reveal
// /library gets from library.js, which isn't loaded on the homepage.
(function () {
  if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

  const rows = document.querySelectorAll('.trema-item.book-item');
  if (!rows.length) return;

  let currentCover = null;
  let currentRow = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const cover = entry.target.querySelector('.book-cover');
      if (!cover) return;

      if (currentCover && currentCover !== cover) currentCover.classList.remove('visible');
      if (currentRow && currentRow !== entry.target) currentRow.classList.remove('active');

      cover.classList.add('visible');
      entry.target.classList.add('active');
      currentCover = cover;
      currentRow = entry.target;
    });
  }, {
    threshold: [0, 0.5, 1],
    rootMargin: '-25% 0px -25% 0px'
  });

  rows.forEach(row => observer.observe(row));
})();

// Selected work: cycle through a project's stills while its row is hovered,
// mirroring how book covers appear on /library.
(function () {
  const items = document.querySelectorAll('.work-item');
  if (!items.length) return;

  const CYCLE_MS = 1600;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const controllers = [];

  items.forEach(item => {
    const frames = item.querySelectorAll('.work-preview-frame');
    if (!frames.length) return;

    let index = 0;
    let timer = null;

    const show = i => frames.forEach((frame, n) => frame.classList.toggle('is-active', n === i));

    const start = () => {
      if (timer || reduceMotion || frames.length < 2) return;
      timer = setInterval(() => {
        index = (index + 1) % frames.length;
        show(index);
      }, CYCLE_MS);
    };

    const stop = () => {
      clearInterval(timer);
      timer = null;
      index = 0;
      show(0);
    };

    show(0);
    item.addEventListener('mouseenter', start);
    item.addEventListener('mouseleave', stop);
    item.addEventListener('focusin', start);
    item.addEventListener('focusout', stop);

    controllers.push({ item, preview: item.querySelector('.work-preview'), start, stop });
  });

  // Touch devices: reveal the preview for whichever row is centred in the viewport
  if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  if (!controllers.length) return;

  let current = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const next = controllers.find(c => c.item === entry.target);
      if (!next || next === current) return;

      if (current) {
        current.preview.classList.remove('visible');
        current.item.classList.remove('active');
        current.stop();
      }

      next.preview.classList.add('visible');
      next.item.classList.add('active');
      next.start();
      current = next;
    });
  }, {
    threshold: [0, 0.5, 1],
    rootMargin: '-25% 0px -25% 0px'
  });

  controllers.forEach(c => observer.observe(c.item));
})();
