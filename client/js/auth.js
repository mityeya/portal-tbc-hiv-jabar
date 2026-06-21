// Auth admin sederhana (demo, sisi-klien) untuk SI-JABAR Sehat.
// Login admin membuka pengelolaan pesanan kit (verifikasi, ubah status, hapus).
// Kredensial demo: admin@sijabar.id / admin123
(function () {
  const KEY = 'si-jabar-auth';
  const DEMO = { email: 'admin@sijabar.id', password: 'admin123', name: 'Admin SI-JABAR' };

  function get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } }
  function isLoggedIn() { return !!get(); }
  function user() { return get(); }
  function login(email, password) {
    if (String(email).trim().toLowerCase() === DEMO.email && String(password) === DEMO.password) {
      localStorage.setItem(KEY, JSON.stringify({ email: DEMO.email, name: DEMO.name, ts: Date.now() }));
      apply();
      return true;
    }
    return false;
  }
  function logout() { localStorage.removeItem(KEY); apply(); }

  function renderNav() {
    const cta = document.querySelector('.nav-cta');
    if (!cta) return;
    let slot = cta.querySelector('.auth-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'auth-slot';
      const sw = cta.querySelector('.theme-switcher');
      cta.insertBefore(slot, sw || null);
    }
    if (isLoggedIn()) {
      const u = user();
      const initial = (u.name || 'A').trim().charAt(0).toUpperCase();
      slot.innerHTML =
        '<div class="auth-chip" title="' + (u.email || '') + '">' +
        '<span class="auth-ava">' + initial + '</span>' +
        '<span class="auth-name">' + (u.name || 'Admin') + '</span>' +
        '<button class="auth-logout" id="auth-logout" aria-label="Keluar">Keluar</button>' +
        '</div>';
      const btn = slot.querySelector('#auth-logout');
      btn && btn.addEventListener('click', logout);
    } else {
      slot.innerHTML = '<a href="login.html" class="auth-login-link">\uD83D\uDD12 Masuk Admin</a>';
    }
  }

  function applyGates() {
    const logged = isLoggedIn();
    document.querySelectorAll('[data-admin-only]').forEach((el) => { el.style.display = logged ? '' : 'none'; });
    document.querySelectorAll('[data-guest-only]').forEach((el) => { el.style.display = logged ? 'none' : ''; });
  }

  function apply() {
    renderNav();
    applyGates();
    document.dispatchEvent(new CustomEvent('auth:change', { detail: { loggedIn: isLoggedIn() } }));
  }

  document.addEventListener('DOMContentLoaded', apply);

  window.Auth = { isLoggedIn, user, login, logout, DEMO, apply };
})();
