const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

const testEmail = async () => {
    console.log('Testing Email Configuration...');
    console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    // console.log('EMAIL_PASS:', process.env.EMAIL_PASS); // Hidden for security

    let transporterConfig;
    if (process.env.EMAIL_SERVICE === 'godaddy') {
        transporterConfig = {
            host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                ciphers: 'SSLv3', // Required for some GoDaddy configurations
                rejectUnauthorized: false
            },
            logger: true,
            debug: true,
            connectionTimeout: 10000,
            greetingTimeout: 10000
        };
    } else {
        transporterConfig = {
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully!');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email - Wear Classences',
            text: 'This is a test email to verify SMTP configuration.'
        };

        console.log('Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send test email:');
        console.error(error);
    }
};

testEmail();
