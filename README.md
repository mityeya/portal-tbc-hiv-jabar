# 🦠 SI-JABAR Sehat — Portal Sebaran TBC & HIV Jawa Barat

Web aplikasi visualisasi sebaran kasus **TBC** dan **HIV** per kabupaten/kota di Jawa Barat. Dilengkapi peta interaktif, grafik tren, tabel data dengan filter, form pelaporan mandiri faskes, pemesanan kit lab test dengan pembayaran QRIS, login admin, serta panel berita terkini.

> Demo: https://portal-tbc-hiv-jabar.onrender.com/

---

## ✨ Fitur Utama

### Publik
- 🗺️ **Peta sebaran** (Leaflet.js) — marker proporsional terhadap jumlah kasus, filter penyakit & tahun.
- 📈 **Grafik tren** (Chart.js) — tren HIV vs TBC per tahun, dimensi & wilayah dinamis.
- 📊 **Tabel data** — filter penyakit/tahun/wilayah, pencarian, dan pagination.
- 📅 **Filter tahun dinamis per penyakit** — pilihan tahun otomatis mengikuti data (TBC 2019–2025, HIV 2018–2024).
- 📝 **Form pelaporan faskes (CRUD)** — Create, Read, Update, Delete dengan validasi.
- 🧪 **Pemesanan kit lab test** — form pesanan + ringkasan harga + **pembayaran QRIS**.
- 📰 **Berita terkini** — kartu berita TBC/HIV/Umum dengan thumbnail, filter kategori, dan tautan ke artikel.

### Admin
- 🔒 **Login admin** — kelola pesanan, verifikasi pembayaran, ubah status, hapus.

### Pengalaman & Desain
- 🎨 **5 tema warna** (Teal, Indigo, Rose, Amber, Emerald) via 1 tombol dropdown.
- 🌙 **Mode Terang / Gelap** — preferensi tersimpan di browser.
- 📱 **Responsif** — diuji hingga lebar 360px (Flexbox + CSS Grid).
- 🧩 **Logo SVG kustom** + section bertema (tidak putih polos).

---

## 🧱 Teknologi

| Layer | Stack |
|-------|-------|
| Frontend | HTML5, CSS (Flexbox/Grid), Vanilla JS, Leaflet.js, Chart.js, QRCode.js |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Deploy | Render (backend + frontend) — opsional Netlify/Vercel untuk frontend |

---

## 📁 Struktur Proyek

```text
portal-tbc-hiv-jabar/
├── client/                     # Frontend statis
│   ├── index.html              # Beranda: hero, statistik, peta, grafik, tabel (tab)
│   ├── about.html              # Tentang
│   ├── education.html          # Edukasi + Berita terkini
│   ├── lapor.html              # Form pelaporan kasus (CRUD)
│   ├── pesan-kit.html          # Pemesanan kit + QRIS + panel admin
│   ├── login.html              # Login admin
│   ├── assets/                 # Logo & thumbnail (SVG)
│   ├── css/styles.css          # Design system + 5 tema + dark mode
│   └── js/
│       ├── theme.js            # Tema warna + light/dark
│       ├── config.js           # API_BASE_URL
│       ├── api.js              # Wrapper fetch REST
│       ├── ui.js               # Navbar, reveal, helper UI
│       ├── auth.js             # Login admin (localStorage)
│       ├── table.js            # Tabel + filter + pagination
│       ├── charts.js           # Grafik Chart.js
│       ├── map.js              # Peta Leaflet
│       ├── tabs.js             # Tab dashboard (Tabel/Grafik/Peta)
│       └── order.js            # Pemesanan kit + QRIS
└── server/                     # Backend Express + SQLite
    ├── app.js                  # Express app (serve API + client statis, auto-seed)
    ├── package.json
    ├── routes/                 # cases.js, orders.js, berita.js
    ├── controllers/            # casesController, ordersController, beritaController
    ├── db/                     # connection.js, schema.sql, seed.js
    └── data/                   # geo-jabar.json, opendata_jabar.csv
```

---

## 🔌 Ringkasan API

**Cases (data kasus & laporan)**
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/cases` | List + filter (penyakit, tahun, wilayah, q, page, limit) |
| GET | `/api/cases/:id` | Detail satu data |
| POST | `/api/cases` | Tambah laporan |
| PUT | `/api/cases/:id` | Ubah laporan |
| DELETE | `/api/cases/:id` | Hapus laporan |
| GET | `/api/stats/summary` | Ringkasan total |
| GET | `/api/stats/trend` | Tren per tahun |
| GET | `/api/stats/by-region` | Agregat per wilayah (peta) |
| GET | `/api/stats/years?penyakit=` | Daftar tahun yang tersedia (dinamis) |
| GET | `/api/regions` | 27 kab/kota + koordinat |

**Orders (pemesanan kit)**
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/orders` | List pesanan |
| GET | `/api/orders/:id` | Detail pesanan |
| POST | `/api/orders` | Buat pesanan |
| PUT | `/api/orders/:id` | Ubah / verifikasi / ubah status |
| DELETE | `/api/orders/:id` | Hapus pesanan |

**Berita**
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/berita?kategori=&q=` | List berita (filter kategori/cari) |
| GET | `/api/berita/:id` | Detail berita |
| POST | `/api/berita` | Tambah berita |
| PUT | `/api/berita/:id` | Ubah berita |
| DELETE | `/api/berita/:id` | Hapus berita |

---

## ▶️ Menjalankan Lokal

```bash
cd server
npm install
npm run seed     # isi DB dari CSV Open Data Jabar + contoh pesanan & berita
npm start        # server di http://localhost:3000
# Buka http://localhost:3000/index.html (app.js juga menyajikan folder client)
```

Cek cepat API: `http://localhost:3000/api/health` → `{"success":true,"data":"ok"}`.

> Akun admin demo: **admin@sijabar.id** / **admin123**

---

## 🗃️ Sumber Data
[Open Data Provinsi Jawa Barat](https://opendata.jabarprov.go.id) — Dinas Kesehatan:
- Jumlah Kasus HIV per Kabupaten/Kota (2018–2024)
- Jumlah Kasus TBC per Kabupaten/Kota (2019–2025)

Data kasus dibaca dari `server/data/opendata_jabar.csv`. Data **berita** bersifat kurasi contoh (bukan feed live) dan dapat diubah lewat endpoint CRUD `/api/berita`.
