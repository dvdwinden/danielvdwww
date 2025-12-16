// Show book covers on touch devices as you scroll past them
(function () {
  // Only run on touch devices
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouchDevice) return;

  const bookItems = document.querySelectorAll('.book-item');
  let currentVisibleCover = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const bookCover = entry.target.querySelector('.book-cover');

      if (entry.isIntersecting) {
        // Hide previously visible cover
        if (currentVisibleCover && currentVisibleCover !== bookCover) {
          currentVisibleCover.classList.remove('visible');
        }

        // Show this book's cover
        bookCover.classList.add('visible');
        currentVisibleCover = bookCover;
      }
    });
  }, {
    // Trigger when item crosses the first quarter of the viewport
    threshold: 0,
    rootMargin: '-75% 0px'
  });

  bookItems.forEach(item => observer.observe(item));
})();
