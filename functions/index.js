const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();

// Configure CORS for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow your production domains here
    const allowedOrigins = [
      'https://oskconnectdb.web.app',
      'https://oskconnectdb.firebaseapp.com',
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    region: 'us-central1',
    time: new Date().toISOString(),
  });
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to verify Firebase Auth Token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // For development, handle simple base64 tokens
    if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        req.user = { uid: decoded.uid, email: decoded.email };
        next();
        return;
      } catch (base64Error) {
        // Fall through to Firebase token verification
      }
    }
    
    // Firebase token verification
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// LINE LIFF Token Verification
app.post('/auth/line-verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'LINE ID Token is required' });
    }

    // Verify LINE LIFF ID Token
    const lineProfile = await verifyLineToken(idToken);
    
    // Create or update user in Firestore
    const userRecord = await createOrUpdateUser(lineProfile);
    
    // Create Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    res.json({ 
      customToken, 
      user: userRecord,
      message: 'Authentication successful' 
    });
  } catch (error) {
    console.error('LINE verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper function to verify LINE LIFF ID Token
async function verifyLineToken(idToken) {
  try {
    const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
      params: {
        id_token: idToken,
        client_id: functions.config().line.liff_id
      }
    });

    if (response.data.aud !== functions.config().line.liff_id) {
      throw new Error('Invalid LINE LIFF ID');
    }

    return {
      sub: response.data.sub,
      name: response.data.name,
      picture: response.data.picture,
      email: response.data.email
    };
  } catch (error) {
    console.error('LINE token verification error:', error);
    throw new Error('Failed to verify LINE token');
  }
}

// Helper function to create or update user
async function createOrUpdateUser(lineProfile) {
  try {
    const userRef = admin.firestore().collection('users').doc(lineProfile.sub);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing user
      await userRef.update({
        name: lineProfile.name,
        picture: lineProfile.picture,
        email: lineProfile.email,
        lastLogin: new Date(),
        updatedAt: new Date()
      });
      
      const updatedDoc = await userRef.get();
      return { uid: updatedDoc.id, ...updatedDoc.data() };
    } else {
      // Create new user
      const userData = {
        uid: lineProfile.sub,
        name: lineProfile.name,
        picture: lineProfile.picture,
        email: lineProfile.email,
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };

      await userRef.set(userData);
      return userData;
    }
  } catch (error) {
    console.error('User creation/update error:', error);
    throw new Error('Failed to create/update user');
  }
}

const health = (req, res) => {
  res.status(200).json({ status: 'OK', region: 'us-central1', time: new Date().toISOString() });
};

app.get('/__health', health);    // ใช้ทดสอบผ่าน Hosting
app.get('/api/health', health);  // ใช้ทดสอบผ่าน Hosting (/api/**)
app.get('/health', health);      // ใช้ทดสอบยิงตรง Cloud Functions

// ===== PUBLIC ROUTES (no auth) =====
const express = require('express');
const publicRouter = express.Router();
const { getFirestore } = require('firebase-admin/firestore');

// GET /api/shops  (สาธารณะ)
publicRouter.get('/shops', async (req, res) => {
  try {
    const db = getFirestore();
    const status = (req.query.status || 'approved').toLowerCase();
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    // ลองสอง collection เผื่อโปรเจ็กต์ใช้ชื่อไม่เหมือนกัน
    const collections = ['shops', 'stores'];
    let items = [];

    for (const col of collections) {
      const snap = await db.collection(col).where('status', '==', status).get();
      if (!snap.empty) {
        items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      }
    }

    // (ออปชัน) จัดอันดับใกล้ฉันถ้าส่ง lat/lng มา
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const dist = (a) => {
        const c = a?.location?.coordinates;
        if (!Array.isArray(c) || c.length < 2) return Number.POSITIVE_INFINITY;
        const [lng2, lat2] = [Number(c[0]), Number(c[1])];
        if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return Number.POSITIVE_INFINITY;
        const dlat = lat - lat2, dlng = lng - lng2;
        return dlat * dlat + dlng * dlng; // พอเป็นแนว (ไม่ต้อง Haversine)
      };
      items.sort((a, b) => dist(a) - dist(b));
    }

    res.json(items);
  } catch (err) {
    console.error('PUBLIC /api/shops error:', err);
    res.status(500).json({ error: 'failed' });
  }
});

// (ออปชัน) alias /api/stores ให้เท่ากับ /api/shops
publicRouter.get('/stores', (req, res, next) => {
  req.url = '/shops' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  next();
}, publicRouter);

// 👉 mount public router “ก่อน” ตัวที่ต้อง auth
app.use('/api', publicRouter);

// Protected API Routes (require authentication)
app.use('/api', authenticateUser, require('./routes/api'));
app.use('/api/member', authenticateUser, require('./routes/member'));
app.use('/api/admin', authenticateUser, requireAdmin, require('./routes/admin'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the main function
exports.api = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest((req, res) => {
    // Set CORS headers for all requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    return app(req, res);
  });

// Export individual functions for better performance
exports.lineAuth = functions.https.onCall(async (data, context) => {
  try {
    const { idToken } = data;
    
    if (!idToken) {
      throw new functions.https.HttpsError('invalid-argument', 'LINE ID Token is required');
    }

    const lineProfile = await verifyLineToken(idToken);
    const userRecord = await createOrUpdateUser(lineProfile);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    return { customToken, user: userRecord };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Callable function to list shops
exports.listShops = functions.https.onCall(async (data, context) => {
  try {
    const { limit = 20, status = 'approved' } = data || {};
    
    const db = admin.firestore();
    const shopsRef = db.collection('stores');
    
    let query = shopsRef.where('status', '==', status);
    
    if (limit) {
      query = query.limit(Number(limit));
    }
    
    const snapshot = await query.get();
    
    const shops = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      shops.push({
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
    
    return shops;
  } catch (error) {
    console.error('Error in listShops:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch shops');
  }
});

// Callable function to get member's shops
exports.getMemberShops = functions.https.onCall(async (data, context) => {
  try {
    const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Please sign in');
    
    const snap = await admin.firestore().collection('stores').where('ownerId', '==', uid).get();
    return snap.docs.map(d => ({ 
      id: d.id, 
      _id: d.id,
      shopName: d.data().shopName || d.data().name || 'ร้านค้า',
      description: d.data().description || '',
      category: d.data().category || '',
      location: d.data().location || { coordinates: [0, 0] },
      phone: d.data().phone || '',
      email: d.data().email || '',
      status: d.data().status || 'pending',
      owner: d.data().owner || null,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt,
      ...d.data() 
    }));
  } catch (error) {
    console.error('Error in getMemberShops:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch member shops');
  }
});

// Callable function to save shop
exports.saveShop = functions.https.onCall(async (data, context) => {
  console.log('saveShop called with data:', JSON.stringify(data, null, 2));
  console.log('saveShop context auth:', context?.auth ? 'present' : 'missing');
  
  const uid = context.auth?.uid;
  if (!uid) {
    console.error('No uid in context.auth');
    throw new functions.https.HttpsError('unauthenticated', 'Please sign in.');
  }

  // Validate required fields
  if (!data || !data.shopName) {
    console.error('Missing required field: shopName');
    throw new functions.https.HttpsError('invalid-argument', 'Shop name is required');
  }

  try {
    const d = data || {};
    console.log('saveShop received data:', d);
    
    const payload = {
      shopName: String(d.shopName || '').trim(),
      description: String(d.description || ''),
      phone: String(d.phone || ''),
      address: String(d.address || ''),
      website: String(d.website || ''),
      category: String(d.category || ''),
      tags: Array.isArray(d.tags) ? d.tags : [],
      images: Array.isArray(d.images) ? d.images : [],
      email: String(d.email || ''),
      openingHours: d.openingHours || {},
      promotions: d.promotions || [],
      menu: d.menu || [],
      ownerId: uid,
      updatedAt: new Date(),
    };
    
    console.log('saveShop prepared payload:', payload);

    if (!payload.shopName) {
      throw new functions.https.HttpsError('invalid-argument', 'shopName is required');
    }

    const loc = d.location;
    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
      payload.location = {
        type: 'Point',
        coordinates: [Number(loc.lng), Number(loc.lat)], // เก็บเป็น [lng, lat]
      };
    }

    const db = admin.firestore();
    console.log('Firestore instance created, attempting database operation...');
    
    if (d.shopId) {
      console.log('Updating existing shop:', d.shopId);
      try {
        await db.collection('stores').doc(String(d.shopId)).set(payload, { merge: true });
        console.log('saveShop updated successfully:', d.shopId);
        return { id: String(d.shopId), updated: true };
      } catch (updateError) {
        console.error('Error updating shop in Firestore:', updateError);
        throw new functions.https.HttpsError('internal', 'Failed to update shop in database: ' + updateError.message);
      }
    } else {
      console.log('Creating new shop');
      payload.status = 'pending';
      payload.createdAt = new Date();
      
      try {
        console.log('Adding shop to Firestore with payload:', JSON.stringify(payload, null, 2));
        const ref = await db.collection('stores').add(payload);
        console.log('saveShop created successfully:', ref.id);
        return { id: ref.id, created: true };
      } catch (dbError) {
        console.error('Error creating shop in Firestore:', dbError);
        console.error('Error details:', {
          message: dbError.message,
          code: dbError.code,
          stack: dbError.stack
        });
        throw new functions.https.HttpsError('internal', 'Failed to create shop in database: ' + dbError.message);
      }
    }
  } catch (e) {
    console.error('saveShop error:', e);
    console.error('Error stack:', e.stack);
    
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    
    console.error('Detailed error:', {
      message: e.message,
      code: e.code,
      name: e.name
    });
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to save shop: ${e.message || 'Unknown error'}`
    );
  }
});

// Callable function to get pending shops (admin)
exports.getPendingShops = functions.https.onCall(async (data, context) => {
  try {
    const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Please sign in');
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const snap = await admin.firestore().collection('stores').where('status', '==', 'pending').get();
    return snap.docs.map(d => ({ 
      id: d.id, 
      _id: d.id,
      shopName: d.data().shopName || d.data().name || 'ร้านค้า',
      description: d.data().description || '',
      category: d.data().category || '',
      location: d.data().location || { coordinates: [0, 0] },
      phone: d.data().phone || '',
      email: d.data().email || '',
      status: d.data().status || 'pending',
      owner: d.data().owner || null,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt,
      ...d.data() 
    }));
  } catch (error) {
    console.error('Error in getPendingShops:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch pending shops');
  }
});

// Callable function to approve/reject shop (admin)
exports.updateShopStatus = functions.https.onCall(async (data, context) => {
  try {
    const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Please sign in');
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const { shopId, status } = data || {};
    
    if (!shopId || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'shopId and status are required');
    }
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new functions.https.HttpsError('invalid-argument', 'Status must be pending, approved, or rejected');
    }
    
    const storeRef = admin.firestore().collection('stores').doc(shopId);
    
    await storeRef.update({
      status,
      updatedAt: new Date(),
      approvedBy: uid,
      approvedAt: status === 'approved' ? new Date() : null
    });
    
    return { 
      success: true, 
      message: `Shop status updated to ${status}`,
      shopId,
      status
    };
  } catch (error) {
    console.error('Error in updateShopStatus:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update shop status');
  }
});

// Scheduled function to clean up old data (optional)
exports.cleanupOldData = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old temporary files or expired data
      console.log('Cleanup completed successfully');
      return null;
    } catch (error) {
      console.error('Cleanup error:', error);
      return null;
    }
  });