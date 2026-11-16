/**
 * AI Resume Coach - AI Interview Coach Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const rawText = localStorage.getItem('uploadedRawText') || '';
  const selectedRole = localStorage.getItem('selectedRole') || 'Software Engineer';

  const roleDisplay = document.getElementById('interviewTargetRoleDisplay');
  const questionsContainer = document.getElementById('questionsContainer');
  const countBadge = document.getElementById('questionsCountBadge');
  const aiNoticeBox = document.getElementById('aiNoticeBox');
  const btnRegenerate = document.getElementById('btnRegenerateQuestions');

  // Practice Section DOM elements
  const practiceSection = document.getElementById('practiceSection');
  const btnClosePractice = document.getElementById('btnClosePractice');
  const activeQuestionText = document.getElementById('activeQuestionText');
  const activeQuestionContext = document.getElementById('activeQuestionContext');
  const activeCategoryBadge = document.getElementById('activeCategoryBadge');
  const activeDifficultyBadge = document.getElementById('activeDifficultyBadge');
  const userAnswerInput = document.getElementById('userAnswerInput');
  const btnSubmitAnswer = document.getElementById('btnSubmitAnswer');
  const btnClearAnswer = document.getElementById('btnClearAnswer');

  // Evaluation Results DOM elements
  const evalResultBox = document.getElementById('evaluationResultBox');
  const evalOverallScore = document.getElementById('evalOverallScore');
  const evalTechScore = document.getElementById('evalTechScore');
  const evalClarityScore = document.getElementById('evalClarityScore');
  const evalCommScore = document.getElementById('evalCommScore');
  const evalFeedbackText = document.getElementById('evalFeedbackText');
  const evalStrengthsList = document.getElementById('evalStrengthsList');
  const evalImprovementsList = document.getElementById('evalImprovementsList');
  const evalModelAnswer = document.getElementById('evalModelAnswer');

  if (roleDisplay) roleDisplay.textContent = selectedRole;

  let allQuestions = [];
  let currentActiveQuestion = null;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadQuestions() {
    if (btnRegenerate) {
      btnRegenerate.disabled = true;
      btnRegenerate.innerHTML = `<span>⏳</span> Generating Questions...`;
    }
    if (questionsContainer) {
      questionsContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 3rem;">Synthesizing questions based on your resume projects and role...</div>';
    }

    try {
      const response = await API.getInterviewQuestions({
        rawText,
        targetRole: selectedRole
      });

      allQuestions = response.questions || [];
      if (countBadge) countBadge.textContent = `${allQuestions.length} Questions Generated`;

      if (aiNoticeBox) {
        aiNoticeBox.style.display = 'block';
        const mode = response.analysisMode || (response.isAiConfigured ? 'gemini' : 'heuristic');
        const isError = !!response.apiErrorType;

        if (mode === 'gemini') {
          aiNoticeBox.innerHTML = `
            <div class="ai-status-banner ai-mode-gemini" style="background: rgba(36, 91, 150, 0.08); border: 1px solid var(--border-subtle); padding: 12px 18px; border-radius: var(--radius-md); font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.15rem;">✨</span>
                <span style="color: var(--text-primary); font-weight: 500;">AI Analysis Active – Your resume is being evaluated using Gemini AI.</span>
              </div>
              <span class="badge badge-accent" style="background: var(--color-primary); color: #fff;">Gemini AI Mode</span>
            </div>
          `;
        } else if (isError) {
          aiNoticeBox.innerHTML = `
            <div class="ai-status-banner ai-mode-error" style="background: rgba(207, 98, 98, 0.08); border: 1px solid rgba(207, 98, 98, 0.3); padding: 12px 18px; border-radius: var(--radius-md); font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.15rem;">⚠️</span>
                <span style="color: var(--color-danger); font-weight: 500;">${response.statusBanner || 'Configuration Error: Switched to Basic Analysis Mode.'}</span>
              </div>
              <span class="badge badge-danger">Configuration Error</span>
            </div>
          `;
        } else {
          aiNoticeBox.innerHTML = `
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

      renderQuestions(allQuestions);
    } catch (err) {
      console.error('Failed to load questions:', err);
      if (questionsContainer) {
        questionsContainer.innerHTML = '<p style="color: var(--color-danger); text-align: center;">Could not load interview questions. Please try again.</p>';
      }
    } finally {
      if (btnRegenerate) {
        btnRegenerate.disabled = false;
        btnRegenerate.innerHTML = `🔄 Regenerate Questions`;
      }
    }
  }

  function renderQuestions(questions) {
    if (!questionsContainer) return;
    questionsContainer.innerHTML = '';

    if (questions.length === 0) {
      questionsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No questions match this category.</p>';
      return;
    }

    questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'card card-hover';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '12px';
      card.style.background = 'var(--bg-surface-elevated)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = 'var(--radius-lg)';
      card.style.padding = '1.35rem';

      const diffClass = q.difficulty === 'Hard' ? 'badge-danger' : (q.difficulty === 'Medium' ? 'badge-warning' : 'badge-success');

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-accent">${escapeHtml(q.category || 'Technical')}</span>
            <span class="badge ${diffClass}">${escapeHtml(q.difficulty || 'Medium')}</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Question #${idx + 1}</span>
        </div>

        <h3 style="font-size: 1.15rem; color: var(--text-primary); line-height: 1.4; margin: 2px 0;">
          ${escapeHtml(q.question)}
        </h3>

        ${q.context ? `<p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;"><em>💡 Resume Context: ${escapeHtml(q.context)}</em></p>` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
          <button class="btn btn-outline btn-sm btn-toggle-breakdown" style="padding: 6px 12px; font-size: 0.82rem; display: flex; align-items: center; gap: 6px;">
            <span>🔍</span> View Coach Breakdown ▾
          </button>
          <button class="btn btn-primary btn-sm btn-start-practice" data-index="${idx}">
            <span>🎙️</span> Practice Answering
          </button>
        </div>

        <!-- EXPANDABLE ACCORDION COACH BREAKDOWN -->
        <div class="coach-breakdown-details" style="display: none; margin-top: 8px; padding-top: 14px; border-top: 1px dashed var(--border-subtle); flex-direction: column; gap: 12px;">
          <div>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              🎯 What the Interviewer Wants to Know
            </div>
            <div style="font-size: 0.88rem; color: var(--text-primary); background: var(--bg-surface); padding: 10px 14px; border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); line-height: 1.5;">
              ${escapeHtml(q.whatInterviewerWants || 'Assesses technical depth, architectural ownership, and clear reasoning.')}
            </div>
          </div>

          ${Array.isArray(q.keyConcepts) && q.keyConcepts.length > 0 ? `
            <div>
              <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                🔑 Important Concepts to Cover
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${q.keyConcepts.map(c => `<span class="badge badge-accent" style="font-size: 0.78rem; padding: 4px 10px;">${escapeHtml(c)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <div>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              📐 Suggested Answer Structure
            </div>
            <div style="font-size: 0.86rem; color: var(--text-muted); background: var(--bg-surface); padding: 8px 12px; border-radius: var(--radius-md); line-height: 1.4;">
              ${escapeHtml(q.answerStructure || 'STAR Method: Situation, Task, Action, and Measurable Result.')}
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-success); text-transform: uppercase; letter-spacing: 0.5px;">
                💬 Model Answer (Tailored to Your Resume)
              </div>
              <button class="btn btn-outline btn-sm btn-copy-sample" style="padding: 2px 8px; font-size: 0.75rem;">
                📋 Copy
              </button>
            </div>
            <div style="font-size: 0.88rem; color: var(--text-primary); background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--color-success); padding: 10px 14px; border-radius: 0 var(--radius-md) var(--radius-md) 0; line-height: 1.5; white-space: pre-wrap;">
              ${escapeHtml(q.sampleAnswer || 'Model answer demonstrating practical implementation and quantitative results.')}
            </div>
          </div>
        </div>
      `;

      // Accordion toggle handler
      const toggleBtn = card.querySelector('.btn-toggle-breakdown');
      const detailsBox = card.querySelector('.coach-breakdown-details');
      if (toggleBtn && detailsBox) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = detailsBox.style.display === 'none';
          detailsBox.style.display = isHidden ? 'flex' : 'none';
          toggleBtn.innerHTML = isHidden 
            ? `<span>🔍</span> Hide Coach Breakdown ▴` 
            : `<span>🔍</span> View Coach Breakdown ▾`;
        });
      }

      // Copy Sample Answer handler
      const copyBtn = card.querySelector('.btn-copy-sample');
      if (copyBtn && q.sampleAnswer) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(q.sampleAnswer);
          showToast('Copied model answer to clipboard!', 'success');
        });
      }

      // Practice button handler
      const practiceBtn = card.querySelector('.btn-start-practice');
      if (practiceBtn) {
        practiceBtn.addEventListener('click', () => {
          openPracticeModal(q);
        });
      }

      questionsContainer.appendChild(card);
    });
  }

  function openPracticeModal(q) {
    currentActiveQuestion = q;
    if (activeQuestionText) activeQuestionText.textContent = q.question;
    if (activeQuestionContext) activeQuestionContext.textContent = q.context ? `Context: ${q.context}` : '';
    if (activeCategoryBadge) activeCategoryBadge.textContent = q.category || 'Technical';
    if (activeDifficultyBadge) activeDifficultyBadge.textContent = q.difficulty || 'Medium';

    if (userAnswerInput) userAnswerInput.value = '';
    if (evalResultBox) evalResultBox.style.display = 'none';

    if (practiceSection) {
      practiceSection.style.display = 'block';
      practiceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (btnClosePractice) {
    btnClosePractice.addEventListener('click', () => {
      if (practiceSection) practiceSection.style.display = 'none';
    });
  }

  if (btnClearAnswer) {
    btnClearAnswer.addEventListener('click', () => {
      if (userAnswerInput) userAnswerInput.value = '';
      if (evalResultBox) evalResultBox.style.display = 'none';
    });
  }

  // Submit Answer for AI Evaluation
  if (btnSubmitAnswer) {
    btnSubmitAnswer.addEventListener('click', async () => {
      if (!currentActiveQuestion) return;

      const answerText = (userAnswerInput ? userAnswerInput.value : '').trim();
      if (!answerText) {
        showToast('Please provide an answer to evaluate.', 'warning');
        return;
      }

      btnSubmitAnswer.disabled = true;
      btnSubmitAnswer.innerHTML = `<span>⏳</span> Evaluating Answer...`;

      try {
        const lastReportId = localStorage.getItem('lastReportId') || null;
        const evaluation = await API.evaluateInterviewAnswer({
          question: currentActiveQuestion.question,
          userAnswer: answerText,
          category: currentActiveQuestion.category,
          targetRole: selectedRole,
          analysisId: lastReportId
        });

        renderEvaluation(evaluation);
        showToast('Evaluation Complete!', 'success');
      } catch (err) {
        console.error('Evaluation error:', err);
        showToast('Answer evaluation failed', 'error');
      } finally {
        btnSubmitAnswer.disabled = false;
        btnSubmitAnswer.innerHTML = `<span>🚀</span> Submit for AI Evaluation`;
      }
    });
  }

  function renderEvaluation(data) {
    if (!evalResultBox) return;
    evalResultBox.style.display = 'block';

    if (evalOverallScore) evalOverallScore.textContent = `${data.overallScore || 80}%`;
    if (evalTechScore) evalTechScore.textContent = `${data.technicalScore || 80}%`;
    if (evalClarityScore) evalClarityScore.textContent = `${data.clarityScore || 85}%`;
    if (evalCommScore) evalCommScore.textContent = `${data.communicationScore || 85}%`;

    if (evalFeedbackText) evalFeedbackText.textContent = data.feedback;

    if (evalStrengthsList) {
      evalStrengthsList.innerHTML = '';
      (data.strengths || []).forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        evalStrengthsList.appendChild(li);
      });
    }

    if (evalImprovementsList) {
      evalImprovementsList.innerHTML = '';
      (data.improvements || []).forEach(imp => {
        const li = document.createElement('li');
        li.textContent = imp;
        evalImprovementsList.appendChild(li);
      });
    }

    if (evalModelAnswer) {
      evalModelAnswer.textContent = data.modelAnswer || 'Structure your answer with Situation, Action, Result.';
    }

    evalResultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.className = 'btn btn-outline btn-sm filter-btn';
      });
      btn.className = 'btn btn-primary btn-sm filter-btn active';

      const filter = btn.getAttribute('data-filter') || 'all';
      if (filter === 'all') {
        renderQuestions(allQuestions);
      } else {
        const normFilter = filter.toLowerCase().replace(/[\s-_]/g, '').replace(/s$/, '');
        const filtered = allQuestions.filter(q => {
          const cat = (q.category || '').toLowerCase().replace(/[\s-_]/g, '').replace(/s$/, '');
          return cat === normFilter || cat.includes(normFilter);
        });
        renderQuestions(filtered);
      }
    });
  });

  if (btnRegenerate) {
    btnRegenerate.addEventListener('click', loadQuestions);
  }

  // Initial Load
  loadQuestions();
});
