const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middlewares/authMiddleware');


router.use(authMiddleware);


router.post('/', ProductController.create);

module.exports = router;