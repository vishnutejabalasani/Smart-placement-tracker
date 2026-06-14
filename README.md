# Smart Placement Tracker — AI-Powered Campus Recruitment Platform

> A secure, real-time MERN-stack placement management system designed to streamline campus recruitment for students and administrators. Powered by **Gemini AI** and **WebSockets**, it delivers automated resume matching, interactive mock interview simulations, and an active security command center.

---

## Key Features

| Feature | Description |
|---|---|
| **AI Resume Co-Pilot** | Evaluates student resumes against job openings, suggesting keyword optimizations and strengths using Gemini AI. |
| **AI Mock Coach Simulator** | Guides students through job-specific MCQ-based mock interviews with instant AI-evaluated feedback and scoring. |
| **Interactive Kanban Board** | Real-time application tracking with drag-and-drop state management. |
| **WebSocket Notifications** | Instant broadcasts for new placement drives and application status updates via Socket.io. |
| **Security Command Center** | Tracks rate-limit anomalies and flags student eligibility bypass attempts in real time. |
| **Role-Based Access Control** | RBAC auth middleware with active account suspension and ban capabilities. |

---

## Architecture Overview

The application follows a **monorepo** structure with cleanly separated frontend and backend codebases:

- **`/frontend`** — React SPA bootstrapped with Vite, styled with TailwindCSS, and connected via Socket.io-client.
- **`/backend`** — Node.js/Express REST API with MongoDB/Mongoose, Socket.io, and Google Gemini AI integration.

```
smart-placement-tracker/
├── frontend/                    # React Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # ProtectedRoute, shared UI elements
│   │   │   ├── dashboard/       # JobCard, KanbanBoard, ProfileSidebar,
│   │   │   │                    # JobFilters, InterviewHistory,
│   │   │   │                    # EditProfileModal, MockInterviewModal
│   │   │   └── layout/          # Navbar
│   │   ├── context/             # AuthContext (global auth + socket state)
│   │   ├── hooks/               # useAuth, useSocket custom hooks
│   │   ├── pages/               # StudentDashboard, AdminDashboard,
│   │   │                        # Login, Register, JobFeed
│   │   └── services/            # Centralized API service layer
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Node.js/Express Backend Application
│   ├── config/                  # Database connection setup
│   ├── controllers/             # Business logic handlers
│   │   ├── auth.controller.js
│   │   ├── job.controller.js
│   │   ├── student.controller.js
│   │   ├── mockInterview.controller.js
│   │   └── anomaly.controller.js
│   ├── middleware/              # Auth, security, and error pipelines
│   ├── models/                  # Mongoose schemas (User, Job, Application, etc.)
│   ├── routes/                  # Express route definitions
│   ├── services/                # Gemini AI and Socket.io service handlers
│   ├── tests/                   # Jest unit and integration tests
│   ├── server.js                # Application entry point
│   ├── seed.js                  # Database seeding script
│   └── package.json
│
├── docker-compose.yml           # Container orchestration config
├── render.yaml                  # Render deployment blueprint
└── README.md
```

---

## Core System Workflows

### 1. Student Onboarding & Profile Management
- Students register with academic email, password, branch, CGPA, and contact info.
- Upload PDF/TXT resumes directly — parsed automatically and stored in the profile.
- Invoke the AI Resume Optimizer to compare resumes against target job postings.

### 2. Job Creation & Real-Time Broadcast
- Admins create job openings with company details, package, deadline, eligible branches, and CGPA cutoff.
- New jobs are instantly broadcast to all connected students via WebSocket notifications.

### 3. Application Submission & Security Validation
- Frontend verifies CGPA eligibility before submission; applied jobs are tracked on the Kanban board.
- Backend interceptor catches bypass attempts (e.g., direct API requests below cutoff), logs anomalies, and sends real-time alerts to the Admin dashboard.

### 4. AI Mock Interview Simulation
- Students launch the AI Mock Coach for applied positions.
- Gemini AI generates MCQ-based interview questions tailored to the job description and student resume.
- Answers are evaluated with scoring and structured feedback, saved as practice session history.

### 5. Admin Security & Ban Enforcement
- Security Command Center displays rate-limit spikes and eligibility bypass anomalies.
- Admins can instantly suspend or ban violating accounts — disconnecting active sockets and invalidating JWT tokens.

---

## Configuration & Setup

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local instance or MongoDB Atlas URI)
- **Gemini API Key** (optional — falls back to simulated mock mode if not provided)

### Quick Start

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vishnutejabalasani/Smart-placement-tracker.git
   cd Smart-placement-tracker
   ```

2. **Backend Setup:**
   Configure environment variables in `/backend/.env` before starting. See `/backend/README.md` for details.
   ```bash
   cd backend
   npm install
   npm run seed       # Populate test database
   npm run dev        # Start development server
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev        # Start Vite dev server
   ```

4. **Access the Application:**
   - Frontend Portal: `http://localhost:5173/`
   - Backend API: `http://localhost:5000/`

---

## Docker Deployment

The root `docker-compose.yml` orchestrates both services in containers:

```bash
# Build and run
docker-compose up --build

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

---

## Cloud Deployment

| Service | Platform | Config |
|---|---|---|
| Backend API | [Render](https://render.com) | `render.yaml` — auto-deploys from `backend/` |
| Frontend SPA | [Vercel](https://vercel.com) | `frontend/vercel.json` — SPA rewrite rules |

### Environment Variables (Backend)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `CLIENT_URL` | Frontend origin URL (for CORS) |
| `GEMINI_API_KEY` | Google Gemini API key (optional) |
| `PORT` | Server port (default: 5000) |

---

## Testing

```bash
cd backend
npm test
```

Runs Jest test suites covering authentication flows and Gemini AI service integration.

---

## Test Credentials (Seed Data)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@anurag.edu.in` | `adminpassword123` |
| **Student** | `student@anurag.edu.in` | `studentpassword123` |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Socket.io-client, Lucide Icons |
| **Backend** | Node.js, Express, Mongoose, Socket.io, Helmet, JWT |
| **AI Engine** | Google Gemini API (with fallback mock mode) |
| **Database** | MongoDB Atlas |
| **Deployment** | Render (backend), Vercel (frontend), Docker |
