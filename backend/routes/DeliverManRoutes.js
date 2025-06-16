const express = require('express');
const router = express.Router();
const deliveryManController = require('../controllers/deliveryMan');
const upload = require('../utils/multer'); // your multer config

// Multer middleware for handling multiple file fields
const cpUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'identityProofPhoto', maxCount: 1 }
]);

// Create a delivery man (with file upload)
router.post('/', cpUpload, deliveryManController.createDeliveryMan);

// Get all delivery men (with pagination and search)
router.get('/', deliveryManController.getAllDeliveryMen);

// Get one delivery man by ID
router.get('/:id', deliveryManController.getDeliveryManById);

// Update delivery man by ID (with file upload)
router.put('/:id', cpUpload, deliveryManController.updateDeliveryMan);

// Delete delivery man by ID
router.delete('/:id', deliveryManController.deleteDeliveryMan);

module.exports = router;
