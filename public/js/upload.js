/**
 * AI Resume Coach - Resume Upload Logic
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
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  const btnContinue = document.getElementById('btnContinue');

  let selectedFile = null;

  // 3. Dropzone click opens file browser
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

  // 6. Handle file selection & validation
  function handleFileSelection(file) {
    const allowedExtensions = ['pdf', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      showToast('Error: Please upload a valid PDF or DOCX file.', 'error');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      showToast('Error: File size exceeds the 5MB limit.', 'error');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = formatBytes(file.size);

    filePreview.style.display = 'flex';
    btnContinue.disabled = false;
    showToast(`File selected: ${file.name}`, 'info');
  }

  // 7. Remove selected file
  btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
    btnContinue.disabled = true;
  });

  // 8. Upload & Parse File
  btnContinue.addEventListener('click', async () => {
    if (!selectedFile) return;

    btnContinue.disabled = true;
    btnContinue.innerHTML = `<span>⏳</span> Extracting Text...`;

    try {
      showToast('Uploading and parsing document...', 'info');
      const uploadedData = await API.uploadResume(selectedFile, selectedRole);

      // Store parsed text and details for analysis phase
      localStorage.setItem('uploadedFileName', uploadedData.fileName);
      localStorage.setItem('uploadedFileSize', uploadedData.fileSize);
      localStorage.setItem('uploadedFileType', uploadedData.fileType);
      localStorage.setItem('uploadedRawText', uploadedData.rawText);

      showToast('Resume parsed successfully! Proceeding to ATS scoring...', 'success');
      
      setTimeout(() => {
        window.location.href = 'analysis.html';
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to upload and parse resume file.', 'error');
      btnContinue.disabled = false;
      btnContinue.innerHTML = `<span>🚀</span> Start Real-Time Analysis`;
    }
  });
});
