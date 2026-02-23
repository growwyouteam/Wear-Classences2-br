const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/authMiddleware');

const Product = require('../models/Product');

// @route   GET api/categories
// @desc    Get all categories with product count
// @access  Public
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().lean(); // Use lean() for better performance and to allow adding properties

        // Parallel fetch for counts might be faster if we just do a countDocuments per category for small scale,
        // but aggregation is better. For simplicity and robustness with IDs:

        // Method 1: Aggregation
        // const counts = await Product.aggregate([
        //     { $group: { _id: '$categoryId', count: { $sum: 1 } } }
        // ]);

        // Method 2: Simple loop with Promise.all (easier to read, fine for <100 categories)
        const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
            const count = await Product.countDocuments({ categoryId: cat._id });
            return { ...cat, productCount: count };
        }));

        res.json(categoriesWithCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/categories
// @desc    Create a category
// @access  Private/Admin
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    const { name, image } = req.body;
    try {
        const category = new Category({ name, image });
        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   DELETE api/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
