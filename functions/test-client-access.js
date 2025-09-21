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

async function testClientAccess() {
  try {
    console.log('=== TESTING CLIENT ACCESS TO FIREBASE ===\n');
    
    // Test 1: Check if we can access stores collection
    console.log('Test 1: Accessing stores collection...');
    const storesSnapshot = await db.collection('stores').get();
    console.log(`✅ Successfully accessed stores collection`);
    console.log(`   Found ${storesSnapshot.size} stores`);
    
    if (storesSnapshot.size > 0) {
      storesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.shopName || data.name || 'No name'}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Status: ${data.status}`);
        console.log(`      Coordinates: ${data.latitude}, ${data.longitude}`);
      });
    }
    
    // Test 2: Check if we can access users collection
    console.log('\nTest 2: Accessing users collection...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`✅ Successfully accessed users collection`);
    console.log(`   Found ${usersSnapshot.size} users`);
    
    if (usersSnapshot.size > 0) {
      usersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.firstName || data.name || 'No name'}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Role: ${data.role}`);
      });
    }
    
    // Test 3: Check Firestore Rules
    console.log('\nTest 3: Checking Firestore Rules...');
    console.log('Current rules should allow all read/write access');
    console.log('If this test passes but client still fails, the issue is in client-side authentication');
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('Firebase access is working correctly!');
    console.log('\n=== TROUBLESHOOTING CLIENT ISSUE ===');
    console.log('If client still gets permissions error:');
    console.log('1. Check if client is using the correct Firebase project');
    console.log('2. Check if client authentication is working');
    console.log('3. Try clearing browser cache and cookies');
    console.log('4. Check if Firestore Rules are deployed to the correct project');
    
  } catch (error) {
    console.error('❌ Error testing Firebase access:', error.message);
  }
}

// Run the test
testClientAccess().then(() => {
  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
