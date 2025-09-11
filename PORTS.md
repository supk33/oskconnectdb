# 🔌 Firebase Ports Configuration

## Ports ที่ใช้ในระบบ:

### Firebase Hosting
- **Port 5000**: Frontend (React App)
- **URL**: `http://localhost:5000`

### Firebase Emulators
- **Port 4000**: Firebase Emulator UI (Dashboard)
- **URL**: `http://localhost:4000`
- **Port 5001**: Cloud Functions
- **Port 8080**: Firestore Database
- **Port 9099**: Authentication
- **Port 9199**: Storage

## 🚀 วิธีเริ่มระบบ:

### 1. เริ่ม Firebase Emulators
```bash
firebase emulators:start --only functions,firestore
```

### 2. เริ่ม Firebase Hosting (ใน terminal ใหม่)
```bash
firebase serve --only hosting
```

### 3. เข้าถึงระบบ:
- **Frontend**: http://localhost:5000
- **Emulator UI**: http://localhost:4000
- **API**: http://localhost:5001/oskconnectdb/us-central1/api

## 🔧 การแก้ไขปัญหา:

### หากหน้า shops เป็นหน้าขาว:
1. ตรวจสอบว่า Firebase Emulators ทำงานอยู่
2. ไปที่ http://localhost:4000 เพื่อดู Emulator UI
3. ตรวจสอบว่า Functions และ Firestore ทำงานอยู่

### หาก Java error:
```bash
set PATH=%PATH%;C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\bin
```

### หาก API ไม่ทำงาน:
1. ตรวจสอบ console logs ใน browser
2. ดู Network tab ใน Developer Tools
3. ตรวจสอบ Firebase Emulator UI

## 📋 ข้อมูลทดสอบ:

ระบบจะแสดงข้อมูลทดสอบ 3 ร้านค้า:
1. ร้านกาแฟสตาร์บัคส์ (อนุมัติแล้ว)
2. ร้านอาหารไทยโบราณ (อนุมัติแล้ว)
3. ร้านขนมหวาน (รออนุมัติ)
