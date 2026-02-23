export type GameMode = 'classic' | 'time';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  grid: Block[];
  selectedIds: string[];
  targetSum: number;
  score: number;
  level: number;
  gameOver: boolean;
  mode: GameMode;
  timeLeft: number;
  isPaused: boolean;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 12;
export const INITIAL_ROWS = 3;
export const TIME_LIMIT = 10; // seconds for time mode
