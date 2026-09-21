const express = require('express');
const router = express.Router();
const {
  uploadResume,
  analyzeResumeData,
  compareJobDescription,
  getReports,
  getReportById,
  deleteReport
} = require('../controllers/resumeController');

// Upload & extract text from PDF/DOCX
router.post('/upload', uploadResume);

// Run ATS analysis & store report
router.post('/analyze', analyzeResumeData);

// Match resume against Job Description
router.post('/job-match', compareJobDescription);

// Reports history
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.delete('/reports/:id', deleteReport);

module.exports = router;
