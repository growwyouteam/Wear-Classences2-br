const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

const testEmail = async () => {
    console.log('Testing Resend Email Configuration...');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Loaded' : 'Missing');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ Please add your RESEND_API_KEY to the .env file in the backend directory.');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        console.log('Sending test email via Resend...');

        const mailOptions = {
            from: `Wear Classences <${process.env.EMAIL_USER || 'onboarding@resend.dev'}>`,
            to: process.env.EMAIL_USER || 'your_email@gmail.com', // Replace with your receiving email if needed
            subject: 'Test Email from Resend - Wear Classences',
            html: '<p>This is a test email to verify <strong>Resend</strong> configuration.</p>'
        };

        const data = await resend.emails.send(mailOptions);

        if (data.error) {
            console.error('❌ Failed to send test email with Resend API Error:');
            console.error(data.error);
            return;
        }

        console.log('✅ Test email sent successfully! Resend Delivery ID:', data.data.id);
    } catch (error) {
        console.error('❌ Exception occurred while sending test email:');
        console.error(error);
    }
};

testEmail();
