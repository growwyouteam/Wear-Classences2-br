const express = require('express');
const router = express.Router();
const HomeSection = require('../models/HomeSection');
const HeroBanner = require('../models/HeroBanner');
const ServiceItem = require('../models/ServiceItem');
const { protect } = require('../middleware/authMiddleware');

// =======================
// PUBLIC CONFIG FETCH (OPTIMIZED)
// =======================
router.get('/config', async (req, res) => {
    try {
        // Cache home config for 5 minutes (static content)
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');

        // Run all queries in parallel for faster response
        const [heroBanners, serviceItems, sections] = await Promise.all([
            HeroBanner.find({ isActive: true })
                .sort({ order: 1 })
                .lean(),
            ServiceItem.find({ isActive: true })
                .sort({ order: 1 })
                .lean(),
            HomeSection.find({ isActive: true })
                .sort({ order: 1 })
                .populate('categoryId')
                .populate({
                    path: 'productIds',
                    select: 'name price mrp images categoryId status' // Only needed fields
                })
                .lean()
        ]);

        res.json({
            hero: heroBanners,
            services: serviceItems,
            sections: sections
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================
// ADMIN: HERO BANNERS
// =======================
router.get('/hero', protect, async (req, res) => {
    try {
        const banners = await HeroBanner.find().sort({ order: 1 });
        res.json(banners);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/hero', protect, async (req, res) => {
    try {
        const banner = new HeroBanner(req.body);
        const savedBanner = await banner.save();
        res.json(savedBanner);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/hero/:id', protect, async (req, res) => {
    try {
        const updated = await HeroBanner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/hero/:id', protect, async (req, res) => {
    try {
        await HeroBanner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});


// =======================
// ADMIN: SERVICE ITEMS
// =======================
router.get('/services', protect, async (req, res) => {
    try {
        const items = await ServiceItem.find().sort({ order: 1 });
        res.json(items);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/services', protect, async (req, res) => {
    try {
        const item = new ServiceItem(req.body);
        const saved = await item.save();
        res.json(saved);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/services/:id', protect, async (req, res) => {
    try {
        const updated = await ServiceItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/services/:id', protect, async (req, res) => {
    try {
        await ServiceItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});


// =======================
// ADMIN: HOME SECTIONS
// =======================
router.get('/sections', protect, async (req, res) => {
    try {
        const sections = await HomeSection.find().sort({ order: 1 });
        res.json(sections);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/sections', protect, async (req, res) => {
    try {
        const section = new HomeSection(req.body);
        const saved = await section.save();
        res.json(saved);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/sections/:id', protect, async (req, res) => {
    try {
        const updated = await HomeSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/sections/:id', protect, async (req, res) => {
    try {
        await HomeSection.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Reorder helper (Generic)
router.post('/reorder', protect, async (req, res) => {
    const { type, items } = req.body; // items = [{ id, order }]

    try {
        let Model;
        if (type === 'hero') Model = HeroBanner;
        else if (type === 'services') Model = ServiceItem;
        else Model = HomeSection;

        const promises = items.map(item =>
            Model.findByIdAndUpdate(item.id, { order: item.order })
        );

        await Promise.all(promises);
        res.json({ message: 'Order updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
