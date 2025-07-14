// Header scroll behavior script
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header');
  let lastScrollTop = 0;
  let scrollThreshold = 10; // Minimum scroll distance to trigger hide/show
  let isScrolling = false;
  let scrollTimeout;

  // Only apply on mobile devices
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Handle scroll events
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
}); 