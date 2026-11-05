//TEST FUNCTION TO CHECK DB CONNECTION
require('dotenv').config();
const mongoose = require('mongoose');
const transporter = require('./config/mailer.js')
const send = require('./utils/sendEmail.js');
const sendEmail = require('./utils/sendEmail.js');

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


async function testEmail() {
    try {

        await transporter.verify();
        console.log('SMTP connected successfully!');


    } catch (error) {
        console.error('SMTP connection failed:', error.message);
    }
}

async function testSendEmail() {

    try {
        await sendEmail(
            process.env.SMTP_USER,
            "GymBros Test Email",
            "This is a test email from GymBros!"
        );

        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Email send failed:', error.message);
    }
}

testConnection();
testEmail();
testSendEmail();
