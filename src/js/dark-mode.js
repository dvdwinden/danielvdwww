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

    const pageBackground = document.getElementById('page-background');
    let backgroundColor = '#ededea'; // Default fallback (bg-blue)

    if (html.classList.contains('dark')) {
      // Matches html.dark #page-background in style.css
      backgroundColor = '#23211e';
    } else if (pageBackground) {
      // Check the page background class to determine the appropriate theme color
      const backgroundClasses = pageBackground.className;

      if (backgroundClasses.includes('bg-stone')) {
        backgroundColor = '#e8e6e0';
      } else if (backgroundClasses.includes('bg-blue')) {
        backgroundColor = '#ededea';
      } else if (backgroundClasses.includes('bg-green')) {
        backgroundColor = '#e3e7df';
      } else if (backgroundClasses.includes('bg-amber')) {
        backgroundColor = '#efe9e2';
      } else if (backgroundClasses.includes('bg-beige')) {
        backgroundColor = '#fcf8e8';
      } else if (backgroundClasses.includes('bg-cream')) {
        backgroundColor = '#faf6e8';
      } else if (backgroundClasses.includes('bg-red')) {
        backgroundColor = '#fae8e8';
      } else if (backgroundClasses.includes('bg-purple')) {
        backgroundColor = '#faf0f5';
      }
    }

    // Set both theme-color meta tag and html background color
    themeColorMeta.content = backgroundColor;
    html.style.backgroundColor = backgroundColor;
  }

  // Safari 26 ignores theme-color and tints its toolbar from the fixed
  // background layer, sampled on load. Changing that layer's colour later
  // leaves the toolbar on the old theme; a fixed layer appearing makes Safari
  // sample again. So hide it for one rendered frame and bring it back. The
  // html background behind it is the new colour by then, so nothing visibly
  // changes: the wait outlasts the 0.25s delay on .dark in style.css.
  let retintTimer;
  function retintToolbar() {
    const pageBackground = document.getElementById('page-background');
    if (!pageBackground) return;
    clearTimeout(retintTimer);
    retintTimer = setTimeout(() => {
      pageBackground.style.display = 'none';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pageBackground.style.display = '';
        });
      });
    }, 500);
  }

  // Some pages are dark by design and carry no toggle. Leave the class the
  // inline head script set and don't consult the stored preference, which
  // would otherwise switch this page back to light on load.
  if (html.dataset.forceDark === 'true') {
    html.classList.add('dark');
    updateThemeColor();
    return;
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
      retintToolbar();
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
    retintToolbar();
  });
});