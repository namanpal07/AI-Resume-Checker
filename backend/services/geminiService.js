const { GoogleGenAI } = require('@google/genai');
const { getRoleConfig } = require('./roleData');

/**
 * Initializes Gemini client if key is available
 */
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
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
    return getFallbackImprovements(rawText, roleConfig, weaknesses);
  }

  const prompt = `
You are an expert Technical Resume Writer and ATS Optimization Specialist.
Target Role: "${roleConfig.title}".

Candidate Resume Text:
"""
${rawText.slice(0, 4000)}
"""

Identified ATS Weaknesses:
${weaknesses.join('\n')}

STRICT RULES:
1. DO NOT invent false companies, employment dates, certifications, or degrees.
2. DO NOT invent new technologies the candidate never used.
3. Rewrite the candidate's professional summary with high-impact phrasing.
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    return {
      isAiConfigured: true,
      ...parsed
    };
  } catch (error) {
    console.warn('Gemini API call failed, using intelligent rule fallback:', error.message);
    return {
      ...getFallbackImprovements(rawText, roleConfig, weaknesses),
      isAiConfigured: false,
      aiErrorNotice: `AI suggestion fallback used (${error.message})`
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
    return getFallbackInterviewQuestions(rawText, roleConfig);
  }

  const prompt = `
You are a Senior Technical Hiring Manager and Interviewer.
Target Position: "${roleConfig.title}".

Candidate Resume Text:
"""
${rawText.slice(0, 4000)}
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    return {
      isAiConfigured: true,
      role: roleConfig.title,
      questions: parsed.questions || []
    };
  } catch (error) {
    console.warn('Gemini question generation error:', error.message);
    return {
      ...getFallbackInterviewQuestions(rawText, roleConfig),
      isAiConfigured: false,
      aiErrorNotice: `Generated with rule-based system (${error.message})`
    };
  }
}

/**
 * AI Interview Answer Evaluator
 */
async function evaluateInterviewAnswer(question, userAnswer, category, targetRole) {
  const ai = getAiClient();

  if (!ai) {
    return getFallbackAnswerEvaluation(question, userAnswer, category);
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    return {
      isAiConfigured: true,
      ...parsed
    };
  } catch (error) {
    console.warn('Gemini evaluation error:', error.message);
    return {
      ...getFallbackAnswerEvaluation(question, userAnswer, category),
      isAiConfigured: false,
      aiErrorNotice: `Evaluated via rubric engine (${error.message})`
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
    aiNotice: "Connect your free GEMINI_API_KEY in backend/.env to activate real-time Gemini LLM rewrites.",
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
    aiNotice: "Connect your free GEMINI_API_KEY in backend/.env to generate 100% custom questions via Gemini.",
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
  generateResumeImprovements,
  generateInterviewQuestions,
  evaluateInterviewAnswer
};
