// Toggle tab dashboard (Tabel/Grafik/Peta) tanpa reload + lazy init panel.
(function () {
  const tabbar = document.querySelector('.tabbar');
  if (!tabbar) return;
  const buttons = tabbar.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  const inited = {};
  function activate(name) {
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
    if (!inited[name]) {
      inited[name] = true;
      if (name === 'tabel' && window.initTable) window.initTable();
      if (name === 'grafik' && window.initChart) window.initChart();
      if (name === 'peta' && window.initMap) window.initMap();
    } else {
      if (name === 'peta' && window.refreshMap) window.refreshMap();
    }
  }
  buttons.forEach((b) => b.addEventListener('click', () => activate(b.dataset.tab)));
  activate('tabel');
})();
