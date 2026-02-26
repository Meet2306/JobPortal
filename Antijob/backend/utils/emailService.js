const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Placement Portal" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        // In dev mode without real creds, just log to console
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('MOCK EMAIL SENT TO:', to);
            console.log('SUBJECT:', subject);
            return true;
        }

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

module.exports = { sendEmail };
