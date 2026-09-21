const express = require('express');
const router = express.Router();
const {
  getResumeImprovements,
  getInterviewQuestions,
  evaluateAnswer
} = require('../controllers/aiController');

// AI Resume improvement tips & rewrites
router.post('/improve', getResumeImprovements);

// Generate questions based on actual resume + target role
router.post('/questions', getInterviewQuestions);

// Evaluate candidate interview answer
router.post('/evaluate', evaluateAnswer);

module.exports = router;
