const Address = require('../models/Address');

const AddressController = {
  // 1. Add new address
  async addAddress(req, res) {
    try {
      const { customer_id } = req.body;

    //   if (req.body.is_default) {
    //     await Address.updateMany(
    //       { customer_id },
    //       { $set: { is_default: false } }
    //     );
    //   }

      const address = new Address(req.body);
      await address.save();

      res.status(201).json({ success: true, data: address });
    } catch (err) {
      console.error('Add address error:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  // 2. Get all addresses for a user
  async getAddresses(req, res) {
    try {
      const { userId } = req.params;

      const addresses = await Address.find({ customer_id: userId }).sort({ is_default: -1 });

      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      console.error('Get addresses error:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  // 3. Update an address
  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const updateData = req.body;

    //   if (updateData.is_default) {
    //     await Address.updateMany(
    //       { customer_id: updateData.customer_id },
    //       { $set: { is_default: false } }
    //     );
    //   }

      const updated = await Address.findByIdAndUpdate(addressId, updateData, { new: true });

      if (!updated) return res.status(404).json({ success: false, message: 'Address not found' });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error('Update address error:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  // 4. Delete an address
  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;

      const deleted = await Address.findByIdAndDelete(addressId);

      if (!deleted) return res.status(404).json({ success: false, message: 'Address not found' });

      res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (err) {
      console.error('Delete address error:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
};

module.exports = AddressController;
