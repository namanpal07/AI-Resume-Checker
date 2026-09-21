const { getRoleConfig } = require('./roleData');
const { detectSections, extractMetadata } = require('./parserService');

// Configurable ATS Scoring Weights
const ATS_WEIGHTS = {
  keywords: 0.30,   // 30% Keyword Matching
  skills: 0.25,     // 25% Core & Secondary Skills Match
  structure: 0.15,  // 15% Standard Resume Sections
  formatting: 0.10, // 10% Formatting, Contact Details & Readability
  experience: 0.10, // 10% Experience / Projects Impact & Action Verbs
  education: 0.10   // 10% Education Credentials & Alignment
};

// Comprehensive list of common technical skills for entity detection
const TECH_SKILLS_DICTIONARY = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "PHP", "Ruby", "Swift", "Kotlin", "Go", "Rust", "Dart",
  "HTML", "HTML5", "CSS", "CSS3", "Sass", "Tailwind CSS", "Bootstrap", "Material-UI",
  "React", "React.js", "Angular", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "Redux", "Zustand",
  "Node.js", "Express", "Express.js", "NestJS", "Django", "FastAPI", "Flask", "Spring Boot", "Spring", "Hibernate", "ASP.NET",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "JDBC", "Prisma", "Mongoose",
  "Git", "GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Unix", "Bash",
  "CI/CD", "Jenkins", "GitHub Actions", "Terraform", "Ansible", "Nginx", "Apache",
  "REST", "RESTful APIs", "REST APIs", "GraphQL", "gRPC", "WebSockets", "Socket.io", "JSON", "JWT", "OAuth",
  "Jest", "Mocha", "Cypress", "PyTest", "JUnit", "Selenium",
  "Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "TensorFlow", "PyTorch", "Scikit-Learn",
  "Pandas", "NumPy", "OpenCV", "NLP", "Tableau", "Power BI", "Data Structures", "Algorithms", "System Design", "OOP"
];

// Strong Action Verbs indicative of high-impact resumes
const ACTION_VERBS = [
  "developed", "engineered", "implemented", "designed", "architected", "built", "spearheaded",
  "optimized", "improved", "accelerated", "reduced", "automated", "streamlined", "created",
  "collaborated", "managed", "deployed", "integrated", "maintained", "orchestrated", "refactored"
];

/**
 * Evaluates extracted resume text against a target role configuration
 */
function analyzeResume(rawText, targetRoleName, customJobDescription = '') {
  const roleConfig = getRoleConfig(targetRoleName);
  const lowerText = rawText.toLowerCase();

  // 1. Detect Standard Sections
  const { detected: detectedSections, missing: missingSections } = detectSections(rawText);

  // 2. Detect Skills in Resume
  const detectedSkills = [];
  TECH_SKILLS_DICTIONARY.forEach(skill => {
    // Escaped regex word boundary check
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escapeRegExp(skill.toLowerCase())}(?:$|[^a-zA-Z0-9#+])`, 'i');
    if (regex.test(lowerText) && !detectedSkills.includes(skill)) {
      detectedSkills.push(skill);
    }
  });

  // 3. Match Skills against Role Requirements
  const targetRequired = roleConfig.coreSkills || [];
  const targetSecondary = roleConfig.secondarySkills || [];
  const matchedCore = [];
  const missingCore = [];

  targetRequired.forEach(skill => {
    const isFound = lowerText.includes(skill.toLowerCase()) ||
      detectedSkills.some(ds => ds.toLowerCase() === skill.toLowerCase());
    if (isFound) {
      matchedCore.push(skill);
    } else {
      missingCore.push(skill);
    }
  });

  const matchedSecondary = [];
  const missingSecondary = [];
  targetSecondary.forEach(skill => {
    const isFound = lowerText.includes(skill.toLowerCase()) ||
      detectedSkills.some(ds => ds.toLowerCase() === skill.toLowerCase());
    if (isFound) {
      matchedSecondary.push(skill);
    } else {
      missingSecondary.push(skill);
    }
  });

  const missingAll = missingCore.length > 0 ? [...missingCore, ...missingSecondary.slice(0, 3)] : missingSecondary;

  // 4. Keyword Match Evaluation (Role Keywords or Custom JD keywords)
  const targetKeywords = roleConfig.keywords || [];
  const matchedKeywords = [];
  const missingKeywords = [];

  targetKeywords.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  // Compute Subscores
  // A. Keyword Match Score (0 - 100)
  const keywordMatchRatio = targetKeywords.length > 0 ? (matchedKeywords.length / targetKeywords.length) : 0.8;
  const keywordScore = Math.min(100, Math.round(keywordMatchRatio * 100));

  // B. Skills Match Score (0 - 100)
  const coreWeight = 0.75;
  const secWeight = 0.25;
  const coreRatio = targetRequired.length > 0 ? (matchedCore.length / targetRequired.length) : 0.7;
  const secRatio = targetSecondary.length > 0 ? (matchedSecondary.length / targetSecondary.length) : 0.5;
  const skillScore = Math.min(100, Math.round((coreRatio * coreWeight + secRatio * secWeight) * 100));

  // C. Section Structure Score (0 - 100)
  const crucialSections = ["Contact Information", "Education", "Skills", "Projects", "Experience", "Summary"];
  let detectedCrucialCount = 0;
  crucialSections.forEach(s => {
    if (detectedSections.includes(s)) detectedCrucialCount++;
  });
  const structureScore = Math.min(100, Math.round((detectedCrucialCount / crucialSections.length) * 100));

  // D. Formatting & Readability Score (0 - 100)
  let formatScore = 80; // Baseline
  const words = rawText.split(/\s+/).filter(w => w.length > 0).length;
  if (words >= 350 && words <= 1200) {
    formatScore += 10;
  } else if (words < 200 || words > 2000) {
    formatScore -= 20;
  }
  const metadata = extractMetadata(rawText);
  if (metadata.email && metadata.phone) {
    formatScore += 10;
  } else if (!metadata.email && !metadata.phone) {
    formatScore -= 15;
  }
  formatScore = Math.max(30, Math.min(100, formatScore));

  // E. Experience & Projects Impact Score (0 - 100)
  let foundActionVerbs = 0;
  ACTION_VERBS.forEach(v => {
    if (lowerText.includes(v)) foundActionVerbs++;
  });
  // Check for quantified metrics (percentages, numbers like 30%, 10+, 5x)
  const metricMatches = (rawText.match(/\b\d+(?:%|\+?x|\s*k|\s*users|\s*ms)\b/gi) || []).length;
  let expScore = 50;
  expScore += Math.min(30, foundActionVerbs * 5);
  expScore += Math.min(20, metricMatches * 5);
  if (detectedSections.includes("Projects") || detectedSections.includes("Experience")) {
    expScore += 10;
  }
  expScore = Math.max(30, Math.min(100, expScore));

  // F. Education Score (0 - 100)
  let eduScore = 70;
  if (detectedSections.includes("Education")) {
    eduScore += 15;
  }
  if (/(?:bachelor|master|b\.?tech|b\.?e|degree|university|college|cgpa|gpa)/i.test(lowerText)) {
    eduScore += 15;
  }
  eduScore = Math.min(100, eduScore);

  // Overall Weighted ATS Score Calculation
  const overallAtsScore = Math.round(
    keywordScore * ATS_WEIGHTS.keywords +
    skillScore * ATS_WEIGHTS.skills +
    structureScore * ATS_WEIGHTS.structure +
    formatScore * ATS_WEIGHTS.formatting +
    expScore * ATS_WEIGHTS.experience +
    eduScore * ATS_WEIGHTS.education
  );

  // Derive Strengths and Weaknesses
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (skillScore >= 75) {
    strengths.push(`Strong core technical skills match for ${roleConfig.title} (${matchedCore.join(', ') || 'Relevant stack'}).`);
  } else {
    weaknesses.push(`Low match with primary required skills for ${roleConfig.title}.`);
    suggestions.push(`Highlight key skills like ${missingCore.slice(0, 4).join(', ')} prominently under your Skills section.`);
  }

  if (structureScore >= 80) {
    strengths.push(`Well-organized resume layout with ${detectedSections.length} identified standard sections.`);
  } else {
    weaknesses.push(`Missing key resume sections (${missingSections.slice(0, 3).join(', ')}).`);
    suggestions.push(`Add clear section headers for ${missingSections.slice(0, 2).join(' and ')} to help ATS parsers parse your data.`);
  }

  if (expScore >= 75) {
    strengths.push(`Demonstrated measurable impact using quantifiable metrics and active engineering verbs.`);
  } else {
    weaknesses.push(`Project and work descriptions lack quantifiable impact metrics (e.g. %, numbers, reduction in latency).`);
    suggestions.push(`Rephrase bullet points using the STAR method: Action Verb + Task + Quantifiable Result.`);
  }

  if (keywordScore >= 75) {
    strengths.push(`Excellent keyword density aligning with modern ATS filters for ${roleConfig.title}.`);
  } else {
    weaknesses.push(`ATS keywords for ${roleConfig.title} are underrepresented in your document.`);
    suggestions.push(`Naturally weave in keywords such as: ${missingKeywords.slice(0, 5).join(', ')} into your project summaries.`);
  }

  if (metadata.email && metadata.phone) {
    strengths.push(`Clear and parseable contact information provided.`);
  } else {
    weaknesses.push(`Contact information is incomplete or difficult for automated scanners to locate.`);
    suggestions.push(`Ensure your email address, phone number, and LinkedIn profile are placed clearly at the top.`);
  }

  return {
    role: roleConfig.title,
    atsScore: overallAtsScore,
    scoreBreakdown: {
      keywords: keywordScore,
      skills: skillScore,
      structure: structureScore,
      formatting: formatScore,
      experience: expScore,
      education: eduScore
    },
    detectedSections,
    missingSections,
    detectedSkills,
    matchedSkills: matchedCore,
    missingSkills: missingAll,
    matchedKeywords,
    missingKeywords,
    strengths,
    weaknesses,
    suggestions,
    metadata,
    wordCount: words,
    weights: ATS_WEIGHTS
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  analyzeResume,
  ATS_WEIGHTS
};
