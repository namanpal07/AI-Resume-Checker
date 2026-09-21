const {
  generateResumeImprovements,
  generateInterviewQuestions,
  evaluateInterviewAnswer
} = require('../services/geminiService');
const InterviewSession = require('../models/Interview');

/**
 * Generate AI-powered improvements for resume
 */
async function getResumeImprovements(req, res) {
  try {
    const { rawText, targetRole, weaknesses } = req.body;

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required to generate improvements.'
      });
    }

    const role = targetRole || 'Software Engineer';
    const suggestions = await generateResumeImprovements(rawText, role, weaknesses || []);

    return res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('AI Resume Improvement Error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate AI recommendations: ${error.message}`
    });
  }
}

/**
 * Generate role & resume specific interview questions
 */
async function getInterviewQuestions(req, res) {
  try {
    const { rawText, targetRole } = req.body;

    const role = targetRole || 'Software Engineer';
    const text = rawText || '';

    const questionsData = await generateInterviewQuestions(text, role);

    return res.status(200).json({
      success: true,
      data: questionsData
    });
  } catch (error) {
    console.error('Interview question generation error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate interview questions: ${error.message}`
    });
  }
}

/**
 * Evaluate user's interview answer
 */
async function evaluateAnswer(req, res) {
  try {
    const { question, userAnswer, category, targetRole, analysisId } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Both question and user answer are required for evaluation.'
      });
    }

    const role = targetRole || 'Software Engineer';
    const evaluation = await evaluateInterviewAnswer(question, userAnswer, category || 'Technical', role);

    // Save session if DB is accessible
    try {
      const session = new InterviewSession({
        analysisId: analysisId || null,
        role: role,
        questions: [{
          id: 'q_' + Date.now(),
          question: question,
          category: category || 'Technical',
          userAnswer: userAnswer,
          evaluation: evaluation
        }],
        averageScore: evaluation.overallScore || 75
      });
      await session.save();
    } catch (dbErr) {
      console.warn('Skipped saving interview session to DB:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    return res.status(500).json({
      success: false,
      error: `Evaluation failed: ${error.message}`
    });
  }
}

module.exports = {
  getResumeImprovements,
  getInterviewQuestions,
  evaluateAnswer
};
