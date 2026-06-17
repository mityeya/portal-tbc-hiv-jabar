// Tab Grafik: line chart Chart.js tren HIV vs TBC per tahun.
(function () {
  let chart = null;
  window.initChart = async function () {
    const canvas = document.querySelector('#trend-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    try {
      const res = await API.getTrend(); const d = res.data;
      if (chart) chart.destroy();
      chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: d.tahun, datasets: [
          { label: 'HIV', data: d.HIV, borderColor: '#e8590c', backgroundColor: 'rgba(232,89,12,.12)', fill: true, tension: .35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#e8590c' },
          { label: 'TBC', data: d.TBC, borderColor: '#1971c2', backgroundColor: 'rgba(25,113,194,.12)', fill: true, tension: .35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#1971c2' },
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: { legend: { labels: { font: { family: 'Inter', size: 14 }, usePointStyle: true, padding: 18 } },
            tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toLocaleString('id-ID')} kasus` } } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString('id-ID') }, grid: { color: '#eef4f3' } }, x: { grid: { display: false } } } },
      });
    } catch (e) {
      const box = canvas.closest('.chart-box');
      if (box) box.innerHTML = '<div class="empty-state">Gagal memuat grafik. Pastikan server berjalan.</div>';
    }
  };
})();
