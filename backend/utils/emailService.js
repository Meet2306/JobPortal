const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Force IPv4 to prevent ENETUNREACH error on Render (IPv6 routing issues)
    // The "family" option is passed to the underlying socket connection.
    tls: {
        rejectUnauthorized: false
    }
});

// Since family: 4 is not always officially recognized inside tls object by some versions, 
// wait, the best way in modern nodemailer is just putting it directly in the root of the config:
transporter.options.family = 4;

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
