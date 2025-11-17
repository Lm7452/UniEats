import { io } from 'socket.io-client';

// If you need to set an explicit URL for sockets in development, set REACT_APP_SOCKET_URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';

// Create a single shared socket instance
const socket = io(SOCKET_URL, { withCredentials: true, autoConnect: true });

// Helper to register a user/role with the server (joins rooms)
// Waits for socket connection if necessary so the register event is not lost.
function register({ userId, role }) {
  if (!userId && !role) return;
  const payload = { userId, role };
  if (socket.connected) {
    socket.emit('register', payload);
    return;
  }
  const onConnect = () => {
    try {
      socket.emit('register', payload);
    } catch (err) {
      console.error('Error emitting register after connect', err);
    }
    socket.off('connect', onConnect);
  };
  socket.on('connect', onConnect);
}

export default socket;
export { register };
