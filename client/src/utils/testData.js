// Test data for development
export const testShops = [
  {
    _id: 'test-shop-1',
    shopName: 'ร้านกาแฟสตาร์บัคส์',
    description: 'ร้านกาแฟสไตล์อเมริกัน เปิดบริการ 24 ชั่วโมง',
    category: 'กาแฟ',
    location: {
      type: 'Point',
      coordinates: [100.5018, 13.7563] // Bangkok coordinates
    },
    phone: '02-123-4567',
    email: 'bangkok@starbucks.com',
    status: 'approved',
    owner: {
      firstName: 'สมชาย',
      lastName: 'ใจดี'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'test-shop-2',
    shopName: 'ร้านอาหารไทยโบราณ',
    description: 'อาหารไทยแท้ ต้นตำรับโบราณ',
    category: 'อาหารไทย',
    location: {
      type: 'Point',
      coordinates: [100.5118, 13.7663]
    },
    phone: '02-234-5678',
    email: 'thai@restaurant.com',
    status: 'approved',
    owner: {
      firstName: 'สมหญิง',
      lastName: 'รักไทย'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'test-shop-3',
    shopName: 'ร้านขนมหวาน',
    description: 'ขนมหวานไทยและต่างประเทศ',
    category: 'ขนมหวาน',
    location: {
      type: 'Point',
      coordinates: [100.5218, 13.7763]
    },
    phone: '02-345-6789',
    email: 'sweet@dessert.com',
    status: 'pending',
    owner: {
      firstName: 'สมศรี',
      lastName: 'หวานใจ'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Function to use test data when API fails
export const useTestData = () => {
  console.log('Using test data for shops');
  return testShops;
};

// Export testShops directly for easier access
export default testShops;
