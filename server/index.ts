import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db, initDb } from './db';
import { createDeck, dealCards, Card, Player, GameState, isValidMove, CardColor } from './gameLogic';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory rooms for performance, syncing to DB periodically or on state change
const activeGames: Record<string, GameState> = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_lobby', async (user) => {
    socket.data.user = user;
    console.log(`${user.username} joined lobby`);
  });

  socket.on('create_room', async ({ hostId, username }) => {
    const roomId = nanoid(6).toUpperCase();
    socket.join(roomId);
    
    activeGames[roomId] = {
      deck: [],
      discardPile: [],
      players: [{ id: hostId, username, hand: [] }],
      currentPlayerIndex: 0,
      direction: 1,
      status: 'waiting',
      winner: null,
      lastColor: null
    };

    socket.emit('room_created', { roomId });
    console.log(`Room created: ${roomId} by ${username}`);
  });

  socket.on('join_room', async ({ roomId, userId, username }) => {
    const game = activeGames[roomId];
    if (!game) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (game.status !== 'waiting') {
      socket.emit('error', 'Game already started');
      return;
    }

    if (game.players.length >= 6) {
      socket.emit('error', 'Room full');
      return;
    }

    socket.join(roomId);
    game.players.push({ id: userId, username, hand: [] });
    
    io.to(roomId).emit('player_joined', { 
      players: game.players.map(p => ({ id: p.id, username: p.username })) 
    });
    
    socket.emit('room_joined', { roomId, players: game.players });
  });

  socket.on('start_game', ({ roomId }) => {
    const game = activeGames[roomId];
    if (!game) return;

    const deck = createDeck();
    const playerIds = game.players.map(p => p.id);
    const { hands, remainingDeck } = dealCards(deck, playerIds);

    game.players.forEach(player => {
      player.hand = hands[player.id];
    });

    game.deck = remainingDeck;
    game.discardPile = [game.deck.pop()!];
    game.status = 'playing';
    game.currentPlayerIndex = 0;
    game.lastColor = game.discardPile[0].color === 'wild' ? 'red' : game.discardPile[0].color;

    const sanitizedState = {
      ...game,
      deckCount: game.deck.length,
      deck: [],
      players: game.players.map(p => ({
        ...p,
        hand: [],
        handCount: p.hand.length
      }))
    };

    game.players.forEach(p => {
      const playerSocket = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map(sid => io.sockets.sockets.get(sid))
        .find(s => s?.data.user?.id === p.id);
      
      if (playerSocket) {
        playerSocket.emit('game_started', {
          ...sanitizedState,
          players: sanitizedState.players.map(sp => sp.id === p.id ? { ...sp, hand: p.hand } : sp)
        });
      }
    });
  });

  socket.on('play_card', ({ roomId, cardId, newColor }) => {
    const game = activeGames[roomId];
    if (!game || game.status !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (socket.data.user?.id !== currentPlayer.id) return;

    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = currentPlayer.hand[cardIndex];
    const topCard = game.discardPile[game.discardPile.length - 1];

    if (isValidMove(card, topCard, game.lastColor!)) {
      // Remove card from hand
      currentPlayer.hand.splice(cardIndex, 1);
      game.discardPile.push(card);
      
      // Update color for wild cards
      game.lastColor = card.color === 'wild' ? newColor : card.color;

      // Handle special cards
      let nextPlayerSkip = false;
      let cardsToDraw = 0;

      if (card.value === 'skip') nextPlayerSkip = true;
      if (card.value === 'reverse') {
        if (game.players.length === 2) nextPlayerSkip = true;
        else game.direction *= -1;
      }
      if (card.value === 'draw2') cardsToDraw = 2;
      if (card.value === 'wild4') cardsToDraw = 4;

      // Check for winner
      if (currentPlayer.hand.length === 0) {
        game.status = 'finished';
        game.winner = currentPlayer.id;
        io.to(roomId).emit('game_over', { winner: currentPlayer.username, game });
        return;
      }

      // Advance turn
      advanceTurn(game, nextPlayerSkip, cardsToDraw);
      
      // Sanitized state for clients
      const sanitizedState = {
        ...game,
        deckCount: game.deck.length,
        deck: [], // Don't send deck to clients
        players: game.players.map(p => ({
          ...p,
          hand: [], // Hand is empty for others
          handCount: p.hand.length
        }))
      };

      // Send private hand to each player
      game.players.forEach(p => {
        const playerSocket = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
          .map(sid => io.sockets.sockets.get(sid))
          .find(s => s?.data.user?.id === p.id);
        
        if (playerSocket) {
          playerSocket.emit('game_state_update', {
            ...sanitizedState,
            players: sanitizedState.players.map(sp => sp.id === p.id ? { ...sp, hand: p.hand } : sp)
          });
        }
      });
    }
  });

  socket.on('draw_card', ({ roomId }) => {
    const game = activeGames[roomId];
    if (!game || game.status !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (socket.data.user?.id !== currentPlayer.id) return;

    if (game.deck.length === 0) {
      const topCard = game.discardPile.pop()!;
      game.deck = shuffle(game.discardPile);
      game.discardPile = [topCard];
    }

    const drawnCard = game.deck.pop()!;
    currentPlayer.hand.push(drawnCard);

    // After drawing, turn passes
    advanceTurn(game, false, 0);

    const sanitizedState = {
      ...game,
      deckCount: game.deck.length,
      deck: [],
      players: game.players.map(p => ({
        ...p,
        hand: [],
        handCount: p.hand.length
      }))
    };

    game.players.forEach(p => {
      const playerSocket = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map(sid => io.sockets.sockets.get(sid))
        .find(s => s?.data.user?.id === p.id);
      
      if (playerSocket) {
        playerSocket.emit('game_state_update', {
          ...sanitizedState,
          players: sanitizedState.players.map(sp => sp.id === p.id ? { ...sp, hand: p.hand } : sp)
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function advanceTurn(game: GameState, skip: boolean, cardsToDraw: number) {
  const step = skip ? 2 : 1;
  game.currentPlayerIndex = (game.currentPlayerIndex + (game.direction * step) + game.players.length) % game.players.length;

  if (cardsToDraw > 0) {
    const nextPlayer = game.players[game.currentPlayerIndex];
    for (let i = 0; i < cardsToDraw; i++) {
      if (game.deck.length === 0) {
        const topCard = game.discardPile.pop()!;
        game.deck = shuffle(game.discardPile);
        game.discardPile = [topCard];
      }
      const card = game.deck.pop();
      if (card) nextPlayer.hand.push(card);
    }
    // Turn passes after drawing penalty? In some rules yes, let's keep it simple.
    game.currentPlayerIndex = (game.currentPlayerIndex + (game.direction * 1) + game.players.length) % game.players.length;
  }
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on port ${PORT}`);
});
