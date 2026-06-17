// Seed database: baca CSV Open Data Jabar sebagai sumber utama,
// lalu isi contoh pesanan kit lab test.
// Idempoten: aman dijalankan berulang kali.

const fs = require('fs');
const path = require('path');
const db = require('./connection');

const regions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'geo-jabar.json'), 'utf-8')
);
const codeByName = new Map(regions.map((r) => [r.nama, r.kode_kabupaten_kota]));

// ---- Reset (idempoten) ----
db.exec('DELETE FROM cases; DELETE FROM kit_orders;');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('cases','kit_orders');");

// ========================================================
// SUMBER UTAMA: CSV Open Data Jabar
// File: server/data/opendata_jabar.csv
// Header: penyakit,nama_kabupaten_kota,jumlah_kasus,tahun
// Format ini kompatibel dengan CSV resmi Open Data Jabar.
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

const insertCase = db.prepare(`
  INSERT INTO cases (penyakit, kode_kabupaten_kota, nama_kabupaten_kota, jumlah_kasus, satuan, tahun, pelapor, sumber)
  VALUES (@penyakit, @kode_kabupaten_kota, @nama_kabupaten_kota, @jumlah_kasus, @satuan, @tahun, @pelapor, @sumber)
`);

const caseRows = loadCsv(CSV_PATH);
db.transaction((rows) => { for (const r of rows) insertCase.run(r); })(caseRows);

// ---- Contoh pesanan kit lab test ----
const sampleOrders = [
  { nama_pemesan: 'dr. Sari Wulandari', instansi_faskes: 'Puskesmas Cibeunying', jenis_kit: 'HIV', jumlah: 50, nama_kabupaten_kota: 'KOTA BANDUNG', alamat_pengiriman: 'Jl. Padjadjaran No. 10, Bandung', kontak: '081234567890', status: 'Diproses', catatan: 'Untuk skrining bulanan' },
  { nama_pemesan: 'Ahmad Fauzi', instansi_faskes: 'RSUD Cibinong', jenis_kit: 'TBC', jumlah: 120, nama_kabupaten_kota: 'KABUPATEN BOGOR', alamat_pengiriman: 'Jl. KSR Dadi Kusmayadi, Cibinong', kontak: 'logistik@rsudcibinong.go.id', status: 'Dikirim', catatan: null },
  { nama_pemesan: 'dr. Maya Putri', instansi_faskes: 'Klinik Sehat Bersama', jenis_kit: 'HIV+TBC', jumlah: 30, nama_kabupaten_kota: 'KOTA DEPOK', alamat_pengiriman: 'Jl. Margonda Raya No. 88, Depok', kontak: '082199887766', status: 'Menunggu', catatan: 'Mohon segera diproses' },
  { nama_pemesan: 'Budi Santoso', instansi_faskes: 'Puskesmas Garut Kota', jenis_kit: 'TBC', jumlah: 75, nama_kabupaten_kota: 'KABUPATEN GARUT', alamat_pengiriman: 'Jl. Ahmad Yani No. 5, Garut', kontak: '085711223344', status: 'Selesai', catatan: null },
  { nama_pemesan: 'dr. Rina Hartati', instansi_faskes: 'RS Mitra Keluarga', jenis_kit: 'HIV', jumlah: 40, nama_kabupaten_kota: 'KOTA BEKASI', alamat_pengiriman: 'Jl. Ahmad Yani, Bekasi', kontak: 'rina.h@mitra.co.id', status: 'Menunggu', catatan: 'Pengiriman pagi hari' },
];
const insertOrder = db.prepare(`
  INSERT INTO kit_orders (nama_pemesan, instansi_faskes, jenis_kit, jumlah, nama_kabupaten_kota, alamat_pengiriman, kontak, status, catatan)
  VALUES (@nama_pemesan, @instansi_faskes, @jenis_kit, @jumlah, @nama_kabupaten_kota, @alamat_pengiriman, @kontak, @status, @catatan)
`);
db.transaction((rows) => { for (const r of rows) insertOrder.run(r); })(sampleOrders);

console.log('Seed selesai (sumber: Open Data Jabar CSV).');
console.log('  cases     :', caseRows.length, 'baris');
console.log('  kit_orders:', sampleOrders.length, 'baris');
console.log('  database  :', db.DB_PATH);
console.log('  csv       :', CSV_PATH);
