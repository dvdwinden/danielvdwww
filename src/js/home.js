// Cross-fade through each .figure-cycle's frames. It auto-advances only while
// the figure is on screen and unhovered. The arrows and dots are built from the
// frame count, so adding a frame to the markup is all it takes.
(function () {
  const figures = document.querySelectorAll('.figure-cycle');
  if (!figures.length) return;

  const CYCLE_MS = 3000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cycles = [];

  // A reveal is a still that draws itself in: a short video laid over the image
  // it ends on, hidden until it can play from its first frame without a wait.
  // Until then the image is the frame, as it is for anyone who has asked for
  // less motion or less data, or whose browser won't play it. Nothing is
  // fetched before the figure is on screen.
  const connection = navigator.connection;
  const canReveal = !reduceMotion && !(connection && connection.saveData);
  const smallScreen = window.matchMedia('(max-width: 767.98px)');

  // One download each, played from memory after that. Left to stream it, a
  // browser goes back to the server every time the frame comes round, and
  // these come round every half minute. A failed fetch leaves the still.
  function warm(frame) {
    const video = frame && frame.querySelector('video[data-reveal]');
    if (!video || !canReveal || video.dataset.warm) return;
    video.dataset.warm = 'true';
    const url = (smallScreen.matches && video.dataset.revealSmall) || video.dataset.reveal;
    fetch(url, { priority: 'low' })
      .then(response => (response.ok ? response.blob() : Promise.reject(response.status)))
      .then(blob => {
        video.preload = 'auto';
        video.src = URL.createObjectURL(blob);
      })
      .catch(() => {});
  }

  function reveal(video, active) {
    if (!active) {
      video.pause();
      return;
    }
    if (!canReveal) return;

    // Decided the moment the frame starts fading in, never part-way: swapping
    // the finished still for an empty first frame in plain sight would flash.
    const ready = video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    video.classList.toggle('is-live', ready);
    if (ready) video.currentTime = 0;
    else warm(video.parentElement);
    if (!video.src) return;

    // Some browsers decode nothing until told to play, so one that isn't ready
    // is played out of sight and stopped again; it is ready the next time round.
    const played = video.play();
    if (!played) return;
    played.then(() => {
      if (!video.classList.contains('is-live')) video.pause();
    }).catch(() => video.classList.remove('is-live'));
  }

  figures.forEach(figure => {
    const frames = Array.from(figure.querySelectorAll('.figure-cycle-frame'));
    if (!frames.length) return;

    const frameBox = figure.querySelector('.figure-cycle-frames');
    const dots = [];
    let index = 0;
    let timer = null;
    // Once someone works the controls themselves, stop advancing on our own.
    let manual = false;
    let inView = false;

    function show(i) {
      index = (i + frames.length) % frames.length;
      frames.forEach((frame, n) => {
        const active = n === index;
        frame.classList.toggle('is-active', active);
        frame.setAttribute('aria-hidden', active ? 'false' : 'true');
        // A frame can hold a video; no point decoding one nobody can see.
        const video = frame.querySelector('video');
        if (video && video.hasAttribute('data-reveal')) {
          reveal(video, active);
        } else if (video) {
          if (active) {
            const played = video.play();
            if (played) played.catch(() => {});
          } else {
            video.pause();
          }
        }
      });
      dots.forEach((dot, n) => {
        dot.classList.toggle('is-active', n === index);
        dot.setAttribute('aria-current', n === index ? 'true' : 'false');
      });
      // Fetch the reveals either side, so they're in hand when their turn comes.
      if (inView) {
        warm(frames[(index + 1) % frames.length]);
        warm(frames[(index - 1 + frames.length) % frames.length]);
      }
    }

    function start() {
      if (timer || manual || reduceMotion || frames.length < 2) return;
      timer = setInterval(() => show(index + 1), CYCLE_MS);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    // Scrolled out of view: hold the frame, and stop any video with it.
    function suspend() {
      inView = false;
      stop();
      frames.forEach(frame => {
        const video = frame.querySelector('video');
        if (video) video.pause();
      });
    }

    function goTo(i) {
      manual = true;
      stop();
      show(i);
    }

    show(0);
    figure.classList.add('is-ready');

    if (frames.length > 1 && frameBox) {
      // Two half-width overlays act as the hit areas. A mouse gets the chevron
      // cursor the photo lightbox uses; this glyph is the keyboard equivalent,
      // shown only on focus.
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

    // Back in view: re-assert the current frame, which restarts its video, then
    // resume advancing.
    function enter() {
      inView = true;
      show(index);
      start();
    }

    cycles.push({ figure, enter, stop, suspend });
  });

  if (!cycles.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const cycle = cycles.find(c => c.figure === entry.target);
      if (!cycle) return;
      entry.isIntersecting ? cycle.enter() : cycle.suspend();
    });
  }, { threshold: 0.2 });

  cycles.forEach(c => observer.observe(c.figure));
})();
