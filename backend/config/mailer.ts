import nodemailer from 'nodemailer';
import './env.js';

// Uncomment these temporarily to check which SMTP settings were loaded.
// console.log('SMTP Host:', process.env.SMTP_HOST);
// console.log('SMTP Port:', process.env.SMTP_PORT);
// console.log('SMTP User configured:', Boolean(process.env.SMTP_USER));

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT);

// Create the reusable SMTP transporter used by sendEmail.
const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    // On port 2525, connect normally and require STARTTLS before sending mail.
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Bound connection, server greeting, and socket waits to avoid hanging.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
});

export default transporter;