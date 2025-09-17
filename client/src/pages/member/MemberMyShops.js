// client/src/pages/member/MemberMyShops.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, Tag, Image, Gift, Menu, MapPin, Phone, Globe, Clock
} from 'lucide-react';

import { auth, db } from '../../config/firebase'; // 👈 ใช้เอา Firebase ID token
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// helper: กันค่า createdAt ที่เป็น Firestore Timestamp / string / number
const formatCreatedAt = (v) => {
  if (!v) return '-';
  if (typeof v?.toDate === 'function') return v.toDate().toLocaleDateString('th-TH');
  if (typeof v === 'object' && 'seconds' in v) return new Date(v.seconds * 1000).toLocaleDateString('th-TH');
  if (typeof v === 'number') return new Date(v).toLocaleDateString('th-TH');
  return new Date(v).toLocaleDateString('th-TH');
};

// helper: normalize field ให้ใช้สะดวก
const normalizeShop = (s) => ({
  ...s,
  id: s.id || s.docId || s._id,
});

const MemberMyShops = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.uid) {
      setupRealTimeListener();
    }
    
    // Cleanup listener on unmount
    return () => {
      // Firestore listeners will be automatically cleaned up
    };
  }, [user?.uid]);

  const setupRealTimeListener = () => {
    try {
      setLoading(true);
      console.log('MemberMyShops - Setting up real-time listener for user:', user?.uid);
      
      // Listen to shops collection changes for current user
      const shopsQuery = query(
        collection(db, 'stores'),
        where('ownerId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(shopsQuery, (shopsSnapshot) => {
        const userShops = [];
        shopsSnapshot.forEach((doc) => {
          userShops.push(normalizeShop({ id: doc.id, ...doc.data() }));
        });
        
        console.log('MemberMyShops - Real-time update:', {
          totalShops: userShops.length,
          shops: userShops.map(shop => ({ id: shop.id, name: shop.shopName, status: shop.status }))
        });
        
        setShops(userShops);
        setLoading(false);
      }, (error) => {
        console.error('MemberMyShops - Real-time listener error:', error);
        setLoading(false);
      });
      
    } catch (error) {
      console.error('MemberMyShops - Error setting up real-time listener:', error);
      setLoading(false);
    }
  };

  // 🗑️ ลบร้านค้า (REST DELETE /api/member/shops/:id)
  const deleteShop = async (shopId) => {
    if (!window.confirm('ยืนยันการลบร้านค้านี้?')) return;
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops/${shopId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());

      alert('ลบร้านค้าเรียบร้อย');
      setShops((prev) => prev.filter((s) => s.id !== shopId));
    } catch (error) {
      console.error('Error deleting shop:', error);
      alert('ลบร้านค้าไม่สำเร็จ');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending':  return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default:         return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'อนุมัติแล้ว';
      case 'pending':  return 'รออนุมัติ';
      case 'rejected': return 'ไม่อนุมัติ';
      default:         return status;
    }
  };

  const filteredShops = shops.filter((shop) => (filter === 'all' ? true : shop.status === filter));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ร้านค้าของฉัน</h1>
            <p className="text-gray-600 mt-2">จัดการร้านค้าทั้งหมดของคุณ</p>
          </div>
          <Link
            to="/member/shop/add"
            className="flex items-center px-4 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มร้านค้าใหม่
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-school-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            ทั้งหมด ({shops.length})
          </button>
          <button onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            อนุมัติแล้ว ({shops.filter(s => s.status === 'approved').length})
          </button>
          <button onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            รออนุมัติ ({shops.filter(s => s.status === 'pending').length})
          </button>
          <button onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            ไม่อนุมัติ ({shops.filter(s => s.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Shops Grid */}
      {filteredShops.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'ยังไม่มีร้านค้า' : `ไม่มีร้านค้าที่${filter === 'approved' ? 'อนุมัติแล้ว' : filter === 'pending' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' ? 'เริ่มต้นด้วยการเพิ่มร้านค้าแรกของคุณ' : 'ร้านค้าที่คุณเพิ่มจะแสดงที่นี่เมื่อได้รับการอัปเดตสถานะ'}
          </p>
          {filter === 'all' && (
            <Link to="/member/shop/add" className="inline-flex items-center px-4 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มร้านค้าแรก
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                {shop.images?.length > 0 ? (
                  <img 
                    src={shop.images[0]} 
                    alt={shop.shopName} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      console.log('Image load error:', shop.images[0]);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log('Image loaded successfully:', shop.images[0])}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><MapPin className="h-12 w-12 text-gray-400" /></div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shop.status)}`}>{getStatusText(shop.status)}</span>
                </div>
                <div className="absolute top-3 left-3 flex space-x-2">
                  <Link to={`/member/shop/edit/${shop.id}`} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-school-blue transition-colors">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button onClick={() => deleteShop(shop.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{shop.shopName}</h3>
                {!!shop.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{shop.description}</p>}

                {shop.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {shop.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        <Tag className="h-3 w-3 mr-1" />{tag}
                      </span>
                    ))}
                    {shop.tags.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">+{shop.tags.length - 3}</span>}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {!!shop.phone && <div className="flex items-center text-sm text-gray-600"><Phone className="h-4 w-4 mr-2" />{shop.phone}</div>}
                  {!!shop.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-school-blue hover:underline">{shop.website}</a>
                    </div>
                  )}
                  {!!shop.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{shop.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {shop.images?.length > 0 && <div className="flex items-center"><Image className="h-4 w-4 mr-1" /><span>{shop.images.length}</span></div>}
                    {shop.promotions?.length > 0 && <div className="flex items-center"><Gift className="h-4 w-4 mr-1" /><span>{shop.promotions.length}</span></div>}
                    {shop.menu?.length > 0 && <div className="flex items-center"><Menu className="h-4 w-4 mr-1" /><span>{shop.menu.length}</span></div>}
                  </div>
                  <div className="flex items-center"><Clock className="h-4 w-4 mr-1" /><span>{formatCreatedAt(shop.createdAt)}</span></div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link to={`/shops/${shop.id}`} className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Eye className="h-4 w-4 mr-2" />ดูร้านค้า
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberMyShops;
