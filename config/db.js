const mongoose = require('mongoose');

async function connectDatabase() {
  const databaseUrl = process.env.MONGODB_URI;

  if (!databaseUrl) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.');
  }

  await mongoose.connect(databaseUrl);
  console.log('MongoDB connected');
}

module.exports = connectDatabase;
