/**
 * AI Resume Coach - Resume Improvement Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const rawText = localStorage.getItem('uploadedRawText') || '';
  const selectedRole = localStorage.getItem('selectedRole') || 'Software Engineer';
  const roleBadge = document.querySelector('.current-role-badge');
  if (roleBadge) roleBadge.textContent = selectedRole;

  const summaryBox = document.getElementById('improvedSummaryBox');
  const bulletsContainer = document.getElementById('bulletImprovementsContainer');
  const verbsContainer = document.getElementById('actionVerbsContainer');
  const tipsList = document.getElementById('actionableTipsList');
  const btnCopySummary = document.getElementById('btnCopySummary');
  const btnRefresh = document.getElementById('btnRefreshAi');
  const aiStatusNotice = document.getElementById('aiStatusNotice');

  if (!rawText || rawText.trim().length === 0) {
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem;">
          <h4 class="empty-title">No Resume Found</h4>
          <p class="empty-desc">Please upload your resume first so our engine can generate personalized phrasing enhancements.</p>
          <a href="upload.html" class="btn btn-primary btn-sm">Upload Resume</a>
        </div>
      `;
    }
    if (bulletsContainer) bulletsContainer.innerHTML = '';
    return;
  }

  async function loadImprovements() {
    if (btnRefresh) {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = `<span>⏳</span> Generating...`;
    }

    try {
      // Fetch cached weaknesses from last analysis if present
      let weaknesses = [];
      const cachedAnalysis = localStorage.getItem('lastAnalysis');
      if (cachedAnalysis) {
        try {
          const parsed = JSON.parse(cachedAnalysis);
          weaknesses = parsed.weaknesses || [];
        } catch (e) {}
      }

      const result = await API.getImprovements({
        rawText,
        targetRole: selectedRole,
        weaknesses
      });

      renderImprovements(result);
    } catch (err) {
      console.error('Improvement load failed:', err);
      showToast('Could not load AI recommendations', 'error');
    } finally {
      if (btnRefresh) {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = `<span>✨</span> Generate New Rewrites`;
      }
    }
  }

  function renderImprovements(data) {
    // Show user-friendly mode status banner
    if (aiStatusNotice) {
      aiStatusNotice.style.display = 'block';
      const mode = data.analysisMode || (data.isAiConfigured ? 'gemini' : 'heuristic');
      const isError = !!data.apiErrorType;

      if (mode === 'gemini') {
        aiStatusNotice.innerHTML = `
          <div class="ai-status-banner ai-mode-gemini" style="background: rgba(36, 91, 150, 0.08); border: 1px solid var(--border-subtle); padding: 12px 18px; border-radius: var(--radius-md); font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.15rem;">✨</span>
              <span style="color: var(--text-primary); font-weight: 500;">AI Analysis Active – Your resume is being evaluated using Gemini AI.</span>
            </div>
            <span class="badge badge-accent" style="background: var(--color-primary); color: #fff;">Gemini AI Mode</span>
          </div>
        `;
      } else if (isError) {
        aiStatusNotice.innerHTML = `
          <div class="ai-status-banner ai-mode-error" style="background: rgba(207, 98, 98, 0.08); border: 1px solid rgba(207, 98, 98, 0.3); padding: 12px 18px; border-radius: var(--radius-md); font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.15rem;">⚠️</span>
              <span style="color: var(--color-danger); font-weight: 500;">${data.statusBanner || 'Configuration Error: Switched to Basic Analysis Mode.'}</span>
            </div>
            <span class="badge badge-danger">Configuration Error</span>
          </div>
        `;
      } else {
        aiStatusNotice.innerHTML = `
          <div class="ai-status-banner ai-mode-heuristic" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 12px 18px; border-radius: var(--radius-md); font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.15rem;">📋</span>
              <span style="color: var(--text-secondary); font-weight: 500;">Basic Analysis Mode – AI-powered recommendations are currently unavailable.</span>
            </div>
            <span class="badge badge-outline" style="border: 1px solid var(--border-subtle); color: var(--text-muted);">Template Mode</span>
          </div>
        `;
      }
    }

    // Render Summary
    if (summaryBox) {
      summaryBox.textContent = data.improvedSummary || 'Results-driven developer with proven experience building scalable software.';
    }

    // Render Bullets
    if (bulletsContainer) {
      bulletsContainer.innerHTML = '';
      const bullets = data.bulletImprovements || [];

      if (bullets.length === 0) {
        bulletsContainer.innerHTML = '<p style="color: var(--text-muted);">No specific bullet improvements generated.</p>';
      } else {
        bullets.forEach((b, idx) => {
          const card = document.createElement('div');
          card.style.background = 'var(--bg-surface-elevated)';
          card.style.border = '1px solid var(--border-subtle)';
          card.style.borderRadius = 'var(--radius-lg)';
          card.style.padding = '1.25rem';

          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="badge badge-warning">Original Bullet #${idx + 1}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.92rem; font-style: italic; margin-bottom: 12px; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: var(--radius-md);">
              "${b.original}"
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="badge badge-success">Improved Bullet (${b.actionVerbUsed || 'Active Verb'})</span>
              <button class="btn btn-outline btn-sm btn-copy-bullet" style="padding: 4px 10px; font-size: 0.78rem;">Copy</button>
            </div>
            <p style="color: var(--text-primary); font-weight: 500; font-size: 0.95rem; margin-bottom: 10px; background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--color-success); padding: 10px 14px; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
              ${b.improved}
            </p>

            <p style="font-size: 0.82rem; color: var(--text-muted);">
              <strong>Recruiter impact:</strong> ${b.impactExplanation}
            </p>
          `;

          // Wire up copy button
          const copyBtn = card.querySelector('.btn-copy-bullet');
          if (copyBtn) {
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(b.improved);
              showToast('Copied improved bullet point to clipboard!', 'success');
            });
          }

          bulletsContainer.appendChild(card);
        });
      }
    }

    // Render Action Verbs
    if (verbsContainer) {
      verbsContainer.innerHTML = '';
      const verbs = data.recommendedActionVerbs || ["Spearheaded", "Architected", "Accelerated", "Refactored", "Automated", "Orchestrated"];
      verbs.forEach(v => {
        const chip = document.createElement('span');
        chip.className = 'skill-tag';
        chip.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        chip.style.color = 'var(--accent-blue)';
        chip.textContent = v;
        verbsContainer.appendChild(chip);
      });
    }

    // Render Tips
    if (tipsList) {
      tipsList.innerHTML = '';
      const tips = data.actionableTips || [
        "Begin every bullet point with a high-impact past-tense action verb.",
        "Include measurable impact (e.g. percentages, user counts, latency reduction)."
      ];
      tips.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        tipsList.appendChild(li);
      });
    }
  }

  // Copy Summary Button
  if (btnCopySummary) {
    btnCopySummary.addEventListener('click', () => {
      if (summaryBox) {
        navigator.clipboard.writeText(summaryBox.textContent.trim());
        showToast('Copied summary to clipboard!', 'success');
      }
    });
  }

  // Refresh Button
  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadImprovements);
  }

  // Initial load
  loadImprovements();
});
