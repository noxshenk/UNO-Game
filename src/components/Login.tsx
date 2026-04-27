import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, Ghost, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo/prototype, we'll simulate successful auth
    // In a real app, this would call an API connected to Turso
    const userId = 'u_' + Math.random().toString(36).substring(2, 11);
    onLogin({
      id: userId,
      username: username || 'Player',
      isGuest: false
    });
  };

  const handleGuest = () => {
    const guestId = 'g_' + Math.random().toString(36).substring(2, 11);
    onLogin({
      id: guestId,
      username: `Guest${Math.floor(Math.random() * 9000) + 1000}`,
      isGuest: true
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-600 to-indigo-800">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 text-center"
      >
        <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl mb-4 transform -rotate-6">
          <h1 className="text-6xl font-black text-red-600 tracking-tighter italic">UNO</h1>
          <div className="flex gap-1 justify-center mt-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </div>
        </div>
        <p className="text-white/80 font-medium">Real-time Multiplayer Card Game</p>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-neutral-800"
      >
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${isLogin ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${!isLogin ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 ml-1">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Enter username"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-bold mb-1 ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group"
          >
            {isLogin ? <LogIn className="group-hover:translate-x-1 transition-transform" /> : <UserPlus className="group-hover:translate-x-1 transition-transform" />}
            {isLogin ? 'PLAY NOW' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4 text-neutral-300">
          <div className="flex-1 h-px bg-current"></div>
          <span className="text-xs font-bold text-neutral-400">OR</span>
          <div className="flex-1 h-px bg-current"></div>
        </div>

        <button 
          onClick={handleGuest}
          className="w-full mt-6 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
        >
          <Ghost className="group-hover:animate-bounce" />
          CONTINUE AS GUEST
        </button>
      </motion.div>

      <div className="mt-8 flex gap-8 text-white/60">
        <div className="flex items-center gap-2">
          <Trophy size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Global Ranking</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <span className="text-xs font-bold uppercase tracking-widest">About Game</span>
        </div>
      </div>
    </div>
  );
};
