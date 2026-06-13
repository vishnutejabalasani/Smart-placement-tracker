const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = decoded; 
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;
    console.log(`User connected via WebSocket: ${userId} (${userRole}) [Socket ID: ${socket.id}]`);

    socket.join(userId);

    // Support admin subscribing to global admin room
    socket.on('join_admin_room', () => {
      if (userRole === 'admin') {
        socket.join('admin');
        console.log(`Admin ${userId} joined room 'admin'`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} [Socket ID: ${socket.id}]`);
    });
  });

  return io;
};

// Send real-time notification to a specific user
const sendNotification = (userId, type, payload) => {
  if (!io) {
    console.warn('Socket.io is not initialized. Cannot send notification.');
    return false;
  }
  
  const targetRoom = userId.toString();
  console.log(`Pushing real-time notification to user room: ${targetRoom} | Type: ${type}`);
  
  io.to(targetRoom).emit('notification', {
    type,
    payload,
    timestamp: new Date()
  });
  return true;
};

module.exports = {
  init,
  sendNotification
};
