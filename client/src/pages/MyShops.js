import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import apiConfig from '../config/api';

const MyShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyShops();
  }, []);

  const fetchMyShops = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiConfig.memberAPI}/shops/my-shops`);
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching my shops:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านค้า: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบร้านค้านี้?')) {
      return;
    }

    try {
      await axios.delete(`${apiConfig.memberAPI}/shops/${shopId}`);
      toast.success('ลบร้านค้าสำเร็จ');
      fetchMyShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast.error('เกิดข้อผิดพลาดในการลบร้านค้า: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">ร้านค้าของฉัน</h1>
          <Link
            to="/add-shop"
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มร้านค้าใหม่</span>
          </Link>
        </div>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีร้านค้า</h3>
          <p className="text-gray-500 mb-6">
            เริ่มต้นด้วยการเพิ่มร้านค้าแรกของคุณ
          </p>
          <Link
            to="/add-shop"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มร้านค้าใหม่</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <div key={shop._id || shop.id || shop.shopName || Math.random().toString(36)}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{shop.shopName}</h3>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(shop.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shop.status)}`}>
                      {getStatusText(shop.status)}
                    </span>
                  </div>
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
                    {shop.location.coordinates[1].toFixed(6)}, {shop.location.coordinates[0].toFixed(6)}
                  </span>
                </div>
                
                {shop.phone && (
                  <div className="text-sm text-gray-500 mb-1">
                    <span>โทร: {shop.phone}</span>
                  </div>
                )}
                
                {shop.email && (
                  <div className="text-sm text-gray-500 mb-4">
                    <span>อีเมล: {shop.email}</span>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mb-4">
                  <div>สร้างเมื่อ: {formatDate(shop.createdAt)}</div>
                  {shop.updatedAt !== shop.createdAt && (
                    <div>อัปเดตล่าสุด: {formatDate(shop.updatedAt)}</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/edit-shop/${shop._id}`}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    <span>แก้ไข</span>
                  </Link>
                  
                  <button
                    onClick={() => handleDeleteShop(shop._id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>ลบ</span>
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

export default MyShops;
