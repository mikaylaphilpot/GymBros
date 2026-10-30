const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function connectToMongoDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env or the environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
}

async function disconnectFromMongoDB() {
  await mongoose.disconnect();
}

module.exports = { connectToMongoDB, disconnectFromMongoDB };
