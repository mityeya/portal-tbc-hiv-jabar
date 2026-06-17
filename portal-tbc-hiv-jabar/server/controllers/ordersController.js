// Controller untuk resource "kit_orders" (pemesanan kit lab test).
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

const regions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'geo-jabar.json'), 'utf-8')
);
const REGION_NAMES = new Set(regions.map((r) => r.nama));
const JENIS_KIT = ['HIV', 'TBC', 'HIV+TBC'];
const STATUS = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai'];

function validateOrder(body) {
  const errors = {}; const v = {};
  v.nama_pemesan = String(body.nama_pemesan || '').trim();
  v.instansi_faskes = body.instansi_faskes ? String(body.instansi_faskes).trim() : null;
  v.jenis_kit = String(body.jenis_kit || '').trim();
  v.jumlah = Number(body.jumlah);
  v.nama_kabupaten_kota = String(body.nama_kabupaten_kota || '').toUpperCase();
  v.alamat_pengiriman = String(body.alamat_pengiriman || '').trim();
  v.kontak = String(body.kontak || '').trim();
  v.status = body.status ? String(body.status).trim() : 'Menunggu';
  v.catatan = body.catatan ? String(body.catatan).trim() : null;
  if (!v.nama_pemesan) errors.nama_pemesan = 'Nama pemesan wajib diisi';
  if (!JENIS_KIT.includes(v.jenis_kit)) errors.jenis_kit = 'Jenis kit harus HIV, TBC, atau HIV+TBC';
  if (!Number.isInteger(v.jumlah) || v.jumlah <= 0) errors.jumlah = 'Jumlah harus bilangan bulat > 0';
  if (!REGION_NAMES.has(v.nama_kabupaten_kota)) errors.nama_kabupaten_kota = 'Kabupaten/Kota tidak valid';
  if (!v.alamat_pengiriman) errors.alamat_pengiriman = 'Alamat pengiriman wajib diisi';
  if (!v.kontak) errors.kontak = 'Kontak wajib diisi';
  if (!STATUS.includes(v.status)) errors.status = 'Status tidak valid';
  return { errors, value: v };
}

exports.listOrders = (req, res) => {
  const { status, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const where = []; const params = {};
  if (status) { where.push('status = @status'); params.status = String(status); }
  if (q) { where.push('(nama_pemesan LIKE @q OR instansi_faskes LIKE @q OR nama_kabupaten_kota LIKE @q)'); params.q = `%${q}%`; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS c FROM kit_orders ${whereSql}`).get(params).c;
  const data = db.prepare(`SELECT * FROM kit_orders ${whereSql} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset });
  res.json({ success: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
};

exports.getOrder = (req, res) => {
  const row = db.prepare('SELECT * FROM kit_orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
  res.json({ success: true, data: row });
};

exports.createOrder = (req, res) => {
  const { errors, value } = validateOrder(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, error: errors });
  const info = db.prepare(`INSERT INTO kit_orders (nama_pemesan, instansi_faskes, jenis_kit, jumlah, nama_kabupaten_kota, alamat_pengiriman, kontak, status, catatan)
    VALUES (@nama_pemesan, @instansi_faskes, @jenis_kit, @jumlah, @nama_kabupaten_kota, @alamat_pengiriman, @kontak, @status, @catatan)`).run(value);
  const row = db.prepare('SELECT * FROM kit_orders WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: row });
};

exports.updateOrder = (req, res) => {
  const existing = db.prepare('SELECT * FROM kit_orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
  const merged = { ...existing, ...req.body };
  const { errors, value } = validateOrder(merged);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, error: errors });
  db.prepare(`UPDATE kit_orders SET nama_pemesan=@nama_pemesan, instansi_faskes=@instansi_faskes, jenis_kit=@jenis_kit,
    jumlah=@jumlah, nama_kabupaten_kota=@nama_kabupaten_kota, alamat_pengiriman=@alamat_pengiriman,
    kontak=@kontak, status=@status, catatan=@catatan WHERE id=@id`).run({ ...value, id: req.params.id });
  const row = db.prepare('SELECT * FROM kit_orders WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: row });
};

exports.deleteOrder = (req, res) => {
  const info = db.prepare('DELETE FROM kit_orders WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
  res.json({ success: true, data: { id: Number(req.params.id) } });
};
