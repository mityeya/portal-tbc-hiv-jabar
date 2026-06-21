// Wrapper fetch REST API + helper toast + populateRegions + Modal.
const API = (() => {
  const base = () => window.API_BASE_URL;
  async function request(path, options = {}) {
    const res = await fetch(base() + path, { headers: { 'Content-Type': 'application/json' }, ...options });
    let body = null;
    try { body = await res.json(); } catch (_) {}
    if (!res.ok || (body && body.success === false)) {
      const err = new Error('Request gagal'); err.status = res.status; err.data = body && body.error; throw err;
    }
    return body;
  }
  return {
    getSummary: () => request('/stats/summary'),
    getTrend: (q = '') => request('/stats/trend' + q),
    getByRegion: (q = '') => request('/stats/by-region' + q),
    getYears: (q = '') => request('/stats/years' + q),
    getBerita: (qs = '') => request('/berita' + qs),
    getRegions: () => request('/regions'),
    listCases: (qs = '') => request('/cases' + qs),
    getCase: (id) => request('/cases/' + id),
    createCase: (data) => request('/cases', { method: 'POST', body: JSON.stringify(data) }),
    updateCase: (id, data) => request('/cases/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCase: (id) => request('/cases/' + id, { method: 'DELETE' }),
    listOrders: (qs = '') => request('/orders' + qs),
    getOrder: (id) => request('/orders/' + id),
    createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    updateOrder: (id, data) => request('/orders/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    deleteOrder: (id) => request('/orders/' + id, { method: 'DELETE' }),
  };
})();

function ensureToastWrap() {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  return wrap;
}
function toast(message, type = 'success') {
  const wrap = ensureToastWrap();
  const el = document.createElement('div');
  el.className = 'toast ' + type; el.textContent = message;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 320); }, 3200);
}

let _regionCache = null;
async function populateRegions(selectEl, { includeAll = false, allLabel = 'Semua Wilayah' } = {}) {
  if (!selectEl) return;
  try {
    if (!_regionCache) { const res = await API.getRegions(); _regionCache = res.data; }
    selectEl.innerHTML = '';
    if (includeAll) { const o = document.createElement('option'); o.value = ''; o.textContent = allLabel; selectEl.appendChild(o); }
    for (const r of _regionCache) { const o = document.createElement('option'); o.value = r.nama; o.textContent = r.nama; selectEl.appendChild(o); }
  } catch (e) { console.error('Gagal memuat wilayah', e); }
}

// Modal konfirmasi (dibagikan antar halaman)
const Modal = (() => {
  let cb = null;
  function els() {
    return { backdrop: document.querySelector('#confirm-modal'), title: document.querySelector('#confirm-title'),
      msg: document.querySelector('#confirm-message'), ok: document.querySelector('#confirm-ok'), cancel: document.querySelector('#confirm-cancel') };
  }
  function wire() {
    const { backdrop, ok, cancel } = els();
    if (!backdrop || backdrop.dataset.wired) return;
    backdrop.dataset.wired = '1';
    ok && ok.addEventListener('click', () => { if (cb) cb(); });
    cancel && cancel.addEventListener('click', () => api_close());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) api_close(); });
  }
  function api_open(title, message, onConfirm) {
    wire(); const { backdrop, title: t, msg } = els();
    if (!backdrop) return;
    if (t) t.textContent = title || 'Konfirmasi';
    if (msg) msg.textContent = message || '';
    if (onConfirm) cb = onConfirm;
    backdrop.classList.add('show');
  }
  function api_close() { const { backdrop } = els(); if (backdrop) backdrop.classList.remove('show'); }
  return { open: api_open, close: api_close, onConfirm: (fn) => { cb = fn; } };
})();
