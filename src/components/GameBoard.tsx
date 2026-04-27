import React, { useState } from 'react';
import { GameState, Card, CardColor } from '../types';
import { UnoCard } from './UnoCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, ArrowRight, Info } from 'lucide-react';
import { cn } from '../utils/cn';

interface GameBoardProps {
  gameState: GameState;
  userId: string;
  onStartGame: () => void;
  onPlayCard: (cardId: string, newColor?: CardColor) => void;
  onDrawCard: () => void;
  onLeaveRoom: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  userId, 
  onStartGame, 
  onPlayCard, 
  onDrawCard,
  onLeaveRoom
}) => {
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === userId;
  const me = gameState.players.find(p => p.id === userId);
  const otherPlayers = gameState.players.filter(p => p.id !== userId);
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;
    
    if (card.color === 'wild') {
      setShowColorPicker(card.id);
    } else {
      onPlayCard(card.id);
    }
  };

  const selectColor = (color: CardColor) => {
    if (showColorPicker) {
      onPlayCard(showColorPicker, color);
      setShowColorPicker(null);
    }
  };

  if (gameState.status === 'finished') {
    return (
      <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[3rem] p-12 shadow-[0_0_100px_rgba(255,255,255,0.2)] text-neutral-900 max-w-md w-full"
        >
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl border-4 border-white">
            🏆
          </div>
          <h2 className="text-5xl font-black mb-2 italic">WINNER!</h2>
          <p className="text-2xl font-bold text-indigo-600 mb-8">{gameState.players.find(p => p.id === gameState.winner)?.username}</p>
          
          <div className="space-y-4">
            <button 
              onClick={onLeaveRoom}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-lg"
            >
              BACK TO LOBBY
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState.status === 'waiting') {
    return (
      <div className="min-h-screen bg-sky-600 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-lg text-neutral-800">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-blue-600 italic">ROOM LOBBY</h2>
              <p className="font-bold text-neutral-400 uppercase tracking-widest text-xs">Room Code: <span className="text-neutral-800 font-black select-all ml-1">{gameState.roomId}</span></p>
            </div>
            <button onClick={onLeaveRoom} className="text-sm font-bold text-red-500 hover:underline">Leave Room</button>
          </div>

          <div className="space-y-3 mb-8">
            {gameState.players.map((p, i) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={p.id} 
                className="flex items-center justify-between p-4 bg-neutral-100 rounded-2xl border-2 border-transparent hover:border-blue-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {p.username[0].toUpperCase()}
                  </div>
                  <span className="font-bold">{p.username} {p.id === userId && '(You)'}</span>
                </div>
                {i === 0 && <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Crown size={12} /> HOST</div>}
              </motion.div>
            ))}
            {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                <div className="w-10 h-10 bg-neutral-200 rounded-xl"></div>
                <span className="font-bold text-neutral-300 italic">Waiting for player...</span>
              </div>
            ))}
          </div>

          <button 
            onClick={onStartGame}
            disabled={gameState.players.length < 2}
            className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white rounded-2xl font-black text-xl shadow-lg transition-all transform active:scale-95"
          >
            {gameState.players.length < 2 ? 'WAITING FOR PLAYERS...' : 'START GAME'}
          </button>
          <p className="mt-4 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">At least 2 players required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-green-700 overflow-hidden flex flex-col relative select-none">
      {/* Background HUD */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <h1 className="text-[20vw] font-black italic">UNO</h1>
      </div>

      {/* Header Info */}
      <div className="p-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
            <Users size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">{gameState.players.length} Players</span>
          </div>
          <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
            <Info size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Code: {gameState.roomId}</span>
          </div>
        </div>

        <div className="bg-white/90 text-neutral-900 px-6 py-2 rounded-full font-black text-sm flex items-center gap-2 shadow-xl">
          CURRENT COLOR: 
          <div className={`w-4 h-4 rounded-full ${
            gameState.lastColor === 'red' ? 'bg-red-600' :
            gameState.lastColor === 'blue' ? 'bg-blue-600' :
            gameState.lastColor === 'green' ? 'bg-green-600' :
            'bg-yellow-500'
          }`} />
          <span className="uppercase">{gameState.lastColor}</span>
        </div>
      </div>

      {/* Other Players */}
      <div className="flex justify-center gap-12 mt-4 px-10">
        {otherPlayers.map((player) => (
          <div key={player.id} className="relative group">
            <div className={cn(
              "flex flex-col items-center transition-all duration-300",
              currentPlayer?.id === player.id ? "scale-110" : "opacity-80 scale-90"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-2xl mb-2 flex items-center justify-center text-2xl font-black border-4 shadow-xl",
                currentPlayer?.id === player.id ? "bg-yellow-400 border-white animate-pulse" : "bg-white border-transparent"
              )}>
                {player.username[0].toUpperCase()}
              </div>
              <div className="text-xs font-black bg-black/40 px-3 py-1 rounded-full">{player.username}</div>
              <div className="mt-2 flex -space-x-4">
                {Array.from({ length: Math.min(player.handCount || 7, 7) }).map((_, i) => (
                  <div key={i} className="w-8 h-12 bg-red-600 rounded-md border-2 border-white shadow-lg transform" style={{ rotate: `${(i-3)*10}deg` }}></div>
                ))}
                {(player.handCount || 0) > 7 && (
                  <div className="w-8 h-12 bg-white/20 backdrop-blur rounded-md border-2 border-white/50 flex items-center justify-center text-[10px] font-black">
                    +{player.handCount! - 7}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Area (Draw & Discard) */}
      <div className="flex-1 flex items-center justify-center gap-16 relative">
        {/* Draw Pile */}
        <div className="relative group cursor-pointer" onClick={isMyTurn ? onDrawCard : undefined}>
          <div className="absolute inset-0 bg-black/20 rounded-xl blur-xl group-hover:bg-blue-500/30 transition-all"></div>
          {/* Stack effect */}
          <div className="absolute -top-1 -left-1 w-28 h-44 bg-red-800 rounded-xl border-4 border-white"></div>
          <div className="absolute -top-2 -left-2 w-28 h-44 bg-red-900 rounded-xl border-4 border-white"></div>
          <UnoCard color="red" value="0" isBack size="lg" className="relative z-10" />
          <div className="absolute -bottom-6 left-0 right-0 text-center font-black text-xs uppercase tracking-widest opacity-60 flex flex-col items-center">
            <span>DRAW</span>
            <span className="text-[8px] opacity-40">{gameState.deckCount} CARDS LEFT</span>
          </div>
        </div>

        {/* Discard Pile */}
        <div className="relative">
          <div className="absolute inset-0 bg-black/20 rounded-xl blur-2xl"></div>
          {gameState.discardPile.slice(-3).map((card, i) => (
            <div key={card.id} className="absolute inset-0" style={{ transform: `rotate(${(i-1)*15}deg) translate(${(i-1)*10}px, ${(i-1)*5}px)` }}>
              <UnoCard color={card.color} value={card.value} size="lg" disabled />
            </div>
          ))}
          <UnoCard 
            color={topCard.color} 
            value={topCard.value} 
            size="lg" 
            className="relative z-10"
            disabled
          />
          <div className="absolute -bottom-6 left-0 right-0 text-center font-black text-xs uppercase tracking-widest opacity-60">Discard</div>
        </div>

        {/* Direction Indicator */}
        <div className={cn(
          "absolute w-64 h-64 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center transition-all duration-1000",
          gameState.direction === 1 ? "rotate-0" : "rotate-180"
        )}>
          <div className="flex gap-40 w-full justify-center">
             <ArrowRight className={cn("opacity-20", gameState.direction === 1 ? "animate-bounce" : "rotate-180 animate-bounce")} />
             <ArrowRight className={cn("opacity-20", gameState.direction === 1 ? "animate-bounce" : "rotate-180 animate-bounce")} />
          </div>
        </div>
      </div>

      {/* My Hand */}
      <div className="pb-12 px-8 flex flex-col items-center">
        <div className="mb-6 flex items-center gap-4">
           {isMyTurn ? (
             <motion.div 
               initial={{ y: 20, opacity: 0 }} 
               animate={{ y: 0, opacity: 1 }}
               className="bg-yellow-400 text-neutral-900 px-8 py-2 rounded-full font-black text-lg shadow-2xl flex items-center gap-2"
             >
               IT'S YOUR TURN!
             </motion.div>
           ) : (
             <div className="bg-white/10 backdrop-blur-md px-8 py-2 rounded-full font-black text-lg opacity-60">
                WAITING FOR {currentPlayer?.username.toUpperCase()}...
             </div>
           )}
        </div>

        <div className="flex -space-x-8 max-w-full overflow-x-auto pb-4 scrollbar-hide px-12">
          {me?.hand.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -40, zIndex: 50, transition: { duration: 0.2 } }}
            >
              <UnoCard 
                color={card.color} 
                value={card.value} 
                onClick={() => handleCardClick(card)}
                disabled={!isMyTurn}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Color Picker Overlay */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center"
          >
            <h3 className="text-4xl font-black mb-12">CHOOSE A COLOR</h3>
            <div className="grid grid-cols-2 gap-8">
              {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => selectColor(color)}
                  className={cn(
                    "w-32 h-32 rounded-3xl border-8 border-white shadow-2xl transform hover:scale-110 transition-transform",
                    color === 'red' && 'bg-red-600',
                    color === 'blue' && 'bg-blue-600',
                    color === 'green' && 'bg-green-600',
                    color === 'yellow' && 'bg-yellow-500',
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
