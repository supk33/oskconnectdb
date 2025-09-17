// Script to create users collection in Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for emulator
admin.initializeApp({
  projectId: 'demo-project'
});

// Connect to emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const db = admin.firestore();

async function createUsersCollection() {
  try {
    console.log('Creating users collection...');
    
    // Get all users from Authentication
    const listUsersResult = await admin.auth().listUsers();
    console.log('Found users in Authentication:', listUsersResult.users.length);
    
    for (const userRecord of listUsersResult.users) {
      console.log('Processing user:', userRecord.email);
      
      // Determine role based on email
      let role = 'user';
      if (userRecord.email === 'admin@oskconnect.com') {
        role = 'admin';
      }
      
      // Create user data
      const userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || 'User',
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      
      // Save to Firestore
      await db.collection('users').doc(userRecord.uid).set(userData);
      console.log('User created in Firestore:', userData);
    }
    
    console.log('Users collection created successfully!');
    
  } catch (error) {
    console.error('Error creating users collection:', error);
  }
}

createUsersCollection().then(() => {
  console.log('Script completed');
  process.exit(0);
});
