import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  
  if (!socket) {
      const token = localStorage.getItem('token');
    socket = io('http://localhost:4000', {
      auth: { token }  // Send JWT token on connection
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });
      socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
    if (err.message === 'Authentication required') {
      // Redirect to login
      window.location.href = '/';
    }
  });
  }
  return socket;
}

// Helper function to create a game
export function createGame(callback) {
  const socket = getSocket();
  socket.emit('create_game');
  
  socket.once('game_created', (roomId) => {
    callback(roomId);
  });
}

// Helper function to join a game
export function joinGame(roomId) {
  const socket = getSocket();
  socket.emit('join_game', roomId);
}