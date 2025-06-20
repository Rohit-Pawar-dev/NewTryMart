const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminsController/Auth/authController');
const getCustomMulter = require('../utils/customMulter'); // utility to configure multer
const upload = getCustomMulter('admin'); // uploads/admin

// Create Admin (with image upload)
router.post('/admin', upload.single('image'), adminController.createAdmin);

// Login Admin
router.post('/admin/login', adminController.loginAdmin);

// Get Admin by ID
router.get('/admin/:id', adminController.getAdmin);

// Update Admin details (optional image)
router.put('/admin/:id', upload.single('image'), adminController.updateAdmin);

// Change Admin password (requires oldPassword + newPassword in body)
router.put('/admin/change-password/:id', adminController.changePassword);

module.exports = router;
