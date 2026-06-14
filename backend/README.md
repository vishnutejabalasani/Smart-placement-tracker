# Backend — Node.js/Express REST & WebSocket API

The backend serves as the central data orchestrator, running on Express and managing persistent storage in MongoDB, real-time broadcasts through Socket.io, and AI-powered feedback via the Google Gemini API.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Server runtime |
| **Express.js** | Web framework and middleware pipeline |
| **MongoDB / Mongoose** | Database and ODM |
| **JWT / bcryptjs** | Authentication and password hashing |
| **Socket.io** | Real-time WebSocket communications |
| **Google Gemini AI** | Resume optimization and mock interviews |
| **Multer** | File upload handling (resume PDF/TXT) |
| **pdf-parse** | PDF text extraction |
| **Jest / Supertest** | Testing framework |

---

## Directory Structure

```
backend/
├── config/
│   └── db.js                      # MongoDB connection setup
├── controllers/
│   ├── auth.controller.js         # Registration, login, profile, resume upload
│   ├── job.controller.js          # Job CRUD and WebSocket broadcast
│   ├── student.controller.js      # Application submission and status management
│   ├── mockInterview.controller.js # AI interview generation and evaluation
│   └── anomaly.controller.js      # Security anomaly retrieval and resolution
├── middleware/
│   ├── auth.middleware.js          # JWT verification and RBAC guards
│   ├── security.middleware.js      # Rate limiting and CGPA bypass detection
│   └── error.middleware.js         # Centralized error handler
├── models/
│   ├── User.js                    # Student/Admin user schema
│   ├── Job.js                     # Job opening schema
│   ├── Application.js             # Student application schema
│   ├── MockInterview.js           # Mock interview session schema
│   └── Anomaly.js                 # Security anomaly log schema
├── routes/
│   ├── auth.routes.js             # Auth and profile endpoints
│   ├── job.routes.js              # Job management endpoints
│   └── student.routes.js          # Application and interview endpoints
├── services/
│   ├── gemini.service.js          # Gemini AI client with fallback mock mode
│   └── socket.service.js          # Socket.io initialization and room management
├── tests/
│   ├── auth.test.js               # Authentication flow tests
│   └── gemini.test.js             # AI service integration tests
├── server.js                      # Application entry point
├── seed.js                        # Database seeding script
└── package.json
```

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new student account |
| POST | `/login` | Public | Authenticate and receive JWT token |
| GET | `/me` | Authorized | Get current user profile |
| PUT | `/profile` | Authorized | Update profile fields |
| POST | `/profile/optimize` | Student | AI resume optimization against a target job |
| POST | `/profile/upload-resume` | Public | Upload and parse PDF/TXT resume |
| GET | `/profile/resume/:userId` | Public | Retrieve stored resume file |

### Jobs (`/api/jobs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authorized | List all active job openings |
| POST | `/` | Admin | Create job and broadcast via WebSocket |

### Applications (`/api/applications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Student | Submit application (with CGPA validation) |
| GET | `/student` | Student | Get student's applications |
| GET | `/admin` | Admin | Get all applications for review |
| PUT | `/:id/status` | Authorized | Update application Kanban status |

### Mock Interviews (`/api/applications/interview`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/start` | Student | Generate AI interview questions |
| POST | `/:id/submit` | Student | Submit answers for AI evaluation |
| GET | `/list` | Student | List past interview sessions |

### Security (`/api/applications/anomalies`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | Retrieve all security anomalies |
| PUT | `/:id/resolve` | Admin | Resolve anomaly or ban account |

---

## WebSocket Events

The real-time layer runs on Socket.io with JWT-authenticated connections:

| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | Authenticated handshake; user joins personal room |
| `join_admin_room` | Client → Server | Admin subscribes to security alert room |
| `notification` | Server → Client | Broadcasts job postings, status updates, and anomaly alerts |

---

## Gemini AI Integration

### Resume Optimization
- Feeds job description + student resume to Gemini
- Returns structured JSON: `skills` (suggested keywords), `strengths` (analysis), `optimizedResume` (draft)

### Mock Interview Coaching
- **Start:** Generates 3 MCQ-based technical questions from job role and student skills
- **Evaluate:** Scores answers (0-100), provides structured coaching feedback

### Resilient Fallback
- Missing API key or rate limits trigger automatic fallback to mock data engine
- Ensures application remains functional for demonstrations

---

## Security Middleware

| Middleware | Trigger | Response |
|---|---|---|
| **Rate Spike Detection** | >100 requests/min per IP | Logs anomaly, alerts admin, returns `429` |
| **CGPA Bypass Detection** | Application below cutoff | Logs anomaly, alerts admin, returns `403` |
| **Session Revocation** | Banned user makes request | Rejects with `403`, invalidates JWT |

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/placement_tracker
JWT_SECRET=your_jwt_signing_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

---

## Development

```bash
cd backend
npm install
npm run seed     # Seed test data
npm run dev      # Start with nodemon
```

## Testing

```bash
npm test
```

Runs Jest test suites covering authentication flows, role validation, and Gemini AI service fallbacks.
