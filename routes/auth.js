const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protectCustomer } = require('../middleware/authMiddleware');

// Generate JWT
const generateToken = (id, type = 'admin') => {
    return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST api/auth/login
// @desc    Auth admin & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                _id: admin._id,
                email: admin.email,
                token: generateToken(admin._id, 'admin')
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/auth/customer/register
// @desc    Register new customer
// @access  Public
router.post('/customer/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        // Check if customer already exists
        const customerExists = await Customer.findOne({ email });

        if (customerExists) {
            return res.status(400).json({ message: 'Customer already exists with this email' });
        }

        // Create customer
        const customer = await Customer.create({
            name,
            email,
            phone,
            password
        });

        if (customer) {
            res.status(201).json({
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                token: generateToken(customer._id, 'customer')
            });
        } else {
            res.status(400).json({ message: 'Invalid customer data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/auth/customer/login
// @desc    Auth customer & get token
// @access  Public
router.post('/customer/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const customer = await Customer.findOne({ email });

        if (customer && (await customer.matchPassword(password))) {
            res.json({
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                token: generateToken(customer._id, 'customer')
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/auth/customer/profile
// @desc    Get customer profile
// @access  Private (Customer)
router.get('/customer/profile', protectCustomer, async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id).select('-password');

        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
