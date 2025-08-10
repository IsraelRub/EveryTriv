import { useMemo } from 'react';
import { ScoringSystemProps } from '../../types';
import { FloatingCard } from '../animations';
import { isCustomDifficulty, getCustomDifficultyMultiplier as calculateCustomDifficultyMultiplier } from '../../utils/customDifficulty.utils';
import { SCORING_DEFAULTS } from '@/shared/constants';

interface ScoreStats {
  percentage: number;
  grade: string;
  color: string;
}

// פונקציה להצגת שם רמת הקושי
const getDifficultyDisplayName = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
    case 'custom':
      return 'Custom';
    default:
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
};

export default function ScoringSystem({ 
  score, 
  total, 
  topicsPlayed, 
  difficultyStats,
  streak = SCORING_DEFAULTS.STREAK,
  difficulty = SCORING_DEFAULTS.DIFFICULTY,
  answerCount = SCORING_DEFAULTS.ANSWER_COUNT,
  currentQuestionMetadata // New prop for current question metadata
}: ScoringSystemProps & { 
  currentQuestionMetadata?: { 
    customDifficultyMultiplier?: number;
    actualDifficulty?: string;
    questionCount?: number;
  } 
}) {
  const stats = useMemo(() => {
    const gradeRanges = [
      { min: 90, grade: 'A', color: 'bg-green-500' },
      { min: 80, grade: 'B', color: 'bg-blue-500' },
      { min: 70, grade: 'C', color: 'bg-blue-600' },
      { min: 60, grade: 'D', color: 'bg-yellow-500' },
      { min: 0, grade: 'F', color: 'bg-red-500' }
    ];

    const percentage = total === 0 ? 0 : (score / total) * 100;

    return gradeRanges.reduce<ScoreStats>((acc, range) => {
      if (percentage >= range.min && !acc.grade) {
        return {
          percentage,
          grade: range.grade,
          color: range.color
        };
      }
      return acc;
    }, { percentage: 0, grade: 'F', color: 'bg-red-500' });
  }, [score, total]);

  const topTopics = useMemo(() => {
    return Object.entries(topicsPlayed)
      .reduce((acc, [topic, count]) => {
        acc.push({ topic, count });
        return acc;
      }, [] as Array<{ topic: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [topicsPlayed]);

  const difficultyRates = useMemo(() => {
    return Object.entries(difficultyStats).reduce((acc, [diff, stats]) => {
      const rate = stats.total === 0 ? 0 : (stats.correct / stats.total) * 100;
      acc[diff] = rate;
      return acc;
    }, {} as Record<string, number>);
  }, [difficultyStats]);

  // סטטיסטיקות נוספות לרמות קושי מותאמות
  const customDifficultyStats = useMemo(() => {
    const customStats = difficultyStats['custom'];
    if (!customStats || customStats.total === 0) return null;
    
    return {
      total: customStats.total,
      correct: customStats.correct,
      rate: (customStats.correct / customStats.total) * 100
    };
  }, [difficultyStats]);

  if (total === 0) {
    return (
      <div className="mt-6">
        <div className="glass-morphism rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">🎯 Ready to Start?</h3>
          <p className="text-white/80 mb-2">
            Generate your first trivia question to see your statistics here!
          </p>
          <p className="text-white/60 text-sm">
            💡 Try different difficulty levels including custom descriptions
          </p>
        </div>
      </div>
    );
  }

  return (
    <FloatingCard>
      <div className="mt-6 space-y-6">
      {/* Overall Score Summary */}
      <div className="glass-morphism rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold text-white mb-1`}>
              {score}
            </div>
            <div className="text-white/70 text-sm">Total Score</div>
          </div>
          <div>
            <div className={`text-2xl font-bold mb-1`} style={{ color: stats.color.includes('success') ? '#10b981' : stats.color.includes('info') ? '#06b6d4' : stats.color.includes('warning') ? '#f59e0b' : '#ef4444' }}>
              {stats.grade}
            </div>
            <div className="text-white/70 text-sm">{stats.percentage.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white mb-1">
              {total}
            </div>
            <div className="text-white/70 text-sm">Questions</div>
          </div>
          <div>
            <div className={`text-2xl font-bold mb-1 ${streak > 0 ? 'text-yellow-400' : 'text-white/60'}`}>
              {streak}
            </div>
            <div className="text-white/70 text-sm">Streak</div>
          </div>
        </div>
        
        {/* Score Multipliers */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <h4 className="text-white font-semibold mb-3">Score Multipliers</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <div className="text-blue-400 font-medium">Base Points</div>
              <div className="text-white">100</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-medium">Difficulty</div>
              <div className="text-white">
                {(() => {
                  // Use actual custom difficulty multiplier from metadata if available
                  if (currentQuestionMetadata?.customDifficultyMultiplier) {
                    return `${currentQuestionMetadata.customDifficultyMultiplier.toFixed(1)}x`;
                  }
                  // Calculate real multiplier for custom difficulties
                  if (isCustomDifficulty(difficulty)) {
                    const actualDifficulty = difficulty.substring(7); // Remove 'custom:' prefix
                    const multiplier = calculateCustomDifficultyMultiplier(actualDifficulty);
                    return `${multiplier.toFixed(1)}x`;
                  }
                  // Standard difficulty multipliers
                  switch(difficulty) {
                    case 'easy': return '1x';
                    case 'medium': return '1.5x';
                    case 'hard': return '2x';
                    default: return '1x';
                  }
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-medium">Options</div>
              <div className="text-white">
                {(() => {
                  switch(answerCount) {
                    case 3: return '1x';
                    case 4: return '1.2x';
                    case 5: return '1.4x';
                    default: return '1x';
                  }
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-medium">Streak</div>
              <div className="text-white">
                {(1 + (Math.min(streak, 10) * 0.1)).toFixed(1)}x
              </div>
            </div>
          </div>
          {(isCustomDifficulty(difficulty) || currentQuestionMetadata?.customDifficultyMultiplier) && (
            <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-400/20">
              <p className="text-blue-300 text-sm text-center">
                🎨 Custom difficulty: {
                  currentQuestionMetadata?.actualDifficulty || 
                  (isCustomDifficulty(difficulty) ? difficulty.substring(7) : 'intelligent analysis')
                }
                {(() => {
                  const multiplier = currentQuestionMetadata?.customDifficultyMultiplier || 
                    (isCustomDifficulty(difficulty) ? 
                      calculateCustomDifficultyMultiplier(difficulty.substring(7)) : 
                      null);
                  return multiplier ? ` (${multiplier.toFixed(1)}x score multiplier)` : '';
                })()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Topics */}
        <div className="glass-morphism rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">📚 Top Topics</h4>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-sm">
              {Object.keys(topicsPlayed).length}
            </span>
          </div>
          {topTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTopics.map(({ topic, count }) => (
                <span key={topic} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-400/30">
                  {topic}: {count} time{count !== 1 ? 's' : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-white/60">No topics played yet</p>
          )}
        </div>

        {/* Success Rates by Difficulty */}
        <div className="glass-morphism rounded-lg p-6">
          <h4 className="text-white font-semibold mb-4">🎯 Success Rates by Difficulty</h4>
          {Object.keys(difficultyRates).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(difficultyRates)
                .sort(([,a], [,b]) => b - a)
                .map(([diff, rate]) => (
                <div key={diff} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      diff === 'easy' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                      diff === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                      diff === 'hard' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    }`}>
                      {getDifficultyDisplayName(diff)}
                    </span>
                    <span className="text-white/80 text-sm">
                      {difficultyStats[diff]?.correct || 0}/{difficultyStats[diff]?.total || 0}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        diff === 'easy' ? 'bg-green-500' :
                        diff === 'medium' ? 'bg-yellow-500' :
                        diff === 'hard' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-white/70 text-sm">
                    {rate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60">No difficulty stats yet</p>
          )}
        </div>
      </div>

      {/* Custom Difficulty Stats */}
      {customDifficultyStats && (
        <div className="glass-morphism rounded-lg p-6">
          <h4 className="text-white font-semibold mb-4">🎨 Custom Difficulty Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{customDifficultyStats.total}</div>
              <div className="text-white/70 text-sm">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{customDifficultyStats.correct}</div>
              <div className="text-white/70 text-sm">Correct</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-3xl font-bold text-yellow-400">{customDifficultyStats.rate.toFixed(1)}%</div>
              <div className="text-white/70 text-sm">Success Rate</div>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-4 text-center">
            💡 Custom difficulties let you challenge yourself with specific knowledge areas
          </p>
        </div>
      )}

      {/* Encouragement Messages */}
      {stats.percentage >= 80 && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 text-center">
          <div className="text-green-300 font-semibold">
            🎉 Excellent work! You're doing great with a {stats.percentage.toFixed(1)}% success rate!
          </div>
        </div>
      )}
      {stats.percentage >= 60 && stats.percentage < 80 && (
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-center">
          <div className="text-blue-300 font-semibold">
            👍 Good job! Keep it up! Try some custom difficulty levels to challenge yourself more.
          </div>
        </div>
      )}
      {stats.percentage < 60 && stats.percentage > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 text-center">
          <div className="text-yellow-300 font-semibold">
            💪 Keep trying! Consider starting with easier topics or custom difficulty descriptions that match your knowledge level.
          </div>
        </div>
      )}
    </div>
    </FloatingCard>
  );
}