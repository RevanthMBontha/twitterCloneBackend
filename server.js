const mongoose = require('mongoose');
const app = require('./app.js');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const mongoDbURI = process.env.DB_CONN_STRING.replace(
  '<password>',
  process.env.DB_PASSWORD
);

mongoose
  .connect(mongoDbURI, {})
  .then(() => console.log('Database connection successful...'))
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}...`);
});

// Shutting down in case of unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
});
