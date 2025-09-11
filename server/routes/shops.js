const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { User, Shop } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get all approved shops (public)
router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, search, tags } = req.query;
    
    let whereClause = { status: 'approved' };
    let orderClause = [['createdAt', 'DESC']];
    
    // Search by shop name or description
    if (search) {
      whereClause[Op.or] = [
        { shopName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause.tags = {
        [Op.overlap]: tagArray
      };
    }
    
    let shops;
    
    // If coordinates provided, use PostGIS for distance-based sorting
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);
      
      const query = `
        SELECT *,
          ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) as distance
        FROM shops
        WHERE status = 'approved'
          ${search ? `AND (shop_name ILIKE $3 OR description ILIKE $3)` : ''}
          ${tags ? `AND tags ?| $4` : ''}
          AND ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $5 * 1000
          )
        ORDER BY distance
        LIMIT 100
      `;
      
      const replacements = [lng, lat, radiusKm];
      if (search) {
        replacements.push(`%${search}%`);
      }
      if (tags) {
        replacements.push(tagArray);
      }
      
      shops = await Shop.sequelize.query(query, {
        replacements,
        type: Shop.sequelize.QueryTypes.SELECT,
        model: Shop
      });
    } else {
      // Regular query without geospatial sorting
      shops = await Shop.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'owner',
          attributes: ['firstName', 'lastName', 'email']
        }],
        order: orderClause,
        limit: 100
      });
    }
    
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shop by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findOne({
      where: { id: req.params.id, status: 'approved' },
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

// Get user's own shops (authenticated)
router.get('/my/shops', auth, async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: { ownerId: req.user.userId },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(shops);
  } catch (error) {
    console.error('Error fetching user shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create shop (authenticated)
router.post('/', [
  auth,
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

    const shop = await Shop.create({
      ownerId: req.user.userId,
      shopName,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      phone,
      website,
      tags: tags || [],
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

// Update shop (authenticated, owner only)
router.put('/:id', [
  auth,
  body('shopName').optional().notEmpty().withMessage('Shop name cannot be empty'),
  body('description').optional(),
  body('latitude').optional().isFloat().withMessage('Valid latitude is required'),
  body('longitude').optional().isFloat().withMessage('Valid longitude is required'),
  body('address').optional(),
  body('phone').optional(),
  body('website').optional().isURL().withMessage('Valid URL is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.userId }
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

// Delete shop (authenticated, owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({
      where: { id: req.params.id, ownerId: req.user.userId }
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

// Search shops by location or tags
router.get('/search/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, tags } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    let query = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM shops
      WHERE status = 'approved'
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
        )
    `;

    const replacements = [lng, lat, radiusKm];

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query += ` AND tags ?| $4`;
      replacements.push(tagArray);
    }

    query += ` ORDER BY distance LIMIT 50`;

    const shops = await Shop.sequelize.query(query, {
      replacements,
      type: Shop.sequelize.QueryTypes.SELECT,
      model: Shop
    });

    res.json(shops);
  } catch (error) {
    console.error('Error searching nearby shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
