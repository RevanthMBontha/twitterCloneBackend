const User = require('./../models/userModel');
const Tweet = require('./../models/tweetModel');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Function to get all tweets
const getTweets = async (req, res) => {
  const tweets = await Tweet.find()
    .populate({ path: 'tweetedBy', select: 'name username profilePicture' })
    .sort('-createdAt');
  res.status(200).json({
    status: 'success',
    tweets,
  });
};

// Function to add a new tweet
const addNewTweet = async (req, res) => {
  const tweetImage = req.file;

  const user = await User.findById(req.user.id);
  const tweetsByUser = await Tweet.find({ tweetedBy: user._id });

  // If there is an image, then upload it to the ImgBB website
  if (tweetImage) {
    try {
      // Creating a FormData object to send the image to ImgBB
      const formData = new FormData();
      formData.append('image', fs.createReadStream(tweetImage.path));
      formData.append(
        'name',
        `${user.username}-tweet-${tweetsByUser.length + 1}`
      );

      // Uploading the image to ImgBB website
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_CLIENT_ID}`,
        formData
      );

      // Adding the uploaded image URL to the body of the request
      req.body.image = response.data.data.url;

      // Deleting the file from the Uploads folder
      fs.unlink(`${__dirname}/../${tweetImage.path}`, (err) => {
        if (err) {
          console.error('Error dealing file:', err);
          return;
        }
      });
    } catch (err) {
      // Catch statement for uploading the image to ImgBB database
      return res.status(err.response.status).json({
        status: 'failed',
        message: err.response.statusText,
      });
    }
  }

  req.body.tweetedBy = req.user.id;

  if (!req.body.image) {
    req.body.image = '';
  }

  let thisTweet;
  try {
    thisTweet = await Tweet.create({
      content: req.body.tweetContent,
      image: req.body.image,
      tweetedBy: req.user.id,
    });
  } catch (error) {
    console.log(error);
  }

  res.status(200).json({
    status: 'success',
    tweet: thisTweet,
  });
};

// Function to get a specific tweet
const getTweet = async (req, res) => {
  const { id } = req.params;

  const thisTweet = await Tweet.findById(id)
    .populate('tweetedBy')
    .populate({ path: 'rePostTweet', populate: { path: 'tweetedBy' } })
    .select('-password');

  res.status(200).json({
    status: 'success',
    tweet: thisTweet,
  });
};

// Function to like a tweet
const likeTweet = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const updatedTweet = await Tweet.findByIdAndUpdate(
    id,
    { $push: { likes: userId } },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Liked Tweet',
    tweet: updatedTweet,
  });
};

// Function to dislike a tweet
const dislikeTweet = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const updatedTweet = await Tweet.findByIdAndUpdate(
    id,
    { $pull: { likes: userId } },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Disliked Tweet',
    tweet: updatedTweet,
  });
};

// Function to reply to tweet
const replyToTweet = async (req, res) => {
  const tweetImage = req.file;
  const { id } = req.params;

  const thisUserId = req.user.id;
  const tweetsByUser = await Tweet.find({ tweetedBy: req.user.id });

  let user;
  try {
    user = await User.findById(thisUserId);
  } catch (error) {
    console.log(error);
  }

  // If there is an image, then upload it to the ImgBB website
  if (tweetImage) {
    try {
      // Creating a FormData object to send the image to ImgBB
      const replyformData = new FormData();
      replyformData.append('image', fs.createReadStream(tweetImage.path));
      replyformData.append(
        'name',
        `${user.username}-tweet-${tweetsByUser.length + 1}`
      );

      // Uploading the image to ImgBB website
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_CLIENT_ID}`,
        replyformData
      );

      // Adding the uploaded image URL to the body of the request
      req.body.thisTweetImage = response.data.data.url;

      // Deleting the file from the Uploads folder
      fs.unlink(`${__dirname}/../${tweetImage.path}`, (err) => {
        if (err) {
          console.error('Error dealing file:', err);
          return;
        }
      });
    } catch (err) {
      // Catch statement for uploading the image to ImgBB database
      console.log(err);
      return res.status(err.response.status).json({
        status: 'failed',
        message: err.response.statusText,
      });
    }
  }

  let thisTweet;
  try {
    thisTweet = await Tweet.create({
      image: req.body.thisTweetImage,
      content: req.body.thisTweetContent,
      tweetedBy: req.user.id,
      isReply: true,
    });
  } catch (error) {
    console.log(error);
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    id,
    { $push: { replies: thisTweet._id } },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Updated the tweet and added reply',
  });
};

// Function to retweet a tweet
const reTweet = async (req, res) => {
  const { id } = req.params;

  // Get the tweet being reposted and add the user reposting to retweetedBy
  const updatedTweet = await Tweet.findByIdAndUpdate(
    id,
    { $push: { reTweetBy: req.user.id } },
    { new: true }
  );

  // Create a new Tweet for the added details
  const newTweet = await Tweet.create({
    content: req.body.content,
    tweetedBy: req.user.id,
    isReTweet: true,
    rePostTweet: id,
  });

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Retweeted the tweet',
    },
  });
};

// Function to delete a tweet
const deleteTweet = async (req, res) => {
  const { id } = req.params;

  const tweetToDelete = await Tweet.findById(id);

  // If tweet is a reply, then delete the reference to the original post as well

  // If the Tweet to delete is a re-tweet, then delete the reference in the original tweet as well
  let updatedOriginalTweet;
  if (tweetToDelete.isReTweet) {
    updatedOriginalTweet = await Tweet.findByIdAndUpdate(
      tweetToDelete.rePostTweet,
      { $pull: { reTweetBy: tweetToDelete.tweetedBy } },
      { new: true }
    );
  }

  // Delete the tweet we want to be deleted
  const test = await Tweet.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Deleted Tweet successfully',
    },
  });
};

module.exports = {
  getTweets,
  addNewTweet,
  getTweet,
  likeTweet,
  dislikeTweet,
  replyToTweet,
  reTweet,
  deleteTweet,
};
