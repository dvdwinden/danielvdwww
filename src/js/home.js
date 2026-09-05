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

// Cross-fade through each .figure-cycle's frames. It auto-advances only while
// the figure is on screen and unhovered. The arrows and dots are built from the
// frame count, so adding a frame to the markup is all it takes.
(function () {
  const figures = document.querySelectorAll('.figure-cycle');
  if (!figures.length) return;

  const CYCLE_MS = 3000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const cycles = [];

  figures.forEach(figure => {
    const frames = Array.from(figure.querySelectorAll('.figure-cycle-frame'));
    if (!frames.length) return;

    const frameBox = figure.querySelector('.figure-cycle-frames');
    const dots = [];
    let index = 0;
    let timer = null;
    // Once someone works the controls themselves, stop advancing on our own.
    let manual = false;

    function show(i) {
      index = (i + frames.length) % frames.length;
      frames.forEach((frame, n) => {
        const active = n === index;
        frame.classList.toggle('is-active', active);
        frame.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach((dot, n) => {
        dot.classList.toggle('is-active', n === index);
        dot.setAttribute('aria-current', n === index ? 'true' : 'false');
      });
    }

    function start() {
      if (timer || manual || reduceMotion || frames.length < 2) return;
      timer = setInterval(() => show(index + 1), CYCLE_MS);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function goTo(i) {
      manual = true;
      stop();
      show(i);
    }

    show(0);
    figure.classList.add('is-ready');

    if (frames.length > 1 && frameBox) {
      // Two half-width overlays act as the hit areas. Their own glyph only
      // shows on keyboard focus; for a mouse the arrow follows the pointer.
      [['prev', -1, '\u2190', 'Previous image'],
       ['next', 1, '\u2192', 'Next image']].forEach(([name, delta, glyph, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'figure-cycle-arrow figure-cycle-arrow--' + name;
        button.setAttribute('aria-label', label);
        const mark = document.createElement('span');
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = glyph;
        button.appendChild(mark);
        button.addEventListener('click', () => goTo(index + delta));
        frameBox.appendChild(button);
      });

      if (finePointer) {
        const marker = document.createElement('div');
        marker.className = 'figure-cycle-cursor';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = '\u2192';
        frameBox.appendChild(marker);
        frameBox.classList.add('has-cursor');

        let pending = null;

        frameBox.addEventListener('pointermove', event => {
          if (event.pointerType !== 'mouse') return;
          if (pending) cancelAnimationFrame(pending);
          pending = requestAnimationFrame(() => {
            pending = null;
            const rect = frameBox.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            // Keep the whole disc over the image rather than letting it get
            // clipped against the frame's edges.
            const r = marker.offsetWidth / 2;
            const cx = Math.min(Math.max(x, r), rect.width - r);
            const cy = Math.min(Math.max(y, r), rect.height - r);
            marker.style.transform =
              'translate(' + cx + 'px, ' + cy + 'px) translate(-50%, -50%)';
            marker.textContent = x < rect.width / 2 ? '\u2190' : '\u2192';
          });
        });

        frameBox.addEventListener('pointerenter', event => {
          if (event.pointerType === 'mouse') frameBox.classList.add('is-pointing');
        });

        frameBox.addEventListener('pointerleave', () => {
          if (pending) cancelAnimationFrame(pending);
          pending = null;
          frameBox.classList.remove('is-pointing');
        });
      }

      const dotList = document.createElement('div');
      dotList.className = 'figure-cycle-dots';
      frames.forEach((frame, n) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'figure-cycle-dot';
        dot.setAttribute('aria-label', 'Show image ' + (n + 1) + ' of ' + frames.length);
        dot.addEventListener('click', () => goTo(n));
        dotList.appendChild(dot);
        dots.push(dot);
      });
      figure.appendChild(dotList);
      show(0);

      // Hovering is usually a prelude to clicking, so hold still while it lasts.
      figure.addEventListener('pointerenter', stop);
      figure.addEventListener('pointerleave', start);
      figure.addEventListener('focusin', stop);
      figure.addEventListener('focusout', start);
    }

    cycles.push({ figure, start, stop });
  });

  if (!cycles.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const cycle = cycles.find(c => c.figure === entry.target);
      if (!cycle) return;
      entry.isIntersecting ? cycle.start() : cycle.stop();
    });
  }, { threshold: 0.2 });

  cycles.forEach(c => observer.observe(c.figure));
})();
