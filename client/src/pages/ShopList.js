import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, List, Map, Search, Plus } from 'lucide-react';
import { testShops } from '../utils/testData';
import { addTestDataToFirestore } from '../utils/addTestData';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import GoogleMapsView from '../components/GoogleMapsView';

// ---- helper: ทำให้ได้ Array เสมอ ----
function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.docs)) {
    return v.docs.map(d => (typeof d.data === 'function' ? d.data() : d));
  }
  if (typeof v === 'object') return Object.values(v);
  return [];
}

const shopKey = (s, i) =>
  s?._id ||
  s?.id ||
  (s?.shopName ? `${s.shopName}-${s?.location?.coordinates?.join(',') || ''}` : `idx-${i}`);

const ShopList = () => {
  const { isAuthenticated, user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingTestData, setAddingTestData] = useState(false);
  
  // Ensure shops is always an array
  const safeShops = Array.isArray(shops) ? shops : [];

  useEffect(() => {
    // Fetch real data from API
    getCurrentLocation(); // ให้ตัวนี้จัดการเรียก fetchShops เอง
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          fetchShops(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchShops();
        }
      );
    } else {
      fetchShops();
    }
  };

  const fetchShops = async (latitude, longitude) => {
    try {
      console.log('Fetching shops via REST');
  
      // รวมพารามิเตอร์สำหรับ “ร้านใกล้ฉัน” ถ้ามีพิกัด
      const qs = new URLSearchParams({
        status: 'approved',
        ...(Number.isFinite(latitude) && Number.isFinite(longitude)
          ? { lat: String(latitude), lng: String(longitude) }
          : {}),
      }).toString();
  
      // ใช้ Firebase Functions URL
      const tryFetch = async (path) => {
        const idToken = await auth.currentUser?.getIdToken?.().catch(() => null);
        const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};
      
        const res = await fetch(`${path}?${qs}`, { method: 'GET', headers });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      };

      let data;
      try {
        data = await tryFetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/shops');
      } catch (e1) {
        console.warn('GET /api/shops failed, fallback to /api/stores', e1);
        data = await tryFetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/stores');
      }
  
      // รองรับทั้งรูปแบบ array ตรง ๆ หรือ { shops: [...] } / { items: [...] }
      const list = Array.isArray(data)
        ? data
        : data?.shops || data?.items || [];
  
      const safe = Array.isArray(list) ? list : [];
      setShops(safe);
  

    } catch (err) {
      console.error('Error fetching shops:', err);
      // dev: ใช้ test data เป็น fallback
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using test data as fallback');
        setShops(testShops);
      } else {
        setShops([]);
      }
      // Don't show alert for empty results, just log the error
      console.log('Failed to load shops from API');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestData = async () => {
    setAddingTestData(true);
    try {
      const result = await addTestDataToFirestore();
      if (result.success) {
        alert('เพิ่มข้อมูลทดสอบสำเร็จ!');
        // Refresh the data instead of reloading the page
        await fetchShops();
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setAddingTestData(false);
    }
  };

  // Debug: Check shops type (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Shops type:', typeof shops);
    console.log('Shops is array:', Array.isArray(shops));
    console.log('Safe shops length:', safeShops.length);
  }
  
  const term = (searchTerm || '').toLowerCase().trim();

  const filteredShops = toArray(safeShops).filter((shop) => {
    const name = String(shop?.shopName || '').toLowerCase();
    const desc = String(shop?.description || '').toLowerCase();
    const cat  = String(shop?.category || '').toLowerCase();
  
    if (!term) return true; // ไม่มีคำค้นก็ผ่าน
    return name.includes(term) || desc.includes(term) || cat.includes(term);
  });
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'pending':
        return 'รออนุมัติ';
      case 'rejected':
        return 'ไม่อนุมัติ';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">ร้านค้าในเครือข่าย</h1>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleAddTestData}
                disabled={addingTestData}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{addingTestData ? 'กำลังเพิ่ม...' : 'เพิ่มข้อมูลทดสอบ'}</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลร้านค้า...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">ร้านค้าในเครือข่าย</h1>
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/member/shop/add"
                className="inline-flex items-center px-4 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มร้านค้า
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                เข้าสู่ระบบเพื่อเพิ่มร้านค้า
              </Link>
            )}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleAddTestData}
                disabled={addingTestData}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{addingTestData ? 'กำลังเพิ่ม...' : 'เพิ่มข้อมูลทดสอบ'}</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาร้านค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
              <span>รายการ</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'map'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>แผนที่</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredShops.map((shop, i) => (
            <div key={shopKey(shop, i)} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Link 
                    to={`/shops/${shop.id || shopKey(shop, i)}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {shop.shopName}
                  </Link>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shop.status)}`}>
                    {getStatusText(shop.status)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{shop.description}</p>
                
                {shop.category && (
                  <div className="mb-4">
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {shop.category}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {Array.isArray(shop?.location?.coordinates) &&
                    shop.location.coordinates.length >= 2 &&
                    Number.isFinite(Number(shop.location.coordinates[1])) &&
                    Number.isFinite(Number(shop.location.coordinates[0])) ?
                    `${Number(shop.location.coordinates[1]).toFixed(6)}, ${Number(shop.location.coordinates[0]).toFixed(6)}` :
                      '—'}
                  </span>
                </div>
                
                {shop.owner && (
                  <div className="text-sm text-gray-500">
                    <span>เจ้าของ: {shop.owner.firstName} {shop.owner.lastName}</span>
                  </div>
                )}
                
                {shop.phone && (
                  <div className="text-sm text-gray-500 mt-1">
                    <span>โทร: {shop.phone}</span>
                  </div>
                )}
                
                {shop.email && (
                  <div className="text-sm text-gray-500 mt-1">
                    <span>อีเมล: {shop.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
       ) : (
         <div className="bg-white rounded-lg shadow-md overflow-hidden">
           <div className="p-6">
             <GoogleMapsView 
               shops={filteredShops} 
               center={{ lat: 13.7563, lng: 100.5018 }} // Bangkok center
               zoom={10}
               className="h-96 md:h-[600px]"
               onShopClick={(shop) => {
                 console.log('Shop clicked:', shop);
                 // Navigate to shop detail page
                 window.location.href = `/shops/${shop.id || shopKey(shop, 0)}`;
               }}
             />
           </div>
         </div>
       )}

      {filteredShops.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบร้านค้า</h3>
          <p className="text-gray-500">
            {searchTerm ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีร้านค้าในระบบ'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopList;