const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-project'
  });
}

const db = admin.firestore();

// Connect to Firestore emulator
db.settings({
  host: 'localhost:8080',
  ssl: false
});

async function checkCurrentData() {
  try {
    console.log('=== STEP 1: CHECKING CURRENT FIRESTORE DATA ===\n');
    
    // Get all shops
    const shopsSnapshot = await db.collection('stores').get();
    const allShops = [];
    
    shopsSnapshot.forEach((doc) => {
      allShops.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total shops in Firestore: ${allShops.length}`);
    
    if (allShops.length === 0) {
      console.log('❌ No shops found in Firestore!');
      return;
    }
    
    // Count by status
    const statusCounts = allShops.reduce((acc, shop) => {
      acc[shop.status] = (acc[shop.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status counts:', statusCounts);
    
    // Show all shops with details
    console.log('\n=== ALL SHOPS DETAILS ===');
    allShops.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.shopName || shop.name || 'No name'}`);
      console.log(`   ID: ${shop.id}`);
      console.log(`   Status: ${shop.status}`);
      console.log(`   Owner: ${shop.ownerId}`);
      console.log(`   Created: ${shop.createdAt}`);
      console.log(`   Updated: ${shop.updatedAt}`);
      console.log('');
    });
    
    // Test member shops endpoint logic for each user
    console.log('\n=== MEMBER SHOPS BY USER ===');
    const users = [...new Set(allShops.map(shop => shop.ownerId))];
    
    for (const userId of users) {
      const userShopsSnapshot = await db.collection('stores')
        .where('ownerId', '==', userId)
        .get();
      
      const userShops = [];
      userShopsSnapshot.forEach(doc => {
        userShops.push({ id: doc.id, ...doc.data() });
      });
      
      const userStatusCounts = userShops.reduce((acc, shop) => {
        acc[shop.status] = (acc[shop.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`User: ${userId}`);
      console.log(`  Total: ${userShops.length}, Status counts:`, userStatusCounts);
      userShops.forEach((shop, index) => {
        console.log(`    ${index + 1}. ${shop.shopName} (Status: ${shop.status})`);
      });
      console.log('');
    }
    
    // Test admin dashboard logic
    console.log('\n=== ADMIN DASHBOARD LOGIC ===');
    const pendingShops = allShops.filter(shop => shop.status === 'pending');
    const approvedShops = allShops.filter(shop => shop.status === 'approved');
    const rejectedShops = allShops.filter(shop => shop.status === 'rejected');
    
    console.log(`Admin Dashboard should show:`);
    console.log(`  Total shops: ${allShops.length}`);
    console.log(`  Pending shops: ${pendingShops.length}`);
    console.log(`  Approved shops: ${approvedShops.length}`);
    console.log(`  Rejected shops: ${rejectedShops.length}`);
    
    if (pendingShops.length > 0) {
      console.log('\nPending shops:');
      pendingShops.forEach((shop, index) => {
        console.log(`  ${index + 1}. ${shop.shopName} (Owner: ${shop.ownerId})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking current data:', error);
  }
}

// Run the check
checkCurrentData().then(() => {
  console.log('\n=== STEP 1 COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Check failed:', error);
  process.exit(1);
});
