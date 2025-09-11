// client/src/pages/member/MemberShopForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from '../../config/firebase'; // 👈 ใช้เอา Firebase ID token
import {
  Save, X, Plus, Trash2, Upload, Tag, Gift, Menu, Clock, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MemberShopForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState([13.7563, 100.5018]); // BKK default
  const [uploadedImages, setUploadedImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [openingHours, setOpeningHours] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: false }
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) fetchShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ ดึงรายละเอียดร้าน (REST: GET /api/member/shops/:id)
  const fetchShop = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`/api/member/shops/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        }
      });

      if (res.status === 404) {
        toast.error('ไม่พบข้อมูลร้านค้า');
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      const shop = await res.json();

      // Set form values
      setValue('shopName', shop.shopName || '');
      setValue('description', shop.description || '');
      setValue('address', shop.address || '');
      setValue('phone', shop.phone || '');
      setValue('website', shop.website || '');
      setValue('model', shop.category || '');
      setValue('email', shop.email || '');

      // Set location (รองรับได้ทั้ง {lat,lng} และ GeoJSON coordinates)
      if (shop.location) {
        if (Array.isArray(shop.location.coordinates)) {
          const [lng, lat] = shop.location.coordinates;
          setPosition([Number(lat), Number(lng)]);
        } else if (typeof shop.location.lat === 'number' && typeof shop.location.lng === 'number') {
          setPosition([shop.location.lat, shop.location.lng]);
        }
      }

      setUploadedImages(Array.isArray(shop.images) ? shop.images : []);
      setTags(Array.isArray(shop.tags) ? shop.tags : []);
      setPromotions(Array.isArray(shop.promotions) ? shop.promotions : []);
      setMenuItems(Array.isArray(shop.menu) ? shop.menu : []);
      setOpeningHours(shop.openingHours || openingHours);
    } catch (err) {
      console.error('Error fetching shop:', err);
      toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
    }
  };

  // ✅ บันทึก (REST: POST /api/member/shops สำหรับสร้าง, PUT /api/member/shops/:id สำหรับแก้ไข)
  const onSubmit = async (form) => {
    setLoading(true);
    try {
      const payload = {
        shopId: isEditing ? id : undefined,
        shopName: form.shopName,
        description: form.description || '',
        phone: form.phone || '',
        address: form.address || '',
        website: form.website || '',
        category: form.category || form.model || '',
        tags,
        images: uploadedImages.filter(img => img.url || img.path),
        location: { lat: position[0], lng: position[1] },
        email: form.email || '',
        openingHours,
        promotions,
        menu: menuItems
      };

      const idToken = await auth.currentUser?.getIdToken?.();
      const url = isEditing ? `/api/member/shops/${id}` : '/api/member/shops';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success(isEditing ? 'อัปเดตร้านสำเร็จ!' : 'สร้างร้านสำเร็จ!');
      navigate('/member');
    } catch (err) {
      console.error('Error saving shop:', err);
      toast.error(err?.message || 'บันทึกร้านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      filename: file.name
    }));
    setUploadedImages([...uploadedImages, ...newImages]);
  };
  const removeImage = (index) => setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  const addTag = () => {
    const t = prompt('Enter tag name:');
    if (t && !tags.includes(t)) setTags([...tags, t]);
  };
  const removeTag = (t) => setTags(tags.filter(x => x !== t));
  const addPromotion = () => setPromotions([...promotions, { id: Date.now(), title: '', description: '', discount: '', validFrom: '', validTo: '' }]);
  const updatePromotion = (i, f, v) => setPromotions(p => { const a = [...p]; a[i][f] = v; return a; });
  const removePromotion = (i) => setPromotions(promotions.filter((_, idx) => idx !== i));
  const addMenuItem = () => setMenuItems([...menuItems, { id: Date.now(), name: '', description: '', price: '', category: '' }]);
  const updateMenuItem = (i, f, v) => setMenuItems(m => { const a = [...m]; a[i][f] = v; return a; });
  const removeMenuItem = (i) => setMenuItems(menuItems.filter((_, idx) => idx !== i));
  const updateOpeningHours = (day, field, value) => setOpeningHours({ ...openingHours, [day]: { ...openingHours[day], [field]: value } });

  const MapEvents = () => {
    useMapEvents({ click: (e) => setPosition([e.latlng.lat, e.latlng.lng]) });
    return null;
  };

  const days = [
    { key: 'monday', label: 'จันทร์' }, { key: 'tuesday', label: 'อังคาร' }, { key: 'wednesday', label: 'พุธ' },
    { key: 'thursday', label: 'พฤหัสบดี' }, { key: 'friday', label: 'ศุกร์' }, { key: 'saturday', label: 'เสาร์' }, { key: 'sunday', label: 'อาทิตย์' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่'}</h1>
        <p className="text-gray-600 mt-2">กรอกข้อมูลร้านค้าและเพิ่มรูปภาพ, แท็ก, โปรโมชั่น และเมนู</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อร้านค้า *</label>
              <input type="text" {...register('shopName', { required: 'ชื่อร้านค้าจำเป็น' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
              {errors.shopName && <p className="text-red-500 text-sm mt-1">{errors.shopName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รุ่น</label>
              <input type="text" {...register('model')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
              <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร</label>
              <input type="tel" {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เว็บไซต์</label>
              <input type="url" {...register('website')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
              <input type="text" {...register('address')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ตำแหน่งร้านค้า</h2>
          <p className="text-gray-600 mb-4">คลิกที่แผนที่เพื่อกำหนดตำแหน่งร้านค้า</p>
          <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
              <Marker position={position} />
              <MapEvents />
            </MapContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ละติจูด</label>
              <input type="number" value={position[0]} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ลองจิจูด</label>
              <input type="number" value={position[1]} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">รูปภาพร้านค้า</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">อัปโหลดรูปภาพ</label>
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-transparent" />
          </div>
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img src={image.preview || image.path} alt={`Shop image ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">แท็ก</h2>
            <button type="button" onClick={addTag} className="flex items-center px-3 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90">
              <Plus className="h-4 w-4 mr-2" />เพิ่มแท็ก
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={index} className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                  <Tag className="h-3 w-3 mr-1" />{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-gray-500 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Opening Hours */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">เวลาทำการ</h2>
          <div className="space-y-3">
            {days.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-4">
                <div className="w-20"><span className="text-sm font-medium text-gray-700">{label}</span></div>
                <label className="flex items-center">
                  <input type="checkbox" checked={!openingHours[key].closed} onChange={(e) => updateOpeningHours(key, 'closed', !e.target.checked)} className="mr-2" />
                  <span className="text-sm text-gray-600">เปิด</span>
                </label>
                {!openingHours[key].closed && (
                  <>
                    <input type="time" value={openingHours[key].open} onChange={(e) => updateOpeningHours(key, 'open', e.target.value)} className="px-2 py-1 border border-gray-300 rounded" />
                    <span className="text-gray-500">ถึง</span>
                    <input type="time" value={openingHours[key].close} onChange={(e) => updateOpeningHours(key, 'close', e.target.value)} className="px-2 py-1 border border-gray-300 rounded" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Promotions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">โปรโมชั่น</h2>
            <button type="button" onClick={addPromotion} className="flex items-center px-3 py-2 bg-school-pink text-white rounded-lg hover:bg-school-pink/90">
              <Plus className="h-4 w-4 mr-2" />เพิ่มโปรโมชั่น
            </button>
          </div>
          {promotions.length > 0 && (
            <div className="space-y-4">
              {promotions.map((promotion, index) => (
                <div key={promotion.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">โปรโมชั่น {index + 1}</h3>
                    <button type="button" onClick={() => removePromotion(index)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="ชื่อโปรโมชั่น" value={promotion.title} onChange={(e) => updatePromotion(index, 'title', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="ส่วนลด (เช่น 10%)" value={promotion.discount} onChange={(e) => updatePromotion(index, 'discount', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="date" placeholder="วันที่เริ่ม" value={promotion.validFrom} onChange={(e) => updatePromotion(index, 'validFrom', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="date" placeholder="วันที่สิ้นสุด" value={promotion.validTo} onChange={(e) => updatePromotion(index, 'validTo', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <div className="md:col-span-2">
                      <textarea placeholder="รายละเอียดโปรโมชั่น" value={promotion.description} onChange={(e) => updatePromotion(index, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">เมนู</h2>
            <button type="button" onClick={addMenuItem} className="flex items-center px-3 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90">
              <Plus className="h-4 w-4 mr-2" />เพิ่มเมนู
            </button>
          </div>
          {menuItems.length > 0 && (
            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">เมนู {index + 1}</h3>
                    <button type="button" onClick={() => removeMenuItem(index)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="ชื่อเมนู" value={item.name} onChange={(e) => updateMenuItem(index, 'name', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="หมวดหมู่" value={item.category} onChange={(e) => updateMenuItem(index, 'category', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="number" placeholder="ราคา" value={item.price} onChange={(e) => updateMenuItem(index, 'price', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <div className="md:col-span-2">
                      <textarea placeholder="รายละเอียดเมนู" value={item.description} onChange={(e) => updateMenuItem(index, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/member/shops')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">ยกเลิก</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-school-blue text-white rounded-lg hover:bg-school-blue/90 disabled:opacity-50 flex items-center">
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? 'อัปเดตร้านค้า' : 'สร้างร้านค้า'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberShopForm;
