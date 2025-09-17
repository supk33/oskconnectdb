import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Search, Users, Store } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <div className="flex justify-center mb-6">
          <MapPin className="h-20 w-20 text-primary-600" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          ยินดีต้อนรับสู่
          <span className="text-primary-600"> OSK Connect</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          ระบบจัดการร้านค้าในเครือข่าย ที่ช่วยให้คุณค้นหาร้านค้าใกล้เคียง 
          และจัดการข้อมูลร้านค้าของคุณได้อย่างง่ายดาย
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/shops"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Search className="h-5 w-5" />
            <span>ค้นหาร้านค้า</span>
          </Link>
          
          {isAuthenticated ? (
            <Link
              to="/member/shop/add"
              className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>เพิ่มร้านค้า</span>
            </Link>
          ) : (
            <Link
              to="/register"
              className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-50 transition-colors"
            >
              ลงทะเบียนฟรี
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          คุณสมบัติเด่น
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              ค้นหาร้านค้าใกล้เคียง
            </h3>
            <p className="text-gray-600">
              ค้นหาร้านค้าในพื้นที่ใกล้เคียงด้วยระบบ GPS 
              และแสดงผลทั้งแบบรายการและแผนที่
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              จัดการร้านค้าของคุณ
            </h3>
            <p className="text-gray-600">
              เพิ่ม แก้ไข และจัดการข้อมูลร้านค้าของคุณได้อย่างง่ายดาย 
              พร้อมระบบอนุมัติจากผู้ดูแล
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              ระบบผู้ใช้ที่ยืดหยุ่น
            </h3>
            <p className="text-gray-600">
              หนึ่งบัญชีสามารถมีได้หลายร้านค้า 
              พร้อมระบบจัดการสิทธิ์สำหรับผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-primary-600 text-white py-16 px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            เริ่มต้นใช้งานวันนี้
          </h2>
          <p className="text-xl mb-8 opacity-90">
            ลงทะเบียนฟรีและเริ่มต้นจัดการร้านค้าของคุณ
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            ลงทะเบียนฟรี
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
