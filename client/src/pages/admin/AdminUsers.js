import React, { useState, useEffect } from 'react';
import { User, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  // ดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // เรียงลำดับผู้ใช้โดยให้ผู้ที่รอการอนุมัติขึ้นก่อน
        const sortedUsers = (data.data || []).sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return 0;
        });
        setUsers(sortedUsers);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // อนุมัติผู้ใช้
  const approveUser = async (userId, userData) => {
    try {
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'member',
          status: 'approved',
          canAddShops: true, // อนุญาตให้เพิ่มร้านค้าได้เมื่อได้รับการอนุมัติ
          approvedAt: new Date().toISOString(),
          approvedBy: auth.currentUser.email
        })
      });

      if (response.ok) {
        toast.success(`อนุมัติผู้ใช้ ${userData.firstName} ${userData.lastName} สำเร็จ`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'ไม่สามารถอนุมัติผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  // ไม่อนุมัติผู้ใช้
  const rejectUser = async (userId, userData) => {
    try {
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'visitor',
          status: 'rejected',
          canAddShops: false,
          rejectedAt: new Date().toISOString(),
          rejectedBy: auth.currentUser.email
        })
      });

      if (response.ok) {
        toast.success(`ไม่อนุมัติผู้ใช้ ${userData.firstName} ${userData.lastName}`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'ไม่สามารถดำเนินการได้');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
    }
  };

  // ลบผู้ใช้
  const deleteUser = async (userId, userData) => {
    try {
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        toast.success(`ลบผู้ใช้ ${userData.firstName} ${userData.lastName} สำเร็จ`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'ไม่สามารถลบผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้');
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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              รีเฟรช
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    สถานะและรายละเอียด
                  </th>
                
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={user.status === 'pending' ? 'bg-yellow-50' : user.status === 'rejected' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.role === 'admin' ? (
                          <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 flex items-center">
                            <Shield className="h-4 w-4 mr-1" />
                            ผู้ดูแลระบบ
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
                            สมาชิก
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        {/* สถานะหลัก */}
                        <div className="flex items-center">
                          {user.status === 'pending' ? (
                            <div className="px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200">
                              ⏳ รอการอนุมัติ
                            </div>
                          ) : user.status === 'approved' ? (
                            <div className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-800 border border-green-200">
                              ✓ อนุมัติแล้ว
                            </div>
                          ) : user.status === 'rejected' ? (
                            <div className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 text-red-800 border border-red-200">
                              ✕ ไม่อนุมัติ
                            </div>
                          ) : (
                            <div className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                              {user.status}
                            </div>
                          )}
                        </div>
                        
                        {/* แสดงรายละเอียดเพิ่มเติม */}
                        <div className="text-xs space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {user.status === 'approved' && (
                            <>
                              {user.approvedAt && (
                                <div className="flex items-center text-gray-600">
                                  <span className="w-24">อนุมัติเมื่อ:</span>
                                  <span className="font-medium">{new Date(user.approvedAt).toLocaleDateString('th-TH')}</span>
                                </div>
                              )}
                              {user.approvedBy && (
                                <div className="flex items-center text-gray-600">
                                  <span className="w-24">อนุมัติโดย:</span>
                                  <span className="font-medium">{user.approvedBy}</span>
                                </div>
                              )}
                            </>
                          )}
                          {user.status === 'rejected' && (
                            <>
                              {user.rejectedAt && (
                                <div className="flex items-center text-gray-600">
                                  <span className="w-24">ปฏิเสธเมื่อ:</span>
                                  <span className="font-medium">{new Date(user.rejectedAt).toLocaleDateString('th-TH')}</span>
                                </div>
                              )}
                              {user.rejectedBy && (
                                <div className="flex items-center text-gray-600">
                                  <span className="w-24">ปฏิเสธโดย:</span>
                                  <span className="font-medium">{user.rejectedBy}</span>
                                </div>
                              )}
                            </>
                          )}
                          {/* สถานะร้านค้า */}
                          <div className="flex items-center pt-1">
                            <span className="w-24">ร้านค้า:</span>
                            {user.canAddShops ? (
                              <span className="text-green-600 font-medium flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                สามารถเพิ่มได้
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium flex items-center">
                                <XCircle className="h-4 w-4 mr-1" />
                                ไม่สามารถเพิ่ม
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm(`ต้องการอนุมัติผู้ใช้ "${user.firstName} ${user.lastName}" ใช่หรือไม่?`)) {
                                  approveUser(user.id, user);
                                }
                              }}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                              title="อนุมัติ"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`ต้องการไม่อนุมัติผู้ใช้ "${user.firstName} ${user.lastName}" ใช่หรือไม่?`)) {
                                  rejectUser(user.id, user);
                                }
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                              title="ไม่อนุมัติ"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`ต้องการลบผู้ใช้ "${user.firstName} ${user.lastName}" ใช่หรือไม่?`)) {
                                deleteUser(user.id, user);
                              }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            title="ลบผู้ใช้"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีผู้ใช้</h3>
              <p className="mt-1 text-sm text-gray-500">ยังไม่มีผู้ใช้ในระบบ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
