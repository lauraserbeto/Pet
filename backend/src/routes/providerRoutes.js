const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas Públicas Otimizadas
router.get('/hotels', (req, res) => ProviderController.listHotels(req, res));
router.get('/sitters', (req, res) => ProviderController.listSitters(req, res));
router.get('/stores', (req, res) => ProviderController.listStores(req, res));

// Define as rotas (Temporariamente sem middleware de auth forte para fins de simplificação, mas idealmente teria um verifyAdmin)
router.get('/', ProviderController.listPartners);
router.get('/me', authMiddleware, ProviderController.getMe);
router.get('/completeness', authMiddleware, ProviderController.getCompleteness);
router.put('/me', authMiddleware, ProviderController.updateMe);
router.put('/profile', authMiddleware, ProviderController.updateProfile); // Novo endpoint de vitrine
router.get('/:id', ProviderController.getDetails);
router.patch('/:id/status', ProviderController.updateStatus);

module.exports = router;
