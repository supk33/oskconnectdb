const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const { sequelize, enablePostGIS } = require('./config/database');
const { User, Shop } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for member and admin interfaces
app.use('/member', express.static('public/member'));
app.use('/admin', express.static('public/admin'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/admin', adminRoutes);

// Member routes (for authenticated members)
app.use('/member/api', require('./routes/member'));

// Admin routes (for administrators)
app.use('/admin/api', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database connection and server startup
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');
    
    // Enable PostGIS extension
    await enablePostGIS();
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({
      where: { email: process.env.ADMIN_EMAIL }
    });
    
    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log('Default admin user created');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Member interface: http://localhost:${PORT}/member`);
      console.log(`Admin interface: http://localhost:${PORT}/admin`);
    });
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

startServer();
