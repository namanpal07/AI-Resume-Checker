/**
 * AI Resume Coach - History Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('historyTableContainer');
  const btnRefresh = document.getElementById('btnRefreshHistory');

  async function loadHistory() {
    if (container) {
      container.innerHTML = '<div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">Loading saved reports...</div>';
    }

    try {
      const reports = await API.getReports();

      if (!reports || reports.length === 0) {
        // Check if there is a locally stored analysis
        const local = localStorage.getItem('lastAnalysis');
        if (local) {
          try {
            const data = JSON.parse(local);
            renderHistoryTable([{
              _id: data.id || 'local',
              fileName: data.fileName || 'Uploaded-Resume.pdf',
              targetRole: data.role || 'Software Engineer',
              atsScore: data.atsScore,
              createdAt: new Date().toISOString()
            }]);
            return;
          } catch (e) {}
        }

        renderEmpty();
      } else {
        renderHistoryTable(reports);
      }
    } catch (err) {
      console.warn('History load error:', err);
      renderEmpty();
    }
  }

  function renderHistoryTable(reports) {
    if (!container) return;

    let html = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.92rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
              <th style="padding: 14px 16px;">Resume File</th>
              <th style="padding: 14px 16px;">Targeted Role</th>
              <th style="padding: 14px 16px;">ATS Score</th>
              <th style="padding: 14px 16px;">Analysis Date</th>
              <th style="padding: 14px 16px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    reports.forEach(r => {
      const scoreColor = r.atsScore >= 75 ? 'var(--color-success)' : (r.atsScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)');
      const reportLink = r._id === 'local' ? 'report.html' : `report.html?id=${r._id}`;

      html += `
        <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s;" onmouseover="this.style.background='var(--bg-surface-elevated)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <span>📄</span> ${r.fileName}
          </td>
          <td style="padding: 14px 16px;">
            <span class="badge badge-accent">${r.targetRole}</span>
          </td>
          <td style="padding: 14px 16px; font-weight: 800; font-size: 1.1rem; color: ${scoreColor};">
            ${r.atsScore}%
          </td>
          <td style="padding: 14px 16px; color: var(--text-muted); font-size: 0.85rem;">
            ${formatDate(r.createdAt)}
          </td>
          <td style="padding: 14px 16px; text-align: right;">
            <div style="display: inline-flex; gap: 8px;">
              <a href="${reportLink}" class="btn btn-outline btn-sm">View Report</a>
              ${r._id !== 'local' ? `<button class="btn btn-secondary btn-sm btn-delete-report" data-id="${r._id}" style="color: var(--color-danger);">🗑️</button>` : ''}
            </div>
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

    // Attach delete handlers
    const deleteBtns = container.querySelectorAll('.btn-delete-report');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this analysis report from database history?')) {
          try {
            await API.deleteReport(id);
            showToast('Report deleted from history', 'info');
            loadHistory();
          } catch (err) {
            showToast('Failed to delete report', 'error');
          }
        }
      });
    });
  }

  function renderEmpty() {
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h4 class="empty-title">No analyses yet</h4>
        <p class="empty-desc">Upload your first resume to generate persistent ATS scoring and interview coach recommendations.</p>
        <a href="upload.html" class="btn btn-primary">Upload First Resume</a>
      </div>
    `;
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadHistory);
  }

  loadHistory();
});
