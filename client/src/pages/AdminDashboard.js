import React, { useState, useEffect } from 'react';
import { Users, Store, Clock, CheckCircle, XCircle, Eye, Shield } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../config/firebase';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingShops, setPendingShops] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use Firebase Functions callable functions
      const getPendingShops = httpsCallable(fns, 'getPendingShops');
      const listShops = httpsCallable(fns, 'listShops');
      
      // Get pending shops
      const pendingResult = await getPendingShops();
      setPendingShops(pendingResult.data || []);

      // Get all shops
      const shopsResult = await listShops({ status: 'approved', limit: 50 });
      setAllShops(shopsResult.data || []);

      // Calculate stats
      const statsData = {
        totalShops: (shopsResult.data || []).length,
        pendingShops: (pendingResult.data || []).length,
        approvedShops: (shopsResult.data || []).length,
        totalUsers: 0 // We'll add this later
      };
      setStats(statsData);

      // For now, set empty users array
      setAllUsers([]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveShop = async (shopId) => {
    try {
      const updateShopStatus = httpsCallable(fns, 'updateShopStatus');
      await updateShopStatus({ shopId, status: 'approved' });
      toast.success('อนุมัติร้านค้าสำเร็จ');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving shop:', error);
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleRejectShop = async (shopId) => {
    try {
      const updateShopStatus = httpsCallable(fns, 'updateShopStatus');
      await updateShopStatus({ shopId, status: 'rejected' });
      toast.success('ปฏิเสธร้านค้าสำเร็จ');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting shop:', error);
      toast.error('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('th-TH');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="h-8 w-8 text-blue-600 mr-3" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">จัดการระบบและอนุมัติร้านค้า</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'ภาพรวม', icon: Eye },
            { id: 'pending', name: 'รออนุมัติ', icon: Clock },
            { id: 'shops', name: 'ร้านค้าทั้งหมด', icon: Store },
            { id: 'users', name: 'ผู้ใช้', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Store className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          ร้านค้าทั้งหมด
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalShops}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          รออนุมัติ
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.pendingShops}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          อนุมัติแล้ว
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.approvedShops}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          ผู้ใช้ทั้งหมด
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Pending Shops */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                ร้านค้าที่รออนุมัติล่าสุด
              </h3>
              {pendingShops.length === 0 ? (
                <p className="text-gray-500">ไม่มีร้านค้าที่รออนุมัติ</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pendingShops.slice(0, 6).map((shop) => (
                    <div
                      key={shop.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">
                        {shop.shopName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {shop.description || 'ไม่มีรายละเอียด'}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        สร้างเมื่อ: {formatDate(shop.createdAt)}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveShop(shop.id)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleRejectShop(shop.id)}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                        >
                          ไม่อนุมัติ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Shops Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              ร้านค้าที่รออนุมัติ
            </h3>
            {pendingShops.length === 0 ? (
              <p className="text-gray-500">ไม่มีร้านค้าที่รออนุมัติ</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {shop.shopName}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {shop.description || 'ไม่มีรายละเอียด'}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      สร้างเมื่อ: {formatDate(shop.createdAt)}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveShop(shop.id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => handleRejectShop(shop.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                      >
                        ไม่อนุมัติ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Shops Tab */}
      {activeTab === 'shops' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              ร้านค้าทั้งหมด
            </h3>
            {allShops.length === 0 ? (
              <p className="text-gray-500">ไม่มีร้านค้า</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อร้าน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สร้าง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allShops.map((shop) => (
                      <tr key={shop.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {shop.shopName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            shop.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : shop.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {shop.status === 'approved' ? 'อนุมัติแล้ว' : 
                             shop.status === 'pending' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(shop.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => window.open(`/shops/${shop.id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              ผู้ใช้ทั้งหมด
            </h3>
            <p className="text-gray-500">ฟีเจอร์นี้จะเพิ่มในอนาคต</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;