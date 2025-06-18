const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const userController = require('../controllers/userController');
const auth = require("../middleware/authMiddleware");
const {
  getUserOrders,
  getUserOrderById,
} = require("../controllers/usersController/OrderController");
// Routes


// order routes
router.get("/orders", auth, getUserOrders);
router.get("/orders/:id", auth, getUserOrderById);

// user routes
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/upload-profile', upload.single('profile'), userController.uploadProfilePicture);




module.exports = router;
