const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

// Настройка CORS для работы с фронтендом
app.use(cors({
  origin: 'http://localhost:5000', // Убедитесь, что это соответствует вашему серверу
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Служба отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Маршрут для регистрации
app.post('/api/register', async (req, res) => {
  const { firstName, email, password } = req.body;

  try {
    const emailCheck = await pool.query('SELECT email FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const referralCode = Math.random().toString(36).substr(2, 9).toUpperCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (first_name, email, password_hash, referral_code, bonus_points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [firstName, email, hashedPassword, referralCode, 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для логина
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для "Забыли пароль"
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = Math.random().toString(36).substr(2, 9);
    // Здесь нужно сохранить токен в базе (например, в таблице password_resets), но для простоты пока только отправляем email

    const resetLink = `http://localhost:5000/reset-password?token=${resetToken}`; // Позже добавим реальную страницу
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset link sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для получения товаров
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  try {
    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const params = [];
    if (category && category !== 'all') {
      query += ' WHERE c.name = $1';
      params.push(category);
    }
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Статическая подача фронтенда
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/api/categories', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories');
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/admin/categories', async (req, res) => {
    const { categoryName, categoryDescription } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
        [categoryName, categoryDescription]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/admin/products', async (req, res) => {
    const { productName, productDescription, productPrice, productImage, productCategory } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO products (name, description, price, image_url, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [productName, productDescription, productPrice, productImage, productCategory]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/products', async (req, res) => {
    const { category } = req.query;
    try {
        let query = `
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        const params = [];
        if (category && category !== 'all') {
            query += ' WHERE c.name = $1';
            params.push(category);
        }
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});