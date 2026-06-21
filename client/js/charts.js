// Tab Grafik interaktif: pilih dimensi (Per Tahun / Per Lokasi), penyakit,
// wilayah, atau tahun. Warna mengikuti tema aktif.
(function () {
  let chart = null, ready = false;
  const $ = (s) => document.querySelector(s);

  function hexToRgba(hex, a) {
    const h = (hex || '').replace('#', '').trim();
    if (h.length !== 6) return hex;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  function themeColors() {
    const css = getComputedStyle(document.documentElement);
    const v = (n, d) => (css.getPropertyValue(n).trim() || d);
    return { hiv: v('--hiv', '#e8590c'), tbc: v('--tbc', '#1971c2'), primary: v('--primary', '#0bbf9f') };
  }

  function syncVisibility() {
    const dim = $('#g-dimensi') ? $('#g-dimensi').value : 'tahun';
    const wrapW = $('#g-wilayah-wrap'), wrapT = $('#g-tahun-wrap');
    if (wrapW) wrapW.style.display = dim === 'tahun' ? '' : 'none';
    if (wrapT) wrapT.style.display = dim === 'lokasi' ? '' : 'none';
  }

  async function fillGYears(penyakit) {
    const sel = $('#g-tahun');
    if (!sel) return;
    const prev = sel.value;
    let years = [];
    try { const res = await API.getYears(penyakit ? ('?penyakit=' + encodeURIComponent(penyakit)) : ''); years = res.data || []; } catch (_) {}
    sel.innerHTML = '';
    years.forEach((y) => { const o = document.createElement('option'); o.value = y; o.textContent = y; sel.appendChild(o); });
    if (prev && years.map(String).includes(String(prev))) sel.value = prev;
  }

  async function buildControls() {
    if (ready) return;
    ready = true;
    await populateRegions($('#g-wilayah'), { includeAll: true, allLabel: 'Semua Wilayah (Jabar)' });
    await fillGYears($('#g-penyakit') ? $('#g-penyakit').value : '');
    ['g-dimensi', 'g-wilayah', 'g-tahun'].forEach((id) => {
      const el = document.getElementById(id);
      el && el.addEventListener('change', render);
    });
    const gp = $('#g-penyakit');
    gp && gp.addEventListener('change', async () => { await fillGYears(gp.value); render(); });
  }

  async function configTahun() {
    const peny = $('#g-penyakit').value;
    const wil = $('#g-wilayah').value;
    const res = await API.getTrend(wil ? ('?wilayah=' + encodeURIComponent(wil)) : '');
    const d = res.data, col = themeColors(), ds = [];
    if (peny === '' || peny === 'HIV') ds.push({ label: 'HIV', data: d.HIV, borderColor: col.hiv, backgroundColor: hexToRgba(col.hiv, .12), fill: true, tension: .35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: col.hiv });
    if (peny === '' || peny === 'TBC') ds.push({ label: 'TBC', data: d.TBC, borderColor: col.tbc, backgroundColor: hexToRgba(col.tbc, .12), fill: true, tension: .35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: col.tbc });
    return { type: 'line', labels: d.tahun, datasets: ds };
  }

  async function configLokasi() {
    const peny = $('#g-penyakit').value;
    const tahun = $('#g-tahun').value;
    const p = new URLSearchParams();
    if (peny) p.set('penyakit', peny);
    if (tahun) p.set('tahun', tahun);
    const res = await API.getByRegion('?' + p.toString());
    const rows = res.data.slice().sort((a, b) => b.total - a.total);
    const col = themeColors();
    const c = peny === 'HIV' ? col.hiv : peny === 'TBC' ? col.tbc : col.primary;
    return {
      type: 'bar',
      labels: rows.map((r) => r.nama_kabupaten_kota),
      datasets: [{ label: (peny || 'HIV+TBC') + (tahun ? ' \u00b7 ' + tahun : ''), data: rows.map((r) => r.total), backgroundColor: hexToRgba(c, .78), borderColor: c, borderWidth: 1.5, borderRadius: 6 }],
    };
  }

  async function render() {
    const canvas = $('#trend-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    syncVisibility();
    const box = canvas.closest('.chart-box');
    try {
      const dim = $('#g-dimensi') ? $('#g-dimensi').value : 'tahun';
      const cfg = dim === 'lokasi' ? await configLokasi() : await configTahun();
      const horizontal = cfg.type === 'bar';
      if (chart) { chart.destroy(); chart = null; }
      chart = new Chart(canvas.getContext('2d'), {
        type: cfg.type,
        data: { labels: cfg.labels, datasets: cfg.datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: horizontal ? 'y' : 'x',
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { font: { family: 'Inter', size: 13 }, usePointStyle: true, padding: 16 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Number(horizontal ? ctx.parsed.x : ctx.parsed.y).toLocaleString('id-ID')} kasus` } },
          },
          scales: {
            x: { beginAtZero: horizontal, ticks: horizontal ? { callback: (v) => Number(v).toLocaleString('id-ID') } : {}, grid: { display: horizontal ? true : false, color: '#eef4f3' } },
            y: { beginAtZero: !horizontal, ticks: !horizontal ? { callback: (v) => Number(v).toLocaleString('id-ID') } : {}, grid: { color: '#eef4f3' } },
          },
        },
      });
      if (horizontal) { canvas.parentElement.style.height = Math.max(420, cfg.labels.length * 26) + 'px'; }
      else { canvas.parentElement.style.height = '420px'; }
    } catch (e) {
      if (box) box.innerHTML = '<div class="empty-state">Gagal memuat grafik. Pastikan server berjalan.</div>';
    }
  }

  window.initChart = async function () { await buildControls(); render(); };

  // Warna grafik ikut berubah saat tema diganti.
  document.addEventListener('themechange', () => { if (chart) render(); });
})();
