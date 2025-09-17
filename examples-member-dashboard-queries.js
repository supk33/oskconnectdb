// 📚 Examples: Different Ways to Query Shop Data in Member Dashboard

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ========================================
// EXAMPLE 1: Basic Real-time Query (Current)
// ========================================
const BasicMemberDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setupBasicQuery();
    }
  }, [user?.uid]);

  const setupBasicQuery = () => {
    const shopsQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
      const userShops = [];
      snapshot.forEach((doc) => {
        userShops.push({ id: doc.id, ...doc.data() });
      });
      setShops(userShops);
      setLoading(false);
    });
  };

  return (
    <div>
      <h2>Basic Query - All My Shops</h2>
      {loading ? <p>Loading...</p> : (
        <div>
          <p>Total shops: {shops.length}</p>
          {shops.map(shop => (
            <div key={shop.id}>
              <h3>{shop.shopName} - {shop.status}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================
// EXAMPLE 2: Filtered by Status
// ========================================
const FilteredMemberDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.uid) {
      setupFilteredQuery();
    }
  }, [user?.uid, statusFilter]);

  const setupFilteredQuery = () => {
    let shopsQuery;
    
    if (statusFilter === 'all') {
      shopsQuery = query(
        collection(db, 'stores'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      shopsQuery = query(
        collection(db, 'stores'),
        where('ownerId', '==', user.uid),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
      const userShops = [];
      snapshot.forEach((doc) => {
        userShops.push({ id: doc.id, ...doc.data() });
      });
      setShops(userShops);
      setLoading(false);
    });
  };

  return (
    <div>
      <h2>Filtered Query - By Status</h2>
      
      {/* Status Filter Buttons */}
      <div className="mb-4">
        <button 
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
        >
          All ({shops.length})
        </button>
        <button 
          onClick={() => setStatusFilter('pending')}
          className={statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}
        >
          Pending
        </button>
        <button 
          onClick={() => setStatusFilter('approved')}
          className={statusFilter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'}
        >
          Approved
        </button>
        <button 
          onClick={() => setStatusFilter('rejected')}
          className={statusFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'}
        >
          Rejected
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          <p>Showing {shops.length} shops with status: {statusFilter}</p>
          {shops.map(shop => (
            <div key={shop.id} className="border p-2 mb-2">
              <h3>{shop.shopName}</h3>
              <p>Status: {shop.status}</p>
              <p>Created: {shop.createdAt?.toDate?.()?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================
// EXAMPLE 3: Advanced Query with Multiple Filters
// ========================================
const AdvancedMemberDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    limit: 10
  });

  useEffect(() => {
    if (user?.uid) {
      setupAdvancedQuery();
    }
  }, [user?.uid, filters]);

  const setupAdvancedQuery = () => {
    let shopsQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', user.uid)
    );

    // Add status filter if not 'all'
    if (filters.status !== 'all') {
      shopsQuery = query(shopsQuery, where('status', '==', filters.status));
    }

    // Add category filter if not 'all'
    if (filters.category !== 'all') {
      shopsQuery = query(shopsQuery, where('category', '==', filters.category));
    }

    // Always sort by newest first
    shopsQuery = query(shopsQuery, orderBy('createdAt', 'desc'));

    // Add limit
    if (filters.limit > 0) {
      shopsQuery = query(shopsQuery, limit(filters.limit));
    }
    
    const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
      const userShops = [];
      snapshot.forEach((doc) => {
        userShops.push({ id: doc.id, ...doc.data() });
      });
      setShops(userShops);
      setLoading(false);
    });
  };

  return (
    <div>
      <h2>Advanced Query - Multiple Filters</h2>
      
      {/* Filter Controls */}
      <div className="mb-4 space-x-2">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select 
          value={filters.category} 
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="all">All Categories</option>
          <option value="restaurant">Restaurant</option>
          <option value="shop">Shop</option>
          <option value="service">Service</option>
        </select>

        <select 
          value={filters.limit} 
          onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
        >
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
          <option value="20">Show 20</option>
          <option value="0">Show All</option>
        </select>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          <p>Showing {shops.length} shops</p>
          {shops.map(shop => (
            <div key={shop.id} className="border p-3 mb-3 rounded">
              <h3 className="font-bold">{shop.shopName}</h3>
              <p>Status: <span className={`px-2 py-1 rounded text-xs ${
                shop.status === 'approved' ? 'bg-green-100 text-green-800' :
                shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{shop.status}</span></p>
              <p>Category: {shop.category}</p>
              <p>Created: {shop.createdAt?.toDate?.()?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================
// EXAMPLE 4: One-time Query (No Real-time)
// ========================================
const OneTimeMemberDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchShopsOnce();
    }
  }, [user?.uid]);

  const fetchShopsOnce = async () => {
    try {
      setLoading(true);
      
      const shopsQuery = query(
        collection(db, 'stores'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(shopsQuery);
      const userShops = [];
      
      snapshot.forEach((doc) => {
        userShops.push({ id: doc.id, ...doc.data() });
      });
      
      setShops(userShops);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchShopsOnce();
  };

  return (
    <div>
      <h2>One-time Query - Manual Refresh</h2>
      
      <button 
        onClick={refreshData}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Refresh Data
      </button>

      {loading ? <p>Loading...</p> : (
        <div>
          <p>Total shops: {shops.length}</p>
          {shops.map(shop => (
            <div key={shop.id} className="border p-2 mb-2">
              <h3>{shop.shopName}</h3>
              <p>Status: {shop.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================
// EXAMPLE 5: Single Shop Query
// ========================================
const SingleShopQuery = ({ shopId }) => {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      fetchSingleShop();
    }
  }, [shopId]);

  const fetchSingleShop = async () => {
    try {
      setLoading(true);
      
      const shopDoc = doc(db, 'stores', shopId);
      const shopSnapshot = await getDoc(shopDoc);
      
      if (shopSnapshot.exists()) {
        setShop({ id: shopSnapshot.id, ...shopSnapshot.data() });
      } else {
        setShop(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shop:', error);
      setLoading(false);
    }
  };

  if (loading) return <p>Loading shop...</p>;
  if (!shop) return <p>Shop not found</p>;

  return (
    <div>
      <h2>Single Shop Query</h2>
      <div className="border p-4 rounded">
        <h3 className="text-xl font-bold">{shop.shopName}</h3>
        <p>Status: {shop.status}</p>
        <p>Description: {shop.description}</p>
        <p>Category: {shop.category}</p>
        <p>Created: {shop.createdAt?.toDate?.()?.toLocaleDateString()}</p>
      </div>
    </div>
  );
};

// ========================================
// EXAMPLE 6: Statistics Dashboard
// ========================================
const StatisticsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    byCategory: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setupStatsQuery();
    }
  }, [user?.uid]);

  const setupStatsQuery = () => {
    const shopsQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
      const shops = [];
      snapshot.forEach((doc) => {
        shops.push({ id: doc.id, ...doc.data() });
      });
      
      // Calculate statistics
      const newStats = {
        total: shops.length,
        approved: shops.filter(s => s.status === 'approved').length,
        pending: shops.filter(s => s.status === 'pending').length,
        rejected: shops.filter(s => s.status === 'rejected').length,
        byCategory: {}
      };
      
      // Count by category
      shops.forEach(shop => {
        const category = shop.category || 'uncategorized';
        newStats.byCategory[category] = (newStats.byCategory[category] || 0) + 1;
      });
      
      setStats(newStats);
      setLoading(false);
    });
  };

  if (loading) return <p>Loading statistics...</p>;

  return (
    <div>
      <h2>Statistics Dashboard</h2>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="text-lg font-bold">Total</h3>
          <p className="text-2xl">{stats.total}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="text-lg font-bold">Approved</h3>
          <p className="text-2xl">{stats.approved}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="text-lg font-bold">Pending</h3>
          <p className="text-2xl">{stats.pending}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <h3 className="text-lg font-bold">Rejected</h3>
          <p className="text-2xl">{stats.rejected}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">By Category</h3>
        {Object.entries(stats.byCategory).map(([category, count]) => (
          <div key={category} className="flex justify-between p-2 border-b">
            <span>{category}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export {
  BasicMemberDashboard,
  FilteredMemberDashboard,
  AdvancedMemberDashboard,
  OneTimeMemberDashboard,
  SingleShopQuery,
  StatisticsDashboard
};
