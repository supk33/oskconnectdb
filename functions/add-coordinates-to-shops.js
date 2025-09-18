const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({ projectId: 'oskconnectdb' });
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const db = admin.firestore();

async function addCoordinatesToShops() {
  try {
    console.log('=== ADDING COORDINATES TO SHOPS ===');
    
    const shopsSnapshot = await db.collection('stores').get();
    console.log(`Found ${shopsSnapshot.size} shops`);
    
    // Bangkok area coordinates for testing
    const bangkokCoordinates = [
      { lat: 13.7563, lng: 100.5018 }, // Central Bangkok
      { lat: 13.7307, lng: 100.5232 }, // Silom
      { lat: 13.7563, lng: 100.5018 }, // Siam
      { lat: 13.7307, lng: 100.5232 }, // Sukhumvit
      { lat: 13.7563, lng: 100.5018 }, // Chatuchak
      { lat: 13.7307, lng: 100.5232 }, // Thonglor
      { lat: 13.7563, lng: 100.5018 }, // Ari
      { lat: 13.7307, lng: 100.5232 }, // Phrom Phong
    ];
    
    let updatedCount = 0;
    
    for (let i = 0; i < shopsSnapshot.docs.length; i++) {
      const doc = shopsSnapshot.docs[i];
      const shopData = doc.data();
      
      // Only add coordinates if they don't exist
      if (!shopData.latitude || !shopData.longitude) {
        const coords = bangkokCoordinates[i % bangkokCoordinates.length];
        
        await doc.ref.update({
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
          address: shopData.address || 'กรุงเทพมหานคร, ประเทศไทย'
        });
        
        console.log(`Updated shop "${shopData.shopName}" with coordinates: ${coords.lat}, ${coords.lng}`);
        updatedCount++;
      } else {
        console.log(`Shop "${shopData.shopName}" already has coordinates: ${shopData.latitude}, ${shopData.longitude}`);
      }
    }
    
    console.log(`=== COMPLETED: Updated ${updatedCount} shops with coordinates ===`);
    
  } catch (error) {
    console.error('Error adding coordinates to shops:', error);
  }
}

addCoordinatesToShops();
