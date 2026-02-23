const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['category-strip', 'hero', 'featured-products', 'category-products', 'banner', 'services', 'newsletter']
    },
    title: { type: String }, // For section headers
    subtitle: { type: String },

    // For Banner or specific visual sections
    image: { type: String }, // Base64 string
    ctaText: { type: String },
    ctaLink: { type: String },

    // For content references
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Configuration
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Layout specifics (optional)
    layout: { type: String, default: 'grid' } // e.g. grid, carousel
}, { timestamps: true });

module.exports = mongoose.model('HomeSection', homeSectionSchema);
