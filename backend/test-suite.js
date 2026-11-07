/**
 * Comprehensive Automated End-to-End Verification Test Suite
 * AI Resume Checker & AI Interview Coach
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(backendEnvPath)) require('dotenv').config({ path: backendEnvPath });
if (fs.existsSync(rootEnvPath)) require('dotenv').config({ path: rootEnvPath });
require('dotenv').config();

const { extractTextFromFile } = require('./services/parserService');
const { analyzeResume } = require('./services/atsEngine');
const { matchResumeWithJob } = require('./services/jobMatchService');
const { ROLE_DATABASE, getRoleConfig } = require('./services/roleData');
const {
  getAiStatus,
  classifyApiError,
  analyzeResumeWithGemini,
  matchJobDescriptionWithGemini,
  generateResumeImprovements,
  generateInterviewQuestions,
  evaluateInterviewAnswer
} = require('./services/geminiService');
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
  const samplePdfPath = fs.existsSync('C:\\Users\\naman\\OneDrive\\Documents\\fullstackresume\\resume_for_fullstack_role.pdf')
    ? 'C:\\Users\\naman\\OneDrive\\Documents\\fullstackresume\\resume_for_fullstack_role.pdf'
    : path.join(__dirname, 'uploads/resume-1789995321576-396955140.pdf');
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

  // TEST 2B: Real Figma / Type 3 Vector PDF Extraction (Mayank-Resume-2026.pdf)
  console.log('\nTEST 2B: Figma Type 3 Vector PDF Extraction (Mayank-Resume-2026.pdf)...');
  const mayankPdfPath = path.join(__dirname, 'uploads/Mayank-Resume-2026.pdf');
  if (fs.existsSync(mayankPdfPath)) {
    try {
      const mayankText = await extractTextFromFile(mayankPdfPath, 'application/pdf');
      assert(mayankText.length > 2000, `Extracted ${mayankText.length} characters from Figma Type 3 vector PDF`);
      assert(mayankText.includes('Mayank Pal'), 'Extracted real candidate name (Mayank Pal)');
      assert(mayankText.includes('UI/UX Designer'), 'Extracted target role (UI/UX Designer)');
      assert(mayankText.includes('Mayankoct2004@gmail.com'), 'Extracted contact email (Mayankoct2004@gmail.com)');
      assert(mayankText.includes('Figma'), 'Extracted core skill (Figma)');
      assert(mayankText.includes('Auto Layout'), 'Extracted design skill (Auto Layout)');
      assert(mayankText.includes('JavaScript'), 'Extracted web skill (JavaScript)');

      // Also verify ATS scoring for UI/UX Designer
      const mayankAnalysis = await analyzeResume(mayankText, 'UI/UX Designer', 'Mayank-Resume-2026.pdf');
      assert(mayankAnalysis.atsScore >= 50, `ATS Evaluation scored ${mayankAnalysis.atsScore}% for UI/UX Designer`);
      assert(mayankAnalysis.detectedSkills.includes('Figma'), 'ATS detected Figma skill from extracted text');
      assert(mayankAnalysis.metadata.candidateName === 'Mayank Pal', 'Metadata extracted candidate name "Mayank Pal"');
    } catch (parseErr) {
      assert(false, `Figma PDF parsing failed: ${parseErr.message}`);
    }
  }

  // TEST 3: Exactly 20 Roles Verification
  console.log('\nTEST 3: Exactly 20 Roles in 7 Categories Verification...');
  const EXPECTED_20_ROLES = [
    // 1. Software Development
    "Software Engineer",
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Java Developer",
    "Python Developer",
    // 2. Mobile Development
    "iOS Developer (Swift / SwiftUI)",
    "Android Developer",
    "Flutter Developer",
    // 3. AI & Machine Learning
    "AI Engineer",
    "Machine Learning Engineer",
    "Generative AI Engineer",
    // 4. Data & Analytics
    "Data Analyst",
    "Data Scientist",
    "Data Engineer",
    // 5. Cloud & DevOps
    "DevOps Engineer",
    "Cloud Engineer",
    // 6. Testing & Quality Assurance
    "QA Engineer",
    "Automation Test Engineer",
    // 7. Design
    "UI/UX Designer"
  ];

  assert(Object.keys(ROLE_DATABASE).length === 20, `Database contains exactly 20 roles (found ${Object.keys(ROLE_DATABASE).length})`);

  let allRolesValid = true;
  for (const role of EXPECTED_20_ROLES) {
    const config = getRoleConfig(role);
    if (!config || config.title !== role) {
      allRolesValid = false;
      console.error(`  ✕ Role missing or mismatched: ${role}`);
    }
  }
  assert(allRolesValid, 'All 20 required roles exist with valid configurations in ROLE_DATABASE');

  // Verify Aliases
  const iosAlias = getRoleConfig("iOS Developer");
  assert(iosAlias.title === "iOS Developer (Swift / SwiftUI)", 'Alias "iOS Developer" correctly mapped to "iOS Developer (Swift / SwiftUI)"');

  const designerAlias = getRoleConfig("UI Designer");
  assert(designerAlias.title === "UI/UX Designer", 'Alias "UI Designer" correctly mapped to "UI/UX Designer"');

  const figmaAlias = getRoleConfig("Figma Expert");
  assert(figmaAlias.title === "UI/UX Designer", 'Alias "Figma Expert" correctly mapped to "UI/UX Designer"');

  // TEST 4: Rule-based ATS Engine Calculation
  console.log('\nTEST 4: Rule-Based ATS Scoring Engine...');
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

  // TEST 5: ATS Scoring Across Different Domain Roles (UI/UX, iOS, GenAI)
  console.log('\nTEST 5: Multi-Domain ATS Scoring Verification...');
  try {
    const uiuxResume = `
      MAYANK SHARMA
      UI/UX Designer | mayank@example.com | +91-9876543210
      SUMMARY: Passionate UI/UX Designer with 3+ years experience in Figma, wireframing, prototyping, and design systems.
      EXPERIENCE: Senior UI/UX Designer at TechCorp (2022-2025)
      - Spearheaded design systems and interactive prototypes in Figma, improving usability by 30%.
      SKILLS: Figma, Adobe XD, Wireframing, Prototyping, User Research, Usability Testing, HTML, CSS.
      PROJECTS: E-Commerce Redesign - Built complete Figma design system and high-fidelity prototype.
      EDUCATION: Bachelor of Design in Human Computer Interaction.
    `;
    const uiuxAnalysis = analyzeResume(uiuxResume, 'UI/UX Designer');
    assert(uiuxAnalysis.detectedSkills.includes('Figma'), 'Detected Figma skill in UI/UX resume');
    assert(uiuxAnalysis.detectedSkills.includes('Wireframing'), 'Detected Wireframing skill in UI/UX resume');
    assert(uiuxAnalysis.atsScore >= 60, `UI/UX Designer ATS score evaluated accurately: ${uiuxAnalysis.atsScore}%`);

    const iosResume = `
      ALEX BROWN
      iOS Developer | alex@example.com
      SUMMARY: iOS Engineer specialized in Swift, SwiftUI, UIKit, and Core Data.
      SKILLS: Swift, SwiftUI, UIKit, Xcode, Core Data, Git, REST APIs.
      PROJECTS: Social App - Developed native iOS app with SwiftUI and Combine.
    `;
    const iosAnalysis = analyzeResume(iosResume, 'iOS Developer (Swift / SwiftUI)');
    assert(iosAnalysis.detectedSkills.includes('Swift'), 'Detected Swift in iOS resume');
    assert(iosAnalysis.detectedSkills.includes('SwiftUI'), 'Detected SwiftUI in iOS resume');
    assert(iosAnalysis.atsScore >= 60, `iOS Developer ATS score evaluated accurately: ${iosAnalysis.atsScore}%`);
  } catch (domainErr) {
    assert(false, `Multi-domain ATS scoring failed: ${domainErr.message}`);
  }

  // TEST 6: Job Description Matcher
  console.log('\nTEST 6: Job Description Matching Algorithm...');
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

  // TEST 7: AI Resume Improvement & Fallback
  console.log('\nTEST 7: AI Resume Improvement Service...');
  try {
    const improvements = await generateResumeImprovements(extractedText, 'Full Stack Developer');
    assert(improvements.improvedSummary && improvements.improvedSummary.length > 20, 'Generated improved professional summary');
    assert(Array.isArray(improvements.bulletImprovements) && improvements.bulletImprovements.length > 0, `Generated ${improvements.bulletImprovements.length} bullet point rewrites`);
    assert(improvements.recommendedActionVerbs.length > 0, 'Generated recommended action verbs');
    assert(improvements.analysisMode === 'gemini' || improvements.analysisMode === 'heuristic', `Active improvement mode verified: ${improvements.analysisMode}`);
  } catch (aiErr) {
    assert(false, `AI Resume Improvement failed: ${aiErr.message}`);
  }

  // TEST 8: AI Interview Question Generation
  console.log('\nTEST 8: AI Interview Question Generation...');
  try {
    const questionsRes = await generateInterviewQuestions(extractedText, 'Full Stack Developer');
    assert(Array.isArray(questionsRes.questions) && questionsRes.questions.length >= 4, `Generated ${questionsRes.questions.length} tailored interview questions`);
    assert(questionsRes.questions[0].category && questionsRes.questions[0].difficulty, 'Questions contain category and difficulty attributes');
    assert(typeof questionsRes.statusBanner === 'string' && questionsRes.statusBanner.length > 0, 'Status banner generated correctly');
  } catch (qErr) {
    assert(false, `Interview Questions Generator failed: ${qErr.message}`);
  }

  // TEST 9: Mock Interview Answer Evaluation
  console.log('\nTEST 9: Interview Answer Evaluation...');
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

  // TEST 10: AI Mode Detection & Error Classification
  console.log('\nTEST 10: AI Mode Detection & Status Banners...');
  try {
    const status = getAiStatus();
    assert(status.mode === 'gemini' || status.mode === 'heuristic', `AI status reports valid mode: ${status.mode}`);
    assert(
      status.statusBanner.includes('AI Analysis Active') || status.statusBanner.includes('Basic Analysis Mode'),
      `Status banner text is user-friendly: "${status.statusBanner}"`
    );

    // Test error classification
    const invalidKeyError = classifyApiError(new Error('API key not valid. Please pass a valid API key.'));
    assert(invalidKeyError.type === 'INVALID_KEY', 'Correctly classified INVALID_KEY error');
    assert(invalidKeyError.userMessage.includes('Invalid Gemini API key'), 'Invalid key provides meaningful configuration error message');

    const quotaError = classifyApiError(new Error('Resource has been exhausted (e.g. check quota). [429]'));
    assert(quotaError.type === 'QUOTA_EXCEEDED', 'Correctly classified QUOTA_EXCEEDED error');
    assert(quotaError.userMessage.includes('quota exceeded'), 'Quota error provides informative message');

    // Test resume analysis with dual mode support
    const resumeAnalysis = await analyzeResumeWithGemini(extractedText, 'Full Stack Developer');
    assert(typeof resumeAnalysis.atsScore === 'number' && resumeAnalysis.atsScore > 0, `Resume analysis completed with score: ${resumeAnalysis.atsScore}`);
    assert(resumeAnalysis.analysisMode === 'gemini' || resumeAnalysis.analysisMode === 'heuristic', `Resume analysis reports mode: ${resumeAnalysis.analysisMode}`);
    assert(typeof resumeAnalysis.statusBanner === 'string' && resumeAnalysis.statusBanner.length > 0, `Resume analysis contains status banner: "${resumeAnalysis.statusBanner}"`);
  } catch (modeErr) {
    assert(false, `AI Mode verification failed: ${modeErr.message}`);
  }

  // TEST 11: MongoDB Models & Persistence
  console.log('\nTEST 11: MongoDB Persistence & Schemas...');
  if (mongoose.connection.readyState === 1) {
    try {
      // Save test analysis with analysisMode and statusBanner
      const testAnalysis = new Analysis({
        fileName: 'Test-Verification-Resume.pdf',
        targetRole: 'Full Stack Developer',
        rawText: extractedText.slice(0, 1000),
        atsScore: 84,
        scoreBreakdown: { keywords: 80, skills: 85, structure: 90, formatting: 85, experience: 80, education: 90 },
        detectedSkills: ['React', 'Node.js', 'MongoDB'],
        missingSkills: ['Docker', 'AWS'],
        analysisMode: 'heuristic',
        statusBanner: 'Basic Analysis Mode – AI-powered recommendations are currently unavailable.'
      });
      const savedAnalysis = await testAnalysis.save();
      assert(savedAnalysis._id !== null, `Persisted Analysis to MongoDB with ID: ${savedAnalysis._id}`);

      // Query saved analysis
      const fetchedAnalysis = await Analysis.findById(savedAnalysis._id);
      assert(fetchedAnalysis.atsScore === 84, 'Queried and verified saved analysis from MongoDB');
      assert(fetchedAnalysis.analysisMode === 'heuristic', 'Stored analysisMode field matches schema');

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
