-- Skema database Portal TBC & HIV Jawa Barat
CREATE TABLE IF NOT EXISTS cases (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  penyakit            TEXT    NOT NULL CHECK (penyakit IN ('HIV','TBC')),
  kode_kabupaten_kota INTEGER,
  nama_kabupaten_kota TEXT    NOT NULL,
  jumlah_kasus        INTEGER NOT NULL CHECK (jumlah_kasus >= 0),
  satuan              TEXT    NOT NULL DEFAULT 'ORANG',
  tahun               INTEGER NOT NULL,
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
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
