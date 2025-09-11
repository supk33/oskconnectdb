// Utility function to add test data to Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const addTestDataToFirestore = async () => {
  const testStores = [
    {
      shopName: "ร้านกาแฟสตาร์บัคส์",
      description: "ร้านกาแฟสไตล์อเมริกัน เปิดบริการ 24 ชั่วโมง",
      category: "กาแฟ",
      location: {
        type: "Point",
        coordinates: [100.5018, 13.7563]
      },
      phone: "02-123-4567",
      email: "bangkok@starbucks.com",
      status: "approved",
      ownerId: "test-user-1",
      owner: {
        firstName: "สมชาย",
        lastName: "ใจดี"
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      shopName: "ร้านอาหารไทยโบราณ",
      description: "อาหารไทยแท้ ต้นตำรับโบราณ",
      category: "อาหารไทย",
      location: {
        type: "Point",
        coordinates: [100.5118, 13.7663]
      },
      phone: "02-234-5678",
      email: "thai@restaurant.com",
      status: "approved",
      ownerId: "test-user-2",
      owner: {
        firstName: "สมหญิง",
        lastName: "รักไทย"
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      shopName: "ร้านขนมหวาน",
      description: "ขนมหวานไทยและต่างประเทศ",
      category: "ขนมหวาน",
      location: {
        type: "Point",
        coordinates: [100.5218, 13.7763]
      },
      phone: "02-345-6789",
      email: "sweet@dessert.com",
      status: "pending",
      ownerId: "test-user-3",
      owner: {
        firstName: "สมศรี",
        lastName: "หวานใจ"
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  try {
    console.log('Adding test data to Firestore...');
    
    for (const store of testStores) {
      const docRef = await addDoc(collection(db, 'stores'), store);
      console.log('Added store:', store.shopName, 'with ID:', docRef.id);
    }
    
    console.log('Test data added successfully!');
    return { success: true, message: 'Test data added successfully!' };
  } catch (error) {
    console.error('Error adding test data:', error);
    return { success: false, message: error.message };
  }
};

// Function to add test data via console
export const addTestDataViaConsole = () => {
  console.log('To add test data, run this in the browser console:');
  console.log(`
import { addTestDataToFirestore } from './utils/addTestData';
addTestDataToFirestore().then(result => console.log(result));
  `);
};
