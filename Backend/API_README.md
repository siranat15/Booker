# 📚 Booker API - คู่มือการใช้งาน Postman

**Base URL:** `http://localhost:5000`

---

## 🚀 เริ่มต้นใช้งาน

### 1. Import Collection เข้า Postman
1. เปิด Postman
2. กด **Import** (มุมซ้ายบน)
3. ลากไฟล์ `Booker_API.postman_collection.json` เข้าไป

---

## 📝 API Endpoints

### 🔐 Authentication (ระบบสมาชิก)

#### Register - สมัครสมาชิก
```
POST http://localhost:5000/register
Content-Type: application/json

{
    "username": "testuser",
    "password": "123456",
    "role": "member"
}
```
**role ที่ใช้ได้:** `member` หรือ `admin`

---

#### Login - เข้าสู่ระบบ
```
POST http://localhost:5000/login
Content-Type: application/json

{
    "username": "admin",
    "password": "123456"
}
```
**Response:**
```json
{
    "message": "Login successful",
    "user": {
        "_id": "xxx",
        "username": "admin",
        "role": "admin"
    }
}
```

---

### 👥 Users (จัดการสมาชิก)

#### Get All Users - ดูสมาชิกทั้งหมด
```
GET http://localhost:5000/users
```

---

### 📖 Books (จัดการหนังสือ)

#### Get All Books - ดูหนังสือทั้งหมด
```
GET http://localhost:5000/books
```

---

#### Add Book - เพิ่มหนังสือ (Admin)
```
POST http://localhost:5000/books
Content-Type: application/json

{
    "title": "Harry Potter",
    "author": "J.K. Rowling",
    "quantity": 5
}
```

---

### 📚 Transactions (ยืม-คืน)

#### Borrow Book - ยืมหนังสือ
```
POST http://localhost:5000/borrow
Content-Type: application/json

{
    "user_id": "USER_ID_จาก_LOGIN",
    "book_id": "BOOK_ID_จาก_GET_BOOKS"
}
```

---

#### Return Book - คืนหนังสือ
```
POST http://localhost:5000/return
Content-Type: application/json

{
    "transaction_id": "TRANSACTION_ID_จาก_BORROW"
}
```

---

#### Get History - ดูประวัติยืม-คืน
```
GET http://localhost:5000/history/{user_id}
```
**ตัวอย่าง:** `http://localhost:5000/history/65abc123def456`

---

#### Admin - Get Borrowed Books
```
GET http://localhost:5000/admin/borrowed-books
```

---

## 🔄 ขั้นตอนการทดสอบแบบครบ Loop

1. **Register** - สร้าง user ใหม่
2. **Login** - เข้าสู่ระบบ (จด `_id` ไว้)
3. **Add Book** - เพิ่มหนังสือ (จด `_id` ของหนังสือไว้)
4. **Get Books** - ดูหนังสือทั้งหมด
5. **Borrow** - ยืมหนังสือ (ใช้ `user_id` และ `book_id`)
6. **Get History** - ดูประวัติการยืม
7. **Return** - คืนหนังสือ
8. **Get History** - ดูประวัติอีกครั้ง (สถานะเปลี่ยนเป็น returned)

---

## ⚠️ หมายเหตุ

- ถ้ารัน Backend ใน **Docker**: ใช้ `http://localhost:5000`
- ถ้ารัน Backend แบบ **Local (npm run dev)**: ใช้ `http://localhost:5000` เช่นกัน
- ถ้าเชื่อมต่อจาก **มือถือ**: ใช้ IP ของคอมพิวเตอร์ เช่น `http://172.29.61.79:5000`
