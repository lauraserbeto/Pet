const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.use(authMiddleware);

// Rotas do Usuário
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateProfile);
router.patch('/me/password', UserController.updatePassword);
router.post('/me/evaluations', UserController.submitSitterEvaluation);

// Rotas do Administrador
router.get('/admin/evaluations', adminMiddleware, UserController.getEvaluations);
router.patch('/admin/evaluations/:id', adminMiddleware, UserController.reviewEvaluation);

module.exports = router;
