const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Define as rotas (Temporariamente sem middleware de auth forte para fins de simplificação, mas idealmente teria um verifyAdmin)
router.get('/', ProviderController.listPartners);
router.get('/me', authMiddleware, ProviderController.getMe);
router.put('/me', authMiddleware, ProviderController.updateMe);
router.get('/:id', ProviderController.getDetails);
router.patch('/:id/status', ProviderController.updateStatus);

module.exports = router;
