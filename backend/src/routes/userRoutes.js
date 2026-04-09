const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/me', UserController.getMe);
router.put('/me', UserController.updateProfile);
router.patch('/me/password', UserController.updatePassword);

module.exports = router;
