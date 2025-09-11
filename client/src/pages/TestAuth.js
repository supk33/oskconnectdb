import React from 'react';
import { useAuth } from '../context/AuthContext';
import { simpleAuth } from '../utils/simpleAuth';

const TestAuth = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth();

  const handleTestLogin = async () => {
    const result = await login('test@example.com', 'password123');
    console.log('Login result:', result);
  };

  const handleTestLogout = () => {
    logout();
  };

  const checkSimpleAuth = () => {
    console.log('simpleAuth.isAuthenticated():', simpleAuth.isAuthenticated());
    console.log('simpleAuth.getStoredUser():', simpleAuth.getStoredUser());
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Auth State</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="space-x-4">
          <button
            onClick={handleTestLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Login
          </button>
          <button
            onClick={handleTestLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
          <button
            onClick={checkSimpleAuth}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Check Simple Auth
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
        <div className="space-y-2">
          <p><strong>Token:</strong> {localStorage.getItem('token') || 'None'}</p>
          <p><strong>Simple Auth User:</strong> {localStorage.getItem('simple_auth_user') || 'None'}</p>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;
