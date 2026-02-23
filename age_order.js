const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

// Load env vars
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const ageOrder = async () => {
    await connectDB();

    try {
        // Find the most recent order
        const recentOrder = await Order.findOne().sort({ createdAt: -1 });

        if (!recentOrder) {
            console.log("No orders found in the database to age.");
            process.exit(0);
        }

        console.log(`Found recent order: ${recentOrder._id}`);
        console.log(`Current creation date: ${recentOrder.createdAt}`);

        // Subtract 8 days from the creation date
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

        recentOrder.createdAt = eightDaysAgo;
        await recentOrder.save();

        console.log(`Successfully changed creation date to: ${eightDaysAgo}`);
        console.log('The order is now older than 7 days. Please check your profile page to see the "Delivered" status and "Return/Exchange" button.');

    } catch (error) {
        console.error("Error updating order:", error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

ageOrder();
