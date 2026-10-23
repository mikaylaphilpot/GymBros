const mongoose = require('mongoose');

async function connectToMongoDB() {
  await mongoose.connect("mongodb+srv://laehpimentel_db_user:CRR5PVFyxhYr6R2B@dev-gymbros.abktuqj.mongodb.net/");
  console.log('Connected to MongoDB');
}

async function disconnectFromMongoDB() {
  await mongoose.disconnect();
}

module.exports = { connectToMongoDB, disconnectFromMongoDB };