const express = require('express');
const router = express.Router();
const businessSetupController = require('../controllers/AdminsController/bussinessController');

// GET - Fetch business setup
router.get('/business-setup', businessSetupController.getBusinessSetup);

// POST - Create business setup (only if not exists)
router.post('/business-setup', businessSetupController.createBusinessSetup);

// PUT - Update existing business setup
router.put('/business-setup', businessSetupController.updateBusinessSetup);

module.exports = router;
