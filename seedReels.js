const mongoose = require('mongoose');
const Reel = require('./models/Reel');
const dns = require('dns');
require('dotenv').config();

// Force use of Google DNS if local DNS fails to resolve SRV records
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    console.log('🌐 Using public DNS resolvers (Google/Cloudflare) for MongoDB connection');
} catch (err) {
    console.warn('⚠️  Could not set custom DNS servers:', err.message);
}

const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4 to avoid IPv6 resolution issues
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, options)
    .then(() => console.log('MongoDB Connected successfully for seeding Reels...'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const sampleReels = [
    {
        title: "Nike Air Force 1 - Classic Styling Guide",
        youtubeUrl: "https://www.youtube.com/watch?v=kQD26aO4kQM",
        description: "See how we style the timeless Nike Air Force 1 with 5 different modern outfits. From casual streetwear to semi-formal smart casuals.",
        ctaText: "Shop Collection",
        ctaLink: "footwear-collection.html",
        order: 0,
        isActive: true
    },
    {
        title: "Air Jordan 1 Retro - Unboxing & Review",
        youtubeUrl: "https://www.youtube.com/watch?v=Fie8o9kY_b8",
        description: "A close look at the premium leather quality, stitching details, and on-feet comfort of the legendary Air Jordan 1 Retro.",
        ctaText: "Explore Jordans",
        ctaLink: "footwear-collection.html",
        order: 1,
        isActive: true
    },
    {
        title: "Sneaker Collection - Minimalist Wardrobe Essentials",
        youtubeUrl: "https://www.youtube.com/watch?v=n-P1C6H5d-M",
        description: "The only 5 shoes a modern man needs in his wardrobe. Building a high-quality, versatile shoe collection with Classense.",
        ctaText: "Shop Minimalist",
        ctaLink: "footwear-collection.html",
        order: 2,
        isActive: true
    },
    {
        title: "Premium Leather Chelsea Boots Showcase",
        youtubeUrl: "https://www.youtube.com/watch?v=gTchU5Vw5yY",
        description: "Handcrafted full-grain leather Chelsea boots. Detailing the Goodyear welt construction and water-resistant suede texture.",
        ctaText: "View Boots",
        ctaLink: "footwear-collection.html",
        order: 3,
        isActive: true
    }
];

async function seedReels() {
    try {
        // Clear existing reels
        await Reel.deleteMany({});
        console.log('Cleared existing reels database');

        // Insert new reels
        const result = await Reel.insertMany(sampleReels);
        console.log(`Successfully seeded ${result.length} active Reels into database`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding Reels:', error);
        process.exit(1);
    }
}

seedReels();
