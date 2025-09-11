# 🏪 OSK Connect Database System

ระบบจัดการร้านค้าในเครือข่ายที่ใช้ Firebase Services ทั้งหมด

## 🏗️ สถาปัตยกรรมระบบ

### Frontend (SPA)
- **โฮสต์บน**: Firebase Hosting
- **เส้นทาง**: `/`, `/member`, `/admin`
- **เทคโนโลยี**: React.js + Tailwind CSS

### ฐานข้อมูล
- **ใช้**: Cloud Firestore
- **Collections**:
  - `users` - ข้อมูลผู้ใช้
  - `stores` - ข้อมูลร้านค้า
  - `tags` - แท็กสำหรับร้านค้า
  - `promotions` - โปรโมชั่น
  - `menuItems` - เมนูอาหาร
  - `storePhotos` - รูปภาพร้านค้า
  - `storeReviews` - รีวิวร้านค้า
  - `storeCategories` - หมวดหมู่ร้านค้า
  - `userFavorites` - ร้านค้าที่ชื่นชอบ
  - `storeOperatingHours` - เวลาทำการ

### ไฟล์รูปภาพ
- **ใช้**: Firebase Storage
- **โครงสร้าง**: `stores/{storeId}/photos/`, `users/{userId}/avatar.jpg`

### Backend Logic
- **ใช้**: Cloud Functions (HTTPS)
- **ฟังก์ชันหลัก**: ตรวจสอบ LINE LIFF ID Token และออก Firebase Custom Token
- **Security**: ใช้ Firestore Security Rules และ Storage Rules

## 🚀 ข้อดีของสถาปัตยกรรม Firebase ล้วน

1. **ง่ายต่อการ Deploy** - ไม่ต้องจัดการ server infrastructure
2. **Scalable** - Firebase scale อัตโนมัติตามการใช้งาน
3. **Real-time** - Firestore รองรับ real-time updates
4. **Security** - Security Rules ที่ยืดหยุ่นและปลอดภัย
5. **Cost-effective** - เริ่มต้นฟรีและจ่ายตามการใช้งานจริง
6. **Integration** - เชื่อมต่อกับ LINE LIFF ได้ง่าย
7. **Offline Support** - รองรับการทำงานแบบ offline

## 📋 ความต้องการเบื้องต้น

1. **Firebase Account** - สร้างบัญชีที่ [Firebase Console](https://console.firebase.google.com/)
2. **Firebase CLI** - ติดตั้ง Firebase CLI
3. **Node.js** - เวอร์ชัน 18 หรือสูงกว่า
4. **LINE Developers Account** - สำหรับ LINE LIFF integration

## 🛠️ การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd oskconnectdb
```

### 2. ติดตั้ง Dependencies
```bash
# Frontend
cd client
npm install

# Backend (Cloud Functions)
cd ../functions
npm install
```

### 3. ตั้งค่า Firebase
```bash
# Login Firebase
firebase login

# Initialize Firebase
firebase init

# ตั้งค่า Environment Variables
firebase functions:config:set line.liff_id="your-line-liff-id"
firebase functions:config:set line.channel_secret="your-line-channel-secret"
firebase functions:config:set line.channel_access_token="your-line-channel-access-token"
```

### 4. รันระบบในโหมด Development
```bash
# Terminal 1: รัน Firebase Emulators
firebase emulators:start

# Terminal 2: รัน Frontend
cd client
npm start
```

### 5. Deploy ระบบ
```bash
# Build Frontend
cd client
npm run build

# Deploy ทั้งหมด
firebase deploy
```

## 🌐 การเข้าถึง

### Development:
- **Frontend**: `http://localhost:3000`
- **Functions**: `http://localhost:5001/your-project-id/us-central1/api`
- **Firestore**: `http://localhost:8080`
- **Storage**: `http://localhost:9199`

### Production:
- **Frontend**: `https://your-project-id.web.app`
- **API**: `/api`

## 🔒 ความปลอดภัย

### Firestore Security Rules
- ผู้ใช้สามารถอ่าน/เขียนข้อมูลของตัวเองได้
- ร้านค้าสามารถจัดการข้อมูลของตัวเองได้
- Admin สามารถเข้าถึงข้อมูลทั้งหมดได้
- ข้อมูลสาธารณะ (ร้านค้า, เมนู) อ่านได้ทุกคน

### Storage Security Rules
- จำกัดขนาดไฟล์ตามประเภท
- ตรวจสอบ file type (เฉพาะรูปภาพ)
- จำกัดการเข้าถึงตามสิทธิ์ผู้ใช้

## 📱 LINE LIFF Integration

ระบบใช้ LINE LIFF สำหรับการ Authentication:
1. ผู้ใช้ login ผ่าน LINE
2. ระบบตรวจสอบ LINE LIFF ID Token
3. สร้าง Firebase Custom Token
4. ใช้ Firebase Authentication ในการเข้าถึงระบบ

## 💰 ต้นทุน

### Firebase Pricing (Free Tier):
- **Hosting**: 10GB storage, 360MB/day transfer
- **Functions**: 125K invocations/month, 40K GB-seconds/month
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Storage**: 5GB storage, 1GB/day transfer

## 🔧 การพัฒนา

### โครงสร้างไฟล์:
```
oskconnectdb/
├── client/                 # Frontend React App
├── functions/              # Cloud Functions
├── firestore.rules         # Firestore Security Rules
├── storage.rules           # Storage Security Rules
├── firestore.indexes.json  # Firestore Indexes
├── firebase.json           # Firebase Configuration
└── DEPLOYMENT.md           # คู่มือการ Deploy
```

### คำสั่งที่มีประโยชน์:
```bash
# ดู logs
firebase functions:log

# อัปเดต config
firebase functions:config:set key="value"

# Deploy เฉพาะส่วน
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 📞 การสนับสนุน

หากมีปัญหาในการใช้งาน:
1. ตรวจสอบ Firebase Console
2. ดู logs ด้วย `firebase functions:log`
3. ตรวจสอบ Google Cloud Console
4. สร้าง Issue ใน GitHub repository

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE
"# oskconnectdb" 
