const express = require("express");
const router = express.Router();
const AddressController = require("../controllers/usersController/addressController");

// Create new address
router.post("/address", AddressController.addAddress);

// Get all addresses for a user
router.get("/address/:userId", AddressController.getAddresses);

// Update address
router.put("/address/:addressId", AddressController.updateAddress);

// Delete address
router.delete("/address/:addressId", AddressController.deleteAddress);

// Selecte address
router.put("/addresses/select/:addressId", AddressController.selectAddress);

module.exports = router;
