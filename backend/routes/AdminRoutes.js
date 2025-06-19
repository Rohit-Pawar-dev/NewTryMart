const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminsController/Auth/authController');
const getCustomMulter = require('../utils/customMulter'); // adjust the path
const upload = getCustomMulter('admin'); // uploads/admin

// Create Admin with image upload
router.post('/admin', upload.single('image'), adminController.createAdmin);

// Update Admin (optional image)
router.put('/admin/:id', upload.single('image'), adminController.updateAdmin);

// Login
router.post('/admin/login', adminController.loginAdmin);

module.exports = router;
