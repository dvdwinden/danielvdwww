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

    if (html.classList.contains('dark')) {
      themeColorMeta.content = '#222';
    } else {
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