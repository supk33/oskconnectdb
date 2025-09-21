import React, { useState, useEffect } from 'react';
import { Users, User, Shield, Mail, Calendar, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken?.();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      // Get Firebase ID token
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        toast.success(`เปลี่ยนสิทธิ์ผู้ใช้เป็น${newRole === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}แล้ว`);
        fetchUsers();
      } else {
        toast.error('ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้');
    }
  };

  const updateUserStatus = async (userId, updates) => {
    try {
      // Get Firebase ID token
      const { auth } = await import('../../config/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const statusText = updates.status === 'approved' ? 'อนุมัติแล้ว' : 
                          updates.status === 'rejected' ? 'ปฏิเสธแล้ว' : 'รอการอนุมัติ';
        toast.success(`สถานะผู้ใช้: ${statusText}`);
        fetchUsers();
      } else {
        toast.error('ไม่สามารถอัปเดตสถานะผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะผู้ใช้ได้');
    }
  };

  const deleteUser = async (userId) => {
    try {
      // Get Firebase ID token
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
        toast.success('ลบผู้ใช้เรียบร้อยแล้ว');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'ไม่สามารถลบผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'rejected':
        return 'ไม่อนุมัติ';
      case 'pending':
        return 'รอการอนุมัติ';
      default:
        return status;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'member':
        return 'สมาชิก';
      case 'pending':
        return 'รอการอนุมัติ';
      default:
        return role;
    }
  };

  const fmtDate = (date) => {
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
    <div className="container mx-auto px-4 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          จัดการผู้ใช้
        </h1>
        <p className="text-gray-600 mt-2">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              รายชื่อผู้ใช้ทั้งหมด ({users.length})
            </h3>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Users className="h-4 w-4 mr-2" />
              รีเฟรช
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีผู้ใช้</h3>
              <p className="mt-1 text-sm text-gray-500">ยังไม่มีผู้ใช้ในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filter === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ทั้งหมด ({users.length})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filter === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    รอการอนุมัติ ({users.filter(user => user.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setFilter('approved')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filter === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    อนุมัติแล้ว ({users.filter(user => user.status === 'approved').length})
                  </button>
                </div>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ใช้
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      อีเมล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      บทบาท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รุ่น
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users
                    .filter(user => filter === 'all' || user.status === filter)
                    .map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${
                      user.status === 'pending' ? 'bg-yellow-50' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {user.email || 'ไม่ระบุอีเมล'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              {user.email === 'admin@oskconnect.com' ? 'ผู้ดูแลระบบหลัก' : 'ผู้ดูแลระบบ'}
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              {user.role === 'pending' ? 'รอการอนุมัติ' : user.role === 'member' ? 'สมาชิก' : 'ผู้ใช้ทั่วไป'}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span>{user.generation || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'approved' ? 'bg-green-100 text-green-800' :
                          user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status === 'approved' ? 'อนุมัติแล้ว' :
                           user.status === 'rejected' ? 'ไม่อนุมัติ' :
                           'รอการอนุมัติ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                        {user.email === 'admin@oskconnect.com' ? (
                          <span className="text-sm text-gray-500">-</span>
                        ) : (
                          <div className="flex justify-center space-x-2">
                            {user.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`ยืนยันการอนุมัติสมาชิก "${user.firstName} ${user.lastName}"?`)) {
                                      updateUserStatus(user.id, {
                                        role: 'member',
                                        status: 'approved'
                                      });
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                                >
                                  อนุมัติ
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`ยืนยันการปฏิเสธสมาชิก "${user.firstName} ${user.lastName}"?`)) {
                                      updateUserStatus(user.id, {
                                        role: 'visitor',
                                        status: 'rejected'
                                      });
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                                >
                                  ไม่อนุมัติ
                                </button>
                              </>
                            ) : user.role === 'member' ? (
                              <>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`ต้องการเปลี่ยน "${user.firstName} ${user.lastName}" เป็นผู้ดูแลระบบ?`)) {
                                      updateUserRole(user.id, 'admin');
                                    }
                                  }}
                                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                                >
                                  เปลี่ยนเป็นผู้ดูแลระบบ
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`ต้องการยกเลิกการเป็นสมาชิกของ "${user.firstName} ${user.lastName}"?`)) {
                                      updateUserStatus(user.id, {
                                        role: 'visitor',
                                        status: 'active'
                                      });
                                    }
                                  }}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                  ยกเลิกการเป็นสมาชิก
                                </button>
                              </>
                            ) : user.role === 'admin' ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`ต้องการเปลี่ยน "${user.firstName} ${user.lastName}" กลับเป็นสมาชิก?`)) {
                                    updateUserRole(user.id, 'member');
                                  }
                                }}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                              >
                                เปลี่ยนเป็นสมาชิก
                              </button>
                            ) : null}
                            <button
                              onClick={() => {
                                if (window.confirm(`คุณแน่ใจที่จะลบผู้ใช้ "${user.firstName} ${user.lastName}" หรือไม่?`)) {
                                  deleteUser(user.id);
                                }
                              }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                              title="ลบผู้ใช้"
                            >
                              ลบ
                            </button>
                          </div>
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

      {/* User Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    ผู้ใช้ทั้งหมด
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.length}
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
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    ผู้ดูแลระบบ
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(user => user.role === 'admin').length}
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
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    สมาชิก
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(user => user.role === 'member').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;