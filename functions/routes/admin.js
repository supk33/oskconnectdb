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
    
    // Protect important admin accounts
    const userRef = admin.firestore().collection('users').doc(id);
    const userDoc = await userRef.get();
    if (userDoc.exists && (userDoc.data().email === 'admin@oskconnect.com' || userDoc.data().email === 'test1@oskconnect.com')) {
      return res.status(403).json({ 
        success: false, 
        error: 'ไม่สามารถแก้ไขบัญชีผู้ดูแลระบบที่สำคัญได้' 
      });
    }

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role' 
      });
    }
    
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
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update user role' 
    });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if trying to update main admin
    const userRef = admin.firestore().collection('users').doc(id);
    const userDoc = await userRef.get();
    
    if (userDoc.exists && userDoc.data().email === 'admin@oskconnect.com') {
      return res.status(403).json({ 
        success: false, 
        error: 'ไม่สามารถแก้ไขบัญชีผู้ดูแลระบบหลักได้' 
      });
    }

    // Validate role changes
    if (updates.role && !['visitor', 'member', 'admin', 'pending'].includes(updates.role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role value' 
      });
    }

    // Validate status changes
    if (updates.status && !['active', 'pending', 'approved', 'rejected'].includes(updates.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value' 
      });
    }

    // Make sure new users start as pending members
    if (updates.role === 'pending') {
      updates.status = 'pending';
    }

    // When approving a user, set proper role and status
    if (updates.status === 'approved' && !updates.role) {
      updates.role = 'member';
    }

    // Add timestamp to updates
    updates.updatedAt = new Date();
    
    await userRef.update(updates);
    
    res.json({ 
      success: true, 
      message: `User updated successfully` 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if trying to delete protected admin accounts
    const userRef = admin.firestore().collection('users').doc(id);
    const userDoc = await userRef.get();
    
    if (userDoc.exists && (userDoc.data().email === 'admin@oskconnect.com' || userDoc.data().email === 'test1@oskconnect.com')) {
      return res.status(403).json({ 
        success: false, 
        error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบที่สำคัญได้' 
      });
    }

    // Delete user's shops first
    const shopsRef = admin.firestore().collection('stores');
    const shopsSnapshot = await shopsRef.where('userId', '==', id).get();
    const batch = admin.firestore().batch();
    
    shopsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user document
    batch.delete(userRef);
    await batch.commit();

    // Delete Firebase Auth user
    await admin.auth().deleteUser(id);

    res.json({ 
      success: true, 
      message: 'User and associated data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user' 
    });
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