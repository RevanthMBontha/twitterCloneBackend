const mongoose = require('mongoose');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const User = require('./../models/userModel');
const Tweet = require('./../models/tweetModel');

// Function to get a specific user
const getUser = async (req, res) => {
  const { handle } = req.params;

  let thisUser = await User.find({ username: handle }).select('-password');
  thisUser = thisUser[0];

  if (!thisUser) {
    return res.status(400).json({
      status: 'failed',
      message: 'No such user found!',
    });
  }

  res.status(200).json({
    status: 'success',
    user: thisUser,
  });
};

// Function to get a user with a specific id
const getUserWithId = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: error.message,
    });
  }
};

// Function to follow a user
const followUser = async (req, res) => {
  console.log('***************************');
  console.log('Triggered Follow User!');
  const { handle } = req.params;
  let userToFollow = await User.find({ username: handle });
  userToFollow = userToFollow[0];
  console.log('User to follow is: ', userToFollow.name);

  const updatedUserToFollow = await User.findByIdAndUpdate(
    userToFollow._id,
    { $push: { followers: req.user.id } },
    { new: true }
  );

  const userFollowing = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { following: updatedUserToFollow._id } },
    { new: true }
  );

  console.log('User who followed is: ', userFollowing.name);

  res.status(200).json({
    status: 'success',
    message: 'Successfully followed the user',
  });
};

// Function to unfollow a user
const unFollowUser = async (req, res) => {
  console.log('***************************');
  console.log('Triggered Unfollow User!');
  const { handle } = req.params;
  let userToUnfollow = await User.find({ username: handle });
  userToUnfollow = userToUnfollow[0];
  console.log('User to Unfollow is: ', userToUnfollow.name);

  const updatedUserToFollow = await User.findByIdAndUpdate(
    userToUnfollow._id,
    { $pull: { followers: req.user.id } },
    { new: true }
  );

  const userUnFollowing = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { following: updatedUserToFollow._id } },
    { new: true }
  );

  console.log('User who followed is: ', userUnFollowing.name);

  res.status(200).json({
    status: 'success',
    message: 'Successfully Unfollowed the user',
  });
};

// Function to get tweets by a specific user
const getTweetsByUser = async (req, res) => {
  const { handle } = req.params;

  let thisUser = await User.find({ username: handle });
  thisUser = thisUser[0];

  const tweetsByUser = await Tweet.find({
    tweetedBy: thisUser._id,
    isReply: false,
  })
    .populate('tweetedBy')
    .sort('-createdAt');
  res.status(200).json({
    status: 'success',
    tweets: tweetsByUser,
  });
};

// Function to get user replies
const getUserReplies = async (req, res) => {
  const { handle } = req.params;

  let thisUser = await User.find({ username: handle });
  thisUser = thisUser[0];

  const replies = await Tweet.find({
    tweetedBy: thisUser._id,
    isReply: true,
  })
    .select('_id')
    .sort('-createdAt');

  const repliedTweets = await Tweet.find({
    replies: { $in: replies },
  })
    .select('_id replies')
    .sort('createdAt');

  const updatedTweetsAndCorrespondingReplies = repliedTweets.map((bItem) => {
    const match = replies.find((aItem) => bItem.replies.includes(aItem._id));
    if (match) {
      return { tweetRepliedTo: bItem._id, reply: match._id };
    }
  });

  res.status(200).json({
    status: 'success',
    replies: updatedTweetsAndCorrespondingReplies,
  });
};

// Function to get posts liked by user
const getUserLikedPosts = async (req, res) => {
  const { handle } = req.params;

  let thisUser = await User.find({ username: handle });
  thisUser = thisUser[0];

  const likedPosts = await Tweet.find({
    likes: { $in: thisUser._id },
    isReply: false,
  }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    likedPosts,
  });
};

// Function to edit user
const editUser = async (req, res) => {
  const profilePicture = req.file;
  console.log(profilePicture);

  // If there is an image, then upload it to the ImgBB website
  if (profilePicture) {
    console.log('Profile Picture exists. Trying to upload to imgbb');
    try {
      // Creating a FormData object to send the image to ImgBB
      console.log('Trying to create form data');
      const formData = new FormData();
      formData.append('image', fs.createReadStream(profilePicture.path));
      formData.append('name', `${req.user.username}-pfp`);

      console.log('Form Data appended!');

      // Uploading the image to ImgBB website
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_CLIENT_ID}`,
        formData
      );

      // Adding the uploaded image URL to the body of the request
      req.body.profilePicture = response.data.data.url;

      // Deleting the file from the Uploads folder
      fs.unlink(`${__dirname}/../${profilePicture.path}`, (err) => {
        if (err) {
          console.error('Error dealing file:', err);
          return;
        }
      });
    } catch (err) {
      // Catch statement for uploading the image to ImgBB database
      console.log(err.response.statusText);
      return res.status(err.response.status).json({
        status: 'failed',
        message: err.response.statusText,
      });
    }
  }

  console.log('Final Object to upload: ', req.body);

  let updatedUser;
  try {
    updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
    }).select('-password');
  } catch (error) {
    console.log(error);
  }

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
};

// Function to add profile picture
// Redundant because I added the functionality to add profile picture directly in the edit user function
// const addProfilePicture = async (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: {
//       message: 'Added Profile Picture',
//     },
//   });
// };

// Function to get the people with the most tweets
const popularUsers = async (req, res) => {
  try {
    const popularUsers = await Tweet.aggregate([
      { $match: { isReply: false } },
      {
        $group: {
          _id: '$tweetedBy',
          tweetCount: { $count: {} },
        },
      },
      { $sort: { tweetCount: -1 } },
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(req.user.id) } } },
      { $limit: 3 },
    ]);

    res.status(200).json({
      status: 'success',
      popularUsers,
    });
  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: error.message,
    });
  }
};

module.exports = {
  getUser,
  getUserWithId,
  followUser,
  unFollowUser,
  getTweetsByUser,
  getUserReplies,
  getUserLikedPosts,
  editUser,
  // addProfilePicture,
  popularUsers,
};
