import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP Port:', process.env.SMTP_PORT);
console.log('SMTP User configured:', Boolean(process.env.SMTP_USER));

// Create the reusable SMTP transporter used by sendEmail.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
});

export default transporter;