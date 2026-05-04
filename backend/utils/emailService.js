const nodemailer = require('nodemailer');
require('dotenv').config();

const dns = require('dns');

let transporter = null;

// Dynamically resolve IPv4 to completely bypass Render's IPv6 ENETUNREACH issue
const getTransporter = async () => {
    if (transporter) return transporter;

    try {
        const addresses = await dns.promises.resolve4('smtp.gmail.com');
        const ipv4Host = addresses[0]; // Gets a guaranteed IPv4 address e.g. 142.250.115.108
        
        transporter = nodemailer.createTransport({
            host: ipv4Host, 
            port: 587,
            secure: false, // false for 587
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                servername: 'smtp.gmail.com', // Required when connecting via IP address
                rejectUnauthorized: false
            }
        });
        return transporter;
    } catch (err) {
        console.error('DNS Resolution failed:', err);
        // Fallback
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        return transporter;
    }
};

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

        const activeTransporter = await getTransporter();
        await activeTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

module.exports = { sendEmail };
