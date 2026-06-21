// Pemesanan kit lab test + alur pembayaran QRIS + bukti bayar.
// Pengelolaan pesanan masuk (status/edit/hapus) hanya untuk admin yang login.
(function () {
  const form = document.querySelector('#order-form');
  if (!form) return;

  const HARGA_KIT = { HIV: 75000, TBC: 60000, 'HIV+TBC': 120000 };
  const STATUS = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai'];
  const fields = ['nama_pemesan', 'instansi_faskes', 'jenis_kit', 'jumlah', 'nama_kabupaten_kota', 'alamat_pengiriman', 'kontak', 'catatan'];
  let editingId = null, listState = { status: '', q: '', page: 1, limit: 10 }, debounceTimer = null;
  let pendingPayload = null, buktiData = null;

  const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

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

  // ---- Ringkasan harga otomatis ----
  function updateSummary() {
    const jenis = form.querySelector('[name="jenis_kit"]').value;
    const jumlah = Number(form.querySelector('[name="jumlah"]').value) || 0;
    const harga = HARGA_KIT[jenis] || 0;
    const total = harga * jumlah;
    const sh = document.querySelector('#sum-harga'), sj = document.querySelector('#sum-jumlah'), st = document.querySelector('#sum-total');
    if (sh) sh.textContent = harga ? rupiah(harga) : '\u2014';
    if (sj) sj.textContent = jumlah.toLocaleString('id-ID');
    if (st) st.textContent = rupiah(total);
    return total;
  }

  function resetForm() {
    form.reset(); editingId = null; pendingPayload = null; buktiData = null;
    fields.forEach((f) => setError(f, ''));
    document.querySelector('#order-form-title').textContent = 'Buat Pesanan Kit';
    document.querySelector('#order-submit-btn').textContent = 'Lanjut ke Pembayaran';
    const c = document.querySelector('#order-cancel-edit'); if (c) c.style.display = 'none';
    updateSummary();
  }

  function statusBadge(s) { const cls = { Menunggu: 'status-menunggu', Diproses: 'status-diproses', Dikirim: 'status-dikirim', Selesai: 'status-selesai' }[s] || 'status-menunggu'; return `<span class="badge ${cls}">${s}</span>`; }
  function kitBadge(k) { const cls = k === 'HIV' ? 'badge-hiv' : k === 'TBC' ? 'badge-tbc' : 'status-dikirim'; return `<span class="badge ${cls}">${k}</span>`; }

  // ====== QRIS ======
  function openQris(total) {
    const modal = document.querySelector('#qris-modal');
    const amount = document.querySelector('#qris-amount');
    if (amount) amount.textContent = rupiah(total);
    buktiData = null;
    const prev = document.querySelector('#bukti-preview'); if (prev) { prev.src = ''; prev.style.display = 'none'; }
    const fileInput = document.querySelector('#bukti-input'); if (fileInput) fileInput.value = '';
    setBuktiError('');
    // Buat QR (simulasi QRIS) — payload string sederhana.
    const canvas = document.querySelector('#qris-canvas');
    const payload = `QRIS|SI-JABAR-SEHAT|kit=${pendingPayload.jenis_kit}|qty=${pendingPayload.jumlah}|total=${total}|ts=${Date.now()}`;
    if (canvas && window.QRCode && QRCode.toCanvas) {
      QRCode.toCanvas(canvas, payload, { width: 220, margin: 1, color: { dark: '#0f1e23', light: '#ffffff' } }, (err) => { if (err) console.error(err); });
    }
    modal && modal.classList.add('show');
  }
  function closeQris() { const m = document.querySelector('#qris-modal'); if (m) m.classList.remove('show'); }
  function setBuktiError(msg) { const e = document.querySelector('#err-bukti'); if (e) e.textContent = msg || ''; }

  function compressImage(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900; let { width, height } = img;
        if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
        const c = document.createElement('canvas'); c.width = width; c.height = height;
        c.getContext('2d').drawImage(img, 0, 0, width, height);
        cb(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ---- Daftar pesanan (admin) ----
  async function loadList() {
    const tbody = document.querySelector('#orders-tbody');
    if (!tbody) return;
    const p = new URLSearchParams();
    p.set('page', listState.page); p.set('limit', listState.limit);
    if (listState.status) p.set('status', listState.status);
    if (listState.q) p.set('q', listState.q);
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Memuat\u2026</td></tr>`;
    try {
      const res = await API.listOrders('?' + p.toString());
      if (!res.data.length) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Belum ada pesanan.</td></tr>`; }
      else {
        tbody.innerHTML = res.data.map((o) => `
          <tr>
            <td><strong>${o.nama_pemesan}</strong><div class="muted" style="font-size:.82rem">${o.instansi_faskes || '-'} \u00b7 ${o.kontak}</div></td>
            <td>${kitBadge(o.jenis_kit)}</td>
            <td class="num-cell">${o.jumlah.toLocaleString('id-ID')}</td>
            <td class="num-cell">${rupiah(o.total)}</td>
            <td>${o.nama_kabupaten_kota}</td>
            <td>${statusBadge(o.status)}</td>
            <td><div class="row-actions">
              ${o.bukti_bayar ? `<button class="btn btn-sm btn-ghost" data-bukti="${o.id}" title="Lihat bukti bayar">\uD83E\uDDFE</button>` : ''}
              <button class="btn btn-sm btn-ghost" data-status="${o.id}">Status</button>
              <button class="btn btn-sm btn-ghost" data-edit="${o.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-del="${o.id}">Hapus</button>
            </div></td>
          </tr>`).join('');
        tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => startEdit(b.dataset.edit)));
        tbody.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => askDelete(b.dataset.del)));
        tbody.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => cycleStatus(b.dataset.status)));
        tbody.querySelectorAll('[data-bukti]').forEach((b) => b.addEventListener('click', () => viewBukti(b.dataset.bukti)));
      }
      renderPagination(res.meta);
    } catch (e) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Gagal memuat. Pastikan server berjalan.</td></tr>`; }
  }

  function renderPagination(meta) {
    const el = document.querySelector('#orders-pagination');
    if (!el || !meta) return;
    el.innerHTML = `
      <button id="o-prev" ${meta.page <= 1 ? 'disabled' : ''}>\u2039 Sebelumnya</button>
      <span class="page-info">Hal ${meta.page} dari ${meta.totalPages} \u00b7 ${meta.total} pesanan</span>
      <button id="o-next" ${meta.page >= meta.totalPages ? 'disabled' : ''}>Berikutnya \u203a</button>`;
    const prev = el.querySelector('#o-prev'), next = el.querySelector('#o-next');
    prev && prev.addEventListener('click', () => { listState.page--; loadList(); });
    next && next.addEventListener('click', () => { listState.page++; loadList(); });
  }

  async function viewBukti(id) {
    try { const res = await API.getOrder(id); const b = res.data.bukti_bayar; if (b) { const w = window.open(); if (w) w.document.write(`<title>Bukti Bayar #${id}</title><img src="${b}" style="max-width:100%">`); } else toast('Tidak ada bukti bayar', 'error'); }
    catch (e) { toast('Gagal memuat bukti', 'error'); }
  }

  async function startEdit(id) {
    try {
      const res = await API.getOrder(id); const o = res.data; editingId = o.id;
      fields.forEach((f) => { const el = form.querySelector(`[name="${f}"]`); if (el) el.value = o[f] || ''; });
      updateSummary();
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

  // ---- Submit form ----
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = readForm(); const errors = validate(d);
    fields.forEach((f) => setError(f, errors[f]));
    if (Object.keys(errors).length) { toast('Periksa kembali isian form', 'error'); return; }
    const payload = { nama_pemesan: d.nama_pemesan, instansi_faskes: d.instansi_faskes || null, jenis_kit: d.jenis_kit, jumlah: Number(d.jumlah), nama_kabupaten_kota: d.nama_kabupaten_kota, alamat_pengiriman: d.alamat_pengiriman, kontak: d.kontak, catatan: d.catatan || null };

    // Mode edit (admin) -> simpan langsung tanpa pembayaran.
    if (editingId) {
      try { await API.updateOrder(editingId, payload); toast('Pesanan berhasil diperbarui'); resetForm(); listState.page = 1; loadList(); }
      catch (e) { if (e.data && typeof e.data === 'object') fields.forEach((f) => setError(f, e.data[f])); toast('Gagal menyimpan pesanan', 'error'); }
      return;
    }

    // Pesanan baru -> alur pembayaran QRIS.
    pendingPayload = payload;
    openQris(updateSummary());
  });

  const cancelBtn = document.querySelector('#order-cancel-edit');
  cancelBtn && cancelBtn.addEventListener('click', resetForm);

  (function wireQris() {
    const fileInput = document.querySelector('#bukti-input');
    fileInput && fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) { buktiData = null; return; }
      if (!f.type.startsWith('image/')) { setBuktiError('File harus berupa gambar'); return; }
      setBuktiError('');
      compressImage(f, (dataUrl) => {
        buktiData = dataUrl;
        const prev = document.querySelector('#bukti-preview');
        if (prev) { prev.src = dataUrl; prev.style.display = 'block'; }
      });
    });
    const cancel = document.querySelector('#qris-cancel');
    cancel && cancel.addEventListener('click', closeQris);
    const confirm = document.querySelector('#qris-confirm');
    confirm && confirm.addEventListener('click', async () => {
      if (!buktiData) { setBuktiError('Unggah bukti pembayaran terlebih dahulu'); return; }
      try {
        await API.createOrder({ ...pendingPayload, bukti_bayar: buktiData });
        toast('Pembayaran diterima \u2014 pesanan berhasil dibuat');
        closeQris(); resetForm(); listState.page = 1;
        if (window.Auth && Auth.isLoggedIn()) loadList();
      } catch (e) { toast('Gagal menyimpan pesanan', 'error'); }
    });
    const backdrop = document.querySelector('#qris-modal');
    backdrop && backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeQris(); });
  })();

  // ---- Init ----
  (async function init() {
    await populateRegions(form.querySelector('[name="nama_kabupaten_kota"]'), { includeAll: false });
    const sel = form.querySelector('[name="nama_kabupaten_kota"]');
    if (sel) sel.insertAdjacentHTML('afterbegin', '<option value="" disabled selected>Pilih kabupaten/kota</option>');
    form.querySelector('[name="jenis_kit"]').addEventListener('change', updateSummary);
    form.querySelector('[name="jumlah"]').addEventListener('input', updateSummary);
    updateSummary();

    const fStatus = document.querySelector('#of-status'), fSearch = document.querySelector('#of-search');
    fStatus && fStatus.addEventListener('change', () => { listState.status = fStatus.value; listState.page = 1; loadList(); });
    fSearch && fSearch.addEventListener('input', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { listState.q = fSearch.value.trim(); listState.page = 1; loadList(); }, 350); });

    // Muat daftar hanya bila admin sudah login; perbarui saat status auth berubah.
    function refreshAdminArea() { if (window.Auth && Auth.isLoggedIn()) loadList(); }
    document.addEventListener('auth:change', refreshAdminArea);
    refreshAdminArea();
  })();
})();
