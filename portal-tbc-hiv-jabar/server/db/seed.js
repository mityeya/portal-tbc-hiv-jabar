// Seed database: buat tabel, kosongkan, isi data ilustratif (mock) + contoh pesanan.
const fs = require('fs');
const path = require('path');
const db = require('./connection');

const regions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'geo-jabar.json'), 'utf-8')
);

db.exec('DELETE FROM cases; DELETE FROM kit_orders;');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('cases','kit_orders');");

const HIV_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
const TBC_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

function baseFor(region, penyakit) {
  const seed = region.kode_kabupaten_kota % 100;
  const isKota = region.nama.startsWith('KOTA');
  const cityFactor = isKota ? 1.35 : 1;
  if (penyakit === 'HIV') return Math.round((40 + seed * 7) * cityFactor);
  return Math.round((300 + seed * 35) * cityFactor);
}

function buildRows() {
  const rows = [];
  for (const region of regions) {
    for (const [penyakit, years] of [['HIV', HIV_YEARS], ['TBC', TBC_YEARS]]) {
      const tahunMax = years[years.length - 1];
      const base = baseFor(region, penyakit);
      for (const tahun of years) {
        const factor = 1 + (tahun - tahunMax) * 0.04;
        rows.push({
          penyakit,
          kode_kabupaten_kota: region.kode_kabupaten_kota,
          nama_kabupaten_kota: region.nama,
          jumlah_kasus: Math.max(0, Math.round(base * factor)),
          satuan: 'ORANG', tahun, pelapor: null, sumber: 'opendata',
        });
      }
    }
  }
  return rows;
}

const insertCase = db.prepare(`
  INSERT INTO cases (penyakit, kode_kabupaten_kota, nama_kabupaten_kota, jumlah_kasus, satuan, tahun, pelapor, sumber)
  VALUES (@penyakit, @kode_kabupaten_kota, @nama_kabupaten_kota, @jumlah_kasus, @satuan, @tahun, @pelapor, @sumber)
`);
const insertMany = db.transaction((rows) => { for (const r of rows) insertCase.run(r); });
const caseRows = buildRows();
insertMany(caseRows);

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

console.log('Seed selesai.');
console.log('  cases     :', caseRows.length, 'baris');
console.log('  kit_orders:', sampleOrders.length, 'baris');
console.log('  database  :', db.DB_PATH);

// =====================================================================
// ALTERNATIF: Importer CSV resmi Open Data Jabar (mudah diganti ke data asli)
// Format header: penyakit,nama_kabupaten_kota,jumlah_kasus,tahun
// Pakai: node db/seed.js --csv data/opendata.csv
// const csvArg = process.argv.indexOf('--csv');
// if (csvArg !== -1 && process.argv[csvArg + 1]) {
//   const codeByName = new Map(regions.map(r => [r.nama.toUpperCase(), r.kode_kabupaten_kota]));
//   const csv = fs.readFileSync(path.resolve(process.argv[csvArg + 1]), 'utf-8').trim();
//   const [header, ...lines] = csv.split(/\r?\n/);
//   const cols = header.split(',').map(c => c.trim());
//   const idx = (n) => cols.indexOf(n);
//   db.exec('DELETE FROM cases;');
//   db.transaction(() => { for (const line of lines) {
//     const f = line.split(','); const nama = f[idx('nama_kabupaten_kota')].trim().toUpperCase();
//     insertCase.run({ penyakit: f[idx('penyakit')].trim().toUpperCase(), kode_kabupaten_kota: codeByName.get(nama) || null,
//       nama_kabupaten_kota: nama, jumlah_kasus: parseInt(f[idx('jumlah_kasus')], 10), satuan: 'ORANG',
//       tahun: parseInt(f[idx('tahun')], 10), pelapor: null, sumber: 'opendata' });
//   } })();
//   console.log('Import CSV selesai:', lines.length, 'baris');
// }
// =====================================================================
