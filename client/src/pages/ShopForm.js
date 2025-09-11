import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Map Click Handler Component
const MapClickHandler = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });

  return selectedLocation ? (
    <Marker position={selectedLocation} />
  ) : null;
};

const ShopForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState([13.7563, 100.5018]); // Bangkok default
  const [userLocation, setUserLocation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    getCurrentLocation();
    if (id) {
      setIsEditing(true);
      fetchShopData();
    }
  }, [id]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          if (!isEditing) {
            setSelectedLocation([latitude, longitude]);
            setValue('latitude', latitude);
            setValue('longitude', longitude);
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
      
      setValue('shopName', shop.shopName);
      setValue('description', shop.description);
      setValue('latitude', shop.location.coordinates[1]);
      setValue('longitude', shop.location.coordinates[0]);
      setValue('address', shop.address || '');
      setValue('phone', shop.phone || '');
      setValue('email', shop.email || '');
      setValue('website', shop.website || '');
      setValue('category', shop.category || '');
      
      setSelectedLocation([shop.location.coordinates[1], shop.location.coordinates[0]]);
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านค้า');
      navigate('/my-shops');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setValue('latitude', location[0]);
    setValue('longitude', location[1]);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const shopData = {
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude)
      };

      if (isEditing) {
        await axios.put(`/api/shops/${id}`, shopData);
        toast.success('อัปเดตร้านค้าสำเร็จ');
      } else {
        await axios.post('/api/shops', shopData);
        toast.success('เพิ่มร้านค้าสำเร็จ');
      }
      
      navigate('/my-shops');
    } catch (error) {
      console.error('Error saving shop:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      toast.error(message);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อร้านค้า *
              </label>
              <input
                id="shopName"
                type="text"
                {...register('shopName', {
                  required: 'กรุณากรอกชื่อร้านค้า'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ชื่อร้านค้า"
              />
              {errors.shopName && (
                <p className="mt-1 text-sm text-red-600">{errors.shopName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด *
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', {
                  required: 'กรุณากรอกรายละเอียด'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="รายละเอียดร้านค้า"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทร้านค้า
              </label>
              <input
                id="category"
                type="text"
                {...register('category')}
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
                type="text"
                {...register('address')}
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
                  type="tel"
                  {...register('phone')}
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
                  type="email"
                  {...register('email')}
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
                type="url"
                {...register('website')}
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
                  type="number"
                  step="any"
                  {...register('latitude', {
                    required: 'กรุณาเลือกตำแหน่งบนแผนที่',
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="13.7563"
                />
                {errors.latitude && (
                  <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                  ลองจิจูด *
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude', {
                    required: 'กรุณาเลือกตำแหน่งบนแผนที่',
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="100.5018"
                />
                {errors.longitude && (
                  <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกตำแหน่งร้านค้า *
            </label>
            <div className="h-96 border border-gray-300 rounded-md overflow-hidden">
              <MapContainer
                center={selectedLocation}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
              </MapContainer>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              คลิกบนแผนที่เพื่อเลือกตำแหน่งร้านค้า
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
