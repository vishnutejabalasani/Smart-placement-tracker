# Client (React/Vite Frontend Portal)

The client is a dynamic Single Page Application (SPA) built using React, Vite, and TailwindCSS. It consumes backend services over HTTP and real-time WebSockets.

---

## Technology Stack

- **Framework:** React 18+ (Vite Bundle)
- **Styling:** TailwindCSS (with Lucide React icons)
- **Real-Time Communications:** Socket.io-Client
- **Routing:** React Router DOM v6
- **Build Tooling:** PostCSS and Autoprefixer

---

## Directory and Components Map

### 1. Reusable Layout and UI Components
- **`ProtectedRoute.jsx` (`/src/components/common`):** Enforces authentication and Role-Based Access Control (RBAC). Intercepts routes and redirects unauthorized roles (e.g., redirecting students away from admin pages and vice versa).
- **`KanbanBoard.jsx` (`/src/components/dashboard`):** Coordinates application status columns ("Applied", "Shortlisted", "Technical Interview", "HR Interview", "Selected", "Rejected"). Supports drag-and-drop operations and launches mock interviews for eligible cards.
- **`Navbar.jsx` (`/src/components/layout`):** Coordinates the main navigation header. Houses the active profile display, real-time notification bell dropdown, and sign-out control.

### 2. Pages and Routing Gates
- **`Login.jsx` (`/src/pages`):** Login page offering secure credential submission. Intercepts error codes (such as account suspensions) and displays alerts.
- **`Register.jsx` (`/src/pages`):** Register page for onboarding students. Captures profile settings, including department selections and default CGPA parameters.
- **`StudentDashboard.jsx` (`/src/pages`):** The main workspace for students. Aggregates active job listings, filters feed views, displays resume optimizer configurations, and launches the AI mock interview modal.
- **`AdminDashboard.jsx` (`/src/pages`):** The workspace for placement administrators. Supports posting new placement opportunities, tracking total registrations, viewing student applications, and operating the Security Command Center.

---

## State and WebSocket Management Architecture

The application coordinates authentication, token lifecycles, and real-time websocket flows centrally inside the `AuthContext` provider (`/src/context/AuthContext.jsx`).

### Stored State Values
- **`user`:** Object containing active user details (id, role, email, and academic profile).
- **`token`:** JWT authentication string stored persistently in `localStorage`.
- **`loading`:** Boolean flag to stall page rendering until initial session verification finishes.
- **`notifications`:** Array tracking live events received during the active session.
- **`newNotificationAlert`:** Object tracking the most recent websocket event, displaying toast notifications.
- **`socket`:** Reference to the active Socket.io instance.

### WebSocket Connection Lifecycle
1. When a user logs in, the `token` state is saved. The socket `useEffect` hook triggers.
2. An active Socket.io connection is initiated using the credentials:
   ```javascript
   const socketInstance = io(API_URL, {
     auth: { token },
     autoConnect: true
   });
   ```
3. To avoid connection tearing when profile details change (such as skills or CGPA), the connection hook depends specifically on:
   `[token, user?._id, user?.role]`
   This guarantees that the socket is only recreated when the credentials change.
4. **WebSocket Event Listeners:**
   - **`connect`:** Registers the active connection ID. Admin users automatically emit a `join_admin_room` handshake to register for security telemetry.
   - **`notification`:** Appends new payloads (such as job postings, status updates, or anomalies) to the local state array and fires temporary visual dashboard banners.
   - **`disconnect`:** Safely detaches the connection and registers clean disconnect reasons.
   - **`connect_error`:** Captures and prints connection handshake rejections to the developer console.

---

## Development and Build Commands

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
