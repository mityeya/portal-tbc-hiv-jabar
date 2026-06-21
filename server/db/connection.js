// Koneksi tunggal (singleton) ke database SQLite via better-sqlite3 (WAL mode).
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'data.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// ---- Migrasi ringan: tambah kolom baru bila DB lama belum punya ----
// Penting untuk DB yang sudah ada (mis. dari versi sebelumnya) agar kolom
// QRIS (harga_satuan, total, bukti_bayar) tetap tersedia tanpa reset manual.
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[migrasi] Menambah kolom ${table}.${column}`);
  }
}
ensureColumn('kit_orders', 'harga_satuan', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('kit_orders', 'total', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('kit_orders', 'bukti_bayar', 'TEXT');
ensureColumn('cases', 'tanggal', 'TEXT');
ensureColumn('cases', 'catatan', 'TEXT');
ensureColumn('cases', 'kontak', 'TEXT');

module.exports = db;
module.exports.DB_PATH = DB_PATH;
