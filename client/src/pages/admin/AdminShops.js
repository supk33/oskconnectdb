import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Search, 
  Filter,
  Eye,
  Check,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (v) => {
  if (!v) return '-';
  // Firestore Timestamp (มี toDate())
  if (typeof v?.toDate === 'function') return v.toDate().toLocaleString('th-TH');
  // รูปแบบ {seconds, nanoseconds}
  if (typeof v === 'object' && 'seconds' in v) return new Date(v.seconds * 1000).toLocaleString('th-TH');
  // number (ms) หรือ string
  return new Date(v).toLocaleString('th-TH');
};

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchShops();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      // Get Firebase ID token
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken?.();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/shops?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShops(data.shops);
        setTotalPages(data.pagination.pages);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch shops:', response.status, errorText);
        toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const updateShopStatus = async (shopId, status) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/shops/${shopId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        toast.success(`Shop ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        fetchShops();
      } else {
        toast.error('Failed to update shop status');
      }
    } catch (error) {
      console.error('Error updating shop status:', error);
      toast.error('Failed to update shop status');
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
        <h1 className="text-3xl font-bold text-gray-900">จัดการร้านค้า</h1>
        <p className="text-gray-600 mt-2">
          ดูและจัดการร้านค้าทั้งหมดในระบบ
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาร้านค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ร้านค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เจ้าของ
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
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {shop.images && shop.images.length > 0 ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={shop.images[0].path}
                            alt={shop.shopName}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {shop.shopName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shop.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {shop.owner?.firstName} {shop.owner?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shop.owner?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shop.status)}`}>
                      {getStatusText(shop.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fmtDate(shop.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`/shops/${shop.id}`, '_blank')}
                        className="text-school-blue hover:text-school-blue/80"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {shop.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateShopStatus(shop.id, 'approved')}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateShopStatus(shop.id, 'rejected')}
                            className="text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  แสดงหน้า <span className="font-medium">{currentPage}</span> จาก{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShops;
