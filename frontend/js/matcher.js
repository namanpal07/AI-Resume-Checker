/**
 * AI Resume Coach - Job Description Matcher Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const resumeText = localStorage.getItem('uploadedRawText') || '';
  const fileName = localStorage.getItem('uploadedFileName') || 'Resume.pdf';
  const savedRole = localStorage.getItem('selectedRole') || '';

  const fileNameEl = document.getElementById('matcherFileName');
  const previewEl = document.getElementById('resumeTextPreview');
  const roleSelect = document.getElementById('jobRoleSelect');
  const jdInput = document.getElementById('jobDescriptionInput');
  const btnRunMatch = document.getElementById('btnRunMatch');
  const btnClearJd = document.getElementById('btnClearJd');

  const resultsContainer = document.getElementById('matchResultsContainer');
  const matchScoreVal = document.getElementById('matchScoreVal');
  const matchedCountVal = document.getElementById('matchedCountVal');
  const missingCountVal = document.getElementById('missingCountVal');
  const matchBadge = document.getElementById('matchBadge');
  const matchedSkillsList = document.getElementById('matchedSkillsList');
  const missingSkillsList = document.getElementById('missingSkillsList');
  const recommendationsList = document.getElementById('matchRecommendations');

  if (fileNameEl) fileNameEl.textContent = fileName;
  if (previewEl && resumeText) {
    previewEl.textContent = resumeText.slice(0, 1200) + (resumeText.length > 1200 ? '\n\n...[Full resume parsed in memory]...' : '');
  }
  if (roleSelect && savedRole) {
    roleSelect.value = savedRole;
  }

  // Clear button
  if (btnClearJd) {
    btnClearJd.addEventListener('click', () => {
      jdInput.value = '';
      if (resultsContainer) resultsContainer.style.display = 'none';
    });
  }

  // Run match button
  if (btnRunMatch) {
    btnRunMatch.addEventListener('click', async () => {
      if (!resumeText || resumeText.trim().length === 0) {
        showToast('Please upload a resume first before running job comparison.', 'warning');
        return;
      }

      const jdText = jdInput.value.trim();
      const selectedRole = roleSelect.value;

      if (!jdText && !selectedRole) {
        showToast('Please either paste a job description or choose a predefined role.', 'warning');
        return;
      }

      btnRunMatch.disabled = true;
      btnRunMatch.innerHTML = `<span>⏳</span> Comparing...`;

      try {
        const lastReportId = localStorage.getItem('lastReportId') || null;
        const matchData = await API.matchJobDescription({
          resumeText,
          jobDescription: jdText,
          roleName: selectedRole,
          analysisId: lastReportId
        });

        // Display results
        renderMatchResults(matchData);
        showToast(`Job match computed: ${matchData.matchScore}%`, 'success');
      } catch (err) {
        console.error('Job match error:', err);
        showToast(err.message || 'Job match calculation failed', 'error');
      } finally {
        btnRunMatch.disabled = false;
        btnRunMatch.innerHTML = `<span>⚡</span> Run Job Match`;
      }
    });
  }

  function renderMatchResults(data) {
    if (!resultsContainer) return;
    resultsContainer.style.display = 'block';

    if (matchScoreVal) matchScoreVal.textContent = `${data.matchScore}%`;
    if (matchedCountVal) matchedCountVal.textContent = data.matchedCount;
    if (missingCountVal) missingCountVal.textContent = data.missingCount;

    if (matchBadge) {
      if (data.matchScore >= 75) {
        matchBadge.className = 'badge badge-success';
        matchBadge.textContent = `${data.matchScore}% High Match`;
      } else if (data.matchScore >= 55) {
        matchBadge.className = 'badge badge-warning';
        matchBadge.textContent = `${data.matchScore}% Moderate Match`;
      } else {
        matchBadge.className = 'badge badge-danger';
        matchBadge.textContent = `${data.matchScore}% Low Match`;
      }
    }

    // Matched skills chips
    if (matchedSkillsList) {
      matchedSkillsList.innerHTML = '';
      if (data.matchedSkills && data.matchedSkills.length > 0) {
        data.matchedSkills.forEach(s => {
          const chip = document.createElement('span');
          chip.className = 'skill-tag matched';
          chip.textContent = `✓ ${s}`;
          matchedSkillsList.appendChild(chip);
        });
      } else {
        matchedSkillsList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No directly matched technical keywords found.</span>';
      }
    }

    // Missing skills chips
    if (missingSkillsList) {
      missingSkillsList.innerHTML = '';
      if (data.missingSkills && data.missingSkills.length > 0) {
        data.missingSkills.forEach(s => {
          const chip = document.createElement('span');
          chip.className = 'skill-tag missing';
          chip.textContent = `+ ${s}`;
          missingSkillsList.appendChild(chip);
        });
      } else {
        missingSkillsList.innerHTML = '<span style="color: var(--color-success); font-size: 0.85rem;">Great! You cover all key technologies mentioned in this posting.</span>';
      }
    }

    // Recommendations list
    if (recommendationsList) {
      recommendationsList.innerHTML = '';
      (data.recommendations || []).forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
      });
    }

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
