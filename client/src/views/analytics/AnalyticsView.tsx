import { clientLogger, CompleteUserAnalytics } from '@shared';
import { motion } from 'framer-motion';
import { useEffect,useState } from 'react';

import { Button } from '../../components/ui';
import { USER_DEFAULT_VALUES } from '../../constants';
import { useDifficultyStats, usePopularTopics,useUserAnalytics } from '../../hooks/api';
import { useAnalyticsExport,useRealTimeAnalytics } from '../../hooks/api/useAnalyticsDashboard';

export function AnalyticsView() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');

  // Use analytics hooks
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
    clientLogger.info('Analytics view loaded');
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
            <h2 className='text-xl font-bold mb-2'>שגיאה בטעינת הנתונים</h2>
            <p>נתקלנו בבעיה בטעינת הסטטיסטיקות שלך. אנא נסה שוב מאוחר יותר.</p>
          </div>
        </div>
      </div>
    );
  }

  // Default analytics data
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

  const analyticsData = analytics || defaultAnalytics;

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
          <h1 className='text-3xl font-bold text-gray-900'>דשבורד אנליטיקה</h1>
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
                {filter === 'week' ? 'שבוע' : filter === 'month' ? 'חודש' : 'כל הזמן'}
              </button>
            ))}
            <Button
              variant='secondary'
              onClick={() => exportAnalytics()}
              className='ml-4 bg-green-500 hover:bg-green-600 text-white'
            >
              ייצא נתונים
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <MetricCard
            title='דירוג כללי'
            value={analyticsData.ranking.rank.toString()}
            subtitle={`מתוך ${analyticsData.ranking.totalUsers} משתמשים`}
            icon='🏆'
            color='yellow'
            trend={analyticsData.ranking.percentile > 50 ? 'up' : 'down'}
          />
          <MetricCard
            title='נקודות כולל'
            value={analyticsData.basic.totalPoints.toLocaleString()}
            subtitle={`${analyticsData.basic.credits} נקודות בסיס + ${analyticsData.basic.purchasedPoints} רכישות`}
            icon='💎'
            color='blue'
            trend='up'
          />
          <MetricCard
            title='משחקים שוחקו'
            value={analyticsData.game.totalGames.toString()}
            subtitle='משחקים בסך הכל'
            icon='🎮'
            color='green'
            trend='up'
          />
          <MetricCard
            title='אחוז הצלחה'
            value={`${analyticsData.game.successRate.toFixed(1)}%`}
            subtitle='ממוצע תשובות נכונות'
            icon='🎯'
            color='purple'
            trend={analyticsData.performance.improvementRate > 0 ? 'up' : 'down'}
          />
        </div>

        {/* Performance Insights */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>ניתוח ביצועים</h3>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>עקביות</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.performance.consistencyScore || 0}%
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>עקומת למידה</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.performance.learningCurve || 0}%
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>זמן משחק ממוצע</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.performance.averageGameTime || 0} דק'
                </span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>נושאים</h3>
            <div className='space-y-3'>
              {analyticsData.performance.strongestTopic && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>הכי חזק</span>
                  <span className='font-semibold text-green-600'>
                    {analyticsData.performance.strongestTopic}
                  </span>
                </div>
              )}
              {analyticsData.performance.weakestTopic && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>לשפר</span>
                  <span className='font-semibold text-red-600'>
                    {analyticsData.performance.weakestTopic}
                  </span>
                </div>
              )}
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>נושאים שוחקו</span>
                <span className='font-semibold text-gray-900'>
                  {Object.keys(analyticsData.game.topicsPlayed).length}
                </span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>סטטיסטיקות</h3>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>שאלות נכונות</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.game.correctAnswers}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>זמן משחק כולל</span>
                <span className='font-semibold text-gray-900'>
                  {Math.round(analyticsData.game.totalPlayTime / 60)} דק'
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>גיל חשבון</span>
                <span className='font-semibold text-gray-900'>
                  {analyticsData.basic.accountAge} ימים
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Stats */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Topics Performance */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>ביצועים לפי נושא</h3>
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
            <h3 className='text-xl font-bold text-gray-900 mb-4'>פירוט לפי רמת קושי</h3>
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
            <h3 className='text-xl font-bold text-gray-900 mb-4'>נתונים בזמן אמת</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {realTimeAnalytics.game?.totalGames || 0}
                </div>
                <div className='text-sm text-green-700'>משחקים היום</div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  {realTimeAnalytics.game?.correctAnswers || 0}
                </div>
                <div className='text-sm text-blue-700'>תשובות נכונות</div>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>
                  {realTimeAnalytics.performance?.streakDays || 0}
                </div>
                <div className='text-sm text-purple-700'>רצף ימים</div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Section */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-8'>
          <h3 className='text-xl font-bold text-gray-900 mb-4'>השוואה עם ממוצע כללי</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <ComparisonCard
              title='אחוז הצלחה'
              userValue={analyticsData.game.successRate}
              averageValue={75} // This would come from server
              unit='%'
              higherIsBetter={true}
            />
            <ComparisonCard
              title='משחקים שוחקו'
              userValue={analyticsData.game.totalGames}
              averageValue={25} // This would come from server
              unit='משחקים'
              higherIsBetter={true}
            />
            <ComparisonCard
              title='זמן משחק ממוצע'
              userValue={analyticsData.performance.averageGameTime || 0}
              averageValue={8} // This would come from server
              unit='דקות'
              higherIsBetter={false}
            />
            <ComparisonCard
              title='עקביות'
              userValue={analyticsData.performance.consistencyScore || 0}
              averageValue={65} // This would come from server
              unit='%'
              higherIsBetter={true}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-4'>פעילות אחרונה</h3>
          <RecentActivity analyticsData={analyticsData} />
        </div>
      </div>
    </motion.div>
  );
}

// Metric Card Component
import { MetricCardProps } from '../../types';

function MetricCard({ title, value, subtitle, icon, color, trend = 'neutral' }: MetricCardProps) {
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
        <div
          className={`text-3xl p-3 rounded-full bg-gradient-to-r ${colorClasses[color]} text-white`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Comparison Card Component
import { ComparisonCardProps } from '../../types';

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
          <span className='text-xs text-gray-500'>שלך:</span>
          <span className='text-sm font-semibold text-gray-900'>
            {userValue.toFixed(1)}
            {unit}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-xs text-gray-500'>ממוצע:</span>
          <span className='text-sm text-gray-600'>
            {averageValue.toFixed(1)}
            {unit}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-xs text-gray-500'>הפרש:</span>
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {Math.abs(percentageDiff).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Topics Chart Component
function TopicsChart({ topicsPlayed }: { topicsPlayed: Record<string, number> }) {
  const topics = Object.entries(topicsPlayed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topics.length === 0) {
    return (
      <div className='text-center text-gray-500 py-8'>
        <p>עדיין לא שיחקת במשחקים</p>
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

// Difficulty Chart Component
function DifficultyChart({
  difficultyBreakdown,
}: {
  difficultyBreakdown: Record<string, { correct: number; total: number }>;
}) {
  const difficulties = Object.entries(difficultyBreakdown);

  if (difficulties.length === 0) {
    return (
      <div className='text-center text-gray-500 py-8'>
        <p>אין נתונים זמינים</p>
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

// Recent Activity Component
function RecentActivity({ analyticsData }: { analyticsData: CompleteUserAnalytics }) {
  const lastPlayedDate = new Date(analyticsData.performance.lastPlayed);
  const daysSinceLastPlayed = Math.floor(
    (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastActiveText = daysSinceLastPlayed === 0 ? 'היום' : `לפני ${daysSinceLastPlayed} ימים`;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
        <div>
          <p className='font-medium text-gray-900'>משחק אחרון</p>
          <p className='text-sm text-gray-600'>{lastActiveText}</p>
        </div>
        <div className='text-green-500'>
          <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </div>

      <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
        <div>
          <p className='font-medium text-gray-900'>רצף ימים</p>
          <p className='text-sm text-gray-600'>{analyticsData.performance.streakDays} ימים</p>
        </div>
        <div className='text-blue-500'>
          <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </div>

      <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
        <div>
          <p className='font-medium text-gray-900'>שיפור</p>
          <p className='text-sm text-gray-600'>
            {analyticsData.performance.improvementRate.toFixed(1)}%
          </p>
        </div>
        <div className='text-purple-500'>
          <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </div>

      {/* Additional Performance Metrics */}
      {analyticsData.performance.averageGameTime && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <p className='font-medium text-gray-900'>זמן משחק ממוצע</p>
            <p className='text-sm text-gray-600'>
              {analyticsData.performance.averageGameTime} דקות
            </p>
          </div>
          <div className='text-blue-500'>
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        </div>
      )}

      {analyticsData.performance.consistencyScore && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <p className='font-medium text-gray-900'>עקביות</p>
            <p className='text-sm text-gray-600'>{analyticsData.performance.consistencyScore}%</p>
          </div>
          <div className='text-green-500'>
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        </div>
      )}

      {analyticsData.performance.learningCurve && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <p className='font-medium text-gray-900'>עקומת למידה</p>
            <p className='text-sm text-gray-600'>{analyticsData.performance.learningCurve}%</p>
          </div>
          <div className='text-orange-500'>
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
