import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui';
import { GameMode as GameModeType } from '../../types';

interface GameModeUIProps {
  isVisible: boolean;
  onSelectMode: (config: {
    mode: GameModeType;
    timeLimit?: number;
    questionLimit?: number;
  }) => void;
  onCancel: () => void;
}

export default function GameMode({ isVisible, onSelectMode, onCancel }: GameModeUIProps) {
  const [mode, setMode] = useState<GameModeType>(GameModeType.QUESTION_LIMITED);
  const [timeLimit, setTimeLimit] = useState(60); // Default 1 minute
  const [questionLimit, setQuestionLimit] = useState(20); // Default 20 questions
  
  if (!isVisible) return null;
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md glass-morphism"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Select Game Mode</h2>
        
        <div className="space-y-6">
          {/* Game mode buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant={mode === GameModeType.TIME_LIMITED ? 'primary' : 'ghost'}
              className="w-full justify-between items-center flex"
              onClick={() => setMode(GameModeType.TIME_LIMITED)}
            >
              <span>⏱️ Time Limited</span>
              <span className="text-sm opacity-80">
                {timeLimit >= 60 
                  ? `${Math.floor(timeLimit / 60)}m ${timeLimit % 60}s` 
                  : `${timeLimit}s`}
              </span>
            </Button>
            
            {mode === GameModeType.TIME_LIMITED && (
              <motion.div 
                className="pl-8 flex items-center gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <input 
                  type="range" 
                  min={10} 
                  max={300} 
                  step={10}
                  value={timeLimit}
                  onChange={e => setTimeLimit(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-white min-w-[60px] text-center">
                  {timeLimit >= 60 
                    ? `${Math.floor(timeLimit / 60)}:${(timeLimit % 60).toString().padStart(2, '0')}` 
                    : `0:${timeLimit.toString().padStart(2, '0')}`}
                </span>
              </motion.div>
            )}
            
            <Button
              variant={mode === GameModeType.QUESTION_LIMITED ? 'primary' : 'ghost'}
              className="w-full justify-between items-center flex"
              onClick={() => setMode(GameModeType.QUESTION_LIMITED)}
            >
              <span>📋 Question Limited</span>
              <span className="text-sm opacity-80">{questionLimit} questions</span>
            </Button>
            
            {mode === GameModeType.QUESTION_LIMITED && (
              <motion.div 
                className="pl-8 flex items-center gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <input 
                  type="range" 
                  min={5} 
                  max={50} 
                  step={5}
                  value={questionLimit}
                  onChange={e => setQuestionLimit(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-white min-w-[40px] text-center">{questionLimit}</span>
              </motion.div>
            )}
            
            <Button
              variant={mode === GameModeType.UNLIMITED ? 'primary' : 'ghost'}
              className="w-full text-left"
              onClick={() => setMode(GameModeType.UNLIMITED)}
            >
              <span>🔄 Unlimited</span>
            </Button>
            
            {mode === GameModeType.UNLIMITED && (
              <motion.p
                className="pl-8 text-white/70 text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                Play as many questions as you want. Game continues until you stop.
              </motion.p>
            )}
          </div>
          
          {/* Description */}
          <div className="p-3 bg-white/10 rounded-lg">
            <p className="text-white/80 text-sm">
              {mode === GameModeType.TIME_LIMITED 
                ? 'Answer as many questions as you can before time runs out!' 
                : mode === GameModeType.QUESTION_LIMITED
                ? 'Complete a set number of questions to finish the game.'
                : 'Keep playing as long as you want with no limits!'}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={() => onSelectMode({
                mode,
                timeLimit: mode === GameModeType.TIME_LIMITED ? timeLimit : undefined,
                questionLimit: mode === GameModeType.QUESTION_LIMITED ? questionLimit : undefined
              })}
            >
              Start Game
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
