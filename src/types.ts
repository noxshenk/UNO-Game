export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  username: string;
  hand: Card[];
  handCount?: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  discardPile: Card[];
  deckCount: number;
  status: 'waiting' | 'playing' | 'finished';
  lastColor: CardColor;
  winner: string | null;
  direction: 1 | -1;
}

export interface User {
  id: string;
  username: string;
  isGuest: boolean;
}
