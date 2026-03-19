const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

// Force use of Google DNS (same fix as db.js)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');

const Admin = require('./models/Admin');

async function seedAdmin() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 20000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('✅ MongoDB Connected');

        const email = 'classense.in@gmail.com';
        const plainPassword = 'privacy12@';

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        // Remove ALL old admins first
        await Admin.deleteMany({});
        console.log('🗑️  Old admin(s) removed');

        // Create fresh admin
        await Admin.create({ email, password: hashedPassword });
        console.log(`✅ New Admin CREATED: ${email}`);

        console.log(`\n📧 Login Email   : ${email}`);
        console.log(`🔑 Login Password: ${plainPassword}`);
        console.log('\n✅ Done! You can now login to admin panel.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedAdmin();
