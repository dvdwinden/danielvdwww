// Dark mode toggle script
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;
  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // The ground is a custom property that follows the `dark` class (see EDGE
  // COLOURS in style.css), so the page, the edge strips and the document
  // backgrounds have already changed. Only the theme-color tag needs telling.
  function updateThemeColor() {
    if (window.edgeColors) window.edgeColors.sync();
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