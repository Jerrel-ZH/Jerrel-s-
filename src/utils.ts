import { Block, GRID_COLS } from './types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateRandomValue = (level: number) => {
  const max = Math.min(9, 3 + Math.floor(level / 2));
  return Math.floor(Math.random() * max) + 1;
};

export const generateTargetSum = (grid: Block[], level: number) => {
  if (grid.length === 0) return 10;
  
  // Pick 2-4 random blocks to form a sum
  const numBlocks = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...grid].sort(() => 0.5 - Math.random());
  const selection = shuffled.slice(0, Math.min(numBlocks, grid.length));
  
  return selection.reduce((acc, block) => acc + block.value, 0);
};

export const createInitialGrid = (rows: number): Block[] => {
  const grid: Block[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      grid.push({
        id: generateId(),
        value: generateRandomValue(1),
        row: r,
        col: c,
      });
    }
  }
  return grid;
};
