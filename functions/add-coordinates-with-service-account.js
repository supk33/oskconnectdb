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

// Bangkok coordinates for shops
const bangkokCoordinates = [
  { lat: 13.7563, lng: 100.5018 }, // Central Bangkok
  { lat: 13.7307, lng: 100.5232 }, // Silom
  { lat: 13.7563, lng: 100.5018 }, // Siam
  { lat: 13.7307, lng: 100.5232 }, // Sukhumvit
  { lat: 13.7563, lng: 100.5018 }, // Chatuchak
  { lat: 13.7307, lng: 100.5232 }, // Thonglor
];

async function addCoordinatesWithServiceAccount() {
  try {
    console.log('=== ADDING COORDINATES TO FIREBASE WITH SERVICE ACCOUNT ===\n');
    
    // Get all shops from Firebase
    const shopsSnapshot = await db.collection('stores').get();
    let updatedCount = 0;
    
    for (let i = 0; i < shopsSnapshot.docs.length; i++) {
      const doc = shopsSnapshot.docs[i];
      const shopData = doc.data();
      
      // Check if shop already has coordinates
      const hasLatLng = shopData.latitude && shopData.longitude;
      const hasLocationCoords = shopData.location && shopData.location.coordinates && shopData.location.coordinates.length === 2;
      const hasCoordinates = hasLatLng || hasLocationCoords;
      
      if (hasCoordinates) {
        console.log(`✅ Shop "${shopData.shopName || shopData.name}" already has coordinates`);
        continue;
      }
      
      console.log(`Updating shop: ${shopData.shopName || shopData.name || 'No name'}`);
      
      const coords = bangkokCoordinates[i % bangkokCoordinates.length];
      
      // Add coordinates in both formats for compatibility
      await doc.ref.update({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        location: {
          type: 'Point',
          coordinates: [coords.lng, coords.lat]
        },
        updatedAt: new Date()
      });
      
      console.log(`  ✅ Added coordinates: ${coords.lat}, ${coords.lng}`);
      console.log(`  ✅ Added location: [${coords.lng}, ${coords.lat}]`);
      updatedCount++;
    }
    
    console.log(`\n=== COMPLETED: Updated ${updatedCount} shops with coordinates ===`);
    
  } catch (error) {
    console.error('Error adding coordinates:', error);
  }
}

// Run the update
addCoordinatesWithServiceAccount().then(() => {
  console.log('\n=== UPDATE COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
