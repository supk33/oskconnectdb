import React, { useState } from 'react';
import { simpleAuth } from '../utils/simpleAuth';

const SimpleTest = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState('');

  const handleLogin = async () => {
    try {
      const result = await simpleAuth.login(email, password);
      setResult(`Login successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = () => {
    simpleAuth.logout();
    setResult('Logged out');
  };

  const checkAuth = () => {
    const isAuth = simpleAuth.isAuthenticated();
    const user = simpleAuth.getStoredUser();
    setResult(`Is authenticated: ${isAuth}, User: ${JSON.stringify(user, null, 2)}`);
  };

  const clearStorage = () => {
    localStorage.clear();
    setResult('Local storage cleared');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Simple Authentication Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Login Form</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-x-4">
            <button
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
            <button
              onClick={checkAuth}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Check Auth
            </button>
            <button
              onClick={clearStorage}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Clear Storage
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Result</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {result || 'No result yet'}
        </pre>
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

export default SimpleTest;
