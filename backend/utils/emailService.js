const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables using absolute path so it works regardless of CWD
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
        // If port is specified in env, use it, otherwise default to 465 (secure SSL)
        const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465;
        const secure = process.env.EMAIL_SECURE !== undefined 
            ? process.env.EMAIL_SECURE === 'true' 
            : (port === 465);

        console.log(`Initializing email transporter: host=${host}, port=${port}, secure=${secure}`);

        transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user: (process.env.EMAIL_USER || '').trim(),
                pass: (process.env.EMAIL_PASS || '').trim()
            },
            tls: {
                // Do not fail on invalid certificates (useful for some networks/environments)
                rejectUnauthorized: false
            }
        });
    }
    return transporter;
};

const sendEmail = async (to, subject, html) => {
    try {
        if (!to) {
            console.warn('sendEmail skipped: recipient email is undefined or empty.');
            return false;
        }

        const emailUser = (process.env.EMAIL_USER || '').trim();
        const emailPass = (process.env.EMAIL_PASS || '').trim();

        if (!emailUser || !emailPass) {
            const errorMessage = 'Email credentials are not configured in environment variables.';
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        const mailOptions = {
            from: `"Placement Portal" <${emailUser}>`,
            to: to.trim(),
            subject,
            html
        };

        const transport = getTransporter();
        await transport.sendMail(mailOptions);
        console.log(`Email sent successfully to: ${to}`);
        return true;
    } catch (error) {
        console.error(`Email sending failed to ${to}:`, error);
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

module.exports = { sendEmail };

