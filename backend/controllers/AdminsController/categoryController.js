const Category = require("../../models/Category");
const path = require('path');
// Create
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { all, search = "", limit, offset = 0 } = req.query;

    const showAll = all === "true";
    const matchStage = {};

    if (!showAll) {
      matchStage.status = "active";
    }

    if (search.trim()) {
      matchStage.name = { $regex: search.trim(), $options: "i" };
    }

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);
    const usePagination = !isNaN(parsedLimit) && parsedLimit > 0;

    const aggregationPipeline = [
      { $match: matchStage },
      { $sort: { created_at: -1 } },
    ];

    if (usePagination) {
      aggregationPipeline.push(
        { $skip: parsedOffset },
        { $limit: parsedLimit }
      );
    }

    aggregationPipeline.push(
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "category_id",
          as: "sub_categories",
        },
      },
      {
        $addFields: {
          sub_categories: showAll
            ? "$sub_categories"
            : {
              $filter: {
                input: "$sub_categories",
                as: "sub",
                cond: { $eq: ["$$sub.status", "active"] },
              },
            },
        },
      }
    );

    const categories = await Category.aggregate(aggregationPipeline);
    const total = await Category.countDocuments(matchStage);

    res.json({
      message: "Categories with subcategories fetched successfully",
      data: categories,
      total,
      limit: usePagination ? parsedLimit : total,
      offset: usePagination ? parsedOffset : 0,
      totalPages: usePagination ? Math.ceil(total / parsedLimit) : 1,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: err.message });
  }
};


// Get One
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ msg: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: "Category deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



exports.uploadCategoryImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return relative path for frontend to use
  const filePath = path.join('uploads', 'categories', req.file.filename).replace(/\\/g, '/');
  res.status(201).json({ path: filePath });
};



