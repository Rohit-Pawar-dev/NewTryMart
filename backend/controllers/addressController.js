const Address = require("../models/Address");

const AddressController = {
  // 1. Add new address
  async addAddress(req, res) {
    try {
      const { customer_id, is_default } = req.body;

      // If new address is default, unset previous default addresses for user
      if (is_default) {
        await Address.updateMany(
          { customer_id },
          { $set: { is_default: false } }
        );
      }

      const address = new Address(req.body);
      await address.save();

      res.status(201).json({ success: true, data: address });
    } catch (err) {
      console.error("Add address error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // 2. Get all addresses for a user
  async getAddresses(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required" }); // Added validation for userId
      }

      const addresses = await Address.find({ customer_id: userId }).sort({
        is_default: -1,
      });

      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      console.error("Get addresses error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // 3. Update an address
  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const updateData = req.body;

      // If updating to default, unset previous default addresses for user
      if (updateData.is_default) {
        if (!updateData.customer_id) {
          return res
            .status(400)
            .json({
              success: false,
              message: "customer_id is required to set default",
            });
        }
        await Address.updateMany(
          { customer_id: updateData.customer_id },
          { $set: { is_default: false } }
        );
      }

      const updated = await Address.findByIdAndUpdate(addressId, updateData, {
        new: true,
      });

      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Address not found" });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error("Update address error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // 4. Delete an address
  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;

      const deleted = await Address.findByIdAndDelete(addressId);

      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: "Address not found" });

      res.status(200).json({ success: true, message: "Address deleted" });
    } catch (err) {
      console.error("Delete address error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // 5. Select address (set is_default true for one address)
  async selectAddress(req, res) {
  try {
    const userId = req.body.userId || req.query.userId;
    const addressId = req.params.addressId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Ensure the address belongs to the user
    const addressExists = await Address.findOne({
      _id: addressId,
      customer_id: userId,
    });
    if (!addressExists) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Reset all addresses for the user
    await Address.updateMany(
      { customer_id: userId },
      { is_default: false }
    );

    // Update the selected address to be default, and return the updated address
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, customer_id: userId },
      { is_default: true },
      { new: true } 
    );

    return res.json({
      message: "Address selected successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Select address error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

};

module.exports = AddressController;
