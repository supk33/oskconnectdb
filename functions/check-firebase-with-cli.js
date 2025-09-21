const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkFirebaseWithCLI() {
  try {
    console.log('=== CHECKING FIREBASE DATA USING CLI ===\n');
    
    // Check if Firebase CLI is authenticated
    try {
      const { stdout: projectsOutput } = await execAsync('firebase projects:list');
      console.log('✅ Firebase CLI is authenticated');
      console.log('Available projects:');
      console.log(projectsOutput);
    } catch (error) {
      console.log('❌ Firebase CLI not authenticated or no projects found');
      console.log('Please run: firebase login');
      return;
    }
    
    // Set the project
    await execAsync('firebase use oskconnectdb');
    console.log('✅ Using project: oskconnectdb');
    
    // Get Firestore data using Firebase CLI
    try {
      const { stdout: firestoreData } = await execAsync('firebase firestore:export --format=json temp_export.json');
      console.log('✅ Firestore data exported successfully');
      
      // Read the exported data
      const fs = require('fs');
      if (fs.existsSync('temp_export.json')) {
        const data = JSON.parse(fs.readFileSync('temp_export.json', 'utf8'));
        
        // Check stores collection
        const stores = data.__collections__?.stores || {};
        const storeIds = Object.keys(stores);
        
        console.log(`\n=== STORES FOUND: ${storeIds.length} ===`);
        
        if (storeIds.length === 0) {
          console.log('❌ No stores found in Firebase');
        } else {
          storeIds.forEach((storeId, index) => {
            const store = stores[storeId];
            console.log(`${index + 1}. ${store.shopName || store.name || 'No name'}`);
            console.log(`   ID: ${storeId}`);
            console.log(`   Status: ${store.status || 'No status'}`);
            console.log(`   Owner: ${store.ownerId || 'No owner'}`);
            
            // Check for coordinates
            const hasLatLng = store.latitude && store.longitude;
            const hasLocationCoords = store.location && store.location.coordinates && store.location.coordinates.length === 2;
            const hasCoordinates = hasLatLng || hasLocationCoords;
            
            if (hasCoordinates) {
              console.log(`   ✅ HAS coordinates`);
              if (hasLatLng) {
                console.log(`   Latitude: ${store.latitude}, Longitude: ${store.longitude}`);
              }
              if (hasLocationCoords) {
                console.log(`   Location: [${store.location.coordinates[0]}, ${store.location.coordinates[1]}]`);
              }
            } else {
              console.log(`   ❌ MISSING coordinates`);
            }
            console.log('');
          });
        }
        
        // Check users collection
        const users = data.__collections__?.users || {};
        const userIds = Object.keys(users);
        
        console.log(`=== USERS FOUND: ${userIds.length} ===`);
        
        if (userIds.length === 0) {
          console.log('❌ No users found in Firebase');
        } else {
          userIds.forEach((userId, index) => {
            const user = users[userId];
            console.log(`${index + 1}. ${user.firstName || user.name || 'No name'} (${user.email || 'No email'})`);
            console.log(`   ID: ${userId}`);
            console.log(`   Role: ${user.role || 'No role'}`);
            console.log('');
          });
        }
        
        // Clean up
        fs.unlinkSync('temp_export.json');
      }
      
    } catch (error) {
      console.log('❌ Error exporting Firestore data:', error.message);
      console.log('Make sure you have the correct permissions for the project');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the check
checkFirebaseWithCLI().then(() => {
  console.log('\n=== CHECK COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Check failed:', error);
  process.exit(1);
});
