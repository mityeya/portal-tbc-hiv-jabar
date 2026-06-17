// Theme switcher: 5 pilihan tone warna, tersimpan ke localStorage.
// Diload di semua halaman sebelum ui.js.
(function () {
  const THEMES = ['teal', 'indigo', 'rose', 'amber', 'emerald'];
  const LABELS = { teal: 'Teal (default)', indigo: 'Indigo', rose: 'Rose', amber: 'Amber', emerald: 'Emerald' };
  const KEY = 'si-jabar-theme';

  function apply(theme) {
    if (!THEMES.includes(theme)) theme = 'teal';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll('.theme-dot').forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.t === theme);
      dot.setAttribute('title', LABELS[dot.dataset.t] || dot.dataset.t);
    });
  }

  function buildSwitcher() {
    const container = document.querySelector('.theme-switcher');
    if (!container) return;
    container.innerHTML = '';
    THEMES.forEach((t) => {
      const dot = document.createElement('button');
      dot.className = 'theme-dot';
      dot.dataset.t = t;
      dot.setAttribute('aria-label', 'Tema ' + (LABELS[t] || t));
      dot.addEventListener('click', () => apply(t));
      container.appendChild(dot);
    });
  }

  // Run as soon as DOM is ready — sets theme before first paint.
  const saved = localStorage.getItem(KEY) || 'teal';
  document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', () => {
    buildSwitcher();
    apply(saved);
  });

  // Expose for debugging
  window.setTheme = apply;
})();
