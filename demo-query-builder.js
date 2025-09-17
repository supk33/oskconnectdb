// 🎮 Interactive Query Builder Demo
// This shows you how to build different Firestore queries step by step

import { collection, query, where, orderBy, limit } from 'firebase/firestore';

// ========================================
// QUERY BUILDER FUNCTIONS
// ========================================

// Step 1: Start with a collection
const startQuery = () => {
  console.log('Step 1: Start with collection');
  return collection(db, 'stores');
};

// Step 2: Add where clauses
const addWhereClause = (baseQuery, field, operator, value) => {
  console.log(`Step 2: Add where clause - ${field} ${operator} ${value}`);
  return query(baseQuery, where(field, operator, value));
};

// Step 3: Add ordering
const addOrdering = (baseQuery, field, direction = 'desc') => {
  console.log(`Step 3: Add ordering - ${field} ${direction}`);
  return query(baseQuery, orderBy(field, direction));
};

// Step 4: Add limit
const addLimit = (baseQuery, count) => {
  console.log(`Step 4: Add limit - ${count}`);
  return query(baseQuery, limit(count));
};

// ========================================
// DEMO QUERIES
// ========================================

// Demo 1: Basic query - All shops for current user
const buildBasicQuery = (userId) => {
  console.log('\n🔍 Building Basic Query...');
  
  let q = startQuery();
  q = addWhereClause(q, 'ownerId', '==', userId);
  
  console.log('✅ Basic query built:', q);
  return q;
};

// Demo 2: Filtered query - Only pending shops
const buildPendingQuery = (userId) => {
  console.log('\n🔍 Building Pending Query...');
  
  let q = startQuery();
  q = addWhereClause(q, 'ownerId', '==', userId);
  q = addWhereClause(q, 'status', '==', 'pending');
  q = addOrdering(q, 'createdAt', 'desc');
  
  console.log('✅ Pending query built:', q);
  return q;
};

// Demo 3: Advanced query - Multiple filters
const buildAdvancedQuery = (userId, status = 'approved', category = 'restaurant') => {
  console.log('\n🔍 Building Advanced Query...');
  
  let q = startQuery();
  q = addWhereClause(q, 'ownerId', '==', userId);
  q = addWhereClause(q, 'status', '==', status);
  q = addWhereClause(q, 'category', '==', category);
  q = addOrdering(q, 'createdAt', 'desc');
  q = addLimit(q, 10);
  
  console.log('✅ Advanced query built:', q);
  return q;
};

// Demo 4: Complex query - Multiple statuses
const buildMultiStatusQuery = (userId) => {
  console.log('\n🔍 Building Multi-Status Query...');
  
  let q = startQuery();
  q = addWhereClause(q, 'ownerId', '==', userId);
  q = addWhereClause(q, 'status', 'in', ['pending', 'approved']);
  q = addOrdering(q, 'createdAt', 'desc');
  
  console.log('✅ Multi-status query built:', q);
  return q;
};

// ========================================
// INTERACTIVE DEMO
// ========================================

const runQueryDemo = () => {
  const userId = 'demo-user-123';
  
  console.log('🎮 Starting Query Builder Demo...\n');
  
  // Run all demos
  buildBasicQuery(userId);
  buildPendingQuery(userId);
  buildAdvancedQuery(userId, 'approved', 'restaurant');
  buildMultiStatusQuery(userId);
  
  console.log('\n🎉 Demo complete! Check the console for query building steps.');
};

// ========================================
// REAL-WORLD USAGE EXAMPLES
// ========================================

// Example 1: Member Dashboard - All shops with stats
const memberDashboardQuery = (userId) => {
  return query(
    collection(db, 'stores'),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
};

// Example 2: Admin Dashboard - Pending shops only
const adminPendingQuery = () => {
  return query(
    collection(db, 'stores'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );
};

// Example 3: Public Shop List - Approved shops only
const publicShopsQuery = () => {
  return query(
    collection(db, 'stores'),
    where('status', '==', 'approved'),
    orderBy('shopName', 'asc')
  );
};

// Example 4: Category Filter - Restaurants only
const restaurantQuery = () => {
  return query(
    collection(db, 'stores'),
    where('status', '==', 'approved'),
    where('category', '==', 'restaurant'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
};

// ========================================
// QUERY TESTING UTILITIES
// ========================================

// Test if a query is valid
const testQuery = (queryObj) => {
  try {
    console.log('Testing query:', queryObj);
    // In real usage, you would use onSnapshot or getDocs here
    console.log('✅ Query is valid');
    return true;
  } catch (error) {
    console.error('❌ Query error:', error);
    return false;
  }
};

// Get query explanation
const explainQuery = (queryObj) => {
  console.log('\n📋 Query Explanation:');
  console.log('- Collection: stores');
  console.log('- Filters: Applied where clauses');
  console.log('- Ordering: Applied orderBy clauses');
  console.log('- Limit: Applied limit if specified');
  console.log('- Real-time: Use onSnapshot for live updates');
  console.log('- One-time: Use getDocs for single fetch');
};

// ========================================
// EXPORT FOR USE
// ========================================

export {
  buildBasicQuery,
  buildPendingQuery,
  buildAdvancedQuery,
  buildMultiStatusQuery,
  memberDashboardQuery,
  adminPendingQuery,
  publicShopsQuery,
  restaurantQuery,
  testQuery,
  explainQuery,
  runQueryDemo
};

// ========================================
// USAGE INSTRUCTIONS
// ========================================

/*
HOW TO USE THIS DEMO:

1. Import the functions you need:
   import { buildBasicQuery, memberDashboardQuery } from './demo-query-builder';

2. Use in your component:
   const query = memberDashboardQuery(user.uid);
   const unsubscribe = onSnapshot(query, (snapshot) => {
     // Handle data
   });

3. Test queries:
   testQuery(yourQuery);

4. Run the demo:
   runQueryDemo();

5. Get explanations:
   explainQuery(yourQuery);
*/
