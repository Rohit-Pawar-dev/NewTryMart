const Seller = require("../../models/Seller");
const nlogger = require("../../logger");
const path = require('path');

// Create Seller
exports.createSeller = async (req, res) => {
  try {
    nlogger.info("Create Seller");

    // Generate a random 4-digit OTP (e.g., 1234 to 9999)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Override any OTP sent by client
    req.body.otp = otp;

    const seller = await Seller.create(req.body);

    res.status(201).json(seller);
  } catch (err) {
    nlogger.error("Create Seller Error: " + err.message);
    res.status(400).json({ error: err.message });
  }
};

// Get All Sellers with pagination + search
exports.getAllSellers = async (req, res) => {
  try {
    const searchText = req.query.search ?? "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    nlogger.info(`Retrieving Sellers. Search: "${searchText}"`);

    const filter = {
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
        { email: { $regex: searchText, $options: "i" } },
        { shop_name: { $regex: searchText, $options: "i" } },
        { business_category: { $regex: searchText, $options: "i" } },
      ],
    };

    const total = await Seller.countDocuments(filter);

    const sellers = await Seller.find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      status: true,
      message: "Sellers fetched successfully",
      data: sellers,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    nlogger.error("Error retrieving sellers: " + err.message);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get One Seller
exports.getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ msg: "Seller not found" });
    res.json(seller);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Seller
exports.updateSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(seller);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Seller
exports.deleteSeller = async (req, res) => {
  try {
    await Seller.findByIdAndDelete(req.params.id);
    res.json({ msg: "Seller deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.uploadSellerProfileImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join('uploads', 'sellers', 'profile', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};

// Upload logo
exports.uploadSellerLogo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join('uploads', 'sellers', 'logo', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};