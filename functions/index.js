const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

// Initialize Firebase Admin SDK
// Use emulator project ID for development
const projectId = 'oskconnectdb'; // Always use oskconnectdb for consistency

// Check if running in emulator mode
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';

if (isEmulator) {
  // For emulator mode, use a simple configuration
  admin.initializeApp({
    projectId: projectId
  });
  
  // Set emulator host for Auth
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
} else {
  admin.initializeApp({
    projectId: projectId
  });
}

const app = express();
app.use(express.json());

// Enhanced CORS configuration
app.use((req, res, next) => {
  // Allow all origins for development
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled');
    res.status(200).end();
    return;
  }
  
  console.log(`CORS: ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// ===== MIDDLEWARE =====

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token extracted:', token ? 'Token exists' : 'No token');
    
    // For emulator mode, use a simpler verification
    if (isEmulator) {
      console.log('Running in emulator mode - using simplified auth');
      
      try {
        // Try to verify with emulator first
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Token verified with emulator:', decodedToken.uid);
        req.user = decodedToken;
      } catch (emulatorError) {
        console.log('Emulator verification failed, using fallback:', emulatorError.message);
        
        // Fallback: accept any token that looks like a Firebase token
        if (token && token.length > 10) {
          // Try to decode the token manually (basic check)
          try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            req.user = {
              uid: payload.user_id || payload.sub || 'emulator_user_' + Date.now(),
              email: payload.email || 'test@example.com',
              email_verified: true
            };
            console.log('Fallback auth successful:', req.user.uid);
          } catch (decodeError) {
            console.log('Token decode failed:', decodeError.message);
            return res.status(401).json({ error: 'Invalid token format' });
          }
        } else {
          return res.status(401).json({ error: 'Invalid token format' });
        }
      }
    } else {
      // Verify Firebase ID token in production
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verified successfully:', decodedToken.uid);
      req.user = decodedToken;
    }
    
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    if (userDoc.exists) {
      req.user.role = userDoc.data().role || 'member';
      req.user.profile = userDoc.data();
    } else {
      req.user.role = 'member';
      req.user.profile = null;
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  // Check if user is admin (manual check for development)
  const isAdmin = req.user?.email === 'admin@oskconnect.com' || req.user?.role === 'admin';
  
  if (!req.user || !isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ===== PUBLIC ROUTES =====

app.get('/', (req, res) => {
  res.json({ 
    message: 'OSK Connect API', 
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// Public shops endpoint
app.get('/shops', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('stores')
      .where('status', '==', 'approved')
      .limit(50)
      .get();
    
    const shops = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      shops.push({
        id: doc.id,
        shopName: data.shopName || data.name || 'ร้านค้า',
        description: data.description || '',
        category: data.category || '',
        location: data.location || { coordinates: [0, 0] },
        phone: data.phone || '',
        address: data.address || '',
        images: data.images || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    res.json({ shops, count: shops.length });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

app.get('/api/shops', async (req, res) => {
  req.url = '/shops';
  app.handle(req, res);
});

// Get single shop by ID (public)
app.get('/shops/:id', async (req, res) => {
  try {
    const db = admin.firestore();
    const shopDoc = await db.collection('stores').doc(req.params.id).get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const shopData = shopDoc.data();
    
    // Only return approved shops to public, or if user is owner/admin
    if (shopData.status !== 'approved') {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({ id: shopDoc.id, ...shopData });
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

app.get('/api/shops/:id', async (req, res) => {
  req.url = `/shops/${req.params.id}`;
  app.handle(req, res);
});

// ===== AUTH ROUTES =====

// Simplified LINE auth (will implement LINE verification later)
app.post('/auth/line', async (req, res) => {
  try {
    const { idToken, liffId } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'LINE ID Token is required' });
    }

    // For now, create a test user (implement LINE verification later)
    const testUser = {
      uid: 'test_' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      role: 'member'
    };
    
    // Create Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(testUser.uid);
    
    res.json({ 
      customToken, 
      user: testUser,
      message: 'Authentication successful (test mode)' 
    });
  } catch (error) {
    console.error('LINE auth error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Test auth endpoint
app.get('/auth/me', authenticateUser, (req, res) => {
  res.json({
    uid: req.user.uid,
    email: req.user.email,
    role: req.user.role,
    profile: req.user.profile
  });
});

// ===== MEMBER ROUTES (Protected) =====

// API prefixed routes for member endpoints
app.get('/api/member/shops', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('stores')
      .where('ownerId', '==', req.user.uid)
      .get();
    
    const shops = [];
    snapshot.forEach(doc => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(shops);
  } catch (error) {
    console.error('Error fetching member shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Get member's shops (legacy route)
app.get('/member/shops', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('stores')
      .where('ownerId', '==', req.user.uid)
      .get();
    
    const shops = [];
    snapshot.forEach(doc => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(shops);
  } catch (error) {
    console.error('Error fetching member shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Get single member shop by ID (API prefixed route)
app.get('/api/member/shops/:id', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const shopDoc = await db.collection('stores').doc(req.params.id).get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const shopData = shopDoc.data();
    
    // Check if user owns this shop
    if (shopData.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to view this shop' });
    }
    
    res.json({ id: shopDoc.id, ...shopData });
  } catch (error) {
    console.error('Error fetching member shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// Get single member shop by ID (legacy route)
app.get('/member/shops/:id', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const shopDoc = await db.collection('stores').doc(req.params.id).get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const shopData = shopDoc.data();
    
    // Check if user owns this shop
    if (shopData.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to view this shop' });
    }
    
    res.json({ id: shopDoc.id, ...shopData });
  } catch (error) {
    console.error('Error fetching member shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// Create shop (API prefixed route)
app.post('/api/member/shops', authenticateUser, async (req, res) => {
  try {
    console.log('=== SHOP CREATION DEBUG ===');
    console.log('User UID:', req.user.uid);
    console.log('Request body:', req.body);
    
    const db = admin.firestore();
    const shopData = {
      ...req.body,
      ownerId: req.user.uid,
      status: 'pending',
      updatedAt: new Date(),
      createdAt: new Date()
    };

    console.log('Shop data to be saved:', shopData);

    // Create new shop
    const docRef = await db.collection('stores').add(shopData);
    const result = { id: docRef.id, created: true };
    
    console.log('Shop created successfully with ID:', docRef.id);
    
    // Verify the shop was created by reading it back
    const createdShop = await docRef.get();
    console.log('Created shop data:', createdShop.data());
    console.log('=== END SHOP CREATION DEBUG ===');
    
    res.json(result);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// Create shop (legacy route)
app.post('/member/shops', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const shopData = {
      ...req.body,
      ownerId: req.user.uid,
      status: 'pending',
      updatedAt: new Date(),
      createdAt: new Date()
    };

    // Create new shop
    const docRef = await db.collection('stores').add(shopData);
    const result = { id: docRef.id, created: true };
    
    res.json(result);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// Update shop (API prefixed route)
app.put('/api/member/shops/:id', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const shopRef = db.collection('stores').doc(req.params.id);
    const shopDoc = await shopRef.get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const existingData = shopDoc.data();
    if (existingData.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to edit this shop' });
    }
    
    const shopData = {
      ...req.body,
      ownerId: req.user.uid,
      status: 'pending', // Reset to pending when updated
      updatedAt: new Date(),
      createdAt: existingData.createdAt // Keep original creation date
    };
    
    await shopRef.update(shopData);
    const result = { id: req.params.id, updated: true };
    
    res.json(result);
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// Update shop (legacy route)
app.put('/member/shops/:id', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const shopRef = db.collection('stores').doc(req.params.id);
    const shopDoc = await shopRef.get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const existingData = shopDoc.data();
    if (existingData.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to edit this shop' });
    }
    
    const shopData = {
      ...req.body,
      ownerId: req.user.uid,
      status: 'pending', // Reset to pending when updated
      updatedAt: new Date(),
      createdAt: existingData.createdAt // Keep original creation date
    };
    
    await shopRef.update(shopData);
    const result = { id: req.params.id, updated: true };
    
    res.json(result);
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// Delete member shop
app.delete('/member/shops/:id', authenticateUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const shopRef = db.collection('stores').doc(req.params.id);
    const shopDoc = await shopRef.get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const shopData = shopDoc.data();
    
    // Check if user owns this shop
    if (shopData.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this shop' });
    }
    
    await shopRef.delete();
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

// ===== ADMIN ROUTES (Protected + Admin) =====

// Get all shops (admin)
app.get('/admin/shops', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const db = admin.firestore();
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = db.collection('stores');
    
    // Apply status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    // Apply search filter
    if (search) {
      // Note: Firestore doesn't support full-text search, so we'll get all and filter client-side
      // For better performance, consider using Algolia or similar service
    }
    
    const snapshot = await query.get();
    
    const shops = [];
    snapshot.forEach(doc => {
      const shopData = { id: doc.id, ...doc.data() };
      
      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          shopData.shopName?.toLowerCase().includes(searchLower) ||
          shopData.description?.toLowerCase().includes(searchLower) ||
          shopData.address?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return;
      }
      
      shops.push(shopData);
    });
    
    // Sort by createdAt (newest first)
    shops.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime - aTime;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedShops = shops.slice(startIndex, endIndex);
    
    res.json({ 
      shops: paginatedShops, 
      count: shops.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(shops.length / limit),
        total: shops.length
      }
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Get pending shops
app.get('/admin/pending-shops', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('stores')
      .where('status', '==', 'pending')
      .get();
    
    const shops = [];
    snapshot.forEach(doc => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ shops, count: shops.length });
  } catch (error) {
    console.error('Error fetching pending shops:', error);
    res.status(500).json({ error: 'Failed to fetch pending shops' });
  }
});

// Get all users (admin)
app.get('/admin/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ data: users, count: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Approve/Reject shop
app.post('/admin/shops/:shopId/status', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status, reason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    
    const db = admin.firestore();
    const updateData = {
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user.uid,
      updatedAt: new Date()
    };
    
    if (reason) updateData.reviewReason = reason;
    
    await db.collection('stores').doc(shopId).update(updateData);
    
    res.json({ 
      success: true, 
      message: `Shop ${status} successfully`,
      shopId,
      status
    });
  } catch (error) {
    console.error('Error updating shop status:', error);
    res.status(500).json({ error: 'Failed to update shop status' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export functions
exports.api = functions.https.onRequest(app);

// Get pending shops for admin
exports.getPendingShops = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin (manual check for development)
    const isAdmin = context.auth.token.email === 'admin@oskconnect.com';
    
    if (!isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const db = admin.firestore();
    const snapshot = await db.collection('stores')
      .where('status', '==', 'pending')
      .get();
    
    const shops = [];
    snapshot.forEach(doc => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    
    return { shops, count: shops.length };
  } catch (error) {
    console.error('Error in getPendingShops:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch pending shops');
  }
});

// List shops for admin
exports.listShops = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin (manual check for development)
    const isAdmin = context.auth.token.email === 'admin@oskconnect.com';
    
    if (!isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const db = admin.firestore();
    let query = db.collection('stores');
    
    // Apply filters if provided
    if (data.status) {
      query = query.where('status', '==', data.status);
    }
    
    if (data.limit) {
      query = query.limit(data.limit);
    }
    
    const snapshot = await query.get();
    
    const shops = [];
    snapshot.forEach(doc => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    
    return { shops, count: shops.length };
  } catch (error) {
    console.error('Error in listShops:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch shops');
  }
});

// Approve shop
exports.approveShop = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin (manual check for development)
    const isAdmin = context.auth.token.email === 'admin@oskconnect.com';
    
    if (!isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { shopId, action } = data; // action: 'approve' or 'reject'
    
    if (!shopId || !action) {
      throw new functions.https.HttpsError('invalid-argument', 'Shop ID and action are required');
    }

    const db = admin.firestore();
    const shopRef = db.collection('stores').doc(shopId);
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await shopRef.update({
      status: newStatus,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: context.auth.uid
    });
    
    return { success: true, message: `Shop ${action}d successfully` };
  } catch (error) {
    console.error('Error in approveShop:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update shop status');
  }
});

exports.test = functions.https.onCall((data, context) => {
  return {
    message: 'Hello OSK Connect!',
    timestamp: new Date().toISOString(),
    uid: context.auth?.uid || 'anonymous'
  };
});

console.log('OSK Connect Functions loaded (simple version)');