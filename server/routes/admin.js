const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const { User, Shop } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalShops,
      pendingShops,
      approvedShops,
      totalUsers,
      recentShops
    ] = await Promise.all([
      Shop.count(),
      Shop.count({ where: { status: 'pending' } }),
      Shop.count({ where: { status: 'approved' } }),
      User.count({ where: { role: 'user' } }),
      Shop.findAll({
        include: [{
          model: User,
          as: 'owner',
          attributes: ['firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    res.json({
      totalShops,
      pendingShops,
      approvedShops,
      totalUsers,
      recentShops
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending shops
router.get('/shops/pending', adminAuth, async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: { status: 'pending' },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json(shops);
  } catch (error) {
    console.error('Error fetching pending shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all shops
router.get('/shops', adminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { shopName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: shops } = await Shop.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      shops,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject shop
router.put('/shops/:id/status', [
  adminAuth,
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reason').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findByPk(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await shop.update({
      status: req.body.status,
      approvedBy: req.user.userId,
      approvedAt: req.body.status === 'approved' ? new Date() : null
    });

    const updatedShop = await Shop.findByPk(shop.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    res.json(updatedShop);
  } catch (error) {
    console.error('Error updating shop status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    
    let whereClause = {};
    
    if (role) {
      whereClause.role = role;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', [
  adminAuth,
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from removing their own admin role
    if (user.id === req.user.userId && req.body.role === 'user') {
      return res.status(400).json({ message: 'Cannot remove your own admin privileges' });
    }

    await user.update({ role: req.body.role });

    res.json(user.toPublicJSON());
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shop statistics
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        dateFilter = {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
      case 'year':
        dateFilter = {
          [Op.gte]: new Date(now.getFullYear(), 0, 1)
        };
        break;
    }

    const [
      newShops,
      newUsers,
      shopsByStatus
    ] = await Promise.all([
      Shop.count({ where: { createdAt: dateFilter } }),
      User.count({ where: { createdAt: dateFilter } }),
      Shop.findAll({
        attributes: [
          'status',
          [Shop.sequelize.fn('COUNT', Shop.sequelize.col('id')), 'count']
        ],
        group: ['status']
      })
    ]);

    res.json({
      newShops,
      newUsers,
      shopsByStatus: shopsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk approve/reject shops
router.post('/shops/bulk-status', [
  adminAuth,
  body('shopIds').isArray().withMessage('Shop IDs must be an array'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shopIds, status } = req.body;

    await Shop.update(
      {
        status,
        approvedBy: req.user.userId,
        approvedAt: status === 'approved' ? new Date() : null
      },
      {
        where: {
          id: { [Op.in]: shopIds }
        }
      }
    );

    res.json({ message: `${shopIds.length} shops updated successfully` });
  } catch (error) {
    console.error('Error bulk updating shops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
