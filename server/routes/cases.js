// Routing resource kasus + statistik.
const express = require('express');
const router = express.Router();
const c = require('../controllers/casesController');

router.get('/stats/summary', c.summary);
router.get('/stats/trend', c.trend);
router.get('/stats/by-region', c.byRegion);
router.get('/stats/years', c.years);
router.get('/regions', c.getRegions);
router.get('/cases', c.listCases);
router.get('/cases/:id', c.getCase);
router.post('/cases', c.createCase);
router.put('/cases/:id', c.updateCase);
router.delete('/cases/:id', c.deleteCase);

module.exports = router;
