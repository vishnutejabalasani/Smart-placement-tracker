import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newNotificationAlert, setNewNotificationAlert] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 1. Load profile on startup if token is cached
  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Initialization profile retrieval error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  // 2. Establish and manage WebSockets connection tied to user session
  useEffect(() => {
    console.log('[Socket] useEffect trigger. User:', user?.name, 'Token:', token ? 'present' : 'missing');
    if (!token || !user) {
      if (socket) {
        console.log('[Socket] Disconnecting existing socket due to missing credentials');
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log('[Socket] Initializing connection to:', API_URL);
    // Connect WebSocket
    const socketInstance = io(API_URL, {
      auth: { token },
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('Connected to Placement WebSocket server. ID:', socketInstance.id);
      // If admin, subscribe to global admin room
      if (user.role === 'admin') {
        socketInstance.emit('join_admin_room');
      }
    });

    // Listen for real-time applications status updates and system alerts
    socketInstance.on('notification', (data) => {
      console.log('New real-time notification received:', data);
      
      setNotifications(prev => [data, ...prev]);
      
      // Trigger dynamic dashboard toast/alert
      setNewNotificationAlert(data);
      
      // Auto clear the active visual toast after 8 seconds
      setTimeout(() => {
        setNewNotificationAlert(current => {
          if (current && current.timestamp === data.timestamp) {
            return null;
          }
          return current;
        });
      }, 8000);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from Placement WebSocket server. Reason:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      console.log('[Socket] Cleaning up useEffect. Disconnecting socket instance.');
      socketInstance.disconnect();
    };
  }, [token, user?._id, user?.role]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login credentials invalid' };
      }
    } catch (err) {
      console.error('Login request failed:', err);
      return { success: false, message: 'Unable to connect to the backend server' };
    }
  };

  const register = async (name, email, password, role = 'student', profileDetails = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, profile: profileDetails })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration details invalid' };
      }
    } catch (err) {
      console.error('Registration request failed:', err);
      return { success: false, message: 'Server communication error during registration' };
    }
  };

  const updateProfile = async (profileData) => {
    if (!token) return { success: false, message: 'Session expired' };

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      return { success: false, message: 'Server connection failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setNewNotificationAlert(null);
  };

  const clearAlert = () => setNewNotificationAlert(null);

  const value = {
    user,
    token,
    loading,
    notifications,
    newNotificationAlert,
    clearAlert,
    login,
    register,
    logout,
    updateProfile,
    socket
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
