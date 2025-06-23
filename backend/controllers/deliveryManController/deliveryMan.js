const DeliveryMan = require("../../models/DeliveryMan");

// Utility to normalize file paths and optionally return full URL
const normalizePath = (req, filePath) => {
  if (!filePath) return null;
  const cleanPath = filePath.replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${cleanPath}`;
};

// Create a new delivery man
exports.createDeliveryMan = async (req, res) => {
  try {
    const files = req.files;

    const deliveryManData = {
      ...req.body,
      image: normalizePath(req, files?.image?.[0]?.path),
      licensePhoto: normalizePath(req, files?.licensePhoto?.[0]?.path),
      identityProofPhoto: normalizePath(
        req,
        files?.identityProofPhoto?.[0]?.path
      ),
    };

    const deliveryMan = new DeliveryMan(deliveryManData);
    await deliveryMan.save();

    res.status(201).json({
      status: true,
      message: "Delivery man created successfully",
      data: deliveryMan,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// Get all delivery men (with search & pagination)
exports.getAllDeliveryMen = async (req, res) => {
  try {
    const { search = "", all = "false" } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const filter = {
      ...(all === "true" ? {} : { status: "active" }),
      name: { $regex: search, $options: "i" },
    };

    const total = await DeliveryMan.countDocuments(filter);
    const deliveryMen = await DeliveryMan.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      status: true,
      message: "Delivery men fetched successfully",
      data: deliveryMen,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get a single delivery man by ID
exports.getDeliveryManById = async (req, res) => {
  try {
    const deliveryMan = await DeliveryMan.findById(req.params.id);
    if (!deliveryMan) {
      return res
        .status(404)
        .json({ status: false, message: "Delivery man not found" });
    }
    res.json({
      status: true,
      message: "Delivery man fetched successfully",
      data: deliveryMan,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Update delivery man by ID
exports.updateDeliveryMan = async (req, res) => {
  try {
    const files = req.files;

    const updatedData = {
      ...req.body,
      ...(files?.image && { image: normalizePath(req, files.image[0].path) }),
      ...(files?.licensePhoto && {
        licensePhoto: normalizePath(req, files.licensePhoto[0].path),
      }),
      ...(files?.identityProofPhoto && {
        identityProofPhoto: normalizePath(
          req,
          files.identityProofPhoto[0].path
        ),
      }),
    };

    const deliveryMan = await DeliveryMan.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!deliveryMan) {
      return res
        .status(404)
        .json({ status: false, message: "Delivery man not found" });
    }

    res.json({
      status: true,
      message: "Delivery man updated successfully",
      data: deliveryMan,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// Delete delivery man by ID
exports.deleteDeliveryMan = async (req, res) => {
  try {
    const deliveryMan = await DeliveryMan.findByIdAndDelete(req.params.id);
    if (!deliveryMan) {
      return res
        .status(404)
        .json({ status: false, message: "Delivery man not found" });
    }
    res.json({
      status: true,
      message: "Delivery man deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
