// 1. Import necessary packages
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// 2. Initialize the Express application
const app = express();

// 3. Define the Port
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_resume_coach';

// 4. Setup Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Connect to MongoDB with graceful error resilience
let isDbConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  isDbConnected = true;
  console.log(' Successfully connected to MongoDB database');
})
.catch((err) => {
  isDbConnected = false;
  console.warn(' MongoDB connection warning:', err.message);
  console.warn(' The application will run with client/memory persistence fallback.');
});

// 6. Import Route Modules
const resumeRoutes = require('./routes/resumeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { analyzeResumeData, compareJobDescription, getReports, getReportById, deleteReport } = require('./controllers/resumeController');
const { getInterviewQuestions, evaluateAnswer } = require('./controllers/aiController');

// 7. Mount API Endpoints
// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Resume Checker backend is running",
    database: isDbConnected ? "Connected" : "Disconnected",
    aiAvailable: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
  });
});

// Resume endpoints
app.use('/api/resumes', resumeRoutes);

// Direct convenient endpoints matching user spec
app.post('/api/ats/analyze', analyzeResumeData);
app.post('/api/job-match', compareJobDescription);
app.use('/api/ai', aiRoutes);
app.post('/api/interview/questions', getInterviewQuestions);
app.post('/api/interview/evaluate', evaluateAnswer);
app.get('/api/reports', getReports);
app.get('/api/reports/:id', getReportById);
app.delete('/api/reports/:id', deleteReport);
app.use('/api/contact', contactRoutes);

// 8. Serve Static Frontend Files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// 9. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 10. Start the Express Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` AI Resume Checker & Interview Coach Server`);
  console.log(` Running on port: ${PORT}`);
  console.log(` Access Frontend: http://localhost:${PORT}/`);
  console.log(` API Health Check: http://localhost:${PORT}/api/health`);
  console.log(` Database Status: ${isDbConnected ? 'Connected' : 'Connecting...'}`);
  console.log(`=========================================`);
});
