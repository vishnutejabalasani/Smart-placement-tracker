# Frontend — React/Vite Portal

The frontend is a dynamic Single Page Application (SPA) built with React, Vite, and TailwindCSS. It consumes backend REST APIs and communicates in real time via WebSockets.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI framework |
| **Vite** | Fast HMR build tooling |
| **TailwindCSS** | Utility-first CSS styling |
| **Socket.io-client** | Real-time WebSocket communications |
| **Lucide React** | Modern icon library |
| **React Router DOM** | Client-side routing with RBAC guards |

---

## Component Architecture

The frontend follows a modular architecture with clearly separated concerns:

```
src/
├── components/
│   ├── common/
│   │   └── ProtectedRoute.jsx     # RBAC route guard (role-based access)
│   ├── dashboard/
│   │   ├── EditProfileModal.jsx    # Profile editor + AI Resume Optimizer
│   │   ├── InterviewHistory.jsx    # Past mock interview sessions sidebar
│   │   ├── JobCard.jsx             # Individual job listing card
│   │   ├── JobFilters.jsx          # Search, branch, eligibility filters
│   │   ├── KanbanBoard.jsx         # Drag-and-drop application tracker
│   │   ├── MockInterviewModal.jsx  # AI Mock Coach step-by-step simulator
│   │   └── ProfileSidebar.jsx      # Student credentials display
│   └── layout/
│       └── Navbar.jsx              # Top navigation bar
├── context/
│   └── AuthContext.jsx             # Global auth state + WebSocket provider
├── hooks/
│   ├── useAuth.js                  # Auth context consumer hook
│   └── useSocket.js                # Socket.io connection hook
├── pages/
│   ├── AdminDashboard.jsx          # Admin management console
│   ├── JobFeed.jsx                 # Public job listings feed
│   ├── Login.jsx                   # Authentication login page
│   ├── Register.jsx                # New user registration page
│   └── StudentDashboard.jsx        # Main student dashboard (orchestrator)
└── services/
    └── api.js                      # Centralized API service layer
```

---

## Key Design Decisions

### Modular Dashboard Components
The `StudentDashboard` page acts as an **orchestrator** that composes 6 independent, reusable components:

- **ProfileSidebar** — Displays CGPA, branch, skills, and resume link
- **JobFilters** — Search bar, branch dropdown, eligibility toggle
- **InterviewHistory** — Scrollable list of past AI mock interview scores
- **JobCard** — Individual job listing with apply button and eligibility check
- **EditProfileModal** — Full profile editor with integrated AI Resume Optimizer
- **MockInterviewModal** — Step-by-step MCQ interview simulation with scorecard

### Real-Time State Management
- `AuthContext` manages JWT tokens, user state, and WebSocket lifecycle
- Notification alerts from the backend are pushed via Socket.io and rendered as dismissible banners
- Application status updates trigger automatic re-polling of dashboard data

### Role-Based Access Control (RBAC)
- `ProtectedRoute` component wraps secured pages and validates user roles
- Unauthorized access attempts are logged with warnings and redirected to login

---

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

For production (e.g., Vercel deployment):
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## Development

```bash
cd frontend
npm install
npm run dev
```

Starts the Vite dev server on `http://localhost:5173/` with hot module reloading (HMR).

---

## Production Build

```bash
npm run build
```

Outputs optimized static assets to the `dist/` directory for deployment.
