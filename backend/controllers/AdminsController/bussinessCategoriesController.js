const BusinessCategory = require('../../models/BusinessCategory');

exports.getAllCategories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
        } = req.query;

        const offset = (page - 1) * limit;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'active' || status === 'inactive') {
            query.status = status;
        }

        const [data, total] = await Promise.all([
            BusinessCategory.find(query)
                .skip(offset)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            BusinessCategory.countDocuments(query),
        ]);

        res.json({
            status: true,
            message: "Business categories fetched successfully",
            data,
            total,
            limit: parseInt(limit),
            offset,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Failed to fetch categories',
            error: err.message,
        });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        const category = new BusinessCategory({ name, description, status });
        await category.save();

        res.status(201).json(category);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Category name must be unique' });
        }
        res.status(400).json({ message: 'Failed to create category', error: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedCategory = await BusinessCategory.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: 'Failed to update category', error: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCategory = await BusinessCategory.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete category', error: err.message });
    }
};
