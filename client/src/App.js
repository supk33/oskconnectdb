import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ShopList from './pages/ShopList';
import Login from './pages/Login';
import Register from './pages/Register';
import MyShops from './pages/MyShops';
import ShopDetail from './pages/ShopDetail';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberMyShops from './pages/member/MemberMyShops';
import MemberShopForm from './pages/member/MemberShopForm';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';


function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shops" element={<ShopList />} />
            <Route path="/shops/:id" element={<ShopDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-shops" element={
              <ProtectedRoute>
                <MyShops />
              </ProtectedRoute>
            } />
            <Route path="/member" element={
              <ProtectedRoute>
                <MemberDashboard />
              </ProtectedRoute>
            } />
            <Route path="/member/shops" element={
              <ProtectedRoute>
                <MemberMyShops />
              </ProtectedRoute>
            } />
            <Route path="/member/shop/add" element={
              <ProtectedRoute>
                <MemberShopForm />
              </ProtectedRoute>
            } />
            <Route path="/member/shop/edit/:id" element={
              <ProtectedRoute>
                <MemberShopForm />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;