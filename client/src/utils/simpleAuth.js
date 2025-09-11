// Simple Authentication System for Development
// This bypasses Firebase Emulators and provides basic auth functionality

const SIMPLE_AUTH_KEY = 'simple_auth_user';

export const simpleAuth = {
  // Login with email/password
  login: async (email, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create user data
    const userData = {
      uid: email.replace('@', '_at_'),
      firstName: email.split('@')[0],
      lastName: 'User',
      email: email,
      role: 'member'
    };
    
    // Create simple token
    const token = btoa(JSON.stringify({ uid: userData.uid, email: userData.email }));
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem(SIMPLE_AUTH_KEY, JSON.stringify(userData));
    
    return {
      success: true,
      token: token,
      user: userData
    };
  },

  // Register new user
  register: async (userData) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser = {
      uid: userData.email.replace('@', '_at_'),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: 'member'
    };
    
    // Create simple token
    const token = btoa(JSON.stringify({ uid: newUser.uid, email: newUser.email }));
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem(SIMPLE_AUTH_KEY, JSON.stringify(newUser));
    
    return {
      success: true,
      token: token,
      user: newUser
    };
  },

  // Get current user
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem(SIMPLE_AUTH_KEY);
    
    if (!token || !userData) {
      throw new Error('No user data found');
    }
    
    try {
      const user = JSON.parse(userData);
      return { user, token };
    } catch (error) {
      throw new Error('Invalid user data');
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem(SIMPLE_AUTH_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem(SIMPLE_AUTH_KEY);
    console.log('simpleAuth.isAuthenticated - token:', !!token);
    console.log('simpleAuth.isAuthenticated - userData:', !!userData);
    return !!(token && userData);
  },

  // Get stored user data
  getStoredUser: () => {
    try {
      const userData = localStorage.getItem(SIMPLE_AUTH_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }
};
