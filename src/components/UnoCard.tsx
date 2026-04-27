import React from 'react';
import { cn } from '../utils/cn';
import { CardColor, CardValue } from '../types';

interface UnoCardProps {
  color: CardColor;
  value: CardValue;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isBack?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<CardColor, string> = {
  red: 'bg-red-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  wild: 'bg-neutral-900',
};

const valueDisplay: Record<CardValue, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  'skip': '⊘', 'reverse': '⇄', 'draw2': '+2', 'wild': 'W', 'wild4': '+4'
};

export const UnoCard: React.FC<UnoCardProps> = ({ 
  color, 
  value, 
  onClick, 
  disabled, 
  className,
  isBack = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-20 text-sm',
    md: 'w-20 h-32 text-xl',
    lg: 'w-28 h-44 text-3xl'
  };

  if (isBack) {
    return (
      <div className={cn(
        "rounded-xl border-4 border-white shadow-xl bg-neutral-900 flex items-center justify-center transition-transform hover:-translate-y-2",
        sizeClasses[size],
        className
      )}>
        <div className="bg-red-600 w-4/5 h-4/5 rounded-full flex items-center justify-center border-2 border-yellow-500">
          <span className="text-white font-bold italic transform -rotate-45">UNO</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl border-4 border-white shadow-xl flex flex-col items-center justify-center relative transition-transform",
        !disabled && "hover:-translate-y-4 cursor-pointer",
        disabled && "opacity-80 grayscale-[0.2]",
        colorMap[color],
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute top-1 left-1 font-bold text-white text-[0.6em]">{valueDisplay[value]}</div>
      
      <div className="w-4/5 h-3/5 bg-white/20 rounded-[50%] flex items-center justify-center transform -rotate-12 border border-white/30">
        <span className="text-white font-black italic drop-shadow-md">
          {valueDisplay[value]}
        </span>
      </div>

      <div className="absolute bottom-1 right-1 font-bold text-white text-[0.6em] rotate-180">{valueDisplay[value]}</div>
    </button>
  );
};
