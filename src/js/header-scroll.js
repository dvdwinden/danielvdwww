// Header scroll behavior script
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header');
  if (!header) return;

  let lastScrollTop = 0;
  let scrollThreshold = 5; // Reduced threshold for more responsive hiding
  let ticking = false;

  // Only apply on mobile devices
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Handle scroll events
  function handleScroll() {
    if (!isMobile()) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Prevent negative values on iOS overscroll
    if (currentScrollTop < 0) return;

    const scrollDifference = Math.abs(currentScrollTop - lastScrollTop);

    // Only trigger if scroll difference is significant
    if (scrollDifference < scrollThreshold) return;

    // Determine scroll direction
    if (currentScrollTop > lastScrollTop && currentScrollTop > 80) {
      // Scrolling down - hide header
      header.classList.add('header-hidden');
      header.classList.remove('header-visible');
    } else if (currentScrollTop < lastScrollTop) {
      // Scrolling up - show header
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
    }

    // Show header at very top of page
    if (currentScrollTop <= 0) {
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
    }

    lastScrollTop = currentScrollTop;
  }

  // Throttle scroll events for better performance
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
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!isMobile()) {
        // Reset header state on desktop
        header.classList.remove('header-hidden', 'header-visible');
        lastScrollTop = 0;
      } else {
        // Reinitialize on mobile
        header.classList.remove('header-hidden');
        header.classList.add('header-visible');
        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      }
    }, 150);
  });

  // Initialize header state
  if (isMobile()) {
    header.classList.add('header-visible');
  }
});
