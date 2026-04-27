import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, GameState, CardColor } from './types';
import { Login } from './components/Login';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { motion, AnimatePresence } from 'framer-motion';

// @ts-ignore
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !socket) {
      console.log('Connecting to socket server...', SOCKET_URL);
      const newSocket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        timeout: 10000,
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('join_lobby', user);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setError('Could not connect to game server. Please try again later.');
      });

      newSocket.on('room_created', ({ roomId }) => {
        setRoomId(roomId);
      });

      newSocket.on('room_joined', ({ roomId, players }) => {
        setRoomId(roomId);
        setGameState(prev => ({
          ...(prev || { 
            roomId, 
            players: [], 
            currentPlayerIndex: 0, 
            discardPile: [], 
            deckCount: 108, 
            status: 'waiting',
            lastColor: 'red',
            winner: null,
            direction: 1
          }),
          roomId,
          players
        }));
      });

      newSocket.on('player_joined', ({ players }) => {
        setGameState(prev => prev ? { ...prev, players } : null);
      });

      newSocket.on('game_started', (state) => {
        setGameState(state);
      });

      newSocket.on('game_state_update', (state) => {
        setGameState(state);
      });

      newSocket.on('game_over', ({ winner, game }) => {
        setGameState(game);
        alert(`Game Over! Winner: ${winner}`);
      });

      newSocket.on('error', (msg) => {
        setError(msg);
        setTimeout(() => setError(null), 3000);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const createRoom = () => {
    socket?.emit('create_room', { hostId: user?.id, username: user?.username });
  };

  const joinRoom = (roomCode: string) => {
    socket?.emit('join_room', { roomId: roomCode, userId: user?.id, username: user?.username });
  };

  const startGame = () => {
    if (roomId) socket?.emit('start_game', { roomId });
  };

  const playCard = (cardId: string, newColor?: CardColor) => {
    if (roomId) socket?.emit('play_card', { roomId, cardId, newColor });
  };

  const drawCard = () => {
    if (roomId) socket?.emit('draw_card', { roomId });
  };

  return (
    <div className="min-h-screen bg-sky-500 text-white font-sans selection:bg-yellow-400">
      <AnimatePresence mode="wait">
        {!user && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login onLogin={handleLogin} />
          </motion.div>
        )}

        {user && !roomId && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Lobby 
              user={user} 
              onCreateRoom={createRoom} 
              onJoinRoom={joinRoom} 
              error={error}
            />
          </motion.div>
        )}

        {user && roomId && gameState && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GameBoard 
              gameState={gameState} 
              userId={user.id}
              onStartGame={startGame}
              onPlayCard={playCard}
              onDrawCard={drawCard}
              onLeaveRoom={() => {
                setRoomId(null);
                setGameState(null);
                socket?.emit('leave_room', { roomId });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
