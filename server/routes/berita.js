// Routing resource berita.
const express = require('express');
const router = express.Router();
const c = require('../controllers/beritaController');

router.get('/berita', c.list);
router.get('/berita/:id', c.get);
router.post('/berita', c.create);
router.put('/berita/:id', c.update);
router.delete('/berita/:id', c.remove);

module.exports = router;
