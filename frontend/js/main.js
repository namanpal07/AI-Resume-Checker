/**
 * AI Resume Coach - Global App Shell, Navigation & Theme Script
 */

// Immediate theme application to prevent any visual flash
(function applyThemeImmediately() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Drawer Handling
  const mobileToggle = document.querySelector('.mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (mobileToggle && sidebar) {
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }

  // 2. Highlight Active Sidebar and Navbar Link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidebar-link, .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const cleanHref = href.replace('../', '').replace('./', '');
    const cleanPath = currentPath.split('/').pop() || 'index.html';

    if (cleanPath === cleanHref || (cleanPath === '' && cleanHref === 'index.html')) {
      link.classList.add('active');
    }
  });

  // 3. Sync User's Selected Role into header badges if present
  const savedRole = localStorage.getItem('selectedRole');
  const headerRoleBadge = document.querySelectorAll('.current-role-badge');
  if (savedRole) {
    headerRoleBadge.forEach(badge => badge.textContent = savedRole);
  }

  // 4. Dark / Light Theme Switcher Logic
  initThemeSwitcher();
});

function initThemeSwitcher() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeControls(currentTheme);

  // Setup sidebar theme buttons
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      setAppTheme(newTheme);
    });
  });

  // Setup header theme toggle icon buttons
  const navThemeBtns = document.querySelectorAll('.theme-toggle-nav');
  navThemeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      setAppTheme(newTheme);
    });
  });
}

function setAppTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeControls(theme);

  if (typeof window.showToast === 'function') {
    window.showToast(`Switched to ${theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }
}

function updateThemeControls(theme) {
  const isDark = theme === 'dark';

  // Update sidebar button text/icons
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  themeBtns.forEach(btn => {
    const label = btn.querySelector('.theme-text');
    const icon = btn.querySelector('.theme-icon-indicator');
    if (label) {
      label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }
    if (icon) {
      icon.textContent = isDark ? '🌙' : '☀️';
    }
  });

  // Update nav icon buttons
  const navBtns = document.querySelectorAll('.theme-toggle-nav');
  navBtns.forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = `Switch to ${isDark ? 'Light' : 'Dark'} Mode`;
  });
}

// Helper formatting utilities
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return 'Just now';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

window.formatBytes = formatBytes;
window.formatDate = formatDate;
window.setAppTheme = setAppTheme;
