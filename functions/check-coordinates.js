const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-project'
  });
}

// Connect to Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const db = admin.firestore();

async function checkCoordinates() {
  try {
    console.log('=== CHECKING SHOPS AND COORDINATES ===\n');
    
    // Get all shops from stores collection
    const storesSnapshot = await db.collection('stores').get();
    console.log(`Found ${storesSnapshot.size} shops in 'stores' collection`);
    
    let shopsWithCoordinates = 0;
    let shopsWithoutCoordinates = 0;
    const missingCoordinates = [];
    
    storesSnapshot.forEach((doc) => {
      const shopData = doc.data();
      const shopName = shopData.shopName || shopData.name || 'Unknown';
      
      // Check for coordinates in different possible formats
      const hasLatLng = shopData.latitude && shopData.longitude;
      const hasLocationCoords = shopData.location && shopData.location.coordinates && shopData.location.coordinates.length === 2;
      const hasCoordinates = hasLatLng || hasLocationCoords;
      
      if (hasCoordinates) {
        shopsWithCoordinates++;
        console.log(`✅ ${shopName} - HAS coordinates`);
        if (hasLatLng) {
          console.log(`   Latitude: ${shopData.latitude}, Longitude: ${shopData.longitude}`);
        }
        if (hasLocationCoords) {
          console.log(`   Location: [${shopData.location.coordinates[0]}, ${shopData.location.coordinates[1]}]`);
        }
      } else {
        shopsWithoutCoordinates++;
        missingCoordinates.push({
          id: doc.id,
          name: shopName,
          status: shopData.status || 'unknown'
        });
        console.log(`❌ ${shopName} - MISSING coordinates`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Status: ${shopData.status || 'unknown'}`);
      }
      console.log('');
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total shops: ${storesSnapshot.size}`);
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
    }
    
    // Also check if there are shops in other collections
    console.log('\n=== CHECKING OTHER COLLECTIONS ===');
    
    const collections = ['shops', 'shop', 'store'];
    for (const collectionName of collections) {
      try {
        const otherSnapshot = await db.collection(collectionName).get();
        if (otherSnapshot.size > 0) {
          console.log(`Found ${otherSnapshot.size} documents in '${collectionName}' collection`);
        }
      } catch (error) {
        // Collection might not exist
      }
    }
    
  } catch (error) {
    console.error('Error checking coordinates:', error);
  }
}

// Run the check
checkCoordinates().then(() => {
  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Check failed:', error);
  process.exit(1);
});
