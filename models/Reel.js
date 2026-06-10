const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    youtubeUrl: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    ctaText: { 
        type: String 
    },
    ctaLink: { 
        type: String 
    },
    order: { 
        type: Number, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Reel', reelSchema);
