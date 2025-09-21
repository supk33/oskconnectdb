const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for REAL Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'oskconnectdb'
  });
}

const db = admin.firestore();

const testUsers = [
  {
    uid: 'user123',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'somchai@example.com',
    role: 'member',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'admin001',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@oskconnectdb.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createTestUsers() {
  try {
    console.log('=== CREATING TEST USERS IN REAL FIREBASE ===\n');
    
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const userDoc = await db.collection('users').doc(userData.uid).get();
        
        if (userDoc.exists) {
          console.log(`✅ User ${userData.firstName} ${userData.lastName} already exists`);
          continue;
        }
        
        // Create user
        await db.collection('users').doc(userData.uid).set(userData);
        console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   UID: ${userData.uid}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error creating user ${userData.firstName}:`, error);
      }
    }
    
    console.log('=== USER CREATION COMPLETE ===');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

// Run the creation
createTestUsers().then(() => {
  console.log('\n=== COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('Creation failed:', error);
  process.exit(1);
});
