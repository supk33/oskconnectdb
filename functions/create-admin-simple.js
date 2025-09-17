// Simple script to create admin user
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for emulator
admin.initializeApp({
  projectId: 'demo-project'
});

// Connect to emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create user in Authentication first
    const userRecord = await admin.auth().createUser({
      email: 'admin@oskconnect.com',
      password: '123456',
      displayName: 'Admin User',
      emailVerified: true
    });
    
    console.log('User created in Authentication:', userRecord.uid);
    
    // Create admin user data in Firestore
    const adminUserData = {
      uid: userRecord.uid,
      email: 'admin@oskconnect.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };

    // Save to Firestore
    await db.collection('users').doc(userRecord.uid).set(adminUserData);
    console.log('Admin user created in Firestore:', adminUserData);

  } catch (error) {
    console.error('Error creating admin user:', error);
    
    // If user already exists, try to update role
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists, trying to update role...');
      try {
        const userRecord = await admin.auth().getUserByEmail('admin@oskconnect.com');
        
        const adminUserData = {
          uid: userRecord.uid,
          email: 'admin@oskconnect.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };

        await db.collection('users').doc(userRecord.uid).set(adminUserData);
        console.log('Admin role updated for existing user:', adminUserData);
      } catch (updateError) {
        console.error('Error updating admin role:', updateError);
      }
    }
  }
}

createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
});
