// Test data for Firestore
// Run this script to populate Firestore with test data

const testStores = [
  {
    shopName: "ร้านกาแฟสตาร์บัคส์",
    description: "ร้านกาแฟสไตล์อเมริกัน เปิดบริการ 24 ชั่วโมง",
    category: "กาแฟ",
    location: {
      type: "Point",
      coordinates: [100.5018, 13.7563] // Bangkok coordinates
    },
    phone: "02-123-4567",
    email: "bangkok@starbucks.com",
    status: "approved",
    ownerId: "test-user-1",
    owner: {
      firstName: "สมชาย",
      lastName: "ใจดี"
    },
    createdAt: new Date(),
    updatedAt: new Date()
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
    createdAt: new Date(),
    updatedAt: new Date()
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
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const testUsers = [
  {
    uid: "test-user-1",
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    role: "member",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: "test-user-2", 
    name: "สมหญิง รักไทย",
    email: "somying@example.com",
    role: "member",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: "test-user-3",
    name: "สมศรี หวานใจ", 
    email: "somsri@example.com",
    role: "member",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

console.log('Test data ready to be imported to Firestore:');
console.log('Stores:', testStores);
console.log('Users:', testUsers);

// To import this data, you can use Firebase Admin SDK or Firebase Console
// Or create a simple script to add this data to Firestore
