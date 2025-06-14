const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Routes
router.post('/', reviewController.create);
router.get('/', reviewController.getAll);
router.get('/:id', reviewController.getOne);
router.put('/:id', reviewController.update);
router.delete('/:id', reviewController.remove);

module.exports = router;
