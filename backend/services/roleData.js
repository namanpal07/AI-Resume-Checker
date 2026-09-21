/**
 * Curated database of tech roles, core competencies, keywords, and industry expectations.
 * Covers all 15 roles present in the application.
 */

const ROLE_DATABASE = {
  "Software Engineer": {
    title: "Software Engineer",
    description: "Develop scalable software systems, design algorithms, and build foundational code solutions.",
    coreSkills: ["Data Structures", "Algorithms", "System Design", "Git", "OOP", "Problem Solving", "Java", "Python", "C++", "C"],
    secondarySkills: ["CI/CD", "Unit Testing", "Docker", "Agile", "REST APIs", "SQL", "Linux", "Code Review"],
    keywords: ["Object-Oriented Programming", "Design Patterns", "Data Structures", "Algorithms", "System Architecture", "Git", "Scalability", "Testing", "CI/CD", "Clean Code"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Full Stack Developer": {
    title: "Full Stack Developer",
    description: "Build complete web applications spanning both client-side interfaces and server-side databases.",
    coreSkills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB", "SQL", "RESTful APIs", "Git"],
    secondarySkills: ["TypeScript", "Next.js", "Redux", "Tailwind CSS", "Docker", "AWS", "GraphQL", "Jest", "PostgreSQL"],
    keywords: ["Full Stack", "MERN", "Frontend", "Backend", "REST APIs", "State Management", "Database Design", "Authentication", "CRUD", "Responsive Design", "Deployment"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Frontend Developer": {
    title: "Frontend Developer",
    description: "Craft modern responsive web pages, integrate interactive UI logic, and optimize client experiences.",
    coreSkills: ["HTML5", "CSS3", "JavaScript", "React", "Tailwind CSS", "Responsive Design", "DOM Manipulation", "Git"],
    secondarySkills: ["TypeScript", "Redux", "Next.js", "Sass", "Vue.js", "Webpack", "Vite", "Jest", "UI/UX Design"],
    keywords: ["Frontend", "Single Page Application", "Component Lifecycle", "Accessibility", "Cross-Browser Compatibility", "Performance Optimization", "CSS Frameworks", "UI/UX"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Backend Developer": {
    title: "Backend Developer",
    description: "Build secure APIs, model backend database structures, and handle system logic integrations.",
    coreSkills: ["Node.js", "Express", "Python", "Java", "SQL", "MongoDB", "PostgreSQL", "REST APIs", "Git"],
    secondarySkills: ["Docker", "Redis", "Kafka", "Microservices", "JWT", "OAuth", "AWS", "GraphQL", "ORM"],
    keywords: ["API Development", "Database Normalization", "Authentication", "Middleware", "Server Architecture", "Caching", "Microservices", "Data Integrity", "Security"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Java Developer": {
    title: "Java Developer",
    description: "Program enterprise systems, backend APIs, and web services using the Java ecosystem.",
    coreSkills: ["Java", "Spring Boot", "Hibernate", "Maven", "SQL", "OOP", "JDBC", "Git"],
    secondarySkills: ["Microservices", "Gradle", "JUnit", "JPA", "Docker", "PostgreSQL", "Kafka", "REST APIs"],
    keywords: ["Enterprise Java", "Spring Framework", "Multithreading", "JVM", "Dependency Injection", "Hibernate ORM", "Microservices", "Clean Architecture", "Unit Testing"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Python Developer": {
    title: "Python Developer",
    description: "Write automation scripts, develop web servers, and design data integrations using Python.",
    coreSkills: ["Python", "Django", "FastAPI", "Flask", "SQL", "Git", "OOP", "REST APIs"],
    secondarySkills: ["Pandas", "NumPy", "Docker", "PostgreSQL", "Redis", "Celery", "Linux", "PyTest"],
    keywords: ["Pythonic Code", "Web Frameworks", "Automation", "AsyncIO", "Data Processing", "Object-Oriented Programming", "RESTful Web Services", "Scripting"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "React Developer": {
    title: "React Developer",
    description: "Architect component-driven web interfaces, manage state workflows, and build rich single-page applications.",
    coreSkills: ["React", "JavaScript", "JSX", "HTML5", "CSS3", "Redux", "Hooks", "Git"],
    secondarySkills: ["Next.js", "TypeScript", "Tailwind CSS", "Context API", "React Router", "Zustand", "Jest", "REST APIs"],
    keywords: ["Virtual DOM", "React Hooks", "State Management", "SPA", "Component Architecture", "Prop Drilling", "Side Effects", "Custom Hooks"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Node.js Developer": {
    title: "Node.js Developer",
    description: "Engineer asynchronous server backends, microservice infrastructures, and high-throughput data streams.",
    coreSkills: ["Node.js", "Express", "JavaScript", "MongoDB", "REST APIs", "Async/Await", "Event Loop", "Git"],
    secondarySkills: ["TypeScript", "Socket.io", "Redis", "Docker", "PostgreSQL", "NestJS", "JWT", "AWS"],
    keywords: ["Non-blocking I/O", "Event-Driven Architecture", "Express Middleware", "Stream Processing", "Cluster Module", "API Security", "NPM Modules"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Mobile App Developer": {
    title: "Mobile App Developer",
    description: "Design and build cross-platform or native smartphone applications with slick UI and offline caching.",
    coreSkills: ["React Native", "Flutter", "Android", "iOS", "JavaScript", "Dart", "Swift", "Kotlin", "Git"],
    secondarySkills: ["Firebase", "Redux", "SQLite", "Push Notifications", "App Store Deployment", "REST APIs"],
    keywords: ["Mobile Application", "Cross-Platform", "Native Modules", "App Lifecycle", "State Management", "Offline Storage", "Responsive Layout"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Data Analyst": {
    title: "Data Analyst",
    description: "Transform raw organizational metrics into executive charts, SQL queries, and actionable business insights.",
    coreSkills: ["SQL", "Excel", "Python", "Tableau", "Power BI", "Data Visualization", "Statistics", "Git"],
    secondarySkills: ["Pandas", "NumPy", "R", "Data Cleaning", "ETL", "Dashboard Design", "Business Intelligence"],
    keywords: ["Data Analytics", "Quantitative Analysis", "Dashboard Creation", "Statistical Modeling", "Data Wrangling", "KPI Tracking", "Exploratory Data Analysis"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Data Scientist": {
    title: "Data Scientist",
    description: "Build predictive models, execute hypothesis testing, and discover hidden trends across massive datasets.",
    coreSkills: ["Python", "Machine Learning", "Statistics", "Pandas", "NumPy", "Scikit-Learn", "SQL", "Git"],
    secondarySkills: ["Deep Learning", "TensorFlow", "PyTorch", "Data Visualization", "Jupyter", "Feature Engineering", "R"],
    keywords: ["Predictive Analytics", "Hypothesis Testing", "Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Cross-Validation", "Data Pipelines"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Machine Learning Engineer": {
    title: "Machine Learning Engineer",
    description: "Deploy machine learning pipelines, fine-tune neural nets, and integrate intelligent inference backends.",
    coreSkills: ["Python", "TensorFlow", "PyTorch", "Scikit-Learn", "Machine Learning", "Deep Learning", "NumPy", "Git"],
    secondarySkills: ["MLOps", "Docker", "Kubernetes", "AWS SageMaker", "Data Pipelines", "Model Optimization", "FastAPI"],
    keywords: ["Neural Networks", "Model Inference", "MLOps", "Model Training", "Hyperparameter Tuning", "Computer Vision", "NLP", "Feature Store"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "DevOps Engineer": {
    title: "DevOps Engineer",
    description: "Automate build pipelines, orchestrate Kubernetes clusters, and guarantee high-availability infrastructure.",
    coreSkills: ["Docker", "Kubernetes", "CI/CD", "Linux", "Git", "AWS", "Bash/Shell", "Terraform"],
    secondarySkills: ["Jenkins", "GitHub Actions", "Ansible", "Prometheus", "Grafana", "Python", "CloudFormation", "Networking"],
    keywords: ["Infrastructure as Code", "Containerization", "Continuous Integration", "Continuous Delivery", "Site Reliability", "Cloud Provisioning", "Monitoring"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Cloud Engineer": {
    title: "Cloud Engineer",
    description: "Architect cloud infrastructure, configure serverless systems, and manage enterprise security perimeters.",
    coreSkills: ["AWS", "Azure", "GCP", "Cloud Architecture", "Linux", "Networking", "IAM", "Git"],
    secondarySkills: ["Terraform", "Docker", "Kubernetes", "Serverless", "Python", "CloudWatch", "Cost Optimization"],
    keywords: ["Cloud Migration", "Virtual Private Cloud", "Serverless Architecture", "Identity & Access Management", "High Availability", "Disaster Recovery"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Cybersecurity Analyst": {
    title: "Cybersecurity Analyst",
    description: "Guard company firewalls, run penetration tests, enforce compliance guidelines, and mitigate security threats.",
    coreSkills: ["Network Security", "Vulnerability Assessment", "Linux", "SIEM", "Firewalls", "Incident Response", "Python"],
    secondarySkills: ["Wireshark", "Kali Linux", "Metasploit", "OWASP", "SOC", "Penetration Testing", "Cryptography"],
    keywords: ["Threat Mitigation", "Penetration Testing", "Intrusion Detection", "Security Compliance", "Incident Handling", "Vulnerability Scanning", "Zero Trust"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  }
};

/**
 * Normalizes role string to match keys
 */
function getRoleConfig(roleName) {
  if (!roleName) return ROLE_DATABASE["Software Engineer"];
  
  // Exact match
  if (ROLE_DATABASE[roleName]) {
    return ROLE_DATABASE[roleName];
  }
  
  // Case-insensitive match
  const lower = roleName.toLowerCase();
  for (const [key, val] of Object.entries(ROLE_DATABASE)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  
  // Default fallback
  return ROLE_DATABASE["Software Engineer"];
}

module.exports = {
  ROLE_DATABASE,
  getRoleConfig
};
