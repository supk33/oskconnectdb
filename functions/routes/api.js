const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get current user info (for authentication check)
router.get('/auth/me', async (req, res) => {
  try {
    const { uid } = req.user;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    res.json({ 
      user: {
        uid: uid,
        firstName: userData.firstName || userData.name?.split(' ')[0] || 'User',
        lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
        email: userData.email || '',
        role: userData.role || 'member',
        ...userData
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Login endpoint (for development/testing)
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // For development, create a simple user if not exists
    const userRef = admin.firestore().collection('users').doc(email.replace('@', '_at_'));
    const userDoc = await userRef.get();
    
    let userData;
    if (!userDoc.exists) {
      // Create new user for development
      userData = {
        uid: email.replace('@', '_at_'),
        firstName: email.split('@')[0],
        lastName: 'User',
        email: email,
        role: 'member',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await userRef.set(userData);
    } else {
      userData = userDoc.data();
    }
    
    // Create a simple token for development
    const token = Buffer.from(JSON.stringify({ uid: userData.uid, email: userData.email })).toString('base64');
    
    res.json({
      token: token,
      user: {
        uid: userData.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register endpoint (for development/testing)
router.post('/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const userRef = admin.firestore().collection('users').doc(email.replace('@', '_at_'));
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const userData = {
      uid: email.replace('@', '_at_'),
      firstName: firstName,
      lastName: lastName,
      email: email,
      role: 'member',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await userRef.set(userData);
    
    // Create a simple token for development
    const token = Buffer.from(JSON.stringify({ uid: userData.uid, email: userData.email })).toString('base64');
    
    res.json({
      token: token,
      user: {
        uid: userData.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get all stores (public) - Support both /stores and /shops endpoints
router.get('/stores', async (req, res) => {
  try {
    const storesRef = admin.firestore().collection('stores');
    const snapshot = await storesRef.where('status', '==', 'approved').get();
    
    const stores = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      stores.push({
        _id: doc.id,
        id: doc.id,
        shopName: data.shopName || data.name || 'ร้านค้า',
        description: data.description || '',
        category: data.category || '',
        location: data.location || { coordinates: [0, 0] },
        phone: data.phone || '',
        email: data.email || '',
        status: data.status || 'approved',
        owner: data.owner || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data
      });
    });
    
    res.json(stores); // Return array directly for compatibility
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Alias for /shops endpoint
router.get('/shops', async (req, res) => {
  // Redirect to stores endpoint
  req.url = '/stores';
  router.handle(req, res);
});

// Get store by ID (public)
router.get('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const storeDoc = await admin.firestore().collection('stores').doc(id).get();
    
    if (!storeDoc.exists) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    res.json({ success: true, data: { id: storeDoc.id, ...storeDoc.data() } });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store' });
  }
});

// Get all tags (public)
router.get('/tags', async (req, res) => {
  try {
    const tagsRef = admin.firestore().collection('tags');
    const snapshot = await tagsRef.get();
    
    const tags = [];
    snapshot.forEach(doc => {
      tags.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tags' });
  }
});

// Get all categories (public)
router.get('/categories', async (req, res) => {
  try {
    const categoriesRef = admin.firestore().collection('storeCategories');
    const snapshot = await categoriesRef.get();
    
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Get promotions (public)
router.get('/promotions', async (req, res) => {
  try {
    const promotionsRef = admin.firestore().collection('promotions');
    const snapshot = await promotionsRef.where('status', '==', 'active').get();
    
    const promotions = [];
    snapshot.forEach(doc => {
      promotions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: promotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promotions' });
  }
});

module.exports = router;
