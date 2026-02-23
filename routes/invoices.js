const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get Order Invoice PDF
// @route   GET /api/invoices/:id
// @access  Private/Admin
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        // Set Headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

        doc.pipe(res);

        // Colors - Simple White Theme (Black text, White bg)
        const primaryColor = '#000000'; // Black
        const lightGray = '#ffffff'; // White (or very light gray for minimal contrast if needed, but request said simple white)
        const darkGray = '#333333';
        const borderColor = '#cccccc';

        // --- HEADER SECTION ---
        // Company Name (Left)
        doc.fontSize(20)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Wear Classense', 50, 50);

        doc.fontSize(10)
            .fillColor(darkGray)
            .font('Helvetica')
            .text('Luxury Footwear', 50, 75);

        // Invoice Title (Right)
        doc.fontSize(28)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('INVOICE', 400, 50, { align: 'right' });

        // Decorative line under header - Minimal
        doc.moveTo(50, 95)
            .lineTo(545, 95)
            .lineWidth(1)
            .strokeColor(primaryColor)
            .stroke();

        // --- COMPANY & ORDER INFO SECTION ---
        let yPos = 110;

        // Left: Company Details
        doc.fontSize(10)
            .fillColor(darkGray)
            .font('Helvetica')
            .text('Agra, India', 50, yPos)
            .text('Email: support@wearclassense.com', 50, yPos + 15)
            .text('Phone: +91 9458492978', 50, yPos + 30);

        // Right: Invoice Details Box - Minimal (No background fill)
        const boxX = 350;
        const boxY = yPos;

        // Invoice details
        doc.fillColor(primaryColor)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Invoice #:', boxX, boxY)
            .font('Helvetica')
            .text(order._id.toString().slice(-8).toUpperCase(), boxX + 60, boxY);

        doc.font('Helvetica-Bold')
            .text('Date:', boxX, boxY + 15)
            .font('Helvetica')
            .text(new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }), boxX + 60, boxY + 15);

        doc.font('Helvetica-Bold')
            .text('Status:', boxX, boxY + 30)
            .font('Helvetica')
            .text(order.status.toUpperCase(), boxX + 60, boxY + 30);

        // --- BILL TO SECTION ---
        yPos = 180;

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('BILL TO:', 50, yPos);

        doc.fillColor(darkGray)
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(order.customerName, 50, yPos + 20);

        doc.font('Helvetica')
            .fontSize(10)
            .text(order.address, 50, yPos + 38, { width: 300 })
            .text(`Phone: ${order.phone}`, 50, yPos + 65); // Adjusted Y for phone based on address height approximation

        // --- ITEMS TABLE ---
        const tableTop = 290;

        // Table Headers - Minimal (Line below)
        doc.fillColor(primaryColor)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('ITEM', 50, tableTop)
            .text('QTY', 320, tableTop, { width: 50, align: 'center' })
            .text('PRICE', 390, tableTop, { width: 70, align: 'right' })
            .text('TOTAL', 475, tableTop, { width: 60, align: 'right' });

        doc.moveTo(50, tableTop + 15)
            .lineTo(545, tableTop + 15)
            .lineWidth(1)
            .strokeColor(borderColor)
            .stroke();

        // Table Items
        let currentY = tableTop + 25;
        let rowIndex = 0;

        order.items.forEach(item => {
            const total = item.price * item.quantity;

            doc.fillColor(darkGray)
                .fontSize(10)
                .font('Helvetica')
                .text(item.productName, 50, currentY, { width: 260 })
                .text(item.quantity.toString(), 320, currentY, { width: 50, align: 'center' })
                .text(`Rs ${item.price.toFixed(2)}`, 390, currentY, { width: 70, align: 'right' })
                .text(`Rs ${total.toFixed(2)}`, 475, currentY, { width: 60, align: 'right' });

            currentY += 25;
            rowIndex++;
        });

        // Bottom border of table
        doc.moveTo(50, currentY)
            .lineTo(545, currentY)
            .lineWidth(1)
            .strokeColor(borderColor)
            .stroke();

        // --- TOTALS SECTION ---
        currentY += 15;

        // Subtotal
        doc.fontSize(10)
            .fillColor(darkGray)
            .font('Helvetica')
            .text('Subtotal:', 390, currentY, { width: 70, align: 'right' })
            .text(`Rs ${order.totalAmount.toFixed(2)}`, 475, currentY, { width: 60, align: 'right' });

        currentY += 20;

        // Grand Total
        doc.fontSize(12)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('GRAND TOTAL:', 350, currentY, { width: 110, align: 'right' })
            .text(`Rs ${order.totalAmount.toFixed(2)}`, 475, currentY, { width: 60, align: 'right' });

        // --- TERMS & CONDITIONS SECTION ---
        currentY += 60;

        doc.fontSize(10)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Terms & Conditions', 50, currentY);

        currentY += 15;

        doc.fontSize(9)
            .fillColor(darkGray)
            .font('Helvetica')
            .text('No returns or exchanges on sale items. Please contact support for any issues.', 50, currentY, { width: 495 });

        // --- FOOTER SECTION ---
        const footerY = 750; // Use fixed position for footer to ensure it's at bottom

        // Decorative line
        doc.moveTo(50, footerY)
            .lineTo(545, footerY)
            .lineWidth(1)
            .strokeColor(borderColor)
            .stroke();

        // Thank you message
        doc.fontSize(12)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Thank you for shopping with Wear Classense!', 50, footerY + 15, {
                align: 'center',
                width: 495
            });

        doc.fontSize(9)
            .fillColor(darkGray)
            .font('Helvetica')
            .text('www.wearclassense.com | support@wearclassense.com', 50, footerY + 35, {
                align: 'center',
                width: 495
            });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
