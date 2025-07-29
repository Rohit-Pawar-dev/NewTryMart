// controllers/subCategoryController.js
const SubCategory = require('../../models/SubCategory');
const path = require('path');

// Create SubCategory
exports.createSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.create(req.body);
    res.status(201).json(subCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All SubCategories (with pagination, optional filters)
exports.getAllSubCategories = async (req, res) => {
  try {
    const { all, search = "", category_id, limit = 10, offset = 0 } = req.query;

    const parsedLimit = parseInt(limit) || 10;
    const parsedOffset = parseInt(offset) || 0;

    const filter = all === "true" ? {} : { status: "active" };
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (category_id) {
      filter.category_id = category_id;
    }

    const total = await SubCategory.countDocuments(filter);

    const subCategories = await SubCategory.find(filter)
      .populate('category_id', 'name')
      .sort({ created_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit);

    res.json({
      message: "Subcategories fetched successfully",
      data: subCategories,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Single SubCategory by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id).populate('category_id', 'name');
    if (!subCategory) return res.status(404).json({ msg: "Subcategory not found" });
    res.json(subCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update SubCategory
exports.updateSubCategory = async (req, res) => {
  try {
    const updated = await SubCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete SubCategory
exports.deleteSubCategory = async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    res.json({ msg: "Subcategory deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.uploadSubCategoryImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return relative path for frontend to use
  const filePath = path.join('uploads', 'subcategories', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};