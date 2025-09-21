const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for REAL Firebase
// This will use Application Default Credentials (ADC)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'oskconnectdb'
  });
}

const db = admin.firestore();

async function checkRealFirebaseSimple() {
  try {
    console.log('=== CHECKING REAL FIREBASE DATA (SIMPLE) ===\n');
    
    // Test connection first
    console.log('Testing connection to Firebase...');
    
    // Get all shops from REAL Firebase
    const shopsSnapshot = await db.collection('stores').get();
    const allShops = [];
    
    shopsSnapshot.forEach((doc) => {
      allShops.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Connection successful!`);
    console.log(`Total shops in REAL Firebase: ${allShops.length}`);
    
    if (allShops.length === 0) {
      console.log('❌ No shops found in REAL Firebase!');
      return;
    }
    
    // Check each shop for coordinates
    let shopsWithCoordinates = 0;
    let shopsWithoutCoordinates = 0;
    const missingCoordinates = [];
    
    console.log('\n=== SHOPS DETAILS ===');
    allShops.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.shopName || shop.name || 'No name'}`);
      console.log(`   ID: ${shop.id}`);
      console.log(`   Status: ${shop.status || 'No status'}`);
      console.log(`   Owner: ${shop.ownerId || 'No owner'}`);
      
      // Check for coordinates
      const hasLatLng = shop.latitude && shop.longitude;
      const hasLocationCoords = shop.location && shop.location.coordinates && shop.location.coordinates.length === 2;
      const hasCoordinates = hasLatLng || hasLocationCoords;
      
      if (hasCoordinates) {
        shopsWithCoordinates++;
        console.log(`   ✅ HAS coordinates`);
        if (hasLatLng) {
          console.log(`   Latitude: ${shop.latitude}, Longitude: ${shop.longitude}`);
        }
        if (hasLocationCoords) {
          console.log(`   Location: [${shop.location.coordinates[0]}, ${shop.location.coordinates[1]}]`);
        }
      } else {
        shopsWithoutCoordinates++;
        missingCoordinates.push({
          id: shop.id,
          name: shop.shopName || shop.name || 'No name',
          status: shop.status || 'No status'
        });
        console.log(`   ❌ MISSING coordinates`);
      }
      console.log('');
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total shops: ${allShops.length}`);
    console.log(`Shops with coordinates: ${shopsWithCoordinates}`);
    console.log(`Shops without coordinates: ${shopsWithoutCoordinates}`);
    
    if (missingCoordinates.length > 0) {
      console.log('\n=== SHOPS MISSING COORDINATES ===');
      missingCoordinates.forEach((shop, index) => {
        console.log(`${index + 1}. ${shop.name}`);
        console.log(`   ID: ${shop.id}`);
        console.log(`   Status: ${shop.status}`);
        console.log('');
      });
      
      console.log('Would you like to add coordinates to these shops?');
      console.log('Run: node add-coordinates-to-real-firebase-simple.js');
    }
    
    // Check users
    console.log('\n=== CHECKING USERS ===');
    const usersSnapshot = await db.collection('users').get();
    const allUsers = [];
    
    usersSnapshot.forEach((doc) => {
      allUsers.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total users in REAL Firebase: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in REAL Firebase!');
      console.log('Would you like to create test users?');
      console.log('Run: node create-test-users-simple.js');
    } else {
      console.log('\nUsers:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName || user.name || 'No name'} (${user.email || 'No email'})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role || 'No role'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error checking REAL Firebase:', error.message);
    console.log('\n=== TROUBLESHOOTING ===');
    console.log('1. Make sure you are logged in to Firebase CLI:');
    console.log('   firebase login');
    console.log('2. Set the correct project:');
    console.log('   firebase use oskconnectdb');
    console.log('3. Or use Application Default Credentials:');
    console.log('   gcloud auth application-default login');
  }
}

// Run the check
checkRealFirebaseSimple().then(() => {
  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Check failed:', error.message);
  process.exit(1);
});
