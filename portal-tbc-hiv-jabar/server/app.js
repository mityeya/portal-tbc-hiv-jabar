// Express app — Portal TBC & HIV Jawa Barat.
// Menyajikan REST API + folder client/ sebagai static (single-deploy friendly).

const path = require('path');
const express = require('express');
const cors = require('cors');

const casesRoutes = require('./routes/cases');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, data: 'ok' }));

// API routes
app.use('/api', casesRoutes);
app.use('/api', ordersRoutes);

// Sajikan frontend statis (client/) — berguna saat backend & frontend satu host.
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));
app.get('/', (req, res) => res.sendFile(path.join(clientDir, 'index.html')));

// 404 untuk endpoint API yang tidak dikenal
app.use('/api', (req, res) => res.status(404).json({ success: false, error: 'Endpoint tidak ditemukan' }));

// Error handler global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Terjadi kesalahan server' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`API health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
