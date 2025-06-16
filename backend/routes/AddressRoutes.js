const express = require('express');
const router = express.Router();
const AddressController = require("../controllers/addressController");

// Create new address
router.post('/address', AddressController.addAddress);

// Get all addresses for a user
router.get('/address/:userId', AddressController.getAddresses);

// Update address
router.put('/address/:addressId', AddressController.updateAddress);

// Delete address
router.delete('/address/:addressId', AddressController.deleteAddress);

module.exports = router;
