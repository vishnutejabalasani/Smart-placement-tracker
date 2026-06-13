# TrustWeave Smart Placement Tracker (Co-Pilot & Security Monitor)

The **Smart Placement Tracker** is a secure, real-time MERN-stack placement management system designed to streamline recruitment drives for students and administrators. Powered by **Gemini AI** and real-time **WebSockets**, it provides automated resume matching, interactive mock interview simulations, and an active security command center to detect anomalies and bypass attempts.

---

## 🌟 Key Features

1. **AI Resume Co-Pilot:** Evaluates student resumes against job openings, proposing keyword optimizations and strength analysis using Gemini AI.
2. **AI Mock Coach Simulator:** Guides students through automated job-specific mock interview simulations, providing instant, evaluated feedback and scoring.
3. **Interactive Kanban Board:** Real-time application tracking with interactive drag-and-drop state updates.
4. **WebSocket Notification Feed:** Instant broadcasts for newly posted placement drives and real-time application status updates.
5. **Security Command Center:** Tracks network-level rate limit spikes and flags student eligibility bypasses (e.g. attempting to apply below the CGPA cut-off).
6. **Robust Access Control:** RBAC-enforced auth middleware with active account suspension/ban capabilities.

---

## 🏗️ Project Architecture

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

## 🚀 Getting Started

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
   See `/server/README.md` for environment variables configuration.
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

## 👤 Test Credentials (Seed Data)

You can use the following pre-seeded credentials for immediate demonstration:

- **Admin Account:**
  - **Email:** `admin@anurag.edu.in`
  - **Password:** `adminpassword123`
  
- **Student Account:**
  - **Email:** `student@anurag.edu.in`
  - **Password:** `studentpassword123`
