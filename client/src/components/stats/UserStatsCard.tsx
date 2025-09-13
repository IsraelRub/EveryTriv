/**
 * User Statistics Card Component
 * Demonstrates the use of date utilities for displaying user statistics
 *
 * @module UserStatsCard
 * @description Card component for displaying user statistics with date formatting
 * @used_by client/src/views/user/UserProfile.tsx
 */

import { calculateAge, formatDate, formatDateShort, isToday, isYesterday } from '@shared';
import { motion } from 'framer-motion';

import { UserStatsCardProps } from '../../types';
import { fadeInUp } from '../animations';
import { Icon } from '../icons';

export default function UserStatsCard({ user, className }: UserStatsCardProps) {
  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Never';
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return formatDateShort(date);
  };

  const userAge = calculateAge(user.dateOfBirth);

  return (
    <motion.div
      variants={fadeInUp}
      initial='hidden'
      animate='visible'
      className={`glass rounded-lg p-6 ${className || ''}`}
    >
      <div className='space-y-4'>
        {/* User Info Header */}
        <div className='text-center mb-6'>
          <h3 className='text-xl font-bold text-white mb-2'>User Statistics</h3>
          <p className='text-slate-300 text-sm'>Detailed user information and activity</p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4'>
          {/* Account Age */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='calendar' size='sm' className='text-blue-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>{formatDate(user.created_at)}</div>
            <div className='text-xs text-slate-400'>Account Created</div>
          </div>

          {/* Last Login */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='clock' size='sm' className='text-green-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>
              {formatLastLogin(user.lastLogin)}
            </div>
            <div className='text-xs text-slate-400'>Last Login</div>
          </div>

          {/* User Age */}
          {userAge && (
            <div className='bg-white/5 rounded-lg p-4 text-center'>
              <Icon name='user' size='sm' className='text-purple-400 mx-auto mb-2' />
              <div className='text-lg font-semibold text-white'>{userAge} years</div>
              <div className='text-xs text-slate-400'>Age</div>
            </div>
          )}

          {/* Total Score */}
          <div className='bg-white/5 rounded-lg p-4 text-center'>
            <Icon name='trophy' size='sm' className='text-yellow-400 mx-auto mb-2' />
            <div className='text-lg font-semibold text-white'>{user.score.toLocaleString()}</div>
            <div className='text-xs text-slate-400'>Total Score</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className='mt-6 pt-4 border-t border-white/10'>
          <div className='text-sm text-slate-300 space-y-2'>
            <div className='flex justify-between'>
              <span>Account Created:</span>
              <span className='text-white'>{formatDate(user.created_at)}</span>
            </div>
            {user.dateOfBirth && (
              <div className='flex justify-between'>
                <span>Birth Date:</span>
                <span className='text-white'>{formatDate(user.dateOfBirth)}</span>
              </div>
            )}
            {user.lastLogin && (
              <div className='flex justify-between'>
                <span>Last Active:</span>
                <span className='text-white'>{formatDate(user.lastLogin)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
