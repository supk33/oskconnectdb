// client/src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// อ่านค่า env ของ CRA (ต้องขึ้นต้นด้วย REACT_APP_)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'oskconnectdb',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'oskconnectdb.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const fns = getFunctions(app, 'us-central1');  // Specify region explicitly
const storage = getStorage(app);

// ใช้ Emulator เฉพาะตอน dev (ตั้งใน .env.local)
const useEmu =
  process.env.NODE_ENV !== 'production' &&
  String(process.env.REACT_APP_USE_EMULATORS).toLowerCase() === 'true';

if (useEmu) {
  // เปลี่ยนพอร์ตได้ด้วย env ถ้าจำเป็น
  const FS_PORT = Number(process.env.REACT_APP_FS_EMU_PORT || 8080);
  const FN_PORT = Number(process.env.REACT_APP_FN_EMU_PORT || 5001);
  const ST_PORT = Number(process.env.REACT_APP_ST_EMU_PORT || 9199);

  try { connectAuthEmulator(auth, 'http://localhost:9099'); } catch {}
  try { connectFirestoreEmulator(db, 'localhost', FS_PORT); } catch {}
  try { 
    connectFunctionsEmulator(fns, 'localhost', FN_PORT);
    console.log('Connected to Functions emulator on port', FN_PORT);
  } catch (err) {
    console.error('Failed to connect to Functions emulator:', err);
  }
  try { connectStorageEmulator(storage, 'localhost', ST_PORT); } catch {}
}

export { app, auth, db, fns, storage };
export default app;
