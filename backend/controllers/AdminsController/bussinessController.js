const BusinessSetup = require('../../models/BussinessSetup');

// GET /api/business-setup
exports.getBusinessSetup = async (req, res) => {
  try {
    const setup = await BusinessSetup.findOne();

    // if (!setup) {
    //   return res.status(404).json({
    //     status: false,
    //     message: 'No business setup found.'
    //   });
    // }

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
    const setup = await BusinessSetup.findOne();

    if (!setup) {
      return res.status(404).json({
        status: false,
        message: 'No business setup found to update.'
      });
    }

    const updated = await BusinessSetup.findByIdAndUpdate(
      setup._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: 'Business setup updated successfully.',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to update business setup.',
      error: error.message
    });
  }
};
