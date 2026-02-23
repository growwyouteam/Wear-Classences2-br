const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/coupons
// @desc    Create a new coupon
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    try {
        const { code, discountType, discountValue, applicability, applicableProducts, expiryDate, minPurchaseAmount, usageLimit } = req.body;

        // Check if code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = new Coupon({
            code,
            discountType,
            discountValue,
            applicability,
            applicableProducts,
            expiryDate,
            minPurchaseAmount,
            usageLimit
        });

        const createdCoupon = await coupon.save();
        res.status(201).json(createdCoupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/coupons
// @desc    Get all coupons
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT api/coupons/:id
// @desc    Update a coupon (e.g. toggle active status)
// @access  Private/Admin
router.put('/:id', protect, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (coupon) {
            coupon.isActive = req.body.isActive !== undefined ? req.body.isActive : coupon.isActive;
            // Can add other fields to update if needed

            const updatedCoupon = await coupon.save();
            res.json(updatedCoupon);
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE api/coupons/:id
// @desc    Delete a coupon
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (coupon) {
            await Coupon.deleteOne({ _id: coupon._id });
            res.json({ message: 'Coupon removed' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/coupons/active
// @desc    Get all active coupons for storefront
// @access  Public
router.get('/active', async (req, res) => {
    try {
        const currentDate = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: currentDate }
        }).sort({ createdAt: -1 });

        // Filter out those that have reached limit
        const availableCoupons = coupons.filter(c => c.usageLimit === null || c.usedCount < c.usageLimit);
        res.json(availableCoupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/coupons/product/:productId
// @desc    Get active coupons applicable to a specific product
// @access  Public
router.get('/product/:productId', async (req, res) => {
    try {
        const currentDate = new Date();
        const productId = req.params.productId;

        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: currentDate }
        }).sort({ createdAt: -1 });

        // Filter out those that have reached limit
        let availableCoupons = coupons.filter(c => c.usageLimit === null || c.usedCount < c.usageLimit);

        // Filter those applicable to this product specifically
        availableCoupons = availableCoupons.filter(c => {
            if (c.applicability === 'all') return true;
            if (c.applicability === 'specific') {
                return c.applicableProducts.some(id => id.toString() === productId.toString());
            }
            return false;
        });

        res.json(availableCoupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/coupons/validate
// @desc    Validate a coupon code against a cart
// @access  Public
router.post('/validate', async (req, res) => {
    try {
        const { code, cartTotal, cartItems } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Please provide a coupon code' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        if (!coupon.isValid()) {
            return res.status(400).json({ message: 'Coupon is expired or inactive' });
        }

        if (cartTotal < coupon.minPurchaseAmount) {
            return res.status(400).json({ message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required` });
        }

        let discountAmount = 0;

        if (coupon.applicability === 'all') {
            // Apply to entire cart
            if (coupon.discountType === 'percentage') {
                discountAmount = (cartTotal * coupon.discountValue) / 100;
            } else {
                discountAmount = coupon.discountValue;
            }
        } else if (coupon.applicability === 'specific') {
            // Calculate total of applicable items only
            let applicableTotal = 0;
            const applicableIds = coupon.applicableProducts.map(id => id.toString());

            if (cartItems && cartItems.length > 0) {
                cartItems.forEach(item => {
                    if (item.productId && applicableIds.includes(item.productId.toString())) {
                        applicableTotal += (item.price * item.quantity);
                    }
                });
            }

            if (applicableTotal === 0) {
                return res.status(400).json({ message: 'Coupon is not applicable to any items in your cart' });
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (applicableTotal * coupon.discountValue) / 100;
            } else {
                // For fixed discount on specific items, discount cannot exceed item total
                discountAmount = Math.min(coupon.discountValue, applicableTotal);
            }
        }

        // Ensure discount doesn't exceed cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        res.json({
            message: 'Coupon applied successfully',
            discountAmount: Math.round(discountAmount),
            finalTotal: Math.round(cartTotal - discountAmount),
            code: coupon.code
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
