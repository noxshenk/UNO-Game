import React, { useState } from 'react';
import { User } from '../types';
import { PlusCircle, Users, LogOut, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface LobbyProps {
  user: User;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  error: string | null;
}

export const Lobby: React.FC<LobbyProps> = ({ user, onCreateRoom, onJoinRoom, error }) => {
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="min-h-screen bg-sky-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        {/* Left Side: Profile & Stats */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-yellow-400 rounded-3xl mb-4 flex items-center justify-center text-4xl shadow-xl border-4 border-white">
            {user.username[0].toUpperCase()}
          </div>
          <h2 className="text-3xl font-black mb-1">{user.username}</h2>
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-6">
            {user.isGuest ? 'Guest Player' : 'Pro Member'}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black">12</div>
              <div className="text-[10px] font-bold uppercase opacity-60 tracking-tighter">Games Won</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black">450</div>
              <div className="text-[10px] font-bold uppercase opacity-60 tracking-tighter">Total Points</div>
            </div>
          </div>

          <div className="mt-8 space-y-2 w-full">
            <button className="w-full flex items-center gap-3 px-6 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold">
              <Trophy size={20} className="text-yellow-400" />
              Leaderboard
            </button>
            <button className="w-full flex items-center gap-3 px-6 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-red-100">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </motion.div>

        {/* Right Side: Game Actions */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-neutral-800">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Users className="text-blue-500" />
              MULTIPLAYER
            </h3>

            <div className="space-y-4">
              <button 
                onClick={onCreateRoom}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group"
              >
                <PlusCircle className="group-hover:rotate-90 transition-transform" />
                CREATE ROOM
              </button>

              <div className="relative flex items-center gap-2">
                <div className="flex-1 h-px bg-neutral-100"></div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">OR</span>
                <div className="flex-1 h-px bg-neutral-100"></div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-4 rounded-2xl bg-neutral-100 font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase placeholder:normal-case"
                  />
                  <button 
                    onClick={() => onJoinRoom(roomCode)}
                    disabled={!roomCode}
                    className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-2xl font-bold transition-all"
                  >
                    JOIN
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm font-bold ml-1">{error}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <h4 className="font-bold text-sm mb-4 uppercase tracking-widest opacity-60">Game Modes</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-white/10 rounded-2xl border-2 border-white/20 hover:border-yellow-400 transition-all group">
                <div className="font-black text-lg group-hover:text-yellow-400 transition-colors">CLASSIC</div>
                <div className="text-[10px] font-bold opacity-60">Standard UNO rules</div>
              </button>
              <button className="p-4 bg-white/10 rounded-2xl border-2 border-transparent hover:bg-white/5 opacity-50 cursor-not-allowed">
                <div className="font-black text-lg">FAST PACED</div>
                <div className="text-[10px] font-bold opacity-60">Coming soon</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
