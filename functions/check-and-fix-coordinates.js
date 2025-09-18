const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({ projectId: 'oskconnectdb' });
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const db = admin.firestore();

async function checkAndFixCoordinates() {
  try {
    console.log('=== CHECKING AND FIXING COORDINATES ===');
    
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
      
      console.log(`\nShop ${i + 1}: ${shopData.shopName}`);
      console.log(`  Current latitude: ${shopData.latitude || 'MISSING'}`);
      console.log(`  Current longitude: ${shopData.longitude || 'MISSING'}`);
      
      // Always update coordinates (force update)
      const coords = bangkokCoordinates[i % bangkokCoordinates.length];
      
      await doc.ref.update({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        address: shopData.address || 'กรุงเทพมหานคร, ประเทศไทย'
      });
      
      console.log(`  Updated with coordinates: ${coords.lat}, ${coords.lng}`);
      updatedCount++;
    }
    
    console.log(`\n=== COMPLETED: Updated ${updatedCount} shops with coordinates ===`);
    
  } catch (error) {
    console.error('Error checking and fixing coordinates:', error);
  }
}

checkAndFixCoordinates();
