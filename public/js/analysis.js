/**
 * AI Resume Coach - Resume Analysis Loading Screen Logic
 * Connects visual animation stages directly to real backend ATS scoring.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const selectedRole = localStorage.getItem('selectedRole') || 'Software Engineer';
  const roleDisplay = document.getElementById('analysis-role-name');
  if (roleDisplay) roleDisplay.textContent = selectedRole;

  const progressBar = document.getElementById('progressBar');
  const progressPercentage = document.getElementById('progressPercentage');
  const progressStatusText = document.getElementById('progressStatusText');
  const errorBox = document.getElementById('errorMessageContainer');

  const rawText = localStorage.getItem('uploadedRawText');
  const fileName = localStorage.getItem('uploadedFileName') || 'Resume.pdf';
  const fileSize = localStorage.getItem('uploadedFileSize') || 'Unknown';
  const fileType = localStorage.getItem('uploadedFileType') || 'application/pdf';

  if (!rawText || rawText.trim().length === 0) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.innerHTML = `<strong>No resume found:</strong> Please go to the upload page and upload your resume first. <br><br><a href="upload.html" class="btn btn-primary btn-sm">Go to Upload</a>`;
    }
    return;
  }

  // Update a visual step
  function updateStep(stepNum, status, statusText) {
    const row = document.getElementById(`step-${stepNum}`);
    if (!row) return;

    const icon = row.querySelector('.step-status-icon');
    row.className = `step-row ${status}`;
    if (icon) {
      icon.className = `step-status-icon ${status}`;
    }
    if (statusText && progressStatusText) {
      progressStatusText.textContent = statusText;
    }
  }

  function setProgress(percent) {
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercentage) progressPercentage.textContent = `${percent}%`;
  }

  // Animate through initial parsing states
  setProgress(20);
  updateStep(1, 'completed');
  updateStep(2, 'loading', 'Extracting resume sections and headers...');

  setTimeout(() => {
    setProgress(45);
    updateStep(2, 'completed');
    updateStep(3, 'loading', 'Identifying technical competencies and keywords...');
  }, 700);

  setTimeout(() => {
    setProgress(70);
    updateStep(3, 'completed');
    updateStep(4, 'loading', 'Calculating rule-based ATS metrics...');
  }, 1400);

  // Send request to real backend ATS engine
  try {
    const analysisPromise = API.analyzeResume({
      rawText,
      targetRole: selectedRole,
      fileName,
      fileSize,
      fileType
    });

    // Ensure at least 2.2 seconds pass so user experiences the visual verification
    const [result] = await Promise.all([
      analysisPromise,
      new Promise(resolve => setTimeout(resolve, 2200))
    ]);

    setProgress(90);
    updateStep(4, 'completed');
    updateStep(5, 'loading', 'Persisting report to database...');

    // Save report in localStorage cache for instant access
    localStorage.setItem('lastAnalysis', JSON.stringify(result));
    if (result.id) {
      localStorage.setItem('lastReportId', result.id);
    }

    setTimeout(() => {
      setProgress(100);
      updateStep(5, 'completed', 'Resume successfully analyzed!');
      showToast('ATS Analysis Complete!', 'success');

      setTimeout(() => {
        if (result.id) {
          window.location.href = `report.html?id=${result.id}`;
        } else {
          window.location.href = 'report.html';
        }
      }, 700);
    }, 600);

  } catch (error) {
    console.error('Analysis failed:', error);
    updateStep(4, 'pending');
    updateStep(5, 'pending');
    if (progressStatusText) progressStatusText.textContent = 'Analysis encountered an error';
    
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.innerHTML = `
        <strong>Analysis Failure:</strong> ${error.message}<br>
        <p style="margin-top: 8px; font-size: 0.85rem;">Please check that your resume file contains readable text or try uploading again.</p>
        <div style="margin-top: 12px;">
          <a href="upload.html" class="btn btn-outline btn-sm">Try Upload Again</a>
        </div>
      `;
    }
  }
});
