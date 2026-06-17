# 🦠 SI-JABAR Sehat — Portal Sebaran TBC & HIV Jawa Barat

Portal visualisasi epidemiologi penyebaran **TBC** dan **HIV** di Provinsi Jawa Barat. Dibangun sebagai **MVP** untuk Tugas Besar Pengembangan Web (Kelas Bisnis Digital 2024, FEB UNPAD).

Live demo: _(isi setelah deploy)_ · Backend API: _(isi setelah deploy)_

---

## ✨ Fitur

- **Dashboard 3 tab** (tanpa reload):
  - **Tabel** — filter penyakit/tahun/wilayah + pencarian (debounce) + pagination.
  - **Grafik** — line chart tren HIV vs TBC per tahun (Chart.js).
  - **Peta** — sebaran kasus per kab/kota dengan `circleMarker` proporsional (Leaflet.js + OpenStreetMap).
- **Strip statistik** ringkasan (Total HIV, Total TBC, Jumlah Wilayah, Tahun Terbaru).
- **Form Pelaporan Kasus (CRUD)** mandiri oleh faskes — validasi client-side, edit, hapus (modal konfirmasi), toast.
- **Form Pemesanan Kit Lab Test (CRUD)** — badge status, filter & pencarian, ubah status, edit, hapus.
- Halaman **About** & **Education** (gejala, pencegahan, FAQ accordion).
- **Desain premium ala Atomic Health** — responsif penuh (diuji 360px), scroll-reveal, navbar sticky + hamburger drawer.

## 🧱 Tech Stack

| Layer    | Teknologi |
|----------|-----------|
| Frontend | HTML5, CSS murni (Flexbox/Grid), **Vanilla JavaScript**, Leaflet.js, Chart.js (CDN), Google Fonts |
| Backend  | Node.js + Express |
| Database | SQLite via `better-sqlite3` (WAL mode) |
| Deploy   | Frontend → Netlify/Vercel · Backend → Render/Railway |

## 📂 Struktur

```
portal-tbc-hiv-jabar/
├── client/                 # Frontend statis (deploy ke Netlify/Vercel)
│   ├── index.html about.html education.html lapor.html pesan-kit.html
│   ├── css/styles.css
│   └── js/ config.js api.js ui.js tabs.js map.js charts.js table.js form.js order.js
└── server/                 # Backend (deploy ke Render/Railway)
    ├── app.js package.json .env.example
    ├── routes/ cases.js orders.js
    ├── controllers/ casesController.js ordersController.js
    ├── db/ connection.js schema.sql seed.js
    └── data/ geo-jabar.json   # 27 kab/kota + centroid
```

## 🚀 Menjalankan Lokal

```bash
cd server
npm install        # (atau: pnpm install)
npm run seed       # isi DB: cases (HIV 2018-2024 + TBC 2019-2025) + contoh kit_orders
npm start          # server di http://localhost:3000
```

Buka **http://localhost:3000/index.html** (Express juga menyajikan folder `client/`).

### Verifikasi cepat
- `GET /api/health` → `{"success":true,"data":"ok"}`
- `GET /api/stats/summary` → angka total
- `GET /api/orders` → contoh pesanan

## 🔌 Struktur REST API

Format response: `{ success: true, data, meta? }` atau `{ success: false, error }`.

**Kasus & Statistik**
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| GET | `/api/health` | Status server |
| GET | `/api/regions` | 27 kab/kota + koordinat |
| GET | `/api/cases` | List + filter (`penyakit,tahun,wilayah,q,page,limit`) |
| GET | `/api/cases/:id` | Detail |
| POST | `/api/cases` | Tambah (sumber `laporan`) |
| PUT | `/api/cases/:id` | Ubah |
| DELETE | `/api/cases/:id` | Hapus |
| GET | `/api/stats/summary` | Ringkasan |
| GET | `/api/stats/trend` | Agregat per tahun & penyakit |
| GET | `/api/stats/by-region` | Agregat per wilayah + lat/lng |

**Pemesanan Kit Lab Test**
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| GET | `/api/orders` | List + filter (`status,q,page,limit`) |
| GET | `/api/orders/:id` | Detail |
| POST | `/api/orders` | Buat (status default `Menunggu`) |
| PUT | `/api/orders/:id` | Ubah / update status |
| DELETE | `/api/orders/:id` | Hapus |

## 🗃️ Sumber Data

Mengacu pada **Open Data Provinsi Jawa Barat — Dinas Kesehatan**. Pada MVP ini data bersifat **ilustratif (mock)**. Tersedia blok importer CSV resmi di `server/db/seed.js` (header: `penyakit,nama_kabupaten_kota,jumlah_kasus,tahun`) agar mudah diganti ke data asli.

## ☁️ Deployment

### Backend → Render
1. Push repo ke GitHub.
2. Render → New → **Web Service** → hubungkan repo.
3. **Root Directory:** `server` · **Build:** `npm install && npm run seed` · **Start:** `npm start`.
4. **Environment:** `DB_PATH=/tmp/data.db` (writable di Render free). Catat URL backend.
5. Catatan: SQLite di Render free bersifat *ephemeral* — cukup untuk demo MVP.

### Frontend → Netlify / Vercel
1. Edit `client/js/config.js` → ganti `https://NAMA-BACKEND-ANDA.onrender.com/api` dengan URL backend Render.
2. Netlify: drag-drop folder `client/` (atau Publish directory = `client`). Vercel: Root Directory = `client`.
3. Pastikan `cors()` aktif di backend (sudah default).

> Alternatif single-deploy: Express sudah menyajikan `client/` sebagai statis, jadi backend di Render bisa langsung membuka seluruh situs di `/`.

## 📜 Lisensi
MIT — untuk keperluan edukasi/akademik.
