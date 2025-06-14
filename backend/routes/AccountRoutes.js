const auth = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const User = require('../models/User');

router.get('/profile', auth, async (req, res) => {

    var user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status:false, message: 'User not found', data:{} });

    res.json({status:true, message: 'User Profile', data:user});
});

router.post('/update-profile', auth, async (req, res) => {

    var user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status:false, message: 'User not found', data:{} });

    const updated_user = await User.findByIdAndUpdate(
        req.user.id, req.body, { new: true }
    );

    res.json({ status:true, message: 'Profile updated success', data:updated_user });
});



// Upload Media
router.post('/upload-media', upload.single('file'), async (req, res) => {
  try {
    res.status(200).json({ message: 'File uploaded successfully', file: process.env.MEDIA_URL + req.file.path.replace(/\\/g, '/') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', async (req, res) => {

    /**
     * Todays User's
     */
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysUsers = await User.countDocuments({
        role: "user",
        created_at: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });

    /**
     * Total Registered User's
     */
    var user = await User.countDocuments({'role':'user'});

    let statistics = [{
        user: user.toString(),
    }]



    res.json({ status:true, message: 'Dashboard details', data:statistics });
});

module.exports = router;