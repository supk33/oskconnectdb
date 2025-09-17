// Utility function to add test data via Firebase Functions API
import { auth } from '../config/firebase';

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
      oskVersion: "100",
      status: "approved",
      ownerId: "test-user-1",
      owner: {
        firstName: "สมชาย",
        lastName: "ใจดี"
      },
      images: ["data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjhmYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc0YzcxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3RhcmJ1Y2tzPC90ZXh0Pjwvc3ZnPg=="]
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
      oskVersion: "101",
      status: "approved",
      ownerId: "test-user-2",
      owner: {
        firstName: "สมหญิง",
        lastName: "รักไทย"
      },
      images: ["data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZlZjNmMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZGMyNjI2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+ไทยโบราณPC90ZXh0Pjwvc3ZnPg=="]
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
      oskVersion: "102",
      status: "pending",
      ownerId: "test-user-3",
      owner: {
        firstName: "สมศรี",
        lastName: "หวานใจ"
      },
      images: ["data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZlZjNmMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZjU5ZTI3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+ขนมหวานPC90ZXh0Pjwvc3ZnPg=="]
    }
  ];

  try {
    console.log('Adding test data via Firebase Functions API...');
    
    // Get current user token
    const idToken = await auth.currentUser?.getIdToken?.();
    if (!idToken) {
      return { success: false, message: 'User not authenticated' };
    }
    
    for (const store of testStores) {
      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(store)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add store ${store.shopName}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Added store:', store.shopName, 'with ID:', result.id);
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
