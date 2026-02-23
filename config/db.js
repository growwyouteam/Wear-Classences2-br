const mongoose = require('mongoose');
const dns = require('dns');

// Force use of Google DNS if local DNS fails to resolve SRV records
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    console.log('🌐 Using public DNS resolvers (Google/Cloudflare) for MongoDB connection');
} catch (err) {
    console.warn('⚠️  Could not set custom DNS servers:', err.message);
}

const connectDB = async () => {
    const maxRetries = 3;
    let currentRetry = 0;

    // Function to convert SRV connection string to standard format (Basic fallback)
    const getStandardUri = (srvUri) => {
        const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
        if (match) {
            const [, username, password, host, database] = match;
            return `mongodb://${username}:${password}@${host}/${database}?retryWrites=true&w=majority`;
        }
        return null;
    };

    const tryConnect = async (uri, options, retryCount) => {
        try {
            console.log(`\nAttempt ${retryCount + 1}/${maxRetries}: Connecting to MongoDB...`);
            await mongoose.connect(uri, options);
            console.log('✅ MongoDB Connected Successfully\n');
            return true;
        } catch (error) {
            console.error(`❌ Connection attempt ${retryCount + 1} failed:`, error.message);
            if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                console.log('💡 Note: This is often a DNS or network issue (ISP blocking MongoDB Atlas).');
            }
            return false;
        }
    };

    while (currentRetry < maxRetries) {
        const options = {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 to avoid IPv6 resolution issues
        };

        // First, try with the original SRV URI
        const connected = await tryConnect(process.env.MONGO_URI, options, currentRetry);

        if (connected) {
            return;
        }

        // If SRV fails, try standard connection string as a fallback
        if (currentRetry === maxRetries - 1 && process.env.MONGO_URI.includes('mongodb+srv')) {
            console.log('\n🔄 Trying alternative connection method (standard URI fallback)...');
            const standardUri = getStandardUri(process.env.MONGO_URI);

            if (standardUri) {
                try {
                    await mongoose.connect(standardUri, options);
                    console.log('✅ MongoDB Connected Successfully (using fallback URI)\n');
                    return;
                } catch (error) {
                    console.error('❌ Fallback connection also failed:', error.message);
                }
            }
        }

        currentRetry++;

        if (currentRetry < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(2, currentRetry), 5000);
            console.log(`⏳ Waiting ${waitTime}ms before retry...\n`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    // All retries failed - LOG WARNING BUT DON'T EXIT
    console.error('\n⚠️  WARNING: MongoDB connection failed after all retries');
    console.error('⚠️  Server is running WITHOUT database connection');
    console.error('⚠️  Database features will not work until resolved\n');
    console.error('🔍 ULTIMATE FIX (The "Alternative Approach"):');
    console.error('1. Your network is blocking MongoDB SRV DNS lookups.');
    console.error('2. You MUST use a standard connection string (starts with mongodb:// NOT mongodb+srv://)');
    console.error('3. Go to MongoDB Atlas → Connect → Drivers → Copy standard connection string');
    console.error('4. Replace MONGO_URI in .env with that string.');
};

module.exports = connectDB;
