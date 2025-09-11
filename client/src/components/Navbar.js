import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  X, 
  Store, 
  User, 
  LogOut, 
  Settings,
  Shield,
  MapPin
} from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-school-blue to-school-pink rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OSK Connect</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 ml-10">
              <Link
                to="/"
                className="text-gray-700 hover:text-school-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                หน้าแรก
              </Link>
              <Link
                to="/shops"
                className="text-gray-700 hover:text-school-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ร้านค้า
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/member"
                    className="text-gray-700 hover:text-school-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    สมาชิก
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-school-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      จัดการระบบ
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-school-blue transition-colors"
                >
                  <div className="w-8 h-8 bg-school-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <Menu className="h-4 w-4" />
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {user?.role === 'admin' && (
                        <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium bg-school-pink/10 text-school-pink rounded-full">
                          <Shield className="h-3 w-3 mr-1" />
                          ผู้ดูแลระบบ
                        </span>
                      )}
                    </div>
                    
                    <Link
                      to="/member"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      หน้าสมาชิก
                    </Link>
                    
                    <Link
                      to="/member/shops"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Store className="h-4 w-4 mr-3" />
                      ร้านค้าของฉัน
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        จัดการระบบ
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-school-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="bg-school-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-blue/90 transition-colors"
                >
                  ลงทะเบียน
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-school-blue hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
              >
                หน้าแรก
              </Link>
              <Link
                to="/shops"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
              >
                ร้านค้า
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/member"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                  >
                    หน้าสมาชิก
                  </Link>
                  <Link
                    to="/member/shops"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                  >
                    ร้านค้าของฉัน
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                    >
                      จัดการระบบ
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-gray-700 hover:text-school-blue hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 bg-school-blue text-white rounded-md text-base font-medium hover:bg-school-blue/90 transition-colors"
                  >
                    ลงทะเบียน
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
