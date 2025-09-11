// Script to create Firebase Auth user
// Run with: node create-auth-user.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'oskconnectdb'
});

async function createAuthUser() {
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: 'admin@oskconnect.com',
      password: '123456',
      displayName: 'Admin User'
    });

    console.log('✅ Firebase Auth user created successfully!');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    
    // Create corresponding Firestore document
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Firestore document created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    process.exit(0);
  }
}

createAuthUser();
