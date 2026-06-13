# Server (Node.js/Express Backend REST and WebSocket API)

The server acts as the central data orchestrator, running on Express and managing persistent storage in MongoDB, real-time broadcasts through Socket.io, and analytical feedback using the Google Gemini API.

---

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Security:** JSON Web Tokens (JWT) and bcryptjs
- **Real-Time Communications:** Socket.io
- **AI Integrations:** Google Generative AI (Gemini Pro)
- **Testing:** Jest and Supertest

---

## API Endpoints Reference

### Authentication Endpoints
- `POST /api/auth/register`
  - **Access:** Public
  - **Description:** Onboards new student profile accounts.
- `POST /api/auth/login`
  - **Access:** Public
  - **Description:** Verifies credentials, checks for account suspensions, and issues JWT tokens.
- `GET /api/auth/me`
  - **Access:** Authorized (Student/Admin)
  - **Description:** Resolves the profile details of the active token owner.
- `POST /api/auth/profile/optimize`
  - **Access:** Authorized (Student)
  - **Description:** Evaluates resume text against a target job using Gemini AI, returning optimizations.

### Job Openings Endpoints
- `GET /api/jobs`
  - **Access:** Authorized (Student/Admin)
  - **Description:** Lists all active job opportunities.
- `POST /api/jobs`
  - **Access:** Authorized (Admin)
  - **Description:** Creates a new job opening and broadcasts it via WebSocket.

### Student Applications Endpoints
- `POST /api/applications`
  - **Access:** Authorized (Student)
  - **Description:** Submits a student application. Subject to backend CGPA validation.
- `GET /api/applications/student`
  - **Access:** Authorized (Student)
  - **Description:** Retrieves all job applications submitted by the logged-in student.
- `PUT /api/applications/:id/status`
  - **Access:** Authorized (Student/Admin)
  - **Description:** Moves the application status on the Kanban board.
- `GET /api/applications/admin`
  - **Access:** Authorized (Admin)
  - **Description:** Retrieves all submitted student applications for admin review.

### AI Mock Interview Endpoints
- `POST /api/applications/interview/start`
  - **Access:** Authorized (Student)
  - **Description:** Initiates a mock interview session and generates technical questions via Gemini AI.
- `POST /api/applications/interview/:id/submit`
  - **Access:** Authorized (Student)
  - **Description:** Evaluates submitted answers, calculates score, and generates feedback using Gemini AI.
- `GET /api/applications/interview/list`
  - **Access:** Authorized (Student)
  - **Description:** Lists previous mock practice interview histories for the student.

### Security and Anomaly Endpoints
- `GET /api/applications/anomalies`
  - **Access:** Authorized (Admin)
  - **Description:** Retrieves all logged security anomalies (rate spikes and eligibility bypasses).
- `PUT /api/applications/anomalies/:id/resolve`
  - **Access:** Authorized (Admin)
  - **Description:** Resolves an anomaly or executes account ban actions.

---

## WebSocket Event Definitions

The real-time communications layer runs on Socket.io.

### 1. Connection and Handshake
On client connection, the socket checks the token via middleware. If valid, the socket is bound to a room named after the user's ID (`socket.join(userId)`). This allows targeted, private messages to be sent to individual users.

### 2. Event Messages
- **`join_admin_room`:** Sent by the client if their account role is `admin`. The socket joins the `admin` room to subscribe to real-time security alerts.
- **`notification`:** Emitted by the server to specific rooms:
  - Admin room (`admin`): Receives real-time alerts on security anomalies (e.g. rate limit spikes and CGPA bypass attempts).
  - Student room (`userId`): Receives notifications when their application status is updated.
  - Broadcast: All active clients receive notifications when a new job is created.

---

## Gemini AI Integration Details

The backend interfaces with the Google Gemini API to offer AI resume reviews and automated mock interview simulations.

### 1. Resume Optimization
The controller feeds the target job description and the student's current resume content to the model, requesting a structured analysis:
- **Prompt Structure:** Asks the AI to identify matching strengths, highlight keyword omissions, and draft an optimized version of the resume.
- **Output Schema:** Enforces a clean JSON output containing `skills` (suggested keywords), `strengths` (narrative analysis), and `optimizedResume` (plain text draft).

### 2. Mock Interview Coaching
- **Start Simulation:** Gemini processes the student's skills and the job role to construct three relevant technical questions.
- **Evaluate Answers:** Upon submission, Gemini evaluates the student's answers, scores each response (0-100), and generates constructive coaching feedback.

### 3. Resilient Fallback System
If the `GEMINI_API_KEY` environment variable is missing or request rate limits are hit, the services catch the failure and switch to a mock data engine. This produces structured mock responses to ensure that application demonstrations remain functional.

---

## Security Engine and Middleware

### 1. Global Rate Spike Protection (`rateLimitAnomalyDetector`)
Tracks request rates in-memory using IP addresses. If an IP exceeds `100 requests per minute`, the middleware:
1. Logs an `ANOMALY_RATE_LIMIT` record in the database.
2. Emits a real-time warning payload to the admin room via WebSockets.
3. Rejects the request with a `429 Too Many Requests` status code.

### 2. Academic Bypass Protection (`cgpaEligibilityAnomalyDetector`)
When a POST request is made to `/api/applications`, the middleware compares the student's academic CGPA against the job's minimum required cut-off. If the CGPA is insufficient, the system:
1. Rejects the request with a `403 Forbidden` response.
2. Logs an `ANOMALY_CGPA_BYPASS` security record in the database.
3. Sends a real-time anomaly alert to the admin dashboard.

### 3. Session Revocation Guard
The `protect` middleware runs a query check against the database user record for every request. If the user's phone is prefixed with `[BANNED]`, the middleware rejects the request and returns a `403 Forbidden` response, rendering their active JWT token invalid.

---

## Testing Framework

The backend includes test suites built using Jest and Supertest to verify authentication flow stability.

To execute tests, run:
```bash
npm test
```
The suite verifies registration, login, token authentication, role validation, and the Gemini service fallbacks.
