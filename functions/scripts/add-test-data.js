// Script to add test data to Firestore
// Run with: node functions/scripts/add-test-data.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'oskconnectdb'
  });
}

const db = admin.firestore();

// Connect to Firestore emulator
if (process.env.NODE_ENV !== 'production') {
  db.settings({
    host: 'localhost:8080',
    ssl: false
  });
}

const testStores = [
  {
    shopName: "ร้านกาแฟสตาร์บัคส์",
    description: "ร้านกาแฟสไตล์อเมริกัน เปิดบริการ 24 ชั่วโมง",
    category: "กาแฟ",
    location: {
      type: "Point",
      coordinates: [100.5018, 13.7563] // Bangkok coordinates
    },
    phone: "02-123-4567",
    email: "bangkok@starbucks.com",
    status: "approved",
    ownerId: "test-user-1",
    owner: {
      firstName: "สมชาย",
      lastName: "ใจดี"
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    shopName: "ร้านอาหารไทยโบราณ",
    description: "อาหารไทยแท้ ต้นตำรับโบราณ",
    category: "อาหารไทย",
    location: {
      type: "Point",
      coordinates: [100.5118, 13.7663]
    },
    phone: "02-234-5678",
    email: "thai@restaurant.com",
    status: "approved",
    ownerId: "test-user-2",
    owner: {
      firstName: "สมหญิง",
      lastName: "รักไทย"
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    shopName: "ร้านขนมหวาน",
    description: "ขนมหวานไทยและต่างประเทศ",
    category: "ขนมหวาน",
    location: {
      type: "Point",
      coordinates: [100.5218, 13.7763]
    },
    phone: "02-345-6789",
    email: "sweet@dessert.com",
    status: "pending",
    ownerId: "test-user-3",
    owner: {
      firstName: "สมศรี",
      lastName: "หวานใจ"
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

const testUsers = [
  {
    uid: "test-user-1",
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    role: "member",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    uid: "test-user-2", 
    name: "สมหญิง รักไทย",
    email: "somying@example.com",
    role: "member",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    uid: "test-user-3",
    name: "สมศรี หวานใจ", 
    email: "somsri@example.com",
    role: "member",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addTestData() {
  try {
    console.log('Adding test users...');
    for (const user of testUsers) {
      await db.collection('users').doc(user.uid).set(user);
      console.log(`Added user: ${user.name}`);
    }

    console.log('Adding test stores...');
    for (const store of testStores) {
      const docRef = await db.collection('stores').add(store);
      console.log(`Added store: ${store.shopName} with ID: ${docRef.id}`);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Run the script
addTestData().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
