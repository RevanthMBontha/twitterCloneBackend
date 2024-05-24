const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A User must have a name!'],
      minlength: [4, 'A name must be at least 4 characters'],
    },
    username: {
      type: String,
      required: [true, 'A User must have a username'],
      unique: [true, 'A username must be unique'],
      minlength: [4, 'A username must be at least characters'],
    },
    email: {
      type: String,
      required: [true, 'A user must have a username'],
    },
    password: {
      type: String,
      required: [true, 'A user must have a password'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'A user must have a date of birth'],
    },
    followers: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
      default: [],
    },
    following: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
