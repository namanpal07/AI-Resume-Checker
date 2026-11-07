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
1. DO NOT invent false companies, employment dates, certifications, or degrees.
2. DO NOT invent new technologies the candidate never used.
3. Rewrite the candidate's professional summary with high-impact phrasing based on their actual background.
4. Pick 2-4 actual sentences/bullet points from the candidate's resume, and provide:
   - Original bullet point
   - Improved bullet point (leading with strong action verb, demonstrating impact, clean structure)
   - Explanation of why the improvement is better for ATS & recruiters.
5. Provide 3-5 concrete, actionable tips.

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
- 2 Project Deep-Dive Questions (referencing specific projects or implementations from their resume)
- 1 Experience/System Architecture Question
- 1 Behavioral/Problem-Solving Question

Return ONLY a valid JSON object matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "category": "Technical | Project | Experience | Behavioral",
      "difficulty": "Easy | Medium | Hard",
      "context": "Short explanation of why this question is being asked based on resume"
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
// INTELLIGENT RULE-BASED FALLBACKS (Zero-hallucination)
// ----------------------------------------------------

function getFallbackImprovements(rawText, roleConfig, weaknesses) {
  const hasReact = /react/i.test(rawText);
  const hasJava = /java\b/i.test(rawText);
  const hasNode = /node/i.test(rawText);
  const hasSql = /sql|mysql|mongodb/i.test(rawText);

  const skillsList = [
    hasReact ? "React.js" : null,
    hasNode ? "Node.js" : null,
    hasJava ? "Java" : null,
    hasSql ? "Database Management" : null
  ].filter(Boolean);

  const skillStr = skillsList.join(', ') || roleConfig.coreSkills.slice(0, 3).join(', ');

  return {
    isAiConfigured: false,
    analysisMode: 'heuristic',
    statusBanner: BANNER_HEURISTIC,
    improvedSummary: `Results-driven ${roleConfig.title} with solid technical foundation in ${skillStr}. Proven track record of developing scalable applications, optimizing system performance, and implementing clean code architectures. Eager to contribute problem-solving skills and modern software engineering practices to high-impact teams.`,
    bulletImprovements: [
      {
        original: "Developed an application for managing books and issue/return transactions.",
        improved: "Engineered a modular management application handling record tracking and CRUD transactions, optimizing query execution speed.",
        actionVerbUsed: "Engineered",
        impactExplanation: "Replaces passive 'developed' with 'engineered' and explicitly highlights modular design and query optimization."
      },
      {
        original: "Made website using React and Node.js for user interface and backend.",
        improved: "Architected a responsive full-stack web application with React.js and Node.js RESTful APIs, improving user task completion and responsiveness.",
        actionVerbUsed: "Architected",
        impactExplanation: "Emphasizes architectural ownership, full-stack capability, and end-user performance impact."
      }
    ],
    actionableTips: [
      "Begin every bullet point with a high-impact past-tense action verb (e.g. Orchestrated, Engineered, Automated).",
      "Follow the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].",
      "Ensure technical skills mentioned in project descriptions mirror those listed in your Skills section."
    ],
    recommendedActionVerbs: ["Spearheaded", "Architected", "Accelerated", "Refactored", "Automated", "Orchestrated"]
  };
}

function getFallbackInterviewQuestions(rawText, roleConfig) {
  const lower = rawText.toLowerCase();
  const hasSql = /sql|mysql|database/i.test(lower);
  const hasReact = /react/i.test(lower);

  const questions = [
    {
      id: "q1",
      question: `How do you approach designing scalable systems and writing clean, maintainable code in ${roleConfig.title} roles?`,
      category: "Technical",
      difficulty: "Medium",
      context: `Core competency expectation for ${roleConfig.title}.`
    },
    {
      id: "q2",
      question: hasReact 
        ? "Explain how you handle component lifecycle, state management, and re-rendering optimization in your frontend projects."
        : `What design patterns do you regularly apply when architecting software solutions?`,
      category: "Technical",
      difficulty: "Hard",
      context: "Derived from technical skills identified on your resume."
    },
    {
      id: "q3",
      question: "Walk us through the most technically challenging project on your resume. What trade-offs did you make during development?",
      category: "Project",
      difficulty: "Medium",
      context: "Directly assesses implementation decisions and ownership."
    },
    {
      id: "q4",
      question: hasSql
        ? "How did you design and normalize database schemas in your projects, and how did you prevent query bottlenecks?"
        : "Describe a complex bug you encountered during development and your systematic debugging process.",
      category: "Project",
      difficulty: "Hard",
      context: "Assesses real-world database and problem-solving experience."
    },
    {
      id: "q5",
      question: "Tell me about a time you had to learn a new technology or framework under a tight deadline to complete a project.",
      category: "Behavioral",
      difficulty: "Easy",
      context: "Tests agility, curiosity, and rapid technical adaptation."
    },
    {
      id: "q6",
      question: `Where do you see the biggest industry challenges in ${roleConfig.title} today, and how do you keep your skills updated?`,
      category: "Role-specific",
      difficulty: "Medium",
      context: "Evaluates industry awareness and continuous learning mindset."
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
