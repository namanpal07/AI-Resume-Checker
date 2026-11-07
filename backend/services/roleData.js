/**
 * Curated database of tech roles, core competencies, keywords, and industry expectations.
 * EXACTLY 20 main job roles organised into 7 industry categories.
 */

const ROLE_DATABASE = {
  // 1. Software Development
  "Software Engineer": {
    title: "Software Engineer",
    category: "Software Development",
    icon: "💻",
    description: "Develop scalable software systems, design algorithms, and build foundational code solutions.",
    coreSkills: ["Data Structures", "Algorithms", "System Design", "Git", "OOP", "Problem Solving", "Java", "Python", "C++", "C"],
    secondarySkills: ["CI/CD", "Unit Testing", "Docker", "Agile", "REST APIs", "SQL", "Linux", "Code Review"],
    keywords: ["Object-Oriented Programming", "Design Patterns", "Data Structures", "Algorithms", "System Architecture", "Git", "Scalability", "Testing", "CI/CD", "Clean Code"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Full Stack Developer": {
    title: "Full Stack Developer",
    category: "Software Development",
    icon: "🌐",
    description: "Build complete web applications spanning both client-side interfaces and server-side databases.",
    coreSkills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB", "SQL", "RESTful APIs", "Git"],
    secondarySkills: ["TypeScript", "Next.js", "Redux", "Tailwind CSS", "Docker", "AWS", "GraphQL", "Jest", "PostgreSQL"],
    keywords: ["Full Stack", "MERN", "Frontend", "Backend", "REST APIs", "State Management", "Database Design", "Authentication", "CRUD", "Responsive Design", "Deployment"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Frontend Developer": {
    title: "Frontend Developer",
    category: "Software Development",
    icon: "🖥️",
    description: "Craft modern responsive web pages, integrate interactive UI logic, and optimize client experiences.",
    coreSkills: ["HTML5", "CSS3", "JavaScript", "React", "Tailwind CSS", "Responsive Design", "DOM Manipulation", "Git"],
    secondarySkills: ["TypeScript", "Redux", "Next.js", "Sass", "Vue.js", "Webpack", "Vite", "Jest", "UI/UX"],
    keywords: ["Frontend", "Single Page Application", "Component Lifecycle", "Accessibility", "Cross-Browser Compatibility", "Performance Optimization", "CSS Frameworks", "Responsive Layout"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Backend Developer": {
    title: "Backend Developer",
    category: "Software Development",
    icon: "⚙️",
    description: "Build secure APIs, model backend database structures, and handle system logic integrations.",
    coreSkills: ["Node.js", "Express", "Python", "Java", "SQL", "MongoDB", "PostgreSQL", "REST APIs", "Git"],
    secondarySkills: ["Docker", "Redis", "Kafka", "Microservices", "JWT", "OAuth", "AWS", "GraphQL", "ORM"],
    keywords: ["API Development", "Database Normalization", "Authentication", "Middleware", "Server Architecture", "Caching", "Microservices", "Data Integrity", "Security"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Java Developer": {
    title: "Java Developer",
    category: "Software Development",
    icon: "☕",
    description: "Program enterprise systems, backend APIs, and web services using the Java ecosystem.",
    coreSkills: ["Java", "Spring Boot", "Hibernate", "Maven", "SQL", "OOP", "JDBC", "Git"],
    secondarySkills: ["Microservices", "Gradle", "JUnit", "JPA", "Docker", "PostgreSQL", "Kafka", "REST APIs", "DSA"],
    keywords: ["Enterprise Java", "Spring Framework", "Multithreading", "JVM", "Dependency Injection", "Hibernate ORM", "Microservices", "Clean Architecture", "Unit Testing"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Python Developer": {
    title: "Python Developer",
    category: "Software Development",
    icon: "🐍",
    description: "Write automation scripts, develop web servers, and design data integrations using Python.",
    coreSkills: ["Python", "Django", "FastAPI", "Flask", "SQL", "Git", "OOP", "REST APIs"],
    secondarySkills: ["Pandas", "NumPy", "Docker", "PostgreSQL", "Redis", "Celery", "Linux", "PyTest"],
    keywords: ["Pythonic Code", "Web Frameworks", "Automation", "AsyncIO", "Data Processing", "Object-Oriented Programming", "RESTful Web Services", "Scripting"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },

  // 2. Mobile Development
  "iOS Developer (Swift / SwiftUI)": {
    title: "iOS Developer (Swift / SwiftUI)",
    category: "Mobile Development",
    icon: "🍏",
    description: "Architect high-performance native iOS mobile applications using Swift, SwiftUI, and Apple SDKs.",
    coreSkills: ["Swift", "SwiftUI", "UIKit", "Xcode", "Core Data", "iOS", "Auto Layout", "Git"],
    secondarySkills: ["CocoaPods", "SPM", "Combine", "TestFlight", "Objective-C", "REST APIs", "App Store Guidelines", "Memory Management"],
    keywords: ["iOS Development", "Swift", "SwiftUI", "UIKit", "Xcode", "Mobile Architecture", "MVC", "MVVM", "Core Data", "App Store Deployment"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Android Developer": {
    title: "Android Developer",
    category: "Mobile Development",
    icon: "🤖",
    description: "Engineer native Android applications utilizing Kotlin, Jetpack Compose, and modern Android architecture.",
    coreSkills: ["Kotlin", "Java", "Android SDK", "Jetpack Compose", "XML", "Android Studio", "Git", "REST APIs"],
    secondarySkills: ["Coroutines", "Flow", "Room Database", "Retrofit", "Dagger Hilt", "Gradle", "MVVM", "Firebase"],
    keywords: ["Android Development", "Kotlin", "Jetpack Compose", "Android SDK", "Activity Lifecycle", "Room DB", "Play Store Deployment", "Material Design"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Flutter Developer": {
    title: "Flutter Developer",
    category: "Mobile Development",
    icon: "📱",
    description: "Build cross-platform mobile apps for iOS and Android using Flutter framework and Dart language.",
    coreSkills: ["Flutter", "Dart", "Cross-Platform", "Mobile Development", "REST APIs", "State Management", "Git"],
    secondarySkills: ["Bloc", "Provider", "Riverpod", "Firebase", "SQLite", "GetX", "Animations", "App Store Deployment"],
    keywords: ["Flutter Framework", "Dart Language", "Cross-Platform Development", "Widget Tree", "State Management", "Hot Reload", "Mobile UI", "App Performance"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },

  // 3. AI & Machine Learning
  "AI Engineer": {
    title: "AI Engineer",
    category: "AI & Machine Learning",
    icon: "🧠",
    description: "Design artificial intelligence solutions, integrate intelligent inference APIs, and train deep learning models.",
    coreSkills: ["Python", "Machine Learning", "Deep Learning", "AI Integration", "TensorFlow", "PyTorch", "APIs", "Git"],
    secondarySkills: ["LLMs", "NLP", "Hugging Face", "Vector Databases", "LangChain", "OpenAI API", "Docker", "Model Deployment"],
    keywords: ["Artificial Intelligence", "AI Solutions", "Model Integration", "Deep Learning", "Inference Pipelines", "AI APIs", "Prompt Engineering", "Neural Networks"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Machine Learning Engineer": {
    title: "Machine Learning Engineer",
    category: "AI & Machine Learning",
    icon: "🔬",
    description: "Deploy machine learning pipelines, fine-tune neural nets, and implement end-to-end MLOps solutions.",
    coreSkills: ["Python", "Scikit-Learn", "TensorFlow", "PyTorch", "Machine Learning", "Feature Engineering", "Data Pipelines", "Git"],
    secondarySkills: ["MLOps", "Docker", "Kubernetes", "AWS SageMaker", "MLflow", "Model Optimization", "NumPy", "Pandas"],
    keywords: ["Supervised Learning", "Unsupervised Learning", "Model Training", "Hyperparameter Tuning", "MLOps", "Computer Vision", "NLP", "Model Evaluation"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Generative AI Engineer": {
    title: "Generative AI Engineer",
    category: "AI & Machine Learning",
    icon: "✨",
    description: "Architect LLM applications, construct Retrieval-Augmented Generation (RAG) systems, and fine-tune foundation models.",
    coreSkills: ["Python", "Generative AI", "LLMs", "Prompt Engineering", "RAG", "LangChain", "Vector Databases", "Git"],
    secondarySkills: ["Fine-Tuning", "LlamaIndex", "Hugging Face", "OpenAI API", "Gemini API", "ChromaDB", "Pinecone", "Embeddings"],
    keywords: ["Generative AI", "Large Language Models", "Retrieval-Augmented Generation", "Prompt Design", "Vector Search", "Agentic Workflows", "Context Windows", "AI Agents"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },

  // 4. Data & Analytics
  "Data Analyst": {
    title: "Data Analyst",
    category: "Data & Analytics",
    icon: "📊",
    description: "Transform raw organizational metrics into executive charts, SQL queries, and actionable business insights.",
    coreSkills: ["SQL", "Excel", "Python", "Tableau", "Power BI", "Data Visualization", "Statistics", "Git"],
    secondarySkills: ["Pandas", "NumPy", "Data Cleaning", "ETL", "Dashboard Design", "Business Intelligence", "DAX", "Reporting"],
    keywords: ["Data Analytics", "Quantitative Analysis", "Dashboard Creation", "Statistical Modeling", "Data Wrangling", "KPI Tracking", "Exploratory Data Analysis"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Data Scientist": {
    title: "Data Scientist",
    category: "Data & Analytics",
    icon: "📈",
    description: "Build predictive models, execute hypothesis testing, and discover hidden trends across massive datasets.",
    coreSkills: ["Python", "Machine Learning", "Statistics", "Pandas", "NumPy", "Scikit-Learn", "SQL", "Data Modeling"],
    secondarySkills: ["Deep Learning", "TensorFlow", "PyTorch", "Data Visualization", "Jupyter", "Hypothesis Testing", "A/B Testing", "Git"],
    keywords: ["Predictive Analytics", "Hypothesis Testing", "Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Cross-Validation", "Data Pipelines"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Data Engineer": {
    title: "Data Engineer",
    category: "Data & Analytics",
    icon: "🗄️",
    description: "Build robust data pipelines, orchestrate distributed ETL workflows, and maintain enterprise data lakes.",
    coreSkills: ["SQL", "Python", "ETL", "Data Pipelines", "Data Warehousing", "Apache Spark", "Airflow", "Git"],
    secondarySkills: ["Hadoop", "Kafka", "Snowflake", "dbt", "PostgreSQL", "AWS", "BigQuery", "Data Modeling", "Databricks"],
    keywords: ["Data Pipeline", "ETL Pipeline", "Data Warehouse", "Data Lake", "Distributed Computing", "Batch Processing", "Stream Processing", "Schema Design"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },

  // 5. Cloud & DevOps
  "DevOps Engineer": {
    title: "DevOps Engineer",
    category: "Cloud & DevOps",
    icon: "♾️",
    description: "Automate build pipelines, orchestrate Kubernetes clusters, and guarantee high-availability infrastructure.",
    coreSkills: ["Docker", "Kubernetes", "CI/CD", "Linux", "Git", "AWS", "Terraform", "Bash"],
    secondarySkills: ["Jenkins", "GitHub Actions", "Ansible", "Prometheus", "Grafana", "Python", "Helm", "Networking"],
    keywords: ["Infrastructure as Code", "Containerization", "Continuous Integration", "Continuous Delivery", "Site Reliability", "Cloud Provisioning", "Monitoring"],
    expectedSections: ["Summary", "Education", "Skills", "Projects", "Experience"]
  },
  "Cloud Engineer": {
    title: "Cloud Engineer",
    category: "Cloud & DevOps",
    icon: "☁️",
    description: "Architect cloud infrastructure, configure serverless systems, and manage enterprise security perimeters.",
    coreSkills: ["AWS", "Azure", "GCP", "Cloud Architecture", "Linux", "Networking", "IAM", "Terraform"],
    secondarySkills: ["Docker", "Kubernetes", "Serverless", "CloudFormation", "Python", "CloudWatch", "Cost Optimization", "Security"],
    keywords: ["Cloud Migration", "Virtual Private Cloud", "Serverless Architecture", "Identity & Access Management", "High Availability", "Disaster Recovery"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },

  // 6. Testing & Quality Assurance
  "QA Engineer": {
    title: "QA Engineer",
    category: "Testing & Quality Assurance",
    icon: "🧪",
    description: "Verify software quality, execute comprehensive test suites, track defects, and validate system stability.",
    coreSkills: ["Manual Testing", "Test Cases", "Bug Tracking", "QA", "JIRA", "API Testing", "Postman", "SDLC"],
    secondarySkills: ["Regression Testing", "Smoke Testing", "Test Plans", "SQL", "Selenium", "Agile", "User Acceptance Testing"],
    keywords: ["Quality Assurance", "Test Case Execution", "Defect Lifecycle", "Bug Reporting", "Functional Testing", "Integration Testing", "Test Documentation"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },
  "Automation Test Engineer": {
    title: "Automation Test Engineer",
    category: "Testing & Quality Assurance",
    icon: "⚡",
    description: "Develop automated testing frameworks, write E2E test scripts, and integrate QA testing with CI/CD pipelines.",
    coreSkills: ["Selenium", "Automation Testing", "Java", "Python", "Cypress", "TestNG", "Postman", "Git"],
    secondarySkills: ["Playwright", "Cucumber", "CI/CD", "Jenkins", "JUnit", "REST APIs", "API Automation", "Page Object Model"],
    keywords: ["Test Automation", "Automation Frameworks", "Continuous Testing", "End-to-End Testing", "Script Development", "BDD", "TDD", "Cross-Browser Testing"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  },

  // 7. Design
  "UI/UX Designer": {
    title: "UI/UX Designer",
    category: "Design",
    icon: "🎨",
    description: "Create user-centered design systems, craft wireframes and interactive prototypes, and lead usability research.",
    coreSkills: ["UI/UX Design", "Figma", "Wireframing", "Prototyping", "User Research", "Design Systems", "Usability Testing", "Information Architecture"],
    secondarySkills: ["Adobe XD", "Illustrator", "Photoshop", "Responsive Design", "Interaction Design", "User Personas", "Visual Design", "Design Thinking"],
    keywords: ["UI/UX", "User Interface", "User Experience", "Figma Components", "Wireframes", "Interactive Prototypes", "Design System", "User Centered Design", "Human Computer Interaction"],
    expectedSections: ["Summary", "Education", "Skills", "Projects"]
  }
};

/**
 * Normalizes role string to match keys, including aliases and variations
 */
function getRoleConfig(roleName) {
  if (!roleName) return ROLE_DATABASE["Software Engineer"];
  
  // Exact match
  if (ROLE_DATABASE[roleName]) {
    return ROLE_DATABASE[roleName];
  }
  
  const lower = roleName.toLowerCase().trim();

  // Smart alias mapping
  if (lower.includes('ios') || lower.includes('swift') || lower.includes('swiftui')) {
    return ROLE_DATABASE["iOS Developer (Swift / SwiftUI)"];
  }
  if (lower.includes('android') || lower.includes('kotlin')) {
    return ROLE_DATABASE["Android Developer"];
  }
  if (lower.includes('flutter') || lower.includes('dart')) {
    return ROLE_DATABASE["Flutter Developer"];
  }
  if (lower.includes('generative ai') || lower.includes('genai') || lower.includes('gen ai') || lower.includes('rag') || lower.includes('llm')) {
    return ROLE_DATABASE["Generative AI Engineer"];
  }
  if (lower.includes('ui/ux') || lower.includes('ui ux') || lower.includes('ui designer') || lower.includes('ux designer') || lower.includes('figma') || lower.includes('product designer') || lower.includes('design')) {
    return ROLE_DATABASE["UI/UX Designer"];
  }
  if (lower.includes('automation test') || lower.includes('sdet') || lower.includes('selenium') || lower.includes('cypress')) {
    return ROLE_DATABASE["Automation Test Engineer"];
  }
  if (lower.includes('qa') || lower.includes('quality assurance') || lower.includes('tester')) {
    return ROLE_DATABASE["QA Engineer"];
  }
  if (lower.includes('data engineer') || lower.includes('spark') || lower.includes('airflow')) {
    return ROLE_DATABASE["Data Engineer"];
  }
  if (lower.includes('data analyst') || lower.includes('bi analyst') || lower.includes('power bi')) {
    return ROLE_DATABASE["Data Analyst"];
  }
  if (lower.includes('data scientist')) {
    return ROLE_DATABASE["Data Scientist"];
  }
  if (lower.includes('machine learning') || lower.includes('ml engineer')) {
    return ROLE_DATABASE["Machine Learning Engineer"];
  }
  if (lower.includes('ai engineer') || lower.includes('artificial intelligence')) {
    return ROLE_DATABASE["AI Engineer"];
  }
  if (lower.includes('devops') || lower.includes('sre') || lower.includes('site reliability')) {
    return ROLE_DATABASE["DevOps Engineer"];
  }
  if (lower.includes('cloud')) {
    return ROLE_DATABASE["Cloud Engineer"];
  }
  if (lower.includes('java')) {
    return ROLE_DATABASE["Java Developer"];
  }
  if (lower.includes('python')) {
    return ROLE_DATABASE["Python Developer"];
  }
  if (lower.includes('full stack') || lower.includes('fullstack') || lower.includes('mern') || lower.includes('mean')) {
    return ROLE_DATABASE["Full Stack Developer"];
  }
  if (lower.includes('frontend') || lower.includes('front end') || lower.includes('react')) {
    return ROLE_DATABASE["Frontend Developer"];
  }
  if (lower.includes('backend') || lower.includes('back end') || lower.includes('node')) {
    return ROLE_DATABASE["Backend Developer"];
  }

  // General substring search across database
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
