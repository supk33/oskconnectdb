// Simple test to add coordinates to one shop
const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'oskconnectdb' });
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const db = admin.firestore();

async function testCoordinates() {
  try {
    console.log('Adding coordinates to first shop...');
    
    const shopsSnapshot = await db.collection('stores').get();
    if (shopsSnapshot.docs.length > 0) {
      const firstShop = shopsSnapshot.docs[0];
      await firstShop.ref.update({
        latitude: '13.7563',
        longitude: '100.5018',
        address: 'กรุงเทพมหานคร, ประเทศไทย'
      });
      console.log('Updated first shop with coordinates');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

testCoordinates();
