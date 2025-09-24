import React, { useState, useEffect } from 'react';
import { Users, Store, Clock, CheckCircle, Eye, Shield, MapPin } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import GoogleMapsView from '../components/GoogleMapsView';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingShops, setPendingShops] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    setupRealTimeListeners();
    
    // Cleanup listeners on unmount
    return () => {
      // Firestore listeners will be automatically cleaned up
    };
  }, []);

  const setupRealTimeListeners = () => {
    try {
      setLoading(true);
      console.log('Setting up real-time listeners...');
      
      // Listen to shops collection changes
      const shopsUnsubscribe = onSnapshot(collection(db, 'stores'), (shopsSnapshot) => {
        const allShops = [];
        console.log('AdminDashboard - Real-time update:', {
          totalShops: shopsSnapshot.size
        });
        shopsSnapshot.forEach((doc) => {
          allShops.push({ id: doc.id, ...doc.data() });
        });
        
        // Filter pending shops
        const pendingShops = allShops.filter(shop => shop.status === 'pending');
        
        console.log('AdminDashboard - Shops updated:', {
          totalShops: allShops.length,
          pendingShops: pendingShops.length
        });
        
        setPendingShops(pendingShops);
        setAllShops(allShops);
        
        // Calculate stats
        const statsData = {
          totalShops: allShops.length,
          pendingShops: pendingShops.length,
          approvedShops: allShops.filter(shop => shop.status === 'approved').length,
          totalUsers: allUsers.length
        };
        setStats(statsData);
        
      });
      
      // Listen to users collection changes
      const usersUnsubscribe = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
        const users = [];
        usersSnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
        
        setAllUsers(users);
        
        // Update stats with new user count
        setStats(prevStats => ({
          ...prevStats,
          totalUsers: users.length
        }));
        
      });
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
      setLoading(false);
    }
  };

  const handleApproveShop = async (shopId) => {
    try {
      console.log('Approving shop:', shopId);
      
      // Update shop status in Firestore
      const shopRef = doc(db, 'stores', shopId);
      await updateDoc(shopRef, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: user?.uid
      });
      
      // Data will be updated automatically by real-time listener
      
      alert('อนุมัติร้านค้าสำเร็จ');
    } catch (error) {
      console.error('Error approving shop:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleRejectShop = async (shopId) => {
    try {
      console.log('Rejecting shop:', shopId);
      
      // Update shop status in Firestore
      const shopRef = doc(db, 'stores', shopId);
      await updateDoc(shopRef, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: user?.uid
      });
      
      // Data will be updated automatically by real-time listener
      
      alert('ปฏิเสธร้านค้าสำเร็จ');
    } catch (error) {
      console.error('Error rejecting shop:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      if (!window.confirm('คุณต้องการอนุมัติสมาชิกนี้ใช่หรือไม่?')) return;
      
      // Update user status in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'approved',
        canAddShops: true, // อนุญาตให้เพิ่มร้านค้าได้
        approvedAt: new Date(),
        approvedBy: user?.email || '',
        updatedAt: new Date()
      });
      
      alert('อนุมัติสมาชิกสำเร็จ');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติสมาชิก');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      if (!window.confirm('คุณต้องการไม่อนุมัติสมาชิกนี้ใช่หรือไม่?')) return;
      
      // Update user status in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'rejected',
        canAddShops: false,
        rejectedAt: new Date(),
        rejectedBy: user?.email || '',
        updatedAt: new Date()
      });
      
      alert('ไม่อนุมัติสมาชิกสำเร็จ');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('เกิดข้อผิดพลาดในการไม่อนุมัติสมาชิก');
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'member' ? 'admin' : 'member';
      const confirmMessage = newRole === 'admin' 
        ? 'คุณต้องการเลื่อนผู้ใช้นี้เป็น Admin หรือไม่?'
        : 'คุณต้องการลดผู้ใช้นี้เป็น Member หรือไม่?';
      
      if (!window.confirm(confirmMessage)) return;
      
      // Update user role in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });
      
      // Data will be updated automatically by real-time listener
      
      alert(`เปลี่ยนบทบาทผู้ใช้เป็น ${newRole === 'admin' ? 'Admin' : 'Member'} สำเร็จ`);
    } catch (error) {
      console.error('Error toggling user role:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนบทบาท');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      if (!window.confirm('คุณต้องการลบผู้ใช้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;
      
      // Delete user from Firestore
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      // Also delete shops owned by this user
      const shopsQuery = query(collection(db, 'stores'), where('ownerId', '==', userId));
      const shopsSnapshot = await getDocs(shopsQuery);
      
      const deletePromises = [];
      shopsSnapshot.forEach((shopDoc) => {
        deletePromises.push(deleteDoc(shopDoc.ref));
      });
      
      await Promise.all(deletePromises);
      
      // Data will be updated automatically by real-time listener
      
      alert('ลบผู้ใช้สำเร็จ');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString('th-TH');
      }
      
      // Handle Firestore Timestamp object with seconds
      if (date && typeof date === 'object' && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString('th-TH');
      }
      
      // Handle regular Date object or string
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return '-';
      }
      return d.toLocaleDateString('th-TH');
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8">
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
            { id: 'map', name: 'แผนที่', icon: MapPin },
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  ร้านค้าที่รออนุมัติล่าสุด
                </h3>
                <button
                  onClick={() => setActiveTab('pending')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  ดูทั้งหมด ({pendingShops.length})
                </button>
              </div>
              {pendingShops.length === 0 ? (
                <p className="text-gray-500">ไม่มีร้านค้าที่รออนุมัติ</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pendingShops.slice(0, 8).map((shop, index) => (
                    <div
                      key={shop.id || `pending-shop-${index}`}
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

          {/* Recent Shops */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  ร้านค้าล่าสุด
                </h3>
                <button
                  onClick={() => setActiveTab('shops')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  ดูทั้งหมด ({allShops.length})
                </button>
              </div>
              {allShops.length === 0 ? (
                <p className="text-gray-500">ไม่มีร้านค้า</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allShops.slice(0, 12).map((shop, index) => (
                    <div
                      key={shop.id || `shop-${index}`}
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
                      <div className="flex items-center justify-between">
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
                        {shop.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveShop(shop.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-700"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleRejectShop(shop.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-red-700"
                            >
                              ไม่อนุมัติ
                            </button>
                          </div>
                        )}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                ร้านค้าที่รออนุมัติ
              </h3>
              <span className="text-sm text-gray-500">
                ทั้งหมด {pendingShops.length} ร้าน
              </span>
            </div>
            {pendingShops.length === 0 ? (
              <p className="text-gray-500">ไม่มีร้านค้าที่รออนุมัติ</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingShops.map((shop, index) => (
                  <div
                    key={shop.id || `pending-shop-${index}`}
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
                    {allShops.map((shop, index) => (
                      <tr key={shop.id || `all-shop-${index}`}>
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

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <GoogleMapsView 
              shops={allShops} 
              center={{ lat: 13.7563, lng: 100.5018 }} // Bangkok center
              zoom={10}
              className="h-96"
              onShopClick={(shop) => {
                console.log('Shop clicked:', shop);
                // You can add more functionality here, like opening a modal
              }}
            />
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              จัดการผู้ใช้
            </h3>
            {allUsers.length === 0 ? (
              <p className="text-gray-500">ไม่มีผู้ใช้</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        อีเมล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        บทบาท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((user, index) => (
                      <tr key={user.id || `user-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : user.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status === 'pending' 
                              ? '⏳ รอการอนุมัติ'
                              : user.status === 'approved'
                              ? '✓ อนุมัติแล้ว'
                              : user.status === 'rejected'
                              ? '✕ ไม่อนุมัติ'
                              : user.status || 'ไม่ระบุ'}
                          </span>
                          {user.status === 'approved' && user.canAddShops && (
                            <span className="ml-2 text-xs text-green-600">
                              (สามารถเพิ่มร้านค้าได้)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                                title="อนุมัติสมาชิก"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleRejectUser(user.id)}
                                className="text-red-600 hover:text-red-900 mr-3"
                                title="ไม่อนุมัติสมาชิก"
                              >
                                ไม่อนุมัติ
                              </button>
                            </>
                          ) : (
                            <>
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleToggleUserRole(user.id, user.role)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  {user.role === 'member' ? 'เลื่อนเป็น Admin' : 'ลดเป็น Member'}
                                </button>
                              )}
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  ลบ
                                </button>
                              )}
                            </>
                          )}
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
    </div>
  );
};

export default AdminDashboard;