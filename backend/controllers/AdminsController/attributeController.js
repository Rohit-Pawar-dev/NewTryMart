const Attribute = require('../../models/Attribute');

// Create Attribute
exports.createAttribute = async (req, res) => {
    try {
        const { type, value, status } = req.body;

        if (!type || !value) {
            return res.status(400).json({ error: "Type and value are required." });
        }

        const newAttribute = new Attribute({
            type,
            value,
            status: status || "active",
        });

        await newAttribute.save();
        res.status(201).json({
            message: "Attribute created successfully.",
            data: newAttribute,
        });
    } catch (error) {
        console.error("Error creating attribute:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Get All Attributes (with search + pagination)
exports.getAllAttributes = async (req, res) => {
    try {
        const searchText = req.query.search ?? "";
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const filter = {
            $or: [
                { name: { $regex: searchText, $options: "i" } },
                { type: { $regex: searchText, $options: "i" } }, // assuming there's a `type` field
            ],
        };

        const total = await Attribute.countDocuments(filter);
        const attributes = await Attribute.find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        res.json({
            status: true,
            message: "Attributes fetched successfully",
            data: attributes,
            total,
            limit,
            offset,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching attributes:", error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

// Get Attributes by Type (e.g., type=color or type=size)
exports.getAttributesByType = async (req, res) => {
    try {
        const { type } = req.query;

        if (!type) {
            return res.status(400).json({ error: "Type query parameter is required." });
        }

        const attributes = await Attribute.find({ type });
        res.status(200).json({ data: attributes });
    } catch (error) {
        console.error("Error fetching attributes by type:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Delete Attribute
exports.deleteAttribute = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAttribute = await Attribute.findByIdAndDelete(id);

        if (!deletedAttribute) {
            return res.status(404).json({ error: "Attribute not found." });
        }

        res.status(200).json({ message: "Attribute deleted successfully." });
    } catch (error) {
        console.error("Error deleting attribute:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};
