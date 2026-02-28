const nodemailer = require('nodemailer');

/**
 * Creates a reusable transporter object using the default SMTP transport.
 * Configured for Gmail.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Sends an email using the provided options.
 * 
 * @param {Object} options - Email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.html - HTML content of the email.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
const sendEmail = async (options) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Email credentials missing in .env. Skipping email sending.");
            return false;
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"My Store" <no-reply@mystore.com>',
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        // Important: We return false instead of throwing to prevent breaking
        // the main payment flow if just the email fails.
        return false;
    }
};

module.exports = sendEmail;
