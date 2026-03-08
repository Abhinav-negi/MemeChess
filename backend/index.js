import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Chess } from 'chess.js';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
await connectDB();

// Auth routes
app.use('/api/auth', authRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active games (in-memory)
const games = new Map();

// Socket.io with JWT authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;  // username
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ ${socket.userId} connected (${socket.id})`);
  
  // ========================================
  // CREATE GAME
  // ========================================
  socket.on('create_game', () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    
    const room = {
      id: roomId,
      players: [socket.userId],  // Usernames
      sockets: {                 // ✅ NEW: Track socket IDs
        [socket.userId]: socket.id
      },
      chess: new Chess(),
      currentTurn: socket.userId,
      createdAt: Date.now()
    };
    
    games.set(roomId, room);
    console.log(`🎮 Game created: ${roomId} by ${socket.userId}`);
    
    socket.emit('game_created', roomId);
  });
  
  // ========================================
  // JOIN GAME
  // ========================================
socket.on('join_game', (roomId) => {
  console.log(`🔍 Player ${socket.userId} trying to join room: ${roomId}`);
  
  const room = games.get(roomId);
  
  if (!room) {
    console.log(`❌ Room ${roomId} not found`);
    socket.emit('error', 'Room not found');
    return;
  }
  
  // ✅ CHECK IF THIS USER IS ALREADY IN THE ROOM
  if (room.players.includes(socket.userId)) {
    console.log(`🔄 ${socket.userId} is already in room, treating as reconnect`);
    
    // Update socket ID
    room.sockets[socket.userId] = socket.id;
    
    // Remove from disconnected list if present
    if (room.disconnectedPlayers) {
      room.disconnectedPlayers = room.disconnectedPlayers.filter(
        u => u !== socket.userId
      );
    }
    
    // Determine color
    const yourColor = room.players[0] === socket.userId ? 'w' : 'b';
    
    // Send game state back
    socket.emit('game_reconnected', {
      yourColor: yourColor,
      fen: room.chess.fen(),
      roomId: roomId
    });
    
    // Notify other player
    const otherUsername = room.players.find(u => u !== socket.userId);
    if (otherUsername && room.sockets[otherUsername]) {
      io.to(room.sockets[otherUsername]).emit('opponent_reconnected');
    }
    
    console.log(`✅ ${socket.userId} rejoined room ${roomId}`);
    return;
  }
  
  // ✅ CHECK IF ROOM IS ACTUALLY FULL (2 DIFFERENT PLAYERS)
  if (room.players.length >= 2) {
    console.log(`❌ Room ${roomId} is full with different players`);
    socket.emit('error', 'Room is full');
    return;
  }
  
  // New player joining
  room.players.push(socket.userId);
  room.sockets[socket.userId] = socket.id;
  
  console.log(`✅ Player ${socket.userId} joined room ${roomId}`);
  
  const player1Username = room.players[0];
  const player2Username = room.players[1];
  const player1SocketId = room.sockets[player1Username];
  const player2SocketId = room.sockets[player2Username];
  
  // Emit to both
  io.to(player1SocketId).emit('game_ready', {
    yourColor: 'w',
    roomId: roomId
  });
  
  io.to(player2SocketId).emit('game_ready', {
    yourColor: 'b',
    roomId: roomId
  });
  
  console.log(`🎉 Game ${roomId} is ready! White: ${player1Username}, Black: ${player2Username}`);
});
  
  // ========================================
  // MAKE MOVE
  // ========================================
  socket.on('make_move', ({ roomId, move }) => {
    console.log(`♟️ Move received in room ${roomId}:`, move);
    
    const room = games.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    // Verify it's this player's turn
    if (socket.userId !== room.currentTurn) {
      socket.emit('error', 'Not your turn');
      console.log(`❌ ${socket.userId} tried to move out of turn`);
      return;
    }
    
    // Validate and make move
    try {
      const result = room.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
      
      if (!result) {
        socket.emit('error', 'Invalid move');
        return;
      }
      
      // Switch turn
      const otherPlayerUsername = room.players.find(u => u !== socket.userId);
      room.currentTurn = otherPlayerUsername;
      
      // Get new position
      const newFEN = room.chess.fen();
      
      // ✅ Broadcast to BOTH players using socket IDs
      room.players.forEach(username => {
        const socketId = room.sockets[username];
        io.to(socketId).emit('move_made', {
          move: result,
          fen: newFEN,
          isCheck: room.chess.isCheck(),
          isCheckmate: room.chess.isCheckmate(),
          isGameOver: room.chess.isGameOver()
        });
      });
      
      console.log(`✅ Move executed: ${move.from} → ${move.to}`);
      
    } catch (err) {
      console.error('Move error:', err);
      socket.emit('error', 'Invalid move');
    }
  });
  
  // ========================================
  // DISCONNECT
  // ========================================
  socket.on('disconnect', () => {
    console.log(`❌ ${socket.userId} disconnected`);
    
    games.forEach((room, roomId) => {
      if (room.players.includes(socket.userId)) {
        console.log(`⏳ Player left room ${roomId}, waiting 30s...`);
        
        if (!room.disconnectedPlayers) {
          room.disconnectedPlayers = [];
        }
        room.disconnectedPlayers.push(socket.userId);
        
        // Notify other player using their socket ID
        const otherUsername = room.players.find(u => u !== socket.userId);
        if (otherUsername) {
          const otherSocketId = room.sockets[otherUsername];
          io.to(otherSocketId).emit('opponent_disconnected');
        }
        
        // Delete room after 30 seconds if no reconnect
        setTimeout(() => {
          const currentRoom = games.get(roomId);
          if (currentRoom && currentRoom.disconnectedPlayers?.includes(socket.userId)) {
            console.log(`🗑️ Deleting room ${roomId}`);
            games.delete(roomId);
            
            if (otherUsername) {
              const otherSocketId = room.sockets[otherUsername];
              io.to(otherSocketId).emit('room_closed');
            }
          }
        }, 30000);
      }
    });
  });
  
  // ========================================
  // RECONNECT
  // ========================================
  socket.on('reconnect_game', (roomId) => {
    console.log(`🔄 ${socket.userId} trying to reconnect to ${roomId}`);
    
    const room = games.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Room no longer exists');
      return;
    }
    
    // Check if this user was in the game
    if (room.players.includes(socket.userId)) {
      // Update socket ID
      room.sockets[socket.userId] = socket.id;
      
      // Remove from disconnected list
      if (room.disconnectedPlayers) {
        room.disconnectedPlayers = room.disconnectedPlayers.filter(
          u => u !== socket.userId
        );
      }
      
      // Determine color
      const yourColor = room.players[0] === socket.userId ? 'w' : 'b';
      
      // Send current state
      socket.emit('game_reconnected', {
        yourColor: yourColor,
        fen: room.chess.fen(),
        roomId: roomId
      });
      
      // Notify other player
      const otherUsername = room.players.find(u => u !== socket.userId);
      if (otherUsername) {
        const otherSocketId = room.sockets[otherUsername];
        io.to(otherSocketId).emit('opponent_reconnected');
      }
      
      console.log(`✅ ${socket.userId} reconnected to ${roomId}`);
    } else {
      socket.emit('error', 'You were not in this game');
    }
  });
});

httpServer.listen(4000, () => {
  console.log('🚀 Server running on port 4000');
});