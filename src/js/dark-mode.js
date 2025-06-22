// Dark mode toggle script
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;

  // Function to update theme color meta tag
  function updateThemeColor() {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }

    // Check if we're in dark mode first
    if (html.classList.contains('dark')) {
      themeColorMeta.content = '#222';
      return;
    }

    // Check the page background class to determine the appropriate theme color
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

  // Update theme color on load
  updateThemeColor();

  toggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
    updateThemeColor();
  });
});