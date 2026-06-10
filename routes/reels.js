const express = require('express');
const router = express.Router();
const Reel = require('../models/Reel');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/reels
// @desc    Get all active reels (Public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const reels = await Reel.find({ isActive: true }).sort({ order: 1 });
        res.json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/reels/admin
// @desc    Get all reels (Admin)
// @access  Private/Admin
router.get('/admin', protect, async (req, res) => {
    try {
        const reels = await Reel.find().sort({ order: 1 });
        res.json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/reels
// @desc    Create a new reel (Admin)
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    try {
        const { title, youtubeUrl, description, ctaText, ctaLink, order, isActive } = req.body;
        const reel = new Reel({
            title,
            youtubeUrl,
            description,
            ctaText,
            ctaLink,
            order,
            isActive
        });
        const savedReel = await reel.save();
        res.status(201).json(savedReel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   PUT /api/reels/:id
// @desc    Update a reel (Admin)
// @access  Private/Admin
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, youtubeUrl, description, ctaText, ctaLink, order, isActive } = req.body;
        const reel = await Reel.findById(req.params.id);
        
        if (reel) {
            reel.title = title !== undefined ? title : reel.title;
            reel.youtubeUrl = youtubeUrl !== undefined ? youtubeUrl : reel.youtubeUrl;
            reel.description = description !== undefined ? description : reel.description;
            reel.ctaText = ctaText !== undefined ? ctaText : reel.ctaText;
            reel.ctaLink = ctaLink !== undefined ? ctaLink : reel.ctaLink;
            reel.order = order !== undefined ? order : reel.order;
            reel.isActive = isActive !== undefined ? isActive : reel.isActive;
            
            const updatedReel = await reel.save();
            res.json(updatedReel);
        } else {
            res.status(404).json({ message: 'Reel not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   DELETE /api/reels/:id
// @desc    Delete a reel (Admin)
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        
        if (reel) {
            await reel.deleteOne();
            res.json({ message: 'Reel removed' });
        } else {
            res.status(404).json({ message: 'Reel not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/reels/reorder
// @desc    Reorder reels (Admin)
// @access  Private/Admin
router.post('/reorder', protect, async (req, res) => {
    const { items } = req.body; // Array of { id, order }
    
    try {
        const promises = items.map(item =>
            Reel.findByIdAndUpdate(item.id, { order: item.order })
        );
        await Promise.all(promises);
        res.json({ message: 'Reels order updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
