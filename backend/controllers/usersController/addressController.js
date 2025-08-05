const Address = require("../../models/Address");

const AddressController = {

  async addAddress(req, res) {
    try {
      const customer_id = req.user?.id;
      if (!customer_id) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized: User not logged in",
        });
      }
      req.body.customer_id = customer_id;

      const existingAddresses = await Address.find({ customer_id });
      if (existingAddresses.length === 0) {
        req.body.is_default = true;
      }
      if (req.body.is_default) {
        await Address.updateMany(
          { customer_id },
          { $set: { is_default: false } }
        );
      }

      const address = new Address(req.body);
      await address.save();

      res.status(201).json({ status: true, message: "Address added successfully", data: address });
    } catch (err) {
      console.error("Add address error:", err);
      res.status(500).json({ status: false, message: "Server Error" });
    }
  },

  async getAddresses(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(400)
          .json({ status: false, message: "Unauthorized: User not logged in" });
      }

      const addresses = await Address.find({ customer_id: userId }).sort({
        is_default: -1,
      });

      res.status(200).json({ status: true, message: "Address fetched successfully", data: addresses });
    } catch (err) {
      console.error("Get addresses error:", err);
      res.status(500).json({ status: false, message: "Server Error" });
    }
  },

  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const updateData = req.body;

      const customer_id = req.user?.id;
      if (!customer_id) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized: User not logged in",
        });
      }

      // If is_default is being set, reset other defaults for this user
      if (updateData.is_default) {
        await Address.updateMany(
          { customer_id }, // use authenticated user id here
          { $set: { is_default: false } }
        );
      }

      // Optional: Ensure the address belongs to this user before update
      const address = await Address.findOne({ _id: addressId, customer_id });
      if (!address) {
        return res.status(404).json({
          status: false,
          message: "Address not found or you don't have permission to update",
        });
      }

      // Proceed with update
      const updated = await Address.findByIdAndUpdate(addressId, updateData, {
        new: true,
      });

      res.status(200).json({
        status: true,
        message: "Address updated successfully",
        data: updated,
      });
    } catch (err) {
      console.error("Update address error:", err);
      res.status(500).json({ status: false, message: "Server Error" });
    }
  },


  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized: User not logged in",
        });
      }

      // Check if address belongs to this user
      const address = await Address.findOne({ _id: addressId, customer_id: userId });
      if (!address) {
        return res.status(404).json({
          status: false,
          message: "Address not found or you don't have permission to delete it",
        });
      }

      await Address.findByIdAndDelete(addressId);

      res.status(200).json({
        status: true,
        message: "Address deleted successfully",
      });
    } catch (err) {
      console.error("Delete address error:", err);
      res.status(500).json({ status: false, message: "Server Error" });
    }
  }
  ,

  async selectAddress(req, res) {
    try {
      const userId = req.user?.id; // get user id from auth middleware
      const addressId = req.params.addressId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not logged in" });
      }

      const addressExists = await Address.findOne({
        _id: addressId,
        customer_id: userId,
      });
      if (!addressExists) {
        return res.status(404).json({ message: "Address not found" });
      }

      // Unset default from all user's addresses
      await Address.updateMany({ customer_id: userId }, { is_default: false });

      // Set selected address as default
      const updatedAddress = await Address.findOneAndUpdate(
        { _id: addressId, customer_id: userId },
        { is_default: true },
        { new: true }
      );

      return res.json({
        status: true,
        message: "Address selected successfully",
        address: updatedAddress,
      });
    } catch (error) {
      console.error("Select address error:", error);
      return res.status(500).json({ status: false, message: "Server error" });
    }
  }

};

module.exports = AddressController;
