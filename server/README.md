# Server (Node.js/Express Backend REST & WebSocket API)

The server acts as the central data orchestrator, running on Express and managing persistent storage in MongoDB, real-time broadcasts through Socket.io, and analytical feedback using the Google Gemini API.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Security:** JSON Web Tokens (JWT) & bcryptjs
- **Real-Time Communications:** Socket.io
- **AI Integrations:** Google Generative AI (Gemini Pro)
- **Testing:** Jest & Supertest

---

## 📂 Codebase Structure

```
server/
├── config/
│   └── db.js                       # MongoDB Mongoose connection handler
│
├── controllers/
│   ├── auth.controller.js          # Handles login, registration, and me endpoints
│   ├── job.controller.js           # Handles listing and posting jobs
│   ├── student.controller.js       # Student applications and Kanban movements
│   ├── mockInterview.controller.js # Initiates and evaluates interview mock stages
│   └── anomaly.controller.js       # Admin resolving/banning violators
│
├── middleware/
│   ├── auth.middleware.js          # JWT checks and [BANNED] status lookup
│   ├── security.middleware.js      # CGPA bypass and request rate spike checkers
│   └── error.middleware.js         # Unified HTTP error handling block
│
├── models/
│   ├── User.js                     # Users (Admin / Student) Schema
│   ├── Job.js                      # Placement Drives Schema
│   ├── Application.js              # Application State Tracker Schema
│   ├── MockInterview.js            # Simulated Session Logs Schema
│   └── Anomaly.js                  # Logged Anomalies Schema
│
├── routes/
│   ├── auth.routes.js              # Auth endpoints map
│   ├── job.routes.js               # Placement drive openings endpoints map
│   └── student.routes.js           # Student application/interview endpoints map
│
└── services/
    ├── gemini.service.js           # Prompts and connections to Gemini
    └── socket.service.js           # Socket authentication and user-specific rooms
```

---

## 🛡️ Security & Anomaly Detection

### 1. Rate Limit Anomaly Detector
Tracks incoming request frequencies grouped by client IP addresses. If an IP exceeds `100 requests per minute`, the system logs a rate-limit anomaly, triggers a WebSocket alert to admins, and temporarily blocks the user's request.

### 2. CGPA Eligibility Guard
Prevents students from modifying their local DOM to apply to openings where their academic CGPA is below the minimum required cut-off. If a request is received on `/api/applications` that violates CGPA requirements:
- The attempt is immediately rejected.
- A critical security anomaly (`ANOMALY_CGPA_BYPASS`) is logged in the database.
- An alert is broadcast to the Admin dashboard.

### 3. Active Account Suspension (Ban Enforcement)
When an admin bans a student:
- The system flags their profile as banned (updating the phone prefix to `[BANNED]`).
- Subsequent login attempts return `403 Forbidden` immediately.
- The `protect` middleware intercepts any API requests using cached active tokens, query-checks their account status, and rejects them instantly.

---

## ⚡ Development & Testing Commands

Navigate to the `server/` directory and run:

### Environment Settings
Create a `.env` file in the `server/` directory with the following variables:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/placement_tracker
JWT_SECRET=your_jwt_secret_token
GEMINI_API_KEY=your_gemini_api_key  # Optional
CLIENT_URL=http://localhost:5173
```

### Install Dependencies
```bash
npm install
```

### Populate Seed Data
```bash
npm run seed
```

### Start Development Server
```bash
npm run dev
```

### Run Backend Unit Tests
```bash
npm test
```
Runs test cases for authentication, route guards, and Gemini integrations.
