const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamsSchema,
} = require('../schemas/serviceSchemas');

router.use(authMiddleware);

router.post('/', validate({ body: createServiceSchema }), ServiceController.create);
router.get('/', ServiceController.listMine);
router.put(
  '/:id',
  validate({ params: serviceIdParamsSchema, body: updateServiceSchema }),
  ServiceController.update,
);
router.delete(
  '/:id',
  validate({ params: serviceIdParamsSchema }),
  ServiceController.remove,
);

module.exports = router;
