const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes.js');
const tweetRoutes = require('./routes/tweetRoutes.js');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Adding created at time to the request when it is received by the server
app.use((req, res, next) => {
  req.createdAt = new Date();
  next();
});

app.get('/', function (req, res) {
  res.status(200).json({
    status: 'success',
    message: 'Hello, World!',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tweets', tweetRoutes);

module.exports = app;
