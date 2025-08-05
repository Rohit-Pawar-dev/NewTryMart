const express = require("express");
const router = express.Router();
const AddressController = require("../controllers/usersController/addressController");
const auth = require ("../middleware/authMiddleware");

// Create new address
router.post("/address",auth, AddressController.addAddress);

// Get all addresses for a user
router.get("/address",auth, AddressController.getAddresses);

// Update address
router.put("/address/:addressId",auth, AddressController.updateAddress);

// Delete address
router.delete("/address/:addressId",auth, AddressController.deleteAddress);

// Selecte address
router.put("/address/select/:addressId",auth,AddressController.selectAddress);

module.exports = router;
