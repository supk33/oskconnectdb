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
    
    // Protect main admin account
    const userRef = admin.firestore().collection('users').doc(id);
    const userDoc = await userRef.get();
    if (userDoc.exists && userDoc.data().email === 'admin@oskconnect.com') {
      return res.status(403).json({ 
        success: false, 
        error: 'ไม่สามารถแก้ไขบัญชีผู้ดูแลระบบหลักได้' 
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
    if (updates.role && !['visitor', 'member', 'admin'].includes(updates.role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role value' 
      });
    }

    // Validate status changes - now only active is valid
    if (updates.status && updates.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value' 
      });
    }

    // Ensure status is always active
    updates.status = 'active';

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

    // Check if trying to delete main admin account
    const userRef = admin.firestore().collection('users').doc(id);
    const userDoc = await userRef.get();
    
    if (userDoc.exists && userDoc.data().email === 'admin@oskconnect.com') {
      return res.status(403).json({ 
        success: false, 
        error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้' 
      });
    }

    // Delete user's shops first
    const shopsRef = admin.firestore().collection('stores');
    const shopsSnapshot = await shopsRef.where('userId', '==', id).get();
    const batch = admin.firestore().batch();
    
    console.log(`Deleting shops for user ${id}...`);
    shopsSnapshot.forEach(doc => {
      console.log(`Deleting shop ${doc.id}`);
      batch.delete(doc.ref);
    });

    // Delete user document
    console.log(`Deleting user document for ${id}...`);
    batch.delete(userRef);
    
    console.log('Committing batch delete...');
    await batch.commit();

    // Delete Firebase Auth user
    console.log(`Deleting Firebase Auth user ${id}...`);
    await admin.auth().deleteUser(id);
    console.log('User deleted successfully from Auth');

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

// Delete user by email
router.delete('/users/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Protect main admin account
    if (email === 'admin@oskconnect.com') {
      return res.status(403).json({
        success: false,
        error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก'
      });
    }

    // Find user by email in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.json({
          success: true,
          message: 'ไม่พบผู้ใช้นี้ในระบบ Authentication'
        });
      }
      throw authError;
    }

    // Delete from Firebase Auth if found
    await admin.auth().deleteUser(userRecord.uid);
    
    // Find and delete from Firestore if exists
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      const batch = admin.firestore().batch();
      
      // Delete user document and their shops
      for (const doc of snapshot.docs) {
        const userId = doc.id;
        
        // Delete user's shops
        const shopsSnapshot = await admin.firestore()
          .collection('stores')
          .where('userId', '==', userId)
          .get();
        
        shopsSnapshot.forEach(shopDoc => {
          batch.delete(shopDoc.ref);
        });
        
        // Delete user document
        batch.delete(doc.ref);
      }
      
      await batch.commit();
    }

    res.json({
      success: true,
      message: `ลบผู้ใช้ ${email} และข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว`
    });
  } catch (error) {
    console.error('Error deleting user by email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้'
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