// Dark mode toggle script
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;
  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Function to update theme color meta tag and html background color
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
      html.style.backgroundColor = '#222';
      return;
    }

    // Check the page background class to determine the appropriate theme color
    const pageBackground = document.getElementById('page-background');
    let backgroundColor = '#f5f7fa'; // Default fallback

    if (pageBackground) {
      const backgroundClasses = pageBackground.className;

      if (backgroundClasses.includes('bg-stone')) {
        backgroundColor = '#e8e6e0'; // Stone background
      } else if (backgroundClasses.includes('bg-blue')) {
        backgroundColor = '#f5f7fa'; // Blue background
      } else if (backgroundClasses.includes('bg-green')) {
        backgroundColor = '#e8f0e8'; // Green background
      } else if (backgroundClasses.includes('bg-amber')) {
        backgroundColor = '#fef0e8'; // Amber background
      } else if (backgroundClasses.includes('bg-beige')) {
        backgroundColor = '#fcf8e8'; // Beige background
      } else if (backgroundClasses.includes('bg-cream')) {
        backgroundColor = '#faf6e8'; // Cream background
      } else if (backgroundClasses.includes('bg-red')) {
        backgroundColor = '#fae8e8'; // Red background
      } else if (backgroundClasses.includes('bg-purple')) {
        backgroundColor = '#faf0f5'; // Purple background
      }
    }

    // Set both theme-color meta tag and html background color
    themeColorMeta.content = backgroundColor;
    html.style.backgroundColor = backgroundColor;
  }

  // Apply the appropriate theme
  function applyTheme() {
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme === 'dark') {
      html.classList.add('dark');
    } else if (storedTheme === 'light') {
      html.classList.remove('dark');
    } else {
      // No stored preference - follow system
      if (systemDarkQuery.matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
    updateThemeColor();
  }

  // Apply theme on load
  applyTheme();

  // Listen for system preference changes (only applies when no manual override)
  systemDarkQuery.addEventListener('change', () => {
    if (!localStorage.getItem('theme')) {
      applyTheme();
    }
  });

  // Toggle cycles: system -> light -> dark -> system
  toggle.addEventListener('click', () => {
    const storedTheme = localStorage.getItem('theme');
    const isDark = html.classList.contains('dark');

    if (!storedTheme) {
      // Currently following system, switch to opposite of current state
      if (isDark) {
        localStorage.setItem('theme', 'light');
      } else {
        localStorage.setItem('theme', 'dark');
      }
    } else if (storedTheme === 'light') {
      localStorage.setItem('theme', 'dark');
    } else {
      // Was dark, go back to system
      localStorage.removeItem('theme');
    }

    applyTheme();
  });
});