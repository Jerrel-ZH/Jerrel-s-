import { Block, GRID_COLS } from './types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateRandomValue = (level: number) => {
  const max = Math.min(9, 3 + Math.floor(level / 2));
  return Math.floor(Math.random() * max) + 1;
};

export const generateTargetSum = (grid: Block[], level: number) => {
  if (grid.length === 0) return 15;
  
  // Try to find a combination of blocks that sums to between 10 and 20
  let attempts = 0;
  while (attempts < 100) {
    const numBlocks = Math.floor(Math.random() * 4) + 2; // Pick 2-5 blocks
    const shuffled = [...grid].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, Math.min(numBlocks, grid.length));
    const sum = selection.reduce((acc, block) => acc + block.value, 0);
    
    if (sum >= 10 && sum <= 20) {
      return sum;
    }
    attempts++;
  }
  
  // If we couldn't find a perfect match in 100 tries, 
  // just pick a random achievable sum or fallback to a random in range
  const randomBlocks = [...grid].sort(() => 0.5 - Math.random()).slice(0, 3);
  const fallbackSum = randomBlocks.reduce((acc, b) => acc + b.value, 0);
  if (fallbackSum >= 5) return Math.min(Math.max(fallbackSum, 10), 20);

  return Math.floor(Math.random() * 11) + 10;
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
