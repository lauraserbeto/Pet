const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/options', ProductController.getOptions);

router.use(authMiddleware);

router.get('/provider', ProductController.listByProvider);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);

module.exports = router;