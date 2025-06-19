const Banner = require("../../models/Banner");

// Create
exports.createBanner = async (req, res) => {
  try {
    const { title, status, banner_type, video } = req.body;
    let image = req.body.image;

    // Handle uploaded image file if exists (in case using multer)
    if (req.file) {
      image = req.file.path; // or req.file.filename based on your setup
    }

    // ✅ Validate title and at least one of image or video
    if (!title || (!image && !video)) {
      return res.status(400).json({
        error: 'Title and either Image or Video is required.',
      });
    }

    const banner = await Banner.create({
      title,
      image: image || null,
      status: status || 'active',
      banner_type: banner_type || 'main_banner',
      video: video || null,
    });

    res.status(201).json(banner);
  } catch (err) {
    console.error('Banner creation error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};


// Get All with filters and pagination

exports.getAllBanners = async (req, res) => {
  try {
    const { search = "", all = "false", banner_type } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const filter = {
      ...(all === "true" ? {} : { status: "active" }),
      ...(banner_type ? { banner_type } : {}),
      title: { $regex: search, $options: "i" },
    };

    const total = await Banner.countDocuments(filter);

    const banners = await Banner.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      status: true,
      message: "Banners fetched successfully",
      data: banners,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// exports.getAllBanners = async (req, res) => {
//   try {
//     const { search = "", all = "false" } = req.query;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = parseInt(req.query.offset) || 0;

//     const filter = {
//       ...(all === "true" ? {} : { status: "active" }),
//       title: { $regex: search, $options: "i" },
//     };

//     const total = await Banner.countDocuments(filter);

//     const banners = await Banner.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(offset)
//       .limit(limit);

//     res.json({
//       status: true,
//       message: "Banners fetched successfully",
//       data: banners,
//       total,
//       limit,
//       offset,
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (err) {
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// };

// Get One
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ msg: "Banner not found" });
    res.json(banner);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(banner);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ msg: "Banner deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
