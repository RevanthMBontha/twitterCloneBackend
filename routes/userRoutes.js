const express = require('express');
const multer = require('multer');
const { protect } = require('../controllers/authController.js');
const {
  getUser,
  getUserWithId,
  followUser,
  unFollowUser,
  getTweetsByUser,
  getUserReplies,
  getUserLikedPosts,
  editUser,
  addProfilePicture,
  popularUsers,
} = require('../controllers/userController.js');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.route('/popular').get(protect, popularUsers);

router.route('/user/:id').get(protect, getUserWithId);

router
  .route('/:handle')
  .get(protect, getUser)
  .patch(protect, upload.single('profilePicture'), editUser);

router.route('/:handle/follow').post(protect, followUser);

router.route('/:handle/unfollow').post(protect, unFollowUser);

router.route('/:handle/tweets').get(protect, getTweetsByUser);

router.route('/:handle/replies').get(protect, getUserReplies);

router.route('/:handle/likes').get(protect, getUserLikedPosts);

// router.route('/:handle/uploadProfilePic').patch(protect, addProfilePicture);

module.exports = router;
