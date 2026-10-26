/**
 * AI Resume Coach - Centralized API Service & UI Utilities
 */

// Dynamically detect API URL:
// - Deployed on the web (e.g. Vercel, production domain): uses current window.location.origin
// - Served locally by Express backend (port 5000): uses current origin
// - Local dev tools (e.g. Live Server on port 5500) or file://: connects to http://localhost:5000
const isFile = window.location.protocol === 'file:';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isBackendServedLocally = isLocalhost && (window.location.port === '5000' || window.location.origin.includes(':5000'));
const API_BASE_URL = (!isFile && (!isLocalhost || isBackendServedLocally))
  ? window.location.origin
  : 'http://localhost:5000';

const API = {
  // 1. Upload Resume File
  async uploadResume(file, targetRole = 'Software Engineer') {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    const response = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to upload and parse resume');
    }
    return result.data;
  },

  // 2. Analyze Resume Text & Compute ATS Score
  async analyzeResume(analysisPayload) {
    const response = await fetch(`${API_BASE_URL}/api/ats/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisPayload)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to analyze resume data');
    }
    return result.data;
  },

  // 3. Match Resume against Job Description
  async matchJobDescription(payload) {
    const response = await fetch(`${API_BASE_URL}/api/job-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Job match failed');
    }
    return result.data;
  },

  // 4. AI Resume Improvement Suggestions
  async getImprovements(payload) {
    const response = await fetch(`${API_BASE_URL}/api/ai/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to generate AI recommendations');
    }
    return result.data;
  },

  // 5. AI Interview Questions Generator
  async getInterviewQuestions(payload) {
    const response = await fetch(`${API_BASE_URL}/api/interview/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to retrieve interview questions');
    }
    return result.data;
  },

  // 6. AI Interview Answer Evaluation
  async evaluateInterviewAnswer(payload) {
    const response = await fetch(`${API_BASE_URL}/api/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Answer evaluation failed');
    }
    return result.data;
  },

  // 7. Get Past Analysis Reports
  async getReports() {
    const response = await fetch(`${API_BASE_URL}/api/reports`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to load report history');
    }
    return result.data || [];
  },

  // 8. Get Report By ID
  async getReportById(id) {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to retrieve report');
    }
    return result.data;
  },

  // 9. Delete Report By ID
  async deleteReport(id) {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete report');
    }
    return result;
  },

  // 10. Submit Contact Message
  async submitContact(payload) {
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to send message');
    }
    return result;
  }
};

/**
 * Modern Toast Alert System
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Make API and showToast globally available
window.API = API;
window.showToast = showToast;
