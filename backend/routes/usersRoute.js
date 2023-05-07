const express = require('express');
const { getAllUsers, getUser, registerUser, login, logout, mailVerified, getMe, updateUser, deleteUser, updateUserAdmin, deleteUserAdmin } = require('../controllers/usersController');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(registerUser).get(protect, getAllUsers);
router.route('/:id').get(protect, getUser).delete(protect, deleteUser);
router.route('/admin/:id').delete(protect, deleteUserAdmin).put(protect, updateUserAdmin);
router.post('/login', login);
router.put('/logout', protect, logout);
router.get('/me/find', protect, getMe);
router.put('/me/update', protect, updateUser);
router.put('/mailVerified', mailVerified);
module.exports = router;