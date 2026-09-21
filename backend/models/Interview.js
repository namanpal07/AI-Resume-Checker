const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    default: null
  },
  role: {
    type: String,
    required: true
  },
  candidateName: {
    type: String,
    default: 'Candidate'
  },
  questions: [{
    id: { type: String, required: true },
    question: { type: String, required: true },
    category: { type: String, enum: ['Technical', 'Project', 'Experience', 'Behavioral', 'Role-specific'], default: 'Technical' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    context: { type: String, default: '' },
    userAnswer: { type: String, default: '' },
    evaluation: {
      technicalScore: { type: Number, default: 0 },
      clarityScore: { type: Number, default: 0 },
      communicationScore: { type: Number, default: 0 },
      completenessScore: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      modelAnswer: { type: String, default: '' }
    }
  }],
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
