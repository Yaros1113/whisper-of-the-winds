const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');
require('dotenv').config(); // Загружает переменные окружения из .env
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const UPDATES_DIR = path.join(__dirname, 'updates');
app.use(cookieParser());

// Middleware для статических файлов
app.use(express.static('public'));

// Функция для чтения и парсинга XML-файлов
const parseUpdateFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) return reject(err);
      xml2js.parseString(data, (err, result) => {
        if (err) return reject(err);
        resolve(result.update);
      });
    });
  });
};

// Маршрут для получения обновлений
app.get('/api/updates', async (req, res) => {
  try {
    const files = fs.readdirSync(UPDATES_DIR).reverse(); // Сортируем файлы в обратном порядке
    const updates = [];

    for (const file of files) {
      if (file.endsWith('.xml')) {
        const filePath = path.join(UPDATES_DIR, file);
        const update = await parseUpdateFile(filePath);
        updates.push(update);
      }
    }

    res.json(updates);
  } catch (err) {
    console.error('Ошибка при загрузке обновлений:', err);
    res.status(500).json({ error: 'Ошибка при загрузке обновлений' });
  }
});

// авторизация/регистрация
// Middleware для проверки токена
app.use(cors());
app.use(bodyParser.json());

// Подключение к базе данных
db.query('SELECT 1')
    .then(() => console.log('MySQL connected'))
    .catch((err) => console.error('MySQL connection error:', err));

// Роуты
app.use('/api/auth', authRoutes);

// Защищенный роут (пример)
app.get('/api/protected', (req, res) => {
    res.json({ message: 'This is a protected route' });
});

app.post('/api/verify-recaptcha', async (req, res) => {
  const { token } = req.body;
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=6LcW0NAqAAAAAB7l_h5tc7A3fkwi2jOxjgaeXkuz&response=${token}`
    );
    const { success, score } = response.data;
    if (success && score >= 0.5) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, errors: 'reCAPTCHA не пройдена' });
    }
  } catch (error) {
    console.error('Ошибка при проверке reCAPTCHA:', error);
    res.status(500).json({ success: false, errors: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});