const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: String,
    default: '0 KB'
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  targetRole: {
    type: String,
    required: true,
    trim: true
  },
  jobDescription: {
    type: String,
    default: ''
  },
  rawText: {
    type: String,
    default: ''
  },
  detectedSections: [{
    type: String
  }],
  missingSections: [{
    type: String
  }],
  detectedSkills: [{
    type: String
  }],
  missingSkills: [{
    type: String
  }],
  matchedKeywords: [{
    type: String
  }],
  atsScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  scoreBreakdown: {
    keywords: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    structure: { type: Number, default: 0 },
    formatting: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 }
  },
  strengths: [{
    type: String
  }],
  weaknesses: [{
    type: String
  }],
  suggestions: [{
    type: String
  }],
  aiSummary: {
    type: String,
    default: ''
  },
  aiSuggestions: {
    type: Array,
    default: []
  },
  jobMatchScore: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
