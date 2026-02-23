const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number },
    stock: { type: Number, default: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    images: [String],
    status: { type: String, default: 'active' },
    shortDescription: String,
    shippingCharge: { type: Number, default: 0 },
    showOnLanding: { type: Boolean, default: false }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Sample products data
const sampleProducts = [
    {
        name: 'Premium Cotton T-Shirt',
        price: 499,
        mrp: 799,
        stock: 50,
        categoryId: '697e0359a8def5a317980e2d', // gudiya category
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        status: 'active',
        shortDescription: 'Comfortable premium cotton t-shirt',
        shippingCharge: 50,
        showOnLanding: true
    },
    {
        name: 'Denim Jeans',
        price: 1299,
        mrp: 1999,
        stock: 30,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
        status: 'active',
        shortDescription: 'Classic denim jeans',
        shippingCharge: 50,
        showOnLanding: true
    },
    {
        name: 'Casual Sneakers',
        price: 1599,
        mrp: 2499,
        stock: 25,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'],
        status: 'active',
        shortDescription: 'Comfortable casual sneakers',
        shippingCharge: 50,
        showOnLanding: true
    },
    {
        name: 'Leather Wallet',
        price: 699,
        mrp: 1199,
        stock: 100,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400'],
        status: 'active',
        shortDescription: 'Premium leather wallet',
        shippingCharge: 30,
        showOnLanding: true
    },
    {
        name: 'Sports Watch',
        price: 2499,
        mrp: 3999,
        stock: 15,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
        status: 'active',
        shortDescription: 'Digital sports watch',
        shippingCharge: 50,
        showOnLanding: true
    },
    {
        name: 'Backpack',
        price: 1899,
        mrp: 2999,
        stock: 40,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
        status: 'active',
        shortDescription: 'Spacious travel backpack',
        shippingCharge: 50,
        showOnLanding: true
    },
    {
        name: 'Sunglasses',
        price: 899,
        mrp: 1499,
        stock: 60,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'],
        status: 'active',
        shortDescription: 'UV protection sunglasses',
        shippingCharge: 30,
        showOnLanding: true
    },
    {
        name: 'Hoodie',
        price: 1199,
        mrp: 1899,
        stock: 35,
        categoryId: '697e0359a8def5a317980e2d',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'],
        status: 'active',
        shortDescription: 'Warm and comfortable hoodie',
        shippingCharge: 50,
        showOnLanding: true
    }
];

// Insert products
async function seedProducts() {
    try {
        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert new products
        const result = await Product.insertMany(sampleProducts);
        console.log(`Successfully inserted ${result.length} products`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
