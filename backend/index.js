import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active games (in-memory)
const games = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });

  socket.on('create_game', () => {
    // 1. Generate room ID
    const roomId = Math.random().toString(36).substring(2, 8);

    // 2. Create room object
    const room = {
      players: [socket.id],
      chess: new Chess(),
      currentTurnSocketId: socket.id
    };

    // 3. Store in memory
    games.set(roomId, room);

    // 4. Send back to creator
    socket.emit('game_created', roomId);
  });
});

httpServer.listen(4000, () => {
  console.log('Server running on port 4000');
});
