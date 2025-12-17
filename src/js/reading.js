// Count book items and update the count dynamically
document.addEventListener('DOMContentLoaded', function () {
  const bookItems = document.querySelectorAll('.book-item');
  const countElement = document.getElementById('book-count');
  if (countElement && bookItems.length > 0) {
    countElement.textContent = bookItems.length;
  }

  // Count authors and show top 3
  const topAuthorsElement = document.getElementById('top-authors');
  if (topAuthorsElement && bookItems.length > 0) {
    const authorCounts = {};

    bookItems.forEach(item => {
      // Author is in the italic span inside .flex-col
      const authorSpan = item.querySelector('.flex-col > span.italic');
      if (authorSpan) {
        const author = authorSpan.textContent.trim();
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      }
    });

    // Sort by count (descending) and get top 5
    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topAuthors.length >= 5) {
      const formatted = topAuthors.map(([name, count]) => `${name} (${count})`);
      topAuthorsElement.textContent = `The five authors I've read most are ${formatted.slice(0, 4).join(', ')} and ${formatted[4]}.`;
    }
  }
});

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
