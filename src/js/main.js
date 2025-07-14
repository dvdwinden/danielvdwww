document.addEventListener('DOMContentLoaded', function () {
  initializeDarkMode(); 
  initializeHeaderScroll();
});

function initializeDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;

  // Update theme colour meta tag
  function updateThemeColor() {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }

    // Check if dark mode is on
    if (html.classList.contains('dark')) {
      themeColorMeta.content = '#222';
      return;
    }

    // Check the page background class to determine the appropriate theme colour
    const pageBackground = document.getElementById('page-background');
    if (pageBackground) {
      const backgroundClasses = pageBackground.className;

      if (backgroundClasses.includes('bg-stone')) {
        themeColorMeta.content = '#e8e6e0'; // Stone background
      } else if (backgroundClasses.includes('bg-blue')) {
        themeColorMeta.content = '#f5f7fa'; // Blue background
      } else if (backgroundClasses.includes('bg-green')) {
        themeColorMeta.content = '#e8f0e8'; // Green background
      } else {
        // Default fallback
        themeColorMeta.content = '#f5f7fa';
      }
    } else {
      // Fallback if page-background element doesn't exist
      themeColorMeta.content = '#f5f7fa';
    }
  }

  // On load, set mode based on current preference
  if (localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Update theme colour on load
  updateThemeColor();

  toggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
    updateThemeColor();
  });
}

function initializeHeaderScroll() {
  const header = document.querySelector('header');
  let lastScrollTop = 0;
  let scrollThreshold = 10; 
  let isScrolling = false;
  let scrollTimeout;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function handleScroll() {
    if (!isMobile() || !header) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDifference = Math.abs(currentScrollTop - lastScrollTop);

    // Only trigger if scroll difference is significant
    if (scrollDifference < scrollThreshold) return;

    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Add scrolling class for immediate visual feedback
    if (!isScrolling) {
      isScrolling = true;
      header.classList.add('scrolling');
    }

    // Determine scroll direction
    if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
      // Scrolling down - hide header
      header.classList.add('header-hidden');
      header.classList.remove('header-visible');
    } else if (currentScrollTop < lastScrollTop) {
      // Scrolling up - show header
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
    }

    lastScrollTop = currentScrollTop;

    // Set timeout to remove scrolling class after scroll stops
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      header.classList.remove('scrolling');
    }, 150);
  }

  // Throttle scroll events for better performance
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  // Add scroll event listener
  window.addEventListener('scroll', requestTick, { passive: true });

  // Handle resize events to reset header state
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      // Reset header state on desktop
      header.classList.remove('header-hidden', 'header-visible', 'scrolling');
    }
  });

  // Initialize header state
  if (isMobile()) {
    header.classList.add('header-visible');
  }
}
