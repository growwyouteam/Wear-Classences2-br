const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const cloudinary = require('../utils/cloudinary');

// @route   GET api/products/upload-signature
// @desc    Get signature for client-side upload
// @access  Private/Admin
router.get('/upload-signature', protect, (req, res) => {
    try {
        const timestamp = Math.round((new Date).getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: 'wear-classences/products'
        }, process.env.api_secret);

        res.json({
            signature,
            timestamp,
            cloudName: process.env.cloud_name,
            apiKey: process.env.api_key
        });
    } catch (error) {
        console.error('Signature generation error:', error);
        res.status(500).json({ message: 'Could not generate upload signature' });
    }
});

// @route   GET api/products
// @desc    Get all products (optimized)
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Set cache headers for public product list (1 minute cache)
        if (req.query.admin !== 'true') {
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        }

        let query = {};
        if (req.query.admin !== 'true') {
            query.status = 'active';
        }

        if (req.query.category) {
            query.categoryId = req.query.category;
        }

        // Use field selection and lean() for optimized queries
        // For non-admin requests, only fetch fields needed for display
        const selectFields = req.query.admin === 'true'
            ? '' // Admin gets all fields
            : 'name price mrp images categoryId status shortDescription'; // Minimal fields for listing

        const products = await Product.find(query)
            .select(selectFields)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .lean(); // Returns plain JS objects (faster serialization)

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId', 'name');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    let {
        name, description, price, stock, categoryId, images, status,
        mrp, shippingCharge, videoUrl, size, showOnLanding,
        shortDescription, fullDescription, ingredients, usages,
        metaTitle, metaKeywords, metaDescription, variants
    } = req.body;

    try {
        // Upload images to Cloudinary
        const uploadPromises = images.map(async (image) => {
            // Check if it's already a URL (in case of re-submission or mixed content)
            if (image.startsWith('http')) return image;

            try {
                const result = await cloudinary.uploader.upload(image, {
                    folder: 'wear-classences/products',
                });
                return result.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                throw new Error('Image upload failed');
            }
        });

        const uploadedImages = await Promise.all(uploadPromises);

        const product = new Product({
            name, description, price, stock, categoryId, images: uploadedImages, status,
            mrp, shippingCharge, videoUrl, size, showOnLanding,
            shortDescription, fullDescription, ingredients, usages,
            metaTitle, metaKeywords, metaDescription, variants
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = req.body.name || product.name;
            product.description = req.body.description || product.description;
            product.price = req.body.price || product.price;
            product.stock = req.body.stock || product.stock;
            product.categoryId = req.body.categoryId || product.categoryId;
            product.status = req.body.status || product.status;

            // Handle Image Uploads
            if (req.body.images) {
                const uploadPromises = req.body.images.map(async (image) => {
                    if (image.startsWith('http')) return image;
                    try {
                        const result = await cloudinary.uploader.upload(image, {
                            folder: 'wear-classences/products',
                        });
                        return result.secure_url;
                    } catch (uploadError) {
                        console.error('Cloudinary upload failed:', uploadError);
                        throw new Error('Image upload failed');
                    }
                });
                product.images = await Promise.all(uploadPromises);
            }

            // New Fields
            product.mrp = req.body.mrp !== undefined ? req.body.mrp : product.mrp;
            product.shippingCharge = req.body.shippingCharge !== undefined ? req.body.shippingCharge : product.shippingCharge;
            product.videoUrl = req.body.videoUrl || product.videoUrl;
            product.size = req.body.size !== undefined ? req.body.size : product.size;
            product.showOnLanding = req.body.showOnLanding !== undefined ? req.body.showOnLanding : product.showOnLanding;
            product.shortDescription = req.body.shortDescription || product.shortDescription;
            product.fullDescription = req.body.fullDescription || product.fullDescription;
            product.ingredients = req.body.ingredients || product.ingredients;
            product.usages = req.body.usages || product.usages;
            product.metaTitle = req.body.metaTitle || product.metaTitle;
            product.metaKeywords = req.body.metaKeywords || product.metaKeywords;
            product.metaDescription = req.body.metaDescription || product.metaDescription;

            // Variants
            if (req.body.variants !== undefined) {
                product.variants = req.body.variants;
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
