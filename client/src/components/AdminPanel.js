import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanel() {
  const [shops, setShops] = useState([]);
  const [pendingShops, setPendingShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage', 'pending', 'add'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  useEffect(() => {
    fetchAllShops();
    fetchPendingShops();
  }, []);

  const fetchAllShops = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/shops');
      const data = await response.json();
      setShops(data.shops || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingShops = async () => {
    try {
      // This would require authentication in real implementation
      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/pending-shops');
      const data = await response.json();
      setPendingShops(data.shops || []);
    } catch (error) {
      console.error('Error fetching pending shops:', error);
    }
  };

  const approveShop = async (shopId) => {
    try {
      await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/shops/${shopId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      
      // Refresh data
      fetchAllShops();
      fetchPendingShops();
    } catch (error) {
      console.error('Error approving shop:', error);
    }
  };

  const rejectShop = async (shopId, reason) => {
    try {
      await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin/shops/${shopId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reason })
      });
      
      // Refresh data
      fetchPendingShops();
    } catch (error) {
      console.error('Error rejecting shop:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>จัดการร้านค้า - OSK Connect</h1>
        <p>ระบบจัดการร้านค้าสำหรับผู้ดูแล</p>
      </div>

      <div className="admin-nav">
        <button 
          className={`nav-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          จัดการร้านค้า ({shops.length})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          รอการอนุมัติ ({pendingShops.length})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          เพิ่มร้านค้าใหม่
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'manage' && (
          <ShopManagement 
            shops={shops} 
            onEdit={setEditingShop}
            onRefresh={fetchAllShops}
          />
        )}
        
        {activeTab === 'pending' && (
          <PendingShops 
            shops={pendingShops}
            onApprove={approveShop}
            onReject={rejectShop}
          />
        )}
        
        {activeTab === 'add' && (
          <AddShopForm onSuccess={fetchAllShops} />
        )}
      </div>

      {editingShop && (
        <EditShopModal 
          shop={editingShop}
          onClose={() => setEditingShop(null)}
          onSuccess={fetchAllShops}
        />
      )}
    </div>
  );
}

function ShopManagement({ shops, onEdit, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredShops = shops.filter(shop => 
    shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="shop-management">
      <div className="section-header">
        <h2>ร้านค้าทั้งหมด</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="ค้นหาร้านค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="shops-table">
        <table>
          <thead>
            <tr>
              <th>ชื่อร้าน</th>
              <th>หมวดหมู่</th>
              <th>เจ้าของ</th>
              <th>สถานะ</th>
              <th>วันที่เพิ่ม</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.map(shop => (
              <tr key={shop.id}>
                <td>
                  <div className="shop-info">
                    <strong>{shop.shopName}</strong>
                    <small>{shop.description?.substring(0, 50)}...</small>
                  </div>
                </td>
                <td>
                  <span className="category-badge">{shop.category}</span>
                </td>
                <td>{shop.owner || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${shop.status}`}>
                    {shop.status === 'approved' ? 'อนุมัติ' : shop.status}
                  </span>
                </td>
                <td>
                  {new Date(shop.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('th-TH')}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => onEdit(shop)}>
                      แก้ไข
                    </button>
                    <button className="btn-delete">
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingShops({ shops, onApprove, onReject }) {
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingShop, setRejectingShop] = useState(null);

  const handleReject = (shop) => {
    setRejectingShop(shop);
  };

  const confirmReject = () => {
    if (rejectingShop) {
      onReject(rejectingShop.id, rejectReason);
      setRejectingShop(null);
      setRejectReason('');
    }
  };

  return (
    <div className="pending-shops">
      <div className="section-header">
        <h2>ร้านค้าที่รอการอนุมัติ</h2>
      </div>

      {shops.length === 0 ? (
        <div className="no-pending">
          ไม่มีร้านค้าที่รอการอนุมัติ
        </div>
      ) : (
        <div className="pending-grid">
          {shops.map(shop => (
            <div key={shop.id} className="pending-card">
              <div className="shop-details">
                <h3>{shop.shopName}</h3>
                <p className="category">{shop.category}</p>
                <p className="description">{shop.description}</p>
                
                {shop.address && (
                  <p className="address">📍 {shop.address}</p>
                )}
                
                {shop.phone && (
                  <p className="phone">📞 {shop.phone}</p>
                )}
                
                <p className="submitted">
                  ส่งเมื่อ: {new Date(shop.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('th-TH')}
                </p>
              </div>
              
              <div className="approval-actions">
                <button 
                  className="btn-approve"
                  onClick={() => onApprove(shop.id)}
                >
                  อนุมัติ
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleReject(shop)}
                >
                  ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingShop && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>ปฏิเสธร้านค้า: {rejectingShop.shopName}</h3>
            <textarea
              placeholder="เหตุผลในการปฏิเสธ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button onClick={() => setRejectingShop(null)}>ยกเลิก</button>
              <button onClick={confirmReject} className="btn-reject">
                ปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddShopForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'approved' // Admin can directly approve
        })
      });

      if (response.ok) {
        setFormData({
          shopName: '',
          description: '',
          category: '',
          address: '',
          phone: '',
          email: '',
          website: ''
        });
        onSuccess();
        alert('เพิ่มร้านค้าสำเร็จ!');
      }
    } catch (error) {
      console.error('Error adding shop:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มร้านค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-shop-form">
      <div className="section-header">
        <h2>เพิ่มร้านค้าใหม่</h2>
      </div>

      <form onSubmit={handleSubmit} className="shop-form">
        <div className="form-group">
          <label>ชื่อร้านค้า *</label>
          <input
            type="text"
            required
            value={formData.shopName}
            onChange={(e) => setFormData({...formData, shopName: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>หมวดหมู่ *</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="">เลือกหมวดหมู่</option>
            <option value="อาหาร">อาหาร</option>
            <option value="เครื่องดื่ม">เครื่องดื่ม</option>
            <option value="แฟชั่น">แฟชั่น</option>
            <option value="ความงาม">ความงาม</option>
            <option value="เทคโนโลยี">เทคโนโลยี</option>
            <option value="บริการ">บริการ</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </select>
        </div>

        <div className="form-group">
          <label>รายละเอียด *</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>ที่อยู่</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>อีเมล</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label>เว็บไซต์</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'กำลังเพิ่ม...' : 'เพิ่มร้านค้า'}
        </button>
      </form>
    </div>
  );
}

function EditShopModal({ shop, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    shopName: shop.shopName || '',
    description: shop.description || '',
    category: shop.category || '',
    address: shop.address || '',
    phone: shop.phone || '',
    email: shop.email || '',
    website: shop.website || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: shop.id
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        alert('อัปเดตร้านค้าสำเร็จ!');
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal large">
        <div className="modal-header">
          <h3>แก้ไขร้านค้า: {shop.shopName}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="shop-form">
          <div className="form-group">
            <label>ชื่อร้านค้า</label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({...formData, shopName: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>หมวดหมู่</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="อาหาร">อาหาร</option>
              <option value="เครื่องดื่ม">เครื่องดื่ม</option>
              <option value="แฟชั่น">แฟชั่น</option>
              <option value="ความงาม">ความงาม</option>
              <option value="เทคโนโลยี">เทคโนโลยี</option>
              <option value="บริการ">บริการ</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          <div className="form-group">
            <label>รายละเอียด</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>ที่อยู่</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>เบอร์โทร</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>อีเมล</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-submit">อัปเดต</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel;