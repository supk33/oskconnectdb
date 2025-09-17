# 📊 Member Dashboard Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMBER DASHBOARD DATA FLOW                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   React      │    │  Firestore  │    │   UI        │
│   Login     │───▶│  Component   │───▶│  Database   │───▶│  Display    │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                           │                     │
                           ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │   Real-time  │    │   Query     │
                   │   Listener   │    │   Builder   │
                   └──────────────┘    └─────────────┘
                           │                     │
                           ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │   onSnapshot │    │   where()   │
                   │   Callback   │    │   orderBy() │
                   └──────────────┘    └─────────────┘
                           │                     │
                           ▼                     ▼
                   ┌──────────────┐    ┌─────────────┐
                   │   State      │    │   Filter    │
                   │   Updates    │    │   Results   │
                   └──────────────┘    └─────────────┘
```

## 🔄 Step-by-Step Process

### 1. **User Authentication**
```
User Login → AuthContext → user.uid available
```

### 2. **Query Setup**
```javascript
const shopsQuery = query(
  collection(db, 'stores'),           // Collection: stores
  where('ownerId', '==', user.uid)   // Filter: current user's shops
);
```

### 3. **Real-time Listener**
```javascript
const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
  // Process data when changes occur
});
```

### 4. **Data Processing**
```javascript
snapshot.forEach((doc) => {
  userShops.push({ id: doc.id, ...doc.data() });
});
```

### 5. **State Updates**
```javascript
setShops(userShops);
setStats(calculateStats(userShops));
```

### 6. **UI Rendering**
```javascript
return (
  <div>
    <StatsCards stats={stats} />
    <ShopList shops={shops} />
  </div>
);
```

## 🎯 Query Types Comparison

| Query Type | Use Case | Real-time | Performance |
|------------|----------|-----------|-------------|
| `onSnapshot` | Dashboard | ✅ Yes | ⚠️ Medium |
| `getDocs` | One-time fetch | ❌ No | ✅ Fast |
| `getDoc` | Single document | ❌ No | ✅ Fastest |

## 🔍 Query Building Process

```
1. Start with collection('stores')
   ↓
2. Add where('ownerId', '==', user.uid)
   ↓
3. Add orderBy('createdAt', 'desc')
   ↓
4. Add limit(10) [optional]
   ↓
5. Execute with onSnapshot() or getDocs()
```

## 📊 Data Structure

```javascript
// Firestore Document Structure
{
  id: "shop-doc-id",
  shopName: "ร้านค้าตัวอย่าง",
  description: "คำอธิบายร้านค้า",
  status: "pending", // pending, approved, rejected
  ownerId: "user-uid",
  category: "restaurant",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // ... other fields
}
```

## 🚨 Common Issues & Solutions

### Issue 1: No Data Showing
```javascript
// ❌ Wrong: Missing user check
useEffect(() => {
  setupQuery();
}, []);

// ✅ Correct: Wait for user
useEffect(() => {
  if (user?.uid) {
    setupQuery();
  }
}, [user?.uid]);
```

### Issue 2: Memory Leaks
```javascript
// ❌ Wrong: No cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
}, []);

// ✅ Correct: Cleanup listener
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
  return () => unsubscribe(); // Cleanup
}, []);
```

### Issue 3: Loading States
```javascript
// ❌ Wrong: No loading state
const [shops, setShops] = useState([]);

// ✅ Correct: With loading state
const [shops, setShops] = useState([]);
const [loading, setLoading] = useState(true);
```

## 🎨 Best Practices

1. **Always check user authentication** before querying
2. **Use real-time listeners** for dashboards
3. **Handle loading states** for better UX
4. **Clean up listeners** to prevent memory leaks
5. **Filter data** on the client side for better performance
6. **Log queries** for debugging
7. **Handle errors** gracefully
8. **Use TypeScript** for better type safety

## 🔧 Debugging Tips

```javascript
// Add logging to see what's happening
const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
  console.log('📊 Snapshot received:', {
    size: snapshot.size,
    empty: snapshot.empty,
    docs: snapshot.docs.length
  });
  
  snapshot.forEach((doc) => {
    console.log('📄 Document:', {
      id: doc.id,
      data: doc.data()
    });
  });
}, (error) => {
  console.error('❌ Query error:', error);
});
```
