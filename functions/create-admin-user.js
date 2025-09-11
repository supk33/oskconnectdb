// Callable function to create admin user
// Add this to functions/index.js

exports.createAdminUser = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid } = context.auth;
    const { email, name } = data;

    // Create admin user data
    const adminUserData = {
      uid: uid,
      email: email || context.auth.token.email || 'admin@oskconnect.com',
      name: name || 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };

    // Save to Firestore
    const db = admin.firestore();
    await db.collection('users').doc(uid).set(adminUserData);

    console.log('Admin user created:', adminUserData);

    return {
      success: true,
      message: 'Admin user created successfully',
      user: adminUserData
    };

  } catch (error) {
    console.error('Error creating admin user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create admin user');
  }
});
