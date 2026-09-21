/**
 * AI Resume Coach - Job Role Selection Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Role Selection
  const selectButtons = document.querySelectorAll('.btn-select-role');

  selectButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const roleName = button.getAttribute('data-role');

      if (roleName) {
        localStorage.setItem('selectedRole', roleName);
        window.location.href = 'upload.html';
      }
    });
  });

  // 2. Interactive Search Filter
  const searchInput = document.getElementById('roleSearchInput');
  const roleCards = document.querySelectorAll('.role-card');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();

      roleCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
});
