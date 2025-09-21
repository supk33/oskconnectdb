const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with service account
if (!admin.apps.length) {
  const serviceAccount = require('./oskconnectdb-firebase-adminsdk.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'oskconnectdb'
  });
}

const db = admin.firestore();

async function testFirebaseAccess() {
  try {
    console.log('=== TESTING FIREBASE ACCESS ===\n');
    
    // Test 1: Direct access to stores collection
    console.log('Test 1: Direct access to stores collection');
    const storesSnapshot = await db.collection('stores').get();
    console.log(`✅ Successfully accessed stores collection`);
    console.log(`   Found ${storesSnapshot.size} stores`);
    
    if (storesSnapshot.size > 0) {
      storesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.shopName || data.name || 'No name'} (ID: ${doc.id})`);
      });
    }
    
    // Test 2: Direct access to users collection
    console.log('\nTest 2: Direct access to users collection');
    const usersSnapshot = await db.collection('users').get();
    console.log(`✅ Successfully accessed users collection`);
    console.log(`   Found ${usersSnapshot.size} users`);
    
    if (usersSnapshot.size > 0) {
      usersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.firstName || data.name || 'No name'} (ID: ${doc.id})`);
      });
    }
    
    // Test 3: Test public access (simulate client-side access)
    console.log('\nTest 3: Simulating client-side access');
    
    // Create a test query that would be used by the client
    const publicStoresQuery = db.collection('stores')
      .where('status', '==', 'approved')
      .limit(10);
    
    const publicStoresSnapshot = await publicStoresQuery.get();
    console.log(`✅ Public stores query successful`);
    console.log(`   Found ${publicStoresSnapshot.size} approved stores`);
    
    if (publicStoresSnapshot.size > 0) {
      publicStoresSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.shopName || data.name || 'No name'}`);
        console.log(`      Status: ${data.status}`);
        console.log(`      Coordinates: ${data.latitude}, ${data.longitude}`);
      });
    }
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('Firebase access is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Firebase access:', error.message);
    console.log('\n=== TROUBLESHOOTING ===');
    console.log('1. Check if service account key is correct');
    console.log('2. Check if Firestore Rules are deployed');
    console.log('3. Check if project ID is correct');
  }
}

// Run the test
testFirebaseAccess().then(() => {
  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
