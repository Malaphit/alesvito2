const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Регистрация
router.post('/register', authController.register);

// Логин
router.post('/login', authController.login);

// Забыли пароль
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;