const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

// Connect Database (handled asynchronously in db.js with retries)
connectDB();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5500', 'http://localhost:5500', 'https://wear-classences-fr.vercel.app', 'https://wearclassense.com'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware
// Enable gzip compression for all responses
app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/home', require('./routes/home'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/reviews', require('./routes/reviews'));

// Root Endpoint
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
}

// Export for Vercel serverless
module.exports = app;
