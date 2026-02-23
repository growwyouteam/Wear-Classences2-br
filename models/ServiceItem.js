const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema({
    icon: { type: String, required: true }, // SVG string or Base64 icon
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ServiceItem', serviceItemSchema);
