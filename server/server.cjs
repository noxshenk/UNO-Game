// Plain CommonJS server file - no TypeScript needed
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Load .env if available
try {
  require('dotenv').config();
} catch(e) {}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── DB SETUP (Turso or local fallback) ────────────────────────────────────
let db = null;

async function initDb() {
  try {
    const { createClient } = require('@libsql/client');
    const url = process.env.TURSO_DB_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || '';
    db = createClient({ url, authToken });

    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT,
      is_guest INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_id TEXT UNIQUE NOT NULL,
      state TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Database connected:', url);
  } catch (err) {
    console.error('❌ DB Error:', err.message);
  }
}

// ─── UNO GAME LOGIC ────────────────────────────────────────────────────────
function createDeck() {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const values = ['0','1','2','3','4','5','6','7','8','9','skip','reverse','draw2'];
  const deck = [];
  let id = 0;

  for (const color of colors) {
    for (const value of values) {
      const count = value === '0' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({ id: `card_${id++}`, color, value });
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${id++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `card_${id++}`, color: 'wild', value: 'wild4' });
  }
  return shuffle(deck);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValidMove(card, topCard, currentColor) {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

function advanceTurn(game, skip, cardsToDraw) {
  const step = skip ? 2 : 1;
  game.currentPlayerIndex = (game.currentPlayerIndex + game.direction * step + game.players.length) % game.players.length;

  if (cardsToDraw > 0) {
    const nextPlayer = game.players[game.currentPlayerIndex];
    for (let i = 0; i < cardsToDraw; i++) {
      if (game.deck.length === 0) {
        const top = game.discardPile.pop();
        game.deck = shuffle(game.discardPile);
        game.discardPile = [top];
      }
      const card = game.deck.pop();
      if (card) nextPlayer.hand.push(card);
    }
    game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;
  }
}

function buildSanitizedState(game, forPlayerId) {
  return {
    roomId: game.roomId,
    currentPlayerIndex: game.currentPlayerIndex,
    direction: game.direction,
    status: game.status,
    winner: game.winner,
    lastColor: game.lastColor,
    deckCount: game.deck.length,
    discardPile: game.discardPile.slice(-3),
    players: game.players.map(p => ({
      id: p.id,
      username: p.username,
      handCount: p.hand.length,
      hand: p.id === forPlayerId ? p.hand : []
    }))
  };
}

function emitToAllPlayers(io, roomId, game, eventName) {
  game.players.forEach(player => {
    const state = buildSanitizedState(game, player.id);
    io.to(roomId).emit(eventName, state); // broadcast to all
  });

  // Also send private hand to each socket individually
  const room = io.sockets.adapter.rooms.get(roomId);
  if (room) {
    room.forEach(socketId => {
      const s = io.sockets.sockets.get(socketId);
      if (s && s.data.user) {
        s.emit(eventName, buildSanitizedState(game, s.data.user.id));
      }
    });
  }
}

// ─── IN-MEMORY GAME STORE ──────────────────────────────────────────────────
const activeGames = {};

// ─── SOCKET.IO EVENTS ──────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  socket.on('join_lobby', (user) => {
    socket.data.user = user;
    console.log(`👤 ${user.username} joined lobby`);

    // Save guest/user to DB
    if (db) {
      db.execute({
        sql: `INSERT OR IGNORE INTO users (id, username, is_guest) VALUES (?, ?, ?)`,
        args: [user.id, user.username, user.isGuest ? 1 : 0]
      }).catch(e => console.log('DB insert note:', e.message));
    }
  });

  socket.on('create_room', ({ hostId, username }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);

    activeGames[roomId] = {
      roomId,
      deck: [],
      discardPile: [],
      players: [{ id: hostId, username, hand: [] }],
      currentPlayerIndex: 0,
      direction: 1,
      status: 'waiting',
      winner: null,
      lastColor: 'red'
    };

    socket.emit('room_created', { roomId });
    socket.emit('room_joined', { roomId, players: activeGames[roomId].players });
    console.log(`🏠 Room created: ${roomId} by ${username}`);
  });

  socket.on('join_room', ({ roomId, userId, username }) => {
    const game = activeGames[roomId];
    if (!game) { socket.emit('error', 'Room not found! Check the code.'); return; }
    if (game.status !== 'waiting') { socket.emit('error', 'Game already started!'); return; }
    if (game.players.length >= 6) { socket.emit('error', 'Room is full!'); return; }

    // Don't add duplicate players
    const alreadyIn = game.players.find(p => p.id === userId);
    if (!alreadyIn) {
      game.players.push({ id: userId, username, hand: [] });
    }

    socket.join(roomId);
    socket.emit('room_joined', { roomId, players: game.players });
    io.to(roomId).emit('player_joined', { players: game.players.map(p => ({ id: p.id, username: p.username, handCount: 0, hand: [] })) });
    console.log(`➕ ${username} joined room ${roomId}`);
  });

  socket.on('start_game', ({ roomId }) => {
    const game = activeGames[roomId];
    if (!game || game.players.length < 2) {
      socket.emit('error', 'Need at least 2 players to start!');
      return;
    }

    const deck = createDeck();
    game.players.forEach(p => {
      p.hand = deck.splice(0, 7);
    });
    game.deck = deck;

    // Make sure first discard is not a wild
    let firstCard = game.deck.pop();
    while (firstCard.color === 'wild') {
      game.deck.unshift(firstCard);
      firstCard = game.deck.pop();
    }
    game.discardPile = [firstCard];
    game.lastColor = firstCard.color;
    game.status = 'playing';
    game.currentPlayerIndex = 0;

    console.log(`🎮 Game started in room ${roomId}`);

    // Send each player their own private state
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      room.forEach(socketId => {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.data.user) {
          s.emit('game_started', buildSanitizedState(game, s.data.user.id));
        }
      });
    }
  });

  socket.on('play_card', ({ roomId, cardId, newColor }) => {
    const game = activeGames[roomId];
    if (!game || game.status !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!socket.data.user || socket.data.user.id !== currentPlayer.id) {
      socket.emit('error', 'Not your turn!');
      return;
    }

    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = currentPlayer.hand[cardIndex];
    const topCard = game.discardPile[game.discardPile.length - 1];

    if (!isValidMove(card, topCard, game.lastColor)) {
      socket.emit('error', 'Invalid move!');
      return;
    }

    currentPlayer.hand.splice(cardIndex, 1);
    game.discardPile.push(card);
    game.lastColor = card.color === 'wild' ? (newColor || 'red') : card.color;

    // Check winner
    if (currentPlayer.hand.length === 0) {
      game.status = 'finished';
      game.winner = currentPlayer.id;
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        room.forEach(socketId => {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.data.user) {
            s.emit('game_over', {
              winnerName: currentPlayer.username,
              game: buildSanitizedState(game, s.data.user.id)
            });
          }
        });
      }
      return;
    }

    // Handle special cards
    let skip = false;
    let draw = 0;
    if (card.value === 'skip') skip = true;
    if (card.value === 'reverse') {
      if (game.players.length === 2) skip = true;
      else game.direction *= -1;
    }
    if (card.value === 'draw2') draw = 2;
    if (card.value === 'wild4') draw = 4;

    advanceTurn(game, skip, draw);

    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      room.forEach(socketId => {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.data.user) {
          s.emit('game_state_update', buildSanitizedState(game, s.data.user.id));
        }
      });
    }
  });

  socket.on('draw_card', ({ roomId }) => {
    const game = activeGames[roomId];
    if (!game || game.status !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!socket.data.user || socket.data.user.id !== currentPlayer.id) return;

    if (game.deck.length === 0) {
      const top = game.discardPile.pop();
      game.deck = shuffle(game.discardPile);
      game.discardPile = [top];
    }

    const card = game.deck.pop();
    if (card) currentPlayer.hand.push(card);

    advanceTurn(game, false, 0);

    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      room.forEach(socketId => {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.data.user) {
          s.emit('game_state_update', buildSanitizedState(game, s.data.user.id));
        }
      });
    }
  });

  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    const game = activeGames[roomId];
    if (game) {
      game.players = game.players.filter(p => p.id !== socket.data.user?.id);
      if (game.players.length === 0) {
        delete activeGames[roomId];
        console.log(`🗑️ Room ${roomId} deleted`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'UNO Game Server Running! 🎮', rooms: Object.keys(activeGames).length });
});

// ─── START SERVER ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 UNO Server running on port ${PORT}`);
});
