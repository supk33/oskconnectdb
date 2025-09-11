# 🏗️ สถาปัตยกรรมระบบ OSK Connect Database

## 📋 ภาพรวม

ระบบจัดการร้านค้าในเครือข่ายที่ใช้ **Firebase Services ทั้งหมด** แทนการใช้งาน server แบบดั้งเดิม

## 🎯 สถาปัตยกรรมหลัก

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloud         │    │   Firebase      │
│   (React SPA)   │◄──►│   Functions     │◄──►│   Services      │
│                 │    │   (Backend)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   LINE LIFF     │    │   Firestore     │
                       │   Authentication│    │   Database      │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Frontend Layer

### เทคโนโลยี
- **Framework**: React.js 18+
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Routing**: React Router v6

### โครงสร้างเส้นทาง
```
/                    # หน้าแรก - แสดงร้านค้าทั้งหมด
/member             # Member Dashboard - จัดการร้านค้าของตัวเอง
/admin              # Admin Dashboard - จัดการระบบทั้งหมด
```

### การโฮสต์
- **Platform**: Firebase Hosting
- **Domain**: `https://your-project-id.web.app`
- **Features**: 
  - Single Page Application (SPA)
  - Automatic HTTPS
  - Global CDN
  - Custom domain support

## 🔧 Backend Layer (Cloud Functions)

### เทคโนโลยี
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Authentication**: Firebase Admin SDK
- **Integration**: LINE LIFF API

### ฟังก์ชันหลัก

#### 1. LINE LIFF Authentication
```javascript
POST /auth/line-verify
{
  "idToken": "line_liff_id_token"
}
```
- ตรวจสอบ LINE LIFF ID Token
- สร้าง/อัปเดต user ใน Firestore
- ออก Firebase Custom Token

#### 2. API Endpoints
```
/api/*           # Public APIs (require authentication)
/api/member/*    # Member APIs (require member role)
/api/admin/*     # Admin APIs (require admin role)
```

### การ Deploy
- **Platform**: Firebase Cloud Functions
- **Region**: us-central1 (default)
- **Memory**: 1GB
- **Timeout**: 540 seconds

## 🗄️ ฐานข้อมูล (Cloud Firestore)

### Collections Structure

#### 1. Users Collection
```javascript
users/{userId}
{
  uid: "line_user_id",
  name: "User Name",
  picture: "profile_picture_url",
  email: "user@email.com",
  role: "member" | "admin",
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLogin: timestamp
}
```

#### 2. Stores Collection
```javascript
stores/{storeId}
{
  name: "Store Name",
  description: "Store Description",
  ownerId: "user_id",
  categoryId: "category_id",
  location: {
    latitude: 13.7563,
    longitude: 100.5018
  },
  address: "Store Address",
  phone: "phone_number",
  status: "pending" | "approved" | "rejected",
  rating: 4.5,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 3. Store Photos Collection
```javascript
storePhotos/{photoId}
{
  storeId: "store_id",
  photoUrl: "storage_url",
  photoType: "main" | "gallery",
  storeOwnerId: "owner_user_id",
  createdAt: timestamp
}
```

#### 4. Menu Items Collection
```javascript
menuItems/{itemId}
{
  storeId: "store_id",
  name: "Menu Item Name",
  description: "Description",
  price: 150,
  category: "food" | "drink" | "dessert",
  storeOwnerId: "owner_user_id",
  createdAt: timestamp
}
```

#### 5. Tags Collection
```javascript
tags/{tagId}
{
  name: "Tag Name",
  category: "cuisine" | "service" | "atmosphere",
  createdAt: timestamp
}
```

#### 6. Promotions Collection
```javascript
promotions/{promoId}
{
  storeId: "store_id",
  title: "Promotion Title",
  description: "Description",
  discount: 20,
  startDate: timestamp,
  endDate: timestamp,
  status: "active" | "expired",
  createdAt: timestamp
}
```

### Security Rules
- **Users**: อ่าน/เขียนข้อมูลของตัวเอง, Admin อ่านได้ทั้งหมด
- **Stores**: อ่านได้ทุกคน, เขียนได้เจ้าของและ Admin
- **Photos**: อ่านได้ทุกคน, เขียนได้เจ้าของร้านและ Admin
- **Menu Items**: อ่านได้ทุกคน, เขียนได้เจ้าของร้านและ Admin

## 📁 ไฟล์รูปภาพ (Firebase Storage)

### โครงสร้างโฟลเดอร์
```
stores/{storeId}/
├── logo.jpg              # โลโก้ร้านค้า (2MB limit)
├── photos/               # รูปภาพร้านค้า
│   ├── main.jpg         # รูปหลัก (5MB limit)
│   ├── gallery1.jpg     # รูปแกลเลอรี่ (5MB limit)
│   └── gallery2.jpg     # รูปแกลเลอรี่ (5MB limit)
└── menu/                 # รูปเมนู
    ├── item1.jpg        # รูปเมนู (3MB limit)
    └── item2.jpg        # รูปเมนู (3MB limit)

users/{userId}/
└── avatar.jpg            # รูปโปรไฟล์ (2MB limit)

categories/{categoryId}/
└── icon.png              # ไอคอนหมวดหมู่ (1MB limit)
```

### Security Rules
- จำกัดขนาดไฟล์ตามประเภท
- ตรวจสอบ file type (เฉพาะรูปภาพ)
- จำกัดการเข้าถึงตามสิทธิ์ผู้ใช้

## 🔐 การรักษาความปลอดภัย

### 1. Authentication Flow
```
1. User Login via LINE LIFF
2. LINE returns ID Token
3. Cloud Function verifies token
4. Creates/updates user in Firestore
5. Returns Firebase Custom Token
6. Frontend uses token for API calls
```

### 2. Authorization
- **Role-based Access Control**: member, admin
- **Resource Ownership**: ผู้ใช้จัดการข้อมูลของตัวเอง
- **Admin Override**: Admin เข้าถึงข้อมูลทั้งหมด

### 3. Data Validation
- Input validation ใน Cloud Functions
- Firestore Security Rules
- Storage Rules สำหรับไฟล์

## 📊 การ Monitor และ Logging

### Firebase Console
- **Functions**: Usage, errors, performance
- **Firestore**: Read/write operations, indexes
- **Storage**: File uploads, bandwidth
- **Hosting**: Page views, performance

### Google Cloud Console
- **Cloud Functions**: Detailed metrics
- **Firestore**: Advanced monitoring
- **Billing**: Cost analysis

## 💰 ต้นทุนและ Pricing

### Free Tier (Spark Plan)
- **Hosting**: 10GB storage, 360MB/day
- **Functions**: 125K invocations/month
- **Firestore**: 1GB storage, 50K reads/day
- **Storage**: 5GB storage, 1GB/day

### Pay-as-you-go (Blaze Plan)
- **Functions**: $0.40 per million invocations
- **Firestore**: $0.18 per 100K reads, $0.51 per 100K writes
- **Storage**: $0.026 per GB/month

## 🚀 ข้อดีของสถาปัตยกรรมนี้

### 1. **Scalability**
- Firebase scale อัตโนมัติตามการใช้งาน
- ไม่ต้องกังวลเรื่อง server capacity

### 2. **Cost-Effective**
- เริ่มต้นฟรี
- จ่ายตามการใช้งานจริง
- ไม่มี hidden costs

### 3. **Developer Experience**
- ไม่ต้องจัดการ infrastructure
- Deploy ง่ายด้วย Firebase CLI
- Local development ด้วย emulators

### 4. **Security**
- Security Rules ที่ยืดหยุ่น
- Authentication ที่แข็งแกร่ง
- Automatic HTTPS

### 5. **Real-time Capabilities**
- Firestore real-time updates
- Offline support
- Automatic sync

## 🔄 การ Deploy และ Maintenance

### Development Workflow
```bash
# 1. Local Development
firebase emulators:start

# 2. Test with Emulators
npm run test

# 3. Build Frontend
npm run build

# 4. Deploy
firebase deploy
```

### Production Deployment
```bash
# Deploy ทั้งหมด
firebase deploy

# หรือ Deploy เฉพาะส่วน
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Monitoring และ Maintenance
```bash
# ดู logs
firebase functions:log

# อัปเดต config
firebase functions:config:set key="value"

# ดู performance
firebase functions:log --only api
```

## 🎯 การพัฒนาต่อ

### Phase 1: Core Features ✅
- [x] User authentication via LINE LIFF
- [x] Store management
- [x] Photo uploads
- [x] Basic admin panel

### Phase 2: Advanced Features 🚧
- [ ] Real-time notifications
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

### Phase 3: Enterprise Features 📋
- [ ] Multi-tenant support
- [ ] Advanced reporting
- [ ] Integration APIs
- [ ] Custom branding

## 📞 การสนับสนุน

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

### Community
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [GitHub Issues](https://github.com/your-repo/issues)

---

*สถาปัตยกรรมนี้ได้รับการออกแบบให้ง่ายต่อการพัฒนา ขยาย และบำรุงรักษา โดยใช้ Firebase Services ที่มีประสิทธิภาพและเชื่อถือได้*
