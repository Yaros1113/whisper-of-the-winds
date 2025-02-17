// auth.js - Логика аутентификации

document.addEventListener('DOMContentLoaded', () => {
  //grecaptcha.ready();
  checkAuthStatus();
});

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Ошибка сети или сервера');
    }
    const data = await response.json();
    if (data.authenticated) {
      updateAuthPanel(data.user_login);
    }
    else {
      updateAuthPanel();
      console.error("Аутентификация не пройдена, авторизуйтесь!", data);
      try {
        logOutAccount();
      } catch (error){}
    }
  } catch (error) {
    console.error('Ошибка при проверке статуса аутентификации:', error);
    showError("Ошибка при проверке статуса аутентификации.");
  }
}

function updateAuthPanel(user_login = null) {
  const authPanel = document.getElementById('authPanel');
  if (!authPanel) return;
  authPanel.innerHTML = user_login
    ? `<button onclick="location.href='account.html'">${user_login}</button>`
    : `<button onclick="showLoginForm()">Войти</button>`;
}

function showLoginForm() {
  const authFormContainer = document.getElementById('authFormContainer');
  authFormContainer.innerHTML = `
    <h3>Вход в аккаунт</h3>
    <input type="text" id="loginInput" placeholder="Ник">
    <input type="password" id="passwordInput" placeholder="Пароль">
    <button onclick="performLogin()">Войти</button>
    <button onclick="showRegisterForm()">Регистрация</button>
  `;
  openAuthModal();
}

function showRegisterForm() {
  const authFormContainer = document.getElementById('authFormContainer');
  authFormContainer.innerHTML = `
    <h3>Регистрация</h3>
    <input type="text" id="registerUsername" placeholder="Никнейм">
    <input type="password" id="registerPassword" placeholder="Пароль">
    <button onclick="performRegistration()">Зарегистрироваться</button>
  `; /*<input type="email" id="registerEmail" placeholder="Email (необязательно)">*/
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  //recaptchaCheck();
  modal.style.display = 'flex';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'none';
}

async function performLogin(login = null, password = null) {
  if (!login || !password){
    login = document.getElementById('loginInput').value;
    password = document.getElementById('passwordInput').value;
  }
  
  if (!login || !password) {
    alert('Пожалуйста, заполните все поля.');
    showError('Пожалуйста, заполните все поля.');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      updateAuthPanel(data.user.login);
      closeAuthModal();
    } else {
      alert('Ошибка входа. Проверьте данные.');
    }
  } catch (error) {
    console.error('Ошибка при входе:', error);
    showError('Ошибка при входе:' + error);
  }
}

function validateLoginForm(login, password) {
  if (!login || !password) {
    return 'Пожалуйста, заполните все поля.';
  }
  if (password.length < 1) {
    return 'Пароль должен содержать не менее 1 символов.';
  }
  return null;
}

async function performRegistration() {
  const login = document.getElementById('registerUsername').value;
  //const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const error = validateLoginForm(login, password);
  if (error) {
    showError(error);
    return;
  }

  // Используем reCAPTCHA v3
  grecaptcha.ready(async () => {
    const retoken = await grecaptcha.execute('6LcW0NAqAAAAAEfnjP2ht5RTVDZrk49cmyn7Y45L', { action: 'register' });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login/*, email*/, password, retoken })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.error){
          showError(data.message);
        }
        else {
          updateAuthPanel();
          closeAuthModal();
          alert(data.message);
          performLogin(login, password);
        }
      } else {
        alert('Ошибка регистрации. Проверьте данные.');
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      showError("Ошибка при регистрации, обновите страницу." + error);
    }
  });
}

function showError(message) {
  const authFormContainer = document.getElementById('authFormContainer');
  authFormContainer.innerHTML = `<p class="error">${message}</p>`;
}

/*function recaptchaCheck(){  
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
}*/