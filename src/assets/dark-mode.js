// Dark mode toggle script
const toggle = document.getElementById('dark-mode-toggle');
const html = document.documentElement;
const darkIcon = document.getElementById('dark-icon');
const lightIcon = document.getElementById('light-icon');

// On load, set icon based on current mode
if (localStorage.theme === 'dark' ||
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  html.classList.add('dark');
  darkIcon.classList.add('hidden');
  lightIcon.classList.remove('hidden');
} else {
  html.classList.remove('dark');
  darkIcon.classList.remove('hidden');
  lightIcon.classList.add('hidden');
}

toggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  const isDark = html.classList.contains('dark');
  localStorage.theme = isDark ? 'dark' : 'light';
  darkIcon.classList.toggle('hidden', isDark);
  lightIcon.classList.toggle('hidden', !isDark);
}); 