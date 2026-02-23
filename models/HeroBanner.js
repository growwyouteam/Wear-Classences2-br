const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true }, // Base64
    ctaText: { type: String, default: 'Shop Now' },
    ctaLink: { type: String, default: '#products' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('HeroBanner', heroBannerSchema);
