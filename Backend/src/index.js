const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Models
const User = require('./models/User');
const Book = require('./models/Book');
const Transaction = require('./models/Transaction');

const app = express();

app.use(express.json());
app.use(cors());

// เชื่อมต่อ Database ชื่อ booker_theend
const mongoUri = process.env.MONGO_URI || 'mongodb://loeitech_admin:G7%23u4sK!8zWb@202.29.231.188:27018/booker_theend?authSource=admin';

mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch(err => console.error('❌ Could not connect to MongoDB:', err));

// ==========================================
// ส่วนที่ 1: ระบบสมาชิก (Auth)
// ==========================================

// 2.2.4 การสมัครสมาชิก (Register)
app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        // ถ้าไม่ส่ง role มา ให้เป็น member โดยอัตโนมัติ
        const user = new User({ username, password, role: role || 'member' });
        await user.save();
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
        res.status(400).json({ error: 'Registration failed. Username might be taken.' });
    }
});

// 2.2.5 & 2.2.11 การเข้าสู่ระบบ (Login) - ใช้ได้ทั้ง Member และ Admin
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        // ตรวจสอบรหัสผ่าน (ในระบบจริงควร Hash แต่สำหรับการสอบ Text ธรรมดาได้)
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // ส่งข้อมูลกลับไปให้ Frontend ตัดสินใจว่าจะพาไปหน้าไหน (Admin หรือ User Dashboard)
        res.json({
            message: 'Login successful',
            user: {
                _id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.2.12 แสดงข้อมูลสมาชิก (สำหรับ Admin)
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'member' }); // ดูเฉพาะคนที่เป็นสมาชิก
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ส่วนที่ 2: ระบบจัดการหนังสือ
// ==========================================

// 2.2.6 แสดงรายการหนังสือทั้งหมด
// 2.2.7 แสดงสถานะ (ว่าง/ถูกยืม) -> Frontend เช็คจาก quantity > 0 ได้เลย
app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();

        // เพิ่ม field พิเศษ 'status_text' ให้ Frontend เอาไปโชว์ง่ายๆ (Optional)
        const booksWithStatus = books.map(book => ({
            ...book.toObject(),
            status_text: book.quantity > 0 ? 'Available' : 'Out of Stock'
        }));

        res.json(booksWithStatus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.2.13 การเพิ่มรายการหนังสือ (สำหรับ Admin)
app.post('/books', async (req, res) => {
    try {
        const { title, author, quantity } = req.body;
        const book = new Book({ title, author, quantity });
        await book.save();
        res.status(201).json(book);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2.2.15 แก้ไขรายการหนังสือ (สำหรับ Admin)
app.put('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, quantity } = req.body;
        const book = await Book.findByIdAndUpdate(
            id,
            { title, author, quantity },
            { new: true, runValidators: true }
        );
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2.2.16 ลบรายการหนังสือ (สำหรับ Admin)
app.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const book = await Book.findByIdAndDelete(id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ส่วนที่ 3: ระบบยืม-คืน (Transaction)
// ==========================================

// 2.2.8 สร้างหน้าจอการยืมหนังสือ (API ยืม)
app.post('/borrow', async (req, res) => {
    const { user_id, book_id } = req.body;
    console.log(`[Borrow] Request: User ${user_id} -> Book ${book_id}`);

    try {
        // 1. เช็คหนังสือ
        const book = await Book.findById(book_id);
        if (!book) return res.status(404).json({ error: 'Book not found' });

        console.log(`[Borrow] Found book: ${book.title}, Current Qty: ${book.quantity}`);

        if (book.quantity < 1) return res.status(400).json({ error: 'Book out of stock' });

        // 2. กำหนดวันคืน (สมมติ 7 วัน)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        // 3. สร้าง Transaction
        const transaction = new Transaction({
            user_id,
            book_id,
            due_date: dueDate,
            status: 'borrowed'
        });
        await transaction.save();

        // 4. ตัดสต็อก
        const oldQty = book.quantity;
        book.quantity = book.quantity - 1;
        const updatedBook = await book.save();

        console.log(`[Borrow] Success! Qty changed from ${oldQty} to ${updatedBook.quantity}`);

        res.status(201).json({ message: 'Borrow successful', transaction });
    } catch (err) {
        console.error('[Borrow] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2.2.9 สร้างหน้าจอการคืนหนังสือ (API คืน)
app.post('/return', async (req, res) => {
    // รับ transaction_id มา (หรือจะรับ user_id + book_id ก็ได้ แต่ transaction_id ชัวร์กว่า)
    const { transaction_id } = req.body;

    try {
        const transaction = await Transaction.findById(transaction_id);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        if (transaction.status === 'returned') return res.status(400).json({ error: 'Already returned' });

        // 1. อัปเดตสถานะ
        transaction.status = 'returned';
        transaction.return_date = new Date();
        await transaction.save();

        // 2. คืนสต็อกหนังสือ
        const book = await Book.findById(transaction.book_id);
        if (book) {
            book.quantity += 1;
            await book.save();
        }

        res.json({ message: 'Return successful', transaction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.2.10 แสดงประวัติการยืมคืนหนังสือ (สำหรับ Member ดูของตัวเอง)
app.get('/history/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        // ดึงข้อมูลพร้อม populate ชื่อหนังสือมาแสดงด้วย
        const history = await Transaction.find({ user_id })
            .populate('book_id', 'title author') // เอา field title กับ author มาแปะ
            .sort({ createdAt: -1 }); // เรียงจากล่าสุดไปเก่าสุด

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.2.14 แสดงรายการหนังสือที่ถูกยืม (สำหรับ Admin ดูภาพรวม)
app.get('/admin/borrowed-books', async (req, res) => {
    try {
        // หา Transaction ที่สถานะยังเป็น 'borrowed'
        const borrowedBooks = await Transaction.find({ status: 'borrowed' })
            .populate('user_id', 'username') // เอาชื่อคนยืมมาแปะ
            .populate('book_id', 'title author'); // เอาชื่อหนังสือมาแปะ

        res.json(borrowedBooks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เริ่ม Server
const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;