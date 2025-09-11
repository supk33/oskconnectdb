const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Shop } = require('../models');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get member's shops
router.get('/shops', auth, async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: { ownerId: req.user.id },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(shops);
  } catch (error) {
    console.error('Error fetching member shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new shop
router.post('/shops', [
  auth,
  upload.array('images', 10), // Allow up to 10 images
  body('shopName').notEmpty().withMessage('Shop name is required'),
  body('description').optional(),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('address').optional(),
  body('phone').optional(),
  body('website').optional().isURL().withMessage('Valid URL is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('model').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      shopName,
      description,
      latitude,
      longitude,
      address,
      phone,
      website,
      tags,
      model
    } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/${file.filename}`
    })) : [];

    // Parse tags if provided as string
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

    const shop = await Shop.create({
      ownerId: req.user.id,
      shopName,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      phone,
      website,
      images,
      tags: parsedTags,
      model
    });

    const shopWithOwner = await Shop.findByPk(shop.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    res.status(201).json(shopWithOwner);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shop
router.put('/shops/:id', [
  auth,
  upload.array('images', 10),
  body('shopName').optional().notEmpty().withMessage('Shop name cannot be empty'),
  body('description').optional(),
  body('latitude').optional().isFloat().withMessage('Valid latitude is required'),
  body('longitude').optional().isFloat().withMessage('Valid longitude is required'),
  body('address').optional(),
  body('phone').optional(),
  body('website').optional().isURL().withMessage('Valid URL is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('promotions').optional().isArray().withMessage('Promotions must be an array'),
  body('menu').optional().isArray().withMessage('Menu must be an array'),
  body('openingHours').optional().isObject().withMessage('Opening hours must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const updateData = { ...req.body };

    // Handle location update
    if (req.body.latitude && req.body.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    // Handle images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`
      }));
      
      const existingImages = shop.images || [];
      updateData.images = [...existingImages, ...newImages];
    }

    // Parse JSON fields
    if (req.body.tags) {
      updateData.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
    }
    if (req.body.promotions) {
      updateData.promotions = typeof req.body.promotions === 'string' ? JSON.parse(req.body.promotions) : req.body.promotions;
    }
    if (req.body.menu) {
      updateData.menu = typeof req.body.menu === 'string' ? JSON.parse(req.body.menu) : req.body.menu;
    }
    if (req.body.openingHours) {
      updateData.openingHours = typeof req.body.openingHours === 'string' ? JSON.parse(req.body.openingHours) : req.body.openingHours;
    }

    await shop.update(updateData);

    const updatedShop = await Shop.findByPk(shop.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    res.json(updatedShop);
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shop
router.delete('/shops/:id', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await shop.destroy();
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shop by ID (member's own shop)
router.get('/shops/:id', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.id },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add promotion to shop
router.post('/shops/:id/promotions', [
  auth,
  body('title').notEmpty().withMessage('Promotion title is required'),
  body('description').optional(),
  body('discount').optional().isFloat().withMessage('Discount must be a number'),
  body('validFrom').optional().isISO8601().withMessage('Valid start date is required'),
  body('validTo').optional().isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const promotion = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };

    const promotions = shop.promotions || [];
    promotions.push(promotion);

    await shop.update({ promotions });

    res.json(shop);
  } catch (error) {
    console.error('Error adding promotion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add menu item to shop
router.post('/shops/:id/menu', [
  auth,
  body('name').notEmpty().withMessage('Menu item name is required'),
  body('description').optional(),
  body('price').isFloat().withMessage('Valid price is required'),
  body('category').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const menuItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };

    const menu = shop.menu || [];
    menu.push(menuItem);

    await shop.update({ menu });

    res.json(shop);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
