/**
 * AI Resume Coach - Job Role Selection Logic
 * Supports 20 curated roles across 7 categories with real-time search & filter
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentSelectedRole = localStorage.getItem('selectedRole') || 'Software Engineer';
  const roleCards = document.querySelectorAll('.role-card');
  const categorySections = document.querySelectorAll('.role-category-section');
  const searchInput = document.getElementById('roleSearchInput');
  const categoryPills = document.querySelectorAll('.category-pill');

  // 1. Highlight Currently Selected Role
  function highlightSelectedRole(roleName) {
    roleCards.forEach(card => {
      const cardRole = card.getAttribute('data-role-name');
      const btn = card.querySelector('.btn-select-role');

      if (cardRole === roleName) {
        card.classList.add('selected-role-active');
        if (btn) {
          btn.textContent = '✓ Selected Role';
          btn.className = 'btn btn-primary btn-select-role';
        }
      } else {
        card.classList.remove('selected-role-active');
        if (btn) {
          btn.textContent = 'Select Role';
          btn.className = 'btn btn-outline btn-select-role';
        }
      }
    });

    // Update profile role badge in sidebar if present
    const profileRoleBadge = document.querySelector('.current-role-badge');
    if (profileRoleBadge) {
      profileRoleBadge.textContent = roleName;
    }
  }

  highlightSelectedRole(currentSelectedRole);

  // 2. Role Selection Click Handling
  roleCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const roleName = card.getAttribute('data-role-name');
      if (roleName) {
        localStorage.setItem('selectedRole', roleName);
        highlightSelectedRole(roleName);

        if (typeof showToast === 'function') {
          showToast(`Selected role: ${roleName}`, 'success');
        }

        setTimeout(() => {
          window.location.href = 'upload.html';
        }, 250);
      }
    });

    // Handle button click directly
    const btn = card.querySelector('.btn-select-role');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roleName = btn.getAttribute('data-role');
        if (roleName) {
          localStorage.setItem('selectedRole', roleName);
          highlightSelectedRole(roleName);
          setTimeout(() => {
            window.location.href = 'upload.html';
          }, 200);
        }
      });
    }
  });

  // 3. Category Filter Pills
  let activeCategory = 'all';

  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  // 4. Search Filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }

  function applyFilters() {
    const term = (searchInput ? searchInput.value : '').toLowerCase().trim();

    categorySections.forEach(section => {
      const sectionCat = section.getAttribute('data-cat');
      const cardsInSection = section.querySelectorAll('.role-card');
      let visibleInThisSection = 0;

      cardsInSection.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesSearch = term === '' || text.includes(term);
        const matchesCategory = activeCategory === 'all' || sectionCat === activeCategory;

        if (matchesSearch && matchesCategory) {
          card.style.display = 'flex';
          visibleInThisSection++;
        } else {
          card.style.display = 'none';
        }
      });

      // Show/hide entire category section if it has matching cards
      if (visibleInThisSection > 0) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  }
});
