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

  async function loadQuestions() {
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

      if (aiNoticeBox && response.isAiConfigured === false) {
        aiNoticeBox.style.display = 'block';
        aiNoticeBox.innerHTML = `
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.88rem; display: flex; align-items: center; justify-content: space-between;">
            <span>ℹ️ <strong>Curated Question Bank:</strong> Add <code>GEMINI_API_KEY</code> in <code>backend/.env</code> to unlock real-time Gemini LLM question generation.</span>
            <span class="badge badge-accent">Template Bank</span>
          </div>
        `;
      } else if (aiNoticeBox) {
        aiNoticeBox.style.display = 'none';
      }

      renderQuestions(allQuestions);
    } catch (err) {
      console.error('Failed to load questions:', err);
      if (questionsContainer) {
        questionsContainer.innerHTML = '<p style="color: var(--color-danger); text-align: center;">Could not load interview questions. Please try again.</p>';
      }
    }
  }

  function renderQuestions(questions) {
    if (!questionsContainer) return;
    questionsContainer.innerHTML = '';

    if (questions.length === 0) {
      questionsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No questions match this category.</p>';
      return;
    }

    questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'card card-hover';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '10px';

      const diffClass = q.difficulty === 'Hard' ? 'badge-danger' : (q.difficulty === 'Medium' ? 'badge-warning' : 'badge-success');

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 8px;">
            <span class="badge badge-accent">${q.category || 'Technical'}</span>
            <span class="badge ${diffClass}">${q.difficulty || 'Medium'}</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Q#${idx + 1}</span>
        </div>

        <h3 style="font-size: 1.15rem; color: var(--text-primary); line-height: 1.4; margin: 4px 0;">
          ${q.question}
        </h3>

        ${q.context ? `<p style="font-size: 0.82rem; color: var(--text-muted);"><em>Context: ${q.context}</em></p>` : ''}

        <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
          <button class="btn btn-primary btn-sm btn-start-practice" data-index="${idx}">
            <span>🎙️</span> Practice Answering
          </button>
        </div>
      `;

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

      const filter = btn.getAttribute('data-filter');
      if (filter === 'all') {
        renderQuestions(allQuestions);
      } else {
        const filtered = allQuestions.filter(q => q.category === filter);
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
