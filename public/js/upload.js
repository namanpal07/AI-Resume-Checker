/**
 * AI Resume Coach - Resume Upload Logic
 * Professional Blue Visual Identity & Progress Tracking
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load Selected Job Role
  const selectedRole = localStorage.getItem('selectedRole') || 'Software Engineer';
  const roleBadge = document.getElementById('target-role-badge');
  const headerRole = document.getElementById('headerTargetRole');
  if (roleBadge) roleBadge.textContent = selectedRole;
  if (headerRole) headerRole.textContent = selectedRole;

  // 2. DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const btnBrowseFiles = document.getElementById('btnBrowseFiles');
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  const btnContinue = document.getElementById('btnContinue');

  // Status & Progress Elements
  const statusPanel = document.getElementById('uploadStatusPanel');
  const progressFill = document.getElementById('uploadProgressFill');
  const progressPercent = document.getElementById('uploadPercent');
  const statusTitle = document.getElementById('uploadStatusTitle');
  const stepUpload = document.getElementById('statusStepUpload');
  const stepParse = document.getElementById('statusStepParse');
  const stepReady = document.getElementById('statusStepReady');
  const feedbackBox = document.getElementById('uploadFeedbackBox');

  let selectedFile = null;

  // 3. Browse Button & Dropzone Click
  if (btnBrowseFiles) {
    btnBrowseFiles.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  // 4. File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // 5. Drag & Drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
    dropzone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  ['dragenter', 'dragover'].forEach(evtName => {
    dropzone.addEventListener(evtName, () => dropzone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(evtName => {
    dropzone.addEventListener(evtName, () => dropzone.classList.remove('dragover'), false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  function clearFeedback() {
    if (feedbackBox) {
      feedbackBox.className = 'upload-feedback-box';
      feedbackBox.style.display = 'none';
      feedbackBox.textContent = '';
    }
  }

  function showFeedback(message, type = 'error') {
    if (feedbackBox) {
      feedbackBox.className = `upload-feedback-box ${type}`;
      feedbackBox.style.display = 'flex';
      feedbackBox.textContent = message;
    }
  }

  // 6. Handle file selection & validation
  function handleFileSelection(file) {
    clearFeedback();
    const allowedExtensions = ['pdf', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      showFeedback('Please upload a valid PDF or DOCX file.', 'error');
      if (typeof showToast === 'function') {
        showToast('Only PDF and DOCX files are supported.', 'error');
      }
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      showFeedback('File size exceeds the 5MB limit. Please choose a smaller file.', 'error');
      if (typeof showToast === 'function') {
        showToast('File size exceeds 5MB limit.', 'error');
      }
      return;
    }

    if (file.size === 0) {
      showFeedback('The selected file is empty (0 bytes).', 'error');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = formatBytes(file.size);

    filePreview.style.display = 'flex';
    btnContinue.disabled = false;
    if (statusPanel) statusPanel.style.display = 'none';
    if (typeof showToast === 'function') {
      showToast(`Selected: ${file.name}`, 'info');
    }
  }

  // 7. Remove selected file
  btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
    btnContinue.disabled = true;
    if (statusPanel) statusPanel.style.display = 'none';
    if (progressFill) {
      progressFill.style.width = '0%';
      progressFill.style.background = '';
    }
    if (progressPercent) {
      progressPercent.textContent = '0%';
      progressPercent.style.color = '';
    }
    clearFeedback();
  });

  // Helper formatting bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // 8. Upload & Parse File with visual progress tracking
  btnContinue.addEventListener('click', async () => {
    if (!selectedFile) return;

    btnContinue.disabled = true;
    btnRemoveFile.disabled = true;
    clearFeedback();

    if (progressFill) {
      progressFill.style.background = '';
    }
    if (progressPercent) {
      progressPercent.style.color = '';
    }

    if (statusPanel) {
      statusPanel.style.display = 'block';
      progressFill.style.width = '25%';
      progressPercent.textContent = '25%';
      statusTitle.textContent = 'Uploading resume document...';
      stepUpload.className = 'parsing-step active';
      stepUpload.querySelector('.parsing-step-icon').textContent = '●';
      stepParse.className = 'parsing-step';
      stepParse.querySelector('.parsing-step-icon').textContent = '○';
      stepParse.querySelector('.parsing-step-icon').style.color = '';
      stepReady.className = 'parsing-step';
      stepReady.querySelector('.parsing-step-icon').textContent = '○';
    }

    let progressTimer = null;
    try {
      // Simulate transfer progress before request resolves
      progressTimer = setTimeout(() => {
        if (progressFill && progressFill.style.width === '25%') {
          progressFill.style.width = '60%';
          progressPercent.textContent = '60%';
          statusTitle.textContent = 'Extracting resume text...';
          stepUpload.className = 'parsing-step completed';
          stepUpload.querySelector('.parsing-step-icon').textContent = '✓';
          stepParse.className = 'parsing-step active';
          stepParse.querySelector('.parsing-step-icon').textContent = '●';
        }
      }, 400);

      const uploadedData = await API.uploadResume(selectedFile, selectedRole);
      clearTimeout(progressTimer);

      // Successfully parsed!
      if (progressFill) {
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        statusTitle.textContent = 'Resume text extracted successfully!';
        stepParse.className = 'parsing-step completed';
        stepParse.querySelector('.parsing-step-icon').textContent = '✓';
        stepReady.className = 'parsing-step completed';
        stepReady.querySelector('.parsing-step-icon').textContent = '✓';
      }

      showFeedback('Resume parsed successfully! Directing to ATS evaluation...', 'success');

      // Store parsed text and details for analysis phase
      localStorage.setItem('uploadedFileName', uploadedData.fileName);
      localStorage.setItem('uploadedFileSize', uploadedData.fileSize);
      localStorage.setItem('uploadedFileType', uploadedData.fileType);
      localStorage.setItem('uploadedRawText', uploadedData.rawText);

      setTimeout(() => {
        window.location.href = 'analysis.html';
      }, 650);
    } catch (error) {
      clearTimeout(progressTimer);
      console.error('Upload error:', error);
      const errMsg = error.message || 'Failed to parse resume document.';
      showFeedback(errMsg, 'error');
      if (typeof showToast === 'function') {
        showToast(errMsg, 'error');
      }

      if (statusPanel) {
        statusTitle.textContent = 'Parsing failed';
        if (progressFill) {
          progressFill.style.width = '100%';
          progressFill.style.background = 'var(--color-danger, #cf6262)';
        }
        if (progressPercent) {
          progressPercent.textContent = 'Failed';
          progressPercent.style.color = 'var(--color-danger, #cf6262)';
        }
        stepUpload.className = 'parsing-step completed';
        stepUpload.querySelector('.parsing-step-icon').textContent = '✓';
        stepParse.className = 'parsing-step error';
        stepParse.querySelector('.parsing-step-icon').textContent = '✕';
        stepParse.querySelector('.parsing-step-icon').style.color = 'var(--color-danger, #cf6262)';
      }

      btnContinue.disabled = false;
      btnRemoveFile.disabled = false;
    }
  });
});
