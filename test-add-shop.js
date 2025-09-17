const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-project'
  });
}

const db = admin.firestore();

// Connect to Firestore emulator
db.settings({
  host: 'localhost:8080',
  ssl: false
});

async function addTestShop() {
  try {
    console.log('Adding test shop...');
    
    const testShop = {
      shopName: 'ร้านค้าทดสอบใหม่',
      description: 'ร้านค้าที่เพิ่มใหม่สำหรับทดสอบการอนุมัติ',
      category: 'อาหาร',
      address: '999 ถนนทดสอบใหม่ กรุงเทพฯ',
      phone: '02-999-9999',
      email: 'newshop@example.com',
      website: 'https://newshop.example.com',
      ownerId: 'user1',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('stores').add(testShop);
    console.log('Test shop added successfully with ID:', docRef.id);
    console.log('Shop data:', testShop);
    
  } catch (error) {
    console.error('Error adding test shop:', error);
  }
}

// Run the test
addTestShop().then(() => {
  console.log('Test complete');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
