const db = require('../config/db');
const encrypt = require('../utils/encrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { login/*, email*/, password } = req.body;

    try {
        // Проверка, существует ли пользователь с таким email или login
        const [existingUser] = await db.query(
            'SELECT * FROM accounts WHERE login = ?', /*email = ? OR*/
            [/*email, */login]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Шифрование пароля
        const encryptedPassword = encrypt(password);

        // Создание нового пользователя
        await db.query(
            'INSERT INTO accounts_site (login, password) VALUES (?, ?)',
            [login, encryptedPassword]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { login, password } = req.body;

    try {
        // Поиск пользователя по email
        const [user] = await db.query('SELECT * FROM accounts WHERE login = ?', [login]);

        if (user.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Шифрование введенного пароля для сравнения
        const isPasswordValid = encrypt(password) == user[0].password;

        // Проверка пароля
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { login: user[0].login/*, email: user[0].email*/ },
            process.env.JWT_SECRET, // Используем переменную окружения
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login };