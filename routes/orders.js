const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product'); // To update stats if needed
const { protect, protectCustomer } = require('../middleware/authMiddleware');
const Coupon = require('../models/Coupon');

const { sendOrderConfirmationEmail } = require('../utils/emailService');

// @route   POST api/orders
// @desc    Create new order
// @access  Private (Customer)
router.post('/', protectCustomer, async (req, res) => {
    const { address, items, totalAmount, paymentMethod, couponCode, discountAmount } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    try {
        // Optional: If couponCode is provided, we should ideally validate it again here
        // For simplicity, we are trusting the frontend calculated total/discount in this step,
        // but in a production app, we MUST re-calculate the discount here to prevent tampering.
        // We will increment the coupon usage count.
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        const order = new Order({
            customerId: req.customer._id,
            customerName: req.body.customerName || req.customer.name,
            email: req.customer.email,
            phone: req.body.phone || req.customer.phone,
            address,
            items,
            totalAmount,
            paymentMethod: paymentMethod || 'COD',
            couponCode: couponCode || null,
            discountAmount: discountAmount || 0
        });

        const createdOrder = await order.save();

        // Send confirmation email asynchronously (don't block order creation)
        try {
            await sendOrderConfirmationEmail(createdOrder);
            console.log(`✅ Order confirmation email sent for Order #${createdOrder._id}`);
        } catch (emailError) {
            console.error(`❌ Failed to send confirmation email for Order #${createdOrder._id}:`, emailError);
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   GET api/orders/my-orders
// @desc    Get orders for authenticated customer
// @access  Private (Customer)
router.get('/my-orders', protectCustomer, async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.customer._id })
            .sort({ createdAt: -1 })
            .populate('items.productId', 'name');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/orders/stats
// @desc    Get dashboard stats
// @access  Private/Admin
router.get('/stats', protect, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const totalProducts = await Product.countDocuments(); // Need Product model
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

        res.json({
            totalOrders,
            pendingOrders,
            totalProducts,
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status || order.status;
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
