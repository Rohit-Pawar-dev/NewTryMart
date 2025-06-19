const Admin = require('../../../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// Create Admin
const createAdmin = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    const image = req.file ? `/uploads/admin/${req.file.filename}` : null;

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { mobile }]
    });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      mobile,
      email,
      password: hashedPassword,
      image
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/admin/${req.file.filename}`;
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ message: 'Admin updated successfully', admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const admin = await Admin.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
        status: true,
      message: 'Login successful',
      token,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        image: admin.image
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  createAdmin,
  updateAdmin,
  loginAdmin
};
