/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, Play, RotateCcw, Pause, Home, Settings2, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { Block, GameMode, GameState, GRID_COLS, GRID_ROWS, INITIAL_ROWS, TIME_LIMIT } from './types';
import { createInitialGrid, generateId, generateRandomValue, generateTargetSum } from './utils';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('sum-strike-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update high score
  useEffect(() => {
    if (gameState && gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('sum-strike-highscore', gameState.score.toString());
    }
  }, [gameState?.score, highScore]);

  // Initialize game
  const startGame = (mode: GameMode) => {
    const initialGrid = createInitialGrid(INITIAL_ROWS);
    setGameState({
      grid: initialGrid,
      selectedIds: [],
      targetSum: generateTargetSum(initialGrid, 1),
      score: 0,
      level: 1,
      gameOver: false,
      mode,
      timeLeft: TIME_LIMIT,
      isPaused: false,
    });
  };

  const addNewRow = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.isPaused) return prev;

      // Shift existing blocks up
      const newGrid = prev.grid.map(block => ({
        ...block,
        row: block.row + 1,
      }));

      // Check for game over (if any block reaches top row)
      const isGameOver = newGrid.some(block => block.row >= GRID_ROWS - 1);

      if (isGameOver) {
        return { ...prev, grid: newGrid, gameOver: true };
      }

      // Add new row at the bottom (row 0)
      for (let c = 0; c < GRID_COLS; c++) {
        newGrid.push({
          id: generateId(),
          value: generateRandomValue(prev.level),
          row: 0,
          col: c,
        });
      }

      return { ...prev, grid: newGrid };
    });
  }, []);

  // Timer logic for Time Mode
  useEffect(() => {
    if (gameState?.mode === 'time' && !gameState.gameOver && !gameState.isPaused) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (!prev) return null;
          if (prev.timeLeft <= 0) {
            addNewRow();
            return { ...prev, timeLeft: TIME_LIMIT };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.mode, gameState?.gameOver, gameState?.isPaused, addNewRow]);

  const handleBlockClick = (id: string) => {
    if (!gameState || gameState.gameOver || gameState.isPaused) return;

    setGameState(prev => {
      if (!prev) return null;
      
      const isSelected = prev.selectedIds.includes(id);
      let newSelectedIds: string[];

      if (isSelected) {
        newSelectedIds = prev.selectedIds.filter(sid => sid !== id);
      } else {
        newSelectedIds = [...prev.selectedIds, id];
      }

      const selectedBlocks = prev.grid.filter(b => newSelectedIds.includes(b.id));
      const currentSum = selectedBlocks.reduce((acc, b) => acc + b.value, 0);

      if (currentSum === prev.targetSum) {
        // Success!
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#ffffff']
        });

        const remainingGrid = prev.grid.filter(b => !newSelectedIds.includes(b.id));
        const newScore = prev.score + (newSelectedIds.length * 10 * prev.level);
        const newLevel = Math.floor(newScore / 500) + 1;
        
        // In classic mode, add a row after each success
        if (prev.mode === 'classic') {
          // We'll handle row addition in a separate step to ensure state consistency
          setTimeout(() => addNewRow(), 100);
        }

        return {
          ...prev,
          grid: remainingGrid,
          selectedIds: [],
          targetSum: generateTargetSum(remainingGrid, newLevel),
          score: newScore,
          level: newLevel,
          timeLeft: TIME_LIMIT, // Reset timer on success in time mode
        };
      } else if (currentSum > prev.targetSum) {
        // Exceeded target, clear selection
        return { ...prev, selectedIds: [] };
      }

      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 grid-pattern">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md w-full"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-display font-bold tracking-tighter text-white uppercase italic">
              数字突击
            </h1>
            <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
              掌控数字，横扫方块
            </p>
          </div>

          <div className="grid gap-4">
            <button 
              onClick={() => startGame('classic')}
              className="group relative p-6 bg-slate-800 brutalist-border-accent hover:bg-emerald-500/10 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-display font-bold text-emerald-400">经典模式</span>
                <Play className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-slate-400 text-sm">每次成功后新增一行。挑战生存极限。</p>
            </button>

            <button 
              onClick={() => startGame('time')}
              className="group relative p-6 bg-slate-800 brutalist-border hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-display font-bold text-white">计时模式</span>
                <Timer className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-slate-400 text-sm">与时间赛跑。每10秒强制新增一行。</p>
            </button>
          </div>

          <div className="pt-8 border-t border-slate-800 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">最高分</p>
              <p className="text-2xl font-mono font-bold text-white">{highScore}</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentSelectionSum = gameState.grid
    .filter(b => gameState.selectedIds.includes(b.id))
    .reduce((acc, b) => acc + b.value, 0);

  return (
    <div className="min-h-screen flex flex-col bg-game-bg grid-pattern">
      {/* Header */}
      <header className="p-4 md:p-6 flex items-center justify-between border-b border-slate-800 bg-game-bg/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setGameState(null)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">分数</p>
            <p className="text-xl font-mono font-bold">{gameState.score}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">目标数字</p>
          <div className="px-6 py-2 bg-emerald-500/10 brutalist-border-accent">
            <span className="text-4xl font-display font-bold text-emerald-400">{gameState.targetSum}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {gameState.mode === 'time' && (
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">时间</p>
              <p className={cn(
                "text-xl font-mono font-bold",
                gameState.timeLeft <= 3 ? "text-red-500 animate-pulse" : "text-white"
              )}>
                {gameState.timeLeft}s
              </p>
            </div>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">等级</p>
            <p className="text-xl font-mono font-bold">{gameState.level}</p>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        <div 
          className="relative bg-slate-900/50 brutalist-border"
          style={{
            width: 'min(90vw, 400px)',
            height: 'min(75vh, 650px)',
          }}
        >
          {/* Grid Background Lines */}
          <div className="absolute inset-0 grid grid-cols-6 pointer-events-none opacity-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-r border-white h-full" />
            ))}
          </div>
          <div className="absolute inset-0 grid grid-rows-12 pointer-events-none opacity-10">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-b border-white w-full" />
            ))}
          </div>

          {/* Blocks */}
          <AnimatePresence>
            {gameState.grid.map((block) => (
              <motion.button
                key={block.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  left: (block.col * 100 / GRID_COLS) + '%',
                  top: ((GRID_ROWS - 1 - block.row) * 100 / GRID_ROWS) + '%',
                }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => handleBlockClick(block.id)}
                className={cn(
                  "absolute flex items-center justify-center font-display font-bold text-xl transition-all duration-200",
                  gameState.selectedIds.includes(block.id) 
                    ? "bg-emerald-500 text-slate-900 z-10 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    : "bg-slate-800 text-white hover:bg-slate-700"
                )}
                style={{
                  width: (100 / GRID_COLS) + '%',
                  height: (100 / GRID_ROWS) + '%',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {block.value}
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Danger Zone Indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 animate-pulse" />
        </div>

        {/* Current Selection Info (Mobile Floating) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter">当前总和</span>
            <span className={cn(
              "text-2xl font-mono font-bold",
              currentSelectionSum > gameState.targetSum ? "text-red-500" : "text-emerald-400"
            )}>
              {currentSelectionSum}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter">目标</span>
            <span className="text-2xl font-mono font-bold text-white opacity-50">
              {gameState.targetSum}
            </span>
          </div>
        </div>
      </main>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 brutalist-border p-8 max-w-sm w-full text-center space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-display font-bold text-red-500 uppercase italic">游戏结束</h2>
                <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">数字方块已触顶</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">最终得分</p>
                  <p className="text-3xl font-mono font-bold text-white">{gameState.score}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">等级</p>
                  <p className="text-3xl font-mono font-bold text-white">{gameState.level}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => startGame(gameState.mode)}
                  className="w-full py-4 bg-emerald-500 text-slate-900 font-display font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  再试一次
                </button>
                <button 
                  onClick={() => setGameState(null)}
                  className="w-full py-4 bg-slate-800 text-white font-display font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  返回主菜单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Overlay */}
      <AnimatePresence>
        {gameState.isPaused && !gameState.gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
          >
            <button 
              onClick={() => setGameState(prev => prev ? ({ ...prev, isPaused: false }) : null)}
              className="group flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 fill-current" />
              </div>
              <span className="text-white font-display font-bold uppercase tracking-widest text-xl">已暂停</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <footer className="p-4 border-t border-slate-800 bg-game-bg/80 backdrop-blur-md flex justify-center gap-4">
        <button 
          onClick={() => setGameState(prev => prev ? ({ ...prev, isPaused: !prev.isPaused }) : null)}
          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
        >
          {gameState.isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </button>
        <button 
          onClick={() => startGame(gameState.mode)}
          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
}
