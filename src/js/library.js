// Count book items and update the count dynamically
document.addEventListener('DOMContentLoaded', function () {
  const bookItems = document.querySelectorAll('.book-item');
  const countElement = document.getElementById('book-count');
  if (countElement && bookItems.length > 0) {
    countElement.textContent = bookItems.length;
    countElement.classList.add('js-loaded');
  }

  // Count authors and show top 3
  const topAuthorsElement = document.getElementById('top-authors');
  if (topAuthorsElement && bookItems.length > 0) {
    const authorBooks = {};

    bookItems.forEach(item => {
      // Author is in the italic span inside .flex-col
      const authorSpan = item.querySelector('.flex-col > span.italic');
      const bookLink = item.querySelector('.flex-col a');
      if (authorSpan && bookLink) {
        const author = authorSpan.textContent.trim();
        const bookTitle = bookLink.textContent.trim();

        // Initialize author's book set if needed
        if (!authorBooks[author]) {
          authorBooks[author] = new Set();
        }

        // Add book title to author's set (automatically handles duplicates)
        authorBooks[author].add(bookTitle);
      }
    });

    // Convert Sets to counts and sort
    const authorCounts = Object.entries(authorBooks).map(([author, books]) => [author, books.size]);
    const topAuthors = authorCounts
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topAuthors.length >= 5) {
      const formatted = topAuthors.map(([name, count]) => `${name} (${count})`);
      topAuthorsElement.textContent = `Since I started keeping this list, the five authors I've read most are ${formatted.slice(0, 4).join(', ')} and ${formatted[4]}.`;
    }
  }
});

// Show book covers on touch devices as you scroll past them
document.addEventListener('DOMContentLoaded', function () {
  // Only run on touch devices
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouchDevice) return;

  const bookItems = document.querySelectorAll('.book-item');
  if (bookItems.length === 0) return;

  let currentVisibleCover = null;
  let currentActiveItem = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const bookCover = entry.target.querySelector('.book-cover');
      if (!bookCover) return;

      const bookItem = entry.target;

      if (entry.isIntersecting) {
        // Hide previously visible cover and remove active state
        if (currentVisibleCover && currentVisibleCover !== bookCover) {
          currentVisibleCover.classList.remove('visible');
        }
        if (currentActiveItem && currentActiveItem !== bookItem) {
          currentActiveItem.classList.remove('active');
        }

        // Show this book's cover and mark item as active
        bookCover.classList.add('visible');
        bookItem.classList.add('active');
        currentVisibleCover = bookCover;
        currentActiveItem = bookItem;
      }
    });
  }, {
    // Trigger when item is in the center 50% of viewport
    threshold: [0, 0.5, 1],
    rootMargin: '-25% 0px -25% 0px'
  });

  bookItems.forEach(item => observer.observe(item));
});
