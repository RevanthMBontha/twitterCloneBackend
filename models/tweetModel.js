const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'A tweet must have some content'],
    },
    tweetedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A tweet must be tweeted by somebody'],
    },
    likes: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
      default: [],
    },
    reTweetBy: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
    replies: {
      type: [mongoose.Schema.ObjectId],
      ref: 'Tweet',
      default: [],
    },
    isReply: {
      type: Boolean,
      default: false,
    },
    isReTweet: {
      type: Boolean,
      default: false,
    },
    rePostTweet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tweet',
    },
  },
  {
    timestamps: true,
    toJSON: {
      select: { password: 0 },
    },
  }
);

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;
