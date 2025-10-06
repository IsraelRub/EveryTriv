import { useMemo } from 'react';

import { SCORING_DEFAULTS } from '@/constants';

import { ScoreStats, ScoringSystemProps } from '../../types';
import type { CurrentQuestionMetadata } from '../../types/game/components.types';
import { Icon } from '../icons';
import { GridLayout } from '../layout';

export default function ScoringSystem({
  score,
  total,
  topicsPlayed,
  difficultyStats,
  currentStreak = SCORING_DEFAULTS.STREAK,
  currentQuestionMetadata, // New prop for current question metadata
}: ScoringSystemProps & {
  currentQuestionMetadata?: CurrentQuestionMetadata;
}) {
  const streak = currentStreak; // Use the renamed prop
  const stats = useMemo(() => {
    const gradeRanges = [
      { min: 90, grade: 'A', color: 'bg-green-500' },
      { min: 80, grade: 'B', color: 'bg-blue-500' },
      { min: 70, grade: 'C', color: 'bg-blue-600' },
      { min: 60, grade: 'D', color: 'bg-yellow-500' },
      { min: 0, grade: 'F', color: 'bg-red-500' },
    ] as const;

    const percentage = total === 0 ? 0 : ((score ?? 0) / (total ?? 1)) * 100;

    return gradeRanges.reduce<ScoreStats>(
      (acc, range) => {
        if (percentage >= range.min && !acc.grade) {
          return {
            percentage,
            grade: range.grade,
            color: range.color,
          } as ScoreStats;
        }
        return acc;
      },
      { percentage: 0, grade: 'F', color: 'bg-red-500' } as ScoreStats
    );
  }, [score, total]);

  const topTopics = useMemo(() => {
    if (!topicsPlayed) return [];
    return Object.entries(topicsPlayed)
      .reduce(
        (acc, [topic, count]) => {
          acc.push({ topic, count: Number(count) ?? 0 });
          return acc;
        },
        [] as Array<{ topic: string; count: number }>
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [topicsPlayed]);

  if (total === 0) {
    return (
      <div className='mt-6'>
        <div className='glass rounded-lg p-6 text-center'>
          <h3 className='text-xl font-semibold text-white mb-4'>
            <Icon name='target' size='lg' className='mr-2' /> Ready to Start?
          </h3>
          <p className='text-white/80 mb-2'>
            Generate your first trivia question to see your statistics here!
          </p>
          <p className='text-white/60 text-sm'>
            <Icon name='lightbulb' size='sm' className='mr-1' /> Try different difficulty levels
            including custom descriptions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-6 space-y-6'>
      {/* Overall Score Summary */}
      <div className='glass rounded-lg p-6'>
        <GridLayout variant='stats' gap='md' className='text-center'>
          <div>
            <div className={`text-2xl font-bold text-white mb-1`}>{score}</div>
            <div className='text-white/70 text-sm'>Total Score</div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold mb-1`}
              style={{
                color: stats.color?.includes('success')
                  ? '#10b981'
                  : stats.color?.includes('info')
                    ? '#06b6d4'
                    : stats.color?.includes('warning')
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            >
              {stats.grade}
            </div>
            <div className='text-white/70 text-sm'>{stats.percentage?.toFixed(1) ?? '0.0'}%</div>
          </div>
          <div>
            <div className='text-2xl font-bold text-white mb-1'>{total}</div>
            <div className='text-white/70 text-sm'>Questions</div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold mb-1 ${streak > 0 ? 'text-yellow-400' : 'text-white/60'}`}
            >
              {streak}
            </div>
            <div className='text-white/70 text-sm'>Streak</div>
          </div>
        </GridLayout>

        {/* Score Multipliers */}
        {currentQuestionMetadata && (
          <div className='mt-4 pt-4 border-t border-white/10'>
            <div className='text-center'>
              <h4 className='text-sm font-medium text-white/80 mb-2'>
                Current Question Multipliers
              </h4>
              <GridLayout variant='stats' gap='sm' className='text-xs'>
                <div className='text-center'>
                  <span className='text-blue-400 font-medium'>
                    {currentQuestionMetadata.actualDifficulty ?? 'Standard'}
                  </span>
                  <div className='text-white/60'>Difficulty</div>
                </div>
                {currentQuestionMetadata.customDifficultyMultiplier && (
                  <div className='text-center'>
                    <span className='text-purple-400 font-medium'>
                      ×{currentQuestionMetadata.customDifficultyMultiplier}
                    </span>
                    <div className='text-white/60'>Custom Multiplier</div>
                  </div>
                )}
                <div className='text-center'>
                  <span className='text-green-400 font-medium'>
                    {currentQuestionMetadata.questionCount ?? 1}
                  </span>
                  <div className='text-white/60'>Questions</div>
                </div>
              </GridLayout>
            </div>
          </div>
        )}
      </div>

      {/* Difficulty Breakdown */}
      <div className='glass rounded-lg p-6'>
        <h4 className='text-white font-semibold mb-4'>Performance by Difficulty</h4>
        <GridLayout variant='content' gap='md'>
          {Object.entries(difficultyStats ?? {}).map(([diff, stats]) => (
            <div key={diff} className='text-center'>
              <div className='text-lg font-bold text-white mb-1'>{stats.correct}</div>
              <div className='text-white/70 text-sm'>{diff}</div>
              <div className='text-xs text-white/50'>
                {stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0}% success
              </div>
            </div>
          ))}
        </GridLayout>
      </div>

      {/* Topics and Difficulty Stats */}
      <GridLayout variant='content' gap='lg'>
        {/* Top Topics */}
        <div className='glass rounded-lg p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='text-white font-semibold'>
              <Icon name='book' size='sm' className='mr-1' /> Top Topics
            </h4>
            <span className='bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-sm'>
              {Object.keys(topicsPlayed ?? {}).length}
            </span>
          </div>
          {topTopics.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {topTopics.map(({ topic, count }) => (
                <span
                  key={topic}
                  className='bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-400/30'
                >
                  {topic}: {count} time{count !== 1 ? 's' : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className='text-white/60'>No topics played yet</p>
          )}
        </div>

        {/* Success Rates by Difficulty */}
        <div className='glass rounded-lg p-6'>
          <h4 className='text-white font-semibold mb-4'>
            <Icon name='target' size='sm' className='mr-1' /> Success Rates
          </h4>
          <div className='space-y-3'>
            {Object.entries(difficultyStats ?? {}).map(([diff, stats]) => {
              const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
              return (
                <div key={diff} className='flex items-center justify-between'>
                  <span className='text-white/80 text-sm capitalize'>{diff}</span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-16 bg-slate-700 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300'
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className='text-white/60 text-xs w-8 text-right'>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GridLayout>
    </div>
  );
}
