import { io } from 'socket.io-client';

// If you need to set an explicit URL for sockets in development, set REACT_APP_SOCKET_URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';

// Create a single shared socket instance
const socket = io(SOCKET_URL, { withCredentials: true });

// Helper to register a user/role with the server (joins rooms)
function register({ userId, role }) {
  if (!userId && !role) return;
  socket.emit('register', { userId, role });
}

export default socket;
export { register };
