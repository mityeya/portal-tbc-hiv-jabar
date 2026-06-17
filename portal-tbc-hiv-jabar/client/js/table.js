// Tab Tabel: filter + search debounce + pagination.
(function () {
  let state = { page: 1, limit: 10, penyakit: '', tahun: '', wilayah: '', q: '' };
  let debounceTimer = null;
  function badge(p) { return `<span class="badge ${p === 'HIV' ? 'badge-hiv' : 'badge-tbc'}">${p}</span>`; }

  async function load() {
    const tbody = document.querySelector('#cases-tbody');
    if (!tbody) return;
    const params = new URLSearchParams();
    params.set('page', state.page); params.set('limit', state.limit);
    if (state.penyakit) params.set('penyakit', state.penyakit);
    if (state.tahun) params.set('tahun', state.tahun);
    if (state.wilayah) params.set('wilayah', state.wilayah);
    if (state.q) params.set('q', state.q);
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Memuat data…</td></tr>`;
    try {
      const res = await API.listCases('?' + params.toString());
      if (!res.data.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Tidak ada data sesuai filter.</td></tr>`;
      } else {
        tbody.innerHTML = res.data.map((r) => `
          <tr>
            <td>${badge(r.penyakit)}</td>
            <td>${r.nama_kabupaten_kota}</td>
            <td>${r.tahun}</td>
            <td class="num-cell">${r.jumlah_kasus.toLocaleString('id-ID')}</td>
            <td>${r.sumber === 'laporan' ? '<span class="badge status-diproses">Laporan</span>' : '<span class="badge status-menunggu">Open Data</span>'}</td>
          </tr>`).join('');
      }
      renderPagination(res.meta);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Gagal memuat data. Pastikan server berjalan.</td></tr>`;
    }
  }

  function renderPagination(meta) {
    const el = document.querySelector('#cases-pagination');
    if (!el || !meta) return;
    el.innerHTML = `
      <button id="prev-page" ${meta.page <= 1 ? 'disabled' : ''}>‹ Sebelumnya</button>
      <span class="page-info">Hal ${meta.page} dari ${meta.totalPages} · ${meta.total} data</span>
      <button id="next-page" ${meta.page >= meta.totalPages ? 'disabled' : ''}>Berikutnya ›</button>`;
    const prev = el.querySelector('#prev-page'); const next = el.querySelector('#next-page');
    prev && prev.addEventListener('click', () => { state.page--; load(); });
    next && next.addEventListener('click', () => { state.page++; load(); });
  }

  function fillYears(sel) {
    if (!sel) return;
    const now = new Date().getFullYear();
    sel.innerHTML = '<option value="">Semua Tahun</option>';
    for (let y = now; y >= 2018; y--) sel.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
  }

  window.initTable = async function () {
    const fP = document.querySelector('#f-penyakit'), fT = document.querySelector('#f-tahun'),
          fW = document.querySelector('#f-wilayah'), fQ = document.querySelector('#f-search');
    fillYears(fT);
    await populateRegions(fW, { includeAll: true });
    fP && fP.addEventListener('change', () => { state.penyakit = fP.value; state.page = 1; load(); });
    fT && fT.addEventListener('change', () => { state.tahun = fT.value; state.page = 1; load(); });
    fW && fW.addEventListener('change', () => { state.wilayah = fW.value; state.page = 1; load(); });
    fQ && fQ.addEventListener('input', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { state.q = fQ.value.trim(); state.page = 1; load(); }, 350); });
    load();
  };
})();
