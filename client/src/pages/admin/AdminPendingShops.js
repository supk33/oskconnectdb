import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Check,
  X,
  Eye,
  Clock
} from 'lucide-react';
import { auth } from '../../config/firebase';

const fmtDate = (v) => {
  if (!v) return '-';
  if (typeof v.toDate === 'function') return v.toDate().toLocaleString('th-TH'); // Firestore Timestamp
  if (typeof v === 'object' && v.seconds) return new Date(v.seconds * 1000).toLocaleString('th-TH');
  if (typeof v === 'number') return new Date(v).toLocaleString('th-TH');
  if (typeof v === 'string') return new Date(v).toLocaleString('th-TH');
  return '-';
};

const AdminPendingShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const fetchPendingShops = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/pending-shops', {
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      } else {
        console.error('Failed to fetch pending shops:', response.status);
        alert('ไม่สามารถโหลดข้อมูลร้านค้าที่รอการอนุมัติได้');
      }
    } catch (error) {
      console.error('Error fetching pending shops:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const updateShopStatus = async (shopId, status) => {
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/shops/${shopId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        alert(`ร้านค้า${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}สำเร็จ`);
        fetchPendingShops();
      } else {
        const errorText = await response.text();
        alert('ไม่สามารถอัปเดตสถานะร้านค้าได้: ' + errorText);
      }
    } catch (error) {
      console.error('Error updating shop status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะร้านค้า');
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">ร้านค้าที่รออนุมัติ</h1>
        <p className="text-gray-600 mt-2">
          ร้านค้าที่รอการอนุมัติจากผู้ดูแลระบบ
        </p>
      </div>

      {/* Pending Shops */}
      {shops.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ไม่มีร้านค้าที่รออนุมัติ
          </h3>
          <p className="text-gray-600">
            ร้านค้าทั้งหมดได้รับการอนุมัติแล้ว
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Shop Image */}
              <div className="h-48 bg-gray-200 relative">
                {shop.images && shop.images.length > 0 ? (
                  <img
                    src={shop.images[0].path}
                    alt={shop.shopName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    รออนุมัติ
                  </span>
                </div>
              </div>

              {/* Shop Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {shop.shopName}
                </h3>
                
                {shop.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {shop.description}
                  </p>
                )}

                {/* Owner Info */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500">เจ้าของ:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {shop.owner?.firstName} {shop.owner?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {shop.owner?.email}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {shop.phone && (
                    <p className="text-sm text-gray-600">
                      📞 {shop.phone}
                    </p>
                  )}
                  {shop.address && (
                    <p className="text-sm text-gray-600">
                      📍 {shop.address}
                    </p>
                  )}
                </div>

                {/* Created Date */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    สร้างเมื่อ: {fmtDate(shop.createdAt)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(`/shops/${shop.id}`, '_blank')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    ดูรายละเอียด
                  </button>
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => updateShopStatus(shop.id, 'approved')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => updateShopStatus(shop.id, 'rejected')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    ไม่อนุมัติ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPendingShops;
