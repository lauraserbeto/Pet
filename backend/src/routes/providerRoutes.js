const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');

// Define as rotas (Temporariamente sem middleware de auth forte para fins de simplificação, mas idealmente teria um verifyAdmin)
router.get('/', ProviderController.listPartners);
router.patch('/:id/status', ProviderController.updateStatus);

module.exports = router;
