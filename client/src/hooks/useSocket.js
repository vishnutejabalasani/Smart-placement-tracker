import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useSocket = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSocket must be used within an AuthProvider');
  }
  return context.socket;
};
