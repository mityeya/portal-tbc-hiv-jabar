// CRUD pemesanan kit lab test (pesan-kit.html) + validasi + filter + modal + toast.
(function () {
  const form = document.querySelector('#order-form');
  if (!form) return;
  let editingId = null, listState = { status: '', q: '', page: 1, limit: 10 }, debounceTimer = null;
  const STATUS = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai'];
  const fields = ['nama_pemesan', 'instansi_faskes', 'jenis_kit', 'jumlah', 'nama_kabupaten_kota', 'alamat_pengiriman', 'kontak', 'catatan'];

  function setError(name, msg) {
    const input = form.querySelector(`[name="${name}"]`), errEl = form.querySelector(`#err-${name}`);
    if (input) input.classList.toggle('invalid', !!msg);
    if (errEl) errEl.textContent = msg || '';
  }
  function readForm() { const d = {}; fields.forEach((f) => { const el = form.querySelector(`[name="${f}"]`); d[f] = el ? el.value.trim() : ''; }); return d; }
  function validate(d) {
    const e = {};
    if (!d.nama_pemesan) e.nama_pemesan = 'Nama pemesan wajib diisi';
    if (!['HIV', 'TBC', 'HIV+TBC'].includes(d.jenis_kit)) e.jenis_kit = 'Pilih jenis kit';
    if (!d.jumlah || isNaN(d.jumlah) || Number(d.jumlah) <= 0 || !Number.isInteger(Number(d.jumlah))) e.jumlah = 'Jumlah harus bilangan bulat > 0';
    if (!d.nama_kabupaten_kota) e.nama_kabupaten_kota = 'Pilih kabupaten/kota';
    if (!d.alamat_pengiriman) e.alamat_pengiriman = 'Alamat pengiriman wajib diisi';
    if (!d.kontak) e.kontak = 'Kontak wajib diisi';
    return e;
  }
  function resetForm() {
    form.reset(); editingId = null; fields.forEach((f) => setError(f, ''));
    document.querySelector('#order-form-title').textContent = 'Buat Pesanan Kit';
    document.querySelector('#order-submit-btn').textContent = 'Kirim Pesanan';
    const c = document.querySelector('#order-cancel-edit'); if (c) c.style.display = 'none';
  }
  function statusBadge(s) { const cls = { Menunggu: 'status-menunggu', Diproses: 'status-diproses', Dikirim: 'status-dikirim', Selesai: 'status-selesai' }[s] || 'status-menunggu'; return `<span class="badge ${cls}">${s}</span>`; }
  function kitBadge(k) { const cls = k === 'HIV' ? 'badge-hiv' : k === 'TBC' ? 'badge-tbc' : 'status-dikirim'; return `<span class="badge ${cls}">${k}</span>`; }

  async function loadList() {
    const tbody = document.querySelector('#orders-tbody');
    if (!tbody) return;
    const p = new URLSearchParams();
    p.set('page', listState.page); p.set('limit', listState.limit);
    if (listState.status) p.set('status', listState.status);
    if (listState.q) p.set('q', listState.q);
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Memuat…</td></tr>`;
    try {
      const res = await API.listOrders('?' + p.toString());
      if (!res.data.length) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Belum ada pesanan.</td></tr>`; }
      else {
        tbody.innerHTML = res.data.map((o) => `
          <tr>
            <td><strong>${o.nama_pemesan}</strong><div class="muted" style="font-size:.82rem">${o.instansi_faskes || '-'}</div></td>
            <td>${kitBadge(o.jenis_kit)}</td>
            <td class="num-cell">${o.jumlah.toLocaleString('id-ID')}</td>
            <td>${o.nama_kabupaten_kota}</td>
            <td>${statusBadge(o.status)}</td>
            <td>${o.kontak}</td>
            <td><div class="row-actions">
              <button class="btn btn-sm btn-ghost" data-status="${o.id}">Status</button>
              <button class="btn btn-sm btn-ghost" data-edit="${o.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-del="${o.id}">Hapus</button>
            </div></td>
          </tr>`).join('');
        tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => startEdit(b.dataset.edit)));
        tbody.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => askDelete(b.dataset.del)));
        tbody.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => cycleStatus(b.dataset.status)));
      }
      renderPagination(res.meta);
    } catch (e) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Gagal memuat. Pastikan server berjalan.</td></tr>`; }
  }

  function renderPagination(meta) {
    const el = document.querySelector('#orders-pagination');
    if (!el || !meta) return;
    el.innerHTML = `
      <button id="o-prev" ${meta.page <= 1 ? 'disabled' : ''}>‹ Sebelumnya</button>
      <span class="page-info">Hal ${meta.page} dari ${meta.totalPages} · ${meta.total} pesanan</span>
      <button id="o-next" ${meta.page >= meta.totalPages ? 'disabled' : ''}>Berikutnya ›</button>`;
    const prev = el.querySelector('#o-prev'), next = el.querySelector('#o-next');
    prev && prev.addEventListener('click', () => { listState.page--; loadList(); });
    next && next.addEventListener('click', () => { listState.page++; loadList(); });
  }

  async function startEdit(id) {
    try {
      const res = await API.getOrder(id); const o = res.data; editingId = o.id;
      fields.forEach((f) => { const el = form.querySelector(`[name="${f}"]`); if (el) el.value = o[f] || ''; });
      document.querySelector('#order-form-title').textContent = 'Edit Pesanan Kit';
      document.querySelector('#order-submit-btn').textContent = 'Perbarui Pesanan';
      const c = document.querySelector('#order-cancel-edit'); if (c) c.style.display = 'inline-flex';
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) { toast('Gagal memuat pesanan', 'error'); }
  }

  async function cycleStatus(id) {
    try {
      const res = await API.getOrder(id); const cur = res.data.status;
      const next = STATUS[(STATUS.indexOf(cur) + 1) % STATUS.length];
      Modal.open('Ubah status pesanan?', `Status akan diubah dari "${cur}" menjadi "${next}".`, async () => {
        try { await API.updateOrder(id, { status: next }); toast(`Status diperbarui menjadi ${next}`); loadList(); }
        catch (e) { toast('Gagal mengubah status', 'error'); }
        Modal.close();
      });
    } catch (e) { toast('Gagal memuat pesanan', 'error'); }
  }

  function askDelete(id) {
    Modal.open('Hapus pesanan ini?', 'Tindakan ini tidak dapat dibatalkan.', async () => {
      try { await API.deleteOrder(id); toast('Pesanan berhasil dihapus'); loadList(); }
      catch (e) { toast('Gagal menghapus pesanan', 'error'); }
      Modal.close();
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = readForm(); const errors = validate(d);
    fields.forEach((f) => setError(f, errors[f]));
    if (Object.keys(errors).length) { toast('Periksa kembali isian form', 'error'); return; }
    const payload = { nama_pemesan: d.nama_pemesan, instansi_faskes: d.instansi_faskes || null, jenis_kit: d.jenis_kit, jumlah: Number(d.jumlah), nama_kabupaten_kota: d.nama_kabupaten_kota, alamat_pengiriman: d.alamat_pengiriman, kontak: d.kontak, catatan: d.catatan || null };
    try {
      if (editingId) { await API.updateOrder(editingId, payload); toast('Pesanan berhasil diperbarui'); }
      else { await API.createOrder(payload); toast('Pesanan berhasil dibuat'); }
      resetForm(); listState.page = 1; loadList();
    } catch (e) { if (e.data && typeof e.data === 'object') fields.forEach((f) => setError(f, e.data[f])); toast('Gagal menyimpan pesanan', 'error'); }
  });
  const cancelBtn = document.querySelector('#order-cancel-edit');
  cancelBtn && cancelBtn.addEventListener('click', resetForm);

  (async function init() {
    await populateRegions(form.querySelector('[name="nama_kabupaten_kota"]'), { includeAll: false });
    const sel = form.querySelector('[name="nama_kabupaten_kota"]');
    if (sel) sel.insertAdjacentHTML('afterbegin', '<option value="" disabled selected>Pilih kabupaten/kota</option>');
    const fStatus = document.querySelector('#of-status'), fSearch = document.querySelector('#of-search');
    fStatus && fStatus.addEventListener('change', () => { listState.status = fStatus.value; listState.page = 1; loadList(); });
    fSearch && fSearch.addEventListener('input', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { listState.q = fSearch.value.trim(); listState.page = 1; loadList(); }, 350); });
    loadList();
  })();
})();
