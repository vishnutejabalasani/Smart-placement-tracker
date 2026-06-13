require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const socketService = require('./services/socket.service');

// Import modular routers
const authRouter = require('./routes/auth.routes');
const jobRouter = require('./routes/job.routes');
const studentRouter = require('./routes/student.routes');

// Import middlewares
const { rateLimitAnomalyDetector } = require('./middleware/security.middleware');
const errorHandler = require('./middleware/error.middleware');

// Initialize express app
const app = express();
const server = http.createServer(app);

// 1. Establish Database Connection (Mongoose connect for Atlas / Local fallback)
connectDB();

// 2. Initialize Real-Time WebSockets
socketService.init(server);

// 3. Security & Global Request Parsing Middlewares
app.use(helmet()); 
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply basic Rate Limit Anomaly Detection globally
app.use(rateLimitAnomalyDetector);

// 4. API Endpoints Configuration (Modular Routers)
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/applications', studentRouter); // Maps application logic cleanly

// Standard status health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource path not found' });
});

// Centralized Global Error Handler
app.use(errorHandler);

// 5. Start Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
