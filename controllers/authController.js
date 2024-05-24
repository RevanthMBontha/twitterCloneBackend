const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { promisify } = require('util');

// Converting the synchronous JSONWebToken functions to Asynchronous funcitions
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);
const decodeAsync = promisify(jwt.decode);

const register = async (req, res) => {
  try {
    const profilePicture = req.file;
    const { name, username, email, password, passwordConfirm, dateOfBirth } =
      req.body;
    console.log('Uploaded file: ', req.file);
    console.log('Uploaded Body: ', req.body);

    // If there is an image, then upload it to the ImgBB website
    if (profilePicture) {
      try {
        // Creating a FormData object to send the image to ImgBB
        const formData = new FormData();
        formData.append('image', fs.createReadStream(profilePicture.path));
        formData.append('name', `${username}-pfp`);

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

    // Checking to see if all the required details are present
    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !passwordConfirm ||
      !dateOfBirth
    ) {
      console.log('Important details missing');
      return res.status(401).json({
        status: 'failed',
        message: 'Please enter all required fields',
      });
    }

    // Checking to see if the passwords match
    if (password !== passwordConfirm) {
      console.log('Password mismatch');
      return res.status(401).json({
        status: 'failed',
        message: 'Please make sure that both passwords are the same!',
      });
    }

    let user = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = { ...user, password: hashedPassword };

    const newUser = await User.create({ ...updatedUser });
    const newUserToSend = await User.findById(newUser._id).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user: newUserToSend,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      message: 'Internal server error',
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  let thisUser = await User.find({ email: email });

  if (thisUser.length === 0) {
    return res.status(401).json({
      status: 'failed',
      message: 'This user does not exist in the database',
    });
  }

  thisUser = thisUser[0];

  const isPasswordMatch = await bcrypt.compare(password, thisUser.password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      status: 'failed',
      message: 'Please enter the correct password and try again!',
    });
  }

  const payload = {
    id: thisUser._id,
  };

  const token = await signAsync(payload, process.env.JWT_SECRET);

  res.status(200).json({
    status: 'success',
    token: token,
    expiresIn:
      process.env.JWT_EXPIRES_IN === '1d' ? 24 * 60 * 60 * 1000 : 10 * 1000,
    id: thisUser._id,
    name: thisUser.name,
    handle: thisUser.username,
    profilePicture: thisUser.profilePicture,
    message: 'User logged in successfully',
  });
};

const logout = async (req, res) => {
  console.log(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      message: 'User logged out successfully',
    },
  });
};

const checkHandleAvailability = async (req, res) => {
  const handle = req.params.handle;

  let user = await User.find({ username: handle });
  user = user[0];

  if (!user) {
    res.status(200).json({
      isAvailable: true,
    });
  } else {
    res.status(200).json({
      isAvailable: false,
    });
  }
};

const checkExistingEmail = async (req, res) => {
  const email = req.params.email;

  let user = await User.find({ email: email });
  user = user[0];
  if (user) {
    res.status(200).json({
      alreadyExists: true,
    });
  } else {
    res.status(200).json({
      alreadyExists: false,
    });
  }
};

const checkDOB = async (req, res) => {
  const dob = req.params.dob;
  const enteredDOB = new Date(dob);
  const currentDate = new Date();

  res.status(200).json({
    isValid: currentDate > enteredDOB,
  });
};

const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token.startsWith('Bearer')) token = token.split(' ')[1];
  else
    return next(new Error('Auth Token not found. Cannot access private route'));

  let decoded = false;
  try {
    decoded = await verifyAsync(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log('Something went wrong trying to get decoded status');
    console.log(err);
  }

  const user = await User.findById(decoded.id);
  req.user = user;
  next();
};

module.exports = {
  protect,
  register,
  login,
  logout,
  checkHandleAvailability,
  checkExistingEmail,
  checkDOB,
};
