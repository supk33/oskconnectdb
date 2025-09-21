import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { currentConfig } from './env';

// Firebase configuration สำหรับ oskconnectdb project
const firebaseConfig = {
  apiKey: "AIzaSyAohEITvJcFsRiDFCI_-smNusXh4_UMIoo",
  authDomain: "oskconnectdb.firebaseapp.com",
  projectId: 'oskconnectdb',
  storageBucket: "oskconnectdb.firebasestorage.app",
  messagingSenderId: "654211905233",
  appId: "1:654211905233:web:29f84c5a58f54a541937f0",
  measurementId: "G-RYNCWHSWQ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service  
export const db = getFirestore(app);

// Initialize Firebase Functions and get a reference to the service
export const fns = getFunctions(app);

// Connect to emulators in development mode
if (currentConfig.useEmulators) {
  console.log('Using Firebase emulators for development');
  connectAuthEmulator(auth, currentConfig.authEmulatorHost);
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(fns, 'localhost', 5001);
} else {
  console.log('Using real Firebase services for production');
}

export default app;