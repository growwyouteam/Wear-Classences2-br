const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    // Replaced original 'description' with 'shortDescription' and 'fullDescription'
    shortDescription: { type: String },
    fullDescription: { type: String },
    price: { type: Number, required: true }, // This is the Sale Price
    mrp: { type: Number }, // Maximum Retail Price
    shippingCharge: { type: Number, default: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }], // Array of image URLs/paths (assuming this was the intent for 'images: image: [String]')
    videoUrl: { type: String },
    size: { type: String }, // Can be comma separated or JSON if needed later
    showOnLanding: { type: Boolean, default: false },
    variants: [{
        variant: { type: String }, // e.g., "Color: Red", "Flavor: Vanilla"
        size: { type: String }, // e.g., "100ml", "500g", "M", "L"
        mrp: { type: Number },
        price: { type: Number }, // Sale price
        stock: { type: Number, default: 0 },
        unit: { type: String } // optional, e.g., "pack", "bottle"
    }],
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

// ==========================================
// PERFORMANCE: Database Indexes
// ==========================================
// Index for filtering by status (most common query)
productSchema.index({ status: 1 });

// Index for filtering by category
productSchema.index({ categoryId: 1 });

// Compound index for common query: active products in a category
productSchema.index({ status: 1, categoryId: 1 });

// Index for sorting by creation date (newest first)
productSchema.index({ createdAt: -1 });

// Index for landing page products
productSchema.index({ showOnLanding: 1, status: 1 });

// Text index for search functionality
productSchema.index({ name: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Product', productSchema);
