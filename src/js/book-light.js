// When a cover finishes decoding, scrolls into view or fades in on hover,
// Safari redraws only the image's own rectangle and leaves stale patches of its
// drop-shadow. Changing the filter by an invisible amount for two frames makes
// it redraw the whole shadow. Ported from initCoverRepaint in the Trema theme.
(function () {
  const covers = document.querySelectorAll('.trema-item .book-cover img, ul.newsletter img');
  if (!covers.length) return;

  function repaint(img) {
    img.classList.add('is-repainting');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => img.classList.remove('is-repainting'));
    });
  }

  function repaintWhenDecoded(img) {
    const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    decoded.then(() => repaint(img));
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) repaint(entry.target);
        });
      })
    : null;

  covers.forEach(img => {
    if (observer) observer.observe(img);
    // Also fires again when the browser swaps in a larger srcset candidate
    img.addEventListener('load', () => repaintWhenDecoded(img));
    if (img.complete) repaintWhenDecoded(img);

    // Homepage covers fade in on hover
    const frame = img.closest('.book-cover');
    if (frame) {
      frame.addEventListener('transitionend', event => {
        if (event.propertyName === 'opacity') repaint(img);
      });
    }
  });

  // Web fonts and late images shift the layout, which moves covers after they were drawn
  const repaintAll = () => covers.forEach(repaint);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(repaintAll);
  window.addEventListener('load', repaintAll);
  window.addEventListener('resize', repaintAll);
})();
