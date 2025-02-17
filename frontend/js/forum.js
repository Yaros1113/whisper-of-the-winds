document.addEventListener('DOMContentLoaded', () => {
    loadForumSections();
  });
  
  async function loadForumSections() {
    try {
      const response = await fetch('/api/forum/sections');
      const sections = await response.json();
      const forumSections = document.getElementById('forumSections');
  
      forumSections.innerHTML = sections.map(section => `
        <div class="forum-section">
          <h2>${section.title}</h2>
          ${section.threads.map(thread => `
            <div class="thread">
              <h3>${thread.title}</h3>
              <p>${thread.description}</p>
              <button onclick="loadThread(${thread.id})">Открыть</button>
            </div>
          `).join('')}
        </div>
      `).join('');
    } catch (error) {
      console.error('Ошибка загрузки разделов форума:', error);
    }
  }
  
  async function loadThread(threadId) {
    // Логика загрузки конкретной темы
  }