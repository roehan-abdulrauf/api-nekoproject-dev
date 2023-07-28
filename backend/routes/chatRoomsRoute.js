const express = require('express');
const { getAllChatRooms, setChatRoom, deleteChatRoom, getChatRoom, updateChatRoom} = require('../controllers/chatRoomsController');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAllChatRooms).post(protect, setChatRoom);
router.route('/:id').get(protect, getChatRoom).delete(protect, deleteChatRoom).put(protect, updateChatRoom);
// router.route('/admin/:id').put(protect, updateMessageAdmin).delete(protect, deleteMessageAdmin);

module.exports = router;