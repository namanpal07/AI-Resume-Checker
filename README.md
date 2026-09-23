# 🚀 AI Resume Checker & AI Interview Coach

A complete, full-stack web application designed to help tech candidates optimize their resumes for Applicant Tracking Systems (ATS), identify missing skills, compare against real job descriptions, and prepare for interviews with realistic practice questions and answer evaluations.

---

## 🌟 Key Features

* **Rule-Based ATS Scoring Engine**: Calculates an objective ATS score (0–100%) and detailed breakdown based strictly on your uploaded resume text—not random AI guesses.
* **Real Document Parsing**: Upload real **PDF** and **DOCX** files. The backend extracts text, parses sections (Summary, Skills, Education, Projects, Experience), and extracts contact details.
* **Dark & Light Mode Switcher**: Built with a modern SaaS interface featuring an instant Dark/Light theme toggle that persists across all pages.
* **Job Description Matcher**: Paste any job description from LinkedIn or Indeed to calculate an exact match percentage, matched skills, and missing keywords.
* **AI Resume Improvement**: Get suggestions for stronger bullet points using action verbs and measurable metrics (STAR method), without fabricating fake experience or false tools.
* **AI Interview Coach & Mock Practice**: Generates interview questions tailored to your actual resume projects and target role. Practice your answers and receive structured rubric feedback.
* **MongoDB Database Persistence**: Saves evaluation reports, candidate mock sessions, and feedback history to MongoDB.
* **Offline & Free-Tier Resilient**: Operates with zero crashes even if MongoDB or Gemini API keys are offline, using intelligent heuristic fallbacks.

---

## 🏗️ How It Works (Architecture)

```text
[ Browser / Frontend ]
  │
  ├── 1. Upload PDF/DOCX Resume & Pick Target Role
  ▼
[ Node.js / Express Backend ]
  │
  ├── Multer File Validation (PDF & DOCX, Max 5MB)
  ▼
[ Text Extraction & Parsing ]
  ├── pdf-parse (PDFs) & mammoth (DOCX)
  ├── Section & Skill Detection
  ▼
[ Rule-Based ATS Engine ]
  ├── Keyword Match (30%)
  ├── Skills Match (25%)
  ├── Sections Structure (15%)
  ├── Formatting & Quality (10%)
  ├── Experience & Metrics (10%)
  └── Education Relevance (10%)
  │
  ├──► [ MongoDB ] ── Stores Analysis History & Reports
  ├──► [ Gemini AI ] ── Rewrites Bullet Points & Evaluates Mock Answers
  │
  ▼
[ Dashboard & Interactive Report ]
```

---

## 🛠️ Tech Stack

### Frontend
* **HTML5**: Semantic and responsive page layouts.
* **Vanilla JavaScript**: Lightweight state management, dynamic circular score gauges, and fast API communication.
* **CSS3 Design Tokens**: Modern SaaS layout with responsive desktop sidebar, mobile drawer, and Dark/Light mode theme switching.

### Backend
* **Node.js & Express.js**: REST API serving both data endpoints and frontend pages.
* **Multer**: Multi-part file upload processing with file validation.
* **Document Parsers**: `pdf-parse` (PDF) and `mammoth` (DOCX).
* **MongoDB & Mongoose**: Persistent storage for analysis history, mock interview trials, and contact submissions.
* **Google Gemini AI** (`@google/genai`): Contextual resume phrasing improvements, tailored interview question generation, and candidate answer evaluation.

---

## 📂 Project Structure

```text
AI-Resume-Checker/
│
├── package.json              # Root launch scripts (npm run dev / npm start)
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions (node_modules, .env, uploads)
├── README.md                 # Complete documentation & guide
│
├── frontend/                 # Client UI
│   ├── index.html            # Landing page
│   ├── dashboard.html        # Main dashboard with stats & recent history
│   │
│   ├── pages/                # Subpages
│   │   ├── role.html         # 15 Curated Job Roles with Search Filter
│   │   ├── upload.html       # Resume Drag-and-Drop Upload
│   │   ├── analysis.html     # Real-Time Multi-Stage Parsing Animation
│   │   ├── report.html       # ATS Score Dashboard & Circular Gauge
│   │   ├── matcher.html      # Job Description vs Resume Matcher
│   │   ├── improve.html      # AI Resume Improvement & Bullet Rewrites
│   │   ├── interview.html    # AI Interview Coach & Mock Practice Arena
│   │   ├── history.html      # MongoDB Analysis History
│   │   ├── about.html        # Architecture Overview
│   │   └── contact.html      # Contact Form connected to MongoDB
│   │
│   ├── css/                  # Stylesheets
│   │   ├── style.css         # Global design system & Dark/Light mode tokens
│   │   ├── home.css          # Landing page styles
│   │   ├── role.css          # Job role cards
│   │   ├── upload.css        # Drag-and-drop dropzone
│   │   ├── analysis.css      # Spinner & checklist animations
│   │   ├── report.css        # Score ring & breakdown progress bars
│   │   ├── about.css         # About page styles
│   │   └── contact.css       # Contact form styles
│   │
│   └── js/                   # Frontend Scripts
│       ├── api.js            # Centralized API service & Toast UI alerts
│       ├── main.js           # App shell, drawer & Dark/Light theme toggle
│       ├── home.js           # Animated score counter
│       ├── dashboard.js      # Dashboard metrics & history table
│       ├── role.js           # Role selection & search filter
│       ├── upload.js         # File upload handling & validation
│       ├── analysis.js       # Real-time multi-stage analysis coordinator
│       ├── report.js         # ATS report rendering & SVG circular gauge
│       ├── matcher.js        # Job description comparison logic
│       ├── improve.js        # AI bullet rewrites & copy buttons
│       ├── interview.js      # Interview questions & mock answer evaluation
│       ├── history.js        # MongoDB history management & delete actions
│       └── contact.js        # Contact form submission
│
└── backend/                  # Server Logic
    ├── server.js             # Express app, MongoDB connection & static serving
    ├── package.json          # Backend dependencies
    ├── .env.example          # Environment template
    ├── test-suite.js         # Automated end-to-end test suite (26 checks)
    │
    ├── models/               # Mongoose Schemas (Analysis, Interview, Contact)
    ├── services/             # Core Services (parser, ATS engine, roleData, Gemini)
    ├── controllers/          # Controllers (resume, AI, contact)
    ├── routes/               # Express Routes
    └── uploads/              # Local upload directory (.gitkeep)
```

---

## ⚡ How to Run Locally

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (Local MongoDB running on port `27017` or MongoDB Atlas URI)
* *(Optional)* **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 2. Installation
Install backend dependencies:

```bash
cd backend
npm install
```

### 3. Environment Variables
Inside the `backend/` directory, create a `.env` file (or copy `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_resume_coach
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the Application
From the root directory:

```bash
npm run dev
```

Or from the `backend/` folder:

```bash
npm start
```

Open your browser and navigate to:
👉 **`http://localhost:5000/`**

---

## 🧪 Automated Testing

An automated test suite with 26 checks is included:

```bash
cd backend
node test-suite.js
```

All 26 tests verify MongoDB connectivity, PDF parsing, ATS scoring formulas, job description matching, AI services, and database persistence.

---

## 🌐 Deploying Live (Step-by-Step)

You can deploy this full-stack application **for free** in less than 5 minutes! Because Express serves both the REST API and the static frontend, the entire project runs as a single web service.

### Step 1: Create a Free MongoDB Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user (username and password).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ai_resume_coach?retryWrites=true&w=majority
   ```

### Step 2: Deploy on Render.com (Recommended Free Host)
1. Push this repository to your GitHub account (`https://github.com/namanpal07/AI-Resume-Checker`).
2. Go to [render.com](https://render.com/) and sign in with GitHub.
3. Click **New +** -> **Web Service**.
4. Select your `AI-Resume-Checker` repository.
5. Configure the service:
   * **Name**: `ai-resume-checker`
   * **Root Directory**: leave blank (or `backend`)
   * **Environment**: `Node`
   * **Build Command**: `cd backend && npm install`
   * **Start Command**: `node backend/server.js`
6. Scroll down to **Environment Variables** and add:
   * `PORT`: `5000`
   * `MONGODB_URI`: your MongoDB Atlas connection string from Step 1
   * `GEMINI_API_KEY`: your Google Gemini API key (optional but recommended)
7. Click **Deploy Web Service**!
   Render will build the app and give you a live HTTPS URL (e.g. `https://ai-resume-checker.onrender.com`).

---

## 📊 ATS Scoring Weights

$$\text{ATS Score} = (0.30 \times \text{Keywords}) + (0.25 \times \text{Skills}) + (0.15 \times \text{Sections}) + (0.10 \times \text{Formatting}) + (0.10 \times \text{Experience}) + (0.10 \times \text{Education})$$

* **Keyword Match (30%)**: Measures density of essential terms expected for the role.
* **Skills Match (25%)**: Evaluates core required competencies (75%) and secondary skills (25%).
* **Sections Completeness (15%)**: Verifies presence of Contact Info, Education, Skills, Projects, Experience, and Summary.
* **Formatting & Quality (10%)**: Validates readable word count (350–1200 words) and contact accessibility.
* **Experience & Metrics (10%)**: Checks for active action verbs and quantified impact metrics (% and numbers).
* **Education (10%)**: Checks for recognized degree and academic qualifications.

---

## 🎓 Interview Talking Points

When demonstrating this project in interviews:
1. **Separation of Concerns**: Explain why you chose deterministic algorithmic scoring for ATS calculations and reserved generative AI for resume phrasing improvements.
2. **Real Binary Parsing**: Describe how `multer`, `pdf-parse`, and `mammoth` process uploaded binary buffers into clean text structures.
3. **Resilient System Design**: Discuss how the application uses MongoDB for persistence while maintaining client-side fallbacks so users never see a crashed page.

