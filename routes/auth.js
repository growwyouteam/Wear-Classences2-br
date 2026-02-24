const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protectCustomer } = require('../middleware/authMiddleware');
const { OAuth2Client } = require('google-auth-library');

// Important: You should replace 'YOUR_GOOGLE_CLIENT_ID' with your actual client ID in .env
// For example: GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// @route   POST api/auth/customer/google
// @desc    Auth customer with Google SSO (Login / Register)
// @access  Public
router.post('/customer/google', async (req, res) => {
    const { token } = req.body;

    try {
        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { name, email } = payload;

        // Check if customer exists
        let customer = await Customer.findOne({ email });

        if (customer) {
            // Already a customer - just login
            return res.json({
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone || 'Not Provided',
                token: generateToken(customer._id, 'customer')
            });
        } else {
            // New user via Google - register them
            // We generate a random password to fulfill the schema requirement
            const randomPassword = require('crypto').randomBytes(16).toString('hex');

            customer = await Customer.create({
                name: name,
                email: email,
                phone: 'Not Provided', // Placeholder since Google doesn't provide phone
                password: randomPassword
            });

            if (customer) {
                return res.status(201).json({
                    _id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    token: generateToken(customer._id, 'customer')
                });
            } else {
                return res.status(400).json({ message: 'Invalid customer data from Google' });
            }
        }
    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.status(401).json({ message: 'Invalid Google Identity Token' });
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
