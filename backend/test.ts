// Manual helper functions for checking the database and SMTP connection.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import transporter from './config/mailer';
import sendEmail from './utils/sendEmail';

dotenv.config();

// Connects to MongoDB, prints the database name, and always disconnects.
async function testConnection() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set.');
        }
        await mongoose.connect(mongoUri);

        console.log('MongoDB connected successfully!');
        console.log('Database:', mongoose.connection.name);

    } catch (error: unknown) {
        console.error('MongoDB connection failed:', error instanceof Error ? error.message : error);
    } finally {
        await mongoose.disconnect();
    }
}


// Verifies the configured SMTP connection without sending a message.
async function testEmail() {
    try {

        await transporter.verify();
        console.log('SMTP connected successfully!');


    } catch (error: unknown) {
        console.error('SMTP connection failed:', error instanceof Error ? error.message : error);
    }
}

// Sends a message to the configured SMTP account as a delivery check.
async function testSendEmail() {

    try {
        const smtpUser = process.env.SMTP_USER;
        if (!smtpUser) {
            throw new Error('SMTP_USER is not set.');
        }

        await sendEmail(
            smtpUser,
            "GymBros Test Email",
            "This is a test email from GymBros!"
        );

        console.log('Email sent successfully!');
    } catch (error: unknown) {
        console.error('Email send failed:', error instanceof Error ? error.message : error);
    }
}

testConnection();
testEmail();
testSendEmail();
