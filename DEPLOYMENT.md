# 🚀 คู่มือการ Deploy บน Firebase (สถาปัตยกรรม Firebase ล้วน)

คู่มือการติดตั้งและ deploy ระบบจัดการร้านค้าในเครือข่ายบน Firebase โดยใช้ Firebase Services ทั้งหมด

## 🏗️ สถาปัตยกรรมระบบ

### 1. Frontend (SPA)
- **โฮสต์บน**: Firebase Hosting
- **เส้นทาง**: `/`, `/member`, `/admin`
- **เทคโนโลยี**: React.js + Tailwind CSS

### 2. ฐานข้อมูล
- **ใช้**: Cloud Firestore
- **Collections**:
  - `users` - ข้อมูลผู้ใช้
  - `stores` - ข้อมูลร้านค้า
  - `tags` - แท็กสำหรับร้านค้า
  - `promotions` - โปรโมชั่น
  - `menuItems` - เมนูอาหาร
  - `storePhotos` - รูปภาพร้านค้า

### 3. ไฟล์รูปภาพ
- **ใช้**: Firebase Storage
- **โครงสร้าง**: `stores/{storeId}/photos/`

### 4. Backend Logic
- **ใช้**: Cloud Functions (HTTPS)
- **ฟังก์ชันหลัก**: ตรวจสอบ LINE LIFF ID Token และออก Firebase Custom Token
- **Security**: ใช้ Firestore Security Rules

## 📋 ความต้องการเบื้องต้น

1. **Firebase Account** - สร้างบัญชีที่ [Firebase Console](https://console.firebase.google.com/)
2. **Firebase CLI** - ติดตั้ง Firebase CLI
3. **Node.js** - เวอร์ชัน 16 หรือสูงกว่า
4. **LINE Developers Account** - สำหรับ LINE LIFF integration

## 🛠️ ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login Firebase

```bash
firebase login
```

### 3. สร้าง Firebase Project

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Add project"
3. ตั้งชื่อโปรเจค (เช่น `oskconnectdb`)
4. เลือก Google Analytics (ไม่บังคับ)
5. คลิก "Create project"

### 4. เปิดใช้งาน Firebase Services

#### 4.1 Cloud Firestore
1. ไปที่ Firestore Database
2. คลิก "Create database"
3. เลือก "Start in test mode" (สำหรับการทดสอบ)
4. เลือก location ที่ใกล้ที่สุด

#### 4.2 Firebase Storage
1. ไปที่ Storage
2. คลิก "Get started"
3. เลือก "Start in test mode"
4. เลือก location เดียวกับ Firestore

#### 4.3 Authentication
1. ไปที่ Authentication
2. เปิดใช้งาน "Anonymous" sign-in method
3. เปิดใช้งาน "Custom" token (สำหรับ LINE integration)

### 5. Initialize Firebase ในโปรเจค

```bash
npm run firebase:init
```

เลือกตัวเลือกต่อไปนี้:
- **Hosting**: ✅ Yes
- **Functions**: ✅ Yes
- **Firestore**: ✅ Yes
- **Storage**: ✅ Yes
- **Public directory**: `client/build`
- **Single-page app**: ✅ Yes
- **Overwrite index.html**: ❌ No
- **Use ESLint**: ✅ Yes
- **Install dependencies**: ✅ Yes

### 6. อัปเดต Firebase Project ID

แก้ไขไฟล์ `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 7. ตั้งค่า Environment Variables

```bash
# LINE LIFF Configuration
firebase functions:config:set line.liff_id="2007774391-JGD6R5y6"
firebase functions:config:set line.channel_secret="your-line-channel-secret"
firebase functions:config:set line.channel_access_token="your-line-channel-access-token"

# Admin Configuration
firebase functions:config:set admin.email="admin@oskconnect.com"
firebase functions:config:set admin.password="admin123"

# Firebase Admin SDK
firebase functions:config:set firebase.project_id="your-project-id"
```

### 8. อัปเดต API Configuration

แก้ไขไฟล์ `client/src/config/api.js`:

```javascript
const API_CONFIG = {
  development: {
    baseURL: '/api',
    apiURL: '/api',
    memberAPI: '/api/member',
    adminAPI: '/api/admin'
  },
  production: {
    baseURL: '/api',
    apiURL: '/api',
    memberAPI: '/api/member',
    adminAPI: '/api/admin'
  }
};
```

### 9. สร้าง Firestore Security Rules

สร้างไฟล์ `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Stores collection
    match /stores/{storeId} {
      allow read: if true; // ทุกคนอ่านได้
      allow write: if request.auth != null && (
        request.auth.uid == resource.data.ownerId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Tags collection
    match /tags/{tagId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Promotions collection
    match /promotions/{promoId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Menu items collection
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Store photos collection
    match /storePhotos/{photoId} {
      allow read: if true;
      allow write: if request.auth != null && (
        request.auth.uid == resource.data.storeOwnerId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

### 10. สร้าง Storage Security Rules

สร้างไฟล์ `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Store photos
    match /stores/{storeId}/photos/{photoId} {
      allow read: if true;
      allow write: if request.auth != null && (
        request.auth.uid == resource.metadata.storeOwnerId || 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // User avatars
    match /users/{userId}/avatar.jpg {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 11. สร้าง Cloud Functions

สร้างไฟล์ `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// LINE LIFF Token Verification
app.post('/auth/line-verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // ตรวจสอบ LINE LIFF ID Token
    const lineProfile = await verifyLineToken(idToken);
    
    // สร้างหรืออัปเดต user ใน Firestore
    const userRecord = await createOrUpdateUser(lineProfile);
    
    // สร้าง Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    res.json({ customToken, user: userRecord });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API Routes
app.use('/api', require('./routes/api'));
app.use('/api/member', require('./routes/member'));
app.use('/api/admin', require('./routes/admin'));

exports.api = functions.https.onRequest(app);
```

### 12. Deploy ระบบ

#### Deploy ทั้งหมด:
```bash
npm run firebase:deploy
```

#### หรือ Deploy แยกส่วน:
```bash
# Deploy Frontend (Hosting)
npm run firebase:deploy:hosting

# Deploy Backend (Functions)
npm run firebase:deploy:functions

# Deploy Security Rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🌐 การเข้าถึงหลัง Deploy

### URLs:
- **Frontend**: `https://your-project-id.web.app`
- **Member**: `https://your-project-id.web.app/member`
- **Admin**: `https://your-project-id.web.app/admin`
- **API**: `/api`

### Default Admin Account:
- **Email**: `admin@oskconnect.com`
- **Password**: `admin123`

## 🔧 การจัดการหลัง Deploy

### 1. ดู Logs
```bash
firebase functions:log
```

### 2. อัปเดต Environment Variables
```bash
firebase functions:config:set line.liff_id="new-liff-id"
```

### 3. Deploy Functions ใหม่
```bash
firebase deploy --only functions
```

### 4. ดูสถิติการใช้งาน
```bash
firebase functions:log --only api
```

## 💰 ต้นทุน

### Firebase Pricing:
- **Hosting**: ฟรี (10GB storage, 360MB/day transfer)
- **Functions**: ฟรี (125K invocations/month, 40K GB-seconds/month)
- **Firestore**: ฟรี (1GB storage, 50K reads/day, 20K writes/day)
- **Storage**: ฟรี (5GB storage, 1GB/day transfer)

### การประหยัดต้นทุน:
1. ใช้ Firestore offline persistence
2. ตั้งค่า Function timeout ที่เหมาะสม
3. ใช้ caching สำหรับข้อมูลที่ใช้บ่อย
4. ใช้ Firestore security rules เพื่อลดการเรียก API ที่ไม่จำเป็น

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

#### 1. Firestore Permission Error
ตรวจสอบ Security Rules และ Authentication:
```bash
# ดู logs
firebase functions:log

# ตรวจสอบ rules
firebase firestore:rules:get
```

#### 2. CORS Error
ตรวจสอบ CORS configuration ใน `functions/index.js`:
```javascript
app.use(cors({ origin: true }));
```

#### 3. Function Timeout
เพิ่ม timeout ใน `functions/index.js`:
```javascript
exports.api = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest(app);
```

#### 4. Memory Limit
เพิ่ม memory limit:
```javascript
exports.api = functions
  .runWith({
    memory: '2GB'
  })
  .https.onRequest(app);
```

## 🔒 ความปลอดภัย

### 1. Environment Variables
- อย่า commit `.env` files
- ใช้ Firebase Functions config
- เปลี่ยน default admin password

### 2. Firestore Security
- ใช้ Security Rules ที่เข้มงวด
- Validate input data
- จำกัดการเข้าถึงตาม role

### 3. Storage Security
- ใช้ Storage Rules
- จำกัดขนาดไฟล์
- ตรวจสอบ file type

### 4. API Security
- ใช้ Firebase Authentication
- Validate LINE LIFF tokens
- Rate limiting

## 📈 การ Monitor

### 1. Firebase Console
- Functions usage
- Hosting analytics
- Firestore usage
- Storage usage
- Error tracking

### 2. Google Cloud Console
- Cloud Functions metrics
- Network usage
- Cost analysis

## 🔄 การอัปเดต

### 1. อัปเดต Frontend
```bash
npm run build
firebase deploy --only hosting
```

### 2. อัปเดต Backend
```bash
firebase deploy --only functions
```

### 3. อัปเดต Security Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 4. อัปเดตทั้งหมด
```bash
npm run firebase:deploy
```

## 📞 การสนับสนุน

หากมีปัญหาในการ deploy:
1. ตรวจสอบ Firebase Console
2. ดู logs ด้วย `firebase functions:log`
3. ตรวจสอบ Google Cloud Console
4. สร้าง Issue ใน GitHub repository

## 🚀 ข้อดีของสถาปัตยกรรม Firebase ล้วน

1. **ง่ายต่อการ Deploy** - ไม่ต้องจัดการ server infrastructure
2. **Scalable** - Firebase scale อัตโนมัติตามการใช้งาน
3. **Real-time** - Firestore รองรับ real-time updates
4. **Security** - Security Rules ที่ยืดหยุ่นและปลอดภัย
5. **Cost-effective** - เริ่มต้นฟรีและจ่ายตามการใช้งานจริง
6. **Integration** - เชื่อมต่อกับ LINE LIFF ได้ง่าย
7. **Offline Support** - รองรับการทำงานแบบ offline
