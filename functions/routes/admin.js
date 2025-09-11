const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get all stores (admin)
router.get('/stores', async (req, res) => {
  try {
    const storesRef = admin.firestore().collection('stores');
    const snapshot = await storesRef.get();
    
    const stores = [];
    snapshot.forEach(doc => {
      stores.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: stores });
  } catch (error) {
    console.error('Error fetching all stores:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stores' });
  }
});

// Update store status (approve/reject)
router.put('/stores/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const storeRef = admin.firestore().collection('stores').doc(id);
    await storeRef.update({
      status,
      updatedAt: new Date()
    });
    
    res.json({ 
      success: true, 
      message: `Store status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating store status:', error);
    res.status(500).json({ success: false, error: 'Failed to update store status' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    
    const userRef = admin.firestore().collection('users').doc(id);
    await userRef.update({
      role,
      updatedAt: new Date()
    });
    
    res.json({ 
      success: true, 
      message: `User role updated to ${role}` 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const storesRef = admin.firestore().collection('stores');
    const usersRef = admin.firestore().collection('users');
    
    const [storesSnapshot, usersSnapshot] = await Promise.all([
      storesRef.get(),
      usersRef.get()
    ]);
    
    const stats = {
      totalStores: storesSnapshot.size,
      totalUsers: usersSnapshot.size,
      pendingStores: 0,
      approvedStores: 0,
      rejectedStores: 0
    };
    
    storesSnapshot.forEach(doc => {
      const status = doc.data().status;
      if (status === 'pending') stats.pendingStores++;
      else if (status === 'approved') stats.approvedStores++;
      else if (status === 'rejected') stats.rejectedStores++;
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = router;