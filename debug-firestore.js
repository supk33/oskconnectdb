// Debug script to check Firestore data
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'oskconnectdb'
});

const db = admin.firestore();

async function debugFirestore() {
  try {
    console.log('=== FIRESTORE DEBUG ===');
    
    // Get all stores
    const storesSnapshot = await db.collection('stores').get();
    console.log(`Total stores in Firestore: ${storesSnapshot.size}`);
    
    storesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Store ID: ${doc.id}`);
      console.log(`Shop Name: ${data.shopName}`);
      console.log(`Owner ID: ${data.ownerId}`);
      console.log(`Status: ${data.status}`);
      console.log(`Created At: ${data.createdAt}`);
      console.log('---');
    });
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Total users in Firestore: ${usersSnapshot.size}`);
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`Email: ${data.email}`);
      console.log(`Role: ${data.role}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugFirestore();
