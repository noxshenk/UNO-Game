import { nanoid } from 'nanoid';

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
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  lastColor: CardColor | null;
}

export function createDeck(): Card[] {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const values: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
  const deck: Card[] = [];

  for (const color of colors) {
    for (const value of values) {
      // One 0 per color, two of every other value
      const count = value === '0' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({ id: nanoid(), color, value });
      }
    }
  }

  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nanoid(), color: 'wild', value: 'wild' });
    deck.push({ id: nanoid(), color: 'wild', value: 'wild4' });
  }

  return shuffle(deck);
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function dealCards(deck: Card[], players: string[]): { hands: Record<string, Card[]>, remainingDeck: Card[] } {
  const hands: Record<string, Card[]> = {};
  let currentDeck = [...deck];

  for (const playerId of players) {
    hands[playerId] = currentDeck.slice(0, 7);
    currentDeck = currentDeck.slice(7);
  }

  return { hands, remainingDeck: currentDeck };
}

export function isValidMove(card: Card, topCard: Card, currentColor: CardColor): boolean {
  if (card.color === 'wild' || card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}
