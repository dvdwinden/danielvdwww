// Count book items and update the count dynamically
(function () {
  const bookItems = document.querySelectorAll('.book-item');
  const countElement = document.getElementById('book-count');
  if (countElement && bookItems.length > 0) {
    countElement.textContent = bookItems.length;
    countElement.classList.add('js-loaded');
  }

  // Compute footnote stats from data attributes: genre, language and
  // writer gender (data-gender holds one value per comma-separated author)
  if (bookItems.length > 0) {
    const genres = { fiction: 0, 'non-fiction': 0, poetry: 0 };
    const langs = { nl: 0, en: 0 };
    const writerGender = {};

    bookItems.forEach(item => {
      if (item.dataset.genre in genres) genres[item.dataset.genre]++;
      if (item.dataset.lang in langs) langs[item.dataset.lang]++;

      const authorSpan = item.querySelector('.flex-col > span.italic');
      if (authorSpan && item.dataset.gender) {
        const names = authorSpan.textContent.trim().split(',').map(n => n.trim());
        const genders = item.dataset.gender.split(',');
        names.forEach((name, i) => {
          if (name && genders[i]) writerGender[name] = genders[i];
        });
      }
    });

    const genderCounts = { female: 0, male: 0, 'non-binary': 0 };
    Object.values(writerGender).forEach(g => {
      if (g in genderCounts) genderCounts[g]++;
    });

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set('count-fiction', genres.fiction);
    set('count-non-fiction', genres['non-fiction']);
    set('count-poetry', genres.poetry);
    set('count-writers', Object.keys(writerGender).length);
    set('count-female', genderCounts.female);
    set('count-male', genderCounts.male);
    set('count-nonbinary', genderCounts['non-binary']);
    set('nonbinary-verb', genderCounts['non-binary'] === 1 ? 'is' : 'are');
    set('count-nl', langs.nl);
    set('count-en', langs.en);
  }

  // Count authors and show top 5
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
      topAuthorsElement.textContent = `Since I started keeping this list, the five authors I’ve read most are ${formatted.slice(0, 4).join(', ')} and ${formatted[4]}.`;
    }
  }
})();

// Fiction / non-fiction filter toggle
(function () {
  const filterBtns = document.querySelectorAll('.genre-filter-btn');
  if (!filterBtns.length) return;

  const bookItems = document.querySelectorAll('.book-item');

  function applyFilter(filter) {
    bookItems.forEach(item => {
      const genre = item.dataset.genre;
      if (!genre || genre === filter) {
        item.classList.remove('faded');
      } else {
        item.classList.add('faded');
      }
    });

    // Hide year headings whose entire list is faded
    document.querySelectorAll('h2.text-2xl').forEach(h2 => {
      const ul = h2.nextElementSibling;
      if (!ul || ul.tagName !== 'UL') return;
      const visible = ul.querySelectorAll('.book-item:not(.faded)').length;
      h2.style.display = visible ? '' : 'none';
      ul.style.display = visible ? '' : 'none';
    });
  }

  function clearFilter() {
    bookItems.forEach(item => item.classList.remove('faded'));
    document.querySelectorAll('h2.text-2xl').forEach(h2 => {
      h2.style.display = '';
      const ul = h2.nextElementSibling;
      if (ul) ul.style.display = '';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const isActive = btn.classList.contains('is-active');

      filterBtns.forEach(b => b.classList.remove('is-active'));

      if (isActive) {
        clearFilter();
      } else {
        btn.classList.add('is-active');
        applyFilter(filter);
      }
    });
  });
})();

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
