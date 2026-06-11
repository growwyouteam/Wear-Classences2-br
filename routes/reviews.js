const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protectCustomer } = require('../middleware/authMiddleware');

// @route   GET /api/reviews/:productId
// @desc    Get all reviews for a product (public)
// @access  Public
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .sort({ createdAt: -1 })
            .lean();

        // Calculate average rating
        const totalRatings = reviews.length;
        const avgRating = totalRatings > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
            : 0;

        res.json({
            reviews,
            avgRating: parseFloat(avgRating),
            totalRatings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/reviews/:productId
// @desc    Submit a review for a product (customer only)
// @access  Private (Customer)
router.post('/:productId', protectCustomer, async (req, res) => {
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
    }

    try {
        // Check if customer already reviewed this product
        const existing = await Review.findOne({
            productId: req.params.productId,
            customerId: req.customer._id
        });

        if (existing) {
            return res.status(400).json({ message: 'Aapne is product ka review pehle se de diya hai.' });
        }

        const review = new Review({
            productId: req.params.productId,
            customerId: req.customer._id,
            customerName: req.customer.name,
            rating: parseInt(rating),
            comment: comment || ''
        });

        const savedReview = await review.save();
        res.status(201).json(savedReview);

    } catch (error) {
        // Duplicate key error from MongoDB unique index
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Aapne is product ka review pehle se de diya hai.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete own review (customer only)
// @access  Private (Customer)
router.delete('/:reviewId', protectCustomer, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review nahi mili.' });
        }

        // Only the author can delete their review
        if (review.customerId.toString() !== req.customer._id.toString()) {
            return res.status(403).json({ message: 'Aap sirf apna review delete kar sakte hain.' });
        }

        await review.deleteOne();
        res.json({ message: 'Review delete ho gayi.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
