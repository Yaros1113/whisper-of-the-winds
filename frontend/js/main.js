// main.js - Общие функции
document.addEventListener('DOMContentLoaded', () => {    
    // Инициализация reCAPTCHA
    recaptchaCheck()
  });

function recaptchaCheck(){
  if (typeof grecaptcha === 'undefined') {
    console.error('reCAPTCHA не загружена.');
    return;
  }
  grecaptcha.ready(() => {
    grecaptcha.execute('6LcW0NAqAAAAAEfnjP2ht5RTVDZrk49cmyn7Y45L', { action: 'submit' }).then((token) => {
      sendTokenToServer(token);
    }).catch((error) => {
      console.error('Ошибка reCAPTCHA:', error);
    });
  });
}
function sendTokenToServer(token) {
  fetch('/api/verify-recaptcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('reCAPTCHA успешно пройдена');
    } else {
      console.error('reCAPTCHA не пройдена:', data.errors);
    }
  })
  .catch(error => {
    console.error('Ошибка при отправке токена:', error);
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryItems.forEach(item => {
    const img = item.querySelector('img');
    const description = item.querySelector('.image-description');

    item.addEventListener('mouseenter', () => {
      description.style.bottom = '0'; // Показываем описание
      img.style.transform = 'scale(1.1)'; // Увеличиваем изображение
    });

    item.addEventListener('mouseleave', () => {
      description.style.bottom = '-100%'; // Скрываем описание
      img.style.transform = 'scale(1)'; // Возвращаем изображение к исходному размеру
    });
  });
});