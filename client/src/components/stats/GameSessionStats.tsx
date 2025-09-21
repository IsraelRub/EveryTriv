/**
 * Game Session Statistics Component
 * Demonstrates the use of time utilities for displaying game session information
 *
 * @module GameSessionStats
 * @description Component for displaying game session statistics with time formatting
 * @used_by client/src/views/gameHistory
 */

import { calculatePercentage, formatDuration, formatTimeDisplay, getTimeElapsed } from '@shared';
import { motion } from 'framer-motion';

import { GameSessionStatsProps } from '../../types';
import { fadeInUp } from '../animations';
import { Icon } from '../icons';

export default function GameSessionStats({ session, className }: GameSessionStatsProps) {
  const sessionDuration = session.endTime
    ? Math.floor((session.endTime - session.startTime) / 1000)
    : Math.floor((Date.now() - session.startTime) / 1000);

  const accuracy = calculatePercentage(session.correctAnswers, session.totalQuestions);

  const timeElapsed = getTimeElapsed(session.startTime);

  return (
    <motion.div
      variants={fadeInUp}
      initial='hidden'
      animate='visible'
      className={`glass rounded-lg p-6 ${className || ''}`}
    >
      <div className='space-y-4'>
        {/* Session Header */}
        <div className='text-center mb-6'>
          <h3 className='text-xl font-bold text-white mb-2'>Session Statistics</h3>
          <p className='text-slate-300 text-sm'>Detailed game session information</p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4'>
          {/* Session Duration */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='clock' size='sm' className='text-blue-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>
              {formatDuration(sessionDuration)}
            </div>
            <div className='text-xs text-slate-400'>Duration</div>
          </div>

          {/* Time Display */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='timer' size='sm' className='text-green-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>
              {formatTimeDisplay(sessionDuration * 1000)}
            </div>
            <div className='text-xs text-slate-400'>Time Played</div>
          </div>

          {/* Questions Answered */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='help-circle' size='sm' className='text-purple-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>{session.totalQuestions}</div>
            <div className='text-xs text-slate-400'>Questions</div>
          </div>

          {/* Accuracy */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='target' size='sm' className='text-yellow-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>{accuracy}%</div>
            <div className='text-xs text-slate-400'>Accuracy</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className='mt-6 pt-4 border-t border-white/10'>
          <div className='text-sm text-slate-300 space-y-2'>
            <div className='flex justify-between'>
              <span>Session Started:</span>
              <span className='text-white'>
                {timeElapsed.days > 0
                  ? `${timeElapsed.days}d ago`
                  : timeElapsed.hours > 0
                    ? `${timeElapsed.hours}h ago`
                    : timeElapsed.minutes > 0
                      ? `${timeElapsed.minutes}m ago`
                      : 'Just now'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Correct Answers:</span>
              <span className='text-white'>
                {session.correctAnswers}/{session.totalQuestions}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Average Time per Question:</span>
              <span className='text-white'>
                {formatDuration(Math.round(sessionDuration / session.totalQuestions))}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Session Status:</span>
              <span
                className={`font-medium ${session.endTime ? 'text-green-400' : 'text-yellow-400'}`}
              >
                {session.endTime ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
