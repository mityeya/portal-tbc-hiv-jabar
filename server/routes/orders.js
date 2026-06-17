// Routing resource pemesanan kit lab test.
const express = require('express');
const router = express.Router();
const c = require('../controllers/ordersController');

router.get('/orders', c.listOrders);
router.get('/orders/:id', c.getOrder);
router.post('/orders', c.createOrder);
router.put('/orders/:id', c.updateOrder);
router.delete('/orders/:id', c.deleteOrder);

module.exports = router;
