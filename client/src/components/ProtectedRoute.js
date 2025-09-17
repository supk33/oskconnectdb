import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // แก้ไข path

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('Access denied - User role:', user?.role, 'Required role:', requiredRole);
    console.log('User data:', user);
    return (
      <div className="unauthorized-container">
        <div className="unauthorized">
          <h2>ไม่มีสิทธิ์เข้าถึง</h2>
          <p>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
          <p>User role: {user?.role || 'undefined'}</p>
          <p>Required role: {requiredRole}</p>
          <button onClick={() => window.history.back()}>กลับ</button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;