const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get member's stores
router.get('/stores', async (req, res) => {
  try {
    const { uid } = req.user;
    const storesRef = admin.firestore().collection('stores');
    const snapshot = await storesRef.where('ownerId', '==', uid).get();
    
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
        status: data.status,
        owner: data.owner || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data
      });
    });
    
    res.json(stores); // Return array directly for compatibility
  } catch (error) {
    console.error('Error fetching member stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Alias for /shops endpoint
router.get('/shops', async (req, res) => {
  // Redirect to stores endpoint
  req.url = '/stores';
  router.handle(req, res);
});

// Get member's shops (my-shops endpoint)
router.get('/shops/my-shops', async (req, res) => {
  // Redirect to stores endpoint
  req.url = '/stores';
  router.handle(req, res);
});

// Create new store
router.post('/stores', async (req, res) => {
  try {
    const { uid } = req.user;
    const storeData = {
      ...req.body,
      ownerId: uid,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await admin.firestore().collection('stores').add(storeData);
    
    res.json({ 
      success: true, 
      data: { id: docRef.id, ...storeData },
      message: 'Store created successfully' 
    });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ success: false, error: 'Failed to create store' });
  }
});

// Update store
router.put('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    const storeRef = admin.firestore().collection('stores').doc(id);
    const storeDoc = await storeRef.get();
    
    if (!storeDoc.exists) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    if (storeDoc.data().ownerId !== uid) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    await storeRef.update(updateData);
    
    res.json({ 
      success: true, 
      message: 'Store updated successfully' 
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ success: false, error: 'Failed to update store' });
  }
});

// Delete store
router.delete('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    
    const storeRef = admin.firestore().collection('stores').doc(id);
    const storeDoc = await storeRef.get();
    
    if (!storeDoc.exists) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    if (storeDoc.data().ownerId !== uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await storeRef.delete();
    
    res.json({ 
      success: true, 
      message: 'Store deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

// Alias for delete shops endpoint
router.delete('/shops/:id', async (req, res) => {
  // Redirect to stores endpoint
  req.url = `/stores/${req.params.id}`;
  router.handle(req, res);
});

// Get member's menu items
router.get('/menu-items', async (req, res) => {
  try {
    const { uid } = req.user;
    const menuRef = admin.firestore().collection('menuItems');
    const snapshot = await menuRef.where('storeOwnerId', '==', uid).get();
    
    const menuItems = [];
    snapshot.forEach(doc => {
      menuItems.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
  }
});

module.exports = router;
