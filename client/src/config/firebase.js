import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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

// Connect to Firebase emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(fns, '127.0.0.1', 5001);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Firebase emulators already connected or not available:', error.message);
  }
}

export default app;