const express = require('express');
const multer = require('multer');
const { protect } = require('./../controllers/authController.js');
const {
  getTweets,
  addNewTweet,
  getTweet,
  likeTweet,
  dislikeTweet,
  replyToTweet,
  deleteTweet,
  reTweet,
} = require('./../controllers/tweetController.js');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router
  .route('/')
  .get(protect, getTweets)
  .post(protect, upload.single('tweetImage'), addNewTweet);

router
  .route('/:id')
  .get(protect, getTweet)
  .post(protect, reTweet)
  .delete(protect, deleteTweet);

router.route('/:id/like').patch(protect, likeTweet);

router.route('/:id/dislike').patch(protect, dislikeTweet);

router
  .route('/:id/reply')
  .post(protect, upload.single('thisTweetImage'), replyToTweet);

module.exports = router;
