
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const validateEmailOrPhone = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    const phoneRegex = /^\+?\d{10,15}$/; 

    if (emailRegex.test(input)) {
        return { type: 'email', value: input };
    } else if (phoneRegex.test(input)) {
        return { type: 'phone_number', value: input };
    } else {
        throw new Error('Invalid email or phone number');
    }
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Минимум 6 символов, хотя бы одна буква и одна цифра
    if (!passwordRegex.test(password)) {
        throw new Error('Password must be at least 6 characters long and contain letters and numbers');
    }
};

exports.register = async (req, res) => {
    const { firstName, identifier, password } = req.body;

    try {
        const { type, value } = validateEmailOrPhone(identifier);

        const referralCode = generateReferralCode();

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (first_name, ${type}, password_hash, referral_code) VALUES ($1, $2, $3, $4) RETURNING *`,
            [firstName, value, hashedPassword, referralCode]
        );

        console.log('User created:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(400).send(err.message || 'Server Error');
    }
};

exports.login = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        console.log('Login request:', req.body);

        // Проверка, является ли identifier email или телефоном
        const { type, value } = validateEmailOrPhone(identifier);

        // Поиск пользователя по email или телефону
        const user = await pool.query(`SELECT * FROM users WHERE ${type} = $1`, [value]);

        if (user.rowCount === 0) {
            return res.status(401).send('Invalid credentials');
        }

        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).send('Invalid credentials');
        }

        // Генерация JWT-токена
        const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(400).send(err.message || 'Server Error');
    }
};

exports.forgotPassword = async (req, res) => {
    const { identifier } = req.body;

    try {
        console.log('Forgot password request:', req.body);

        // Проверка, является ли identifier email или телефоном
        const { type, value } = validateEmailOrPhone(identifier);

        // Поиск пользователя
        const user = await pool.query(`SELECT * FROM users WHERE ${type} = $1`, [value]);

        if (user.rowCount === 0) {
            return res.status(404).send('User not found');
        }

        // Генерация нового временного пароля
        const tempPassword = Math.random().toString(36).substring(2, 10);
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        // Обновление пароля в базе данных
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedTempPassword, user.rows[0].id]);

        // Настройка транспорта для отправки письма
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Отправка письма с новым паролем
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: user.rows[0].email || `${user.rows[0].phone_number}@sms.yandex.ru`, // Для телефона используйте SMS через Yandex
            subject: 'Восстановление пароля',
            text: `Ваш новый временный пароль: ${tempPassword}. Пожалуйста, измените его после входа.`,
        });

        res.json({ message: 'Temporary password sent successfully' });
    } catch (err) {
        console.error('Forgot password error:', err.message);
        res.status(400).send(err.message || 'Server Error');
    }
};