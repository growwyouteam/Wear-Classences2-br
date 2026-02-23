const mongoose = require('mongoose');

const companyInfoSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        default: 'Kh. No. 349 JAGDISHPURA Agra, 09-Uttar Pradesh, India'
    },
    gstin: {
        type: String,
        default: '09AATCM2683D1Z2'
    },
    phone: {
        type: String,
        required: true,
        default: '+91 8347298179'
    },
    queryPhone: {
        type: String,
        default: '+91 9458492978 (Queries)'
    },
    email: {
        type: String,
        required: true,
        default: 'support@mfauayurveda.com'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure only one document exists
companyInfoSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('CompanyInfo', companyInfoSchema);
