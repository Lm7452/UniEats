import { io } from 'socket.io-client';

// If you need to set an explicit URL for sockets in development, set REACT_APP_SOCKET_URL
const ENV_SOCKET = process.env.REACT_APP_SOCKET_URL || '';

// Auto-detect common dev setup: when CRA runs on :3000 and backend on :5000
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

const opts = { withCredentials: true, autoConnect: true };
const socket = io(SOCKET_URL, opts);

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

// Helper to register a user/role with the server (joins rooms)
// Waits for socket connection if necessary so the register event is not lost.
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
