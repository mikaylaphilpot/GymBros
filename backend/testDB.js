//TEST FUNCTION TO CHECK DB CONNECTION
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB connected successfully!');
        console.log('Database:', mongoose.connection.name);

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
