const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Use emulator for development but connect to real Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'oskconnectdb'
  });
}

const db = admin.firestore();

// Don't connect to emulator - use real Firebase
// db.settings({
//   host: 'localhost:8080',
//   ssl: false
// });

async function checkFirebaseEmulatorReal() {
  try {
    console.log('=== CHECKING FIREBASE DATA (EMULATOR -> REAL) ===\n');
    
    // Test connection first
    console.log('Testing connection to Firebase...');
    
    // Get all shops from Firebase
    const shopsSnapshot = await db.collection('stores').get();
    const allShops = [];
    
    shopsSnapshot.forEach((doc) => {
      allShops.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Connection successful!`);
    console.log(`Total shops in Firebase: ${allShops.length}`);
    
    if (allShops.length === 0) {
      console.log('❌ No shops found in Firebase!');
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
      console.log('Run: node add-coordinates-emulator-real.js');
    }
    
    // Check users
    console.log('\n=== CHECKING USERS ===');
    const usersSnapshot = await db.collection('users').get();
    const allUsers = [];
    
    usersSnapshot.forEach((doc) => {
      allUsers.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total users in Firebase: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in Firebase!');
      console.log('Would you like to create test users?');
      console.log('Run: node create-test-users-emulator-real.js');
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
    console.error('Error checking Firebase:', error.message);
    console.log('\n=== TROUBLESHOOTING ===');
    console.log('1. Make sure you are logged in to Firebase CLI:');
    console.log('   firebase login');
    console.log('2. Set the correct project:');
    console.log('   firebase use oskconnectdb');
    console.log('3. Or use Application Default Credentials:');
    console.log('   gcloud auth application-default login');
    console.log('4. Or create a service account key and set GOOGLE_APPLICATION_CREDENTIALS');
  }
}

// Run the check
checkFirebaseEmulatorReal().then(() => {
  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Check failed:', error.message);
  process.exit(1);
});
