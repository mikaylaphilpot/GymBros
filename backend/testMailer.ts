import transporter from './config/mailer';

async function testConnection(): Promise<void> {
    try {
        await transporter.verify();
        console.log('Mailgun SMTP connection successful!');
    } catch (error: unknown) {
        console.error('Mailgun SMTP connection failed:', error);
    }
}

testConnection();