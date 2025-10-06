import { GameMode as GameModeEnum, VALID_GAME_MODES } from '@shared';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { DEFAULT_GAME_MODE, getGameModeDefaults } from '../../constants/gameModeDefaults';
import { GameModeUIProps } from '../../types';
import { fadeInUp, scaleIn } from '../animations';
import { Icon } from '../icons';
import { Button } from '../ui';

export default function GameMode({ isVisible, onSelectMode, onCancel }: GameModeUIProps) {
  const [mode, setMode] = useState<GameModeEnum>(DEFAULT_GAME_MODE);

  // Get defaults from centralized constants (single source of truth)
  const [timeLimit, setTimeLimit] = useState(
    () => getGameModeDefaults(DEFAULT_GAME_MODE).timeLimit
  );
  const [questionLimit, setQuestionLimit] = useState(
    () => getGameModeDefaults(DEFAULT_GAME_MODE).questionLimit
  );

  // Update defaults when game mode changes
  useEffect(() => {
    const defaults = getGameModeDefaults(mode);
    setTimeLimit(defaults.timeLimit);
    setQuestionLimit(defaults.questionLimit);
  }, [mode]);

  // Validate game mode
  const isValidGameMode = (mode: GameModeEnum): boolean => {
    return VALID_GAME_MODES.includes(mode);
  };

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50'>
      <motion.div
        variants={scaleIn}
        initial='hidden'
        animate='visible'
        className='bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md glass'
        whileHover={{ scale: 1.02 }}
      >
        <h2 className='text-2xl font-bold text-white mb-4'>Select Game Mode</h2>

        <div className='space-y-6'>
          {/* Game mode buttons */}
          <div className='flex flex-col gap-3'>
            {/* Question Limited Mode */}
            <Button
              variant={mode === GameModeEnum.QUESTION_LIMITED ? 'primary' : 'ghost'}
              className='w-full justify-between items-center flex'
              onClick={() => {
                if (isValidGameMode(GameModeEnum.QUESTION_LIMITED)) {
                  setMode(GameModeEnum.QUESTION_LIMITED);
                }
              }}
            >
              <span>
                <Icon name='list' size='sm' className='mr-1' /> Question Limited
              </span>
              <span className='text-sm opacity-80'>{questionLimit} Questions</span>
            </Button>

            {/* Time Limited Mode */}
            <Button
              variant={mode === GameModeEnum.TIME_LIMITED ? 'primary' : 'ghost'}
              className='w-full justify-between items-center flex'
              onClick={() => {
                if (isValidGameMode(GameModeEnum.TIME_LIMITED)) {
                  setMode(GameModeEnum.TIME_LIMITED);
                }
              }}
            >
              <span>
                <Icon name='timer' size='sm' className='mr-1' /> Time Limited
              </span>
              <span className='text-sm opacity-80'>
                {timeLimit >= 60
                  ? `${Math.floor(timeLimit / 60)}m ${timeLimit % 60}s`
                  : `${timeLimit}s`}
              </span>
            </Button>

            {/* Unlimited Mode */}
            <Button
              variant={mode === GameModeEnum.UNLIMITED ? 'primary' : 'ghost'}
              className='w-full justify-between items-center flex'
              onClick={() => {
                if (isValidGameMode(GameModeEnum.UNLIMITED)) {
                  setMode(GameModeEnum.UNLIMITED);
                }
              }}
            >
              <span>
                <Icon name='infinity' size='sm' className='mr-1' /> Unlimited
              </span>
              <span className='text-sm opacity-80'>No Scoring</span>
            </Button>

            {mode === GameModeEnum.TIME_LIMITED && (
              <motion.div
                variants={fadeInUp}
                initial='hidden'
                animate='visible'
                className='pl-8 flex items-center gap-2'
              >
                <input
                  type='range'
                  min={60}
                  max={600}
                  step={60}
                  value={timeLimit}
                  onChange={e => setTimeLimit(parseInt(e.target.value))}
                  className='w-full'
                />
                <span className='text-white min-w-[60px] text-center'>
                  {timeLimit >= 60
                    ? `${Math.floor(timeLimit / 60)}:${(timeLimit % 60).toString().padStart(2, '0')}`
                    : `0:${timeLimit.toString().padStart(2, '0')}`}
                </span>
              </motion.div>
            )}

            {mode === GameModeEnum.QUESTION_LIMITED && (
              <motion.div
                variants={fadeInUp}
                initial='hidden'
                animate='visible'
                className='pl-8 flex items-center gap-2'
              >
                <input
                  type='range'
                  min={5}
                  max={100}
                  step={5}
                  value={questionLimit}
                  onChange={e => {
                    const newCount = parseInt(e.target.value);
                    setQuestionLimit(newCount);
                  }}
                  className='w-full'
                />
                <input
                  type='number'
                  min={1}
                  max={999}
                  value={questionLimit}
                  onChange={e => {
                    const newCount = parseInt(e.target.value) || 1;
                    setQuestionLimit(newCount);
                  }}
                  className='w-20 px-2 py-1 text-center bg-slate-700 text-white rounded border border-slate-600'
                />
              </motion.div>
            )}

            <Button
              variant={mode === GameModeEnum.UNLIMITED ? 'primary' : 'ghost'}
              className='w-full text-left'
              onClick={() => {
                if (isValidGameMode(GameModeEnum.UNLIMITED)) {
                  setMode(GameModeEnum.UNLIMITED);
                }
              }}
            >
              <span>
                <Icon name='infinity' size='sm' className='mr-1' /> Unlimited
              </span>
            </Button>

            {mode === GameModeEnum.UNLIMITED && (
              <motion.div
                variants={fadeInUp}
                initial='hidden'
                animate='visible'
                className='pl-8 text-white/70 text-sm'
              >
                <p>Play as many questions as you want. Game continues until you stop.</p>
              </motion.div>
            )}
          </div>

          {/* Description */}
          <div className='p-3 bg-white/10 rounded-lg'>
            <p className='text-white/80 text-sm'>
              {mode === GameModeEnum.TIME_LIMITED
                ? 'Answer as many questions as you can before time runs out!'
                : mode === GameModeEnum.QUESTION_LIMITED
                  ? 'Complete a set number of questions to finish the game.'
                  : 'Keep playing as long as you want with no limits!'}
            </p>
          </div>

          {/* Action buttons */}
          <div className='flex gap-3 justify-end'>
            <Button variant='ghost' onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={() =>
                onSelectMode?.({
                  mode,
                  timeLimit: mode === GameModeEnum.TIME_LIMITED ? timeLimit : undefined,
                  questionLimit: mode === GameModeEnum.QUESTION_LIMITED ? questionLimit : undefined,
                })
              }
            >
              Start Game
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
