// Theme switcher: 1 tombol (dropdown) -> 5 pilihan warna + toggle Light/Dark.
// Tersimpan ke localStorage. Diload di semua halaman sebelum ui.js.
(function () {
  const THEMES = ['teal', 'indigo', 'rose', 'amber', 'emerald'];
  const LABELS = { teal: 'Teal', indigo: 'Indigo', rose: 'Rose', amber: 'Amber', emerald: 'Emerald' };
  const SWATCH = { teal: '#0bbf9f', indigo: '#4c6ef5', rose: '#e64980', amber: '#f59f00', emerald: '#16a34a' };
  const KEY = 'si-jabar-theme';
  const MODE_KEY = 'si-jabar-mode';

  function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'teal';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    document.querySelectorAll('.theme-dot').forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.t === theme);
    });
  }

  function applyMode(mode) {
    mode = mode === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem(MODE_KEY, mode);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { mode } }));
    document.querySelectorAll('.mode-toggle').forEach((btn) => {
      btn.textContent = mode === 'dark' ? '\u2600\ufe0f Mode Terang' : '\ud83c\udf19 Mode Gelap';
    });
  }

  function buildSwitcher() {
    const container = document.querySelector('.theme-switcher');
    if (!container) return;
    container.innerHTML = '';

    const trigger = document.createElement('button');
    trigger.className = 'theme-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Pilih tema');
    trigger.textContent = '\ud83c\udfa8';

    const menu = document.createElement('div');
    menu.className = 'theme-menu';

    const title = document.createElement('p');
    title.className = 'theme-menu__title';
    title.textContent = 'Warna Tema';
    menu.appendChild(title);

    const dots = document.createElement('div');
    dots.className = 'theme-dots';
    THEMES.forEach((t) => {
      const dot = document.createElement('button');
      dot.className = 'theme-dot';
      dot.type = 'button';
      dot.dataset.t = t;
      dot.style.setProperty('--swatch', SWATCH[t]);
      dot.title = LABELS[t];
      dot.setAttribute('aria-label', 'Tema ' + LABELS[t]);
      dot.addEventListener('click', () => applyTheme(t));
      dots.appendChild(dot);
    });
    menu.appendChild(dots);

    const sep = document.createElement('div');
    sep.className = 'theme-menu__sep';
    menu.appendChild(sep);

    const modeBtn = document.createElement('button');
    modeBtn.className = 'mode-toggle';
    modeBtn.type = 'button';
    modeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
      applyMode(next);
    });
    menu.appendChild(modeBtn);

    container.appendChild(trigger);
    container.appendChild(menu);

    trigger.addEventListener('click', (e) => { e.stopPropagation(); container.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!container.contains(e.target)) container.classList.remove('open'); });
  }

  // Terapkan sebelum first paint untuk hindari flash.
  const savedTheme = localStorage.getItem(KEY) || 'teal';
  const savedMode = localStorage.getItem(MODE_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-mode', savedMode);

  document.addEventListener('DOMContentLoaded', () => {
    buildSwitcher();
    applyTheme(savedTheme);
    applyMode(savedMode);
  });

  window.setTheme = applyTheme;
  window.setMode = applyMode;
})();
