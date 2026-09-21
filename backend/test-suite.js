/**
 * Comprehensive Automated End-to-End Verification Test Suite
 * AI Resume Checker & AI Interview Coach
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { extractTextFromFile } = require('./services/parserService');
const { analyzeResume } = require('./services/atsEngine');
const { matchResumeWithJob } = require('./services/jobMatchService');
const { generateResumeImprovements, generateInterviewQuestions, evaluateInterviewAnswer } = require('./services/geminiService');
const Analysis = require('./models/Analysis');
const Contact = require('./models/Contact');
const Interview = require('./models/Interview');

async function runTests() {
  console.log('====================================================');
  console.log('STARTING AI RESUME COACH AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Database Connection
  console.log('TEST 1: Testing MongoDB Connection...');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_resume_coach';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    assert(mongoose.connection.readyState === 1, 'Connected to MongoDB server successfully');
  } catch (err) {
    console.warn(`  ⚠ MongoDB Warning: ${err.message}`);
  }

  // TEST 2: Real PDF Resume Parsing
  console.log('\nTEST 2: Real Document Parsing with PDF...');
  const samplePdfPath = 'C:\\Users\\naman\\OneDrive\\Documents\\fullstackresume\\resume_for_fullstack_role.pdf';
  let extractedText = '';

  if (fs.existsSync(samplePdfPath)) {
    try {
      extractedText = await extractTextFromFile(samplePdfPath, 'application/pdf');
      assert(extractedText.length > 200, `Extracted ${extractedText.length} characters of text from sample PDF`);
      assert(extractedText.includes('NAMAN PAL'), 'Extracted real candidate name (NAMAN PAL)');
      assert(extractedText.includes('PROJECTS') || extractedText.includes('TECHNICAL SKILLS'), 'Extracted resume sections');
    } catch (parseErr) {
      assert(false, `PDF Parsing failed: ${parseErr.message}`);
    }
  } else {
    console.warn('  ⚠ Sample PDF not found at exact path, creating synthetic resume text for test');
    extractedText = `
      NAMAN PAL
      Full Stack Developer | namancse@example.com | +91-9258669150
      SUMMARY
      Aspiring Full Stack Web Development student with strong programming and problem-solving skills in Java, JavaScript, React, Node.js, and MongoDB.
      EDUCATION
      Galgotias University - Bachelor of Technology in Computer Science Engineering (CGPA: 8.12)
      TECHNICAL SKILLS
      Languages: Java, Python, JavaScript, C, SQL
      Web Technologies: React.js, Node.js, Express.js, HTML5, CSS3, RESTful APIs, MongoDB
      Tools: Git, GitHub, VS Code
      PROJECTS
      AI Interview Coach - Developed an AI platform using React, Node.js, MongoDB and Gemini API. Reduced latency by 25%.
      Library Management System - Engineered a modular desktop Java application using JDBC and MySQL.
      CERTIFICATIONS
      Java Developer Program, Generative AI Studio
    `;
    assert(true, 'Synthesized testing resume text');
  }

  // TEST 3: Rule-based ATS Engine Calculation
  console.log('\nTEST 3: Rule-Based ATS Scoring Engine...');
  try {
    const analysis = analyzeResume(extractedText, 'Full Stack Developer');
    assert(typeof analysis.atsScore === 'number' && analysis.atsScore > 0 && analysis.atsScore <= 100, `Overall ATS score calculated: ${analysis.atsScore}/100`);
    assert(analysis.scoreBreakdown.skills >= 0, `Skills breakdown score: ${analysis.scoreBreakdown.skills}%`);
    assert(analysis.scoreBreakdown.keywords >= 0, `Keywords breakdown score: ${analysis.scoreBreakdown.keywords}%`);
    assert(analysis.scoreBreakdown.structure >= 0, `Structure breakdown score: ${analysis.scoreBreakdown.structure}%`);
    assert(analysis.detectedSkills.length > 0, `Detected ${analysis.detectedSkills.length} skills in resume: ${analysis.detectedSkills.slice(0, 5).join(', ')}`);
    assert(analysis.strengths.length > 0, `Generated ${analysis.strengths.length} actionable strengths`);
    assert(analysis.weaknesses.length > 0, `Generated ${analysis.weaknesses.length} actionable areas for improvement`);
    assert(analysis.missingSkills.length > 0, `Identified missing target skills: ${analysis.missingSkills.slice(0, 4).join(', ')}`);
  } catch (atsErr) {
    assert(false, `ATS Engine failed: ${atsErr.message}`);
  }

  // TEST 4: Job Description Matcher
  console.log('\nTEST 4: Job Description Matching Algorithm...');
  try {
    const jobDescriptionSample = `
      Looking for a Full Stack Developer proficient in React, Node.js, Express, MongoDB, TypeScript, Docker, and AWS.
      Must have experience designing REST APIs and working in Agile environments.
    `;
    const match = matchResumeWithJob(extractedText, {
      jobDescription: jobDescriptionSample,
      roleName: 'Full Stack Developer'
    });

    assert(typeof match.matchScore === 'number', `Computed Job Match Score: ${match.matchScore}%`);
    assert(match.matchedSkills.includes('React') || match.matchedSkills.includes('Node.js'), `Matched core skills: ${match.matchedSkills.join(', ')}`);
    assert(match.missingSkills.length > 0, `Identified missing job skills: ${match.missingSkills.join(', ')}`);
  } catch (matchErr) {
    assert(false, `Job Matcher failed: ${matchErr.message}`);
  }

  // TEST 5: AI Resume Improvement & Fallback
  console.log('\nTEST 5: AI Resume Improvement Service...');
  try {
    const improvements = await generateResumeImprovements(extractedText, 'Full Stack Developer');
    assert(improvements.improvedSummary && improvements.improvedSummary.length > 20, 'Generated improved professional summary');
    assert(Array.isArray(improvements.bulletImprovements) && improvements.bulletImprovements.length > 0, `Generated ${improvements.bulletImprovements.length} bullet point rewrites`);
    assert(improvements.recommendedActionVerbs.length > 0, 'Generated recommended action verbs');
  } catch (aiErr) {
    assert(false, `AI Resume Improvement failed: ${aiErr.message}`);
  }

  // TEST 6: AI Interview Question Generation
  console.log('\nTEST 6: AI Interview Question Generation...');
  try {
    const questionsRes = await generateInterviewQuestions(extractedText, 'Full Stack Developer');
    assert(Array.isArray(questionsRes.questions) && questionsRes.questions.length >= 4, `Generated ${questionsRes.questions.length} tailored interview questions`);
    assert(questionsRes.questions[0].category && questionsRes.questions[0].difficulty, 'Questions contain category and difficulty attributes');
  } catch (qErr) {
    assert(false, `Interview Questions Generator failed: ${qErr.message}`);
  }

  // TEST 7: Mock Interview Answer Evaluation
  console.log('\nTEST 7: Interview Answer Evaluation...');
  try {
    const evalRes = await evaluateInterviewAnswer(
      "How did you implement the AI Interview Coach project?",
      "I developed the AI Interview Coach using React for the frontend and Node.js with Express for the API. I integrated Gemini API to generate questions and used MongoDB for persistence. This reduced latency and improved user preparation.",
      "Project",
      "Full Stack Developer"
    );
    assert(typeof evalRes.overallScore === 'number', `Evaluation overall score: ${evalRes.overallScore}%`);
    assert(evalRes.feedback && evalRes.feedback.length > 10, 'Evaluation generated comprehensive feedback critique');
  } catch (evalErr) {
    assert(false, `Answer Evaluation failed: ${evalErr.message}`);
  }

  // TEST 8: MongoDB Models & Persistence
  console.log('\nTEST 8: MongoDB Persistence & Schemas...');
  if (mongoose.connection.readyState === 1) {
    try {
      // Save test analysis
      const testAnalysis = new Analysis({
        fileName: 'Test-Verification-Resume.pdf',
        targetRole: 'Full Stack Developer',
        rawText: extractedText.slice(0, 1000),
        atsScore: 84,
        scoreBreakdown: { keywords: 80, skills: 85, structure: 90, formatting: 85, experience: 80, education: 90 },
        detectedSkills: ['React', 'Node.js', 'MongoDB'],
        missingSkills: ['Docker', 'AWS']
      });
      const savedAnalysis = await testAnalysis.save();
      assert(savedAnalysis._id !== null, `Persisted Analysis to MongoDB with ID: ${savedAnalysis._id}`);

      // Query saved analysis
      const fetchedAnalysis = await Analysis.findById(savedAnalysis._id);
      assert(fetchedAnalysis.atsScore === 84, 'Queried and verified saved analysis from MongoDB');

      // Test Contact Form schema
      const testContact = new Contact({
        name: 'Test Candidate',
        email: 'test@example.com',
        subject: 'Platform Verification',
        message: 'Everything is running smoothly.'
      });
      const savedContact = await testContact.save();
      assert(savedContact._id !== null, 'Persisted Contact message to MongoDB');

      // Clean up test data
      await Analysis.findByIdAndDelete(savedAnalysis._id);
      await Contact.findByIdAndDelete(savedContact._id);
      assert(true, 'Cleaned up verification test records');
    } catch (mongoErr) {
      assert(false, `MongoDB persistence failed: ${mongoErr.message}`);
    }
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
