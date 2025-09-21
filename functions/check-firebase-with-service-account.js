const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK with service account
// You need to download the service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
if (!admin.apps.length) {
  try {
    // Try to use service account key file
    const serviceAccount = require('./oskconnectdb-firebase-adminsdk.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'oskconnectdb'
    });
    
    console.log('✅ Using service account key');
  } catch (error) {
    console.log('❌ Service account key not found');
    console.log('Please download the service account key from Firebase Console:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save the file as "oskconnectdb-firebase-adminsdk.json" in the functions folder');
    console.log('4. Or use Application Default Credentials:');
    console.log('   gcloud auth application-default login');
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkFirebaseWithServiceAccount() {
  try {
    console.log('=== CHECKING FIREBASE DATA WITH SERVICE ACCOUNT ===\n');
    
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
      console.log('Run: node add-coordinates-with-service-account.js');
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
      console.log('Run: node create-test-users-with-service-account.js');
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
  }
}

// Run the check
checkFirebaseWithServiceAccount().then(() => {
  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Check failed:', error.message);
  process.exit(1);
});
