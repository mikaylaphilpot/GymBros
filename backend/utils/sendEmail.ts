import transporter from '../config/mailer';

async function sendEmail(to: string, subject: string, text: string): Promise<void> {

    try{
        if (
            !process.env.SMTP_HOST?.trim() ||
            !process.env.SMTP_USER?.trim() ||
            !process.env.SMTP_PASS ||
            !Number.isInteger(Number(process.env.SMTP_PORT))
        ) {
            throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in backend/.env.');
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: to,
            subject: subject,
            text: text
        });


    } catch (error: unknown) {

        console.error('Send email error:', error);
        throw error;
    }
}

export default sendEmail;