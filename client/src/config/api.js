// API Configuration
const API_CONFIG = {
  // Development - Firebase Emulators
  development: {
    baseURL: 'http://127.0.0.1:5001/oskconnectdb/us-central1/api',
    apiURL: 'http://127.0.0.1:5001/oskconnectdb/us-central1/api',
    memberAPI: 'http://127.0.0.1:5001/oskconnectdb/us-central1/api',
    adminAPI: 'http://127.0.0.1:5001/oskconnectdb/us-central1/api/admin'
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
