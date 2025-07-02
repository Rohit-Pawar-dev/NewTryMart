const Banner = require("../../models/Banner");

// Create
exports.createBanner = async (req, res) => {
  try {
    const {
      title,
      status,
      banner_type,
      video,
      start_date,
      end_date,
      pop_up_time,
    } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = req.file.path;
    }

    if (!title || (!image && !video)) {
      return res.status(400).json({
        error: "Title and either Image or Video is required.",
      });
    }

    const bannerData = {
      title,
      image: image || null,
      video: video || null,
      status: status || "active",
      banner_type: banner_type || "main_banner",
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
    };

    // Only add pop_up_time for popup_banner
    if (banner_type === "popup_banner") {
      bannerData.pop_up_time = pop_up_time || null;
    }
    if (banner_type === "popup_banner") {
      const banners = await Banner.find();
      // Check if there is already a popup banner
      const existingPopupBanner = banners.find(
        (banner) => banner.banner_type === "popup_banner"
      );
      if (existingPopupBanner) {
        return res.status(400).json({
          error: "Only one popup banner is allowed at a time.",
        });
      }
    }

    const banner = await Banner.create(bannerData);

    res.status(201).json(banner);
  } catch (err) {
    console.error("Banner creation error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// Get All with filters and pagination

exports.getAllBanners = async (req, res) => {
  try {
    const { search = "", all = "false", banner_type } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const now = new Date();

    const filter = {
      ...(all === "true" ? {} : { status: "active" }),
      ...(banner_type ? { banner_type } : {}),
      title: { $regex: search, $options: "i" },
    };

    // Apply date filter only if:
    // 1. all !== 'true'
    // 2. banner_type !== 'main_banner'
    if (all !== "true" && banner_type !== "main_banner") {
      filter.$and = [
        {
          $or: [{ start_date: null }, { start_date: { $lte: now } }],
        },
        {
          $or: [{ end_date: null }, { end_date: { $gte: now } }],
        },
      ];
    }

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
    console.error("Error fetching banners:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

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
