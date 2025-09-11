// API Configuration
const API_CONFIG = {
  // Development - Firebase Emulators
  development: {
    baseURL: '/api',
    apiURL: '/api',
    memberAPI: '/api',
    adminAPI: '/api/admin'
  },
  // Production - Firebase Functions
  production: {
    baseURL: '/api',
    apiURL: '/api',
    memberAPI: '/api',
    adminAPI: '/api/admin'
  }
};

const env = process.env.NODE_ENV || 'development';
const config = API_CONFIG[env];

export default config;
