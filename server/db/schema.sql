-- Skema database Portal TBC & HIV Jawa Barat
CREATE TABLE IF NOT EXISTS cases (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  penyakit            TEXT    NOT NULL CHECK (penyakit IN ('HIV','TBC')),
  kode_kabupaten_kota INTEGER,
  nama_kabupaten_kota TEXT    NOT NULL,
  jumlah_kasus        INTEGER NOT NULL CHECK (jumlah_kasus >= 0),
  satuan              TEXT    NOT NULL DEFAULT 'ORANG',
  tahun               INTEGER NOT NULL,
  tanggal             TEXT,
  catatan             TEXT,
  kontak              TEXT,
  pelapor             TEXT,
  sumber              TEXT    NOT NULL DEFAULT 'opendata' CHECK (sumber IN ('opendata','laporan')),
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cases_filter ON cases (penyakit, tahun, nama_kabupaten_kota);

CREATE TABLE IF NOT EXISTS kit_orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_pemesan        TEXT    NOT NULL,
  instansi_faskes     TEXT,
  jenis_kit           TEXT    NOT NULL CHECK (jenis_kit IN ('HIV','TBC','HIV+TBC')),
  jumlah              INTEGER NOT NULL CHECK (jumlah > 0),
  nama_kabupaten_kota TEXT    NOT NULL,
  alamat_pengiriman   TEXT    NOT NULL,
  kontak              TEXT    NOT NULL,
  status              TEXT    NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu','Diproses','Dikirim','Selesai')),
  catatan             TEXT,
  harga_satuan        INTEGER NOT NULL DEFAULT 0,
  total               INTEGER NOT NULL DEFAULT 0,
  bukti_bayar         TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Berita terkini TBC & HIV di Jawa Barat (ditampilkan di halaman Education)
CREATE TABLE IF NOT EXISTS berita (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  judul       TEXT    NOT NULL,
  ringkasan   TEXT    NOT NULL,
  kategori    TEXT    NOT NULL DEFAULT 'Umum' CHECK (kategori IN ('HIV','TBC','Umum')),
  sumber      TEXT,
  tanggal     TEXT    NOT NULL,
  url         TEXT,
  gambar      TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_berita_kategori ON berita (kategori, tanggal);
