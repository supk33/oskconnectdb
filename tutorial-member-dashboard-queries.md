# 📚 Tutorial: How to Query Shop Data in Member Dashboard

## 🎯 Overview
The Member Dashboard uses **Firestore real-time listeners** to fetch and display shop data. Here's how it works:

## 📦 Required Imports

```javascript
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
```

## 🔥 Method 1: Basic Real-time Query (Current Implementation)

### Step 1: Setup the Query
```javascript
const setupRealTimeListener = () => {
  try {
    setLoading(true);
    console.log('MemberDashboard - Setting up real-time listener for user:', user?.uid);
    
    // Create query to get shops owned by current user
    const shopsQuery = query(
      collection(db, 'stores'),           // Collection name
      where('ownerId', '==', user.uid)    // Filter by owner
    );
```

### Step 2: Listen for Changes
```javascript
    // Listen to real-time changes
    const unsubscribe = onSnapshot(shopsQuery, (shopsSnapshot) => {
      const userShops = [];
      
      // Process each document
      shopsSnapshot.forEach((doc) => {
        userShops.push({ 
          id: doc.id,           // Document ID
          ...doc.data()         // All document data
        });
      });
      
      // Update state
      setShops(userShops);
      setLoading(false);
    }, (error) => {
      console.error('Real-time listener error:', error);
      setLoading(false);
    });
    
  } catch (error) {
    console.error('Error setting up listener:', error);
    setLoading(false);
  }
};
```

## 🔥 Method 2: Advanced Query with Sorting and Filtering

```javascript
const setupAdvancedQuery = () => {
  const shopsQuery = query(
    collection(db, 'stores'),
    where('ownerId', '==', user.uid),
    where('status', 'in', ['pending', 'approved']),  // Only pending and approved
    orderBy('createdAt', 'desc'),                     // Sort by newest first
    limit(10)                                         // Limit to 10 results
  );
  
  const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
    const shops = [];
    snapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    setShops(shops);
  });
};
```

## 🔥 Method 3: Query with Multiple Filters

```javascript
const setupFilteredQuery = (statusFilter = 'all') => {
  let shopsQuery;
  
  if (statusFilter === 'all') {
    // Get all shops for user
    shopsQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  } else {
    // Get shops with specific status
    shopsQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', user.uid),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc')
    );
  }
  
  const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
    const shops = [];
    snapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    setShops(shops);
  });
};
```

## 🔥 Method 4: One-time Query (No Real-time)

```javascript
const fetchShopsOnce = async () => {
  try {
    setLoading(true);
    
    const shopsQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', user.uid)
    );
    
    const snapshot = await getDocs(shopsQuery);
    const shops = [];
    
    snapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() });
    });
    
    setShops(shops);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching shops:', error);
    setLoading(false);
  }
};
```

## 📊 Data Processing and Statistics

### Calculate Statistics
```javascript
const calculateStats = (shops) => {
  return {
    total: shops.length,
    approved: shops.filter(s => s.status === 'approved').length,
    pending: shops.filter(s => s.status === 'pending').length,
    rejected: shops.filter(s => s.status === 'rejected').length
  };
};

// Use in onSnapshot callback
const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
  const userShops = [];
  snapshot.forEach((doc) => {
    userShops.push({ id: doc.id, ...doc.data() });
  });
  
  setShops(userShops);
  setStats(calculateStats(userShops));  // Update statistics
});
```

## 🎨 Complete Component Example

```javascript
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    if (user?.uid) {
      setupRealTimeListener();
    }
    
    // Cleanup on unmount
    return () => {
      // Firestore listeners auto-cleanup
    };
  }, [user?.uid]);

  const setupRealTimeListener = () => {
    try {
      setLoading(true);
      
      // Query: Get shops owned by current user, sorted by newest first
      const shopsQuery = query(
        collection(db, 'stores'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
        const userShops = [];
        
        snapshot.forEach((doc) => {
          userShops.push({ 
            id: doc.id, 
            ...doc.data() 
          });
        });
        
        // Update shops
        setShops(userShops);
        
        // Calculate and update statistics
        setStats({
          total: userShops.length,
          approved: userShops.filter(s => s.status === 'approved').length,
          pending: userShops.filter(s => s.status === 'pending').length,
          rejected: userShops.filter(s => s.status === 'rejected').length
        });
        
        setLoading(false);
      }, (error) => {
        console.error('Real-time listener error:', error);
        setLoading(false);
      });
      
    } catch (error) {
      console.error('Error setting up listener:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>My Shops ({stats.total})</h1>
      <div>
        <p>Approved: {stats.approved}</p>
        <p>Pending: {stats.pending}</p>
        <p>Rejected: {stats.rejected}</p>
      </div>
      
      {shops.map(shop => (
        <div key={shop.id}>
          <h3>{shop.shopName}</h3>
          <p>Status: {shop.status}</p>
        </div>
      ))}
    </div>
  );
};

export default MemberDashboard;
```

## 🔧 Query Options Explained

### Collection Reference
```javascript
collection(db, 'stores')  // Points to 'stores' collection
```

### Where Clauses
```javascript
where('ownerId', '==', user.uid)           // Equal to
where('status', '==', 'pending')           // Equal to
where('status', 'in', ['pending', 'approved'])  // In array
where('createdAt', '>', someDate)          // Greater than
where('rating', '>=', 4.0)                 // Greater than or equal
```

### Ordering
```javascript
orderBy('createdAt', 'desc')    // Newest first
orderBy('shopName', 'asc')      // Alphabetical
orderBy('status', 'asc')        // By status
```

### Limiting
```javascript
limit(10)    // Get only 10 documents
```

## 🚨 Important Notes

1. **Real-time vs One-time**: `onSnapshot` gives real-time updates, `getDocs` is one-time
2. **Indexing**: Complex queries may require Firestore indexes
3. **Cleanup**: Real-time listeners auto-cleanup when component unmounts
4. **Error Handling**: Always handle errors in listeners
5. **Loading States**: Manage loading states for better UX

## 🎯 Best Practices

1. **Use real-time listeners** for dashboards that need live updates
2. **Filter by user ID** to ensure data security
3. **Handle loading states** for better user experience
4. **Process data** before setting state
5. **Log queries** for debugging
6. **Clean up listeners** to prevent memory leaks
