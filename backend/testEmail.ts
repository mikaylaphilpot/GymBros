import 'dotenv/config';
import sendEmail from './utils/sendEmail'; // Adjust path if needed

async function testEmail(): Promise<void> {
    try {
        await sendEmail(
            '',
            'Mailgun Test Email',
            'Hello! This is a test email sent using Mailgun and Nodemailer.'
        );

        console.log('Test email submitted successfully!');
    } catch (error: unknown) {
        console.error('Email test failed:', error);
    }
}

testEmail();