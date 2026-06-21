// CRUD form pelaporan kasus (lapor.html) + validasi client-side + modal + toast.
(function () {
  const form = document.querySelector('#case-form');
  if (!form) return;
  let editingId = null, pendingDeleteId = null;
  const fields = ['penyakit', 'nama_kabupaten_kota', 'jumlah_kasus', 'tanggal', 'catatan', 'pelapor', 'kontak'];
  const CURRENT_YEAR = new Date().getFullYear();

  function setError(name, msg) {
    const input = form.querySelector(`[name="${name}"]`), errEl = form.querySelector(`#err-${name}`);
    if (input) input.classList.toggle('invalid', !!msg);
    if (errEl) errEl.textContent = msg || '';
  }
  function validate(d) {
    const e = {};
    if (!['HIV', 'TBC'].includes(d.penyakit)) e.penyakit = 'Pilih jenis penyakit';
    if (!d.nama_kabupaten_kota) e.nama_kabupaten_kota = 'Pilih kabupaten/kota';
    if (d.jumlah_kasus === '' || isNaN(d.jumlah_kasus) || Number(d.jumlah_kasus) < 0 || !Number.isInteger(Number(d.jumlah_kasus))) e.jumlah_kasus = 'Jumlah harus bilangan bulat ≥ 0';
    if (!d.tanggal) e.tanggal = 'Tanggal wajib diisi';
    else { const y = Number(String(d.tanggal).slice(0, 4)); if (!/^\d{4}-\d{2}-\d{2}$/.test(d.tanggal) || y < 2018 || y > CURRENT_YEAR) e.tanggal = `Tanggal harus di rentang 2018–${CURRENT_YEAR}`; }
    if (!d.kontak) e.kontak = 'Kontak pelapor wajib diisi'; else if (d.kontak.length < 5) e.kontak = 'Kontak tidak valid (min. 5 karakter)';
    return e;
  }
  function readForm() { const d = {}; fields.forEach((f) => { const el = form.querySelector(`[name="${f}"]`); d[f] = el ? el.value.trim() : ''; }); return d; }
  function resetForm() {
    form.reset(); editingId = null; fields.forEach((f) => setError(f, ''));
    document.querySelector('#form-title').textContent = 'Tambah Laporan Kasus';
    document.querySelector('#submit-btn').textContent = 'Simpan Laporan';
    const c = document.querySelector('#cancel-edit'); if (c) c.style.display = 'none';
  }
  function badge(p) { return `<span class="badge ${p === 'HIV' ? 'badge-hiv' : 'badge-tbc'}">${p}</span>`; }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function fmtTanggal(r) { if (r.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(r.tanggal)) { const [y, m, d] = r.tanggal.split('-'); return `${d}/${m}/${y}`; } return r.tahun || '-'; }

  async function loadList() {
    const tbody = document.querySelector('#reports-tbody');
    if (!tbody) return;
    if (window.Auth && !Auth.isLoggedIn()) { tbody.innerHTML = ''; return; }
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Memuat…</td></tr>`;
    try {
      const res = await API.listCases('?limit=100');
      const rows = res.data.filter((r) => r.sumber === 'laporan');
      if (!rows.length) { tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Belum ada laporan. Tambahkan lewat form di atas.</td></tr>`; return; }
      tbody.innerHTML = rows.map((r) => `
        <tr>
          <td>${badge(r.penyakit)}</td>
          <td>${r.nama_kabupaten_kota}</td>
          <td>${fmtTanggal(r)}</td>
          <td class="num-cell">${r.jumlah_kasus.toLocaleString('id-ID')}</td>
          <td>${r.pelapor || '-'}</td>
          <td>${r.kontak ? esc(r.kontak) : '-'}</td>
          <td class="muted note-cell">${r.catatan ? esc(r.catatan) : '-'}</td>
          <td><div class="row-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${r.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-del="${r.id}">Hapus</button>
          </div></td>
        </tr>`).join('');
      tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => startEdit(b.dataset.edit)));
      tbody.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => askDelete(b.dataset.del)));
    } catch (e) { tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Gagal memuat. Pastikan server berjalan.</td></tr>`; }
  }

  async function startEdit(id) {
    try {
      const res = await API.getCase(id); const r = res.data; editingId = r.id;
      form.querySelector('[name="penyakit"]').value = r.penyakit;
      form.querySelector('[name="nama_kabupaten_kota"]').value = r.nama_kabupaten_kota;
      form.querySelector('[name="jumlah_kasus"]').value = r.jumlah_kasus;
      form.querySelector('[name="tanggal"]').value = r.tanggal || '';
      form.querySelector('[name="catatan"]').value = r.catatan || '';
      form.querySelector('[name="pelapor"]').value = r.pelapor || '';
      form.querySelector('[name="kontak"]').value = r.kontak || '';
      document.querySelector('#form-title').textContent = 'Edit Laporan Kasus';
      document.querySelector('#submit-btn').textContent = 'Perbarui Laporan';
      const c = document.querySelector('#cancel-edit'); if (c) c.style.display = 'inline-flex';
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) { toast('Gagal memuat data', 'error'); }
  }
  function askDelete(id) { pendingDeleteId = id; Modal.open('Hapus laporan ini?', 'Tindakan ini tidak dapat dibatalkan.'); }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = readForm(); const errors = validate(data);
    fields.forEach((f) => setError(f, errors[f]));
    if (Object.keys(errors).length) { toast('Periksa kembali isian form', 'error'); return; }
    const payload = { penyakit: data.penyakit, nama_kabupaten_kota: data.nama_kabupaten_kota, jumlah_kasus: Number(data.jumlah_kasus), tanggal: data.tanggal, catatan: data.catatan || null, pelapor: data.pelapor || null, kontak: data.kontak || null };
    try {
      if (editingId) { await API.updateCase(editingId, payload); toast('Laporan berhasil diperbarui'); }
      else { await API.createCase(payload); toast('Laporan berhasil ditambahkan'); }
      resetForm(); loadList();
    } catch (e) { if (e.data && typeof e.data === 'object') fields.forEach((f) => setError(f, e.data[f])); toast('Gagal menyimpan laporan', 'error'); }
  });
  const cancelBtn = document.querySelector('#cancel-edit');
  cancelBtn && cancelBtn.addEventListener('click', resetForm);

  Modal.onConfirm(async () => {
    if (!pendingDeleteId) return;
    try { await API.deleteCase(pendingDeleteId); toast('Laporan berhasil dihapus'); loadList(); }
    catch (e) { toast('Gagal menghapus', 'error'); }
    pendingDeleteId = null; Modal.close();
  });

  (async function init() {
    await populateRegions(form.querySelector('[name="nama_kabupaten_kota"]'), { includeAll: false });
    const sel = form.querySelector('[name="nama_kabupaten_kota"]');
    if (sel) sel.insertAdjacentHTML('afterbegin', '<option value="" disabled selected>Pilih kabupaten/kota</option>');
    const tgl = form.querySelector('[name="tanggal"]');
    if (tgl) tgl.max = new Date().toISOString().slice(0, 10);
    loadList();
    document.addEventListener('auth:change', () => loadList());
  })();
})();
