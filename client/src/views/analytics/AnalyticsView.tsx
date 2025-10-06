import { clientLogger as logger, CompleteUserAnalytics } from '@shared';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { Icon } from '../../components/icons';
import { Button } from '../../components/ui';
import { USER_DEFAULT_VALUES } from '../../constants';
import { useDifficultyStats, usePopularTopics, useUserAnalytics } from '../../hooks/api';
import { useAnalyticsExport, useRealTimeAnalytics } from '../../hooks/api/useAnalyticsDashboard';

/**
 * Analytics Dashboard View Component
 *
 * Displays comprehensive user analytics including performance metrics,
 * game statistics, and comparison data with visual charts and real-time updates.
 *
 * @returns JSX element containing the analytics dashboard
 */
export function AnalyticsView() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useUserAnalytics();
  const { isLoading: difficultyLoading } = useDifficultyStats();
  const { isLoading: topicsLoading } = usePopularTopics();
  const { data: realTimeAnalytics } = useRealTimeAnalytics();
  const { refetch: exportAnalytics } = useAnalyticsExport('json');

  useEffect(() => {
    logger.info('Analytics view loaded');
  }, [timeFilter]);

  if (analyticsLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 rounded w-1/3 mb-6'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='h-32 bg-gray-300 rounded-lg'></div>
              ))}
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='h-64 bg-gray-300 rounded-lg'></div>
              <div className='h-64 bg-gray-300 rounded-lg'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
            <h2 className='text-xl font-bold mb-2'>Error loading data</h2>
            <p>We encountered a problem loading your statistics. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const defaultAnalytics: CompleteUserAnalytics = {
    basic: {
      userId: '',
      username: '',
      ...USER_DEFAULT_VALUES,
      created_at: new Date(),
      accountAge: 0,
    },
    game: {
      totalGames: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      successRate: 0,
      averageTimePerQuestion: 0,
      topicsPlayed: {},
      difficultyBreakdown: {},
      recentActivity: [],
      totalPlayTime: 0,
    },
    performance: {
      lastPlayed: new Date(),
      streakDays: 0,
      bestStreak: 0,
      improvementRate: 0,
      weakestTopic: '',
      strongestTopic: '',
    },
    ranking: {
      rank: 0,
      score: 0,
      percentile: 0,
      totalUsers: 0,
    },
  };

  const analyticsData = analytics ?? defaultAnalytics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6'
    >
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Analytics Dashboard</h1>
          <div className='flex space-x-2 rtl:space-x-reverse'>
            {(['week', 'month', 'all'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filter === 'week' ? 'Week' : filter === 'month' ? 'Month' : 'All time'}
              </button>
            ))}
            <Button
              variant='secondary'
              onClick={() => exportAnalytics()}
              className='ml-4 bg-green-500 hover:bg-green-600 text-white'
            >
              Export data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <MetricCard
            title='Overall ranking'
            value={analyticsData.ranking.rank.toString()}
            subtitle={`Out of ${analyticsData.ranking.totalUsers} users`}
            icon='trophy'
            color='yellow'
            trend={analyticsData.ranking.percentile > 50 ? 'up' : 'down'}
          />
          <MetricCard
            title='Total points'
            value={analyticsData.basic.totalPoints.toLocaleString()}
            subtitle={`${analyticsData.basic.credits} base points + ${analyticsData.basic.purchasedPoints} purchases`}
            icon='star'
            color='blue'
            trend='up'
          />
          <MetricCard
            title='Games played'
            value={analyticsData.game.totalGames.toString()}
            subtitle='Total games'
            icon='gamepad'
            color='green'
            trend='up'
          />
          <MetricCard
            title='Success rate'
            value={`${analyticsData.game.successRate.toFixed(1)}%`}
            subtitle='Average correct answers'
            icon='target'
            color='purple'
            trend={analyticsData.performance.improvementRate > 0 ? 'up' : 'down'}
          />
        </div>

        {/* Performance Insights */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Performance Analysis</h3>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Consistency</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.performance.consistencyScore ?? 0}%
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Learning curve</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.performance.learningCurve ?? 0}%
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Average game time</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.performance.averageGameTime ?? 0} min
                </span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Topics</h3>
            <div className='space-y-3'>
              {analyticsData.performance.strongestTopic && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Strongest</span>
                  <span className='font-semibold text-green-600'>
                    {analyticsData.performance.strongestTopic}
                  </span>
                </div>
              )}
              {analyticsData.performance.weakestTopic && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>To improve</span>
                  <span className='font-semibold text-red-600'>
                    {analyticsData.performance.weakestTopic}
                  </span>
                </div>
              )}
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Topics played</span>
                <span className='font-semibold text-gray-900'>
                  {Object.keys(analyticsData.game.topicsPlayed).length}
                </span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Statistics</h3>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Correct questions</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.game.correctAnswers}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Total play time</span>
                <span className='font-semibold text-gray-900'>
                  {Math.round(analyticsData.game.totalPlayTime / 60)} min
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Account age</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.basic.accountAge} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Stats */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Topics Performance */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Performance by topic</h3>
            {topicsLoading ? (
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-300 rounded w-3/4 mb-2'></div>
                <div className='h-4 bg-gray-300 rounded w-1/2 mb-2'></div>
                <div className='h-4 bg-gray-300 rounded w-2/3'></div>
              </div>
            ) : (
              <TopicsChart topicsPlayed={analyticsData.game.topicsPlayed} />
            )}
          </div>

          {/* Difficulty Breakdown */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Breakdown by difficulty level</h3>
            {difficultyLoading ? (
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-300 rounded w-3/4 mb-2'></div>
                <div className='h-4 bg-gray-300 rounded w-1/2 mb-2'></div>
                <div className='h-4 bg-gray-300 rounded w-2/3'></div>
              </div>
            ) : (
              <DifficultyChart difficultyBreakdown={analyticsData.game.difficultyBreakdown} />
            )}
          </div>
        </div>

        {/* Real-time Analytics */}
        {realTimeAnalytics && (
          <div className='bg-white rounded-lg shadow-lg p-6 mb-8'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Real-time data</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {realTimeAnalytics.game?.totalGames ?? 0}
                </div>
                <div className='text-sm text-green-700'>Games today</div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  {realTimeAnalytics.game?.correctAnswers ?? 0}
                </div>
                <div className='text-sm text-blue-700'>Correct answers</div>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>
                  {realTimeAnalytics.performance?.streakDays ?? 0}
                </div>
                <div className='text-sm text-purple-700'>Day streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Section */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-8'>
          <h3 className='text-xl font-bold text-gray-900 mb-4'>Comparison with general average</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <ComparisonCard
              title='Success rate'
              userValue={analyticsData.game.successRate}
              averageValue={75}
              unit='%'
              higherIsBetter={true}
            />
            <ComparisonCard
              title='Games played'
              userValue={analyticsData.game.totalGames}
              averageValue={25}
              unit='games'
              higherIsBetter={true}
            />
            <ComparisonCard
              title='Average game time'
              userValue={analyticsData.performance.averageGameTime ?? 0}
              averageValue={8}
              unit='min'
              higherIsBetter={false}
            />
            <ComparisonCard
              title='Consistency'
              userValue={analyticsData.performance.consistencyScore ?? 0}
              averageValue={65}
              unit='%'
              higherIsBetter={true}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-4'>Recent activity</h3>
          <RecentActivity analyticsData={analyticsData} />
        </div>
      </div>
    </motion.div>
  );
}

import { ComparisonCardProps, MetricCardProps } from '../../types';

/**
 * Metric Card Component
 *
 * Displays a single metric with title, value, subtitle, icon, and trend indicator.
 * Used in the analytics dashboard to show key performance indicators.
 *
 * @param title - The metric title
 * @param value - The metric value to display
 * @param subtitle - Additional context text
 * @param icon - Icon name to display
 * @param color - Color theme for the card
 * @param trend - Trend direction (up, down, neutral)
 * @returns JSX element containing the metric card
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend = 'neutral',
}: MetricCardProps & { icon: string }) {
  const colorClasses = {
    yellow: 'from-yellow-400 to-orange-500',
    blue: 'from-blue-400 to-indigo-600',
    green: 'from-green-400 to-emerald-600',
    purple: 'from-purple-400 to-pink-600',
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-400',
  };

  const trendIcon = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className='bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500'
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center justify-between mb-1'>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            {trend !== 'neutral' && (
              <span className={`text-sm font-medium ${trendClasses[trend]}`}>
                {trendIcon[trend]}
              </span>
            )}
          </div>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
          <p className='text-xs text-gray-500'>{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]} text-white`}>
          <Icon name={icon} size='xl' color='white' />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Comparison Card Component
 *
 * Displays a comparison between user value and average value with visual indicators.
 * Shows percentage difference and trend direction for performance metrics.
 *
 * @param title - The metric title
 * @param userValue - User's value for the metric
 * @param averageValue - Average value for comparison
 * @param unit - Unit of measurement
 * @param higherIsBetter - Whether higher values are better
 * @returns JSX element containing the comparison card
 */
function ComparisonCard({
  title,
  userValue,
  averageValue,
  unit,
  higherIsBetter,
}: ComparisonCardProps) {
  const difference = userValue - averageValue;
  const percentageDiff = averageValue > 0 ? (difference / averageValue) * 100 : 0;

  const isBetter = higherIsBetter ? difference > 0 : difference < 0;
  const isWorse = higherIsBetter ? difference < 0 : difference > 0;

  const getStatusColor = () => {
    if (isBetter) return 'text-green-600';
    if (isWorse) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (isBetter) return '↗';
    if (isWorse) return '↘';
    return '→';
  };

  return (
    <div className='bg-gray-50 rounded-lg p-4'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-sm font-medium text-gray-700'>{title}</h4>
        <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusIcon()}</span>
      </div>
      <div className='space-y-1'>
        <div className='flex justify-between items-center'>
          <span className='text-xs text-gray-500'>Yours:</span>
          <span className='text-sm font-semibold text-gray-900'>
            {userValue.toFixed(1)}
            {unit}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-xs text-gray-500'>Average:</span>
          <span className='text-sm text-gray-600'>
            {averageValue.toFixed(1)}
            {unit}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-xs text-gray-500'>Difference:</span>
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {Math.abs(percentageDiff).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Topics Chart Component
 *
 * Displays a horizontal bar chart showing the most played topics.
 * Shows top 5 topics with animated progress bars.
 *
 * @param topicsPlayed - Object mapping topic names to play counts
 * @returns JSX element containing the topics chart
 */
function TopicsChart({ topicsPlayed }: { topicsPlayed: Record<string, number> }) {
  const topics = Object.entries(topicsPlayed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topics.length === 0) {
    return (
      <div className='text-center text-gray-500 py-8'>
        <p>You haven't played any games yet</p>
      </div>
    );
  }

  const maxValue = Math.max(...topics.map(([, count]) => count));

  return (
    <div className='space-y-4'>
      {topics.map(([topic, count], index) => (
        <div key={topic} className='flex items-center space-x-3 rtl:space-x-reverse'>
          <div className='w-16 text-sm text-gray-600'>{topic}</div>
          <div className='flex-1'>
            <div className='bg-gray-200 rounded-full h-3'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxValue) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className='bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full'
              />
            </div>
          </div>
          <div className='w-8 text-sm text-gray-600'>{count}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Difficulty Chart Component
 *
 * Displays success rates by difficulty level with color-coded progress bars.
 * Shows correct/total ratios and percentage success rates.
 *
 * @param difficultyBreakdown - Object mapping difficulty levels to correct/total stats
 * @returns JSX element containing the difficulty chart
 */
function DifficultyChart({
  difficultyBreakdown,
}: {
  difficultyBreakdown: Record<string, { correct: number; total: number }>;
}) {
  const difficulties = Object.entries(difficultyBreakdown);

  if (difficulties.length === 0) {
    return (
      <div className='text-center text-gray-500 py-8'>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {difficulties.map(([difficulty, stats]) => {
        const successRate = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        return (
          <div
            key={difficulty}
            className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
          >
            <div className='flex items-center space-x-3 rtl:space-x-reverse'>
              <div className='w-16 text-sm font-medium text-gray-700'>{difficulty}</div>
              <div className='flex-1'>
                <div className='bg-gray-200 rounded-full h-2'>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${successRate}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-2 rounded-full ${
                      successRate >= 80
                        ? 'bg-green-500'
                        : successRate >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className='text-sm text-gray-600'>
              {successRate.toFixed(1)}% ({stats.correct}/{stats.total})
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Recent Activity Component
 *
 * Displays recent user activity including last game, streak, and performance metrics.
 * Shows additional performance indicators when available.
 *
 * @param analyticsData - Complete user analytics data
 * @returns JSX element containing the recent activity section
 */
function RecentActivity({ analyticsData }: { analyticsData: CompleteUserAnalytics }) {
  const lastPlayedDate = new Date(analyticsData.performance.lastPlayed);
  const daysSinceLastPlayed = Math.floor(
    (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastActiveText = daysSinceLastPlayed === 0 ? 'Today' : `${daysSinceLastPlayed} days ago`;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
        <div>
          <p className='font-medium text-gray-900'>Last game</p>
          <p className='text-sm text-gray-600'>{lastActiveText}</p>
        </div>
        <div className='text-green-500'>
          <Icon name='checkcircle' size='md' color='success' />
        </div>
      </div>

      <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
        <div>
          <p className='font-medium text-gray-900'>Day streak</p>
          <p className='text-sm text-gray-600'>{analyticsData.performance.streakDays} days</p>
        </div>
        <div className='text-blue-500'>
          <Icon name='calendar' size='md' color='info' />
        </div>
      </div>

      <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
        <div>
          <p className='font-medium text-gray-900'>Improvement</p>
          <p className='text-sm text-gray-600'>
            {analyticsData.performance.improvementRate.toFixed(1)}%
          </p>
        </div>
        <div className='text-purple-500'>
          <Icon name='zap' size='md' color='accent' />
        </div>
      </div>

      {/* Additional Performance Metrics */}
      {analyticsData.performance.averageGameTime && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <p className='font-medium text-gray-900'>Average game time</p>
            <p className='text-sm text-gray-600'>{analyticsData.performance.averageGameTime} min</p>
          </div>
          <div className='text-blue-500'>
            <Icon name='clock' size='md' color='info' />
          </div>
        </div>
      )}

      {analyticsData.performance.consistencyScore && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <p className='font-medium text-gray-900'>Consistency</p>
            <p className='text-sm text-gray-600'>{analyticsData.performance.consistencyScore}%</p>
          </div>
          <div className='text-green-500'>
            <Icon name='list' size='md' color='success' />
          </div>
        </div>
      )}

      {analyticsData.performance.learningCurve && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <p className='font-medium text-gray-900'>Learning curve</p>
            <p className='text-sm text-gray-600'>{analyticsData.performance.learningCurve}%</p>
          </div>
          <div className='text-orange-500'>
            <Icon name='barchart' size='md' color='warning' />
          </div>
        </div>
      )}
    </div>
  );
}
