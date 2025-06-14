const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const userController = require('../controllers/userController');

// Routes
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/upload-profile', upload.single('profile'), userController.uploadProfilePicture);

module.exports = router;
