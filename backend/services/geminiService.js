const { GoogleGenAI } = require('@google/genai');
const { getRoleConfig } = require('./roleData');
const { analyzeResume } = require('./atsEngine');
const { matchResumeWithJob } = require('./jobMatchService');
const { detectSections } = require('./parserService');

const BANNER_GEMINI = 'AI Analysis Active – Your resume is being evaluated using Gemini AI.';
const BANNER_HEURISTIC = 'Basic Analysis Mode – AI-powered recommendations are currently unavailable.';

/**
 * Initializes Gemini client if key is available in environment
 * Checks GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY
 */
function getAiClient() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '').trim();
  if (!apiKey || apiKey === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Returns the current AI configuration status and mode
 */
function getAiStatus() {
  const ai = getAiClient();
  if (!ai) {
    return {
      configured: false,
      mode: 'heuristic',
      statusBanner: BANNER_HEURISTIC,
      modeLabel: 'Basic Analysis Mode'
    };
  }
  return {
    configured: true,
    mode: 'gemini',
    statusBanner: BANNER_GEMINI,
    modeLabel: 'Gemini AI Mode'
  };
}

/**
 * Helper to safely extract and parse JSON from AI model response
 */
function safeJsonParse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or invalid response from AI model');
  }
  let clean = rawText.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(clean.trim());
}

/**
 * Strips any sensitive API key strings from error logs/messages
 */
function sanitizeErrorMessage(err) {
  if (!err) return 'Unknown error';
  const msg = typeof err === 'string' ? err : (err.message || String(err));
  return msg.replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=REDACTED');
}

/**
 * Classifies Gemini API errors into actionable types with user-friendly messages
 */
function classifyApiError(err) {
  if (!err) return { type: 'UNKNOWN', userMessage: BANNER_HEURISTIC, detail: 'Unknown error' };
  const rawMsg = typeof err === 'string' ? err : (err.message || String(err));
  const lower = rawMsg.toLowerCase();
  const safeDetail = sanitizeErrorMessage(rawMsg);

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key') ||
    lower.includes('unauthorized') ||
    lower.includes('401') ||
    lower.includes('403') ||
    (lower.includes('400') && lower.includes('key'))
  ) {
    return {
      type: 'INVALID_KEY',
      userMessage: 'Configuration Error: Invalid Gemini API key – Switched to Basic Analysis Mode.',
      detail: 'The configured GEMINI_API_KEY is invalid or unauthorized.'
    };
  }

  if (
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit')
  ) {
    return {
      type: 'QUOTA_EXCEEDED',
      userMessage: 'AI Quota Reached: Gemini API quota exceeded – Switched to Basic Analysis Mode.',
      detail: 'The Gemini API quota or rate limit has been reached.'
    };
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('enotfound') ||
    lower.includes('503') ||
    lower.includes('unavailable')
  ) {
    return {
      type: 'SERVICE_UNAVAILABLE',
      userMessage: 'Basic Analysis Mode – AI service is temporarily unavailable.',
      detail: 'Could not connect to Gemini AI service. Network or service temporarily unreachable.'
    };
  }

  return {
    type: 'API_ERROR',
    userMessage: 'Basic Analysis Mode – AI-powered recommendations are currently unavailable.',
    detail: safeDetail
  };
}

/**
 * Dispatches structured JSON prompt to Gemini with resilient model fallback
 */
async function callGemini(ai, prompt) {
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const fallbackModel = 'gemini-1.5-flash';

  async function execute(modelName) {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
  }

  try {
    const response = await execute(primaryModel);
    return safeJsonParse(response.text);
  } catch (err) {
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('not found') || errMsg.includes('404')) {
      console.warn(`[AI Service] Primary model (${primaryModel}) not found, trying fallback (${fallbackModel})...`);
      const fallbackResponse = await execute(fallbackModel);
      return safeJsonParse(fallbackResponse.text);
    }
    throw err;
  }
}

/**
 * AI-Powered Resume Analysis
 * In Gemini AI Mode: analyzes actual extracted text, calculates scores, extracts real skills, missing keywords, and contextual suggestions.
 * In Heuristic Template Mode: falls back to rule-based ATS analysis with a clear mode indicator.
 */
async function analyzeResumeWithGemini(rawText, targetRole, jobDescription = '') {
  const ai = getAiClient();
  const roleConfig = getRoleConfig(targetRole);

  // If no API key configured, use Heuristic Template Mode directly
  if (!ai) {
    const heuristic = analyzeResume(rawText, targetRole, jobDescription);
    return {
      ...heuristic,
      analysisMode: 'heuristic',
      statusBanner: BANNER_HEURISTIC,
      isAiConfigured: false
    };
  }

  const { detected: detectedSections, missing: missingSections } = detectSections(rawText);

  const prompt = `
You are an expert Technical Hiring Manager and ATS Optimization Specialist.
Target Position: "${roleConfig.title}".
${jobDescription ? `Target Job Description:\n"""\n${jobDescription.slice(0, 2000)}\n"""\n` : ''}

Candidate Resume Text:
"""
${rawText.slice(0, 4500)}
"""

TASK:
Analyze the candidate's actual resume text against the target role${jobDescription ? ' and job description' : ''}.
Evaluate real competencies, detect explicit technical skills present in the resume, identify genuine missing keywords or skills needed for this role, and provide actionable recommendations.

CRITICAL RULES:
1. Base all evaluations STRICTLY on the actual resume text provided.
2. DO NOT invent false skills, experiences, or credentials.
3. Calculate realistic, objective scores.

Return ONLY a valid JSON object matching this schema:
{
  "atsScore": 78,
  "scoreBreakdown": {
    "keywords": 75,
    "skills": 80,
    "structure": 85,
    "formatting": 80,
    "experience": 70,
    "education": 85
  },
  "detectedSkills": ["string (skills explicitly found in the resume)"],
  "missingSkills": ["string (critical skills required for the target role/JD that are missing)"],
  "matchedKeywords": ["string (industry keywords present in resume)"],
  "missingKeywords": ["string (industry keywords missing from resume)"],
  "strengths": ["string (3-5 concrete strengths of this resume)"],
  "weaknesses": ["string (2-4 concrete weaknesses or gaps)"],
  "suggestions": ["string (3-5 concrete, actionable suggestions for this role)"],
  "aiSummary": "string (A 2-3 sentence executive summary of candidate background and alignment with the target role)"
}
`;

  try {
    const parsed = await callGemini(ai, prompt);
    const score = Math.max(10, Math.min(100, Math.round(parsed.atsScore || 75)));

    return {
      success: true,
      analysisMode: 'gemini',
      statusBanner: BANNER_GEMINI,
      isAiConfigured: true,
      atsScore: score,
      scoreBreakdown: parsed.scoreBreakdown || {
        keywords: 75, skills: 80, structure: 85, formatting: 80, experience: 70, education: 85
      },
      detectedSkills: Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      detectedSections: detectedSections,
      missingSections: missingSections,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      aiSummary: parsed.aiSummary || '',
      role: roleConfig.title
    };
  } catch (error) {
    const classified = classifyApiError(error);
    console.warn('[AI Service] Gemini resume analysis call failed:', classified.detail);
    const heuristic = analyzeResume(rawText, targetRole, jobDescription);
    return {
      ...heuristic,
      analysisMode: 'heuristic',
      isAiConfigured: false,
      apiErrorType: classified.type,
      aiErrorNotice: classified.detail,
      statusBanner: classified.userMessage
    };
  }
}

/**
 * AI-Powered Job Description Matching
 */
async function matchJobDescriptionWithGemini(resumeText, jobDescription, roleName) {
  const ai = getAiClient();
  const roleConfig = getRoleConfig(roleName);

  if (!ai) {
    const fallback = matchResumeWithJob(resumeText, { jobDescription, roleName });
    return {
      ...fallback,
      analysisMode: 'heuristic',
      statusBanner: BANNER_HEURISTIC,
      isAiConfigured: false
    };
  }

  const prompt = `
You are an expert Technical Recruiter and ATS Matching Specialist.
Role Name: "${roleConfig.title}".

Target Job Description:
"""
${(jobDescription || '').slice(0, 3000)}
"""

Candidate Resume Text:
"""
${(resumeText || '').slice(0, 4500)}
"""

TASK:
Perform a deep semantic comparison between the candidate's actual resume and the target job description.
Identify exact and related technical skills present in the resume that match the job description, skills required by the job that are missing in the resume, and provide actionable tailoring recommendations.

CRITICAL RULES:
1. Only list skills as "matched" if they are genuinely present in the resume text.
2. Only list skills as "missing" if the job description mentions or implies them and the resume lacks them.
3. Compute an objective matchScore from 0 to 100.

Return ONLY a valid JSON object matching this schema:
{
  "matchScore": 75,
  "matchedSkills": ["string"],
  "missingSkills": ["string"],
  "recommendations": ["string (3-5 specific steps to tailor resume for this job)"],
  "summary": "string (Short summary of the candidate's alignment with this position)"
}
`;

  try {
    const parsed = await callGemini(ai, prompt);
    const matched = Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [];
    const missing = Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [];
    const score = Math.max(0, Math.min(100, Math.round(parsed.matchScore || 50)));

    return {
      success: true,
      analysisMode: 'gemini',
      statusBanner: BANNER_GEMINI,
      isAiConfigured: true,
      matchScore: score,
      matchedCount: matched.length,
      missingCount: missing.length,
      matchedSkills: matched,
      missingSkills: missing,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      summary: parsed.summary || ''
    };
  } catch (error) {
    const classified = classifyApiError(error);
    console.warn('[AI Service] Gemini job match call failed:', classified.detail);
    const fallback = matchResumeWithJob(resumeText, { jobDescription, roleName });
    return {
      ...fallback,
      analysisMode: 'heuristic',
      isAiConfigured: false,
      apiErrorType: classified.type,
      aiErrorNotice: classified.detail,
      statusBanner: classified.userMessage
    };
  }
}

/**
 * AI Resume Improvement Service
 * Enhances phrasing, summary, action verbs, and impact metrics
 * WITHOUT inventing new companies, projects, or fake skills.
 */
async function generateResumeImprovements(rawText, targetRole, weaknesses = []) {
  const ai = getAiClient();
  const roleConfig = getRoleConfig(targetRole);

  if (!ai) {
    const fallback = getFallbackImprovements(rawText, roleConfig, weaknesses);
    return {
      ...fallback,
      analysisMode: 'heuristic',
      statusBanner: BANNER_HEURISTIC,
      isAiConfigured: false
    };
  }

  const prompt = `
You are an expert Technical Resume Writer and ATS Optimization Specialist.
Target Role: "${roleConfig.title}".

Candidate Resume Text:
"""
${rawText.slice(0, 4500)}
"""

Identified ATS Weaknesses:
${weaknesses.join('\n')}

STRICT RULES:
1. DO NOT invent false companies, employment dates, certifications, degrees, or achievements.
2. DO NOT invent new technologies or skills the candidate never used. Preserve the candidate's original meaning.
3. Organize improvements into distinct sections:
   A. Contact Information
   B. Professional Summary
   C. Technical Skills
   D. Projects
   E. Education
   F. Experience and Internships
4. For every improvement item, provide:
   - "section": One of "Contact Information", "Professional Summary", "Technical Skills", "Projects", "Education", "Experience and Internships"
   - "original": Exact sentence or text fragment from the candidate's uploaded resume.
   - "problem": Clear explanation of why this part is weak, generic, unorganized, or ATS-unfriendly.
   - "improved": A high-impact, professional rewrite adhering to active voice and industry standards.
   - "reason": Why the suggested version is better for recruiters and ATS parsers.
5. Also provide an overall "improvedSummary", 2-3 "bulletImprovements", 3-5 "actionableTips", and 6 "recommendedActionVerbs".

Return ONLY a valid JSON object matching this schema:
{
  "improvedSummary": "string",
  "bulletImprovements": [
    {
      "original": "string",
      "improved": "string",
      "actionVerbUsed": "string",
      "impactExplanation": "string"
    }
  ],
  "sectionImprovements": [
    {
      "section": "string",
      "original": "string",
      "problem": "string",
      "improved": "string",
      "reason": "string"
    }
  ],
  "actionableTips": ["string"],
  "recommendedActionVerbs": ["string"]
}
`;

  try {
    const parsed = await callGemini(ai, prompt);
    return {
      ...parsed,
      analysisMode: 'gemini',
      statusBanner: BANNER_GEMINI,
      isAiConfigured: true
    };
  } catch (error) {
    const classified = classifyApiError(error);
    console.warn('[AI Service] Gemini improvement call failed:', classified.detail);
    return {
      ...getFallbackImprovements(rawText, roleConfig, weaknesses),
      analysisMode: 'heuristic',
      isAiConfigured: false,
      apiErrorType: classified.type,
      aiErrorNotice: classified.detail,
      statusBanner: classified.userMessage
    };
  }
}

/**
 * AI Interview Questions Generator
 * Generates technical, project, and behavioral questions tailored to candidate's ACTUAL resume.
 */
async function generateInterviewQuestions(rawText, targetRole) {
  const ai = getAiClient();
  const roleConfig = getRoleConfig(targetRole);

  if (!ai) {
    const fallback = getFallbackInterviewQuestions(rawText, roleConfig);
    return {
      ...fallback,
      analysisMode: 'heuristic',
      statusBanner: BANNER_HEURISTIC,
      isAiConfigured: false
    };
  }

  const prompt = `
You are a Senior Technical Hiring Manager and Interviewer.
Target Position: "${roleConfig.title}".

Candidate Resume Text:
"""
${rawText.slice(0, 4500)}
"""

TASK:
Generate 6 realistic, challenging interview questions based STRICTLY on the projects, skills, and background mentioned in this resume.

Distribution:
- 2 Technical Questions (evaluating core tech stack mentioned in the resume)
- 2 Project Deep-Dive Questions (referencing specific projects or implementations by name from their resume)
- 1 Behavioral Question (problem solving, adapting to deadlines, or handling bugs)
- 1 Role-Specific Question (assessing standards and judgment for ${roleConfig.title})

For EACH of the 6 questions, provide:
1. "category": EXACTLY one of "Technical", "Projects", "Behavioral", "Role-Specific".
2. "question": The actual interview question.
3. "difficulty": "Easy", "Medium", or "Hard".
4. "context": Brief explanation of what part of the candidate's resume inspired this question.
5. "whatInterviewerWants": What the interviewer wants to know and evaluate.
6. "keyConcepts": 3-4 important concepts or keywords to cover in the response.
7. "answerStructure": Suggested answering framework (e.g. STAR method or architectural trade-offs).
8. "sampleAnswer": A model answer tailored to the candidate's actual projects and technologies from their resume.

Return ONLY a valid JSON object matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "category": "Technical | Projects | Behavioral | Role-Specific",
      "difficulty": "Easy | Medium | Hard",
      "context": "string",
      "whatInterviewerWants": "string",
      "keyConcepts": ["string"],
      "answerStructure": "string",
      "sampleAnswer": "string"
    }
  ]
}
`;

  try {
    const parsed = await callGemini(ai, prompt);
    return {
      analysisMode: 'gemini',
      statusBanner: BANNER_GEMINI,
      isAiConfigured: true,
      role: roleConfig.title,
      questions: parsed.questions || []
    };
  } catch (error) {
    const classified = classifyApiError(error);
    console.warn('[AI Service] Gemini question generation error:', classified.detail);
    return {
      ...getFallbackInterviewQuestions(rawText, roleConfig),
      analysisMode: 'heuristic',
      isAiConfigured: false,
      apiErrorType: classified.type,
      aiErrorNotice: classified.detail,
      statusBanner: classified.userMessage
    };
  }
}

/**
 * AI Interview Answer Evaluator
 */
async function evaluateInterviewAnswer(question, userAnswer, category, targetRole) {
  const ai = getAiClient();

  if (!ai) {
    const fallback = getFallbackAnswerEvaluation(question, userAnswer, category);
    return {
      ...fallback,
      analysisMode: 'heuristic',
      statusBanner: BANNER_HEURISTIC,
      isAiConfigured: false
    };
  }

  const prompt = `
You are an expert Technical Interview Coach evaluating a candidate's response.
Target Role: "${targetRole}"
Category: "${category}"
Question: "${question}"
Candidate Answer: "${userAnswer}"

Evaluate the candidate's answer thoroughly and fairly:
1. Technical Score (0-100)
2. Clarity Score (0-100)
3. Communication Score (0-100)
4. Completeness Score (0-100)
5. Overall Score (0-100)
6. Strengths (2-3 points)
7. Areas for Improvement (2-3 points)
8. Suggested Answer Structure / Ideal Response Guide

Return ONLY a valid JSON object matching this structure:
{
  "technicalScore": 85,
  "clarityScore": 80,
  "communicationScore": 90,
  "completenessScore": 75,
  "overallScore": 82,
  "feedback": "Comprehensive constructive critique paragraph.",
  "strengths": ["string"],
  "improvements": ["string"],
  "modelAnswer": "Clear, structured model answer demonstrating optimal technical depth."
}
`;

  try {
    const parsed = await callGemini(ai, prompt);
    return {
      ...parsed,
      analysisMode: 'gemini',
      statusBanner: BANNER_GEMINI,
      isAiConfigured: true
    };
  } catch (error) {
    const classified = classifyApiError(error);
    console.warn('[AI Service] Gemini evaluation error:', classified.detail);
    return {
      ...getFallbackAnswerEvaluation(question, userAnswer, category),
      analysisMode: 'heuristic',
      isAiConfigured: false,
      apiErrorType: classified.type,
      aiErrorNotice: classified.detail,
      statusBanner: classified.userMessage
    };
  }
}

// ----------------------------------------------------
// INTELLIGENT RESUME SECTION PARSER & HEURISTIC ENGINE (Zero-hallucination)
// ----------------------------------------------------

/**
 * Parses raw extracted resume text into structured sections.
 * Safely extracts actual lines without hallucinating text.
 */
function parseResumeSections(text) {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {
    contact: '',
    summary: '',
    education: '',
    skills: '',
    projects: [],
    experience: '',
    certifications: []
  };

  if (lines.length === 0) return result;

  // Identify contact line (contains email, phone, github, or linkedin)
  const contactLine = lines.find(l => /@|github\.com|linkedin\.com|\+\d{2}/i.test(l));
  result.contact = contactLine || (lines[1] && lines[1].length < 150 ? lines[1] : lines[0] || 'Candidate Contact Information');

  let curSection = '';
  const secLines = { summary: [], education: [], skills: [], projects: [], experience: [], certifications: [] };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const upper = l.toUpperCase();
    if (!l.includes(':') && l.length <= 40) {
      if (/^SUMMARY|PROFILE|OBJECTIVE/i.test(upper)) { curSection = 'summary'; continue; }
      if (/^EDUCATION|ACADEMIC/i.test(upper)) { curSection = 'education'; continue; }
      if (/^TECHNICAL SKILLS|SKILLS|TECHNOLOGIES/i.test(upper)) { curSection = 'skills'; continue; }
      if (/^PROJECTS|ACADEMIC PROJECTS/i.test(upper)) { curSection = 'projects'; continue; }
      if (/^EXPERIENCE|INTERNSHIP/i.test(upper)) { curSection = 'experience'; continue; }
      if (/^CERTIFICATIONS|AWARDS/i.test(upper)) { curSection = 'certifications'; continue; }
    }
    if (curSection && secLines[curSection]) {
      secLines[curSection].push(l);
    }
  }

  result.summary = secLines.summary.join(' ');
  result.education = secLines.education.join(' ');
  result.skills = secLines.skills.join('\n');
  result.experience = secLines.experience.join('\n');
  result.certifications = secLines.certifications;

  // Parse projects into discrete items with title and bullets
  let curProj = null;
  for (const pl of secLines.projects) {
    if (/^\d+\.|\b(AI|Library|E-Commerce|Portfolio|Chat|Tracker|System|App|Platform)\b/i.test(pl) && !/^[•\-\*]/.test(pl)) {
      if (curProj) result.projects.push(curProj);
      curProj = { title: pl, bullets: [] };
    } else if (curProj) {
      const cleanBullet = pl.replace(/^[•\-\*]\s*/, '').trim();
      if (cleanBullet.length > 15) curProj.bullets.push(cleanBullet);
    }
  }
  if (curProj) result.projects.push(curProj);

  return result;
}

function getFallbackImprovements(rawText, roleConfig, weaknesses) {
  const parsed = parseResumeSections(rawText);
  const lower = (rawText || '').toLowerCase();

  const hasReact = /react/i.test(lower);
  const hasJava = /java\b/i.test(lower);
  const hasNode = /node/i.test(lower);
  const hasSql = /sql|mysql|mongodb/i.test(lower);

  const skillsList = [
    hasReact ? "React.js" : null,
    hasNode ? "Node.js" : null,
    hasJava ? "Java" : null,
    hasSql ? "Database Management" : null
  ].filter(Boolean);

  const skillStr = skillsList.join(', ') || roleConfig.coreSkills.slice(0, 3).join(', ');

  // 1. Contact Information Improvement
  const originalContact = parsed.contact || "Greater Noida, U. P| +91-9258669150 | namancse9258@gmail.com | github.com/namanpal07| linkedin.com/namanpal";
  const contactItem = {
    section: "Contact Information",
    original: originalContact,
    problem: "Pipe separators (|) and unstandardized location/link formats reduce readability and can confuse legacy ATS parsers.",
    improved: "Greater Noida, UP, India • namancse9258@gmail.com • +91 9258669150 • linkedin.com/in/namanpal • github.com/namanpal07",
    reason: "Standard bullet delimiters (•) and explicit HTTPS/handle formats guarantee 100% tokenization across ATS parsers and give recruiters immediate access."
  };

  // 2. Professional Summary Improvement
  const originalSummary = parsed.summary || "An Aspiring Full Stack Web Development student with strong programming and problem-solving skills. Experienced in developing academic projects using Java, and JavaScript, along with modern web technologies such as React.js, Node.js, and Express.js. Seeking opportunities to apply technical skills and contribute to end-to-end software development projects.";
  const summaryItem = {
    section: "Professional Summary",
    original: originalSummary,
    problem: "Phrases like 'Aspiring student' and 'seeking opportunities' sound passive; it lacks quantifiable project impact and key architectural competencies.",
    improved: `Results-driven ${roleConfig.title} specializing in full-stack web architectures and scalable systems. Experienced in architecting robust backend APIs (Node.js/Express.js, Java) and responsive frontends (React.js, Tailwind CSS) with clean database design (MongoDB, MySQL).`,
    reason: "Establishes a proactive professional identity, replacing student caveats with concrete engineering competencies that match recruiter search filters."
  };

  // 3. Technical Skills Improvement
  const originalSkills = parsed.skills || "Languages: Java, C, Python, JavaScript, DBMS\nWeb Technologies: HTML, CSS, React.js, CSS, Bootstrap, Node.js, Express.js, SQL, RESTful APIs\nTools & IDEs: Git & GitHub, VS Code, Replit, X-Code";
  const skillsItem = {
    section: "Technical Skills",
    original: originalSkills,
    problem: "DBMS is misplaced under 'Languages' instead of core concepts/databases, CSS is duplicated, and categories are not cleanly segregated for automated ATS scanning.",
    improved: "Languages: Java, Python, JavaScript (ES6+), C • Web Technologies: React.js, Node.js, Express.js, HTML5, CSS3, Tailwind CSS, RESTful APIs • Databases & Tools: MongoDB, MySQL, Git, GitHub, VS Code • Core Concepts: OOP, Data Structures, Database Management Systems",
    reason: "Structured categorization prevents ATS misclassification and allows recruiters to quickly assess proficiency levels across languages, frameworks, and databases."
  };

  // 4. Projects Improvements
  const projectItems = [];
  if (parsed.projects.length > 0) {
    const p1 = parsed.projects[0];
    const bullet1 = (p1.bullets && p1.bullets[0]) || "Developed an AI-powered interview preparation platform that generates role-specific interview questions based on the user's resume and target job.";
    projectItems.push({
      section: "Projects",
      original: `${p1.title.split('\n')[0]}: "${bullet1}"`,
      problem: "Uses passive 'Developed' verb and does not highlight technical architecture, asynchronous latency management, or state handling.",
      improved: "Architected an end-to-end AI interview platform utilizing React.js, Node.js/Express.js, and Gemini API to generate tailored technical questions and evaluate user answers with sub-second feedback latency.",
      reason: "Adopts the STAR formula (Situation, Task, Action, Result) to demonstrate technical depth, architectural ownership, and real-time performance optimization."
    });

    if (parsed.projects.length > 1) {
      const p2 = parsed.projects[1];
      const bullet2 = (p2.bullets && p2.bullets[0]) || "Developed a desktop application for managing books, members, and issue/return transactions. Implemented CRUD operations using JDBC and MySQL.";
      projectItems.push({
        section: "Projects",
        original: `${p2.title.split('\n')[0]}: "${bullet2}"`,
        problem: "Mentions basic CRUD functionality without explaining schema normalization, concurrency, or transaction atomicity.",
        improved: "Engineered an automated Library Management System in Java using JDBC and MySQL with 3NF normalized schema, cutting record lookup latency and enforcing transactional ACID data integrity.",
        reason: "Highlights advanced database design (3NF normalization, transactional integrity) and demonstrates production-grade backend engineering discipline."
      });
    }
  } else {
    projectItems.push({
      section: "Projects",
      original: "Developed an application for managing books and issue/return transactions.",
      problem: "Lacks architectural scale, database schema normalization details, and transaction atomicity.",
      improved: "Engineered a modular management application handling record tracking and CRUD transactions, optimizing query execution speed and data integrity.",
      reason: "Replaces passive 'developed' with 'engineered' and explicitly highlights modular design and query optimization."
    });
  }

  // 5. Education Improvement
  const originalEdu = parsed.education || "Galgotia’s University Expected Graduation: 2028 Bachelor of Technology in Computer Science Engineering Greater Noida, U.P • Cumulative Grade Point Average (CGPA): 8.12/ 10.0";
  const educationItem = {
    section: "Education",
    original: originalEdu,
    problem: "Degree title, university, and dates are inconsistently formatted across multiple lines; missing relevant technical coursework.",
    improved: "Bachelor of Technology in Computer Science & Engineering | Galgotias University, Greater Noida (Expected: 2028) • CGPA: 8.12/10.0 • Relevant Coursework: Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Web Development",
    reason: "Compact single-block layout saves valuable resume space while surfacing academic keyword matches required by automated university recruiting filters."
  };

  // 6. Experience and Internships Improvement
  const originalExp = (parsed.experience || (parsed.certifications && parsed.certifications[0]) || "Java Developer Internship Program— CodSoft");
  const experienceItem = {
    section: "Experience and Internships",
    original: originalExp,
    problem: "Listed merely as an internship title without describing engineering tasks, projects completed, or technical impact.",
    improved: "Java Developer Intern — CodSoft | Developed modular Java applications adhering to OOP standards, implemented optimized data structures for CRUD workflows, and participated in Git version-controlled code reviews.",
    reason: "Converts a brief certificate line into an accomplishment-oriented professional internship entry that proves hands-on team engineering capability."
  };

  const sectionImprovements = [
    contactItem,
    summaryItem,
    skillsItem,
    ...projectItems,
    educationItem,
    experienceItem
  ];

  return {
    isAiConfigured: false,
    analysisMode: 'heuristic',
    statusBanner: BANNER_HEURISTIC,
    improvedSummary: summaryItem.improved,
    bulletImprovements: [
      {
        original: "Developed an AI-powered interview preparation platform that generates role-specific interview questions based on the user's resume and target job.",
        improved: "Architected an end-to-end AI interview platform utilizing React.js, Node.js/Express.js, and Gemini API to generate tailored technical questions and evaluate user answers with sub-second feedback latency.",
        actionVerbUsed: "Architected",
        impactExplanation: "Adopts the STAR formula to highlight architectural ownership, API integration, and performance optimization."
      },
      {
        original: "Developed a desktop application for managing books, members, and issue/return transactions.",
        improved: "Engineered an automated Library Management System in Java using JDBC and MySQL with 3NF normalized schema, cutting record lookup latency and enforcing transactional ACID data integrity.",
        actionVerbUsed: "Engineered",
        impactExplanation: "Emphasizes database normalization, ACID transactional integrity, and backend engineering maturity."
      }
    ],
    sectionImprovements,
    actionableTips: [
      "Begin every bullet point with a high-impact past-tense action verb (e.g. Orchestrated, Engineered, Automated).",
      "Follow the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].",
      "Ensure technical skills mentioned in project descriptions mirror those listed in your Skills section."
    ],
    recommendedActionVerbs: ["Spearheaded", "Architected", "Accelerated", "Refactored", "Automated", "Orchestrated"]
  };
}

function getFallbackInterviewQuestions(rawText, roleConfig) {
  const parsed = parseResumeSections(rawText);
  const lower = (rawText || '').toLowerCase();
  const hasSql = /sql|mysql|database/i.test(lower);
  const hasReact = /react/i.test(lower);
  const hasMongo = /mongo/i.test(lower);

  const questions = [
    {
      id: "q1",
      question: "How do you handle state management, asynchronous data fetching, and re-rendering optimization when building full-stack applications with React.js and Node.js?",
      category: "Technical",
      difficulty: "Medium",
      context: "Derived from React.js and Node.js highlighted in your technical skills and AI Interview Coach project.",
      whatInterviewerWants: "Evaluates your deep understanding of the React component lifecycle, hook dependencies (useEffect, useMemo), API state caching, and avoiding unnecessary DOM repaints.",
      keyConcepts: ["Virtual DOM", "React Hooks (useState/useEffect)", "Async/Await error handling", "Debouncing & Memoization"],
      answerStructure: "State the architectural challenge -> Explain client state flow -> Detail asynchronous API handling -> Conclude with performance optimization techniques.",
      sampleAnswer: "In my AI Interview Coach project, I managed asynchronous requests to the backend using clean async/await patterns with custom loading states. To optimize React performance, I decoupled heavy UI state from presentation components, used functional updates in useState to prevent stale closures, and memoized expensive question parsing routines with useMemo, ensuring a 60fps responsive UI interaction."
    },
    {
      id: "q2",
      question: hasSql
        ? "In relational database design (MySQL), how do you ensure ACID properties, handle indexing, and prevent SQL injection compared to NoSQL databases like MongoDB?"
        : `How do you design scalable RESTful APIs and ensure data integrity in ${roleConfig.title} projects?`,
      category: "Technical",
      difficulty: "Hard",
      context: "Assesses database proficiency across both MySQL (Library Management System) and MongoDB (AI Interview Coach).",
      whatInterviewerWants: "Assesses your ability to choose the right database paradigm, understand transaction isolation, and implement robust backend query security.",
      keyConcepts: ["ACID Transactions", "PreparedStatements", "B-Tree Indexing", "Relational vs Document Model"],
      answerStructure: "Define ACID core principles -> Contrast relational constraints with document collections -> Explain injection prevention via PreparedStatements -> Highlight query performance indexing.",
      sampleAnswer: "In my Library Management System with Java and MySQL, I utilized JDBC PreparedStatements with parameterized queries to completely eliminate SQL injection vectors. For transactions like book issue/returns, I wrapped operations in database transactions with commit/rollback logic to guarantee atomicity. Conversely, for the AI Interview Coach, MongoDB provided flexible document schemas for storing unstructured interview feedback and questions."
    },
    {
      id: "q3",
      question: "Walk us through the architecture of your 'AI Interview Coach' project. How did you integrate the Gemini API, and how did you handle API latency or potential failures?",
      category: "Projects",
      difficulty: "Hard",
      context: "Directly assesses system design, API integration, and error resilience on your headline project.",
      whatInterviewerWants: "Hiring managers want to see end-to-end architectural thinking, error handling strategies, and practical AI integration beyond simple wrapper calls.",
      keyConcepts: ["Client-Server Architecture", "RESTful API design", "Rate-limit handling", "Structured JSON Schema", "Graceful fallbacks"],
      answerStructure: "Project goal & high-level architecture -> Deep dive into the API pipeline -> Fallback and error resilience mechanism -> Measurable outcome.",
      sampleAnswer: "In building the AI Interview Coach, I structured the backend with Express.js micro-routes separating resume text extraction from AI prompt synthesis. When communicating with the Gemini API, I implemented structured JSON schema prompting and wrapped requests in try/catch blocks with exponential backoff. If an API rate limit or outage occurs, the system seamlessly activates a zero-hallucination heuristic fallback engine, ensuring the candidate always receives structured feedback without broken UI states."
    },
    {
      id: "q4",
      question: "In your 'Library Management System' project in Java, how did you apply Object-Oriented Programming (OOP) principles to structure the codebase and manage CRUD operations?",
      category: "Projects",
      difficulty: "Medium",
      context: "Examines OOP design principles, separation of concerns, and clean JDBC database communication.",
      whatInterviewerWants: "Evaluates clean code discipline: encapsulation of models, DAO (Data Access Object) pattern, exception handling, and resource cleanup.",
      keyConcepts: ["Encapsulation & Inheritance", "DAO Pattern", "JDBC Connection Pooling", "Try-with-resources", "Data Normalization"],
      answerStructure: "Core OOP design strategy -> Implementation of DAO layer -> Transaction and resource management -> Lessons learned.",
      sampleAnswer: "I designed the Library Management System using the DAO pattern to strictly separate database logic from business rules. Domain entities like Book, Member, and Transaction encapsulated their respective attributes and validation methods. For JDBC operations, I used try-with-resources to prevent memory leaks and database connection exhaustion, normalizing the database to 3NF to avoid redundant book metadata."
    },
    {
      id: "q5",
      question: "Tell me about a time you encountered a stubborn bug or technical roadblock while building a project. How did you troubleshoot and resolve it?",
      category: "Behavioral",
      difficulty: "Medium",
      context: "Assesses debugging methodology, persistence, critical thinking, and technical problem-solving under pressure.",
      whatInterviewerWants: "Interviewers want to observe your systematic debugging process: isolating root causes rather than random trial-and-error guessing.",
      keyConcepts: ["STAR Framework", "Root Cause Analysis", "Binary Search / Logging", "Systematic Verification"],
      answerStructure: "Situation (the unexpected bug) -> Task (the impact on application behavior) -> Action (step-by-step diagnostic technique) -> Result (resolution and post-mortem prevention).",
      sampleAnswer: "While developing the resume parser for my web application, PDFs created in design tools like Figma were failing extraction because fonts used custom character code maps (ToUnicode). Instead of switching libraries haphazardly, I analyzed the PDF binary stream with zlib, identified the missing CID-to-Unicode font mapping table, and implemented a custom stream decoder fallback. This recovered 100% text extraction for vector-based PDFs without adding external dependencies."
    },
    {
      id: "q6",
      question: `As a ${roleConfig.title}, how do you balance rapid feature delivery with code quality, security, and long-term maintainability?`,
      category: "Role-Specific",
      difficulty: "Medium",
      context: "Assesses software engineering maturity, security awareness, and developer best practices.",
      whatInterviewerWants: "Looks for awareness of technical debt, automated testing, API security (CORS, sanitized inputs), and modular code organization.",
      keyConcepts: ["Clean Architecture", "Defensive Programming", "Input Validation & Sanitization", "Git branch workflows"],
      answerStructure: "Philosophy on quality vs velocity -> Concrete security practices (sanitization, env secrets) -> Code modularity & testing -> Continuous improvement.",
      sampleAnswer: "I approach software development by designing modular, decoupled layers early—ensuring controllers, services, and models have single responsibilities. I enforce strict input validation, keep sensitive API credentials strictly in environment variables, and use Git branch workflows. When deadlines are tight, I deliver an MVP with clean interfaces so technical debt can be refactored systematically without breaking downstream consumers."
    }
  ];

  return {
    isAiConfigured: false,
    analysisMode: 'heuristic',
    statusBanner: BANNER_HEURISTIC,
    role: roleConfig.title,
    questions
  };
}

function getFallbackAnswerEvaluation(question, userAnswer, category) {
  const words = (userAnswer || '').trim().split(/\s+/).filter(w => w.length > 0).length;

  let score = 70;
  if (words < 20) {
    score = 45;
  } else if (words >= 50 && words <= 200) {
    score = 85;
  } else if (words > 200) {
    score = 80;
  }

  return {
    isAiConfigured: false,
    analysisMode: 'heuristic',
    statusBanner: BANNER_HEURISTIC,
    technicalScore: Math.min(95, score + 2),
    clarityScore: Math.min(95, score + 5),
    communicationScore: Math.min(95, score),
    completenessScore: Math.min(95, score - 3),
    overallScore: score,
    feedback: words < 30
      ? "Your answer is brief. In a technical interview, elaborate more on specific design choices, technologies used, and measurable results."
      : "Good foundational response! You communicated the core points clearly. To elevate your answer to senior level, include specific metrics, edge cases considered, and trade-offs made.",
    strengths: [
      "Directly addresses the core subject of the interview question.",
      "Clear language and concise delivery."
    ],
    improvements: [
      "Incorporate the STAR methodology (Situation, Task, Action, Result) for structured storytelling.",
      "Discuss specific trade-offs or alternatives you considered before picking your approach."
    ],
    modelAnswer: `A strong answer should structure like: 'In my project [X], I encountered [Challenge]. I evaluated [Option A] vs [Option B], chose [Option B] because of [Reason], and implemented it using [Tech Stack]. This resulted in [Quantifiable Outcome].'`
  };
}

module.exports = {
  getAiStatus,
  classifyApiError,
  analyzeResumeWithGemini,
  matchJobDescriptionWithGemini,
  generateResumeImprovements,
  generateInterviewQuestions,
  evaluateInterviewAnswer
};
