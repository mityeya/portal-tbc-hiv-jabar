// Controller resource "berita" (berita terkini TBC & HIV Jawa Barat).
// CRUD penuh agar konsisten dengan arsitektur backend proyek.
const db = require('../db/connection');

const KATEGORI = ['HIV', 'TBC', 'Umum'];

function validate(body) {
  const errors = {};
  const judul = String(body.judul || '').trim();
  const ringkasan = String(body.ringkasan || '').trim();
  const kategori = String(body.kategori || '').trim();
  const tanggal = String(body.tanggal || '').trim();
  if (!judul) errors.judul = 'Judul wajib diisi';
  if (!ringkasan) errors.ringkasan = 'Ringkasan wajib diisi';
  if (!KATEGORI.includes(kategori)) errors.kategori = 'Kategori harus HIV, TBC, atau Umum';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) errors.tanggal = 'Tanggal harus format YYYY-MM-DD';
  return {
    errors,
    value: {
      judul, ringkasan, kategori, tanggal,
      sumber: body.sumber ? String(body.sumber).trim() : null,
      url: body.url ? String(body.url).trim() : null,
      gambar: body.gambar ? String(body.gambar).trim() : null,
    },
  };
}

exports.list = (req, res) => {
  const { kategori, q } = req.query;
  const where = []; const params = {};
  if (kategori) { where.push('kategori = @kategori'); params.kategori = String(kategori); }
  if (q) { where.push('(judul LIKE @q OR ringkasan LIKE @q)'); params.q = `%${q}%`; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const data = db.prepare(`SELECT * FROM berita ${whereSql} ORDER BY tanggal DESC, id DESC`).all(params);
  res.json({ success: true, data, meta: { total: data.length } });
};

exports.get = (req, res) => {
  const row = db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Berita tidak ditemukan' });
  res.json({ success: true, data: row });
};

exports.create = (req, res) => {
  const { errors, value } = validate(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, error: errors });
  const info = db.prepare(`INSERT INTO berita (judul, ringkasan, kategori, sumber, tanggal, url, gambar)
    VALUES (@judul, @ringkasan, @kategori, @sumber, @tanggal, @url, @gambar)`).run(value);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM berita WHERE id = ?').get(info.lastInsertRowid) });
};

exports.update = (req, res) => {
  const ex = db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ success: false, error: 'Berita tidak ditemukan' });
  const { errors, value } = validate(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, error: errors });
  db.prepare(`UPDATE berita SET judul=@judul, ringkasan=@ringkasan, kategori=@kategori, sumber=@sumber, tanggal=@tanggal, url=@url, gambar=@gambar WHERE id=@id`).run({ ...value, id: req.params.id });
  res.json({ success: true, data: db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id) });
};

exports.remove = (req, res) => {
  const info = db.prepare('DELETE FROM berita WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ success: false, error: 'Berita tidak ditemukan' });
  res.json({ success: true, data: { id: Number(req.params.id) } });
};
