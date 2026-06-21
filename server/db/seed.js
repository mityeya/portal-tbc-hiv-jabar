// Seed database: baca CSV Open Data Jabar sebagai sumber utama,
// lalu isi contoh pesanan kit lab test.
//
// Bisa dipakai 2 cara:
//   1) CLI: `npm run seed`  -> reset penuh (force) lalu isi ulang.
//   2) Otomatis saat server start (dipanggil dari app.js) -> hanya mengisi
//      jika tabel `cases` masih KOSONG. Ini penting untuk Render free yang
//      filesystem-nya ephemeral (mis. /tmp), supaya data selalu ada.

const fs = require('fs');
const path = require('path');
const db = require('./connection');

const regions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'geo-jabar.json'), 'utf-8')
);
const codeByName = new Map(regions.map((r) => [r.nama, r.kode_kabupaten_kota]));

// ========================================================
// SUMBER UTAMA: CSV Open Data Jabar
// File: server/data/opendata_jabar.csv
// Header: penyakit,nama_kabupaten_kota,jumlah_kasus,tahun
// Untuk mengganti dengan data asli terbaru: cukup ganti file CSV
// dan jalankan ulang: npm run seed
// ========================================================
const CSV_PATH = path.join(__dirname, '..', 'data', 'opendata_jabar.csv');

function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const [header, ...lines] = raw.split(/\r?\n/);
  const cols = header.split(',').map((c) => c.trim());
  const idx = (name) => cols.indexOf(name);

  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const f = line.split(',');
    const penyakit = f[idx('penyakit')].trim().toUpperCase();
    const nama = f[idx('nama_kabupaten_kota')].trim().toUpperCase();
    const jumlah = parseInt(f[idx('jumlah_kasus')].trim(), 10);
    const tahun = parseInt(f[idx('tahun')].trim(), 10);
    rows.push({
      penyakit,
      kode_kabupaten_kota: codeByName.get(nama) || null,
      nama_kabupaten_kota: nama,
      jumlah_kasus: jumlah,
      satuan: 'ORANG',
      tahun,
      pelapor: null,
      sumber: 'opendata',
    });
  }
  return rows;
}

const sampleOrders = [
  { nama_pemesan: 'dr. Sari Wulandari', instansi_faskes: 'Puskesmas Cibeunying', jenis_kit: 'HIV', jumlah: 50, nama_kabupaten_kota: 'KOTA BANDUNG', alamat_pengiriman: 'Jl. Padjadjaran No. 10, Bandung', kontak: '081234567890', status: 'Diproses', catatan: 'Untuk skrining bulanan' },
  { nama_pemesan: 'Ahmad Fauzi', instansi_faskes: 'RSUD Cibinong', jenis_kit: 'TBC', jumlah: 120, nama_kabupaten_kota: 'KABUPATEN BOGOR', alamat_pengiriman: 'Jl. KSR Dadi Kusmayadi, Cibinong', kontak: 'logistik@rsudcibinong.go.id', status: 'Dikirim', catatan: null },
  { nama_pemesan: 'dr. Maya Putri', instansi_faskes: 'Klinik Sehat Bersama', jenis_kit: 'HIV+TBC', jumlah: 30, nama_kabupaten_kota: 'KOTA DEPOK', alamat_pengiriman: 'Jl. Margonda Raya No. 88, Depok', kontak: '082199887766', status: 'Menunggu', catatan: 'Mohon segera diproses' },
  { nama_pemesan: 'Budi Santoso', instansi_faskes: 'Puskesmas Garut Kota', jenis_kit: 'TBC', jumlah: 75, nama_kabupaten_kota: 'KABUPATEN GARUT', alamat_pengiriman: 'Jl. Ahmad Yani No. 5, Garut', kontak: '085711223344', status: 'Selesai', catatan: null },
  { nama_pemesan: 'dr. Rina Hartati', instansi_faskes: 'RS Mitra Keluarga', jenis_kit: 'HIV', jumlah: 40, nama_kabupaten_kota: 'KOTA BEKASI', alamat_pengiriman: 'Jl. Ahmad Yani, Bekasi', kontak: 'rina.h@mitra.co.id', status: 'Menunggu', catatan: 'Pengiriman pagi hari' },
];

// ========================================================
// Berita terkini TBC & HIV di Jawa Barat (kurasi data contoh).
// Catatan: ini DATASET CONTOH yang di-seed, bukan feed berita live.
// Untuk memperbarui: ubah array ini lalu `npm run seed`, atau pakai
// endpoint CRUD POST/PUT/DELETE /api/berita.
// ========================================================
const sampleBerita = [
  { judul: 'Dinkes Jabar Perkuat Skrining TBC di 27 Kabupaten/Kota', ringkasan: 'Pemerintah Provinsi Jawa Barat menargetkan penemuan kasus TBC lebih dini lewat skrining aktif berbasis komunitas dan puskesmas pada 2025.', kategori: 'TBC', sumber: 'Dinkes Jabar', tanggal: '2025-03-18', url: 'https://dinkes.jabarprov.go.id/berita/skrining-aktif-tbc-27-kabupaten-kota-2025', gambar: 'assets/news-tbc.svg' },
  { judul: 'Layanan Tes HIV Gratis Diperluas ke Puskesmas Daerah', ringkasan: 'Akses tes HIV gratis kini tersedia di lebih banyak puskesmas Jawa Barat untuk menjangkau populasi berisiko dan mengurangi stigma.', kategori: 'HIV', sumber: 'Kemenkes RI', tanggal: '2025-02-05', url: 'https://www.kemkes.go.id/id/rilis-kesehatan/layanan-tes-hiv-gratis-puskesmas-daerah', gambar: 'assets/news-hiv.svg' },
  { judul: 'Kolaborasi TBC-HIV: Pasien Ko-infeksi Jadi Prioritas', ringkasan: 'Program kolaborasi TBC-HIV menekankan pemeriksaan silang agar pasien dengan ko-infeksi mendapat pengobatan terpadu lebih cepat.', kategori: 'Umum', sumber: 'WHO Indonesia', tanggal: '2025-01-22', url: 'https://www.who.int/indonesia/news/tb-hiv-collaboration-co-infection', gambar: 'assets/news-umum.svg' },
  { judul: 'Peringatan Hari TBC Sedunia 2025 di Bandung', ringkasan: 'Hari TBC Sedunia 2025 diperingati dengan kampanye edukasi publik dan ajakan menuntaskan pengobatan hingga sembuh total.', kategori: 'TBC', sumber: 'Dinkes Kota Bandung', tanggal: '2025-03-24', url: 'https://dinkes.bandung.go.id/berita/hari-tbc-sedunia-2025', gambar: 'assets/news-tbc.svg' },
  { judul: 'Edukasi Pencegahan HIV Menyasar Generasi Muda', ringkasan: 'Kampanye pencegahan HIV menyasar remaja dan dewasa muda melalui sekolah dan media sosial untuk menekan kasus baru di Jawa Barat.', kategori: 'HIV', sumber: 'KPA Jawa Barat', tanggal: '2024-12-01', url: 'https://www.aidsindonesia.or.id/berita/edukasi-pencegahan-hiv-generasi-muda', gambar: 'assets/news-hiv.svg' },
  { judul: 'Notifikasi Kasus TBC Jabar Meningkat Berkat Pelacakan Aktif', ringkasan: 'Angka notifikasi kasus TBC naik signifikan seiring penguatan pelacakan kontak dan pemanfaatan data digital kesehatan.', kategori: 'TBC', sumber: 'Open Data Jabar', tanggal: '2024-10-14', url: 'https://opendata.jabarprov.go.id/informasi/notifikasi-kasus-tbc-meningkat-pelacakan-aktif', gambar: 'assets/news-tbc.svg' },
];

// Seed berita berdiri sendiri: dijalankan walau tabel cases sudah terisi,
// supaya fitur baru tetap punya data di DB lama. Idempoten (hanya saat kosong).
function seedBeritaIfEmpty({ force = false } = {}) {
  if (force) {
    db.exec('DELETE FROM berita;');
    db.exec("DELETE FROM sqlite_sequence WHERE name = 'berita';");
  }
  const n = db.prepare('SELECT COUNT(*) AS n FROM berita').get().n;
  if (n > 0) return;
  const insertBerita = db.prepare(`
    INSERT INTO berita (judul, ringkasan, kategori, sumber, tanggal, url, gambar)
    VALUES (@judul, @ringkasan, @kategori, @sumber, @tanggal, @url, @gambar)
  `);
  db.transaction((rows) => {
    for (const r of rows) insertBerita.run({ url: null, gambar: null, sumber: null, ...r });
  })(sampleBerita);
  console.log('[seed]   berita    :', sampleBerita.length, 'baris');
}

function runSeed({ force = false } = {}) {
  seedBeritaIfEmpty({ force });
  const existing = db.prepare('SELECT COUNT(*) AS n FROM cases').get().n;
  if (existing > 0 && !force) {
    console.log(`[seed] DB sudah berisi ${existing} kasus — lewati seed.`);
    return;
  }

  // ---- Reset (idempoten) ----
  db.exec('DELETE FROM cases; DELETE FROM kit_orders;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('cases','kit_orders');");

  const insertCase = db.prepare(`
    INSERT INTO cases (penyakit, kode_kabupaten_kota, nama_kabupaten_kota, jumlah_kasus, satuan, tahun, pelapor, sumber)
    VALUES (@penyakit, @kode_kabupaten_kota, @nama_kabupaten_kota, @jumlah_kasus, @satuan, @tahun, @pelapor, @sumber)
  `);
  const caseRows = loadCsv(CSV_PATH);
  db.transaction((rows) => { for (const r of rows) insertCase.run(r); })(caseRows);

  const HARGA_KIT = { HIV: 75000, TBC: 60000, 'HIV+TBC': 120000 };
  const insertOrder = db.prepare(`
    INSERT INTO kit_orders (nama_pemesan, instansi_faskes, jenis_kit, jumlah, nama_kabupaten_kota, alamat_pengiriman, kontak, status, catatan, harga_satuan, total, bukti_bayar)
    VALUES (@nama_pemesan, @instansi_faskes, @jenis_kit, @jumlah, @nama_kabupaten_kota, @alamat_pengiriman, @kontak, @status, @catatan, @harga_satuan, @total, @bukti_bayar)
  `);
  db.transaction((rows) => {
    for (const r of rows) {
      const harga = HARGA_KIT[r.jenis_kit] || 0;
      insertOrder.run({ ...r, harga_satuan: harga, total: harga * r.jumlah, bukti_bayar: null });
    }
  })(sampleOrders);

  console.log('[seed] Seed selesai (sumber: Open Data Jabar CSV).');
  console.log('[seed]   cases     :', caseRows.length, 'baris');
  console.log('[seed]   kit_orders:', sampleOrders.length, 'baris');
  console.log('[seed]   database  :', db.DB_PATH);
}

module.exports = { runSeed };

// Jika dijalankan langsung via `npm run seed` -> reset penuh.
if (require.main === module) runSeed({ force: true });
