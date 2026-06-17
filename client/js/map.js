// Tab Peta: Leaflet circleMarker proporsional jumlah kasus + filter.
(function () {
  let map = null, layer = null;
  async function draw() {
    if (!map) return;
    const fP = document.querySelector('#m-penyakit'), fT = document.querySelector('#m-tahun');
    const params = new URLSearchParams();
    if (fP && fP.value) params.set('penyakit', fP.value);
    if (fT && fT.value) params.set('tahun', fT.value);
    const qs = params.toString() ? '?' + params.toString() : '';
    try {
      const res = await API.getByRegion(qs);
      if (layer) map.removeLayer(layer);
      layer = L.layerGroup().addTo(map);
      const max = Math.max(1, ...res.data.map((r) => r.total));
      res.data.forEach((r) => {
        const radius = 8 + (r.total / max) * 28;
        const color = (fP && fP.value === 'HIV') ? '#e8590c' : (fP && fP.value === 'TBC') ? '#1971c2' : '#0bbf9f';
        L.circleMarker([r.lat, r.lng], { radius, color, weight: 1.5, fillColor: color, fillOpacity: .45 })
          .bindPopup(`<strong>${r.nama_kabupaten_kota}</strong><br>${r.total.toLocaleString('id-ID')} kasus`).addTo(layer);
      });
    } catch (e) { console.error('Gagal memuat peta', e); }
  }
  function fillYears(sel) {
    if (!sel) return;
    const now = new Date().getFullYear();
    sel.innerHTML = '<option value="">Semua Tahun</option>';
    for (let y = now; y >= 2018; y--) sel.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
  }
  window.initMap = function () {
    const el = document.querySelector('#map');
    if (!el || typeof L === 'undefined') return;
    map = L.map('map', { scrollWheelZoom: false }).setView([-6.95, 107.65], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
    const fP = document.querySelector('#m-penyakit'), fT = document.querySelector('#m-tahun');
    fillYears(fT);
    if (fT) fT.value = String(new Date().getFullYear() - 1);
    fP && fP.addEventListener('change', draw);
    fT && fT.addEventListener('change', draw);
    setTimeout(() => { map.invalidateSize(); draw(); }, 60);
  };
  window.refreshMap = function () { if (map) setTimeout(() => map.invalidateSize(), 60); };
})();
