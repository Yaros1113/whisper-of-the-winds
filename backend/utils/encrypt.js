const whirlpool = require('whirlpool-hash');

function encrypt(password) {
    // Хешируем пароль с помощью whirlpool2
    const hash = whirlpool(password);

    // Возвращаем хэш в виде строки (уже в hex-формате)
    return hash;
}

module.exports = encrypt;