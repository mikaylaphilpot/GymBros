import transporter from '../config/mailer';

async function sendEmail(to: string, subject: string, text: string): Promise<void> {

    try{

        await transporter.sendMail({
            from: process.env.SMTP_USER,
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