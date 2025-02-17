document.addEventListener('DOMContentLoaded', () => {
    //checkAuthStatus();
    //console.log(localStorage.getItem('token'))
    if (!localStorage.getItem('token')) {
      window.location.href = 'index.html';
      return;
    }
  
    loadAccountData();
  });
  
  async function loadAccountData() {
    try {
      const response = await fetch(`/api/user/${44}/comments`);
      const data = await response.json();
  
      displayComments(data.topLiked, 'topLikedComments');
      displayComments(data.topDisliked, 'topDislikedComments');
      displayComments(data.recentReplies, 'recentReplies');
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  }
  
  function displayComments(comments, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = comments.map(comment => `
      <div class="comment">
        <p>${comment.text}</p>
        <div class="reactions">
          <span>👍 ${comment.likes}</span>
          <span>👎 ${comment.dislikes}</span>
        </div>
      </div>
    `).join('');
  }
  
  async function deleteAccount() {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
      try {
        logOutAccount();
        const response = await fetch('/api/user', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Ошибка удаления аккаунта:', error);
      }
    }
  }

  async function logOutAccount(){
    localStorage.setItem('token', '');
    updateAuthPanel();
    window.location.href = 'index.html';
  }