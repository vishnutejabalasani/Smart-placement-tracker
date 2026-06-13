# Client (React/Vite Frontend Portal)

The TrustWeave client is a dynamic Single Page Application (SPA) built using React, Vite, and TailwindCSS. It consumes backend services over HTTP and real-time WebSockets.

---

## 🛠️ Technology Stack

- **Framework:** React 18+ (Vite Bundle)
- **Styling:** TailwindCSS (with Lucide React icons)
- **Real-Time Communications:** Socket.io-Client
- **Routing:** React Router DOM v6
- **Build Tooling:** PostCSS & Autoprefixer

---

## 📂 Codebase Structure

```
client/src/
├── components/
│   ├── common/
│   │   └── ProtectedRoute.jsx  # Handles RBAC path protection
│   ├── dashboard/
│   │   └── KanbanBoard.jsx     # Handles application phase cards
│   └── layout/
│       └── Navbar.jsx          # Live notification bell and sign-out
│
├── context/
│   └── AuthContext.jsx         # Controls authentication and WebSocket connections
│
├── hooks/
│   ├── useAuth.js              # Hook context consumer
│   └── useSocket.js            # General websocket helper
│
├── pages/
│   ├── Login.jsx               # Security portal authentication gateway
│   ├── Register.jsx            # Student registration page
│   ├── StudentDashboard.jsx    # Profile optimization and interview simulation
│   └── AdminDashboard.jsx      # Job broadcasts and anomaly command controls
│
├── services/
│   └── api.js                  # Standardized network request definitions
│
├── index.css                   # Global Tailwind layout & transitions
└── main.jsx                    # App entry point
```

---

## 🧠 State & WebSocket Management

### Context Provider (`AuthContext.jsx`)
Coordinates the session state:
- Maintains logged-in user details and JWT auth tokens in `localStorage`.
- Opens a **single WebSocket instance** tied to the user credentials.
- Optimizes connection stability using a specialized dependency array:
  `[token, user?._id, user?.role]`
  This setup prevents connection-disconnection loops when students edit non-credential fields like skills or resume plain texts.
- Intercepts real-time events and provides a globally accessible `notifications` array.

---

## ⚡ Development Commands

Navigate to the `client/` directory and run:

### Start Development Server
```bash
npm run dev
```
Starts the Vite server on `http://localhost:5173/` with hot module reloading (HMR).

### Production Build
```bash
npm run build
```
Compiles and bundles the application into optimized static assets located in the `/dist` directory.

### Preview Build Locally
```bash
npm run preview
```
Hosts the built `/dist` assets locally to test production builds.
