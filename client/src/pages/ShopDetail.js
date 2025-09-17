import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleMapsView from '../components/GoogleMapsView';

const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShop();
  }, [id]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      setError(null);
      const idToken = await user?.getIdToken?.(); // Get Firebase ID token if user is logged in
      const headers = {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      };

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/shops/${id}`, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'ไม่พบร้านค้านี้');
      }
      
      const data = await response.json();
      setShop(data);
    } catch (error) {
      console.error('Error fetching shop:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลร้านค้า');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (isAuthenticated && user?.uid === shop?.ownerId) {
      navigate(`/member/shop/edit/${id}`);
    } else {
      alert('คุณไม่มีสิทธิ์แก้ไขร้านค้านี้');
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || user?.uid !== shop?.ownerId) {
      alert('คุณไม่มีสิทธิ์ลบร้านค้านี้');
      return;
    }

    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบร้านค้านี้?')) {
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถลบร้านค้าได้');
      }

      alert('ลบร้านค้าสำเร็จ');
      navigate('/shops');
    } catch (error) {
      console.error('Error deleting shop:', error);
      alert('เกิดข้อผิดพลาดในการลบร้านค้า');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/shops')}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            กลับไปหน้ารายการร้านค้า
          </button>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบร้านค้า</h2>
          <p className="text-gray-600 mb-4">ร้านค้านี้อาจถูกลบหรือไม่ปรากฏในระบบ</p>
          <button
            onClick={() => navigate('/shops')}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            กลับไปหน้ารายการร้านค้า
          </button>
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.uid === shop.ownerId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/shops')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับไปหน้ารายการร้านค้า
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.shopName}</h1>
              <div className="flex items-center text-gray-600 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  shop.status === 'approved' ? 'bg-green-100 text-green-800' :
                  shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {shop.status === 'approved' ? 'อนุมัติแล้ว' :
                   shop.status === 'pending' ? 'รอการอนุมัติ' : 'ถูกปฏิเสธ'}
                </span>
                {shop.oskVersion && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {shop.oskVersion}
                  </span>
                )}
              </div>
            </div>
            
            {isOwner && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  แก้ไข
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  ลบ
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">รายละเอียด</h2>
              <p className="text-gray-700 leading-relaxed">{shop.description}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลติดต่อ</h2>
              <div className="space-y-3">
                {shop.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">{shop.email}</span>
                  </div>
                )}
                {shop.website && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                    <a 
                      href={shop.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {shop.website}
                    </a>
                  </div>
                )}
                {shop.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-gray-700">{shop.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ตำแหน่ง</h2>
              {(shop.latitude && shop.longitude) || shop.location?.coordinates ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    พิกัด: {shop.latitude && shop.longitude ? 
                      `${shop.latitude}, ${shop.longitude}` : 
                      `${shop.location.coordinates[1]}, ${shop.location.coordinates[0]}`
                    }
                  </p>
                  <GoogleMapsView 
                    shops={[{
                      ...shop,
                      latitude: shop.latitude || shop.location?.coordinates[1],
                      longitude: shop.longitude || shop.location?.coordinates[0]
                    }]} 
                    center={{ 
                      lat: parseFloat(shop.latitude || shop.location?.coordinates[1] || 13.7563), 
                      lng: parseFloat(shop.longitude || shop.location?.coordinates[0] || 100.5018) 
                    }}
                    zoom={15}
                    className="h-64"
                  />
                </div>
              ) : (
                <p className="text-gray-500">ไม่มีข้อมูลตำแหน่ง</p>
              )}
            </div>

            {/* Category */}
            {shop.category && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">ประเภทร้านค้า</h2>
                <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {shop.category}
                </span>
              </div>
            )}

            {/* Created Date */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">วันที่สร้าง</h2>
              <p className="text-gray-600">
                {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetail;
