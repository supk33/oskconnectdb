import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { auth } from '../config/firebase';

const ShopForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // const [selectedLocation, setSelectedLocation] = useState([13.7563, 100.5018]); // Bangkok default
  // const [userLocation, setUserLocation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    latitude: 13.7563,
    longitude: 100.5018
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCurrentLocation();
    if (id) {
      setIsEditing(true);
      fetchShopData();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // setUserLocation([latitude, longitude]);
          if (!isEditing) {
            // setSelectedLocation([latitude, longitude]);
            setFormData(prev => ({
              ...prev,
              latitude: latitude,
              longitude: longitude
            }));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/shops/${id}`);
      const shop = response.data;
      
      setFormData({
        shopName: shop.shopName,
        description: shop.description,
        latitude: shop.location.coordinates[1],
        longitude: shop.location.coordinates[0],
        address: shop.address || '',
        phone: shop.phone || '',
        email: shop.email || '',
        website: shop.website || '',
        category: shop.category || ''
      });
      
      // setSelectedLocation([shop.location.coordinates[1], shop.location.coordinates[0]]);
    } catch (error) {
      console.error('Error fetching shop:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านค้า');
      navigate('/my-shops');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.shopName.trim()) newErrors.shopName = 'กรุณากรอกชื่อร้านค้า';
    if (!formData.description.trim()) newErrors.description = 'กรุณากรอกรายละเอียด';
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'กรุณาเลือกตำแหน่งบนแผนที่';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const idToken = await auth.currentUser?.getIdToken?.();
      
      // Debug: Check if user is authenticated and has token
      console.log('Current user:', auth.currentUser);
      console.log('ID Token:', idToken ? 'Token exists' : 'No token');
      
      if (!auth.currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อนเพิ่มร้านค้า');
        navigate('/login');
        return;
      }
      
      if (!idToken) {
        alert('ไม่สามารถรับ token ได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      
      const shopData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      };

      if (isEditing) {
        await axios.put(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops/${id}`, shopData, { headers });
        alert('อัปเดตร้านค้าสำเร็จ');
      } else {
        await axios.post('http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops', shopData, { headers });
        alert('เพิ่มร้านค้าสำเร็จ');
      }
      
      navigate('/my-shops');
    } catch (error) {
      console.error('Error saving shop:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/my-shops')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับไปยังร้านค้าของฉัน</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่'}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อร้านค้า *
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                value={formData.shopName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ชื่อร้านค้า"
              />
              {errors.shopName && (
                <p className="mt-1 text-sm text-red-600">{errors.shopName}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="รายละเอียดร้านค้า"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทร้านค้า
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="เช่น ร้านอาหาร, ร้านค้า, บริการ"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ที่อยู่ร้านค้า"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทร
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="เบอร์โทร"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="อีเมลร้านค้า"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                เว็บไซต์
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                  ละติจูด *
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="13.7563"
                />
                {errors.latitude && (
                  <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>
                )}
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                  ลองจิจูด *
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="100.5018"
                />
                {errors.longitude && (
                  <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
                )}
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกตำแหน่งร้านค้า *
            </label>
            <div className="h-96 border border-gray-300 rounded-md overflow-hidden p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">แผนที่ร้านค้า</h3>
              <p className="text-gray-600 mb-4">ตำแหน่งปัจจุบัน: {formData.latitude}, {formData.longitude}</p>
              <div className="text-sm text-gray-500">
                <p>แผนที่จะเพิ่มในเวอร์ชันถัดไป</p>
                <p>ขณะนี้สามารถกรอกพิกัดละติจูดและลองจิจูดได้โดยตรง</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              กรุณากรอกพิกัดละติจูดและลองจิจูดในช่องด้านบน
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/my-shops')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEditing ? 'อัปเดต' : 'บันทึก'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopForm;
