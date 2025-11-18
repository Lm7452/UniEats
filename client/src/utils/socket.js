// client/src/utils/socket.js
// Socket.io client setup and utility functions for UniEats app

import { io } from 'socket.io-client';
// Determine socket URL from environment or auto-detect
const ENV_SOCKET = process.env.REACT_APP_SOCKET_URL || '';

// Auto-detect socket URL based on current location if not set in env
let SOCKET_URL = ENV_SOCKET;
if (!SOCKET_URL && typeof window !== 'undefined') {
  const proto = window.location.protocol;
  const host = window.location.hostname;
  const port = window.location.port;
  if (port === '3000') {
    SOCKET_URL = `${proto}//${host}:5000`;
  } else {
    SOCKET_URL = '';
  }
}

// Socket.io client options
const opts = { withCredentials: true, autoConnect: true };
const socket = io(SOCKET_URL, opts);

// Socket event handlers
socket.on('connect', () => {
  try {
    console.info('[socket] connected id=', socket.id, 'to', SOCKET_URL || window.location.origin);
  } catch (e) {
    console.info('[socket] connected');
  }
});

socket.on('disconnect', (reason) => {
  console.warn('[socket] disconnected', reason);
});

socket.on('connect_error', (err) => {
  console.error('[socket] connect_error', err && err.message ? err.message : err);
});

// Register user with socket server
function register({ userId, role }) {
  if (!userId && !role) return;
  const payload = { userId, role };
  const doEmit = () => {
    try {
      console.info('[socket] registering', payload);
      socket.emit('register', payload);
    } catch (err) {
      console.error('[socket] error emitting register', err);
    }
  };
  if (socket.connected) {
    doEmit();
    return;
  }
  const onConnect = () => {
    doEmit();
    socket.off('connect', onConnect);
  };
  socket.on('connect', onConnect);
}

export default socket;
export { register };
