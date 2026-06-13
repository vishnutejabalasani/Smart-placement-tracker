# TrustWeave Smart Placement Tracker (Co-Pilot and Security Monitor)

The Smart Placement Tracker is a secure, real-time MERN-stack placement management system designed to streamline recruitment drives for students and administrators. Powered by Gemini AI and real-time WebSockets, it provides automated resume matching, interactive mock interview simulations, and an active security command center to detect anomalies and eligibility bypass attempts.

---

## Key Features

1. **AI Resume Co-Pilot:** Evaluates student resumes against job openings, proposing keyword optimizations and strength analysis using Gemini AI.
2. **AI Mock Coach Simulator:** Guides students through automated job-specific mock interview simulations, providing instant, evaluated feedback and scoring.
3. **Interactive Kanban Board:** Real-time application tracking with interactive drag-and-drop state updates.
4. **WebSocket Notification Feed:** Instant broadcasts for newly posted placement drives and real-time application status updates.
5. **Security Command Center:** Tracks network-level rate limit spikes and flags student eligibility bypasses (e.g. attempting to apply below the CGPA cut-off).
6. **Robust Access Control:** Role-Based Access Control (RBAC) auth middleware with active account suspension/ban capabilities.

---

## Core System Workflows

### 1. Student Onboarding and Profile Maintenance
- Students register using their academic email address, password, branch, CGPA, and contact information.
- Once authenticated, students can update their skills list and paste their plain-text resume content directly into the profile editor.
- Students can invoke the AI Resume Optimizer. This triggers a request that compares their resume against a target job posting, providing feedback and optimizing the draft using Gemini AI.

### 2. Job Creation and Real-Time Broadcast
- Admin users can create job openings by specifying details such as company name, position role, compensation package (LPA), deadline, eligible branch departments, and a minimum CGPA cut-off.
- Saving a job posts it to the database and broadcasts a notification payload to all connected WebSocket clients. Active students immediately receive a notification banner on their dashboard.

### 3. Application Submission and Security Validation
- When a student applies to a job opening, the frontend verifies their CGPA eligibility. If the student meets the cut-off, the application status is set to "APPLIED" and tracked on the Kanban board.
- If a student tries to bypass frontend checks (e.g., via direct API requests), the backend security middleware interceptor queries the database. It will reject the submission, log a CGPA bypass anomaly in the database, and issue a real-time warning alert to the Admin dashboard.

### 4. Interactive AI Interview Simulation
- For applied positions, students can launch the AI Mock Coach.
- The simulator pulls relevant interview questions generated based on the specific job description and the student's resume.
- The student submits their responses, which are sent to the Gemini AI evaluation engine. The engine computes a score, generates feedback, and writes the practice session history to the database.

### 5. Admin Security Enforcement and Ban System
- The Security Command Center displays all logged rate limits and CGPA bypass anomalies in real-time.
- Admins can immediately suspend/ban violating student accounts from the dashboard.
- Once banned, the user's active socket is disconnected, their stored JWT token is invalidated by the request middleware, and any subsequent login attempts are rejected with a 403 status code.

---

## Project Directory Layout

The application is structured as a monorepo containing:
- **`/client`:** React SPA bootstrapped with Vite, using TailwindCSS and Socket.io-client.
- **`/server`:** Node.js Express backend using MongoDB/Mongoose, Socket.io, and the Google Gemini API.

```
smart-placement-tracker/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable layout and UI blocks
│   │   ├── context/        # Global Auth & Socket Context Providers
│   │   └── pages/          # Student & Admin dashboards
│   └── package.json
│
├── server/                 # Backend Node.js/Express Application
│   ├── config/             # Database connection setup
│   ├── controllers/        # Business logic for auth, applications, etc.
│   ├── middleware/         # Security and authentication pipelines
│   ├── models/             # Mongoose Schemas (User, Job, Anomaly, etc.)
│   ├── services/           # Gemini AI and Socket.io handlers
│   └── package.json
│
└── docker-compose.yml      # Orchestration config for containerized runs
```

---

## Configuration and Environment Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or a remote MongoDB Atlas URI)
- Gemini API Key (Optional; system falls back to a simulated mock mode if missing)

### Quick Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vishnutejabalasani/Smart-placement-tracker.git
   cd Smart-placement-tracker
   ```

2. **Backend Setup:**
   Configure environment variables in the `/server` directory before starting. Refer to `/server/README.md` for parameter definitions.
   ```bash
   cd server
   npm install
   # Run seed script to populate test database
   npm run seed
   # Start development server
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   # Start Vite development server
   npm run dev
   ```

4. **Access the Portals:**
   - Client Portal: `http://localhost:5173/`
   - Backend API: `http://localhost:5000/`

---

## Docker Deployment Guide

The root directory contains a `docker-compose.yml` file to run both services in containerized environments.

### Docker Compose Commands

1. **Build and Run Containers:**
   ```bash
   docker-compose up --build
   ```
   This command pulls base images, builds both frontend and backend Dockerfiles, configures internal networking links, and runs the application.

2. **Stop Containers:**
   ```bash
   docker-compose down
   ```

3. **View Container Logs:**
   ```bash
   docker-compose logs -f
   ```

---

## Test Credentials (Seed Data)

You can use the following pre-seeded credentials for immediate demonstration:

- **Admin Account:**
  - **Email:** `admin@anurag.edu.in`
  - **Password:** `adminpassword123`
  
- **Student Account:**
  - **Email:** `student@anurag.edu.in`
  - **Password:** `studentpassword123`
