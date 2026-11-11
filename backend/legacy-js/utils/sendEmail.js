const transporter = require('../config/mailer.js');

async function sendEmail(to, subject, text){

    try{

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: to,
            subject: subject,
            text: text
        });


    }catch(error){

        console.error('Send email error:', error);
        throw error;
    }
}

module.exports = sendEmail;