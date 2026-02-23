const express = require('express');
const router = express.Router();
const CompanyInfo = require('../models/CompanyInfo');
const ContactMessage = require('../models/ContactMessage');
const { protect } = require('../middleware/authMiddleware');

// --- Company Info Routes ---

// @desc    Get company info (Public)
// @route   GET /api/settings/company-info
// @access  Public
router.get('/company-info', async (req, res) => {
    try {
        const info = await CompanyInfo.getSettings();
        res.json(info);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update company info (Admin)
// @route   PUT /api/settings/company-info
// @access  Private/Admin
router.put('/company-info', protect, async (req, res) => {
    try {
        let info = await CompanyInfo.findOne();
        if (!info) {
            info = new CompanyInfo();
        }

        info.address = req.body.address || info.address;
        info.gstin = req.body.gstin || info.gstin;
        info.phone = req.body.phone || info.phone;
        info.queryPhone = req.body.queryPhone || info.queryPhone;
        info.email = req.body.email || info.email;
        info.lastUpdated = Date.now();

        const updatedInfo = await info.save();
        res.json(updatedInfo);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// --- Contact Message Routes ---

// @desc    Submit a contact message (Public)
// @route   POST /api/settings/contact
// @access  Public
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const newMessage = await ContactMessage.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({ message: 'Message sent successfully', data: newMessage });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get all contact messages (Admin)
// @route   GET /api/settings/messages
// @access  Private/Admin
router.get('/messages', protect, async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Delete a message
// @route   DELETE /api/settings/messages/:id
// @access  Private/Admin
router.delete('/messages/:id', protect, async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        await message.deleteOne();
        res.json({ message: 'Message removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
