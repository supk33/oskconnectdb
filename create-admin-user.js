// Script to create admin user in Firebase emulator
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'demo-project'
});

const db = admin.firestore();

async function createAdminUser() {
  try {
    // Create admin user data
    const adminUserData = {
      uid: 'admin-user-123',
      email: 'admin@oskconnect.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };

    // Save to Firestore
    await db.collection('users').doc('admin-user-123').set(adminUserData);

    console.log('Admin user created successfully:', adminUserData);

    // Also create the user in Authentication
    try {
      await admin.auth().createUser({
        uid: 'admin-user-123',
        email: 'admin@oskconnect.com',
        password: '123456',
        displayName: 'Admin User'
      });
      console.log('Admin user created in Authentication');
    } catch (authError) {
      console.log('Admin user might already exist in Authentication:', authError.message);
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
});
