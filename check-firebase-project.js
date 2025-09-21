// ตรวจสอบ Firebase Project Configuration
const admin = require('firebase-admin');

console.log('=== FIREBASE PROJECT CHECK ===\n');

// ตรวจสอบว่ามี service account หรือไม่
try {
  const serviceAccount = require('./functions/oskconnectdb-firebase-adminsdk.json');
  console.log('✅ Service Account Key พบแล้ว');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }
  
  console.log('\n=== TESTING FIREBASE ACCESS ===');
  
  // Test Firestore access
  const db = admin.firestore();
  db.collection('stores').get().then((snapshot) => {
    console.log(`✅ Firestore Access: สำเร็จ`);
    console.log(`   พบ ${snapshot.size} ร้านค้า`);
    
    if (snapshot.size > 0) {
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.shopName || data.name}: ${data.status}`);
      });
    }
  }).catch((error) => {
    console.log(`❌ Firestore Access: ${error.message}`);
  });
  
} catch (error) {
  console.log('❌ Service Account Key ไม่พบ:', error.message);
  console.log('\n💡 วิธีแก้ไข:');
  console.log('1. ไปที่ Firebase Console > Project Settings > Service Accounts');
  console.log('2. คลิก "Generate new private key"');
  console.log('3. บันทึกไฟล์เป็น functions/oskconnectdb-firebase-adminsdk.json');
}
