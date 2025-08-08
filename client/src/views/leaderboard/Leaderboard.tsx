import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { gameHistoryService } from '../../shared/services';
import { LeaderboardEntry } from '../../shared/types';
import { cn } from '../../shared/utils/cn';

export default function Leaderboard() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; totalScore: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const [leaderboardData, userRankData] = await Promise.all([
          gameHistoryService.getGlobalLeaderboard(100),
          isAuthenticated ? gameHistoryService.getUserRank() : null,
        ]);
        
        setLeaderboard(leaderboardData);
        setUserRank(userRankData);
      } catch (error) {
        setError('Failed to load leaderboard');
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [isAuthenticated]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism p-6 rounded-lg"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🏆 Global Leaderboard</h1>
            <p className="text-slate-300">See how you rank against other players</p>
          </div>

          {/* User Rank Card */}
          {isAuthenticated && userRank && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 mb-6"
            >
              <div className="text-center">
                <h3 className="text-white font-semibold mb-2">Your Rank</h3>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">#{userRank.rank}</div>
                    <div className="text-blue-300 text-sm">Global Rank</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{userRank.totalScore}</div>
                    <div className="text-blue-300 text-sm">Total Score</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-white mt-4">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-300 text-lg">No players on the leaderboard yet</p>
              <p className="text-slate-400">Be the first to play and claim the top spot!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    entry.userId === user?.id
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800/70",
                    index < 3 && "ring-1 ring-yellow-400/30"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn("text-xl font-bold w-8 text-center", getRankColor(entry.rank || index + 1))}>
                      {getRankIcon(entry.rank || index + 1) || `#${entry.rank || index + 1}`}
                    </div>
                    
                    <div>
                      <div className={cn(
                        "font-semibold",
                        entry.userId === user?.id ? "text-blue-300" : "text-white"
                      )}>
                        {entry.username}
                        {entry.userId === user?.id && " (You)"}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {entry.totalGames} games played
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-bold text-lg">
                      {entry.totalScore.toLocaleString()} pts
                    </div>
                    <div className="text-slate-400 text-sm">
                      {entry.averageScore.toFixed(1)} avg
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!isAuthenticated && (
            <div className="text-center mt-8 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-slate-300 mb-4">Sign in to see your rank and compete with other players!</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Sign In with Google
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
