import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ShopList from './pages/ShopList';
import ShopForm from './pages/ShopForm';
import MyShops from './pages/MyShops';
import AdminDashboard from './pages/AdminDashboard';
import TestAuth from './pages/TestAuth';
import SimpleTest from './pages/SimpleTest';

// Member Pages
import MemberDashboard from './pages/member/MemberDashboard';
import MemberShopForm from './pages/member/MemberShopForm';
import MemberMyShops from './pages/member/MemberMyShops';

// Admin Pages
import AdminShops from './pages/admin/AdminShops';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPendingShops from './pages/admin/AdminPendingShops';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = ['user','admin','member'] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // ✅ อนุญาตบน localhost เมื่อเปิดไฟเขียว (ไว้เทสต์ UI)
  const isLocalhost = ['localhost','127.0.0.1'].includes(window.location.hostname);
  if (isLocalhost && process.env.REACT_APP_BYPASS_AUTH === 'true') {
    return children;
  }

  if (loading) return <LoadingSpinner />;

  // ยังไม่ล็อกอิน → ไป login พร้อมจำ path เดิม
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // กัน role ว่าง/ตัวพิมพ์ไม่ตรง
  const role = String(user?.role || 'member').toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());
  if (!allowed.includes(role)) return <Navigate to="/" replace />;

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <ErrorBoundary>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/shops" element={<ShopList />} />
                  <Route path="/test-auth" element={<TestAuth />} />
                  <Route path="/simple-test" element={<SimpleTest />} />
                  
                  {/* Protected User Routes */}
                  <Route 
                    path="/shop/add" 
                    element={
                      <ProtectedRoute>
                        <ShopForm />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/shop/edit/:id" 
                    element={
                      <ProtectedRoute>
                        <ShopForm />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-shops" 
                    element={
                      <ProtectedRoute>
                        <MyShops />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Member Routes */}
                  <Route 
                    path="/member" 
                    element={
                      <ProtectedRoute>
                        <MemberDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/member/shops" 
                    element={
                      <ProtectedRoute>
                        <MemberMyShops />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/member/shop/add" 
                    element={
                      <ProtectedRoute>
                        <MemberShopForm />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/member/shop/edit/:id" 
                    element={
                      <ProtectedRoute>
                        <MemberShopForm />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/shops" 
                    element={
                      <AdminRoute>
                        <AdminShops />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/pending" 
                    element={
                      <AdminRoute>
                        <AdminPendingShops />
                      </AdminRoute>
                    } 
                  />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;