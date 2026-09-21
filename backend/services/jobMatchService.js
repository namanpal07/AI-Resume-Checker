const { getRoleConfig } = require('./roleData');

// Tech terms pool for extraction from raw job descriptions
const ALL_TECH_TERMS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart",
  "HTML", "HTML5", "CSS", "CSS3", "Sass", "Tailwind CSS", "Bootstrap",
  "React", "React.js", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "Redux", "Zustand",
  "Node.js", "Express", "Express.js", "NestJS", "Django", "FastAPI", "Flask", "Spring Boot", "Spring", "Hibernate", "ASP.NET",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "JDBC", "Prisma", "Mongoose",
  "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Bash",
  "CI/CD", "Jenkins", "GitHub Actions", "Terraform", "Ansible", "Nginx",
  "REST", "RESTful", "REST APIs", "GraphQL", "gRPC", "WebSockets", "Socket.io", "Microservices",
  "Jest", "Mocha", "Cypress", "PyTest", "JUnit",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy",
  "Data Structures", "Algorithms", "System Design", "OOP", "Agile", "Scrum", "Jira"
];

/**
 * Extracts skills mentioned in a job description
 */
function extractSkillsFromText(text) {
  const lower = text.toLowerCase();
  const found = [];
  ALL_TECH_TERMS.forEach(term => {
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escapeRegExp(term.toLowerCase())}(?:$|[^a-zA-Z0-9#+])`, 'i');
    if (regex.test(lower) && !found.includes(term)) {
      found.push(term);
    }
  });
  return found;
}

/**
 * Matches resume text against either a custom job description or a predefined role
 */
function matchResumeWithJob(resumeText, { jobDescription = '', roleName = '' }) {
  const resumeLower = resumeText.toLowerCase();

  let targetSkills = [];
  let jobTitle = roleName || 'Custom Job Description';

  if (jobDescription && jobDescription.trim().length > 30) {
    targetSkills = extractSkillsFromText(jobDescription);
  }

  // If no skills found in raw JD or if role was provided, merge with role config
  if (roleName) {
    const roleConfig = getRoleConfig(roleName);
    jobTitle = roleConfig.title;
    const roleSkills = [...(roleConfig.coreSkills || []), ...(roleConfig.secondarySkills || [])];
    // Union of unique skills
    roleSkills.forEach(s => {
      if (!targetSkills.some(ts => ts.toLowerCase() === s.toLowerCase())) {
        targetSkills.push(s);
      }
    });
  }

  // If still empty (e.g. arbitrary text), use defaults from Software Engineer
  if (targetSkills.length === 0) {
    const fallback = getRoleConfig('Software Engineer');
    targetSkills = fallback.coreSkills;
  }

  const matchedSkills = [];
  const missingSkills = [];

  targetSkills.forEach(skill => {
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escapeRegExp(skill.toLowerCase())}(?:$|[^a-zA-Z0-9#+])`, 'i');
    if (regex.test(resumeLower)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Calculate Match Score percentage
  const matchPercentage = targetSkills.length > 0
    ? Math.round((matchedSkills.length / targetSkills.length) * 100)
    : 70;

  // Generate targeted suggestions
  const recommendations = [];
  if (missingSkills.length > 0) {
    recommendations.push(`Add ${missingSkills.slice(0, 3).join(', ')} to your Skills section or project tech stack.`);
  }
  if (matchPercentage < 60) {
    recommendations.push(`Tailor your project descriptions to mirror the technologies and responsibilities mentioned in this job listing.`);
  } else if (matchPercentage >= 80) {
    recommendations.push(`High compatibility! Ensure your most impressive accomplishments using ${matchedSkills.slice(0, 3).join(', ')} are highlighted.`);
  }

  return {
    jobTitle,
    matchScore: matchPercentage,
    totalSkillsRequired: targetSkills.length,
    matchedCount: matchedSkills.length,
    missingCount: missingSkills.length,
    matchedSkills,
    missingSkills,
    recommendations
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  extractSkillsFromText,
  matchResumeWithJob
};
