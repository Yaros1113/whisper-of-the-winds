const express = require('express');
//const { register, login } = require('../controllers/authController');//???
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const db = require('../config/db');
const axios = require('axios');

const router = express.Router();

// Проверка статуса аутентификации
router.get('/check', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
        return res.json({ authenticated: false });
    } 

    try {
        const refresh_decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
        // Если слок жизни токена авторизации истёк, создать новый.
        if (!token && refresh_decoded) {
            token = generate_token(refresh_decoded.login, '15m');
        }
        // Проверяем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ищем пользователя в базе данных
        const [user] = await db.query('SELECT login FROM accounts_site WHERE login = ?', [decoded.login]);
        if (user.length === 0) {
            return res.json({ authenticated: false });
        }

        res.json({ authenticated: true, user_login: user[0].login, token});
    } catch (err) {
        res.json({ authenticated: false});
    }
});

// Вход пользователя
router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        // Ищем пользователя по login
        const [user] = await db.query(
            'SELECT * FROM accounts_site WHERE login = ?',
            [login]
        );

        /*const [email] = await db.query(
            'SELECT email FROM accounts WHERE login = ?',
            [login]
        );*/

        if (user.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        /*// Обновляем дату в таблице
        await db.query(
            'UPDATE accounts_site SET creation_date = ? WHERE login = ?',
            [creation_date, login]
        );*/

        // Создаем JWT токены
        const token = generate_token(user[0].login, '15m');
        const refresh_token = generate_token(user[0].login, '720h');

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true, // Куки доступны только серверу
            secure: false,   // Куки передаются только по HTTPS
            maxAge: 1000 * 60 * 60 * 24 * 30, // Время жизни куки (30 деней)
            sameSite: 'strict' // Защита от CSRF-атак
        });

        // Возвращаем токен и информацию о пользователе
        res.json({
            token,
            user: {
                login: user[0].login,
                /*email: email[0].email,*/
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

function generate_token(_login, life_time){
    // Создаем JWT токен
    return jwt.sign(
        { login: _login },
        process.env.JWT_SECRET,
        { expiresIn: life_time }
    );
}

// Регистрация пользователя
router.post('/register', async (req, res) => {
    const { login/*, email*/, password, retoken } = req.body;
    try {
        const [existingUser] = await db.query('SELECT * FROM accounts_site WHERE login = ?', [login]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: true, message: 'Пользователь с таким логином уже существует.' });
        }
        // Проверка reCAPTCHA
        const captchaResponse = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=6LcW0NAqAAAAAB7l_h5tc7A3fkwi2jOxjgaeXkuz&response=${retoken}`
        );

        const { success, score, action, errors } = captchaResponse.data;
        if (success && score >= 0.5) { // Порог оценки (можно настроить)            
            // Хеширование пароля
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Создание пользователя
            await db.query(
                'INSERT INTO accounts_site (login, password) VALUES (?, ?)',
                [login, hashedPassword]
            );
            res.json({ error: false, message: 'Поздравляю, вы зарегистрированы!' });
        } else {
            res.status(400).json({ error: true, message: 'Низкий уровень доверия reCAPTCHA. Изыйди демон!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Server error' });
    }
});

module.exports = router;