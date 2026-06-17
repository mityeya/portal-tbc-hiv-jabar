// Konfigurasi base URL API.
// Lokal -> backend Express di localhost:3000.
// Produksi -> ganti dengan URL backend Render/Railway Anda.
window.API_BASE_URL = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:3000/api'
  : 'https://NAMA-BACKEND-ANDA.onrender.com/api';
