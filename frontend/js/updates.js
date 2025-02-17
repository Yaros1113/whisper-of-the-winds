const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа
const savedTimestamp = localStorage.getItem('updatesTimestamp');
if (savedTimestamp && Date.now() - parseInt(savedTimestamp, 10) > CACHE_DURATION) {
  localStorage.removeItem('updates');
  localStorage.removeItem('updatesTimestamp');
}

document.addEventListener('DOMContentLoaded', () => {
  const updatesList = document.getElementById('updatesList');

  // Функция для загрузки обновлений
  const loadUpdates = async () => {
    try {
      // Проверяем, есть ли сохраненные обновления в localStorage
      const savedUpdates = localStorage.getItem('updates');
      const savedTimestamp = localStorage.getItem('updatesTimestamp');

      if (savedUpdates && savedTimestamp) {
        const updates = JSON.parse(savedUpdates);
        const timestamp = parseInt(savedTimestamp, 10);

        // Проверяем, есть ли новые обновления на сервере
        const response = await fetch('/api/updates');
        if (!response.ok) throw new Error('Ошибка при загрузке обновлений');

        if (!response.ok && savedUpdates) {
          console.warn('Сервер недоступен. Используем сохраненные данные.');
          displayUpdates(JSON.parse(savedUpdates));
          return;
        }

        const serverUpdates = await response.json();
        const serverTimestamp = Date.now();

        // Если данные на сервере не изменились, используем сохраненные
        if (serverTimestamp <= timestamp) {
          displayUpdates(updates);
          return;
        }
      }

      // Если сохраненных данных нет или они устарели, загружаем с сервера
      const response = await fetch('/api/updates');
      if (!response.ok) throw new Error('Ошибка при загрузке обновлений');

      const updates = await response.json();
      const timestamp = Date.now();

      // Сохраняем обновления и метку времени в localStorage
      localStorage.setItem('updates', JSON.stringify(updates));
      localStorage.setItem('updatesTimestamp', timestamp.toString());

      // Отображаем обновления
      displayUpdates(updates);
    } catch (error) {
      console.error('Ошибка:', error);
      updatesList.innerHTML = '<p class="error">Не удалось загрузить обновления.</p>';
    }
  };

  // Функция для отображения обновлений
  const displayUpdates = (updates) => {
    updatesList.innerHTML = ''; // Очищаем список перед добавлением новых данных

    updates.forEach(update => {
      const updateElement = document.createElement('div');
      updateElement.classList.add('update');

      updateElement.innerHTML = `
        <h2>Версия: ${update.version[0]}</h2>
        <p><strong>Дата:</strong> ${update.date[0]}</p>
        <p><strong>Описание:</strong> ${update.description[0]}</p>
      `;

      updatesList.appendChild(updateElement);
    });
  };

  // Загружаем обновления
  loadUpdates();
});