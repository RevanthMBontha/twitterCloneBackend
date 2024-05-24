const express = require('express');
const multer = require('multer');
const {
  protect,
  register,
  login,
  logout,
  checkHandleAvailability,
  checkExistingEmail,
  checkDOB,
} = require('./../controllers/authController');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

const test = (req, res, next) => {
  console.log(req);
  next();
};

router.route('/register').post(test, upload.single('avatar'), register);

router.route('/login').post(login);

router.route('/logout').post(logout);

router.route('/checkHandleAvailability/:handle').get(checkHandleAvailability);

router.route('/checkExistingEmail/:email').get(checkExistingEmail);

router.route('/checkDOB/:dob').get(checkDOB);

module.exports = router;
