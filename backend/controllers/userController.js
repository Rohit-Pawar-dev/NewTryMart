const User = require('../models/User');
const nlogger = require('../logger');

// Create User
exports.createUser = async (req, res) => {
  try {
    nlogger.info('Create User');
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    nlogger.info('Create User Error: ' + err);
    res.status(400).json({ error: err.message });
  }
};

// Get All Users (with search + pagination)
exports.getAllUsers = async (req, res) => {
  try {
    const searchText = req.query.search ?? '';
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    nlogger.info(`Retrieving Users List ${searchText}`);

    const filter = {
      role: 'user',
      $or: [
        { name: { $regex: searchText, $options: 'i' } },
        { mobile: { $regex: searchText, $options: 'i' } },
        { email: { $regex: searchText, $options: 'i' } }
      ]
    };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      status: true,
      message: 'Users fetched successfully',
      data: users,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    nlogger.error('Error retrieving users', err);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Get Single User
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.body.userId;
    const filePath = req.file.path;

    await User.findByIdAndUpdate(userId, {
      profilePicture: filePath
    });

    res.status(200).json({ message: 'File uploaded successfully', filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
