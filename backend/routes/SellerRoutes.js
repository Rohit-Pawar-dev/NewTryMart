const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const sellerController = require('../controllers/sellerController');

// Routes
router.post('/', sellerController.createSeller);
router.get('/', sellerController.getAllSellers);
router.get('/:id', sellerController.getSellerById);
router.put('/:id', sellerController.updateSeller);
router.delete('/:id', sellerController.deleteSeller);
router.post('/upload-logo', upload.single('logo'), sellerController.uploadLogo);

module.exports = router;
