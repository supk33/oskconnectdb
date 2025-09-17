// client/src/pages/member/MemberShopForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../../config/firebase';
import {
  Save, ArrowLeft, MapPin
} from 'lucide-react';

const MemberShopForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    oskVersion: '',
    coordinates: '13.7563, 100.5018',
    images: []
  });
  const [errors, setErrors] = useState({});
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      fetchShop();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchShop = async () => {
    try {
      setLoading(true);
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());

      const shop = await res.json();
      setFormData({
        shopName: shop.shopName || '',
        description: shop.description || '',
        category: shop.category || '',
        address: shop.address || '',
        phone: shop.phone || '',
        email: shop.email || '',
        oskVersion: shop.oskVersion || '',
        coordinates: shop.location?.coordinates ? `${shop.location.coordinates[1]}, ${shop.location.coordinates[0]}` : '13.7563, 100.5018',
        images: shop.images || []
      });
    } catch (error) {
      console.error('Error fetching shop:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านค้า');
      navigate('/member/shops');
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Convert files to base64 for storage
      const processFiles = async () => {
        const base64Images = [];
        for (const file of files) {
          const base64 = await fileToBase64(file);
          base64Images.push(base64);
        }
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...base64Images]
        }));
      };
      processFiles();
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.shopName.trim()) newErrors.shopName = 'กรุณากรอกชื่อร้านค้า';
    // Description is now optional
    if (!formData.oskVersion.trim()) newErrors.oskVersion = 'กรุณากรอก OSK รุ่น';
    
    // Validate OSK version (numbers only)
    if (formData.oskVersion.trim()) {
      const oskVersion = formData.oskVersion.trim();
      if (!/^\d+$/.test(oskVersion)) {
        newErrors.oskVersion = 'OSK รุ่นต้องเป็นตัวเลขเท่านั้น (เช่น 100, 109)';
      }
    }
    
    // Validate coordinates format
    if (!formData.coordinates.trim()) {
      newErrors.coordinates = 'กรุณากรอกพิกัด';
    } else {
      const coords = formData.coordinates.split(',').map(coord => coord.trim());
      if (coords.length !== 2) {
        newErrors.coordinates = 'กรุณากรอกพิกัดในรูปแบบ "ละติจูด, ลองจิจูด"';
      } else {
        const [lat, lng] = coords.map(coord => parseFloat(coord));
        if (isNaN(lat) || isNaN(lng)) {
          newErrors.coordinates = 'พิกัดต้องเป็นตัวเลข';
        } else if (lat < -90 || lat > 90) {
          newErrors.coordinates = 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90';
        } else if (lng < -180 || lng > 180) {
          newErrors.coordinates = 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180';
        }
      }
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
      
      // Parse coordinates from "lat, lng" format
      const [latitude, longitude] = formData.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      
      const shopData = {
        ...formData,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      };
      
      // Remove coordinates field from shopData as it's not needed in the API
      delete shopData.coordinates;

      const url = isEditing ? `http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops/${id}` : 'http://127.0.0.1:5001/oskconnectdb/us-central1/api/member/shops';
      const method = isEditing ? 'PUT' : 'POST';

      console.log('Making request to:', url);
      console.log('Shop data:', shopData);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(shopData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        throw new Error(errorText);
      }

      alert(isEditing ? 'อัปเดตร้านค้าสำเร็จ' : 'เพิ่มร้านค้าสำเร็จ');
      navigate('/member/shops');
    } catch (error) {
      console.error('Error saving shop:', error);
      const message = error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
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
          onClick={() => navigate('/member/shops')}
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
                รายละเอียด
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="รายละเอียดร้านค้า (ไม่บังคับ)"
              />
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
              <label htmlFor="oskVersion" className="block text-sm font-medium text-gray-700 mb-2">
                OSK รุ่น *
              </label>
              <input
                id="oskVersion"
                name="oskVersion"
                type="text"
                value={formData.oskVersion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="เช่น 100, 109"
              />
              {errors.oskVersion && (
                <p className="mt-1 text-sm text-red-600">{errors.oskVersion}</p>
              )}
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
              <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700 mb-2">
                พิกัด (ละติจูด, ลองจิจูด) *
              </label>
              <input
                id="coordinates"
                name="coordinates"
                type="text"
                value={formData.coordinates}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="13.782698016226862, 100.51428817149599"
              />
              {errors.coordinates && (
                <p className="mt-1 text-sm text-red-600">{errors.coordinates}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                คัดลอกพิกัดจาก Google Maps โดยคลิกขวาที่ตำแหน่ง → เลือกพิกัด
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพร้านค้า
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                สามารถอัปโหลดได้หลายรูป (JPG, PNG, GIF)
              </p>
              
              {/* Display uploaded images */}
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
              <p className="text-gray-600 mb-4">ตำแหน่งปัจจุบัน: {formData.coordinates}</p>
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
            onClick={() => navigate('/member/shops')}
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

export default MemberShopForm;