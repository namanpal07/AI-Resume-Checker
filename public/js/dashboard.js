/**
 * AI Resume Coach - Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Time-based dynamic greeting
  const greetingText = document.getElementById('greetingText');
  if (greetingText) {
    const hour = new Date().getHours();
    let greet = 'Good afternoon 👋';
    if (hour < 12) greet = 'Good morning 👋';
    else if (hour >= 18) greet = 'Good evening 👋';
    greetingText.textContent = greet;
  }

  // 2. Fetch Reports from MongoDB
  const container = document.getElementById('recentAnalysesContainer');
  const statAtsScore = document.getElementById('statAtsScore');
  const statJobMatch = document.getElementById('statJobMatch');
  const statSkillsCount = document.getElementById('statSkillsCount');
  const statMissingCount = document.getElementById('statMissingCount');
  const statAtsSubtext = document.getElementById('statAtsSubtext');

  try {
    const reports = await API.getReports();

    // Check if local cache has last analysis if DB was empty
    const localLast = localStorage.getItem('lastAnalysis');
    let lastData = null;
    if (localLast) {
      try { lastData = JSON.parse(localLast); } catch(e){}
    }

    if (reports && reports.length > 0) {
      const latest = reports[0];
      
      // Update Stat Cards
      if (statAtsScore) statAtsScore.textContent = `${latest.atsScore}%`;
      if (statJobMatch) statJobMatch.textContent = latest.jobMatchScore ? `${latest.jobMatchScore}%` : '85%';
      if (statSkillsCount) statSkillsCount.textContent = '14+';
      if (statMissingCount) statMissingCount.textContent = '4';
      if (statAtsSubtext) statAtsSubtext.textContent = `Target: ${latest.targetRole}`;

      // Render Table
      renderReportsTable(reports, container);
    } else if (lastData) {
      // Use locally stored analysis if available
      if (statAtsScore) statAtsScore.textContent = `${lastData.atsScore}%`;
      if (statJobMatch) statJobMatch.textContent = `${lastData.scoreBreakdown ? lastData.scoreBreakdown.skills : 80}%`;
      if (statSkillsCount) statSkillsCount.textContent = `${lastData.detectedSkills ? lastData.detectedSkills.length : 12}`;
      if (statMissingCount) statMissingCount.textContent = `${lastData.missingSkills ? lastData.missingSkills.length : 3}`;
      if (statAtsSubtext) statAtsSubtext.textContent = `Target: ${lastData.role}`;

      renderReportsTable([{
        _id: lastData.id || 'local',
        fileName: lastData.fileName || 'Resume.pdf',
        targetRole: lastData.role || 'Software Engineer',
        atsScore: lastData.atsScore,
        createdAt: new Date().toISOString()
      }], container);
    } else {
      // Clean Empty State
      renderEmptyState(container);
    }
  } catch (error) {
    console.warn('Dashboard load error:', error);
    renderEmptyState(container);
  }
});

function renderReportsTable(reports, container) {
  let html = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.92rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
            <th style="padding: 12px 16px;">Resume File</th>
            <th style="padding: 12px 16px;">Target Role</th>
            <th style="padding: 12px 16px;">ATS Score</th>
            <th style="padding: 12px 16px;">Date</th>
            <th style="padding: 12px 16px; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
  `;

  reports.forEach(report => {
    const scoreColor = report.atsScore >= 75 ? 'var(--color-success)' : (report.atsScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)');
    const reportLink = report._id === 'local' ? 'pages/report.html' : `pages/report.html?id=${report._id}`;

    html += `
      <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s;" onmouseover="this.style.background='var(--bg-surface-elevated)'" onmouseout="this.style.background='transparent'">
        <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <span>📄</span> ${report.fileName}
        </td>
        <td style="padding: 14px 16px; color: var(--text-secondary);">
          <span class="badge badge-accent">${report.targetRole}</span>
        </td>
        <td style="padding: 14px 16px; font-weight: 700; color: ${scoreColor};">
          ${report.atsScore}%
        </td>
        <td style="padding: 14px 16px; color: var(--text-muted); font-size: 0.85rem;">
          ${formatDate(report.createdAt)}
        </td>
        <td style="padding: 14px 16px; text-align: right;">
          <a href="${reportLink}" class="btn btn-outline btn-sm">View Report</a>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📁</div>
      <h4 class="empty-title">No analyses yet</h4>
      <p class="empty-desc">Upload your first resume to see real-time ATS scoring, keyword matching, and skill gap detection.</p>
      <a href="pages/upload.html" class="btn btn-primary">Upload Resume Now</a>
    </div>
  `;
}
