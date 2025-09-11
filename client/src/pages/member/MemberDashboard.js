import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../../config/firebase';
import { 
  Plus, 
  Store, 
  MapPin, 
  Tag, 
  Image, 
  Gift, 
  Menu, 
  Edit, 
  Trash2,
  Eye,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../../config/firebase';

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
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken?.(); // เอา Firebase ID token
      const res = await fetch('/api/member/shops', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        }
      });
      if (!res.ok) throw new Error(await res.text());
  
      const data = await res.json();
      const shops = Array.isArray(data) ? data : (data?.shops || []);
      setShops(shops);
  
      setStats({
        total: shops.length,
        approved: shops.filter(s => s.status === 'approved').length,
        pending: shops.filter(s => s.status === 'pending').length,
        rejected: shops.filter(s => s.status === 'rejected').length
      });
    } catch (err) {
      console.error('Error fetching shops:', err);
      toast.error('Failed to fetch shops');
    } finally {
      setLoading(false);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          สวัสดี, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          จัดการร้านค้าของคุณและดูสถิติต่างๆ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-school-blue/10 rounded-lg">
              <Store className="h-6 w-6 text-school-blue" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ร้านค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รออนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ไม่อนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/member/shop/add"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-school-blue hover:bg-school-blue/5 transition-colors"
          >
            <Plus className="h-5 w-5 text-school-blue mr-3" />
            <span className="font-medium text-gray-900">เพิ่มร้านค้าใหม่</span>
          </Link>
          
          <Link
            to="/member/shops"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-school-blue hover:bg-school-blue/5 transition-colors"
          >
            <Store className="h-5 w-5 text-school-blue mr-3" />
            <span className="font-medium text-gray-900">จัดการร้านค้า</span>
          </Link>
          
          <Link
            to="/shops"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-school-blue hover:bg-school-blue/5 transition-colors"
          >
            <MapPin className="h-5 w-5 text-school-blue mr-3" />
            <span className="font-medium text-gray-900">ดูร้านค้าทั้งหมด</span>
          </Link>
          
          <Link
            to="/"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-school-blue hover:bg-school-blue/5 transition-colors"
          >
            <Eye className="h-5 w-5 text-school-blue mr-3" />
            <span className="font-medium text-gray-900">หน้าแรก</span>
          </Link>
        </div>
      </div>

      {/* Recent Shops */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">ร้านค้าล่าสุด</h2>
            <Link
              to="/member/shops"
              className="text-school-blue hover:text-school-blue/80 font-medium"
            >
              ดูทั้งหมด
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {shops.length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีร้านค้า</h3>
              <p className="text-gray-600 mb-4">เริ่มต้นด้วยการเพิ่มร้านค้าแรกของคุณ</p>
              <Link
                to="/member/shop/add"
                className="inline-flex items-center px-4 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มร้านค้า
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {shops.slice(0, 5).map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {shop.images && shop.images.length > 0 ? (
                        <img
                          src={shop.images[0].path}
                          alt={shop.shopName}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Store className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{shop.shopName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shop.status)}`}>
                          {getStatusText(shop.status)}
                        </span>
                        {shop.tags && shop.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {shop.tags.slice(0, 2).join(', ')}
                              {shop.tags.length > 2 && ` +${shop.tags.length - 2}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/member/shop/edit/${shop.id}`}
                      className="p-2 text-gray-400 hover:text-school-blue transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
