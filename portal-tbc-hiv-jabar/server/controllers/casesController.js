// Controller untuk resource "cases" (kasus TBC & HIV).
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

const regions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'geo-jabar.json'), 'utf-8')
);
const REGION_NAMES = new Set(regions.map((r) => r.nama));
const CODE_BY_NAME = new Map(regions.map((r) => [r.nama, r.kode_kabupaten_kota]));
const CURRENT_YEAR = new Date().getFullYear();

function validateCase(body) {
  const errors = {};
  const penyakit = String(body.penyakit || '').toUpperCase();
  const nama = String(body.nama_kabupaten_kota || '').toUpperCase();
  const jumlah = Number(body.jumlah_kasus);
  const tahun = Number(body.tahun);
  if (!['HIV', 'TBC'].includes(penyakit)) errors.penyakit = 'Penyakit harus HIV atau TBC';
  if (!REGION_NAMES.has(nama)) errors.nama_kabupaten_kota = 'Kabupaten/Kota tidak valid';
  if (!Number.isInteger(jumlah) || jumlah < 0) errors.jumlah_kasus = 'Jumlah kasus harus bilangan bulat >= 0';
  if (!Number.isInteger(tahun) || tahun < 2018 || tahun > CURRENT_YEAR) errors.tahun = `Tahun harus antara 2018 dan ${CURRENT_YEAR}`;
  return { errors, value: {
    penyakit, nama_kabupaten_kota: nama, kode_kabupaten_kota: CODE_BY_NAME.get(nama) || null,
    jumlah_kasus: jumlah, tahun, pelapor: body.pelapor ? String(body.pelapor).trim() : null,
  } };
}

exports.getRegions = (req, res) => res.json({ success: true, data: regions, meta: { total: regions.length } });

exports.listCases = (req, res) => {
  const { penyakit, tahun, wilayah, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const where = []; const params = {};
  if (penyakit) { where.push('penyakit = @penyakit'); params.penyakit = String(penyakit).toUpperCase(); }
  if (tahun) { where.push('tahun = @tahun'); params.tahun = Number(tahun); }
  if (wilayah) { where.push('nama_kabupaten_kota = @wilayah'); params.wilayah = String(wilayah).toUpperCase(); }
  if (q) { where.push('(nama_kabupaten_kota LIKE @q OR pelapor LIKE @q)'); params.q = `%${q}%`; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS c FROM cases ${whereSql}`).get(params).c;
  const data = db.prepare(`SELECT * FROM cases ${whereSql} ORDER BY tahun DESC, nama_kabupaten_kota ASC LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset });
  res.json({ success: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
};

exports.getCase = (req, res) => {
  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Data tidak ditemukan' });
  res.json({ success: true, data: row });
};

exports.createCase = (req, res) => {
  const { errors, value } = validateCase(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, error: errors });
  const info = db.prepare(`INSERT INTO cases (penyakit, kode_kabupaten_kota, nama_kabupaten_kota, jumlah_kasus, satuan, tahun, pelapor, sumber)
    VALUES (@penyakit, @kode_kabupaten_kota, @nama_kabupaten_kota, @jumlah_kasus, 'ORANG', @tahun, @pelapor, 'laporan')`).run(value);
  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: row });
};

exports.updateCase = (req, res) => {
  const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Data tidak ditemukan' });
  const { errors, value } = validateCase(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, error: errors });
  db.prepare(`UPDATE cases SET penyakit=@penyakit, kode_kabupaten_kota=@kode_kabupaten_kota,
    nama_kabupaten_kota=@nama_kabupaten_kota, jumlah_kasus=@jumlah_kasus, tahun=@tahun, pelapor=@pelapor WHERE id=@id`).run({ ...value, id: req.params.id });
  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: row });
};

exports.deleteCase = (req, res) => {
  const info = db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ success: false, error: 'Data tidak ditemukan' });
  res.json({ success: true, data: { id: Number(req.params.id) } });
};

exports.summary = (req, res) => {
  const totalAll = db.prepare('SELECT COALESCE(SUM(jumlah_kasus),0) AS s FROM cases').get().s;
  const perPenyakit = db.prepare('SELECT penyakit, COALESCE(SUM(jumlah_kasus),0) AS s FROM cases GROUP BY penyakit').all();
  const totalHIV = (perPenyakit.find((p) => p.penyakit === 'HIV') || {}).s || 0;
  const totalTBC = (perPenyakit.find((p) => p.penyakit === 'TBC') || {}).s || 0;
  const jumlahWilayah = db.prepare('SELECT COUNT(DISTINCT nama_kabupaten_kota) AS c FROM cases').get().c;
  const tahunTerbaru = db.prepare('SELECT MAX(tahun) AS y FROM cases').get().y;
  res.json({ success: true, data: { totalKasus: totalAll, totalHIV, totalTBC, jumlahWilayah, tahunTerbaru } });
};

exports.trend = (req, res) => {
  const rows = db.prepare('SELECT tahun, penyakit, SUM(jumlah_kasus) AS total FROM cases GROUP BY tahun, penyakit ORDER BY tahun ASC').all();
  const tahunSet = [...new Set(rows.map((r) => r.tahun))].sort((a, b) => a - b);
  const series = { HIV: {}, TBC: {} };
  for (const r of rows) series[r.penyakit][r.tahun] = r.total;
  res.json({ success: true, data: { tahun: tahunSet, HIV: tahunSet.map((t) => series.HIV[t] || 0), TBC: tahunSet.map((t) => series.TBC[t] || 0) } });
};

exports.byRegion = (req, res) => {
  const where = []; const params = {};
  if (req.query.penyakit) { where.push('penyakit = @penyakit'); params.penyakit = String(req.query.penyakit).toUpperCase(); }
  if (req.query.tahun) { where.push('tahun = @tahun'); params.tahun = Number(req.query.tahun); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT nama_kabupaten_kota, kode_kabupaten_kota, SUM(jumlah_kasus) AS total FROM cases ${whereSql} GROUP BY nama_kabupaten_kota`).all(params);
  const coordByName = new Map(regions.map((r) => [r.nama, r]));
  const data = rows.map((r) => { const geo = coordByName.get(r.nama_kabupaten_kota) || {}; return { ...r, lat: geo.lat, lng: geo.lng }; }).filter((r) => r.lat != null);
  res.json({ success: true, data });
};
