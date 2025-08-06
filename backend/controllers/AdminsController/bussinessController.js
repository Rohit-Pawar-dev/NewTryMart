const BusinessSetup = require('../../models/BussinessSetup');
const path = require('path');
// GET /api/business-setup
exports.getBusinessSetup = async (req, res) => {
  try {
    const setup = await BusinessSetup.findOne();

    res.status(200).json({
      status: true,
      message: 'Business setup retrieved successfully.',
      data: setup
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch business setup.',
      error: error.message
    });
  }
};
// POST /api/business-setup
exports.createBusinessSetup = async (req, res) => {
  try {
    const exists = await BusinessSetup.findOne();

    if (exists) {
      return res.status(400).json({
        status: false,
        message: 'Business setup already exists. Use update instead.'
      });
    }

    const setup = await BusinessSetup.create(req.body);

    res.status(201).json({
      status: true,
      message: 'Business setup created successfully.',
      data: setup
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to create business setup.',
      error: error.message
    });
  }
};

// PUT /api/business-setup
exports.updateBusinessSetup = async (req, res) => {
  try {
    const updated = await BusinessSetup.findOneAndUpdate(
      {},
      req.body,
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: true,
      message: 'Business setup updated or created successfully.',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to update or create business setup.',
      error: error.message
    });
  }
};

// GET /api/business-setup/delivery-charges
exports.deliveryCharges = async (req, res) => {
  try {
    const setup = await BusinessSetup.findOne();
    if (!setup || typeof setup.deliveryCharges === 'undefined') {
      return res.status(404).json({
        status: false,
        message: 'Delivery charges not found.'
      });
    }
    res.status(200).json({
      status: true,
      message: 'Delivery charges retrieved successfully.',
      deliveryCharges: setup.deliveryCharges
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch delivery charges.',
      error: error.message
    });
  }
};


exports.getSellerCommoision = async (req, res) => {
  try {
    const setup = await BusinessSetup.findOne();
    if (!setup || typeof setup.sellerCommision === 'undefined') {
      return res.status(404).json({
        status: false,
        message: 'Seller commission not found.'
      });
    }
    res.status(200).json({
      status: true,
      message: 'Seller commission retrieved successfully.',
      sellerCommission: setup.sellerCommision
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch seller commission.',
      error: error.message
    });
  }
};


exports.uploadLogo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = req.file.path.replace(/\\/g, '/');
  res.status(201).json({
    status: true,
    message: 'Logo uploaded successfully',
    path: filePath
  });
};

