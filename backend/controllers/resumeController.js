const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Analysis = require('../models/Analysis');
const { extractTextFromFile } = require('../services/parserService');
const { analyzeResume } = require('../services/atsEngine');
const { matchResumeWithJob } = require('../services/jobMatchService');

// Configure Multer Storage for uploaded resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'resume-' + uniqueSuffix + ext);
  }
});

// File filter for PDF and DOCX only
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || 
      file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX documents are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
}).single('resume');

/**
 * Upload and parse resume file
 */
function uploadResume(req, res) {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a PDF or DOCX resume file to upload.' });
    }

    try {
      const filePath = req.file.path;
      const rawText = await extractTextFromFile(filePath, req.file.mimetype);
      const targetRole = req.body.targetRole || 'Software Engineer';

      return res.status(200).json({
        success: true,
        message: 'Resume parsed successfully',
        data: {
          fileName: req.file.originalname,
          storedFileName: req.file.filename,
          fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
          fileType: req.file.mimetype,
          targetRole: targetRole,
          rawText: rawText,
          textLength: rawText.length
        }
      });
    } catch (parseErr) {
      console.error('Text extraction failed:', parseErr);
      return res.status(422).json({
        success: false,
        error: parseErr.message || "We couldn't extract text from this document. Please ensure it's not password-protected or image-scanned."
      });
    }
  });
}

/**
 * Run rule-based ATS analysis and persist report in MongoDB
 */
async function analyzeResumeData(req, res) {
  try {
    const { rawText, targetRole, fileName, fileSize, fileType, jobDescription } = req.body;

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No resume text provided for analysis.'
      });
    }

    const roleName = targetRole || 'Software Engineer';
    const analysisResult = analyzeResume(rawText, roleName, jobDescription);

    let savedReport = null;

    // Check if database is connected before creating record
    try {
      const newAnalysis = new Analysis({
        fileName: fileName || 'Uploaded-Resume.pdf',
        fileSize: fileSize || 'Unknown',
        fileType: fileType || 'application/pdf',
        targetRole: analysisResult.role,
        jobDescription: jobDescription || '',
        rawText: rawText,
        detectedSections: analysisResult.detectedSections,
        missingSections: analysisResult.missingSections,
        detectedSkills: analysisResult.detectedSkills,
        missingSkills: analysisResult.missingSkills,
        matchedKeywords: analysisResult.matchedKeywords,
        atsScore: analysisResult.atsScore,
        scoreBreakdown: analysisResult.scoreBreakdown,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        suggestions: analysisResult.suggestions
      });

      savedReport = await newAnalysis.save();
    } catch (dbErr) {
      console.warn('Database save skipped (MongoDB offline or uninitialized):', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: savedReport ? savedReport._id : null,
        ...analysisResult,
        fileName: fileName || 'Uploaded-Resume.pdf',
        fileSize: fileSize || 'Unknown'
      }
    });
  } catch (error) {
    console.error('ATS Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to calculate ATS score: ${error.message}`
    });
  }
}

/**
 * Compare resume against custom job description
 */
async function compareJobDescription(req, res) {
  try {
    const { resumeText, jobDescription, roleName, analysisId } = req.body;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required for comparison.'
      });
    }

    const matchResult = matchResumeWithJob(resumeText, {
      jobDescription: jobDescription || '',
      roleName: roleName || ''
    });

    // Optionally update analysis document with match score
    if (analysisId) {
      try {
        await Analysis.findByIdAndUpdate(analysisId, {
          jobDescription: jobDescription || '',
          jobMatchScore: matchResult.matchScore
        });
      } catch (e) {
        console.warn('Could not update analysis with job match score:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: matchResult
    });
  } catch (err) {
    console.error('Job match error:', err);
    return res.status(500).json({
      success: false,
      error: `Job match calculation failed: ${err.message}`
    });
  }
}

/**
 * Fetch past reports
 */
async function getReports(req, res) {
  try {
    const reports = await Analysis.find()
      .select('fileName targetRole atsScore jobMatchScore createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.warn('Failed to load reports from database:', error.message);
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      notice: 'Database reports unavailable'
    });
  }
}

/**
 * Fetch report by ID
 */
async function getReportById(req, res) {
  try {
    const { id } = req.params;
    const report = await Analysis.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Analysis report not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid report ID format.'
    });
  }
}

/**
 * Delete report by ID
 */
async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    await Analysis.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete report.'
    });
  }
}

module.exports = {
  uploadResume,
  analyzeResumeData,
  compareJobDescription,
  getReports,
  getReportById,
  deleteReport
};
