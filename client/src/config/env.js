const env = process.env.NODE_ENV || 'development';

export const config = {
  development: {
    useEmulators: true,
    apiUrl: 'http://localhost:5001',
    authEmulatorHost: 'http://localhost:9099',
    firestoreEmulatorHost: 'localhost:8080',
    functionsEmulatorHost: 'localhost:5001'
  },
  production: {
    useEmulators: false,
    apiUrl: 'https://us-central1-oskconnectdb.cloudfunctions.net'
  }
};

export const currentConfig = config[env];
